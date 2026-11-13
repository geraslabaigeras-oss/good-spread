import { meState } from '@/lib/server/views';
import { fail, handle, ok, tokenSchema } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  return handle(async () => {
    const { token } = await ctx.params;
    if (!tokenSchema.safeParse(token).success) return fail(400, 'invalid_token');
    const s = await meState(token);
    return s ? ok(s) : fail(404, 'not_found');
  });
}
