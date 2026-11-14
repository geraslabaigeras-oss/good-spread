import LOCS from '@/data/europe/locations.json';
import STUDIOS from '@/data/europe/studios.json';
import { CITIES, type City } from '@/data/catalog';

/** Real, link-checked shoot locations and studios (Good Spread Europe data, checked 14 Nov 2026). Images are Wikimedia Commons, credited. */
export type EuLocation = {
  id: string; name: string; city: string; country: string; lat: number; lng: number; type: string;
  look: string; season_light: string; permit_notes: string; permit_source: string; cost: string; airport_iata: string;
  source_url: string; image_url: string; image_page: string; image_licence: string; image_author: string;
};
export type EuStudio = { id: string; name: string; city: string; country: string; type: string; size_m2: string; day_rate_listed: string; rate_eur_approx: number | null; rate_unit: string; website: string; notes: string };

export const LOCATIONS = LOCS as EuLocation[];
export const EU_STUDIOS = STUDIOS as EuStudio[];

/** The planning city (our flight/crew base) for a country. */
const BASE: Record<string, City> = {
  Lithuania: 'Vilnius', Latvia: 'Riga', Estonia: 'Tallinn', 'United Kingdom': 'London', Germany: 'Berlin', Portugal: 'Lisbon', France: 'Paris',
  Italy: 'Milan', Denmark: 'Copenhagen', Sweden: 'Stockholm', Spain: 'Barcelona', Iceland: 'Reykjavik', Greece: 'Athens', Poland: 'Warsaw', Netherlands: 'Amsterdam',
};
export const baseCity = (l: { city: string; country: string }): City =>
  ((CITIES as readonly string[]).find((c) => l.city.toLowerCase().startsWith(c.toLowerCase())) as City | undefined) ?? BASE[l.country] ?? 'Vilnius';

const STOP = new Set(['and', 'the', 'with', 'for', 'open', 'clear', 'light', 'look', 'very', 'from', 'into', 'that']);
const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
/** Synonyms so "sea cliffs" finds "coastal" and "concrete" finds "brutalist". Plain code, no AI. */
const SYN: Record<string, string[]> = {
  cliff: ['coastal', 'headland', 'cliffs'], cliffs: ['coastal', 'headland'], ocean: ['coastal', 'atlantic', 'beach', 'sea'], sea: ['coastal', 'beach'], beach: ['coastal', 'dunes', 'sand'],
  concrete: ['brutalist', 'modernist', 'raw'], brutalist: ['concrete', 'modernist'], industrial: ['factory', 'warehouse', 'concrete', 'brutalist'],
  desert: ['dunes', 'sand', 'volcanic', 'black'], forest: ['nature', 'pine', 'woods'], mountain: ['alpine', 'peaks', 'nature'], studio: ['interior', 'daylight'],
  street: ['urban', 'facades', 'quarter'], urban: ['street', 'facades', 'city'], interior: ['hall', 'villa', 'rooms'],
};
export function rankLocations(need: string, opts: { city?: string } = {}) {
  const want = words(need).flatMap((w) => [w, ...(SYN[w] ?? [])]);
  return LOCATIONS
    .filter((l) => !opts.city || baseCity(l) === opts.city)
    .map((l) => {
      const have = new Set(words(`${l.type} ${l.look} ${l.name} ${l.season_light}`));
      const hits = [...new Set(want.filter((w) => have.has(w) || [...have].some((h) => h.length > 4 && w.length > 4 && h.slice(0, 5) === w.slice(0, 5))))];
      return { l, score: hits.length, hits };
    })
    .sort((a, b) => b.score - a.score);
}

/** Weather backup: studios in the same city first, then the same country, cheapest first. */
export function backupStudios(l: { city: string; country: string }) {
  const base = baseCity(l);
  const same = EU_STUDIOS.filter((s) => s.city.toLowerCase().startsWith(base.toLowerCase()) || s.city.toLowerCase().startsWith(l.city.toLowerCase()));
  const country = EU_STUDIOS.filter((s) => s.country === l.country && !same.includes(s));
  return [...same, ...country].sort((a, b) => (a.rate_eur_approx ?? 9999) - (b.rate_eur_approx ?? 9999)).slice(0, 2);
}
