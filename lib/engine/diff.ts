import type { Block, Change, Production, Role } from '@/lib/types';
import { fmt } from './time';
import { blocksFor, callTime, firstName, KIND_LABEL, lastEnd, modelsIn, person } from './schedule';

const VERB: Partial<Record<Role, string>> = { mua: 'do', photographer: 'shoot', stylist: 'dress' };

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinList(xs: string[]): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

/** Models this person works with, in time order (hmu/shoot only), e.g. ["Marta at 09:00", "Ieva at 11:30"]. */
function modelOrder(p: Production, personId: string): string[] {
  const out: string[] = [];
  let lastName = '';
  for (const b of blocksFor(p, personId)) {
    if (b.kind !== 'hmu' && b.kind !== 'shoot') continue;
    for (const m of modelsIn(p, b, personId)) {
      const n = firstName(m.name);
      if (n === lastName) continue;
      out.push(`${n} at ${fmt(b.startMin)}`);
      lastName = n;
    }
  }
  return out;
}

function others(b: Block, selfId: string): string {
  return b.personIds.filter((x) => x !== selfId).sort().join(',');
}

function blockChanged(before: Production, a: Block, selfId: string): Block | null | 'new' {
  const b = before.blocks.find((x) => x.id === a.id && x.personIds.includes(selfId));
  if (!b) return 'new';
  if (b.startMin !== a.startMin || b.endMin !== a.endMin || others(b, selfId) !== others(a, selfId)) return b;
  return null;
}

function blockLabel(p: Production, b: Block, selfId: string): string {
  const models = modelsIn(p, b, selfId).map((m) => firstName(m.name));
  return models.length && (b.kind === 'hmu' || b.kind === 'shoot')
    ? `${KIND_LABEL[b.kind]} with ${joinList(models)}`
    : KIND_LABEL[b.kind];
}

function scheduleText(before: Production, after: Production, id: string): string {
  const role = person(after, id)?.role;
  const orderB = modelOrder(before, id).map((s) => s.split(' at ')[0]).join('>');
  const orderA = modelOrder(after, id);
  if (role && role !== 'model' && orderA.length && orderB !== orderA.map((s) => s.split(' at ')[0]).join('>')) {
    return `Order changed: you now ${VERB[role] ?? 'work with'} ${joinList(orderA)}.`;
  }
  const blocksA = blocksFor(after, id);
  const changed = blocksA
    .map((a) => ({ a, b: blockChanged(before, a, id) }))
    .filter((x) => x.b !== null);
  const pick = changed.find((x) => x.a.kind === 'hmu' || x.a.kind === 'shoot') ?? changed[0];
  let text = 'Your schedule changed.';
  if (pick) {
    const label = cap(blockLabel(after, pick.a, id));
    text = pick.b === 'new' || pick.b === null || pick.b.startMin === pick.a.startMin
      ? `${label} now ${fmt(pick.a.startMin)}–${fmt(pick.a.endMin)}.`
      : `${label} moved ${fmt(pick.b.startMin)} → ${fmt(pick.a.startMin)}.`;
  }
  const eb = lastEnd(before, id);
  const ea = lastEnd(after, id);
  if (eb != null && ea != null && eb !== ea) text += ` You finish ${fmt(ea)} (was ${fmt(eb)}).`;
  return text;
}

/** One change per non-producer person whose day differs between the two plans. */
export function diffPeople(before: Production, after: Production): Change[] {
  const ids = Array.from(new Set([...before.people, ...after.people].map((x) => x.id)));
  const out: Change[] = [];
  for (const id of ids) {
    const who = person(after, id) ?? person(before, id);
    if (!who || who.role === 'producer') continue;
    const inB = before.people.some((x) => x.id === id);
    const inA = after.people.some((x) => x.id === id);
    if (inB && !inA) {
      out.push({ personId: id, kind: 'replaced', text: 'You are released from this shoot. The producer will call you.' });
      continue;
    }
    const ca = callTime(after, id);
    if (!inB && inA) {
      out.push({ personId: id, kind: 'call_time', after: ca != null ? fmt(ca) : undefined, text: `You're booked: call ${ca != null ? fmt(ca) : 'TBC'}.` });
      continue;
    }
    const cb = callTime(before, id);
    if (cb !== ca) {
      const b = cb != null ? fmt(cb) : '—';
      const a = ca != null ? fmt(ca) : '—';
      out.push({ personId: id, kind: 'call_time', before: b, after: a, text: `Your call moved ${b} → ${a}.` });
      continue;
    }
    const bA = blocksFor(after, id);
    const bB = blocksFor(before, id);
    const changed = bA.length !== bB.length || bA.some((a) => blockChanged(before, a, id) !== null);
    if (changed) out.push({ personId: id, kind: 'schedule', text: scheduleText(before, after, id) });
  }
  return out;
}
