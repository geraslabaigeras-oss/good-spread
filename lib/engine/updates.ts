import type { Person, Production } from '@/lib/types';
import { parseHHMM, UNAVAILABLE_MIN } from './time';
import { callTime } from './schedule';

/** Shape returned by the AI `record_update` tool (facts only). */
export type Extraction = {
  type: 'flight' | 'delay' | 'booking' | 'quote' | 'budget' | 'unknown';
  personName?: string | null;
  flight?: { number?: string | null; from?: string | null; to?: string | null; departTime?: string | null; arriveTime?: string | null; date?: string | null } | null;
  delay?: { newEtaTime?: string | null; reason?: string | null } | null;
  budget?: { newCap?: number | null; note?: string | null } | null;
  summary: string;
  confidence: number;
};

/** Deterministic update derived from an extraction (or the manual form). */
export type Update =
  | { kind: 'travel'; personId: string; arriveMin: number; departMin?: number; number?: string; from?: string; to?: string; source: string }
  | { kind: 'late'; personId: string; readyMin: number; source: string }
  | { kind: 'cap'; cap: number; source: string }
  | { kind: 'log'; source: string; text: string };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Case-insensitive, accent-insensitive; first-name match is enough. */
export function matchPerson(p: Production, name: string | null | undefined): Person | undefined {
  if (!name) return undefined;
  const n = norm(name);
  const tokens = n.split(/[\s,./]+/).filter(Boolean);
  return (
    p.people.find((x) => norm(x.name) === n) ??
    p.people.find((x) => x.role !== 'producer' && tokens.includes(norm(x.name).split(/[\s(]/)[0])) ??
    p.people.find((x) => x.role !== 'producer' && n.includes(norm(x.name).split(/[\s(]/)[0]))
  );
}

/** Turn what the AI read into a concrete update. Returns null when it can't be applied. */
export function toUpdate(p: Production, ex: Extraction, source: string): Update | null {
  if (ex.type === 'booking' || ex.type === 'quote') return { kind: 'log', source, text: ex.summary };
  if (ex.type === 'budget') {
    const cap = Number(ex.budget?.newCap);
    return Number.isFinite(cap) && cap > 0 ? { kind: 'cap', cap: Math.round(cap), source } : null;
  }
  const who = matchPerson(p, ex.personName);
  if (!who) return null;
  if (ex.type === 'flight') {
    const arrive = parseHHMM(ex.flight?.arriveTime);
    if (arrive == null) return null;
    const depart = parseHHMM(ex.flight?.departTime);
    return {
      kind: 'travel', personId: who.id, arriveMin: arrive, departMin: depart ?? undefined,
      number: ex.flight?.number ?? undefined, from: ex.flight?.from ?? undefined, to: ex.flight?.to ?? undefined, source,
    };
  }
  if (ex.type === 'delay') {
    const eta = parseHHMM(ex.delay?.newEtaTime);
    if (eta == null) return null;
    return manualUpdate(p, who.id, eta, source);
  }
  return null;
}

/** Manual form / delay: travelling people get a new arrival, locals get a Late. */
export function manualUpdate(p: Production, personId: string, min: number, source: string): Update {
  const travelling = p.travel.some((t) => t.personId === personId);
  return travelling ? { kind: 'travel', personId, arriveMin: min, source } : { kind: 'late', personId, readyMin: min, source };
}

/** Talent self-report: readyMin = callTime + minutes, or UNAVAILABLE. */
export function lateUpdate(p: Production, personId: string, minutes: number | 'unavailable'): Update {
  const call = callTime(p, personId) ?? 0;
  return { kind: 'late', personId, readyMin: minutes === 'unavailable' ? UNAVAILABLE_MIN : call + minutes, source: 'talent' };
}

export function applyUpdate(p: Production, u: Update, nowISO: string): Production {
  const next = structuredClone(p);
  next.pending = null;
  if (u.kind === 'travel') {
    const prev = next.travel.find((t) => t.personId === u.personId);
    const t = {
      personId: u.personId,
      mode: prev?.mode ?? 'flight',
      number: u.number ?? prev?.number ?? '',
      from: u.from ?? prev?.from ?? '',
      to: u.to ?? prev?.to ?? '',
      departMin: u.departMin ?? prev?.departMin ?? 0,
      arriveMin: u.arriveMin,
      transferMin: prev?.transferMin ?? 30,
      source: u.source,
    } as const;
    next.travel = next.travel.filter((x) => x.personId !== u.personId).concat({ ...t });
  } else if (u.kind === 'cap') {
    next.budget.cap = u.cap;
  } else if (u.kind === 'late') {
    next.late = next.late.filter((x) => x.personId !== u.personId).concat({ personId: u.personId, readyMin: u.readyMin, reportedAt: nowISO });
  }
  return next;
}
