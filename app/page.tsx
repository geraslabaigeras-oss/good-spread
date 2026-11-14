import { buildProduction, summarize } from '@/lib/engine';
import { STRATEGIES } from '@/data/catalog';
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
  return (
    <Landing
      cap={DEMO_CAP}
      stills={DEMO_DELIVERABLES.stills}
      routes={routes.map((r) => ({ name: r.name, total: r.total, overCap: r.overCap }))}
      best={{ name: fitting.name, total: fitting.total }}
      people={seed.people.filter((x) => x.role !== 'producer').length}
    />
  );
}
