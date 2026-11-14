'use client';

import useSWR from 'swr';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import type { BoardState, PublicPending } from '@/lib/server/views';
import type { Change, Receipt } from '@/lib/types';
import { fmtDate, fmtEur } from '@/lib/format';
import { useReveal, APPROVE } from '@/lib/motion';
import { Button, ToastProvider, useToast } from '@/components/kit';
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
import { NumberTicker } from '@/components/ui/number-ticker';

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export type Approving = { fixId: string; x: number; y: number; pending: PublicPending };
export type Applied = { version: number; label: string; receipt: Receipt; at: string; changedIds?: string[]; changes?: Change[] };

export function Board({ slug }: { slug: string }) {
  return (
    <Stage>
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
  const confirmed = team.filter((x) => x.booking === 'confirmed').length;
  const delayedIds = new Map(data.conflicts.filter((c) => (c.code === 'ARRIVAL' || c.code === 'LATE') && c.personId).map((c) => [c.personId!, c.deltaMin]));
  const calls = team.map((x) => callTime(p, x.id)).filter((m): m is number => m != null);
  const firstCall = calls.length ? Math.min(...calls) : null;
  const wrapAt = p.blocks.length ? Math.max(...p.blocks.map((b) => b.endMin)) : null;
  const airport = p.travel[0]?.to ?? IATA[(p.city ?? 'Vilnius') as City] ?? 'VNO';
  const watch = p.travel.map((t) => ({ callsign: callsignFor(t.number), label: `${p.people.find((x) => x.id === t.personId)?.name ?? ''}, ${t.number}` })).filter((w): w is { callsign: string; label: string } => !!w.callsign);
  const b = data.budget;

  return (
    <motion.div className="board-dark mx-auto max-w-[1480px] px-8 pb-16" variants={parent} initial="hidden" animate="shown" style={{ ['--row-h' as string]: '40px', ['--bar-h' as string]: '28px', ['--label-w' as string]: '120px' }}>
      {/* Header */}
      <motion.header variants={item} className="flex flex-wrap items-end justify-between gap-6 pt-8">
        <div className="min-w-0">
          <div className="text-[14px] text-neutral-500">{fmtDate(p.dateISO)} · {p.studio.name}</div>
          <h1 className="mt-1 truncate text-[52px] font-light leading-[1] tracking-[-0.03em]">{p.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" onClick={() => window.open(`/wrap/${slug}`, '_blank')} title="What each person is paid after the shoot">
            Payments <ArrowUpRight strokeWidth={1.5} />
          </Button>
          {slug === 'jacket-campaign' && (
            <Button variant="ghost" size="sm" className="text-grey-1" onClick={(e) => reset(e.shiftKey)} title="Back to the start of the sample">
              <RotateCcw strokeWidth={1.5} /> Start over
            </Button>
          )}
        </div>
      </motion.header>

      {/* The day in four numbers */}
      <motion.div variants={item} className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { k: 'Team confirmed', v: <><NumberTicker value={confirmed} className="text-inherit" /><span className="text-neutral-400">/{team.length}</span></>, sub: team.length - confirmed ? `${team.length - confirmed} still to book or delayed` : 'Everyone is booked' },
          { k: 'Flying in', v: <NumberTicker value={p.travel.length} className="text-inherit" />, sub: p.travel.length ? `First lands ${fmt(Math.min(...p.travel.map((t) => t.arriveMin)))}` : 'Everyone is local' },
          { k: 'First call', v: firstCall != null ? fmt(firstCall) : '—', sub: wrapAt != null ? `Wrap ${fmt(wrapAt)}, booked until ${fmt(p.studio.bookedUntilMin)}` : '' },
          { k: 'Budget', v: <>€<NumberTicker value={Math.round(b.total)} className="text-inherit" /></>, sub: b.remaining >= 0 ? `${fmtEur(Math.round(b.remaining))} left of ${fmtEur(b.cap)}` : `${fmtEur(Math.round(-b.remaining))} over the cap`, bad: b.remaining < 0 },
        ].map((t) => (
          <div key={t.k} className="rounded-[24px] bg-white/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_16px_40px_rgba(20,40,90,.06)]">
            <div className="text-[13px] text-neutral-500">{t.k}</div>
            <div className={`mt-2 text-[44px] font-light leading-none tracking-[-0.03em] tabular-nums ${t.bad ? 'text-red-600' : ''}`}>{t.v}</div>
            <div className="mt-2 text-[13px] text-neutral-500">{t.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Team */}
      <motion.section variants={item} className="mt-10">
        <h2 className="mb-4 text-[22px] font-light tracking-[-0.01em]">The team</h2>
        <PeopleStrip people={team} version={p.version} changedIds={justApproved?.version === p.version ? justApproved.changedIds ?? [] : []} />
      </motion.section>

      <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex min-w-0 flex-col gap-6">
          <motion.div variants={item} className="min-h-[300px]">
            <Decision production={p} pending={approving ? approving.pending : data.pending} approving={approving} applied={approving ? null : applied} countUp={!!animateVersion} onApprove={approve} />
          </motion.div>
          <motion.div variants={item} className="h-[360px]">
            <Timeline production={p} conflicts={data.conflicts} />
          </motion.div>
          <motion.div variants={item}>
            <Inbox slug={slug} onChanged={() => mutate()} slow={slow} />
          </motion.div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {p.travel.length > 0 && (
            <motion.section variants={item}>
              <h2 className="mb-3 text-[22px] font-light tracking-[-0.01em]">Travel</h2>
              <div className="flex flex-col gap-4">
                {p.travel.map((t) => <FlightCard key={t.personId} p={p} t={t} delayedBy={delayedIds.get(t.personId)} />)}
              </div>
            </motion.section>
          )}
          <motion.div variants={item}><LiveRadar airport={airport} watch={watch} /></motion.div>
          <motion.div variants={item}><BudgetPanel budget={b} /></motion.div>
          <motion.div variants={item} className="max-h-[320px]"><Activity events={data.events} /></motion.div>
        </div>
      </div>
    </motion.div>
  );

}
