import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { CreativeBrief } from '@/lib/types';
import { DEMO_BRIEF } from '@/data/demo';
import { cacheExtraction, cachedExtraction } from '@/lib/server/db';

const MODEL = 'claude-sonnet-5-5';
const TIMEOUT_MS = 25000;

const BriefSchema = z.object({
  references: z.array(z.object({
    index: z.number().int().describe('1-based number of the reference image'),
    usedFor: z.enum(['model look', 'setting', 'styling', 'light', 'whole mood']).describe('what the producer most likely added this image for'),
    note: z.string().describe('what to take from it, max 10 words, e.g. "short dark hair, bare face, strong jaw"'),
  })).describe('one entry per reference image, in order'),
  garment: z.string().describe('the main garment or product, e.g. "Field jacket"'),
  summary: z.string().describe('one or two sentences on the visual direction'),
  aesthetic: z.array(z.string()).describe('3 to 5 short words, e.g. Editorial, Utilitarian'),
  palette: z.array(z.string()).describe('4 to 6 colour names seen in the reference'),
  paletteHex: z.array(z.string()).describe('the same colours as #rrggbb, same order'),
  lighting: z.string(),
  setting: z.enum(['studio', 'outdoor', 'urban', 'interior', 'mixed']),
  settingNote: z.string(),
  styling: z.string(),
  casting: z.string().describe('who to cast, e.g. "Two models, editorial, natural movement"'),
  shotList: z.array(z.string()).describe('4 to 6 shots, include one motion shot'),
  needs: z.object({
    model: z.string().describe('the model look to cast, as short search words: e.g. "androgynous, short hair, editorial, film look"'),
    photographer: z.string().describe('the photographer style to look for: e.g. "35mm film, natural light, street"'),
    location: z.string().describe('the kind of location: e.g. "raw concrete, open sky, industrial"'),
  }),
});

const SYSTEM =
  'You are a fashion producer reading a moodboard. The producer dropped several references, and each one is there for a reason: ' +
  'close-ups or portraits of a person are usually for the MODEL LOOK (face, hair, body, attitude), not for the setting; ' +
  'a campaign image the producer likes is usually for the SETTING, background and light; flat-lays or garment shots are for STYLING. ' +
  'First decide what each reference is for. Then write ONE brief for ONE shoot that combines them: the model look from the model references, the setting and light from the setting reference, and so on. ' +
  'Never describe the references as separate shoots or list two settings because two images have different backgrounds. A plain studio backdrop behind a model portrait is not a setting choice. ' +
  'Pick a single setting value unless the producer asked for more. Describe only what is visible or clearly implied. Do not identify real people or brands. ' +
  'Keep every field short and concrete, in the voice of a producer writing a call sheet.';

export type BriefInput = { images: { bytes: Buffer; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' }[]; title: string; brand: string; notes?: string };
export type BriefResult = { brief: CreativeBrief; via: 'ai' | 'cache' | 'demo'; ms: number; error?: string };

export async function readBrief(input: BriefInput): Promise<BriefResult> {
  const started = Date.now();
  const h = createHash('sha256');
  h.update('brief:v3');
  input.images.forEach((i) => h.update(i.bytes));
  h.update(input.notes ?? '');
  const sha = h.digest('hex');
  const withMeta = (b: Omit<CreativeBrief, 'title' | 'brand' | 'source'>, source: CreativeBrief['source']): CreativeBrief => ({ ...b, title: input.title, brand: input.brand, source });

  const cached = (await cachedExtraction(sha).catch(() => null)) as Omit<CreativeBrief, 'title' | 'brand' | 'source'> | null;
  if (cached) return { brief: withMeta(cached, 'cache'), via: 'cache', ms: Date.now() - started };

  const demo = () => {
    const { title: _t, brand: _b, source: _s, ...rest } = DEMO_BRIEF;
    return withMeta(rest, 'demo');
  };
  if (!input.images.length) return { brief: demo(), via: 'demo', ms: Date.now() - started };

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
    const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 });
    const content: Anthropic.ContentBlockParam[] = input.images.flatMap((i, n): Anthropic.ContentBlockParam[] => [
      { type: 'text', text: `Reference ${n + 1}:` },
      { type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.bytes.toString('base64') } },
    ]);
    content.push({ type: 'text', text: `Campaign: ${input.title} for ${input.brand}.${input.notes ? ` Notes from the producer: ${input.notes}` : ''} Decide what each reference is for, then write one brief for one shoot.` });
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(BriefSchema) },
      messages: [{ role: 'user', content }],
    });
    if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error(`no structured output (${res.stop_reason})`);
    const out = res.parsed_output;
    await cacheExtraction(sha, out).catch(() => {});
    return { brief: withMeta(out, 'ai'), via: 'ai', ms: Date.now() - started };
  } catch (e) {
    return { brief: demo(), via: 'demo', ms: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}
