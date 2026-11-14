'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button, Wordmark } from '@/components/kit';
import { useReveal } from '@/lib/motion';
import { cn } from '@/lib/utils';

type P = { id: string; name: string; role: string; isModel: boolean };
const KEY = (slug: string) => `gs-token-${slug}`;

export function JoinFlow({ slug, people }: { slug: string; title: string; dateISO: string; people: P[] }) {
  const router = useRouter();
  const { parent, item } = useReveal();
  const [pressed, setPressed] = useState<string | null>(null);
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

  function choose(x: P) {
    setPressed(x.id);
    setTimeout(() => setPick(x), 120);
  }

  async function join(withPhone: boolean) {
    if (!pick) return;
    setBusy(true);
    setErr(null);
    try {
      const usePhone = withPhone && optIn && phone.trim();
      const r = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, personId: pick.id, phone: usePhone ? phone : null, optIn: !!usePhone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'invalid_phone' ? 'That number doesn’t look right. Try +370 6… format.' : j.error ?? 'Could not join');
      try { localStorage.setItem(KEY(slug), JSON.stringify({ token: j.token, name: pick.name })); } catch {}
      router.push(`/p/${j.token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not join');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[420px] bg-paper p-5">
      <motion.div variants={parent} initial="hidden" animate="shown">
        <motion.div variants={item} className="flex h-10 items-center">
          <Wordmark demo />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {!pick ? (
            <motion.div key="roles" exit={{ opacity: 0, transition: { duration: 0.16 } }}>
              <motion.h1 variants={item} className="mt-10 font-serif text-[36px] leading-10 tracking-[-0.02em]">Who are you on this shoot?</motion.h1>
              <motion.p variants={item} className="mt-2 text-[16px] leading-6 text-grey-1">Pick one. You’ll get your own day plan.</motion.p>
              <motion.div variants={item} className="mt-6 grid gap-2">
                {people.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => choose(x)}
                    className={cn(
                      'flex h-[72px] items-center justify-between rounded-[20px] bg-paper px-5 text-left',
                      pressed === x.id ? 'border-[1.5px] border-ink' : 'border border-hairline',
                    )}
                  >
                    <span className="font-serif text-[24px] leading-7">{x.isModel ? x.name : x.name}</span>
                    <span className="label">{x.role}</span>
                  </button>
                ))}
              </motion.div>
              {resume && (
                <motion.a variants={item} href={`/p/${resume.token}`} className="mt-6 block text-center text-[16px] leading-6 text-action">
                  Continue as {resume.name}
                </motion.a>
              )}
            </motion.div>
          ) : (
            <motion.div key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2 } }}>
              <h1 className="mt-10 font-serif text-[36px] leading-10 tracking-[-0.02em]">{pick.name}</h1>
              <div className="label mt-1">{pick.role}</div>

              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (e.target.value && !optIn) setOptIn(true); }}
                placeholder="+370 6…"
                className="mt-8 h-14 w-full rounded-[10px] border border-hairline-strong bg-paper px-4 font-mono text-[17px] num placeholder:text-grey-2"
              />
              <label className="mt-2 flex h-11 cursor-pointer items-center gap-3 text-[16px] leading-6">
                <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="sr-only" />
                <span className={cn('inline-flex size-5 items-center justify-center rounded-[4px] border-[1.5px] border-ink', optIn && 'bg-ink text-paper')}>
                  {optIn && <Check size={14} strokeWidth={2} />}
                </span>
                Text me updates
              </label>
              {err && <p className="mt-1 text-[14px] leading-5 text-conflict">{err}</p>}
              <Button variant="primary" size="lg" className="mt-4 w-full" disabled={busy || (optIn && !phone.trim())} onClick={() => join(true)}>
                {busy ? 'Opening…' : 'Open my day'}
              </Button>
              <Button variant="ghost" className="mt-2 h-12 w-full text-[16px]" disabled={busy} onClick={() => join(false)}>Skip</Button>
              <p className="mt-4 text-[13px] leading-[18px] text-grey-1">Demo. Your number is deleted when the demo resets.</p>
              <button onClick={() => { setPick(null); setPressed(null); }} className="mt-4 text-[13px] leading-[18px] text-grey-1 underline underline-offset-2">Pick a different role</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
