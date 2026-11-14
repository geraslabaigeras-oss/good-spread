import type { Person, Role, StrategyId } from '@/lib/types';

/**
 * Demo catalog. Every person, company and place is fictional and labelled (demo).
 * `photo` is optional: drop permissioned images into public/catalog/ and set the path.
 */
export type City = 'Vilnius' | 'Lisbon' | 'Milan';

export type TravelTemplate = {
  // same-day flight (arrives on the shoot day) or day-before flight + hotel
  number: string; from: string; to: string; departMin: number; arriveMin: number; transferMin: number;
  flight: number; taxi: number; dayBefore?: boolean; hotel?: number;
};

export type CatalogPerson = Person & {
  city: City;
  bio: string;
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

export const MODELS: CatalogPerson[] = [
  {
    id: 'ieva', name: 'Ieva', role: 'model', agency: 'Milan agency (demo)', commissionPct: 20, dayRate: 600, otRatePerHour: 75, local: false,
    city: 'Milan', bio: 'Editorial and outerwear. Strong in movement.', tags: ['editorial', 'outerwear', 'motion'], travelTo: IEVA_TRAVEL,
  },
  {
    id: 'marta', name: 'Marta', role: 'model', dayRate: 450, otRatePerHour: 55, local: true,
    city: 'Vilnius', bio: 'Freelance. Commercial and editorial.', tags: ['commercial', 'editorial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'austeja', name: 'Austėja', role: 'model', dayRate: 500, otRatePerHour: 60, local: true,
    city: 'Vilnius', bio: 'Editorial. Short dark hair.', tags: ['editorial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'lina', name: 'Lina', role: 'model', agency: 'Vilnius models (demo)', commissionPct: 15, dayRate: 380, otRatePerHour: 45, local: true,
    city: 'Vilnius', bio: 'New face. Clean, natural look.', tags: ['new face', 'commercial'], travelTo: { Lisbon: VNO_TO_LIS },
  },
  {
    id: 'ines', name: 'Inês', role: 'model', agency: 'Lisbon agency (demo)', commissionPct: 20, dayRate: 550, otRatePerHour: 65, local: true,
    city: 'Lisbon', bio: 'Editorial. Outdoor light, movement.', tags: ['editorial', 'outdoor'],
  },
  {
    id: 'sofia', name: 'Sofia', role: 'model', dayRate: 480, otRatePerHour: 55, local: true,
    city: 'Lisbon', bio: 'Freelance. Commercial and sport.', tags: ['commercial', 'sport'],
  },
];

export const PHOTOGRAPHERS: CatalogPerson[] = [
  { id: 'tomas', name: 'Tomas', role: 'photographer', dayRate: 900, otRatePerHour: 90, local: true, city: 'Vilnius', motion: true, bio: 'Stills and motion. Outerwear campaigns.', tags: ['stills', 'motion'], travelTo: { Lisbon: VNO_TO_LIS } },
  { id: 'ruta', name: 'Rūta', role: 'photographer', dayRate: 700, otRatePerHour: 70, local: true, city: 'Vilnius', motion: true, bio: 'Stills and motion. Natural light.', tags: ['stills', 'motion', 'natural light'], travelTo: { Lisbon: VNO_TO_LIS } },
  { id: 'paulius', name: 'Paulius', role: 'photographer', dayRate: 550, otRatePerHour: 55, local: true, city: 'Vilnius', motion: false, bio: 'Stills only. E-commerce and lookbook.', tags: ['stills'] },
  { id: 'joao', name: 'João', role: 'photographer', dayRate: 950, otRatePerHour: 95, local: true, city: 'Lisbon', motion: true, bio: 'Stills and motion. Outdoor editorial.', tags: ['stills', 'motion', 'outdoor'] },
];

export const CREW: CatalogPerson[] = [
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

export const ALL_PEOPLE: CatalogPerson[] = [...MODELS, ...PHOTOGRAPHERS, ...CREW];
export const catalogPerson = (id: string) => ALL_PEOPLE.find((x) => x.id === id);
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

export const STRATEGIES: StrategyDef[] = [
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

export const strategyDef = (id: StrategyId) => STRATEGIES.find((s) => s.id === id)!;

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
