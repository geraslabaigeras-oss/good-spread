import { boardState } from '@/lib/server/views';
import { fail, handle, ok, slugSchema } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;
    if (!slugSchema.safeParse(slug).success) return fail(400, 'invalid_slug');
    const s = await boardState(slug);
    return s ? ok(s) : fail(404, 'not_found');
  });
}
