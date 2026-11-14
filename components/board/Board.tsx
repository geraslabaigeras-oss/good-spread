'use client';

import useSWR from 'swr';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, QrCode, RotateCcw } from 'lucide-react';
import type { BoardState, PublicPending } from '@/lib/server/views';
import type { Receipt } from '@/lib/types';
import { fmtDate, fmtEur } from '@/lib/format';
import { useReveal, APPROVE } from '@/lib/motion';
import { Button, ToastProvider, useToast, Wordmark } from '@/components/kit';
import { PeopleStrip } from './PeopleStrip';
import { Timeline } from './Timeline';
import { Decision } from './Decision';
import { Inbox } from './Inbox';
import { BudgetPanel } from './BudgetPanel';
import { Activity } from './Activity';
import { JoinQR } from './JoinQR';

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export type Approving = { fixId: string; x: number; y: number; pending: PublicPending };
export type Applied = { version: number; label: string; receipt: Receipt; at: string; changedIds?: string[] };

export function Board({ slug }: { slug: string }) {
  return (
    <ToastProvider position="bottom-right">
      <BoardInner slug={slug} />
    </ToastProvider>
  );
}

function BoardInner({ slug }: { slug: string }) {
  const { data, error, mutate } = useSWR<BoardState>(`/api/state/${slug}`, fetcher, { refreshInterval: 2000 });
  const toast = useToast();
  const { parent, item } = useReveal();
  const [qr, setQr] = useState(false);
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
        setJustApproved({ version: j.version, label: j.label, receipt: j.receipt, at: new Date().toISOString(), changedIds: (j.changes ?? []).map((c: { personId: string }) => c.personId) });
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
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full }) });
      setJustApproved(null);
      setApproving(null);
      await mutate();
      toast(full ? 'Board reset · devices removed' : 'Board reset', { check: true });
    },
    [mutate, toast],
  );

  if (!data) {
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
        ? { version: rev.version, label: rev.receipt.label ?? rev.fix_kind ?? '', receipt: rev.receipt, at: rev.created_at }
        : null;
  const animateVersion = justApproved?.version === p.version ? p.version : null;

  return (
    <motion.div className="board-root" variants={parent} initial="hidden" animate="shown">
      {/* Header (§3.1) */}
      <motion.header variants={item} style={{ gridArea: 'header' }} className="flex min-w-0 items-center justify-between border-b border-hairline">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark />
          <span className="font-mono text-[12px] text-grey-2">/</span>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate font-serif text-[28px] leading-8 tracking-[-0.01em]">{p.title}</h1>
              <span className="inline-flex h-[22px] items-center rounded-full border border-hairline-strong px-2 font-mono text-[12px] leading-4 num">v{p.version}</span>
            </div>
            <div className="truncate font-mono text-[12px] uppercase leading-4 text-grey-1 num">
              {fmtDate(p.dateISO)} · {p.studio.name} · cap {fmtEur(p.budget.cap)}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-2 font-mono text-[12px] text-grey-1 num">{data.viewerCount} joined</span>
          <Button variant="secondary" onClick={() => setQr(true)}>
            <QrCode strokeWidth={1.5} /> Show join QR
          </Button>
          <Button variant="ghost" onClick={() => window.open(`/wrap/${slug}`, '_blank')}>
            Wrap <ArrowUpRight strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm" className="text-grey-1" onClick={(e) => reset(e.shiftKey)} title="Shift-click for full reset">
            <RotateCcw strokeWidth={1.5} /> Reset
          </Button>
        </div>
      </motion.header>

      <motion.div variants={item} style={{ gridArea: 'people' }} className="min-w-0">
        <PeopleStrip people={data.people.filter((x) => x.role !== 'producer')} version={p.version} changedIds={justApproved?.version === p.version ? justApproved.changedIds ?? [] : []} />
      </motion.div>

      <div className="board-main">
        <motion.div variants={item} className="min-h-0 min-w-0">
          <Timeline production={p} conflicts={data.conflicts} />
        </motion.div>
        <div />
        <motion.div variants={item} className="min-h-0 min-w-0">
          <Decision
            production={p}
            pending={approving ? approving.pending : data.pending}
            approving={approving}
            applied={approving ? null : applied}
            countUp={!!animateVersion}
            onApprove={approve}
          />
        </motion.div>
      </div>

      <div className="board-side">
        <motion.div variants={item} className="min-h-0 min-w-0">
          <Inbox slug={slug} onChanged={() => mutate()} slow={slow} />
        </motion.div>
        <div />
        <motion.div variants={item} className="min-h-0 min-w-0">
          <BudgetPanel budget={data.budget} />
        </motion.div>
        <div />
        <motion.div variants={item} className="min-h-0 min-w-0">
          <Activity events={data.events} />
        </motion.div>
      </div>

      <JoinQR open={qr} onOpenChange={setQr} slug={slug} />
    </motion.div>
  );
}
