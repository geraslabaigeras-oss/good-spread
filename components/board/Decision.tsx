'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Globe } from '@/components/glass/Globe';
import { pinsFor } from '@/lib/plan-draft';
import { useMemo, useRef, useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import type { Production } from '@/lib/types';
import type { PublicFix, PublicPending } from '@/lib/server/views';
import { readyAt } from '@/lib/engine/schedule';
import { clock, fmt, fmtDelta, fmtEur } from '@/lib/format';
import { APPROVE, conflictBar, conflictLine, fixCard, fixList, revealItem, ripple, useCountUp } from '@/lib/motion';
import { Button, CreativeChip, OvertimeChip, RecommendedBadge, SectionHead } from '@/components/kit';
import { cn } from '@/lib/utils';
import type { Applied, Approving } from './Board';

function TeamGlobe({ p }: { p: Production }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { pins, arcs } = useMemo(() => pinsFor(p), [p.version, p.id]);
  return <Globe pins={pins} arcs={arcs} focus={p.city ?? 'Vilnius'} hub={p.city ?? 'Vilnius'} height="100%" altitude={0.9} spread={3.2} />;
}

export function Decision({
  production: p, pending, approving, applied, countUp, onApprove,
}: {
  production: Production;
  pending: PublicPending | null;
  approving: Approving | null;
  applied: Applied | null;
  countUp: boolean;
  onApprove: (fixId: string, x: number, y: number) => void | Promise<void>;
}) {
  const state = pending ? 'pending' : applied ? 'applied' : 'empty';
  return (
    <section className="section flex h-full flex-col">
      <SectionHead
        label="Decisions"
        meta={pending ? `from ${pending.source}` : applied ? `v${applied.version}` : undefined}
      />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {state === 'pending' && pending && (
            <motion.div key={`p-${pending.inboxId}`} className="flex h-full flex-col gap-3" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <ConflictLines p={p} pending={pending} />
              <motion.div variants={fixList} initial="hidden" animate="shown" className="grid min-h-0 flex-1 grid-cols-3 gap-3">
                {pending.fixes.map((f, i) => (
                  <FixCard
                    key={f.id}
                    fix={f}
                    index={i}
                    recommended={f.id === pending.recommendedFixId}
                    state={approving ? (approving.fixId === f.id ? 'chosen' : 'dismissed') : 'idle'}
                    point={approving?.fixId === f.id ? approving : null}
                    onApprove={onApprove}
                  />
                ))}
                {!pending.fixes.length && <div className="col-span-3 pt-2 text-grey-1">No fix leaves the plan clean. Change it by hand.</div>}
              </motion.div>
            </motion.div>
          )}
          {state === 'applied' && applied && (
            <motion.div key={`a-${applied.version}`} className="flex h-full flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2 } }}>
              <ReceiptView applied={applied} countUp={countUp} />
            </motion.div>
          )}
          {state === 'empty' && (
            <motion.div key="empty" className="relative h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="absolute inset-0 -mx-4 -mb-4"><TeamGlobe p={p} /></div>
              <div className="pointer-events-none relative max-w-[260px] pt-1">
                <div className="font-serif text-[30px] leading-8 tracking-[-0.03em]">All clear.</div>
                <p className="mt-1 text-[13px] leading-5 text-grey-1">No conflicts. Drop a flight change, screenshot or email into the inbox.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function conflictMeta(p: Production, c: PublicPending['conflicts'][number]) {
  if (!c.personId) return '';
  const t = p.travel.find((x) => x.personId === c.personId);
  if (c.code === 'ARRIVAL' && t) return `Lands ${fmt(t.arriveMin)} · +${c.deltaMin} min`;
  if (c.code === 'LATE') return `Ready ${fmt(readyAt(p, c.personId))} · +${c.deltaMin} min`;
  if (c.code === 'UNAVAILABLE') return 'Unavailable';
  return '';
}

function ConflictLines({ p, pending }: { p: Production; pending: PublicPending }) {
  const c = pending.conflicts[0];
  return (
    <motion.div
      variants={conflictLine}
      initial="hidden"
      animate="shown"
      className="relative flex h-12 shrink-0 items-center gap-2.5 overflow-hidden rounded-[10px] bg-conflict-tint px-4 text-conflict"
    >
      <motion.span variants={conflictBar} className="absolute inset-y-0 left-0 w-[3px] bg-conflict" />
      <TriangleAlert size={16} strokeWidth={1.5} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-5">
        {c.message}
        {pending.conflicts.length > 1 && <span className="font-normal"> · +{pending.conflicts.length - 1} more</span>}
      </span>
      <span className="shrink-0 font-mono text-[13px] uppercase leading-5 num">{conflictMeta(p, c)}</span>
    </motion.div>
  );
}

function FixCard({
  fix: f, index, recommended, state, point, onApprove,
}: {
  fix: PublicFix; index: number; recommended: boolean;
  state: 'idle' | 'chosen' | 'dismissed';
  point: { x: number; y: number } | null;
  onApprove: (fixId: string, x: number, y: number) => void | Promise<void>;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const rect = ref.current?.getBoundingClientRect();
  const diag = rect ? Math.hypot(rect.width, rect.height) : 600;
  const fromOvertime = f.kind === 'SHIFT_FROM' && f.costDelta > 0;
  const firstChange = f.levers?.length ? f.levers.map((l) => `${l.label} ${fmtDelta(l.amount)}`).join(' · ') : f.detail ?? f.changes[0]?.text ?? '';

  return (
    <motion.div
      ref={ref}
      variants={fixCard}
      animate={state === 'dismissed' ? 'dismissed' : undefined}
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden rounded-[20px] border bg-paper p-5 transition-colors duration-[160ms]',
        recommended ? 'border-hairline-strong hover:border-ink' : 'border-hairline hover:border-hairline-strong',
      )}
    >
      {state === 'chosen' && point && rect && !reduce && (
        <motion.span
          variants={ripple}
          initial="idle"
          animate="go"
          className="pointer-events-none absolute rounded-full bg-action"
          style={{ width: diag * 2, height: diag * 2, left: point.x - rect.left - diag, top: point.y - rect.top - diag }}
        />
      )}
      <div className="flex h-[22px] items-center justify-between">
        <span className="font-mono text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-grey-1">Option {index + 1}</span>
        {recommended && <RecommendedBadge />}
      </div>
      <div className="mt-3 font-serif text-[24px] leading-7 tracking-[-0.01em]">{f.label}</div>
      {f.changesCreative && <div className="mt-2"><CreativeChip /></div>}
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-[18px] text-grey-1">{firstChange}</p>
      <div className="mt-auto pt-3">
        <div className={cn('fix-delta font-serif tracking-[-0.02em] num', fromOvertime && 'text-overtime')}>{fmtDelta(f.costDelta)}</div>
        <div className="mt-1 flex h-[22px] items-center gap-2 text-[13px] leading-[18px] text-grey-1">
          {f.peopleAffected.length} people affected {fromOvertime && <OvertimeChip />}
        </div>
      </div>
      <Button
        variant={recommended ? 'primary' : 'secondary'}
        className="mt-4 w-full"
        disabled={busy || state !== 'idle'}
        onClick={async (e) => {
          setBusy(true);
          await onApprove(f.id, e.clientX, e.clientY);
          setBusy(false);
        }}
      >
        {busy || state === 'chosen' ? 'Applying…' : 'Approve'}
      </Button>
    </motion.div>
  );
}

function ReceiptView({ applied, countUp }: { applied: Applied; countUp: boolean }) {
  const r = applied.receipt;
  return (
    <>
      <motion.div
        variants={revealItem}
        initial={countUp ? 'hidden' : false}
        animate="shown"
        transition={{ duration: 0.32 }}
        className="flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-seen-tint px-4 text-seen"
      >
        <Check size={16} strokeWidth={1.5} />
        <span className="flex-1 truncate text-[14px] font-medium leading-5">Fix applied: {applied.label}</span>
        <span className="font-mono text-[12px] uppercase leading-4 num">v{applied.version} · {clock(applied.at)}</span>
      </motion.div>
      <div className="grid min-h-0 grid-cols-4 gap-3" style={{ height: 'min(140px, 100%)' }}>
        <Metric label="People updated" value={r.peopleUpdated} i={0} countUp={countUp} k={applied.version} />
        <Metric label="Messages typed" value={0} i={1} countUp={false} k={applied.version} />
        {r.saved != null ? (
          <Metric label="Budget saved" value={r.saved} i={2} countUp={countUp} k={applied.version} euro />
        ) : (
          <Metric label="Overtime avoided" value={r.overtimeAvoided} i={2} countUp={countUp} k={applied.version} euro />
        )}
        <Metric label="Fixed in" value={r.fixedInSeconds} i={3} countUp={countUp} k={applied.version} suffix=" s" />
      </div>
    </>
  );
}

function Metric({ label, value, i, countUp, k, euro, suffix }: { label: string; value: number; i: number; countUp: boolean; k: number; euro?: boolean; suffix?: string }) {
  const delayMs = APPROVE.receiptStart - APPROVE.slotSwap + i * APPROVE.metricStagger;
  const n = useCountUp(value, { delayMs, from: countUp ? 0 : value, key: k });
  const done = Math.abs(n - value) < 0.001;
  const shown = euro ? (done ? fmtEur(value) : fmtEur(Math.round(n))) : String(Math.round(n));
  return (
    <div className="flex flex-col rounded-[20px] border border-hairline bg-paper p-5">
      <span className="label">{label}</span>
      <div className="mt-auto metric-num font-serif tracking-[-0.02em] num" style={{ minWidth: `${Math.max(String(euro ? fmtEur(value) : value).length, 2)}ch` }}>
        {shown}
        {suffix && <span className="font-sans text-[20px] leading-6 tracking-normal text-grey-1">{suffix}</span>}
      </div>
    </div>
  );
}
