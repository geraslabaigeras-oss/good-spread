'use client';

import type { BudgetSummary, Category } from '@/lib/types';
import { money } from '@/lib/engine/time';
import { cn } from '@/lib/utils';
import { SectionTitle } from './Board';

const ORDER: Category[] = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'];
const CAT: Record<Category, string> = { talent: 'Talent', crew: 'Crew', studio: 'Studio', travel: 'Travel', post: 'Post', usage: 'Usage' };
const SRC: Record<string, string> = { rate_card: 'rate card', quote: 'quote', estimate: 'estimate', computed: 'computed' };

export function BudgetPanel({ budget: b }: { budget: BudgetSummary }) {
  const used = Math.min(1, b.total / b.cap);
  const over = b.total > b.cap;
  return (
    <section className="border-t border-hairline px-5 py-4">
      <SectionTitle right={<span className={cn('tnum', over ? 'text-conflict' : '')}>{over ? 'over by ' : ''}{money(Math.abs(b.remaining))}{over ? '' : ' left'}</span>}>Budget</SectionTitle>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[40px] leading-none tnum">{money(b.total)}</span>
        <span className="text-xs text-muted-foreground tnum">of {money(b.cap)} cap</span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-muted">
        <div className={cn('h-full', over ? 'bg-conflict' : 'bg-foreground')} style={{ width: `${used * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tnum">
        <span>spend {money(b.subtotal)}{b.overtime > 0 && <span className="text-ot"> incl. overtime {money(b.overtime)}</span>}</span>
        <span>contingency left {money(b.contingency)} / {money(b.contingencyReserve)}</span>
      </div>
      <div className="mt-3 max-h-[230px] space-y-2 overflow-y-auto pr-1">
        {ORDER.filter((c) => b.byCategory[c] > 0).map((c) => (
          <div key={c}>
            <div className="flex justify-between border-b border-hairline pb-0.5 text-xs font-medium">
              <span>{CAT[c]}</span>
              <span className="tnum">{money(b.byCategory[c])}</span>
            </div>
            {b.lines.filter((l) => l.category === c).map((l) => (
              <div key={l.id} className={cn('flex items-center justify-between gap-2 py-0.5 text-[11px]', l.overtime && 'text-ot')}>
                <span className="truncate">{l.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className={cn('rounded-sm px-1 text-[9px] uppercase tracking-wider', l.overtime ? 'bg-ot-soft text-ot' : 'bg-muted text-muted-foreground')}>{SRC[l.source]}</span>
                  <span className="w-14 text-right tnum">{money(l.amount)}</span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
