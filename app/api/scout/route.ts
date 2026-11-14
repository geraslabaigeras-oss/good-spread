import { z } from 'zod';
import { createHash } from 'node:crypto';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { scout } from '@/lib/ai/scout';
import { cacheExtraction, cachedExtraction } from '@/lib/server/db';

/** AI location scouting: Claude proposes real places for the brief; each is verified on Wikipedia (photo, coordinates). */
export async function POST(req: Request) {
  return handle(async () => {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) return fail(503, 'anthropic_not_configured');
    const parsed = await parseJson(req, z.object({ brief: z.string().trim().min(10).max(1200), city: z.string().trim().min(2).max(60) }));
    if ('error' in parsed) return parsed.error;
    const { brief, city } = parsed.data;
    const sha = createHash('sha256').update(`scout:v2|${city}|${brief}`).digest('hex');
    const hit = await cachedExtraction(sha).catch(() => null);
    if (hit) return ok({ places: hit, cached: true });
    const places = await scout(brief, city);
    if (places.length) await cacheExtraction(sha, places).catch(() => {});
    return ok({ places, cached: false });
  });
}
