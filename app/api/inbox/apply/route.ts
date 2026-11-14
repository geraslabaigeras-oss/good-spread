import { z } from 'zod';
import { loadRoster } from '@/lib/server/roster';
import { getProduction, logEvent } from '@/lib/server/db';
import { fail, handle, ok, parseJson, slugSchema } from '@/lib/server/http';
import { applyFact, describeUpdate } from '@/lib/server/actions';
import { manualUpdate, parseHHMM, type Update } from '@/lib/engine';

const min = z.number().int().min(0).max(99999);
const UpdateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('travel'), personId: z.string().max(40), arriveMin: min, departMin: min.optional(), number: z.string().max(20).optional(), from: z.string().max(10).optional(), to: z.string().max(10).optional(), source: z.string().max(200) }),
  z.object({ kind: z.literal('late'), personId: z.string().max(40), readyMin: min, source: z.string().max(200) }),
  z.object({ kind: z.literal('log'), source: z.string().max(200), text: z.string().max(500) }),
  z.object({ kind: z.literal('cap'), cap: z.number().int().min(500).max(1000000), source: z.string().max(200) }),
]);

const Body = z.object({
  slug: slugSchema,
  inboxId: z.string().max(80),
  source: z.string().max(200),
  update: UpdateSchema.nullish(),
  manual: z.object({ personId: z.string().max(90), time: z.string().max(5) }).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    await loadRoster();
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const { slug, inboxId, source, manual } = parsed.data;
    const row = await getProduction(slug);
    if (!row) return fail(404, 'not_found');

    let u: Update | undefined = parsed.data.update ?? undefined;
    if (manual) {
      const t = parseHHMM(manual.time);
      if (t == null) return fail(400, 'invalid_time');
      u = manualUpdate(row.data, manual.personId, t, source);
    }
    if (!u) return fail(400, 'no_update');
    if ((u.kind === 'travel' || u.kind === 'late') && !row.data.people.some((x) => x.id === u.personId)) return fail(400, 'unknown_person');

    if (u.kind === 'log') {
      await logEvent(row.id, 'inbox_logged', { text: `Logged from ${source}: ${u.text}` });
      return ok({ applied: false, logged: true, conflicts: 0 });
    }
    await logEvent(row.id, 'inbox_applied', { text: `Applied: ${describeUpdate(row.data, u)}` });
    const r = await applyFact(row, u, { inboxId, source });
    return ok({ applied: true, conflicts: r.conflicts.length, pending: !!r.pending });
  });
}
