import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const MODEL = 'claude-sonnet-5-5';

const Proposals = z.object({
  city: z.string().describe('the base city for the shoot, copied exactly from the list you were given'),
  places: z.array(z.object({
    name: z.string().describe('the exact name of a real, existing place, as it would be titled on Wikipedia'),
    why: z.string().describe('one short sentence: what in the reference this place matches (light, texture, architecture, landscape)'),
    from: z.string().describe('rough travel from the base city, e.g. "40 min by car from Lisbon"'),
    shootNote: z.string().describe('one practical note for a crew: best light, access, or "permit likely, check with the town hall"'),
  })).describe('6 to 8 places'),
});

export type ScoutPlace = { name: string; why: string; from?: string; shootNote?: string; description: string | null; image: string | null; lat: number; lng: number; url: string; mapsUrl: string };

const SYSTEM =
  'You are a location scout for fashion shoots. From the creative brief, propose real, specific, named places (buildings, streets, courtyards, parks, beaches, dunes, industrial sites) in or within about two hours of the given city that match the look. ' +
  'Only propose places that really exist and are notable enough to have a Wikipedia article. Prefer variety. Never invent places.';

async function proposePlaces(brief: string, city: string, cities?: readonly string[]) {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 0 });
  const res = await client.messages.parse({
    model: MODEL, max_tokens: 1500, system: SYSTEM,
    output_config: { effort: 'low', format: zodOutputFormat(Proposals) },
    messages: [{ role: 'user', content: cities
      ? `Choose the one base city from this list that has the best real locations for this brief within about two hours: ${cities.join(', ')}.\nBrief: ${brief}\nPick the city, then propose the places near it.`
      : `City: ${city}\nBrief: ${brief}\nPropose the places.` }],
  });
  if (!res.parsed_output) throw new Error(`no_places_${res.stop_reason}`);
  return { city: res.parsed_output.city, places: res.parsed_output.places.slice(0, 8) };
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

export async function scout(brief: string, city: string, cities?: readonly string[]): Promise<{ city: string; places: ScoutPlace[] }> {
  const res = await proposePlaces(brief, city, cities);
  const base = cities ? (cities.find((c) => c.toLowerCase() === res.city.toLowerCase()) ?? cities[0]) : city;
  city = base;
  const checked = await Promise.all(res.places.map(async (pr) => {
    const v = await verify(pr.name, city).catch(() => null);
    return v ? { ...v, why: pr.why, from: pr.from, shootNote: pr.shootNote } : null;
  }));
  const seen = new Set<string>();
  return { city: base, places: checked.filter((x): x is NonNullable<typeof x> => !!x && !seen.has(x.name) && !!seen.add(x.name)).filter((x) => x.image) };
}
