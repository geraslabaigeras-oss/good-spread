import type { Conflict, Production } from '@/lib/types';
import { fmt, money, UNAVAILABLE_MIN } from './time';
import { blocksFor, callTime, KIND_LABEL, lateReady, readyAt, travelReady } from './schedule';
import { computeBudget } from './budget';

export function detectConflicts(p: Production): Conflict[] {
  const out: Conflict[] = [];

  for (const person of p.people) {
    const call = callTime(p, person.id);
    if (call == null) continue;
    const first = blocksFor(p, person.id)[0];
    const late = lateReady(p, person.id);

    if (late >= UNAVAILABLE_MIN) {
      out.push({ code: 'UNAVAILABLE', personId: person.id, blockId: first.id, deltaMin: UNAVAILABLE_MIN, message: `${person.name} can't make it today` });
      continue;
    }
    const ready = readyAt(p, person.id);
    if (ready > call) {
      const isLate = late > 0 && late >= travelReady(p, person.id);
      const delta = ready - call;
      out.push({
        code: isLate ? 'LATE' : 'ARRIVAL',
        personId: person.id,
        blockId: first.id,
        deltaMin: delta,
        message: isLate
          ? `${person.name} is running late: ready ${fmt(ready)}, called ${fmt(call)} ${KIND_LABEL[first.kind]} (+${delta} min)`
          : `${person.name} can't make ${fmt(call)} ${KIND_LABEL[first.kind]}: ready ${fmt(ready)} (+${delta} min)`,
      });
    }
  }

  // OVERLAP: the same person in two blocks that overlap in time.
  for (const person of p.people) {
    const bs = blocksFor(p, person.id);
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        if (bs[j].startMin < bs[i].endMin && bs[i].startMin < bs[j].endMin) {
          out.push({
            code: 'OVERLAP', personId: person.id, blockId: bs[j].id,
            deltaMin: Math.min(bs[i].endMin, bs[j].endMin) - bs[j].startMin,
            message: `${person.name} is double-booked: ${KIND_LABEL[bs[i].kind]} and ${KIND_LABEL[bs[j].kind]} at ${fmt(bs[j].startMin)}`,
          });
        }
      }
    }
  }

  for (const b of p.blocks) {
    if (b.startMin < p.studio.opensMin || b.endMin > p.studio.closesMin) {
      const delta = Math.max(p.studio.opensMin - b.startMin, b.endMin - p.studio.closesMin);
      out.push({
        code: 'STUDIO_HOURS', blockId: b.id, deltaMin: delta,
        message: `${KIND_LABEL[b.kind]} ${fmt(b.startMin)}–${fmt(b.endMin)} is outside studio hours ${fmt(p.studio.opensMin)}–${fmt(p.studio.closesMin)}`,
      });
    }
  }

  const budget = computeBudget(p);
  if (budget.total > budget.cap) {
    out.push({ code: 'BUDGET', deltaMin: 0, message: `Budget ${money(budget.total)} is over the ${money(budget.cap)} cap` });
  }
  return out;
}

/** Conflicts we know how to fix by moving people or time. */
export function isTimingConflict(c: Conflict): boolean {
  return (c.code === 'ARRIVAL' || c.code === 'LATE' || c.code === 'UNAVAILABLE') && !!c.personId;
}
