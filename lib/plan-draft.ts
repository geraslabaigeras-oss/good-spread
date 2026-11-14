import type { Production, StrategyId } from '@/lib/types';
import { buildProduction } from '@/lib/engine';
import { DEMO_BRIEF } from '@/data/demo';
import type { PlanDraft } from '@/lib/plan-store';

/** Build a draft production in the browser from the brief + a strategy (+ picks). Pure engine, no I/O. */
export function draftProduction(d: PlanDraft, strategy: StrategyId, picks?: PlanDraft['picks']): Production {
  const p = buildProduction({
    slug: 'draft', title: d.title, brand: d.brand, strategy, picks,
    brief: d.brief ?? { ...DEMO_BRIEF, title: d.title, brand: d.brand }, deliverables: d.deliverables, cap: d.cap, startISO: d.startISO,
  });
  if (p.dna) p.dna = p.dna.map((x) => (x.id in d.dnaPreserve ? { ...x, preserve: d.dnaPreserve[x.id] } : x));
  return p;
}

