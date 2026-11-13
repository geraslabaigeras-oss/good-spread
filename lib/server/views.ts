import 'server-only';
import type { Block, Change, Fix, Pending, Production, Role } from '@/lib/types';
import {
  blocksFor, callTime, computeBudget, detectConflicts, firstName, fmt, KIND_LABEL, lastEnd, modelsIn, person, readyAt, travelReady,
} from '@/lib/engine';
import { ackedViewerIds, getOrSeed, getProductionById, recentEvents, revisions, viewerByToken, viewersFor, type ProdRow } from './db';

export type PublicFix = Omit<Fix, 'plan'> & { blocks: Block[] };
export type PublicPending = Omit<Pending, 'fixes'> & { fixes: PublicFix[] };

export function publicPending(p: Pending | null | undefined): PublicPending | null {
  if (!p) return null;
  return { ...p, fixes: p.fixes.map(({ plan, ...f }) => ({ ...f, blocks: plan.blocks })) };
}

export type PersonStatus = 'seen' | 'not_seen' | 'no_device';

export async function boardState(slug: string) {
  const row = await getOrSeed(slug);
  if (!row) return null;
  const p = row.data;
  const [viewers, events, revs] = await Promise.all([viewersFor(row.id), recentEvents(row.id, 20), revisions(row.id, 1)]);
  const acked = await ackedViewerIds(viewers.map((v) => v.id), p.version);

  const people = p.people.map((x) => {
    const vs = viewers.filter((v) => v.person_id === x.id);
    const seenBy = vs.filter((v) => acked.has(v.id)).length;
    const status: PersonStatus = x.role === 'producer' ? 'seen' : !vs.length ? 'no_device' : seenBy ? 'seen' : 'not_seen';
    const call = callTime(p, x.id);
    return { id: x.id, name: x.name, role: x.role, call: call != null ? fmt(call) : null, devices: vs.length, seenBy, status };
  });

  return {
    production: p,
    rowId: row.id,
    budget: computeBudget(p),
    conflicts: detectConflicts(p),
    pending: publicPending(p.pending),
    people,
    viewerCount: viewers.length,
    events,
    lastRevision: revs[0] ?? null,
    serverTime: new Date().toISOString(),
  };
}

export type BoardState = NonNullable<Awaited<ReturnType<typeof boardState>>>;

const ROLE_LABEL: Record<Role, string> = { producer: 'Producer', model: 'Model', photographer: 'Photographer', mua: 'Hair and makeup', stylist: 'Stylist' };
export function roleLabel(r: Role) {
  return ROLE_LABEL[r];
}

function blockText(p: Production, b: Block, selfId: string): string {
  const models = modelsIn(p, b, selfId).map((m) => firstName(m.name));
  const base = KIND_LABEL[b.kind].charAt(0).toUpperCase() + KIND_LABEL[b.kind].slice(1);
  return models.length && (b.kind === 'hmu' || b.kind === 'shoot') ? `${base} · ${models.join(', ')}` : base;
}

/** Talent "my day" view model. Never includes money. */
export async function meState(token: string) {
  const viewer = await viewerByToken(token);
  if (!viewer) return null;
  const row: ProdRow | null = await getProductionById(viewer.production_id);
  if (!row) return null;
  const p = row.data;
  const who = person(p, viewer.person_id);
  const onShoot = p.people.some((x) => x.id === viewer.person_id);
  const [revs, acked] = await Promise.all([revisions(row.id, 20), ackedViewerIds([viewer.id], p.version)]);

  let lastChange: (Change & { version: number; at: string }) | null = null;
  for (const r of revs) {
    const c = r.changes.find((x) => x.personId === viewer.person_id);
    if (c) {
      lastChange = { ...c, version: r.version, at: r.created_at };
      break;
    }
  }
  const changedNow = !!lastChange && lastChange.version === p.version;

  const call = callTime(p, viewer.person_id);
  const t = p.travel.find((x) => x.personId === viewer.person_id);
  const mine = blocksFor(p, viewer.person_id);
  const lookIds = Array.from(new Set(mine.flatMap((b) => (b.kind === 'shoot' && who?.role === 'model' ? b.lookIds ?? [] : []))));
  const lateEntry = p.late.find((l) => l.personId === viewer.person_id);

  return {
    token,
    slug: p.slug,
    title: p.title,
    dateISO: p.dateISO,
    version: p.version,
    acked: acked.has(viewer.id),
    released: !onShoot,
    person: who ? { id: who.id, name: who.name, role: who.role, roleLabel: roleLabel(who.role) } : null,
    call: call != null ? fmt(call) : null,
    oldCall: changedNow && lastChange?.kind === 'call_time' ? lastChange.before ?? null : null,
    updatedBadge: changedNow && !acked.has(viewer.id) ? fmt(minutesOfDay(lastChange!.at)) : null,
    lastChange,
    changedNow,
    travel: t ? { mode: t.mode, number: t.number, from: t.from, lands: fmt(t.arriveMin), transferMin: t.transferMin, ready: fmt(travelReady(p, viewer.person_id)) } : null,
    leaveBy: !t && call != null ? fmt(call - 30) : null,
    readyAt: fmt(readyAt(p, viewer.person_id)),
    lateReported: lateEntry ? (lateEntry.readyMin >= 99999 ? 'unavailable' : fmt(lateEntry.readyMin)) : null,
    finish: lastEnd(p, viewer.person_id) != null ? fmt(lastEnd(p, viewer.person_id)!) : null,
    studio: { name: p.studio.name, address: p.studio.address, mapsUrl: p.studio.mapsUrl },
    schedule: mine.map((b) => ({ id: b.id, start: fmt(b.startMin), end: fmt(b.endMin), text: blockText(p, b, viewer.person_id) })),
    looks: p.looks.filter((l) => lookIds.includes(l.id)).map((l) => ({ id: l.id, name: l.name, garment: l.garment })),
    team: p.people.filter((x) => x.id !== viewer.person_id && x.role !== 'producer').map((x) => ({ name: x.name, role: roleLabel(x.role) })),
    pendingDecision: !!p.pending,
  };
}

export type MeState = NonNullable<Awaited<ReturnType<typeof meState>>>;

/** ISO timestamp -> minutes of day in Europe/Vilnius. */
export function minutesOfDay(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const h = Number(parts.find((x) => x.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((x) => x.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}
