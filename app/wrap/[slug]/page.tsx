import { notFound } from 'next/navigation';
import { getOrSeed } from '@/lib/server/db';
import { agencyFeeLines, blocksFor, computeOvertime, fmt, lastEnd } from '@/lib/engine';
import { fmtDate, fmtEur } from '@/lib/format';
import { Wordmark } from '@/components/kit';

const ROLE: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };
const COLS = 'grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4';

export default async function WrapPage({ params }: PageProps<'/wrap/[slug]'>) {
  const { slug } = await params;
  const row = await getOrSeed(slug);
  if (!row) notFound();
  const p = row.data;
  const ot = computeOvertime(p);
  const fees = agencyFeeLines(p);

  const rows = p.people
    .filter((x) => x.role !== 'producer')
    .map((x) => {
      const bs = blocksFor(p, x.id);
      const start = bs.length ? bs[0].startMin : null;
      const end = lastEnd(p, x.id);
      const overtime = ot.find((l) => l.personId === x.id)?.amount ?? 0;
      const fee = fees.find((f) => f.personId === x.id)?.amount ?? 0;
      const hours = start != null && end != null ? (end - start) / 60 : 0;
      return {
        id: x.id, name: x.name, role: ROLE[x.role] ?? x.role,
        span: start != null && end != null ? `${fmt(start)}–${fmt(end)} · ${Number.isInteger(hours) ? hours : hours.toFixed(2)} h` : '—',
        dayRate: x.dayRate, overtime, fee, total: x.dayRate + overtime + fee,
      };
    });
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-10">
        <div className="flex h-10 items-center justify-between">
          <Wordmark demo />
          <a href={`/board/${slug}`} className="text-[14px] leading-5 text-grey-1 underline underline-offset-2">Back to board</a>
        </div>
        <h1 className="mt-6 font-serif text-[44px] leading-[48px] tracking-[-0.02em]">Wrap</h1>
        <div className="mt-1 font-mono text-[12px] uppercase leading-4 text-grey-1 num">
          {p.title} · {fmtDate(p.dateISO)} · v{p.version}
        </div>

        <div className="mt-8">
          <div className={`${COLS} h-10 border-b border-ink`}>
            {['Person', 'Role', 'Hours', 'Day rate', 'Overtime', 'Agency fee', 'Total'].map((h, i) => (
              <span key={h} className={`label ${i >= 3 ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>
          {rows.map((r) => (
            <div key={r.id} className={`${COLS} h-14 border-b border-hairline`}>
              <span className="truncate text-[15px] font-medium leading-5">{r.name}</span>
              <span className="text-[14px] leading-5 text-grey-1">{r.role}</span>
              <span className="whitespace-nowrap font-mono text-[14px] leading-5 num">{r.span}</span>
              <span className="text-right font-mono text-[14px] leading-5 num">{fmtEur(r.dayRate)}</span>
              <span className={`text-right font-mono text-[14px] leading-5 num ${r.overtime ? 'text-overtime' : 'text-grey-2'}`}>{r.overtime ? fmtEur(r.overtime) : '—'}</span>
              <span className={`text-right font-mono text-[14px] leading-5 num ${r.fee ? '' : 'text-grey-2'}`}>{r.fee ? fmtEur(r.fee) : '—'}</span>
              <span className="text-right font-mono text-[14px] font-medium leading-5 num">{fmtEur(r.total)}</span>
            </div>
          ))}
          <div className={`${COLS} h-16 border-t border-ink`}>
            <span className="col-span-6 font-serif text-[24px] leading-7">Total</span>
            <span className="text-right font-serif text-[32px] leading-9 num">{fmtEur(total)}</span>
          </div>
        </div>

        <div className="mt-6 inline-flex h-8 items-center rounded-full border border-hairline-strong px-3.5 text-[13px] font-medium leading-[18px] text-grey-1">
          Pay crew in 48 h — coming soon
        </div>
      </div>
    </div>
  );
}
