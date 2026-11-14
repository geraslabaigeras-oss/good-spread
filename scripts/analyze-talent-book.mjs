// Local only: reads private/talent/book.json + photos, adds a look analysis per model (what is visible, never identity).
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const dir = 'private/talent';
const book = JSON.parse(fs.readFileSync(path.join(dir, 'book.json'), 'utf8'));
const client = new Anthropic({ timeout: 60_000, maxRetries: 2 });
const schema = {
  type: 'object', additionalProperties: false,
  required: ['look', 'hair', 'features', 'vibe', 'fits', 'board'],
  properties: {
    look: { type: 'string', description: 'one sentence on the overall look' },
    hair: { type: 'string', description: 'e.g. "short dark curls"' },
    features: { type: 'array', items: { type: 'string' }, description: '3 to 5 short visible traits' },
    vibe: { type: 'array', items: { type: 'string' }, description: '3 to 4 words, e.g. editorial, relaxed, athletic' },
    fits: { type: 'array', items: { type: 'string' }, description: 'kinds of shoots this look suits, e.g. coastal lifestyle, beauty close-up, tailoring, streetwear' },
    board: { type: 'string', enum: ['men', 'women', 'unclear'], description: 'which agency board the styling and polaroids suggest' },
  },
};
const SYSTEM = 'You help a fashion producer with casting. Describe only what is visible in these agency photos: look, hair, visual traits, mood, and which kinds of shoots the look suits. Never identify the person or guess age or ethnicity. Short, in a producer\'s voice.';

async function one(b) {
  if (b.look) return;
  const content = b.images.slice(0, 4).map((im) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(path.join(dir, 'img', im.file)).toString('base64') } }));
  content.push({ type: 'text', text: 'Describe this model\'s look for casting.' });
  const res = await client.messages.create({
    model: 'claude-sonnet-5-5', max_tokens: 1500, system: SYSTEM,
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content }],
  });
  const text = res.content.find((c) => c.type === 'text')?.text;
  b.look = JSON.parse(text);
  if (!b.gender && b.look.board !== 'unclear') b.gender = b.look.board;
  process.stdout.write('.');
}
const queue = [...book];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) { const b = queue.shift(); try { await one(b); } catch (e) { console.error('\n', b.name, e.message); } } }));
fs.writeFileSync(path.join(dir, 'book.json'), JSON.stringify(book, null, 1));
console.log('\nanalysed', book.filter((b) => b.look).length, 'of', book.length);
