import { applyUpdate, buildPending, buildProduction, callTime, fmt, summarize } from '@/lib/engine';
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
  // The core moment, computed: a flight change for the travelling model on the sample plan.
  const traveller = seed.people.find((x) => !x.local)!;
  const changed = applyUpdate(seed, { kind: 'travel', personId: traveller.id, arriveMin: 645, source: 'flight_change.pdf' }, '2026-11-14T08:00:00Z');
  const pending = buildPending(changed, { inboxId: 'landing', source: 'flight_change.pdf', createdAt: '2026-11-14T08:00:00Z' })!;
  const best = pending.fixes.find((f) => f.id === pending.recommendedFixId)!;
  const roleName = (id: string) => { const x = seed.people.find((y) => y.id === id)!; return x.role === 'model' ? 'Your model' : x.role === 'mua' ? 'Hair & makeup' : x.role[0].toUpperCase() + x.role.slice(1); };
  const moment = {
    lands: fmt(645),
    call: fmt(callTime(seed, traveller.id)!),
    newCall: fmt(callTime(best.plan, traveller.id)!),
    who: roleName(traveller.id),
    fixes: pending.fixes.map((f) => ({ label: f.kind === 'SWAP_ORDER' ? 'Swap the order' : f.kind === 'SHIFT_FROM' ? 'Shift the day' : 'Replace the model', cost: f.costDelta, people: f.peopleAffected.length, creative: f.changesCreative, best: f.id === best.id })),
  };
  return (
    <Landing
      cap={DEMO_CAP}
      stills={DEMO_DELIVERABLES.stills}
      routes={routes.map((r) => ({ name: r.name, total: r.total, overCap: r.overCap }))}
      best={{ name: fitting.name, total: fitting.total }}
      people={seed.people.filter((x) => x.role !== 'producer').length}
      moment={moment}
    />
  );
}
