import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const MODEL = 'claude-sonnet-5-5';

const Proposals = z.object({
  places: z.array(z.object({
    name: z.string().describe('the exact name of a real, existing place, as it would be titled on Wikipedia'),
    why: z.string().describe('one short sentence: what in the reference this place matches (light, texture, architecture, landscape)'),
  })).describe('6 to 8 places'),
});

export type ScoutPlace = { name: string; why: string; description: string | null; image: string | null; lat: number; lng: number; url: string; mapsUrl: string };

const SYSTEM =
  'You are a location scout for fashion shoots. From the creative brief, propose real, specific, named places (buildings, streets, courtyards, parks, beaches, dunes, industrial sites) in or within about two hours of the given city that match the look. ' +
  'Only propose places that really exist and are notable enough to have a Wikipedia article. Prefer variety. Never invent places.';

async function proposePlaces(brief: string, city: string) {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 0 });
  const res = await client.messages.parse({
    model: MODEL, max_tokens: 1500, system: SYSTEM,
    output_config: { effort: 'low', format: zodOutputFormat(Proposals) },
    messages: [{ role: 'user', content: `City: ${city}\nBrief: ${brief}\nPropose the places.` }],
  });
  if (!res.parsed_output) throw new Error(`no_places_${res.stop_reason}`);
  return res.parsed_output.places.slice(0, 8);
}

/** Verify a proposed place on Wikipedia: must exist and have coordinates. Returns the real photo and link. */
async function verify(name: string, city: string): Promise<Omit<ScoutPlace, 'why'> | null> {
  const q = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: name, gsrlimit: '3',
    prop: 'pageimages|coordinates|description|info', piprop: 'thumbnail', pithumbsize: '900', inprop: 'url',
  });
  const r = await fetch(`https://en.wikipedia.org/w/api.php?${q}`, { headers: { 'User-Agent': 'good-spread-scout/1.0 (hackathon demo)' }, signal: AbortSignal.timeout(6000) });
  if (!r.ok) return null;
  const pages = Object.values(((await r.json()) as { query?: { pages?: Record<string, WikiPage> } }).query?.pages ?? {}).sort((a, b) => (a.index ?? 9) - (b.index ?? 9));
  const words = (t: string) => new Set(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && w !== city.toLowerCase()));
  const want = words(name);
  const p = pages.find((x) => {
    if (!x.coordinates?.length) return false;
    if (x.title.toLowerCase() === city.toLowerCase()) return false;
    if (/battle|offensive|siege|war\b|uprising|massacre|election|treaty|pogrom/i.test(`${x.title} ${x.description ?? ''}`)) return false;
    const got = words(x.title);
    const shared = [...want].filter((w) => got.has(w)).length;
    return shared > 0 && shared / Math.min(want.size || 1, got.size || 1) >= 0.5;
  });
  if (!p) return null;
  const { lat, lon } = p.coordinates![0];
  return { name: p.title, description: p.description ?? null, image: p.thumbnail?.source ?? null, lat, lng: lon, url: p.fullurl, mapsUrl: `https://maps.google.com/?q=${lat},${lon}` };
}
type WikiPage = { title: string; index?: number; description?: string; fullurl: string; thumbnail?: { source: string }; coordinates?: { lat: number; lon: number }[] };

export async function scout(brief: string, city: string): Promise<ScoutPlace[]> {
  const proposals = await proposePlaces(brief, city);
  const checked = await Promise.all(proposals.map(async (pr) => {
    const v = await verify(pr.name, city).catch(() => null);
    return v ? { ...v, why: pr.why } : null;
  }));
  const seen = new Set<string>();
  return checked.filter((x): x is ScoutPlace => !!x && !seen.has(x.name) && !!seen.add(x.name)).filter((x) => x.image);
}
