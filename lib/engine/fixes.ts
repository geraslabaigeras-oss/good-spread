import type { Conflict, Fix, FixKind, Pending, Person, Production } from '@/lib/types';
import { ceil15, fmt, UNAVAILABLE_MIN } from './time';
import { blocksFor, callTime, firstName, person, readyAt } from './schedule';
import { spend } from './budget';
import { detectConflicts, isTimingConflict } from './conflicts';
import { diffPeople } from './diff';

const round2 = (n: number) => Math.round(n * 100) / 100;
const clone = <T,>(x: T): T => structuredClone(x);

function base(p: Production): Production {
  const c = clone(p);
  c.pending = null;
  return c;
}

/** Swap two people in all their hmu/shoot blocks, and swap their look ids. */
export function swapOrder(p: Production, aId: string, bId: string): Production {
  const plan = base(p);
  const shootsA = blocksFor(plan, aId).filter((b) => b.kind === 'shoot' && !b.personIds.includes(bId));
  const shootsB = blocksFor(plan, bId).filter((b) => b.kind === 'shoot' && !b.personIds.includes(aId));
  for (let i = 0; i < Math.min(shootsA.length, shootsB.length); i++) {
    const t = shootsA[i].lookIds;
    shootsA[i].lookIds = shootsB[i].lookIds;
    shootsB[i].lookIds = t;
  }
  for (const b of plan.blocks) {
    if (b.kind !== 'hmu' && b.kind !== 'shoot') continue;
    const hasA = b.personIds.includes(aId);
    const hasB = b.personIds.includes(bId);
    if (hasA === hasB) continue;
    b.personIds = b.personIds.map((x) => (x === aId ? bId : x === bId ? aId : x));
  }
  return plan;
}

/** Shift every block with startMin >= from by `by` minutes. */
export function shiftFrom(p: Production, from: number, by: number): Production {
  const plan = base(p);
  for (const b of plan.blocks) {
    if (b.startMin >= from) {
      b.startMin += by;
      b.endMin += by;
    }
  }
  return plan;
}

/** Replace a person with a shortlist person: blocks, talent line, travel lines; usage stays (relinked). */
export function swapTalent(p: Production, outId: string, incoming: Person): Production {
  const plan = base(p);
  const out = person(plan, outId)!;
  plan.people = plan.people.filter((x) => x.id !== outId).concat(clone(incoming));
  plan.shortlist = plan.shortlist.filter((x) => x.id !== incoming.id);
  plan.blocks.forEach((b) => (b.personIds = b.personIds.map((x) => (x === outId ? incoming.id : x))));
  plan.travel = plan.travel.filter((t) => t.personId !== outId);
  plan.late = plan.late.filter((l) => l.personId !== outId);
  const outFirst = firstName(out.name);
  const inFirst = firstName(incoming.name);
  plan.budget.items = plan.budget.items
    .filter((i) => !(i.personId === outId && i.category === 'travel'))
    .map((i) => {
      if (i.personId !== outId) return i;
      if (i.category === 'talent') {
        return { id: `i-${incoming.id}`, category: 'talent', label: `${incoming.name}, ${incoming.role}`, qty: 1, unit: 'day', rate: incoming.dayRate, personId: incoming.id, source: 'rate_card' };
      }
      return { ...i, personId: incoming.id, label: i.label.replace(outFirst, inFirst) };
    });
  return plan;
}

function finish(p: Production, kind: FixKind, label: string, detail: string, plan: Production, changesCreative: boolean): Fix | null {
  if (detectConflicts(plan).length > 0) return null;
  const changes = diffPeople(p, plan);
  return {
    id: kind.toLowerCase(),
    kind,
    label,
    detail,
    plan,
    costDelta: round2(spend(plan) - spend(p)),
    changesCreative,
    peopleAffected: changes.map((c) => c.personId),
    changes,
  };
}

/** Up to three full alternative plans, each re-checked; any that leave a conflict are dropped. */
export function proposeFixes(p: Production, conflict: Conflict): Fix[] {
  if (!isTimingConflict(conflict)) return [];
  const lateId = conflict.personId!;
  const late = person(p, lateId);
  const call = callTime(p, lateId);
  if (!late || call == null) return [];
  const ready = readyAt(p, lateId);
  const fixes: (Fix | null)[] = [];

  // 1. SWAP_ORDER
  if (late.role === 'model' && ready < UNAVAILABLE_MIN) {
    for (const other of p.people) {
      if (other.id === lateId || other.role !== 'model') continue;
      const oc = callTime(p, other.id);
      if (oc == null) continue;
      if (oc >= ready && readyAt(p, other.id) <= call) {
        const plan = swapOrder(p, lateId, other.id);
        const newCall = callTime(plan, lateId);
        fixes.push(finish(p, 'SWAP_ORDER', 'Swap order',
          `${firstName(other.name)} goes first, ${firstName(late.name)} from ${newCall != null ? fmt(newCall) : '—'}`, plan, false));
        break;
      }
    }
  }

  // 2. SHIFT_FROM
  if (ready < UNAVAILABLE_MIN) {
    const by = ceil15(ready - call);
    fixes.push(finish(p, 'SHIFT_FROM', `Shift from ${fmt(call)}`, `Everything from ${fmt(call)} moves +${by} min`, shiftFrom(p, call, by), false));
  }

  // 3. SWAP_TALENT
  const sub = p.shortlist.find((s) => s.role === late.role && s.local);
  if (sub) {
    fixes.push(finish(p, 'SWAP_TALENT', `Swap to ${firstName(sub.name)}`,
      `${firstName(sub.name)} (shortlist, local) replaces ${firstName(late.name)}`, swapTalent(p, lateId, sub), true));
  }

  return fixes.filter((f): f is Fix => !!f).slice(0, 3);
}

/** Non-creative first, then lowest cost, then fewest people affected. */
export function rankFixes(fixes: Fix[]): Fix[] {
  return [...fixes].sort(
    (a, b) =>
      Number(a.changesCreative) - Number(b.changesCreative) ||
      a.costDelta - b.costDelta ||
      a.peopleAffected.length - b.peopleAffected.length,
  );
}

/** Detect conflicts on a plan and build the pending decision for the producer. Null when clean. */
export function buildPending(p: Production, opts: { inboxId: string; source: string; createdAt: string }): Pending | null {
  const conflicts = detectConflicts(p);
  if (!conflicts.length) return null;
  const target = conflicts.find(isTimingConflict);
  const fixes = target ? rankFixes(proposeFixes(p, target)) : [];
  return { inboxId: opts.inboxId, createdAt: opts.createdAt, source: opts.source, conflicts, fixes, recommendedFixId: fixes[0]?.id ?? '' };
}
