import { z } from 'zod';
import { resetProduction } from '@/lib/server/db';
import { DEMO_SLUG, fail, handle, ok, parseJson, slugSchema } from '@/lib/server/http';

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ full: z.boolean().optional(), slug: slugSchema.optional() }));
    if ('error' in parsed) return parsed.error;
    // Only the sample production can be restored; real productions have no seed to go back to.
    if (parsed.data.slug && parsed.data.slug !== DEMO_SLUG) return fail(400, 'not_resettable');
    const id = await resetProduction(DEMO_SLUG, !!parsed.data.full);
    return ok({ ok: true, id, full: !!parsed.data.full });
  });
}
