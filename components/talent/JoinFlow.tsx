'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type P = { id: string; name: string; role: string; isModel: boolean };

const KEY = (slug: string) => `gs-token-${slug}`;

export function JoinFlow({ slug, title, dateISO, people }: { slug: string; title: string; dateISO: string; people: P[] }) {
  const router = useRouter();
  const [pick, setPick] = useState<P | null>(null);
  const [phone, setPhone] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resume, setResume] = useState<{ token: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(slug));
      if (raw) setResume(JSON.parse(raw));
    } catch {}
  }, [slug]);

  async function join() {
    if (!pick) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, personId: pick.id, phone: optIn ? phone : null, optIn }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'invalid_phone' ? 'That phone number does not look right. Use +370… format.' : j.error ?? 'Could not join');
      try {
        localStorage.setItem(KEY(slug), JSON.stringify({ token: j.token, name: pick.name }));
      } catch {}
      router.push(`/p/${j.token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not join');
      setBusy(false);
    }
  }

  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${dateISO}T00:00:00Z`));

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-4 pb-10 pt-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Good Spread</div>
      <h1 className="mt-3 font-display text-[40px] leading-[1.05]">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{date} · demo production</p>

      {resume && !pick && (
        <a href={`/p/${resume.token}`} className="mt-5 flex items-center justify-between border border-foreground bg-card px-4 py-3 text-sm">
          <span>Continue as <span className="font-medium">{resume.name}</span></span>
          <span aria-hidden>→</span>
        </a>
      )}

      {!pick ? (
        <>
          <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Who are you on this shoot?</h2>
          <div className="mt-3 grid gap-2">
            {people.map((x) => (
              <button
                key={x.id}
                onClick={() => setPick(x)}
                className="flex items-center justify-between border border-hairline bg-card px-5 py-5 text-left active:bg-muted"
              >
                <span className="font-display text-[30px] leading-none">{x.isModel ? x.name : x.role}</span>
                <span className="text-sm text-muted-foreground">{x.isModel ? 'Model' : x.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8">
          <button onClick={() => setPick(null)} className="text-sm text-muted-foreground">← Back</button>
          <div className="mt-3 font-display text-[34px] leading-none">{pick.isModel ? pick.name : `${pick.role}, ${pick.name}`}</div>

          <label className="mt-6 flex items-start gap-3 text-[15px]">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1 size-5 accent-[#2B3FD6]" />
            <span>
              Text me updates
              <span className="block text-xs text-muted-foreground">Optional. Only sent when the producer approves a change that affects you. Deleted on reset.</span>
            </span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!optIn}
            placeholder="+370 6xx xxxxx"
            className={cn('mt-3 h-12 w-full border border-input bg-card px-3 text-lg tnum outline-none focus:border-foreground', !optIn && 'opacity-40')}
          />
          {err && <p className="mt-2 text-sm text-conflict">{err}</p>}
          <button onClick={join} disabled={busy || (optIn && !phone.trim())} className="mt-6 h-14 w-full rounded-sm bg-action text-lg font-medium text-white disabled:opacity-40">
            {busy ? 'Opening your day…' : 'See my day'}
          </button>
        </div>
      )}
    </div>
  );
}
