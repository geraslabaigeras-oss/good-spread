import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const Script = z.object({
  lines: z.array(z.object({
    who: z.enum(['agent', 'agency']).describe('agent = our voice agent; agency = the booker, as a LIKELY reply'),
    text: z.string().describe('the line in the target language and its native script'),
    english: z.string().describe('English translation'),
  })).describe('6 to 8 short lines, alternating, starting with the agent'),
});
export type CallScript = z.infer<typeof Script>;

const SYSTEM =
  'You write short, polite phone scripts for an AI voice agent that calls model agencies on behalf of a fashion producer to check a model\'s availability and rate. ' +
  'Write natural lines in the requested language and its native script, the way a professional booker would speak. The agent identifies itself as an AI assistant calling for the producer, asks for availability on the date, the day rate, usage terms, and offers to send the brief by email. ' +
  'Agency lines are plausible replies so the producer can see the flow; keep them neutral and never state facts about the real model. No names except the model name given.';

export async function writeScript(i: { language: string; agency: string; city: string; model: string; role: string; date: string; brief?: string; producer?: string }) {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 0 });
  const res = await client.messages.parse({
    model: 'claude-sonnet-5-5', max_tokens: 1800, system: SYSTEM,
    output_config: { effort: 'low', format: zodOutputFormat(Script) },
    messages: [{ role: 'user', content: `Language: ${i.language}\nAgency: ${i.agency}, ${i.city}\nModel to book: ${i.model} (${i.role})\nShoot date: ${i.date}\n${i.brief ? `Brief: ${i.brief}\n` : ''}Producer: ${i.producer ?? 'the producer'}\nWrite the call script.` }],
  });
  if (!res.parsed_output) throw new Error(`no_script_${res.stop_reason}`);
  return res.parsed_output;
}
