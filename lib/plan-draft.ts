import type { Production, StrategyId } from '@/lib/types';
import { buildProduction } from '@/lib/engine';
import { DEMO_BRIEF } from '@/data/demo';
import type { PlanDraft } from '@/lib/plan-store';
import type { GlobeArc, GlobePin } from '@/components/glass/Globe';
import { catalogLocation, catalogPerson, setBriefPrefs } from '@/data/catalog';

/** Build a draft production in the browser from the brief + a strategy (+ picks). Pure engine, no I/O. */
export function draftProduction(d: PlanDraft, strategy: StrategyId, picks?: PlanDraft['picks']): Production {
  setBriefPrefs({ city: d.scoutCity, shortlist: d.shortlist });
  const p = buildProduction({
    slug: 'draft', title: d.title, brand: d.brand, strategy, picks,
    brief: d.brief ?? { ...DEMO_BRIEF, title: d.title, brand: d.brand }, deliverables: d.deliverables, cap: d.cap, startISO: d.startISO, shootISO: d.shootISO,
  });
  if (p.dna) p.dna = p.dna.map((x) => (x.id in d.dnaPreserve ? { ...x, preserve: d.dnaPreserve[x.id] } : x));
  if (d.place && (!d.place.city || d.place.city === p.city)) p.studio = { ...p.studio, name: d.place.name, address: d.place.description ?? d.place.name, mapsUrl: d.place.mapsUrl };
  return p;
}


/** Globe pins and flight arcs for a production: people at their home city, arcs for anyone flying in. */
export function pinsFor(p: Production): { pins: GlobePin[]; arcs: GlobeArc[] } {
  const city = p.city ?? 'Vilnius';
  const pins: GlobePin[] = [];
  const arcs: GlobeArc[] = [];
  for (const x of p.people) {
    if (x.role === 'producer') continue;
    const c = catalogPerson(x.id);
    const from = c?.city ?? city;
    pins.push({ id: x.id, city: from, label: x.name, sub: x.role, photo: c?.photo, kind: x.role === 'model' ? 'model' : x.role === 'photographer' ? 'photographer' : 'crew', selected: true });
    if (from !== city) arcs.push({ from, to: city, label: x.name });
  }
  const loc = p.picks ? catalogLocation(p.picks.location) : undefined;
  if (loc) pins.push({ id: loc.id, city: loc.city, label: loc.name.split(',')[0].replace(' (demo)', ''), sub: 'location', kind: 'location', selected: true });
  return { pins, arcs };
}

