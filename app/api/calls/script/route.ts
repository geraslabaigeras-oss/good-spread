import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { writeScript } from '@/lib/ai/callscript';

/** Claude writes the agency call script in the agency's own language (with English). Nothing is dialled here. */
export async function POST(req: Request) {
  return handle(async () => {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) return fail(503, 'anthropic_not_configured');
    const parsed = await parseJson(req, z.object({
      language: z.string().max(30), agency: z.string().max(80), city: z.string().max(60), model: z.string().max(80),
      role: z.string().max(40), date: z.string().max(40), brief: z.string().max(600).optional(),
    }));
    if ('error' in parsed) return parsed.error;
    return ok(await writeScript(parsed.data));
  });
}
