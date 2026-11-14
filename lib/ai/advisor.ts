import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const Advice = z.object({
  verdict: z.enum(['good', 'mixed', 'bad']),
  answer: z.string().describe('2 to 3 short sentences, plain and direct, like a senior producer'),
  suggestion: z.string().describe('one concrete alternative or next step, under 15 words'),
});
export type AdviceT = z.infer<typeof Advice>;

const SYSTEM =
  'You are a senior fashion producer advising on where and how to shoot. You get the creative brief, the shoot date and the costed plans (totals were calculated by code; never invent new totals). ' +
  'Answer the producer\'s question directly: is it a good idea for this brief and date, and why (light and weather that time of year, daylight hours, travel time and cost, permits, local crews and studios, the look). Be honest and short. No lists, no hedging.';

export async function advise(i: { question: string; brief: string; date: string; plans: { name: string; city: string; total: number; cap: number; flights: number }[] }) {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 0 });
  const plans = i.plans.map((p) => `${p.name} in ${p.city}: €${Math.round(p.total)} of €${p.cap} cap, ${p.flights} people fly`).join('; ');
  const res = await client.messages.parse({
    model: 'claude-sonnet-5-5', max_tokens: 800, system: SYSTEM,
    output_config: { effort: 'low', format: zodOutputFormat(Advice) },
    messages: [{ role: 'user', content: `Brief: ${i.brief}\nShoot date: ${i.date}\nPlans: ${plans}\nQuestion: ${i.question}` }],
  });
  if (!res.parsed_output) throw new Error(`no_advice_${res.stop_reason}`);
  return res.parsed_output;
}
