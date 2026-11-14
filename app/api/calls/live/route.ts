import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';

const LANG: Record<string, string> = { French: 'fr', Italian: 'it', Swedish: 'sv', Spanish: 'es', Danish: 'da', English: 'en' };

/**
 * Live agency call in the browser (ElevenLabs Agents, Eleven v4 Turbo voice).
 * Returns a short-lived signed URL plus the per-call prompt; the API key never reaches the browser.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const key = process.env.ELEVENLABS_API_KEY?.trim();
    const agent = process.env.ELEVENLABS_AGENT_ID?.trim();
    if (!key || !agent) return fail(503, 'elevenlabs_not_configured');
    const parsed = await parseJson(req, z.object({
      language: z.string().max(20), agency: z.string().max(80), city: z.string().max(60),
      model: z.string().max(80), date: z.string().max(40), firstMessage: z.string().max(400).optional(), brief: z.string().max(600).optional(),
    }));
    if ('error' in parsed) return parsed.error;
    const b = parsed.data;
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agent)}`, { headers: { 'xi-api-key': key }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return fail(502, `elevenlabs_${r.status}`);
    const { signed_url } = (await r.json()) as { signed_url: string };
    const prompt = `You are an AI assistant calling ${b.agency} in ${b.city} on behalf of a fashion producer. Speak ${b.language} only. Say you are an AI assistant. You want to book ${b.model} for ${b.date}${b.brief ? ` for this shoot: ${b.brief}` : ''}. Ask: is the model available that day, what is the day rate, and what usage terms apply. Offer to email the brief. Keep each turn to one or two short sentences. When you have availability and the rate, repeat them back clearly and thank them.`;
    return ok({ signedUrl: signed_url, prompt, language: LANG[b.language] ?? 'en', firstMessage: b.firstMessage });
  });
}
