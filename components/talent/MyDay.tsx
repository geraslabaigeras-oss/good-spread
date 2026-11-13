'use client';

import useSWR from 'swr';
import { useEffect, useRef, useState } from 'react';
import type { MeState } from '@/lib/server/views';
import { cn } from '@/lib/utils';

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function MyDay({ token }: { token: string }) {
  const { data, mutate, error } = useSWR<MeState | null>(`/api/me/${token}`, fetcher, { refreshInterval: 2000 });
  const [flash, setFlash] = useState(0);
  const [lateOpen, setLateOpen] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seenVersion = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;
    if (seenVersion.current != null && data.version !== seenVersion.current) {
      if (data.changedNow) {
        setFlash(data.version);
        try {
          navigator.vibrate?.(200);
        } catch {}
      }
      setSent(null);
    }
    seenVersion.current = data.version;
  }, [data]);

  if (data === null) {
    return (
      <Wrap>
        <p className="mt-10 text-lg">This link is no longer active.</p>
        <p className="mt-2 text-sm text-muted-foreground">The producer reset the demo. Scan the QR code again to rejoin.</p>
      </Wrap>
    );
  }
  if (!data) return <Wrap><p className="mt-10 text-muted-foreground">{error ? 'Reconnecting…' : 'Loading your day…'}</p></Wrap>;

  async function post(url: string, body: object) {
    setBusy(true);
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  const gotIt = () => post('/api/ack', { token });
  const late = async (m: 15 | 30 | 60 | 'unavailable') => {
    if (m === 'unavailable' && !confirm("Tell the producer you can't make it today?")) return;
    await post('/api/late', { token, minutes: m });
    setLateOpen(false);
    setSent(m === 'unavailable' ? "Producer told you can't make it." : `Producer told you're running ${m} min late.`);
  };

  if (data.released) {
    return (
      <Wrap>
        <Head d={data} />
        <div key={flash} className={cn('mt-8 border-l-2 border-conflict bg-conflict-soft px-4 py-4', flash && 'flash')}>
          <div className="text-lg font-medium">{data.lastChange?.text ?? 'You are no longer on this shoot.'}</div>
        </div>
        {!data.acked && (
          <button onClick={gotIt} disabled={busy} className="mt-6 h-14 w-full rounded-sm bg-action text-lg font-medium text-white">Got it</button>
        )}
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Head d={data} />

      {/* What changed */}
      {data.changedNow && data.lastChange && (
        <div key={`c-${flash}`} className={cn('mt-5 border-l-2 px-4 py-3', data.acked ? 'border-seen bg-seen-soft' : 'border-action bg-action-soft', flash === data.version && 'flash')}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{data.acked ? 'Seen' : 'What changed'}</div>
          <div className="mt-0.5 text-[17px] font-medium leading-snug">{data.lastChange.text}</div>
        </div>
      )}

      {/* Call time */}
      <div key={`t-${flash}`} className={cn('mt-6', flash === data.version && 'flash')}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your call</div>
        <div className="flex items-baseline gap-4">
          <span className="font-display text-[88px] leading-[0.95] tnum">{data.call ?? '—'}</span>
          {data.oldCall && <span className="font-display text-[34px] text-muted-foreground line-through tnum">{data.oldCall}</span>}
        </div>
        <div className="mt-1 text-[15px]">
          {data.travel ? (
            <>You land <b className="tnum">{data.travel.lands}</b> · car to studio {data.travel.transferMin} min</>
          ) : data.leaveBy ? (
            <>Leave by <b className="tnum">{data.leaveBy}</b></>
          ) : null}
          {data.finish && <span className="text-muted-foreground"> · finish {data.finish}</span>}
        </div>
        {data.lateReported && (
          <div className="mt-1 text-sm text-conflict">
            {data.lateReported === 'unavailable' ? "You told the producer you can't make it." : `You reported ready at ${data.lateReported}.`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 grid gap-2">
        <button
          onClick={gotIt}
          disabled={busy || data.acked}
          className={cn('h-14 w-full rounded-sm text-lg font-medium', data.acked ? 'bg-seen-soft text-seen' : 'bg-action text-white')}
        >
          {data.acked ? 'Seen' : 'Got it'}
        </button>
        {!lateOpen ? (
          <button onClick={() => setLateOpen(true)} className="h-12 w-full rounded-sm border border-input bg-card text-[15px] font-medium">Running late</button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {([15, 30, 60] as const).map((m) => (
              <button key={m} onClick={() => late(m)} disabled={busy} className="h-12 rounded-sm border border-foreground bg-card text-[17px] font-medium tnum">+{m}</button>
            ))}
          </div>
        )}
        {sent && <div className="text-center text-sm text-muted-foreground">{sent} Waiting for the producer.</div>}
        {!sent && data.pendingDecision && <div className="text-center text-xs text-muted-foreground">The producer is deciding on a change.</div>}
      </div>

      {/* Schedule */}
      <Section title="Your day">
        <ol>
          {data.schedule.map((b) => (
            <li key={b.id} className="flex gap-4 border-b border-hairline py-2 text-[15px] last:border-b-0">
              <span className="w-24 shrink-0 text-muted-foreground tnum">{b.start}–{b.end}</span>
              <span>{b.text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Where">
        <div className="text-[15px]">{data.studio.name}</div>
        <div className="text-sm text-muted-foreground">{data.studio.address}</div>
        <a href={data.studio.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-action underline underline-offset-4">Open map</a>
      </Section>

      {data.looks.length > 0 && (
        <Section title="Your looks">
          <ul className="grid grid-cols-2 gap-2">
            {data.looks.map((l) => (
              <li key={l.id} className="border border-hairline bg-card px-3 py-2">
                <div className="text-xs text-muted-foreground">{l.name}</div>
                <div className="text-sm">{l.garment}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="On set">
        <ul className="text-[15px]">
          {data.team.map((x) => (
            <li key={x.name} className="flex justify-between py-0.5"><span>{x.name}</span><span className="text-muted-foreground">{x.role}</span></li>
          ))}
        </ul>
      </Section>

      <button onClick={() => late('unavailable')} disabled={busy} className="mt-8 w-full py-2 text-sm text-muted-foreground underline underline-offset-4">
        Can&apos;t make it
      </button>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-md bg-background px-4 pb-12 pt-5">{children}</div>;
}

function Head({ d }: { d: MeState }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Good Spread</div>
        <div className="mt-2 font-display text-[30px] leading-none">{d.person?.name ?? ''}</div>
        <div className="text-sm text-muted-foreground">{d.person?.roleLabel} · {d.title}</div>
      </div>
      {d.updatedBadge && <span className="mt-1 rounded-sm bg-action px-2 py-1 text-xs font-medium text-white tnum">Updated {d.updatedBadge}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
