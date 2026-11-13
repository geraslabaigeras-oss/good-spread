'use client';

import useSWR from 'swr';
import { useEffect, useRef, useState } from 'react';
import type { BoardState, PublicFix } from '@/lib/server/views';
import { money } from '@/lib/engine/time';
import { Timeline } from './Timeline';
import { Inbox } from './Inbox';
import { BudgetPanel } from './BudgetPanel';
import { JoinQR } from './JoinQR';
import { cn } from '@/lib/utils';

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export const ROLE: Record<string, string> = { producer: 'Producer', model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

export function Board({ slug }: { slug: string }) {
  const { data, error, mutate } = useSWR<BoardState>(`/api/state/${slug}`, fetcher, { refreshInterval: 2000, revalidateOnFocus: true });
  const [qr, setQr] = useState(false);
  const [hoverFix, setHoverFix] = useState<PublicFix | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flashVersion, setFlashVersion] = useState(0);
  const lastVersion = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;
    const v = data.production.version;
    if (lastVersion.current != null && v > lastVersion.current) setFlashVersion(v);
    lastVersion.current = v;
  }, [data]);

  const pending = data?.pending ?? null;
  useEffect(() => {
    if (!pending) setHoverFix(null);
  }, [pending]);

  if (error && !data) return <Shell><p className="p-10 text-conflict">Could not load the board: {String(error.message)}</p></Shell>;
  if (!data) return <Shell><p className="p-10 text-muted-foreground">Loading production…</p></Shell>;

  const p = data.production;

  async function approve(fixId: string) {
    setBusy(fixId);
    try {
      const r = await fetch('/api/fixes/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, fixId }) });
      if (!r.ok) alert(`Approve failed: ${(await r.json().catch(() => ({}))).error ?? r.status}`);
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  async function reset(full: boolean) {
    if (full && !confirm('Full reset: restores the seed AND removes all joined devices and phone numbers. Continue?')) return;
    if (!full && !confirm('Reset the plan to the seed? Devices stay joined.')) return;
    await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full }) });
    lastVersion.current = null;
    await mutate();
  }

  const rev = data.lastRevision;
  const showReceipt = !pending && rev?.receipt && rev.version === p.version;

  return (
    <Shell>
      {/* Header */}
      <header className="flex items-end justify-between gap-6 border-b border-hairline px-8 pb-4 pt-6">
        <div className="flex items-baseline gap-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Good Spread</span>
          <h1 className="font-display text-[34px] leading-none">{p.title}</h1>
          <span className="text-sm text-muted-foreground">
            {p.brand} · {formatDate(p.dateISO)} · {p.studio.name} · cap {money(p.budget.cap)}
          </span>
          <span key={p.version} className={cn('rounded-sm border border-hairline px-2 py-0.5 text-xs tnum', flashVersion === p.version && 'flash')}>
            v{p.version}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-2 text-xs text-muted-foreground">{data.viewerCount} device{data.viewerCount === 1 ? '' : 's'} joined</span>
          <button onClick={() => setQr(true)} className="h-9 rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">Show join QR</button>
          <a href={`/wrap/${slug}`} className="h-9 rounded-sm border border-hairline px-3 text-sm leading-9 hover:bg-muted">Wrap</a>
          <button onClick={() => reset(false)} className="h-7 rounded-sm px-2 text-xs text-muted-foreground hover:bg-muted">Reset</button>
          <button onClick={() => reset(true)} className="h-7 rounded-sm px-2 text-xs text-muted-foreground hover:bg-muted">Full reset</button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-0">
        <main className="min-w-0 border-r border-hairline">
          {/* People strip */}
          <section className="grid grid-cols-6 border-b border-hairline">
            {data.people.map((x) => (
              <div key={`${x.id}-${p.version}`} className={cn('border-r border-hairline px-4 py-3 last:border-r-0', flashVersion === p.version && x.id !== 'producer' && 'flash')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{x.name}</span>
                  {x.role !== 'producer' && <StatusChip status={x.status} />}
                </div>
                <div className="mt-0.5 flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>{ROLE[x.role]}</span>
                  <span className="font-display text-xl leading-none text-foreground tnum">{x.call ?? '—'}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Timeline */}
          <section className="px-8 pb-2 pt-4">
            <SectionTitle right={hoverFix ? <span className="text-action">Previewing: {hoverFix.label}</span> : <span>07:00 – 18:00</span>}>Day</SectionTitle>
            <Timeline production={p} conflicts={data.conflicts} preview={hoverFix?.blocks ?? null} flashVersion={flashVersion} />
          </section>

          {/* Decision / receipt */}
          <section className="px-8 pb-6 pt-2">
            {pending ? (
              <Decision pending={pending} busy={busy} onApprove={approve} onHover={setHoverFix} names={Object.fromEntries(p.people.concat(p.shortlist).map((x) => [x.id, x.name]))} />
            ) : showReceipt ? (
              <ReceiptView label={rev!.receipt!.label ?? rev!.fix_kind ?? ''} r={rev!.receipt!} version={p.version} />
            ) : data.conflicts.length ? (
              <div className="border-l-2 border-conflict bg-conflict-soft px-4 py-3 text-sm text-conflict">{data.conflicts.map((c) => c.message).join(' · ')}</div>
            ) : (
              <div className="flex items-center gap-3 border border-hairline bg-card px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-seen" /> Plan is clean. No conflicts. Drop anything from the inbox to check it.
              </div>
            )}
          </section>
        </main>

        <aside className="flex min-w-0 flex-col">
          <Inbox slug={slug} onApplied={() => mutate()} />
          <BudgetPanel budget={data.budget} />
          <Activity events={data.events} />
        </aside>
      </div>

      <JoinQR open={qr} onOpenChange={setQr} slug={slug} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</h2>
      {right && <div className="text-xs text-muted-foreground">{right}</div>}
    </div>
  );
}

function StatusChip({ status }: { status: 'seen' | 'not_seen' | 'no_device' }) {
  if (status === 'seen') return <span className="rounded-sm bg-seen-soft px-1.5 py-0.5 text-[10px] font-medium text-seen">Seen</span>;
  if (status === 'not_seen') return <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-[10px] text-foreground">Not seen yet</span>;
  return <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">No device</span>;
}

function Decision({
  pending, busy, onApprove, onHover, names,
}: {
  pending: NonNullable<BoardState['pending']>;
  busy: string | null;
  onApprove: (id: string) => void;
  onHover: (f: PublicFix | null) => void;
  names: Record<string, string>;
}) {
  const rec = pending.fixes.find((f) => f.id === pending.recommendedFixId);
  const others = pending.fixes.filter((f) => f.id !== rec?.id && !f.changesCreative);
  const explain = rec
    ? `${rec.label} ${rec.costDelta <= 0 ? 'costs nothing extra' : `costs ${money(rec.costDelta)}`} and keeps the creative` +
      (others.length ? `; the next option costs ${money(Math.min(...others.map((o) => o.costDelta)))}.` : '.')
    : 'No automatic fix keeps the plan clean. Edit manually.';
  return (
    <div>
      <div className="mb-3 border-l-2 border-conflict bg-conflict-soft px-4 py-3">
        {pending.conflicts.map((c, i) => (
          <div key={i} className="text-[15px] font-medium text-conflict">{c.message}</div>
        ))}
        <div className="mt-1 text-xs text-muted-foreground">From {pending.source} · {explain}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {pending.fixes.map((f) => {
          const isRec = f.id === pending.recommendedFixId;
          return (
            <div
              key={f.id}
              onMouseEnter={() => onHover(f)}
              onMouseLeave={() => onHover(null)}
              className={cn('flex flex-col border bg-card p-4', isRec ? 'border-foreground' : 'border-hairline')}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-semibold">{f.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{f.detail}</div>
                </div>
                {isRec && <span className="shrink-0 rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">Recommended</span>}
              </div>
              <div className={cn('mt-3 font-display text-[44px] leading-none tnum', f.costDelta > 0 ? 'text-ot' : '')}>
                {f.costDelta > 0 ? '+' : f.costDelta < 0 ? '−' : ''}{money(Math.abs(f.costDelta))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {f.peopleAffected.length} people affected: {f.peopleAffected.map((id) => names[id]?.split(' ')[0] ?? id).join(', ')}
              </div>
              {f.changesCreative && <div className="mt-2 text-xs font-medium text-conflict">Changes the creative: different talent</div>}
              <button
                disabled={!!busy}
                onClick={() => onApprove(f.id)}
                className={cn(
                  'mt-4 h-10 rounded-sm text-sm font-medium disabled:opacity-50',
                  isRec ? 'bg-action text-white hover:opacity-90' : 'border border-hairline hover:bg-muted',
                )}
              >
                {busy === f.id ? 'Applying…' : 'Approve'}
              </button>
            </div>
          );
        })}
        {!pending.fixes.length && <div className="col-span-3 text-sm text-muted-foreground">No fix leaves the plan conflict-free.</div>}
      </div>
    </div>
  );
}

function ReceiptView({ label, r, version }: { label: string; r: { peopleUpdated: number; messagesTyped: number; overtimeAvoided: number; fixedInSeconds: number }; version: number }) {
  return (
    <div key={version} className="flash">
      <div className="mb-3 flex items-center gap-3 border-l-2 border-seen bg-seen-soft px-4 py-3 text-[15px] font-medium text-seen">
        Fix applied: {label} · v{version} is live on every phone
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Metric label="People updated" value={String(r.peopleUpdated)} />
        <Metric label="Messages typed" value={String(r.messagesTyped)} />
        <Metric label="Overtime avoided" value={money(r.overtimeAvoided)} />
        <Metric label="Fixed in" value={`${r.fixedInSeconds} s`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-[44px] leading-none tnum">{value}</div>
    </div>
  );
}

function Activity({ events }: { events: BoardState['events'] }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-hairline px-5 py-4">
      <SectionTitle>Activity</SectionTitle>
      <ol className="max-h-[220px] space-y-1 overflow-y-auto text-xs">
        {events.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="w-10 shrink-0 text-muted-foreground tnum">{clock(e.created_at)}</span>
            <span className={cn(e.type === 'conflict' && 'text-conflict', e.type === 'approved' && 'text-seen', e.type === 'ack' && 'text-seen', e.type === 'late' && 'text-conflict')}>
              {String(e.payload?.text ?? e.type)}
            </span>
          </li>
        ))}
        {!events.length && <li className="text-muted-foreground">Nothing yet.</li>}
      </ol>
    </section>
  );
}

export function clock(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

