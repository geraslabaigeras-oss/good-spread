import type { Block, CreativeBrief, Deliverables, LineItem, Look, Person, Picks, Production, StrategyId, Travel } from '@/lib/types';
import { catalogLocation, catalogPerson, MODELS, PHOTOGRAPHERS, strategyDef, type CatalogPerson, type City } from '@/data/catalog';
import { defaultDna } from './dna';
import { computeBudget } from './budget';
import { detectConflicts } from './conflicts';
import { callTime } from './schedule';

export type BuildInput = {
  slug: string; title: string; brand: string;
  strategy: StrategyId;
  picks?: Partial<Picks>;
  brief?: CreativeBrief | null;
  deliverables: Deliverables;
  cap: number;
  startISO: string; // planning starts (today); shoot date = start + prepDays
  shootISO?: string; // picked by the producer; overrides start + prepDays
  shootDays?: number; // consecutive shoot days (1 by default)
  looks?: Look[];
};

const COLOURS = ['olive', 'sand', 'black', 'navy', 'stone', 'rust'];

export function defaultLooks(garment = 'Field jacket', n = 4): Look[] {
  return Array.from({ length: n }, (_, i) => ({ id: `L${i + 1}`, name: `Look ${i + 1}`, garment: `${garment}, ${COLOURS[i % COLOURS.length]}` }));
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toPerson(c: CatalogPerson, city: City): Person {
  const p: Person = { id: c.id, name: c.name, role: c.role, dayRate: c.dayRate, otRatePerHour: c.otRatePerHour, local: c.city === city };
  if (c.agency) { p.agency = c.agency; p.commissionPct = c.commissionPct; }
  if (c.role === 'photographer') p.motion = c.motion !== false;
  if (c.photo) p.photo = c.photo;
  p.city = c.city;
  return p;
}

/** Day schedule. Two models = the original seed day; one model = a half day (hybrid). */
function schedule(models: string[], ph: string, mua: string, st: string, looks: Look[]): Block[] {
  const lk = looks.map((l) => l.id);
  if (models.length >= 2) {
    const [a, b] = models;
    const half = Math.ceil(lk.length / 2);
    return [
      { id: 'b-setup', kind: 'setup', startMin: 480, endMin: 540, personIds: ['producer', ph, st] },
      { id: 'b-hmu-a', kind: 'hmu', startMin: 540, endMin: 600, personIds: [a, mua] },
      { id: 'b-shoot-a', kind: 'shoot', startMin: 600, endMin: 720, personIds: [a, ph, st], lookIds: lk.slice(0, half) },
      { id: 'b-hmu-b', kind: 'hmu', startMin: 690, endMin: 750, personIds: [b, mua] },
      { id: 'b-lunch', kind: 'lunch', startMin: 720, endMin: 750, personIds: ['producer', ph, st] },
      { id: 'b-shoot-b', kind: 'shoot', startMin: 750, endMin: 870, personIds: [b, ph, st], lookIds: lk.slice(half) },
      { id: 'b-wrap', kind: 'wrap', startMin: 870, endMin: 900, personIds: ['producer', ph, st] },
    ];
  }
  const [a] = models;
  return [
    { id: 'b-setup', kind: 'setup', startMin: 480, endMin: 510, personIds: ['producer', ph, st] },
    { id: 'b-hmu-a', kind: 'hmu', startMin: 510, endMin: 570, personIds: [a, mua] },
    { id: 'b-shoot-a', kind: 'shoot', startMin: 570, endMin: 750, personIds: [a, ph, st], lookIds: lk },
    { id: 'b-wrap', kind: 'wrap', startMin: 750, endMin: 780, personIds: ['producer', ph, st] },
  ];
}

export function buildProduction(i: BuildInput): Production {
  const s = strategyDef(i.strategy);
  const picks: Picks = {
    models: (i.picks?.models?.length ? i.picks.models : s.defaultPicks.models).slice(0, s.modelSlots),
    photographer: i.picks?.photographer ?? s.defaultPicks.photographer,
    location: i.picks?.location ?? s.defaultPicks.location,
  };
  const city = s.city;
  const loc = catalogLocation(picks.location) ?? catalogLocation(s.defaultPicks.location)!;
  const looks = i.looks ?? defaultLooks(i.brief?.garment);

  const picked = [...picks.models, picks.photographer, s.crew.mua, s.crew.stylist].map((id) => catalogPerson(id)!).filter(Boolean);
  const people: Person[] = [{ id: 'producer', name: 'Producer (you)', role: 'producer', dayRate: 0, otRatePerHour: 0, local: true }, ...picked.map((c) => toPerson(c, city))];

  const takenIds = new Set(picked.map((c) => c.id));
  const shortlist = [...MODELS, ...PHOTOGRAPHERS].filter((c) => c.city === city && !takenIds.has(c.id)).map((c) => toPerson(c, city));

  const blocks = schedule(picks.models, picks.photographer, s.crew.mua, s.crew.stylist, looks);
  const first = Math.min(...blocks.map((b) => b.startMin));
  const last = Math.max(...blocks.map((b) => b.endMin));

  const travel: Travel[] = [];
  const items: LineItem[] = [];
  const days = Math.max(1, Math.min(7, Math.round(i.shootDays ?? 1)));

  // Talent and crew (rate card)
  for (const c of picked) {
    const p = people.find((x) => x.id === c.id)!;
    items.push({
      id: `i-${c.id}`, category: c.role === 'model' ? 'talent' : 'crew',
      label: `${c.name}, ${c.role === 'mua' ? 'hair and makeup' : c.role}`, qty: days, unit: 'day', rate: p.dayRate, personId: c.id, source: 'rate_card',
    });
  }

  // Studio or location
  if (loc.kind === 'location') {
    items.push({ id: 'i-permit', category: 'studio', label: `Location permit, ${loc.name.split(',')[0]}${days > 1 ? `, ${days} days` : ''}`, qty: days, unit: 'flat', rate: loc.permit ?? 0, source: 'quote', tag: 'location' });
    if (loc.fixer) items.push({ id: 'i-fixer', category: 'studio', label: 'Local fixer and van', qty: 1, unit: 'flat', rate: loc.fixer, source: 'estimate', tag: 'fixer' });
  } else {
    const hours = (last - first) / 60;
    items.push({ id: 'i-studio', category: 'studio', label: `Studio ${fmtHM(first)}–${fmtHM(last)}${days > 1 ? ` × ${days} days` : ''}`, qty: hours * days, unit: 'hour', rate: loc.hourlyRate, source: 'quote', tag: 'studio' });
  }

  // Travel: same-day flights become Travel records (the engine checks them); day-before adds a hotel night.
  for (const c of picked) {
    const t = c.city === city ? undefined : c.travelTo?.[city];
    if (!t) continue;
    const route = `${t.from}–${t.to}`;
    items.push({ id: `i-flight-${c.id}`, category: 'travel', label: `Flight ${route}, ${c.name}`, qty: 1, unit: 'flat', rate: t.flight, personId: c.id, source: 'quote' });
    items.push({ id: `i-taxi-${c.id}`, category: 'travel', label: `Taxi airport → ${loc.kind === 'location' ? 'location' : 'studio'}, ${c.name}`, qty: 1, unit: 'flat', rate: t.taxi, personId: c.id, source: 'estimate' });
    if (t.dayBefore) {
      items.push({ id: `i-hotel-${c.id}`, category: 'travel', label: `Hotel, 1 night, ${c.name}`, qty: 1, unit: 'flat', rate: t.hotel ?? 0, personId: c.id, source: 'estimate', tag: 'hotel' });
    } else {
      if (days > 1) items.push({ id: `i-hotel-${c.id}`, category: 'travel', label: `Hotel, ${days - 1} night${days > 2 ? 's' : ''}, ${c.name}`, qty: days - 1, unit: 'flat', rate: t.hotel ?? 120, personId: c.id, source: 'estimate', tag: 'hotel' });
      travel.push({ personId: c.id, mode: 'flight', number: t.number, from: t.from, to: t.to, departMin: t.departMin, arriveMin: t.arriveMin, transferMin: t.transferMin, source: 'catalog' });
    }
  }

  // Post
  const d = i.deliverables;
  items.push({ id: 'i-retouch', category: 'post', label: `Retouching, ${d.stills} stills`, qty: d.stills, unit: 'item', rate: s.retouchRate, source: 'estimate', tag: 'retouch' });
  if (s.plates) items.push({ id: 'i-plates', category: 'post', label: 'Licensed location plates (demo library)', qty: s.plates.qty, unit: 'item', rate: s.plates.rate, source: 'quote', tag: 'plates' });
  if (s.composite) items.push({ id: 'i-composite', category: 'post', label: `Compositing, ${d.stills} stills`, qty: d.stills, unit: 'item', rate: s.composite, source: 'estimate', tag: 'composite' });

  // Usage per model
  for (const id of picks.models) {
    const c = catalogPerson(id)!;
    items.push({
      id: `i-usage-${id}`, category: 'usage', label: `Usage ${d.usage} ${d.usageMonths} mo, ${c.name}`, qty: 1, unit: 'flat',
      rate: Math.round(300 * (d.usageMonths / 12)), personId: id, source: 'estimate', tag: 'usage', months: d.usageMonths,
    });
  }

  const p: Production = {
    id: i.slug, slug: i.slug, title: i.title, brand: i.brand,
    dateISO: i.shootISO ?? addDays(i.startISO, s.prepDays), version: 1, shootDays: days,
    studio: { name: loc.name, address: loc.address, mapsUrl: loc.mapsUrl, opensMin: loc.opensMin, closesMin: loc.closesMin, bookedUntilMin: last, hourlyRate: loc.hourlyRate },
    people, shortlist, travel, late: [], blocks, looks,
    budget: { cap: i.cap, contingencyPct: 10, items },
    pending: null,
    city, strategy: s.id, picks, deliverables: d, brief: i.brief ?? null,
  };
  p.dna = defaultDna(d, i.brief, looks, picks.models);
  return p;
}

function fmtHM(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export type StrategySummary = {
  id: StrategyId; name: string; city: string; tagline: string;
  total: number; cap: number; overCap: boolean;
  prepDays: number; shootDays: number; postDays: number; totalDays: number;
  shootISO: string; deliveryISO: string; fitsDeadline: boolean;
  travel: boolean; travellers: number; physical: 'full' | 'partial';
  byCategory: ReturnType<typeof computeBudget>['byCategory'];
  lines: ReturnType<typeof computeBudget>['lines'];
  conflicts: number;
  callTimes: { name: string; call: number | null }[];
};

export function summarize(p: Production): StrategySummary {
  const s = strategyDef(p.strategy ?? 'local');
  const b = computeBudget(p);
  const sd = p.shootDays ?? 1;
  const deliveryISO = addDays(p.dateISO, sd - 1 + s.postDays);
  const deadline = p.deliverables?.deadlineISO;
  const travellers = new Set(p.budget.items.filter((i) => i.category === 'travel' && i.personId).map((i) => i.personId)).size;
  return {
    id: s.id, name: s.name, city: s.city, tagline: s.tagline,
    total: b.total, cap: b.cap, overCap: b.total > b.cap,
    prepDays: s.prepDays, shootDays: sd, postDays: s.postDays, totalDays: s.prepDays + sd + s.postDays,
    shootISO: p.dateISO, deliveryISO, fitsDeadline: !deadline || deliveryISO <= deadline,
    travel: travellers > 0, travellers, physical: s.physical,
    byCategory: b.byCategory, lines: b.lines,
    conflicts: detectConflicts(p).filter((c) => c.code !== 'BUDGET').length,
    callTimes: p.people.filter((x) => x.role !== 'producer').map((x) => ({ name: x.name, call: callTime(p, x.id) })),
  };
}
