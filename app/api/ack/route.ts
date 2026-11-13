import { z } from 'zod';
import { ack, ackedViewerIds, getProductionById, logEvent, viewerByToken } from '@/lib/server/db';
import { fail, handle, ok, parseJson, tokenSchema } from '@/lib/server/http';
import { person } from '@/lib/engine';

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ token: tokenSchema }));
    if ('error' in parsed) return parsed.error;
    const v = await viewerByToken(parsed.data.token);
    if (!v) return fail(404, 'not_found');
    const row = await getProductionById(v.production_id);
    if (!row) return fail(404, 'not_found');
    const already = (await ackedViewerIds([v.id], row.version)).has(v.id);
    if (!already) {
      await ack(v.id, row.version);
      const name = person(row.data, v.person_id)?.name ?? v.person_id;
      await logEvent(row.id, 'ack', { text: `${name} got it (v${row.version})`, personId: v.person_id });
    }
    return ok({ acked: true, version: row.version });
  });
}
