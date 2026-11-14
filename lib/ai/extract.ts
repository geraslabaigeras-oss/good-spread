import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { Extraction } from '@/lib/engine/updates';
import { cacheExtraction, cachedExtraction } from '@/lib/server/db';

const MODEL = 'claude-sonnet-5-5';
const TIMEOUT_MS = 8000;

// The brief's `record_update` schema. Sonnet 5.5 rejects forced tool_choice, so the same
// schema is enforced through structured outputs instead (see NOTES.md).
const RecordUpdate = z.object({
  type: z.enum(['flight', 'delay', 'booking', 'quote', 'budget', 'unknown']),
  personName: z.string().nullable(),
  flight: z
    .object({
      number: z.string().nullable(),
      from: z.string().nullable(),
      to: z.string().nullable(),
      departTime: z.string().nullable().describe('HH:MM local'),
      arriveTime: z.string().nullable().describe('HH:MM local'),
      date: z.string().nullable().describe('YYYY-MM-DD'),
    })
    .nullable(),
  delay: z
    .object({
      newEtaTime: z.string().nullable().describe('HH:MM local'),
      reason: z.string().nullable(),
    })
    .nullable(),
  budget: z
    .object({
      newCap: z.number().nullable().describe('new total budget in EUR, only if stated'),
      note: z.string().nullable(),
    })
    .nullable(),
  summary: z.string().describe('one short line of what was read'),
  confidence: z.number(),
});

const SYSTEM =
  'Extract only facts present in the input. If a value is not present, return null. Never guess times. ' +
  'You read production inbox items for a fashion photoshoot (flight changes, delay messages, agency confirmations, studio quotes). ' +
  'type: "flight" for a flight booking or change with an arrival time; "delay" for a message saying someone is late or landing later; ' +
  '"booking" for a talent/agency booking confirmation; "quote" for a price quote; "budget" when the client changes the total budget (newCap in EUR); otherwise "unknown". ' +
  'personName: the passenger or person the item is about, as written (first name is fine). ' +
  'Times are local 24h HH:MM. summary: one short line, e.g. "Ieva, DA 645, lands 10:45".';

export type InboxInput =
  | { kind: 'pdf'; name: string; bytes: Buffer }
  | { kind: 'image'; name: string; bytes: Buffer; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' }
  | { kind: 'text'; name: string; text: string };

export type ExtractResult = { sha256: string; extraction: Extraction; via: 'ai' | 'cache' | 'rule' | 'none'; error?: string };

export function sha256Of(input: InboxInput): string {
  const h = createHash('sha256');
  h.update(input.kind);
  h.update(input.kind === 'text' ? input.text.trim() : input.bytes);
  return h.digest('hex');
}

const UNKNOWN: Extraction = { type: 'unknown', personName: null, summary: 'Could not read this item', confidence: 0 };

async function callClaude(input: InboxInput): Promise<Extraction> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
  const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 });
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.kind === 'pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.bytes.toString('base64') } });
  } else if (input.kind === 'image') {
    content.push({ type: 'image', source: { type: 'base64', media_type: input.mediaType, data: input.bytes.toString('base64') } });
  }
  content.push({
    type: 'text',
    text: input.kind === 'text' ? `Inbox message:\n\n${input.text}` : `Inbox file "${input.name}". Read it and record the update.`,
  });

  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { effort: 'low', format: zodOutputFormat(RecordUpdate) },
    messages: [{ role: 'user', content }],
  });
  if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error(`no structured output (${res.stop_reason})`);
  return res.parsed_output as Extraction;
}

/** Plain-code fallback for pasted text: "<name> ... 10:45" or "budget … €4,400". Only used when AI and cache both fail. */
function ruleExtract(text: string, names: string[]): Extraction | null {
  if (/budget|cap\b/i.test(text)) {
    const m = [...text.matchAll(/(?:€|eur\s*)?\s?(\d{1,3}(?:[,.\s]\d{3})+|\d{4,6})\s?(?:€|eur)?/gi)].pop();
    if (m) {
      const cap = Number(m[1].replace(/[,.\s]/g, ''));
      if (cap >= 500) return { type: 'budget', personName: null, budget: { newCap: cap, note: text.slice(0, 120) }, summary: `Budget now €${cap.toLocaleString('en-US')} (read by rule)`, confidence: 0.5 };
    }
  }
  const name = names.find((n) => new RegExp(`\\b${n}\\b`, 'i').test(text.normalize('NFD').replace(/[̀-ͯ]/g, '')));
  const times = [...text.matchAll(/\b([01]?\d|2[0-3])[:.](\d{2})\b/g)];
  if (!name || !times.length) return null;
  const t = times[times.length - 1];
  const hhmm = `${t[1].padStart(2, '0')}:${t[2]}`;
  const isFlight = /\b(land|lands|landing|arriv|flight)/i.test(text);
  return isFlight
    ? { type: 'flight', personName: name, flight: { arriveTime: hhmm }, summary: `${name} lands ${hhmm} (read by rule)`, confidence: 0.5 }
    : { type: 'delay', personName: name, delay: { newEtaTime: hhmm }, summary: `${name} new ETA ${hhmm} (read by rule)`, confidence: 0.5 };
}

/** Cache first (same bytes = same answer, instant), then Claude with an 8 s timeout, then rule/unknown. */
export async function extract(input: InboxInput, knownNames: string[]): Promise<ExtractResult> {
  const sha = sha256Of(input);
  const cached = (await cachedExtraction(sha).catch(() => null)) as Extraction | null;
  if (cached) return { sha256: sha, extraction: cached, via: 'cache' };
  try {
    const extraction = await callClaude(input);
    await cacheExtraction(sha, extraction).catch(() => {});
    return { sha256: sha, extraction, via: 'ai' };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    if (input.kind === 'text') {
      const r = ruleExtract(input.text, knownNames);
      if (r) return { sha256: sha, extraction: r, via: 'rule', error };
    }
    return { sha256: sha, extraction: UNKNOWN, via: 'none', error };
  }
}
