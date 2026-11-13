import { describe, expect, test } from 'vitest';
import { makeSeed } from '@/data/seed';
import {
  applyUpdate, buildPending, callTime, computeBudget, computeOvertime, detectConflicts, diffPeople,
  lateUpdate, proposeFixes, rankFixes, receipt, toUpdate,
} from './index';
import type { Production } from '@/lib/types';

const NOW = '2026-11-21T08:00:00.000Z';

function flightLands1045(): Production {
  const u = toUpdate(makeSeed(), {
    type: 'flight', personName: 'IEVA DEMO',
    flight: { number: 'DA 645', from: 'MXP', to: 'VNO', departTime: '07:55', arriveTime: '10:45', date: '2026-11-21' },
    summary: 'Ieva, DA 645, lands 10:45', confidence: 0.95,
  }, 'flight_DA645_change.pdf');
  expect(u).not.toBeNull();
  return applyUpdate(makeSeed(), u!, NOW);
}

function fixesFor(p: Production) {
  const c = detectConflicts(p);
  return rankFixes(proposeFixes(p, c[0]));
}

describe('engine', () => {
  test('seed has no conflicts and budget is 4719', () => {
    const p = makeSeed();
    expect(detectConflicts(p)).toEqual([]);
    const b = computeBudget(p);
    expect(b.subtotal).toBe(4290);
    expect(b.contingency).toBe(429);
    expect(b.total).toBe(4719);
    expect(b.lines.find((l) => l.id === 'fee-ieva')?.amount).toBe(120);
    expect(computeOvertime(p)).toEqual([]);
  });

  test('flight lands 10:45 -> ARRIVAL conflict of 135 min for ieva', () => {
    const c = detectConflicts(flightLands1045());
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ code: 'ARRIVAL', personId: 'ieva', deltaMin: 135 });
  });

  test('SWAP_ORDER fixes it at €0: ieva call 11:30, marta call 09:00, zero conflicts', () => {
    const fix = fixesFor(flightLands1045()).find((f) => f.kind === 'SWAP_ORDER')!;
    expect(fix).toBeDefined();
    expect(fix.costDelta).toBe(0);
    expect(callTime(fix.plan, 'ieva')).toBe(690);
    expect(callTime(fix.plan, 'marta')).toBe(540);
    expect(detectConflicts(fix.plan)).toEqual([]);
    expect(fix.plan.blocks.find((b) => b.id === 'b-shoot-a')?.lookIds).toEqual(['L3', 'L4']);
    expect(fix.plan.blocks.find((b) => b.id === 'b-shoot-b')?.lookIds).toEqual(['L1', 'L2']);
  });

  test('SHIFT_FROM costs 535 (tomas 202.5 + lukas 101.25 + marta 96.25 + studio 135), zero conflicts', () => {
    const fix = fixesFor(flightLands1045()).find((f) => f.kind === 'SHIFT_FROM')!;
    expect(fix).toBeDefined();
    expect(fix.costDelta).toBe(535);
    const ot = computeOvertime(fix.plan);
    const by = (id?: string) => ot.find((l) => l.personId === id)?.amount;
    expect(by('tomas')).toBe(202.5);
    expect(by('lukas')).toBe(101.25);
    expect(by('marta')).toBe(96.25);
    expect(by(undefined)).toBe(135);
    expect(detectConflicts(fix.plan)).toEqual([]);
  });

  test('SWAP_TALENT replaces ieva with austeja, changesCreative true, ranked last', () => {
    const fixes = fixesFor(flightLands1045());
    expect(fixes).toHaveLength(3);
    const last = fixes[fixes.length - 1];
    expect(last.kind).toBe('SWAP_TALENT');
    expect(last.changesCreative).toBe(true);
    expect(last.plan.people.some((x) => x.id === 'ieva')).toBe(false);
    expect(last.plan.people.some((x) => x.id === 'austeja')).toBe(true);
    expect(last.plan.blocks.some((b) => b.personIds.includes('ieva'))).toBe(false);
    expect(computeBudget(last.plan).lines.some((l) => l.id === 'fee-ieva' || l.category === 'travel')).toBe(false);
    expect(detectConflicts(last.plan)).toEqual([]);
  });

  test('recommended fix is SWAP_ORDER; receipt overtimeAvoided = 535', () => {
    const pending = buildPending(flightLands1045(), { inboxId: 'x', source: 'flight.pdf', createdAt: '2026-11-21T08:00:00.000Z' })!;
    expect(pending.recommendedFixId).toBe('swap_order');
    const chosen = pending.fixes.find((f) => f.id === pending.recommendedFixId)!;
    const r = receipt(pending, chosen, '2026-11-21T08:00:07.000Z');
    expect(r).toEqual({ peopleUpdated: 5, messagesTyped: 0, overtimeAvoided: 535, fixedInSeconds: 7 });
  });

  test('after swap, ieva late +30 -> LATE conflict 30 min; SHIFT_FROM recommended; zero conflicts after', () => {
    const swapped = fixesFor(flightLands1045()).find((f) => f.kind === 'SWAP_ORDER')!.plan;
    const late = applyUpdate(swapped, lateUpdate(swapped, 'ieva', 30), NOW);
    const c = detectConflicts(late);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ code: 'LATE', personId: 'ieva', deltaMin: 30 });
    const pending = buildPending(late, { inboxId: 'y', source: 'talent', createdAt: NOW })!;
    const rec = pending.fixes.find((f) => f.id === pending.recommendedFixId)!;
    expect(rec.kind).toBe('SHIFT_FROM');
    expect(rec.label).toBe('Shift from 11:30');
    expect(rec.costDelta).toBe(97.5);
    expect(detectConflicts(rec.plan)).toEqual([]);
  });

  test('diffPeople after swap updates ieva, marta, tomas, greta, lukas (5)', () => {
    const before = flightLands1045();
    const fix = fixesFor(before).find((f) => f.kind === 'SWAP_ORDER')!;
    const changes = diffPeople(before, fix.plan);
    expect(changes.map((c) => c.personId).sort()).toEqual(['greta', 'ieva', 'lukas', 'marta', 'tomas']);
    expect(changes.find((c) => c.personId === 'ieva')?.text).toBe('Your call moved 09:00 → 11:30.');
    expect(changes.find((c) => c.personId === 'marta')?.text).toBe('Your call moved 11:30 → 09:00.');
    expect(changes.find((c) => c.personId === 'greta')?.text).toBe('Order changed: you now do Marta at 09:00 and Ieva at 11:30.');
  });

  test("can't make it -> UNAVAILABLE, only SWAP_TALENT survives", () => {
    const p = makeSeed();
    const u = applyUpdate(p, lateUpdate(p, 'ieva', 'unavailable'), NOW);
    const c = detectConflicts(u);
    expect(c[0].code).toBe('UNAVAILABLE');
    const fixes = fixesFor(u);
    expect(fixes.map((f) => f.kind)).toEqual(['SWAP_TALENT']);
  });
});
