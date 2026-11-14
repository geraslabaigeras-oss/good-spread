import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { advise } from '@/lib/ai/advisor';

/** Ask the producer's assistant (Claude) about a plan: "what about England?" Totals come from code, not the AI. */
export async function POST(req: Request) {
  return handle(async () => {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) return fail(503, 'anthropic_not_configured');
    const parsed = await parseJson(req, z.object({
      question: z.string().trim().min(2).max(300), brief: z.string().max(800), date: z.string().max(40),
      plans: z.array(z.object({ name: z.string().max(40), city: z.string().max(40), total: z.number(), cap: z.number(), flights: z.number() })).max(5),
    }));
    if ('error' in parsed) return parsed.error;
    return ok(await advise(parsed.data));
  });
}
