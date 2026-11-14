'use client';

import type { BudgetSummary, Category } from '@/lib/types';
import { fmtEur } from '@/lib/format';
import { OvertimeChip, SectionHead, SourceChip } from '@/components/kit';
import { cn } from '@/lib/utils';

const ORDER: Category[] = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'];

export function BudgetPanel({ budget: b }: { budget: BudgetSummary }) {
  const over = b.total > b.cap;
  const fill = Math.min(b.total, b.cap) / b.cap;
  const otPart = Math.min(b.overtime, Math.min(b.total, b.cap)) / b.cap;
  const lines = ORDER.flatMap((c) => b.lines.filter((l) => l.category === c));

  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="Budget" meta={`${b.lines.length + 1} lines`} />
      <div className="flex h-9 shrink-0 items-baseline justify-between">
        <div className="flex items-baseline">
          <span className="font-serif text-[32px] leading-9 tracking-[-0.015em] num">{fmtEur(b.total)}</span>
          <span className="font-mono text-[13px] leading-5 text-grey-1 num">&nbsp;/ {fmtEur(b.cap)} cap</span>
        </div>
        <span className={cn('font-mono text-[13px] leading-5 num', over ? 'text-conflict' : 'text-grey-1')}>
          {over ? `${fmtEur(b.total - b.cap)} over` : `${fmtEur(b.remaining)} left`}
        </span>
      </div>
      <div className="relative mt-3 h-2 shrink-0 rounded-[4px] bg-grey-3">
        <div className={cn('absolute inset-y-0 left-0 rounded-[4px]', over ? 'bg-conflict' : 'bg-ink')} style={{ width: `${fill * 100}%` }} />
        {b.overtime > 0 && !over && (
          <div className="absolute inset-y-0 bg-overtime" style={{ left: `${(fill - otPart) * 100}%`, width: `${otPart * 100}%` }} />
        )}
        <div className="absolute -top-[3px] h-3.5 w-px bg-ink" style={{ left: 'calc(100% - 1px)' }} />
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
