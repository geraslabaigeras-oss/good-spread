'use client';

import useSWR from 'swr';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import type { MeState } from '@/lib/server/views';
import { clock } from '@/lib/format';
import {
  badgePop, CALL_CHANGE, highlight, highlightReduced, oldTimeSmall, scrim, sheet, strikeLine, timeIn, timeOut, tPress, useReveal,
} from '@/lib/motion';
import { Button, ToastProvider, useToast, Wordmark } from '@/components/kit';
import { Stage } from '@/components/glass/Stage';
import { cn } from '@/lib/utils';

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export function MyDay({ token }: { token: string }) {
  return (
    <Stage>
      <div className="board-dark">
        <ToastProvider position="bottom-center">
          <MyDayInner token={token} />
        </ToastProvider>
      </div>
    </Stage>
  );
}

type Phase = { version: number; kind: 'striking' | 'settled'; oldBig: string } | null;

function MyDayInner({ token }: { token: string }) {
  const { data, mutate, error } = useSWR<MeState | null>(`/api/me/${token}`, fetcher, { refreshInterval: 2000 });
  const toast = useToast();
  const reduce = useReducedMotion();
  const { parent, item } = useReveal();
  const [flashVersion, setFlashVersion] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const prevVersion = useRef<number | null>(null);

  // §5.10: version change → vibrate, highlight, strike + roll when the call moved.
  useEffect(() => {
    if (!data) return;
    const pv = prevVersion.current;
    prevVersion.current = data.version;
    if (pv == null || data.version <= pv) {
      if (pv != null && data.version < pv) { setPhase(null); setSeenAt(null); }
      return;
    }
    setSeenAt(null);
    if (!data.changedNow) return;
    try { navigator.vibrate?.(CALL_CHANGE.vibrateMs); } catch {}
    setFlashVersion(data.version);
    const c = data.lastChange;
    if (c?.kind === 'call_time' && c.before && !reduce) {
      setPhase({ version: data.version, kind: 'striking', oldBig: c.before });
      const t = setTimeout(() => setPhase((ph) => (ph ? { ...ph, kind: 'settled' } : ph)), CALL_CHANGE.strikeMs);
      return () => clearTimeout(t);
    }
    setPhase(null);
  }, [data, reduce]);

  if (data === null) {
    return (
      <Shell>
        <TopBar />
        <p className="mt-10 font-serif text-[32px] leading-9">This link has expired.</p>
        <p className="mt-2 text-[16px] leading-6 text-grey-1">The demo was reset. Scan the QR code again to rejoin.</p>
      </Shell>
    );
  }
  if (!data) return <Shell><TopBar /><p className="mt-10 text-[16px] text-grey-1">{error ? 'Reconnecting…' : 'Loading your day…'}</p></Shell>;

  async function post(url: string, body: object) {
    setBusy(true);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await mutate();
      return r.ok;
    } finally {
      setBusy(false);
    }
  }

  const gotIt = async () => {
    if (await post('/api/ack', { token })) setSeenAt(clock(new Date().toISOString()));
  };
  const late = async (m: 15 | 30 | 60 | 'unavailable') => {
    setSheetOpen(false);
    if (await post('/api/late', { token, minutes: m })) {
      toast(m === 'unavailable' ? 'Sent to producer: can’t make it' : `Sent to producer: running ${m} min late`, { check: true });
    }
  };
  const cantMake = () => {
    if (confirm('Tell the producer you can’t make it today?')) late('unavailable');
  };

  // The first render with a new version must already show the old time (no flicker before the effect runs).
  const lc = data.lastChange;
  const freshStrike =
    prevVersion.current != null && data.version > prevVersion.current && data.changedNow && lc?.kind === 'call_time' && !!lc.before && !reduce;
  const striking = freshStrike || (phase && phase.version === data.version && phase.kind === 'striking');
  const bigTime = striking ? (freshStrike ? lc!.before! : phase!.oldBig) : data.call ?? '—';
  const showSmallOld = !striking && !!data.oldCall;
  const animateIn = phase && phase.version === data.version && phase.kind === 'settled';

  return (
    <Shell>
      <motion.div variants={parent} initial="hidden" animate="shown">
        <motion.div variants={item}>
          <TopBar badge={data.updatedBadge} />
        </motion.div>

        {data.released ? (
          <motion.div variants={item} className="mt-6">
            <div className="font-serif text-[32px] leading-9 tracking-[-0.01em]">{data.person?.name}</div>
            <div className="label mt-1">{data.person?.roleLabel}</div>
            <p className="mt-8 text-[16px] leading-6">{data.lastChange?.text ?? 'You are no longer on this shoot.'}</p>
          </motion.div>
        ) : (
          <>
            <motion.div variants={item} className="mt-6">
              <div className="font-serif text-[32px] leading-9 tracking-[-0.01em]">{data.person?.name}</div>
              <div className="label mt-1">{data.person?.roleLabel} · {data.title}</div>
            </motion.div>

            {/* Call time block (§3.3, §5.10) */}
            <motion.div variants={item} className="relative isolate mt-8 -mx-2 rounded-[10px] px-2 pb-2">
              {flashVersion === data.version && (
                <motion.div
                  key={`hl-${data.version}`}
                  variants={reduce ? highlightReduced : highlight}
                  initial="initial"
                  animate="animate"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-action-tint"
                />
              )}
              <div className="label pt-2">Call time</div>
              <div className="h-8">
                <AnimatePresence initial={false}>
                  {showSmallOld && (
                    <motion.span
                      key={`old-${data.oldCall}`}
                      variants={oldTimeSmall}
                      initial={animateIn ? 'initial' : false}
                      animate="animate"
                      className="relative inline-block font-serif text-[28px] leading-8 tracking-[-0.01em] text-grey-1 num"
                    >
                      {data.oldCall}
                      <span className="absolute inset-x-0 top-[calc(50%-1px)] h-0.5 bg-ink" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative overflow-hidden" style={{ fontSize: 'clamp(56px, 24vw, 104px)', lineHeight: 0.9, height: '0.95em' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={bigTime}
                    variants={{ ...timeIn, ...timeOut }}
                    initial={animateIn ? 'initial' : false}
                    animate="animate"
                    exit="exit"
                    className="relative inline-block font-serif tracking-[-0.03em] num"
                    style={{ minWidth: '5ch' }}
                  >
                    {bigTime}
                    {striking && (
                      <motion.span
                        variants={strikeLine}
                        initial="initial"
                        animate="animate"
                        className="absolute inset-x-0 top-[calc(50%-1.5px)] h-[3px] bg-ink"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-6 font-mono text-[15px] leading-[22px] num">
                {data.travel ? (
                  <>You land {data.travel.lands} · car to studio {data.travel.transferMin} min</>
                ) : data.leaveBy ? (
                  <>Leave by {data.leaveBy}</>
                ) : null}
              </div>
              {data.changedNow && data.lastChange && (
                <p className="mt-2 text-[16px] leading-6">{data.lastChange.text}</p>
              )}
              {data.lateReported && (
                <p className="mt-2 text-[16px] leading-6 text-grey-1">
                  {data.lateReported === 'unavailable' ? 'You told the producer you can’t make it.' : `You told the producer you’re ready at ${data.lateReported}.`}
                  {data.pendingDecision ? ' Waiting for their decision.' : ''}
                </p>
              )}
            </motion.div>

            <motion.div variants={item}>
              <Section label="Where">
                <p className="text-[16px] leading-6">{data.studio.name}</p>
                <p className="text-[16px] leading-6 text-grey-1">{data.studio.address}</p>
                <a href={data.studio.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[16px] font-medium leading-6 text-action">
                  Open map <ArrowUpRight size={16} strokeWidth={1.5} />
                </a>
              </Section>
              {data.looks.length > 0 && (
                <Section label="Your looks">
                  {data.looks.map((l) => (
                    <div key={l.id} className="flex h-11 items-center border-b border-hairline text-[16px] leading-6 last:border-b-0">
                      <span className="font-mono">{l.id}</span>&nbsp;· {l.garment}
                    </div>
                  ))}
                </Section>
              )}
              <Section label="On set">
                <p className="text-[16px] leading-6">{data.team.map((x) => x.name).join(' · ')}</p>
              </Section>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Fixed action bar (§3.3) */}
      {!data.released || !data.acked ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white/60 px-5 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto max-w-[420px]">
            <GotIt acked={data.acked} seenAt={seenAt} busy={busy} onClick={gotIt} />
            {!data.released && (
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" className="h-12 flex-1 text-[16px] leading-6" disabled={busy} onClick={() => setSheetOpen(true)}>Running late</Button>
                <Button variant="ghost" className="h-12 w-[132px] text-[16px] leading-6" disabled={busy} onClick={cantMake}>Can’t make it</Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Running late sheet (§4.13, §5.11) */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div key="scrim" variants={scrim} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-50 bg-[rgb(13_13_13/0.24)]" onClick={() => setSheetOpen(false)} />
            <motion.div
              key="sheet"
              variants={sheet}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] border-t border-hairline bg-white/85 px-5 pt-5 backdrop-blur-2xl"
              style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
            >
              <div className="absolute left-[calc(50%-18px)] top-2 h-1 w-9 rounded-[2px] bg-grey-3" />
              <div className="mx-auto max-w-[420px]">
                <h2 className="mt-2 font-serif text-[24px] leading-7">How late?</h2>
                <div className="mt-4 flex gap-2">
                  {([15, 30, 60] as const).map((m) => (
                    <Button key={m} variant="secondary" size="lg" className="flex-1 font-mono text-[18px] num" onClick={() => late(m)}>+{m}</Button>
                  ))}
                </div>
                <Button variant="ghost" className="mt-3 h-12 w-full text-[16px]" onClick={() => setSheetOpen(false)}>Cancel</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Shell>
  );
}

function GotIt({ acked, seenAt, busy, onClick }: { acked: boolean; seenAt: string | null; busy: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={tPress}
      disabled={acked || busy}
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium leading-6 transition-colors duration-200 ease-[cubic-bezier(.4,0,.2,1)]',
        acked ? 'bg-seen-tint text-seen' : 'bg-action text-white active:bg-action-hover',
      )}
    >
      {acked ? (
        <>
          <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 40 }} className="inline-flex">
            <Check size={18} strokeWidth={1.5} />
          </motion.span>
          {seenAt ? `Seen · ${seenAt}` : 'Seen'}
        </>
      ) : busy ? (
        'Sending…'
      ) : (
        'Got it'
      )}
    </motion.button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh max-w-[420px] bg-paper px-5 pt-4" style={{ paddingBottom: 168 }}>{children}</div>;
}

function TopBar({ badge }: { badge?: string | null }) {
  return (
    <div className="flex h-10 items-center justify-between">
      <Wordmark demo />
      <AnimatePresence>
        {badge && (
          <motion.span key={badge} variants={badgePop} initial="initial" animate="animate" exit="exit" className="inline-flex h-6 items-center rounded-full bg-action px-2.5 font-mono text-[12px] font-medium leading-4 text-white num">
            Updated {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="section mt-8 pt-1">
      <div className="section-head"><span className="label">{label}</span></div>
      {children}
    </section>
  );
}
