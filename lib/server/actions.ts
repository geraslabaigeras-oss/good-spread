import 'server-only';
import type { Production } from '@/lib/types';
import { applyUpdate, buildPending, detectConflicts, fmt, person, receipt, type Update } from '@/lib/engine';
import { getProduction, insertRevision, logEvent, saveProduction, viewersFor, type ProdRow } from './db';
import { sendSms, smsText } from './sms';

/** Apply a fact (travel/late) to the plan, then detect conflicts and save a pending decision. */
export async function applyFact(row: ProdRow, u: Update, opts: { inboxId: string; source: string }) {
  const now = new Date().toISOString();
  const p: Production = applyUpdate(row.data, u, now);
  const pending = buildPending(p, { inboxId: opts.inboxId, source: opts.source, createdAt: now });
  p.pending = pending;
  await saveProduction(row.id, p);
  if (pending) {
    await logEvent(row.id, 'conflict', {
      text: pending.conflicts.map((c) => c.message).join('; '),
      fixes: pending.fixes.map((f) => f.label),
    });
  }
  return { production: p, pending, conflicts: detectConflicts(p) };
}

export function describeUpdate(p: Production, u: Update): string {
  if (u.kind === 'log') return u.text;
  const who = person(p, u.personId)?.name ?? u.personId;
  if (u.kind === 'travel') {
    const prev = p.travel.find((t) => t.personId === u.personId);
    const num = u.number ?? prev?.number;
    return `${who}${num ? `, ${num}` : ''}, lands ${fmt(u.arriveMin)}${prev ? ` (was ${fmt(prev.arriveMin)})` : ''}`;
  }
  return u.readyMin >= 99999 ? `${who} can't make it` : `${who} ready ${fmt(u.readyMin)}`;
}

/** Producer approves a fix: new version, revision + receipt, SMS to opted-in viewers of affected people. */
export async function approveFix(slug: string, fixId: string) {
  const row = await getProduction(slug);
  if (!row) return { error: 'not_found' as const };
  const p = row.data;
  const pending = p.pending;
  if (!pending) return { error: 'no_pending' as const };
  const fix = pending.fixes.find((f) => f.id === fixId);
  if (!fix) return { error: 'unknown_fix' as const };

  const approvedAt = new Date().toISOString();
  const next: Production = structuredClone(fix.plan);
  next.id = p.id;
  next.slug = p.slug;
  next.version = p.version + 1;
  next.pending = null;
  const rcpt = receipt(pending, fix, approvedAt);

  await saveProduction(row.id, next);
  await insertRevision(row.id, next.version, fix.kind, fix.changes, { ...rcpt, label: fix.label });
  await logEvent(row.id, 'approved', { text: `Approved "${fix.label}" → v${next.version}, ${fix.changes.length} people updated`, fixKind: fix.kind, receipt: rcpt });

  return { row, next, fix, receipt: rcpt };
}

/** Runs after the approve response is sent; never throws. */
export async function notifyAffected(rowId: string, p: Production, changes: { personId: string; text: string }[]) {
  try {
    const viewers = await viewersFor(rowId);
    const targets = viewers.filter((v) => v.phone && changes.some((c) => c.personId === v.person_id));
    let sent = 0;
    let skipped = 0;
    let reason = '';
    await Promise.all(
      targets.map(async (v) => {
        const c = changes.find((x) => x.personId === v.person_id)!;
        const name = person(p, v.person_id)?.name ?? '';
        const r = await sendSms(v.phone!, smsText(name, c.text, v.token));
        if (r.ok) sent++;
        else {
          skipped++;
          reason = r.reason;
        }
      }),
    );
    if (sent) await logEvent(rowId, 'sms_sent', { text: `SMS sent to ${sent} phone${sent === 1 ? '' : 's'}` });
    if (skipped) await logEvent(rowId, 'sms_skipped', { text: `SMS skipped for ${skipped} (${reason})` });
  } catch (e) {
    console.error('notify failed', e);
  }
}
