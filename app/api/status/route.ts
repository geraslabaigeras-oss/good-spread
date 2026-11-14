import { ok } from '@/lib/server/http';
import { hasElevenLabs } from '@/lib/server/elevenlabs';

/** Which optional services are configured (no secrets returned). */
export async function GET() {
  return ok({ elevenlabs: hasElevenLabs(), llm: process.env.ANTHROPIC_API_KEY?.trim() ? 'anthropic' : null });
}
