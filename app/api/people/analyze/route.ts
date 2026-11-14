import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { safeFetch } from '@/lib/server/safe-fetch';
import { analyzeLook } from '@/lib/ai/look';

const Body = z.object({
  images: z.array(z.string().max(400_000)).min(1).max(6),
  brief: z.string().max(800).optional(),
});
const MAX = 5 * 1024 * 1024;
type MT = 'image/jpeg' | 'image/png' | 'image/webp';

/** Claude reads the chosen polaroids/portfolio images (agency URLs or uploads) and describes the look and fit. */
export async function POST(req: Request) {
  return handle(async () => {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) return fail(503, 'anthropic_not_configured');
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const imgs: { data: string; mediaType: MT }[] = [];
    for (const src of parsed.data.images) {
      const d = src.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (d) { imgs.push({ mediaType: d[1] as MT, data: d[2] }); continue; }
      const res = await safeFetch(src, 'image/*', 8000).catch(() => null);
      if (!res?.ok) continue;
      const type = (res.headers.get('content-type') ?? '').split(';')[0] as MT;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX) continue;
      imgs.push({ mediaType: type, data: buf.toString('base64') });
    }
    if (!imgs.length) return fail(422, 'no_readable_images');
    return ok({ analysis: await analyzeLook(imgs, parsed.data.brief) });
  });
}
