import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const MODEL = 'claude-sonnet-5-5';

export const LookSchema = z.object({
  look: z.string().describe('one sentence on the overall look'),
  hair: z.string(),
  features: z.array(z.string()).describe('3 to 5 short visual traits'),
  vibe: z.array(z.string()).describe('3 to 4 words, e.g. editorial, cool, athletic'),
  bookShows: z.array(z.string()).describe('kinds of work the photos suggest: polaroids, editorial, commercial, beauty, runway, campaign'),
  fitNotes: z.string().describe('two sentences on how this look fits the brief, or empty if no brief'),
});
export type LookAnalysis = z.infer<typeof LookSchema>;

const SYSTEM =
  'You help a fashion producer with casting. Look at a model\'s polaroids and portfolio images and describe only what is visible: look, hair, visual traits, mood, and what kind of work the images are (polaroids, editorial, commercial, beauty, runway, campaign). ' +
  'Never identify the person, guess their name, age, ethnicity or anything not visible. If a brief is given, say plainly how the look fits it. Keep it short, in a producer\'s voice.';

const WORK_SYSTEM =
  'You help a fashion producer hire crew. These images are the portfolio of a {role}. Describe their WORK, not the people in it: ' +
  '"look" = one sentence on their signature style; "hair" = their signature technique or approach (e.g. "layered vintage pieces with sharp tailoring", "dewy skin, graphic liner", "hard flash, low angles"); ' +
  '"features" = 3 to 5 recurring traits of the work; "vibe" = 3 to 4 mood words; "bookShows" = kinds of work shown (editorial, campaign, e-commerce, beauty, runway, celebrity). ' +
  'Never identify anyone. If a brief is given, say plainly how their style fits it. Short, in a producer\'s voice.';

export async function analyzeLook(images: { data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[], brief?: string, role: 'model' | 'photographer' | 'mua' | 'stylist' = 'model'): Promise<LookAnalysis> {
  const client = new Anthropic({ timeout: 30_000, maxRetries: 0 });
  const content: Anthropic.ContentBlockParam[] = images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.data } }));
  const who = role === 'mua' ? 'hair and make-up artist' : role;
  content.push({ type: 'text', text: role === 'model'
    ? (brief ? `The brief: ${brief}\nDescribe this model's look and the fit.` : 'Describe this model\'s look.')
    : (brief ? `The brief: ${brief}\nDescribe this ${who}'s style and the fit.` : `Describe this ${who}'s style.`) });
  const res = await client.messages.parse({
    model: MODEL, max_tokens: 1500, system: role === 'model' ? SYSTEM : WORK_SYSTEM.replace('{role}', who),
    output_config: { effort: 'low', format: zodOutputFormat(LookSchema) },
    messages: [{ role: 'user', content }],
  });
  if (!res.parsed_output) throw new Error(`no_analysis_${res.stop_reason}`);
  return res.parsed_output;
}
