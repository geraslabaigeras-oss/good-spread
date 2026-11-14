import { buildProduction, summarize } from '@/lib/engine';
import { ALL_PEOPLE, STRATEGIES } from '@/data/catalog';
import type { GlobePin } from '@/components/glass/Globe';
import { DEMO_BRIEF, DEMO_CAP, DEMO_DELIVERABLES, DEMO_START } from '@/data/demo';
import { makeSeed } from '@/data/seed';
import { Landing } from '@/components/landing/Landing';

// Every figure on the landing page comes from the engine, not from copy.
export default function Home() {
  const routes = STRATEGIES.map((s) =>
    summarize(buildProduction({ slug: 'landing', title: DEMO_BRIEF.title, brand: DEMO_BRIEF.brand, strategy: s.id, brief: DEMO_BRIEF, deliverables: DEMO_DELIVERABLES, cap: DEMO_CAP, startISO: DEMO_START })),
  );
  const fitting = routes.filter((r) => !r.overCap && r.fitsDeadline).sort((a, b) => a.total - b.total)[0] ?? routes[0];
  const seed = makeSeed();
  const pins: GlobePin[] = [
    ...ALL_PEOPLE.filter((c) => c.role === 'model' || c.role === 'photographer').map((c) => ({ id: c.id, city: c.city, label: c.name, sub: c.role, photo: c.photo, kind: (c.role === 'model' ? 'model' : c.role === 'photographer' ? 'photographer' : 'crew') as GlobePin['kind'], selected: c.role === 'model' })),
  ];
  return (
    <Landing
      cap={DEMO_CAP}
      stills={DEMO_DELIVERABLES.stills}
      routes={routes.map((r) => ({ name: r.name, total: r.total, overCap: r.overCap }))}
      best={{ name: fitting.name, total: fitting.total }}
      people={seed.people.filter((x) => x.role !== 'producer').length}
      pins={pins}
      total={ALL_PEOPLE.length}
    />
  );
}
