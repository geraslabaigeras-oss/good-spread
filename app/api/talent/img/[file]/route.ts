import fs from 'node:fs';
import { talentImagePath } from '@/lib/server/talent-book';

/** Local-only: serves talent-book photos from private/talent/img. 404 everywhere else. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const p = talentImagePath(file);
  if (!p) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(p), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' } });
}
