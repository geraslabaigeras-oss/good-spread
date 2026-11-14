import { z } from 'zod';
import { getProductionById, logEvent, viewerByToken } from '@/lib/server/db';
import { fail, handle, ok, parseJson, tokenSchema } from '@/lib/server/http';
import { applyFact } from '@/lib/server/actions';
import { lateUpdate, person } from '@/lib/engine';

const Body = z.object({ token: tokenSchema, minutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal('unavailable')]) });

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const v = await viewerByToken(parsed.data.token);
    if (!v) return fail(404, 'not_found');
    const row = await getProductionById(v.production_id);
    if (!row) return fail(404, 'not_found');
    if (!row.data.people.some((x) => x.id === v.person_id)) return fail(409, 'not_on_shoot');
    const name = person(row.data, v.person_id)?.name ?? v.person_id;
    const m = parsed.data.minutes;
    await logEvent(row.id, 'late', { text: m === 'unavailable' ? `${name} can’t make it` : `${name} running late +${m}`, personId: v.person_id });
    const u = lateUpdate(row.data, v.person_id, m);
    const r = await applyFact(row, u, { inboxId: `late-${Date.now()}`, source: `${name} (my day page)` });
    return ok({ conflicts: r.conflicts.length, pending: !!r.pending });
  });
}
