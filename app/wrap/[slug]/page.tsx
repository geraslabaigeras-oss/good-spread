import { notFound } from 'next/navigation';
import { getOrSeed } from '@/lib/server/db';
import { agencyFeeLines, blocksFor, computeBudget, computeOvertime, fmt, lastEnd, money } from '@/lib/engine';

export const dynamic = 'force-dynamic';

const ROLE: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

export default async function WrapPage({ params }: PageProps<'/wrap/[slug]'>) {
  const { slug } = await params;
  const row = await getOrSeed(slug);
  if (!row) notFound();
  const p = row.data;
  const ot = computeOvertime(p);
  const fees = agencyFeeLines(p);
  const budget = computeBudget(p);

  const rows = p.people
    .filter((x) => x.role !== 'producer')
    .map((x) => {
      const bs = blocksFor(p, x.id);
      const start = bs.length ? bs[0].startMin : null;
      const end = lastEnd(p, x.id);
      const otLine = ot.find((l) => l.personId === x.id);
      const fee = fees.find((f) => f.personId === x.id)?.amount ?? 0;
      const overtime = otLine?.amount ?? 0;
      return {
        id: x.id, name: x.name, role: ROLE[x.role], agency: x.agency, commissionPct: x.commissionPct,
        hours: start != null && end != null ? (end - start) / 60 : 0,
        span: start != null && end != null ? `${fmt(start)}–${fmt(end)}` : '—',
        dayRate: x.dayRate, otMin: otLine?.minutes ?? 0, overtime, fee, total: x.dayRate + overtime + fee,
      };
    });
  const studioOt = ot.find((l) => !l.personId);
  const crewTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Good Spread · Wrap</div>
            <h1 className="mt-2 font-display text-[44px] leading-none">{p.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{p.brand} · {p.dateISO} · plan v{p.version} · all figures demo</p>
          </div>
          <a href={`/board/${slug}`} className="text-sm text-muted-foreground underline underline-offset-4">Back to board</a>
        </div>

        <table className="mt-6 w-full text-[15px] tnum">
          <thead>
            <tr className="border-b border-foreground text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="py-2 font-medium">Person</th>
              <th className="py-2 font-medium">Scheduled</th>
              <th className="py-2 text-right font-medium">Hours</th>
              <th className="py-2 text-right font-medium">Day rate</th>
              <th className="py-2 text-right font-medium">Overtime</th>
              <th className="py-2 text-right font-medium">Agency fee</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-hairline">
                <td className="py-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}{r.agency ? ` · ${r.agency}` : ' · freelance'}</div>
                </td>
                <td className="py-3">{r.span}</td>
                <td className="py-3 text-right">{r.hours.toFixed(2).replace(/\.00$/, '')}</td>
                <td className="py-3 text-right">{money(r.dayRate)}</td>
                <td className={`py-3 text-right ${r.overtime ? 'text-ot' : 'text-muted-foreground'}`}>{r.overtime ? `${money(r.overtime)} · ${r.otMin} min` : '—'}</td>
                <td className="py-3 text-right">{r.fee ? `${money(r.fee)} · ${r.commissionPct}%` : '—'}</td>
                <td className="py-3 text-right font-display text-2xl">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="pt-4 text-right text-sm text-muted-foreground">Crew &amp; talent statements</td>
              <td className="pt-4 text-right font-display text-3xl">{money(crewTotal)}</td>
            </tr>
            {studioOt && (
              <tr>
                <td colSpan={6} className="pt-1 text-right text-sm text-ot">Studio extra, {studioOt.minutes} min</td>
                <td className="pt-1 text-right text-ot">{money(studioOt.amount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={6} className="pt-1 text-right text-sm text-muted-foreground">Production total (incl. studio, travel, post, usage, contingency)</td>
              <td className="pt-1 text-right">{money(budget.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-10 flex items-center justify-between border border-hairline bg-card px-6 py-5">
          <div>
            <div className="font-display text-3xl">Pay crew in 48 h</div>
            <div className="text-sm text-muted-foreground">Statements go out from the plan. Nobody chases invoices.</div>
          </div>
          <span className="rounded-sm border border-foreground px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
