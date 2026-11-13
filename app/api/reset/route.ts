import { z } from 'zod';
import { resetProduction } from '@/lib/server/db';
import { DEMO_SLUG, handle, ok, parseJson } from '@/lib/server/http';

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ full: z.boolean().optional() }));
    if ('error' in parsed) return parsed.error;
    const id = await resetProduction(DEMO_SLUG, !!parsed.data.full);
    return ok({ ok: true, id, full: !!parsed.data.full });
  });
}
