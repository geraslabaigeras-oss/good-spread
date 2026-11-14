import { describe, expect, test } from 'vitest';
import { makeSeed } from '@/data/seed';
import { DEMO_BRIEF, DEMO_CAP, DEMO_DELIVERABLES, DEMO_START } from '@/data/demo';
import {
  applyUpdate, buildPending, buildProduction, computeBudget, detectConflicts, dnaViolations, evaluateDna, lateUpdate,
  proposeBudgetFixes, receipt, summarize,
} from './index';
import type { StrategyId } from '@/lib/types';

const NOW = '2026-11-21T08:00:00.000Z';
const build = (strategy: StrategyId, picks?: Parameters<typeof buildProduction>[0]['picks']) =>
  buildProduction({ slug: 's', title: 't', brand: 'b', strategy, picks, brief: DEMO_BRIEF, deliverables: DEMO_DELIVERABLES, cap: DEMO_CAP, startISO: DEMO_START });

describe('strategies', () => {
  test('local default = the seed: 4719, shoot 21 Nov, no conflicts', () => {
    const s = summarize(build('local'));
    expect(s.total).toBe(4719);
    expect(s.shootISO).toBe('2026-11-21');
    expect(s.conflicts).toBe(0);
    expect(s.travel).toBe(true);
    expect(makeSeed().dateISO).toBe('2026-11-21');
  });

  test('three strategies differ in cost, time and physical shoot', () => {
    const [l, d, h] = (['local', 'destination', 'hybrid'] as const).map((id) => summarize(build(id)));
    expect(d.total).toBeGreaterThan(l.total);
    expect(h.total).toBeLessThan(l.total);
    expect(h.physical).toBe('partial');
    expect(d.city).toBe('Lisbon');
    expect(d.travel).toBe(true);
    expect(h.totalDays).toBeLessThan(d.totalDays);
    for (const s of [l, d, h]) expect(s.conflicts).toBe(0);
  });

  test('picks change the budget: Rūta instead of Tomas saves 200 + contingency', () => {
    const a = computeBudget(build('local')).total;
    const b = computeBudget(build('local', { photographer: 'ruta' })).total;
    expect(a - b).toBe(220);
  });

  test('picking a stills-only photographer breaks the motion DNA', () => {
    const base = build('local');
    const plan = build('local', { photographer: 'paulius' });
    const broken = dnaViolations(evaluateDna(base, plan)).map((x) => x.id);
    expect(broken).toEqual(['motion']);
  });
});

describe('budget cut', () => {
  test('cap cut to 4400 -> BUDGET conflict; plan A keeps every must-keep item', () => {
    const p = applyUpdate(makeSeed(), { kind: 'cap', cap: 4400, source: 'client' }, NOW);
    expect(detectConflicts(p).map((c) => c.code)).toEqual(['BUDGET']);
    const pending = buildPending(p, { inboxId: 'b', source: 'client email', createdAt: NOW })!;
    expect(pending.fixes.length).toBeGreaterThan(0);
    const a = pending.fixes[0];
    expect(a.kind).toBe('BUDGET_PLAN');
    expect(a.changesCreative).toBe(false);
    expect(computeBudget(a.plan).total).toBeLessThanOrEqual(4400);
    expect(detectConflicts(a.plan)).toEqual([]);
    expect(a.levers!.length).toBeGreaterThan(0);
    const sum = a.levers!.reduce((s, l) => s + l.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(Math.round((computeBudget(a.plan).total - computeBudget(p).total) * 100) / 100);
    const r = receipt(pending, a, '2026-11-21T08:00:05.000Z');
    expect(r.saved).toBeGreaterThan(0);
  });

  test('deep cut to 3500 can only be met by changing must-keep items, and says which', () => {
    const p = applyUpdate(makeSeed(), { kind: 'cap', cap: 3500, source: 'client' }, NOW);
    const fixes = proposeBudgetFixes(p);
    expect(fixes.length).toBeGreaterThan(0);
    for (const f of fixes) {
      expect(computeBudget(f.plan).total).toBeLessThanOrEqual(3500);
      expect(detectConflicts(f.plan)).toEqual([]);
    }
    const best = fixes[0];
    if (best.changesCreative) expect(best.detail).toMatch(/^Breaks:/);
  });

  test('timing fixes carry DNA results; swap order keeps every must-keep item', () => {
    const p = applyUpdate(makeSeed(), { kind: 'travel', personId: 'ieva', arriveMin: 645, source: 'x' }, NOW);
    const pending = buildPending(p, { inboxId: 'x', source: 'x', createdAt: NOW })!;
    const swap = pending.fixes.find((f) => f.kind === 'SWAP_ORDER')!;
    expect(dnaViolations(swap.dna!)).toEqual([]);
  });

  test('photographer can’t make it -> swap to shortlist photographer', () => {
    const s = makeSeed();
    const p = applyUpdate(s, lateUpdate(s, 'tomas', 'unavailable'), NOW);
    const pending = buildPending(p, { inboxId: 'u', source: 'Tomas', createdAt: NOW })!;
    expect(pending.conflicts[0].code).toBe('UNAVAILABLE');
    const f = pending.fixes.find((x) => x.kind === 'SWAP_TALENT')!;
    expect(f.plan.people.find((x) => x.role === 'photographer')?.id).toBe('ruta');
  });
});
