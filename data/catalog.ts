import type { Person, Role, StrategyId } from '@/lib/types';

/**
 * People pool. In the app this is YOUR roster (people you added on /people, see setRoster).
 * The SAMPLE_* lists are fictional and only used by the engine tests and the old sample shoot.
 */
export const CITIES = ['Vilnius', 'Lisbon', 'Milan', 'Riga', 'Warsaw', 'Berlin', 'Paris', 'London', 'Stockholm', 'Copenhagen'] as const;
export type City = (typeof CITIES)[number];
export const IATA: Record<City, string> = { Vilnius: 'VNO', Lisbon: 'LIS', Milan: 'MXP', Riga: 'RIX', Warsaw: 'WAW', Berlin: 'BER', Paris: 'CDG', London: 'LHR', Stockholm: 'ARN', Copenhagen: 'CPH' };

export type TravelTemplate = {
  // same-day flight (arrives on the shoot day) or day-before flight + hotel
  number: string; from: string; to: string; departMin: number; arriveMin: number; transferMin: number;
  flight: number; taxi: number; dayBefore?: boolean; hotel?: number;
};

export type CatalogPerson = Person & {
  city: City;
  bio: string;
  stats?: { height: number; bust: number; waist: number; hips: number; shoe: number; hair: string; eyes: string };
  known?: string; // photographers: what they're known for
  tags: string[];
  photo?: string;
  motion?: boolean; // photographers: can also shoot the motion deliverables
  travelTo?: Partial<Record<City, TravelTemplate>>;
};

export type CatalogLocation = {
  id: string; name: string; city: City; kind: 'studio' | 'cyc' | 'location';
  address: string; mapsUrl: string;
  hourlyRate: number;            // studio hire per hour (location: overtime per hour)
  permit?: number;               // location permit (flat)
  fixer?: number;                // local fixer (flat)
  opensMin: number; closesMin: number;
  natural: boolean; note: string; tags: string[]; photo?: string;
};

const IEVA_TRAVEL: Partial<Record<City, TravelTemplate>> = {
  Vilnius: { number: 'DA 641', from: 'MXP', to: 'VNO', departMin: 295, arriveMin: 460, transferMin: 30, flight: 180, taxi: 30 },
  Lisbon: { number: 'DA 330', from: 'MXP', to: 'LIS', departMin: 0, arriveMin: 0, transferMin: 30, flight: 160, taxi: 30, dayBefore: true, hotel: 120 },
};
const VNO_TO_LIS: TravelTemplate = { number: 'DA 210', from: 'VNO', to: 'LIS', departMin: 0, arriveMin: 0, transferMin: 30, flight: 230, taxi: 30, dayBefore: true, hotel: 120 };

const SAMPLE_MODELS: CatalogPerson[] = [
  {
    id: 'ieva', photo: '/catalog/ieva.jpg', name: 'Ieva', stats: { height: 178, bust: 81, waist: 60, hips: 88, shoe: 39, hair: 'Dark blonde', eyes: 'Grey' }, role: 'model', agency: 'Milan agency (demo)', commissionPct: 20, dayRate: 600, otRatePerHour: 75, local: false,
    city: 'Milan', bio: 'Editorial and outerwear. Strong in movement.', tags: ['editorial', 'outerwear', 'motion'], travelTo: IEVA_TRAVEL,
  },
  {
    id: 'marta', photo: '/catalog/marta.jpg', name: 'Marta', stats: { height: 176, bust: 83, waist: 62, hips: 90, shoe: 40, hair: 'Brown', eyes: 'Green' }, role: 'model', dayRate: 450, otRatePerHour: 55, local: true,
    city: 'Vilnius', bio: 'Freelance. Commercial and editorial.', tags: ['commercial', 'editorial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'austeja', photo: '/catalog/austeja.jpg', name: 'Austėja', stats: { height: 179, bust: 80, waist: 59, hips: 87, shoe: 40, hair: 'Brown, long', eyes: 'Brown' }, role: 'model', dayRate: 500, otRatePerHour: 60, local: true,
    city: 'Vilnius', bio: 'Editorial. Short dark hair.', tags: ['editorial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'lina', photo: '/catalog/lina.jpg', name: 'Lina', stats: { height: 175, bust: 82, waist: 61, hips: 89, shoe: 39, hair: 'Light brown', eyes: 'Blue' }, role: 'model', agency: 'Vilnius models (demo)', commissionPct: 15, dayRate: 380, otRatePerHour: 45, local: true,
    city: 'Vilnius', bio: 'New face. Clean, natural look.', tags: ['new face', 'commercial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'ines', photo: '/catalog/ines.jpg', name: 'Inês', stats: { height: 177, bust: 82, waist: 60, hips: 88, shoe: 39, hair: 'Dark brown', eyes: 'Brown' }, role: 'model', agency: 'Lisbon agency (demo)', commissionPct: 20, dayRate: 550, otRatePerHour: 65, local: true,
    city: 'Lisbon', bio: 'Editorial. Outdoor light, movement.', tags: ['editorial', 'outdoor'],
  },
  {
    id: 'sofia', photo: '/catalog/sofia.jpg', name: 'Sofia', stats: { height: 174, bust: 84, waist: 63, hips: 91, shoe: 38, hair: 'Blonde', eyes: 'Hazel' }, role: 'model', dayRate: 480, otRatePerHour: 55, local: true,
    city: 'Lisbon', bio: 'Freelance. Commercial and sport.', tags: ['commercial', 'sport'],
  },
];

const SAMPLE_PHOTOGRAPHERS: CatalogPerson[] = [
  { id: 'tomas', name: 'Tomas', known: 'Outerwear, cold light, long lenses', role: 'photographer', dayRate: 900, otRatePerHour: 90, local: true, city: 'Vilnius', motion: true, bio: 'Stills and motion. Outerwear campaigns.', tags: ['stills', 'motion'], travelTo: { Lisbon: VNO_TO_LIS } },
  { id: 'ruta', name: 'Rūta', known: 'Daylight portraits, quiet colour', role: 'photographer', dayRate: 700, otRatePerHour: 70, local: true, city: 'Vilnius', motion: true, bio: 'Stills and motion. Natural light.', tags: ['stills', 'motion', 'natural light'], travelTo: { Lisbon: VNO_TO_LIS } },
  { id: 'paulius', name: 'Paulius', known: 'Clean e-commerce, flat light', role: 'photographer', dayRate: 550, otRatePerHour: 55, local: true, city: 'Vilnius', motion: false, bio: 'Stills only. E-commerce and lookbook.', tags: ['stills'] },
  { id: 'joao', name: 'João', known: 'Street light, movement, film grain', role: 'photographer', dayRate: 950, otRatePerHour: 95, local: true, city: 'Lisbon', motion: true, bio: 'Stills and motion. Outdoor editorial.', tags: ['stills', 'motion', 'outdoor'] },
];

const SAMPLE_CREW: CatalogPerson[] = [
  { id: 'greta', name: 'Greta', role: 'mua', dayRate: 350, otRatePerHour: 40, local: true, city: 'Vilnius', bio: 'Hair and makeup.', tags: [] },
  { id: 'lukas', name: 'Lukas', role: 'stylist', dayRate: 400, otRatePerHour: 45, local: true, city: 'Vilnius', bio: 'Brand stylist. Travels with the collection.', tags: [], travelTo: { Lisbon: VNO_TO_LIS } },
  { id: 'carla', name: 'Carla', role: 'mua', dayRate: 380, otRatePerHour: 45, local: true, city: 'Lisbon', bio: 'Hair and makeup.', tags: [] },
  { id: 'rita', name: 'Rita', role: 'stylist', dayRate: 420, otRatePerHour: 45, local: true, city: 'Lisbon', bio: 'Stylist.', tags: [] },
];

export const LOCATIONS: CatalogLocation[] = [
  {
    id: 'demo-studio', name: 'Demo studio, Vilnius', city: 'Vilnius', kind: 'studio', address: 'Demo address, Vilnius', mapsUrl: 'https://maps.google.com/?q=Vilnius',
    hourlyRate: 60, opensMin: 420, closesMin: 1080, natural: false, note: 'Cyclorama, full lighting kit.', tags: ['cyclorama', 'lighting kit'],
  },
  {
    id: 'loft', name: 'Loft studio (demo), Vilnius', city: 'Vilnius', kind: 'studio', address: 'Demo loft, Vilnius', mapsUrl: 'https://maps.google.com/?q=Vilnius',
    hourlyRate: 45, opensMin: 420, closesMin: 1080, natural: true, note: 'Daylight loft, concrete and timber.', tags: ['daylight', 'interior'],
  },
  {
    id: 'cyc', name: 'Cyc studio (demo), Vilnius', city: 'Vilnius', kind: 'cyc', address: 'Demo cyc, Vilnius', mapsUrl: 'https://maps.google.com/?q=Vilnius',
    hourlyRate: 50, opensMin: 420, closesMin: 1080, natural: false, note: 'White and green cyc for composite plates.', tags: ['green screen', 'cyclorama'],
  },
  {
    id: 'rooftop', name: 'Rooftop location (demo), Lisbon', city: 'Lisbon', kind: 'location', address: 'Demo rooftop, Lisbon', mapsUrl: 'https://maps.google.com/?q=Lisbon',
    hourlyRate: 60, permit: 600, fixer: 300, opensMin: 420, closesMin: 1140, natural: true, note: 'City view, morning light. Permit until 15:00.', tags: ['outdoor', 'urban'],
  },
  {
    id: 'riverside', name: 'Riverside location (demo), Lisbon', city: 'Lisbon', kind: 'location', address: 'Demo riverside, Lisbon', mapsUrl: 'https://maps.google.com/?q=Lisbon',
    hourlyRate: 50, permit: 450, fixer: 300, opensMin: 420, closesMin: 1140, natural: true, note: 'Industrial riverside, open sky.', tags: ['outdoor', 'industrial'],
  },
];

const SAMPLE_ALL: CatalogPerson[] = [...SAMPLE_MODELS, ...SAMPLE_PHOTOGRAPHERS, ...SAMPLE_CREW];

// Live bindings: setRoster() swaps these for the producer's real people.
export let MODELS: CatalogPerson[] = SAMPLE_MODELS;
export let PHOTOGRAPHERS: CatalogPerson[] = SAMPLE_PHOTOGRAPHERS;
export let CREW: CatalogPerson[] = SAMPLE_CREW;
export let ALL_PEOPLE: CatalogPerson[] = SAMPLE_ALL;
let rosterActive = false;

/** Use the producer's real people everywhere (pickers, defaults, budget levers). */
export function setRoster(list: CatalogPerson[]) {
  rosterActive = true;
  ALL_PEOPLE = list;
  MODELS = list.filter((x) => x.role === 'model');
  PHOTOGRAPHERS = list.filter((x) => x.role === 'photographer');
  CREW = list.filter((x) => x.role === 'mua' || x.role === 'stylist');
}
export const isRosterActive = () => rosterActive;

export const catalogPerson = (id: string) => ALL_PEOPLE.find((x) => x.id === id) ?? SAMPLE_ALL.find((x) => x.id === id);
export const catalogLocation = (id: string) => LOCATIONS.find((x) => x.id === id);

export type StrategyDef = {
  id: StrategyId; name: string; city: City; tagline: string;
  modelSlots: number; physical: 'full' | 'partial';
  defaultPicks: { models: string[]; photographer: string; location: string };
  crew: { mua: string; stylist: string };
  locationKinds: CatalogLocation['kind'][];
  prepDays: number; postDays: number;
  plates?: { qty: number; rate: number }; composite?: number; // hybrid post
  retouchRate: number;
};

const BASE_STRATEGIES: StrategyDef[] = [
  {
    id: 'local', name: 'Local', city: 'Vilnius', tagline: 'Studio in Vilnius. Full shoot, one day.',
    modelSlots: 2, physical: 'full', defaultPicks: { models: ['ieva', 'marta'], photographer: 'tomas', location: 'demo-studio' },
    crew: { mua: 'greta', stylist: 'lukas' }, locationKinds: ['studio'], prepDays: 7, postDays: 4, retouchRate: 20,
  },
  {
    id: 'destination', name: 'Destination', city: 'Lisbon', tagline: 'On location in Lisbon. Outdoor light.',
    modelSlots: 2, physical: 'full', defaultPicks: { models: ['ines', 'sofia'], photographer: 'joao', location: 'rooftop' },
    crew: { mua: 'carla', stylist: 'lukas' }, locationKinds: ['location'], prepDays: 9, postDays: 4, retouchRate: 20,
  },
  {
    id: 'hybrid', name: 'Hybrid', city: 'Vilnius', tagline: 'Half day on cyc. Locations composited in post.',
    modelSlots: 1, physical: 'partial', defaultPicks: { models: ['marta'], photographer: 'ruta', location: 'cyc' },
    crew: { mua: 'greta', stylist: 'lukas' }, locationKinds: ['cyc', 'studio'], prepDays: 4, postDays: 5,
    plates: { qty: 3, rate: 120 }, composite: 30, retouchRate: 20,
  },
];

export const STRATEGIES = BASE_STRATEGIES;

const pickFrom = (pool: CatalogPerson[], city: City, n: number) =>
  [...pool].sort((a, b) => Number(b.city === city) - Number(a.city === city) || a.dayRate - b.dayRate).slice(0, n).map((x) => x.id);

/** With a roster, defaults come from your people: locals first, then cheapest. */
export const strategyDef = (id: StrategyId): StrategyDef => {
  const base = BASE_STRATEGIES.find((s) => s.id === id)!;
  if (!rosterActive) return base;
  return {
    ...base,
    defaultPicks: {
      models: pickFrom(MODELS, base.city, base.modelSlots),
      photographer: pickFrom(PHOTOGRAPHERS, base.city, 1)[0] ?? '',
      location: base.defaultPicks.location,
    },
    crew: {
      mua: pickFrom(CREW.filter((c) => c.role === 'mua'), base.city, 1)[0] ?? '',
      stylist: pickFrom(CREW.filter((c) => c.role === 'stylist'), base.city, 1)[0] ?? '',
    },
  };
};

/** What's missing from the roster before this strategy can be planned. */
export function rosterGaps(id: StrategyId): string[] {
  const s = strategyDef(id);
  const gaps: string[] = [];
  if (s.defaultPicks.models.length < s.modelSlots) gaps.push(s.modelSlots === 1 ? 'a model' : `${s.modelSlots - s.defaultPicks.models.length} more model${s.modelSlots - s.defaultPicks.models.length > 1 ? 's' : ''}`);
  if (!s.defaultPicks.photographer) gaps.push('a photographer');
  if (!s.crew.mua) gaps.push('a hair and makeup artist');
  if (!s.crew.stylist) gaps.push('a stylist');
  return gaps;
}

/** People a strategy can pick from (assemble screen). Travelling talent is allowed and costed. */
export function candidates(id: StrategyId, role: Role): CatalogPerson[] {
  const s = strategyDef(id);
  const pool = role === 'model' ? MODELS : role === 'photographer' ? PHOTOGRAPHERS : CREW.filter((c) => c.role === role);
  return pool.filter((p) => p.city === s.city || !!p.travelTo?.[s.city]);
}

export function locationCandidates(id: StrategyId): CatalogLocation[] {
  const s = strategyDef(id);
  return LOCATIONS.filter((l) => l.city === s.city && s.locationKinds.includes(l.kind));
}
