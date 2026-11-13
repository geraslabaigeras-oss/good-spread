import { z } from 'zod';
import { after } from 'next/server';
import { approveFix, notifyAffected } from '@/lib/server/actions';
import { fail, handle, ok, parseJson, slugSchema } from '@/lib/server/http';

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ slug: slugSchema, fixId: z.string().min(1).max(40) }));
    if ('error' in parsed) return parsed.error;
    const r = await approveFix(parsed.data.slug, parsed.data.fixId);
    if ('error' in r) return fail(409, r.error!);
    after(() => notifyAffected(r.row.id, r.next, r.fix.changes));
    return ok({ version: r.next.version, receipt: r.receipt, label: r.fix.label, changes: r.fix.changes });
  });
}
