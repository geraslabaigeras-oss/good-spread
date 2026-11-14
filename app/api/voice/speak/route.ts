import { z } from 'zod';
import { fail, handle, parseJson } from '@/lib/server/http';
import { hasElevenLabs, speak } from '@/lib/server/elevenlabs';

/** Text → speech (ElevenLabs). Used for "Listen to your day". */
export async function POST(req: Request) {
  return handle(async () => {
    if (!hasElevenLabs()) return fail(503, 'elevenlabs_not_configured');
    const parsed = await parseJson(req, z.object({ text: z.string().trim().min(1).max(600) }));
    if ('error' in parsed) return parsed.error;
    const audio = await speak(parsed.data.text);
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  });
}
