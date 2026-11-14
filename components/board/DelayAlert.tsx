'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Production } from '@/lib/types';
import type { PublicPending } from '@/lib/server/views';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';


/** When something breaks, a notification drops in: who, what changed, what it breaks. One tap goes to the fixes. */
export function DelayAlert({ p, pending }: { p: Production; pending: PublicPending | null }) {
  const seen = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const c = pending?.conflicts.find((x) => x.code === 'ARRIVAL' || x.code === 'LATE' || x.code === 'UNAVAILABLE');

  useEffect(() => {
    if (pending && c && seen.current !== pending.inboxId) {
      seen.current = pending.inboxId;
      setOpen(true);
      const id = setTimeout(() => setOpen(false), 9000);
      return () => clearTimeout(id);
    }
  }, [pending, c]);

  if (!c?.personId) return null;
  const who = p.people.find((x) => x.id === c.personId);
  const t = p.travel.find((x) => x.personId === c.personId);
  const call = callTime(p, c.personId);
  const was = t?.scheduledArriveMin;
  const title = c.code === 'ARRIVAL' && t ? `${t.number} is late` : c.code === 'LATE' ? `${who?.name ?? ''} is running late` : `${who?.name ?? ''} can't make it`;
  const body = c.code === 'ARRIVAL' && t
    ? `${who?.name} now lands ${fmt(t.arriveMin)}${was != null ? ` (was ${fmt(was)})` : ''}, ${c.deltaMin} min too late for the ${call != null ? fmt(call) : ''} call.`
    : c.message;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -140, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.62, type: "spring", stiffness: 260, damping: 22 } }}
          exit={{ y: -140, opacity: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed left-1/2 top-5 z-[90] w-[min(560px,calc(100vw-32px))] -translate-x-1/2"
        >
          <div className="gs-paper rounded-[22px] bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,.18),0_0_0_0.5px_rgba(0,0,0,.08)]">
            <div className="flex items-start gap-3">
              {who?.photo ? <img src={who.photo} alt="" className="size-11 shrink-0 rounded-full object-cover object-top" /> : <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[18px] text-white">✈</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[12px] text-neutral-500"><span>good spread · flight status</span><span>now</span></div>
                <div className="mt-0.5 text-[17px] font-medium leading-6">{title}</div>
                <p className="text-[15px] leading-6 text-neutral-700">{body}</p>
                <div className="mt-3 flex gap-2">
                  <a href="#plan" onClick={() => setOpen(false)} className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-[14px] font-medium text-white">See the fixes</a>
                  <button onClick={() => setOpen(false)} className="inline-flex h-10 items-center rounded-full px-3 text-[14px] text-neutral-600 hover:text-neutral-950">Later</button>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-neutral-400 hover:text-neutral-900"><X className="size-4" /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
