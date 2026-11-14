'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { StrategyId } from '@/lib/types';
import { dnaViolations, evaluateDna, summarize } from '@/lib/engine';
import { draftProduction } from '@/lib/plan-draft';
import { STRATEGIES } from '@/data/catalog';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { Steps } from '@/components/plan/Steps';

const CAT = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;

export default function Strategies() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();

  const rows = useMemo(() => {
    if (!draft) return [];
    const local = draftProduction(draft, 'local');
    return STRATEGIES.map((s) => {
      const p = draftProduction(draft, s.id);
      const sum = summarize(p);
      // DNA judged against the local baseline: deliverables and look must survive the strategy
      const broken = dnaViolations(evaluateDna(local, p)).filter((x) => !['casting', 'photographer', 'studio', 'schedule'].includes(x.id));
      return { s, p, sum, broken };
    });
  }, [draft]);

  if (!draft) return null;

  const recommended = rows
    .filter((r) => !r.sum.overCap && r.sum.fitsDeadline && r.sum.physical === 'full' && !r.broken.length)
    .sort((a, b) => a.sum.total - b.sum.total)[0]?.s.id;

  function choose(id: StrategyId) {
    setDraft({ ...draft!, strategy: id, picks: undefined });
    router.push('/plan/assemble');
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[1200px] px-6 py-6">
      <Steps step={2} />
      <h1 className="mt-6 font-serif text-[40px] leading-[44px]">Three ways to produce it</h1>
      <p className="mt-1 text-[14px] text-grey-1">
        {draft.title} · cap {fmtEur(draft.cap)} · {draft.deliverables.stills} stills, {draft.deliverables.motion} motion · deadline {fmtDate(draft.deliverables.deadlineISO)}.
        Every number below is computed from catalog line items.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map(({ s, sum, broken }) => (
          <div key={s.id} className={`flex flex-col rounded-[20px] border p-5 ${s.id === recommended ? 'border-ink' : 'border-hairline'}`}>
            <div className="flex items-center justify-between">
              <span className="label">{s.city}</span>
              {s.id === recommended && <span className="rounded-full bg-action px-2 py-0.5 text-[12px] text-white">Recommended</span>}
            </div>
            <div className="mt-2 font-serif text-[30px] leading-9">{s.name}</div>
            <div className="text-[13px] text-grey-1">{s.tagline}</div>

            <div className={`mt-4 font-serif text-[44px] leading-[48px] num ${sum.overCap ? 'text-conflict' : ''}`}>{fmtEur(sum.total)}</div>
            <div className="text-[13px] text-grey-1 num">
              {sum.overCap ? `${fmtEur(sum.total - sum.cap)} over cap` : `${fmtEur(sum.cap - sum.total)} under cap`}
            </div>

            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-1.5 text-[14px]">
              <dt className="text-grey-1">Production time</dt><dd className="num">{sum.totalDays} days</dd>
              <dt className="text-grey-1">Shoot</dt><dd className="num">{fmtDate(sum.shootISO)}</dd>
              <dt className="text-grey-1">Delivery</dt><dd className={`num ${sum.fitsDeadline ? '' : 'text-conflict'}`}>{fmtDate(sum.deliveryISO)}{sum.fitsDeadline ? '' : ' · late'}</dd>
              <dt className="text-grey-1">Physical shoot</dt><dd>{sum.physical === 'full' ? 'Full' : 'Partial (composited)'}</dd>
              <dt className="text-grey-1">Travel</dt><dd>{sum.travel ? `${sum.travellers} ${sum.travellers === 1 ? 'person flies' : 'people fly'}` : 'None'}</dd>
              <dt className="text-grey-1">Brief kept</dt><dd className={broken.length ? 'text-conflict' : ''}>{broken.length ? `Breaks: ${broken.map((x) => x.label).join(', ')}` : 'All must-keep items'}</dd>
            </dl>

            <div className="mt-4 border-t border-hairline pt-3">
              {CAT.filter((c) => sum.byCategory[c] > 0).map((c) => (
                <div key={c} className="flex justify-between py-0.5 text-[13px]">
                  <span className="capitalize text-grey-1">{c}</span>
                  <span className="font-mono num">{fmtEur(sum.byCategory[c])}</span>
                </div>
              ))}
            </div>

            <button onClick={() => choose(s.id)} className={`mt-auto h-11 rounded-full text-[14px] font-medium ${s.id === recommended ? 'bg-action text-white' : 'border border-hairline-strong'}`} style={{ marginTop: 20 }}>
              Choose {s.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
