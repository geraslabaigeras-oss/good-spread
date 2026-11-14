'use client';

import useSWR from 'swr';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import type { BoardState, PublicPending } from '@/lib/server/views';
import type { Change, Receipt } from '@/lib/types';
import { fmtDate, fmtEur } from '@/lib/format';
import { useReveal, APPROVE } from '@/lib/motion';
import { ToastProvider, useToast, Wordmark } from '@/components/kit';
import { Stage } from '@/components/glass/Stage';
import { PeopleStrip } from './PeopleStrip';
import { Timeline } from './Timeline';
import { Decision } from './Decision';
import { Inbox } from './Inbox';
import { BudgetPanel } from './BudgetPanel';
import { Activity } from './Activity';
import { FlightCard } from './FlightCard';
import { LiveRadar, callsignFor } from './LiveRadar';
import { IATA, type City } from '@/data/catalog';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';
const ROLE_NAME: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Make-up', stylist: 'Stylist', producer: 'Producer' };
const CAT_NAME: Record<string, string> = { talent: 'Talent', crew: 'Crew', studio: 'Location', travel: 'Travel', post: 'Post', usage: 'Usage' };

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export type Approving = { fixId: string; x: number; y: number; pending: PublicPending };
export type Applied = { version: number; label: string; receipt: Receipt; at: string; changedIds?: string[]; changes?: Change[] };

export function Board({ slug }: { slug: string }) {
  return (
    <Stage voice={false}>
      <ToastProvider position="bottom-right">
        <BoardInner slug={slug} />
      </ToastProvider>
    </Stage>
  );
}

function BoardInner({ slug }: { slug: string }) {
  const { data, error, mutate } = useSWR<BoardState>(`/api/state/${slug}`, fetcher, { refreshInterval: 2000 });
  const toast = useToast();
  const { parent, item } = useReveal();
  const [approving, setApproving] = useState<Approving | null>(null);
  const [justApproved, setJustApproved] = useState<Applied | null>(null);
  const busy = useRef(false);

  /** Runs a call; after 3 s without an answer, says so (DESIGN §4.2). */
  const slow = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const t = setTimeout(() => toast('Still working…'), 3000);
    try {
      return await fn();
    } finally {
      clearTimeout(t);
    }
  }, [toast]);

  const approve = useCallback(
    async (fixId: string, x: number, y: number) => {
      if (busy.current || !data?.pending) return;
      busy.current = true;
      const frozen = data.pending;
      try {
        const r = await slow(() =>
          fetch('/api/fixes/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, fixId }) }),
        );
        const j = await r.json();
        if (!r.ok) {
          toast(`Could not approve: ${j.error ?? r.status}`);
          await mutate();
          return;
        }
        // t = 0 of the approve sequence (DESIGN §5.6)
        setApproving({ fixId, x, y, pending: frozen });
        setJustApproved({ version: j.version, label: j.label, receipt: j.receipt, at: new Date().toISOString(), changedIds: (j.changes ?? []).map((c: { personId: string }) => c.personId), changes: j.changes ?? [] });
        mutate();
        setTimeout(() => setApproving(null), APPROVE.slotSwap);
      } finally {
        busy.current = false;
      }
    },
    [data?.pending, slug, mutate, toast, slow],
  );

  const reset = useCallback(
    async (full: boolean) => {
      const ok = full
        ? confirm('Full reset: restore the seed and delete every joined device and phone number?')
        : confirm('Reset the plan to the seed? Joined devices stay. (Shift-click Reset for a full reset.)');
      if (!ok) return;
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full, slug }) });
      setJustApproved(null);
      setApproving(null);
      await mutate();
      toast(full ? 'Board reset · devices removed' : 'Board reset', { check: true });
    },
    [mutate, toast, slug],
  );

  if (!data) {
    if (error && String(error.message).includes('404')) {
      try { if (localStorage.getItem('gs-last-slug') === slug) localStorage.removeItem('gs-last-slug'); } catch {}
      return (
        <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
          <p className="text-[22px] font-medium">This shoot isn&rsquo;t here</p>
          <p className="mt-2 max-w-sm text-[15px] text-grey-1">It was created somewhere else or has been removed. Start a new shoot from a reference, or open the sample shoot.</p>
          <div className="mt-6 flex gap-3">
            <a href="/new" className="g-btn">Start a shoot</a>
            <a href="/board/jacket-campaign" className="g-btn-ghost">Open the sample</a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-dvh items-center justify-center text-grey-1">
        {error ? `Could not load the board: ${String(error.message)}` : 'Loading production…'}
      </div>
    );
  }

  const p = data.production;
  const rev = data.lastRevision;
  const applied: Applied | null =
    justApproved && justApproved.version === p.version
      ? justApproved
      : rev?.receipt && rev.version === p.version
        ? { version: rev.version, label: rev.receipt.label ?? rev.fix_kind ?? '', receipt: rev.receipt, at: rev.created_at, changes: rev.changes }
        : null;
  const animateVersion = justApproved?.version === p.version ? p.version : null;

  const team = data.people.filter((x) => x.role !== 'producer');
  const b = data.budget;
  const airport = p.travel[0]?.to ?? IATA[(p.city ?? 'Vilnius') as City] ?? 'VNO';
  const watch = p.travel.map((t) => ({ callsign: callsignFor(t.number), label: `${p.people.find((x) => x.id === t.personId)?.name ?? ''}, ${t.number}` })).filter((w): w is { callsign: string; label: string } => !!w.callsign);
  const changes: Change[] = applied?.changes ?? [];
  const changedBy = new Map(changes.map((c) => [c.personId, c]));
  const nameOf = (id: string) => p.people.find((x) => x.id === id)?.name ?? id;
  const roleOf = (id: string) => ROLE_NAME[p.people.find((x) => x.id === id)?.role ?? ''] ?? '';
  const dateLabel = new Date(`${p.dateISO}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const conflict = data.pending?.conflicts[0];
  const headline = data.pending && conflict ? `${conflict.message}. Pick a fix below.`
    : applied ? `Plan adapted: ${applied.label.charAt(0).toLowerCase()}${applied.label.slice(1)}.`
    : 'Everything is on schedule.';
  const smsSent = data.events.some((e) => e.type === 'sms_sent');

  // Day schedule: each person's call, plus flight landings, in time order; "was" when the last change moved it
  type Row = { at: number; text: string; where: string; was?: string; kind: 'call' | 'land' };
  const rows: Row[] = [
    ...team.map((x) => {
      const call = callTime(p, x.id);
      const c = changedBy.get(x.id);
      return call == null ? null : { at: call, text: `${x.name} call · ${ROLE_NAME[x.role]?.toLowerCase() ?? x.role}`, where: p.studio.name.split(',')[0], was: c?.kind === 'call_time' ? c.before : undefined, kind: 'call' as const };
    }).filter((r): r is NonNullable<typeof r> => !!r),
    ...p.travel.map((t) => ({ at: t.arriveMin, text: `${t.number} lands · ${nameOf(t.personId)}`, where: t.to, was: t.scheduledArriveMin != null && t.scheduledArriveMin !== t.arriveMin ? fmt(t.scheduledArriveMin) : undefined, kind: 'land' as const })),
  ].sort((a, z) => a.at - z.at);

  const NAV = [
    ['plan', 'Plan', changes.length ? `${changes.length} changes` : ''],
    ['team', 'Team', String(team.length)],
    ['schedule', 'Day', ''],
    ['budget', 'Budget', ''],
    ['inbox', 'Updates', ''],
  ] as const;

  return (
    <div className="board-dark flex min-h-dvh">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-black/[0.06] bg-white/40 px-5 py-8 lg:flex">
        <a href="/" aria-label="good spread"><Wordmark className="h-[26px]" /></a>
        <div className="mt-14 px-2 text-[13px] text-neutral-500">{p.title.replace(' (demo)', '')} · {p.city ?? 'Vilnius'}</div>
        <nav className="mt-2 flex flex-col gap-0.5">
          {NAV.map(([id, label, meta], i) => (
            <a key={id} href={`#${id}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] transition-colors hover:bg-white ${i === 0 ? 'bg-white' : ''}`}>
              <span>{label}</span>{meta && <span className="text-[13px] text-neutral-500">{meta}</span>}
            </a>
          ))}
          <a href={`/wrap/${slug}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] hover:bg-white"><span>Payments</span><ArrowUpRight className="size-4 text-neutral-400" /></a>
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <p className="text-[13px] leading-5 text-neutral-500">Every change updates everyone&rsquo;s call time and message.</p>
          {slug === 'jacket-campaign' && <button onClick={(e) => reset(e.shiftKey)} className="text-[13px] text-neutral-600 hover:text-neutral-950">Start over</button>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 pb-20 lg:px-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pt-8">
          <div className="text-[15px] text-neutral-500">Shoots <span className="mx-1.5">/</span> {p.title.replace(' (demo)', '')} <span className="mx-1.5">/</span> <span className="text-neutral-900">Plan</span></div>
          <div className="flex items-center gap-4">
            <span className={`border-b-2 pb-0.5 text-[17px] tabular-nums ${b.remaining < 0 ? 'border-red-600 text-red-600' : 'border-neutral-950'}`}>{fmtEur(Math.round(b.total))} <span className="text-neutral-400">/ {fmtEur(b.cap)}</span></span>
            <a href="#messages" className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-[15px] font-medium text-white">Call sheet</a>
          </div>
        </div>

        {/* Headline */}
        <motion.div id="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-12">
          <h1 className="text-[52px] font-normal leading-[1.05] tracking-[-0.03em]">{dateLabel}</h1>
          <p className="text-[44px] font-light leading-[1.1] tracking-[-0.03em] text-neutral-500">{headline}</p>
        </motion.div>

        {/* Decisions when something broke */}
        {(data.pending || approving) && (
          <div className="mt-10">
            <Decision production={p} pending={approving ? approving.pending : data.pending} approving={approving} applied={null} countUp={false} onApprove={approve} />
          </div>
        )}
        {applied && !data.pending && !approving && (
          <div className="mt-10"><Decision production={p} pending={null} approving={null} applied={applied} countUp={!!animateVersion} onApprove={approve} /></div>
        )}

        {/* Three cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {p.travel[0] ? <FlightCard p={p} t={p.travel[0]} delayedBy={p.travel[0].scheduledArriveMin != null ? p.travel[0].arriveMin - p.travel[0].scheduledArriveMin : undefined} /> : (
            <div className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]"><div className="text-[17px] font-medium">Travel</div><p className="mt-3 text-[15px] text-neutral-500">Nobody flies in. Everyone is based in {p.city ?? 'Vilnius'}.</p></div>
          )}
          <div id="budget" className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
            <div className="flex justify-between"><span className="text-[17px] font-medium">Budget</span><span className="text-[14px] text-neutral-500">{fmtDate(p.dateISO).slice(4, 10)}</span></div>
            <div className="mt-8 flex items-baseline gap-3"><span className="text-[34px] font-light tabular-nums">{fmtEur(Math.round(b.total))}</span><span className="text-[22px] font-light text-neutral-500">of {fmtEur(b.cap)}</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200"><motion.div className={`h-full rounded-full ${b.remaining < 0 ? 'bg-red-600' : 'bg-neutral-950'}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (b.total / b.cap) * 100)}%` }} transition={{ duration: 1 }} /></div>
            <div className="mt-4 divide-y divide-black/[0.06]">
              {(['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const).filter((c) => b.byCategory[c] > 0).map((c) => (
                <div key={c} className="flex justify-between py-2 text-[15px]"><span>{CAT_NAME[c]}</span><span className="tabular-nums">{fmtEur(Math.round(b.byCategory[c]))}</span></div>
              ))}
            </div>
            <p className="mt-3 text-[14px] text-neutral-500">{b.remaining >= 0 ? `${fmtEur(Math.round(b.remaining))} under the cap, ${fmtEur(Math.round(b.contingency))} kept for surprises.` : `${fmtEur(Math.round(-b.remaining))} over the cap.`}{b.overtime > 0 ? ` Includes ${fmtEur(Math.round(b.overtime))} overtime.` : ''}</p>
          </div>
          <LiveRadar airport={airport} watch={watch} />
        </div>

        {/* Schedule + messages */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div id="schedule" className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
            <div className="flex justify-between border-b border-black/[0.06] pb-4"><span className="text-[17px] font-medium">Day schedule</span><span className="text-[14px] text-neutral-500">{p.studio.name.split(',')[0]}</span></div>
            <div className="divide-y divide-black/[0.06]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[16px] tabular-nums ${r.was ? 'bg-neutral-950 text-white' : 'text-neutral-500'}`}>{fmt(r.at)}</span>
                  <span className="min-w-0 flex-1 truncate text-[16px]">{r.text}</span>
                  {r.was && <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[12px] text-white">was {r.was}</span>}
                  <span className="shrink-0 text-[14px] text-neutral-500">{r.where}</span>
                </div>
              ))}
            </div>
          </div>
          <div id="messages" className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
            <div className="flex justify-between border-b border-black/[0.06] pb-4"><span className="text-[17px] font-medium">Crew messages</span><span className="text-[14px] text-neutral-500">{changes.length ? `${changes.length} ${smsSent ? 'sent' : 'ready'}` : 'nothing to send'}</span></div>
            {changes.length === 0 && <p className="pt-4 text-[15px] text-neutral-500">When the plan changes, each person gets one short message about their own day. You approve first; nothing goes out on its own.</p>}
            <div className="space-y-3 pt-4">
              {changes.map((c, i) => (
                <div key={c.personId} className="rounded-2xl bg-white/80 p-3">
                  <div className="text-[13px] text-neutral-500">To {nameOf(c.personId)} · {roleOf(c.personId)} · {smsSent ? 'sent by text' : 'draft'}</div>
                  <div className={`ml-auto mt-2 max-w-[92%] rounded-2xl px-4 py-2.5 text-[15px] leading-6 ${i % 2 ? 'bg-[#0a84ff] text-white' : 'bg-[#dcf8c6] text-neutral-900'}`}>
                    Hi {nameOf(c.personId).split(' ')[0]}, {c.text.charAt(0).toLowerCase()}{c.text.slice(1)} {p.studio.name.split(',')[0]}.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <section id="team" className="mt-12">
          <h2 className="mb-4 text-[26px] font-light tracking-[-0.02em]">Team</h2>
          <PeopleStrip people={team} version={p.version} changedIds={justApproved?.version === p.version ? justApproved.changedIds ?? [] : []} />
        </section>

        <div className="mt-10 h-[360px]"><Timeline production={p} conflicts={data.conflicts} /></div>

        <div id="inbox" className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Inbox slug={slug} onChanged={() => mutate()} slow={slow} />
          <div className="max-h-[420px]"><Activity events={data.events} /></div>
        </div>
      </main>
    </div>
  );
}
