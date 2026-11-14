'use client';

import type { BudgetSummary, Category } from '@/lib/types';
import { fmtEur } from '@/lib/format';
import { OvertimeChip, SectionHead, SourceChip } from '@/components/kit';
import { cn } from '@/lib/utils';
import { AnimatedNumber, BudgetRing, CAT_COLOR } from '@/components/glass/Stage';

const ORDER: Category[] = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'];

export function BudgetPanel({ budget: b }: { budget: BudgetSummary }) {
  const over = b.total > b.cap;
  const otBy = (c: Category) => b.lines.filter((l) => l.overtime && l.category === c).reduce((s2, l) => s2 + l.amount, 0);
  const lines = ORDER.flatMap((c) => b.lines.filter((l) => l.category === c));

  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="Budget" meta={`${b.lines.length + 1} lines`} />
      <div className="flex shrink-0 items-center gap-4">
        <BudgetRing cap={b.cap} size={92} stroke={9} segments={[...ORDER.map((c) => ({ value: b.byCategory[c] - (c === 'crew' || c === 'talent' || c === 'studio' ? otBy(c) : 0), color: CAT_COLOR[c] })), { value: b.overtime, color: '#ffb38a' }]}>
          <AnimatedNumber value={b.total} format={(n) => fmtEur(Math.round(n))} className={cn('font-serif text-[17px] leading-none num', over && 'text-conflict')} />
        </BudgetRing>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12px] text-grey-1 num">of {fmtEur(b.cap)} cap</div>
          <div className={cn('font-serif text-[22px] leading-7 num', over ? 'text-conflict' : '')}>{over ? `${fmtEur(b.total - b.cap)} over` : `${fmtEur(b.remaining)} left`}</div>
          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5">
            {ORDER.filter((c) => b.byCategory[c] > 0).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 text-[11px] capitalize text-grey-1"><span className="size-1.5 rounded-full" style={{ background: CAT_COLOR[c] }} />{c}</span>
            ))}
            {b.overtime > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-overtime"><span className="size-1.5 rounded-full bg-overtime" />overtime</span>}
          </div>
        </div>
      </div>
      <div className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {lines.map((l) => (
          <div key={l.id} className={cn('flex h-6 items-center gap-2', l.overtime && 'text-overtime')}>
            <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px]">{l.label}</span>
            {l.overtime ? <OvertimeChip /> : <SourceChip source={l.source} />}
            <span className="w-[72px] shrink-0 text-right font-mono text-[13px] leading-5 num">{fmtEur(l.amount)}</span>
          </div>
        ))}
        <div className="flex h-6 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px]">Contingency 10%{b.overtime > 0 ? ', after overtime' : ''}</span>
          <SourceChip source="estimate" />
          <span className="w-[72px] shrink-0 text-right font-mono text-[13px] leading-5 num">{fmtEur(b.contingency)}</span>
        </div>
      </div>
    </section>
  );
}
