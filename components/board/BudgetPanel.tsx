'use client';

import type { BudgetSummary, Category } from '@/lib/types';
import { fmtEur } from '@/lib/format';
import { OvertimeChip, SectionHead, SourceChip } from '@/components/kit';
import { cn } from '@/lib/utils';
import { BudgetLine, CAT_COLOR } from '@/components/glass/Stage';

const ORDER: Category[] = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'];

export function BudgetPanel({ budget: b }: { budget: BudgetSummary }) {
  const otBy = (c: Category) => b.lines.filter((l) => l.overtime && l.category === c).reduce((s2, l) => s2 + l.amount, 0);
  const lines = ORDER.flatMap((c) => b.lines.filter((l) => l.category === c));

  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="Budget" meta="Rate card = agreed price · Quote = from the supplier · Estimate = our guess" />
      <div className="shrink-0">
        <BudgetLine size="sm" total={b.total} cap={b.cap} segments={[...ORDER.map((c) => ({ value: b.byCategory[c] - (c === 'crew' || c === 'talent' || c === 'studio' ? otBy(c) : 0), color: CAT_COLOR[c] })), { value: b.overtime, color: '#b8742a' }]} />
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
