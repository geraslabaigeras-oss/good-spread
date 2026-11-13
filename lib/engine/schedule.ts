import type { Block, BlockKind, Person, Production } from '@/lib/types';

export function person(p: Production, id: string): Person | undefined {
  return p.people.find((x) => x.id === id) ?? p.shortlist.find((x) => x.id === id);
}

export function blocksFor(p: Production, personId: string): Block[] {
  return p.blocks.filter((b) => b.personIds.includes(personId)).sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
}

/** Start of that person's earliest block, or null when they have none. */
export function callTime(p: Production, personId: string): number | null {
  const bs = blocksFor(p, personId);
  return bs.length ? bs[0].startMin : null;
}

export function lastEnd(p: Production, personId: string): number | null {
  const bs = blocksFor(p, personId);
  return bs.length ? Math.max(...bs.map((b) => b.endMin)) : null;
}

export function travelReady(p: Production, personId: string): number {
  const t = p.travel.find((x) => x.personId === personId);
  return t ? t.arriveMin + t.transferMin : 0;
}

export function lateReady(p: Production, personId: string): number {
  const ls = p.late.filter((x) => x.personId === personId);
  return ls.length ? Math.max(...ls.map((l) => l.readyMin)) : 0;
}

/** max(arrival + transfer if travelling, late.readyMin if reported, 0). */
export function readyAt(p: Production, personId: string): number {
  return Math.max(travelReady(p, personId), lateReady(p, personId), 0);
}

export const KIND_LABEL: Record<BlockKind, string> = {
  setup: 'setup',
  hmu: 'hair and makeup',
  shoot: 'shoot',
  lunch: 'lunch',
  wrap: 'wrap',
};

export function firstName(name: string): string {
  return name.split(/[\s(]/)[0];
}

export function modelsIn(p: Production, b: Block, excludeId?: string): Person[] {
  return b.personIds
    .filter((id) => id !== excludeId)
    .map((id) => person(p, id))
    .filter((x): x is Person => !!x && x.role === 'model');
}
