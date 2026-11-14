import { fail, handle, ok } from '@/lib/server/http';
import { hasElevenLabs, transcribe } from '@/lib/server/elevenlabs';

const MAX = 10 * 1024 * 1024;

/** Voice brief → text (ElevenLabs Scribe). The API key never leaves the server. */
export async function POST(req: Request) {
  return handle(async () => {
    if (!hasElevenLabs()) return fail(503, 'elevenlabs_not_configured');
    const form = await req.formData();
    const file = form.get('audio');
    if (!(file instanceof File) || !file.size) return fail(400, 'no_audio');
    if (file.size > MAX) return fail(413, 'audio_too_large');
    if (!/^audio\//.test(file.type) && file.type !== 'video/webm') return fail(415, 'not_audio');
    return ok({ text: await transcribe(file, file.name || 'brief.webm') });
  });
}
