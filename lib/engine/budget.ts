import type { BudgetLine, BudgetSummary, Category, OvertimeLine, Production } from '@/lib/types';
import { ceil15 } from './time';
import { lastEnd } from './schedule';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Per person: minutes their last block ends past bookedUntilMin, rounded up to 15, × OT rate.
 * Plus studio minutes past bookedUntilMin × studio rate.
 */
export function computeOvertime(p: Production): OvertimeLine[] {
  const out: OvertimeLine[] = [];
  const booked = p.studio.bookedUntilMin;
  for (const person of p.people) {
    if (person.otRatePerHour <= 0) continue;
    const end = lastEnd(p, person.id);
    if (end == null || end <= booked) continue;
    const minutes = ceil15(end - booked);
    out.push({
      label: `Overtime ${person.name}, ${minutes} min`,
      personId: person.id,
      minutes,
      amount: round2((minutes / 60) * person.otRatePerHour),
    });
  }
  const latest = p.blocks.length ? Math.max(...p.blocks.map((b) => b.endMin)) : 0;
  if (latest > booked) {
    const minutes = ceil15(latest - booked);
    out.push({ label: `Studio extra, ${minutes} min`, minutes, amount: round2((minutes / 60) * p.studio.hourlyRate) });
  }
  return out;
}

export function overtimeTotal(p: Production): number {
  return round2(computeOvertime(p).reduce((s, l) => s + l.amount, 0));
}

/** Committed spend: stored items + agency fees + overtime (contingency excluded). */
export function spend(p: Production): number {
  return computeBudget(p).subtotal;
}

export function agencyFeeLines(p: Production): BudgetLine[] {
  const out: BudgetLine[] = [];
  for (const person of p.people) {
    if (!person.agency || !person.commissionPct) continue;
    out.push({
      id: `fee-${person.id}`,
      category: 'talent',
      label: `Agency fee ${person.commissionPct}% (estimate), ${person.name}`,
      amount: round2((person.dayRate * (p.shootDays ?? 1) * person.commissionPct) / 100),
      source: 'estimate',
      personId: person.id,
    });
  }
  return out;
}

/**
 * Contingency is a reserve: overtime draws it down first.
 * total = base + overtime + max(0, reserve - overtime). See NOTES.md.
 */
export function computeBudget(p: Production): BudgetSummary {
  const lines: BudgetLine[] = p.budget.items.map((i) => ({
    id: i.id, category: i.category, label: i.label, amount: round2(i.qty * i.rate), source: i.source, personId: i.personId,
  }));
  lines.push(...agencyFeeLines(p));
  const base = round2(lines.reduce((s, l) => s + l.amount, 0));

  const roleCat = (personId?: string): Category => {
    if (!personId) return 'studio';
    const r = p.people.find((x) => x.id === personId)?.role;
    return r === 'model' ? 'talent' : 'crew';
  };
  const ot = computeOvertime(p);
  for (const l of ot) {
    lines.push({
      id: `ot-${l.personId ?? 'studio'}`, category: roleCat(l.personId), label: l.label, amount: l.amount,
      source: 'computed', personId: l.personId, overtime: true,
    });
  }
  const overtime = round2(ot.reduce((s, l) => s + l.amount, 0));
  const subtotal = round2(base + overtime);
  const contingencyReserve = round2((base * p.budget.contingencyPct) / 100);
  const contingency = round2(Math.max(0, contingencyReserve - overtime));
  const total = round2(subtotal + contingency);

  const byCategory: Record<Category, number> = { talent: 0, crew: 0, studio: 0, travel: 0, post: 0, usage: 0 };
  for (const l of lines) byCategory[l.category] = round2(byCategory[l.category] + l.amount);

  return { lines, base, overtime, subtotal, contingencyReserve, contingency, total, cap: p.budget.cap, remaining: round2(p.budget.cap - total), byCategory };
}
