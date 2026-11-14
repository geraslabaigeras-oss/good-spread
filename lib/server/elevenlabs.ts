import 'server-only';

const BASE = 'https://api.elevenlabs.io/v1';
const key = () => process.env.ELEVENLABS_API_KEY?.trim() || null;
export const hasElevenLabs = () => !!key();

/** Speech to text with ElevenLabs Scribe (tries v2, falls back to v1). */
export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const k = key();
  if (!k) throw new Error('elevenlabs_not_configured');
  let last = '';
  for (const model of [process.env.ELEVENLABS_STT_MODEL, 'scribe_v2', 'scribe_v1'].filter(Boolean) as string[]) {
    const fd = new FormData();
    fd.set('file', audio, filename);
    fd.set('model_id', model);
    const r = await fetch(`${BASE}/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': k }, body: fd, signal: AbortSignal.timeout(30_000) });
    if (r.ok) return String(((await r.json()) as { text?: string }).text ?? '').trim();
    last = `${r.status}`;
  }
  throw new Error(`elevenlabs_stt_${last}`);
}

/** Text to speech. Returns MP3 bytes. */
export async function speak(text: string): Promise<ArrayBuffer> {
  const k = key();
  if (!k) throw new Error('elevenlabs_not_configured');
  const voice = process.env.ELEVENLABS_VOICE_ID?.trim() || 'JBFqnCBsd6RMkjVDRZzb';
  const r = await fetch(`${BASE}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': k, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_TTS_MODEL?.trim() || 'eleven_v4_turbo' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`elevenlabs_tts_${r.status}`);
  return r.arrayBuffer();
}
