import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { createViewer, getOrSeed, logEvent } from '@/lib/server/db';
import { fail, handle, ok, parseJson, slugSchema } from '@/lib/server/http';
import { person } from '@/lib/engine';

const Body = z.object({
  slug: slugSchema,
  personId: z.string().min(1).max(40),
  phone: z.string().max(32).optional().nullable(),
  optIn: z.boolean().optional(),
});

/** Light E.164 normalisation; Lithuanian local numbers (86…) become +3706…. */
function normPhone(raw: string): string | null {
  let s = raw.replace(/[\s()-]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^86\d{7}$/.test(s)) s = '+370' + s.slice(1);
  if (/^6\d{7}$/.test(s)) s = '+370' + s;
  return /^\+\d{8,15}$/.test(s) ? s : null;
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const { slug, personId, phone, optIn } = parsed.data;
    const row = await getOrSeed(slug);
    if (!row) return fail(404, 'not_found');
    const who = row.data.people.find((x) => x.id === personId && x.role !== 'producer');
    if (!who) return fail(400, 'unknown_person');
    let normalized: string | null = null;
    if (optIn && phone && phone.trim()) {
      normalized = normPhone(phone);
      if (!normalized) return fail(400, 'invalid_phone');
    }
    const token = randomBytes(6).toString('base64url');
    await createViewer(row.id, personId, token, normalized);
    await logEvent(row.id, 'join', { text: `${person(row.data, personId)?.name} joined${normalized ? ' · texts on' : ''}` });
    return ok({ token });
  });
}
