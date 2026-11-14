'use client';

import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StrategyId } from '@/lib/types';
import { dnaViolations, evaluateDna, summarize, type StrategySummary } from '@/lib/engine';
import { rosterGaps, stillToBook, STRATEGIES } from '@/data/catalog';
import { useRoster } from '@/lib/use-roster';
import Link from 'next/link';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { draftProduction, pinsFor } from '@/lib/plan-draft';
import { BudgetLine, CAT_COLOR, Stage, Tilt, TopBar } from '@/components/glass/Stage';

const ease = [0.2, 0.8, 0.2, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;

export default function Strategies() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [hover, setHover] = useState<StrategyId | null>(null);

  const roster = useRoster();
  const gapsFor = useMemo(() => Object.fromEntries(STRATEGIES.map((s) => [s.id, roster.ready ? rosterGaps(s.id) : []])), [roster.ready, roster.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => {
    if (!draft || !roster.ready) return [];
    const ok = STRATEGIES.filter((s) => !gapsFor[s.id].length);
    if (!ok.length) return [];
    const base = draftProduction(draft, ok[0].id);
    return ok.map((s) => {
      const p = draftProduction(draft, s.id);
      const sum = summarize(p);
      const broken = dnaViolations(evaluateDna(base, p)).filter((x) => !['casting', 'photographer', 'studio', 'schedule'].includes(x.id));
      return { s, p, sum, broken };
    });
  }, [draft, roster.ready, gapsFor]);
  const blocked = STRATEGIES.filter((s) => gapsFor[s.id]?.length);

  if (!draft) return <Stage><div /></Stage>;

  const recommended = rows
    .filter((r) => !r.sum.overCap && r.sum.fitsDeadline && r.sum.physical === 'full' && !r.broken.length)
    .sort((a, b) => a.sum.total - b.sum.total)[0]?.s.id;
  const active = rows.find((r) => r.s.id === (hover ?? recommended ?? 'local')) ?? rows[0];
  const globe = active ? pinsFor(active.p) : { pins: [], arcs: [] };

  function choose(id: StrategyId) {
    setDraft({ ...draft!, strategy: id, picks: undefined });
    router.push('/plan/assemble');
  }

  return (
    <Stage backdrop={draft.refImages[0]}>
      <TopBar step={2} right={<span className="font-mono text-[12px] text-grey-1">cap {fmtEur(draft.cap)}</span>} />
      <div className="relative mx-auto max-w-[1440px] px-8">
        <div className="max-w-[640px] pb-10 pt-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="font-serif text-[60px] leading-[0.95] tracking-[-0.03em]">
            Three plans
          </motion.h1>
          <p className="mt-4 text-[15px] text-grey-1">
            {draft.deliverables.stills} stills · {draft.deliverables.motion} motion · due {fmtDate(draft.deliverables.deadlineISO)}. Totals are calculated from line items.
          </p>
          {active && (
            <motion.div key={active.s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-[14px] text-grey-1">
              {active.s.name} plan, shooting in {active.s.city}.{globe.arcs.length ? ` ${globe.arcs.map((a) => `${a.label} travels from ${a.from}`).join(', ')}.` : ' Nobody needs to fly.'}
            </motion.div>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-5 pb-14 md:grid-cols-3">
          {rows.map(({ s, sum, broken }, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 + i * 0.12, ease }} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}>
              <Tilt className={`glass flex h-full flex-col p-6 ${s.id === recommended ? 'ring-1 ring-ink/25' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="g-label">{s.city}</span>
                  {s.id === recommended && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">Recommended</span>}
                </div>
                <div className="mt-1 font-serif text-[40px] leading-[1.05] tracking-[-0.02em]">{s.name}</div>
                <div className="text-[13px] text-grey-1">{s.tagline}</div>

                <div className="mt-5 space-y-4">
                  <BudgetLine size="sm" total={sum.total} cap={sum.cap} segments={CATS.map((c) => ({ value: sum.byCategory[c], color: CAT_COLOR[c] }))} />
                  <div className="flex-1 space-y-1">
                    {CATS.filter((c) => sum.byCategory[c] > 0).map((c) => (
                      <div key={c} className="flex items-center gap-2 text-[12px]">
                        <span className="flex-1 capitalize text-grey-1">{c}</span>
                        <span className="font-mono text-ink num">{fmtEur(sum.byCategory[c])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <DayStrip sum={sum} deadline={draft.deliverables.deadlineISO} start={draft.startISO} />

                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                  {stillToBook(s.id).length > 0 && <Chip>To book: {stillToBook(s.id).join(', ')} (estimated)</Chip>}
                  <Chip>{sum.physical === 'full' ? 'Full shoot' : 'Partial · composited'}</Chip>
                  <Chip>{sum.travel ? `${sum.travellers} flies in` : 'No flights'}</Chip>
                  <Chip tone={sum.overCap ? 'bad' : 'good'}>{sum.overCap ? `${fmtEur(sum.total - sum.cap)} over cap` : `${fmtEur(sum.cap - sum.total)} under cap`}</Chip>
                  <Chip tone={broken.length ? 'bad' : 'good'}>{broken.length ? `Breaks ${broken.map((x) => x.label).join(', ')}` : 'Brief kept'}</Chip>
                </div>

                <button onClick={() => choose(s.id)} className={`${s.id === recommended ? 'g-btn' : 'g-btn-ghost h-[52px]'} mt-6 w-full`}>Build the {s.name.toLowerCase()} team →</button>
              </Tilt>
            </motion.div>
          ))}
          {blocked.map((s) => (
            <div key={s.id} className="glass flex h-full flex-col p-6">
              <span className="g-label">{s.city}</span>
              <div className="mt-1 font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-grey-1">{s.name}</div>
              <div className="text-[13px] text-grey-1">{s.tagline}</div>
              <p className="mt-6 text-[15px] leading-6">To plan this, add {gapsFor[s.id].join(', ')} to your people.</p>
              <Link href="/people" className="g-btn-ghost mt-auto w-full">Add people →</Link>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'good' | 'bad' }) {
  const c = tone === 'good' ? 'text-seen border-seen/30' : tone === 'bad' ? 'text-conflict border-conflict/30' : 'text-grey-1 border-hairline-strong';
  return <span className={`rounded-full border px-2.5 py-1 ${c}`}>{children}</span>;
}

/** Prep / shoot / post laid out on a calendar from today to the deadline. */
function DayStrip({ sum, deadline, start }: { sum: StrategySummary; deadline: string; start: string }) {
  const day = (iso: string) => Math.round((new Date(`${iso}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000);
  const span = Math.max(day(deadline), sum.totalDays) + 1;
  const pct = (n: number) => `${(n / span) * 100}%`;
  return (
    <div className="mt-5">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-grey-2">
        <span>{sum.totalDays} days</span>
        <span>delivered {fmtDate(sum.deliveryISO).slice(4)}</span>
      </div>
      <div className="relative mt-1.5 h-3 rounded-full bg-ink/[0.06]">
        <motion.div initial={{ width: 0 }} animate={{ width: pct(sum.prepDays) }} transition={{ duration: 0.8, ease }} className="absolute left-0 top-0 h-full rounded-l-full bg-[var(--g-sand)]" />
        <motion.div initial={{ width: 0 }} animate={{ width: pct(1) }} transition={{ duration: 0.4, delay: 0.6 }} className="absolute top-0 h-full bg-ink" style={{ left: pct(sum.prepDays) }} />
        <motion.div initial={{ width: 0 }} animate={{ width: pct(sum.postDays) }} transition={{ duration: 0.8, delay: 0.8, ease }} className="absolute top-0 h-full rounded-r-full bg-[var(--g-mist)]" style={{ left: pct(sum.prepDays + 1) }} />
        <div className="absolute -top-1 h-5 w-px bg-[var(--g-warm)]" style={{ left: pct(day(deadline)) }} />
      </div>
      <div className="mt-1 flex gap-3 font-mono text-[10px] text-grey-2">
        <span>prep {sum.prepDays}d</span><span>shoot {fmtDate(sum.shootISO).slice(4, 10)}</span><span>post {sum.postDays}d</span><span className="ml-auto text-[var(--g-warm)]">deadline</span>
      </div>
    </div>
  );
}
