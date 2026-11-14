'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Production } from '@/lib/types';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { BoardingPass } from './BoardingPass';

/** Who flies in today, one row each: when they land, if they make their call. Tap a row for the boarding pass. */
export function Arrivals({ p }: { p: Production }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = [...p.travel].sort((a, b) => a.arriveMin - b.arriveMin);
  return (
    <div className="rounded-[24px] bg-white/80 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
      <div className="flex items-baseline justify-between"><span className="text-[17px] font-medium">Arrivals</span><span className="text-[13px] text-neutral-500">{rows.length} flying in</span></div>
      <div className="mt-3 divide-y divide-black/[0.06]">
        {rows.map((t) => {
          const who = p.people.find((x) => x.id === t.personId);
          const call = callTime(p, t.personId);
          const onSet = t.arriveMin + t.transferMin;
          const spare = call != null ? call - onSet : null;
          const late = t.scheduledArriveMin != null && t.arriveMin > t.scheduledArriveMin;
          const isOpen = open === t.personId;
          return (
            <div key={t.personId}>
              <button onClick={() => setOpen(isOpen ? null : t.personId)} className="flex w-full items-center gap-3 py-3 text-left">
                {who?.photo ? <img src={who.photo} alt="" className="size-10 shrink-0 rounded-full object-cover object-top" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[14px]">{who?.name[0]}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{who?.name ?? t.personId}</span>
                  <span className="block text-[13px] text-neutral-500">{t.from} → {t.to} · {t.number === 'TBC' ? 'flight to book' : t.number}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[16px] tabular-nums">
                    {late && <span className="mr-1.5 text-[12px] text-neutral-400 line-through">{fmt(t.scheduledArriveMin!)}</span>}
                    <span className={late ? 'rounded-full bg-neutral-950 px-1.5 text-white' : ''}>{fmt(t.arriveMin)}</span>
                  </span>
                  <span className={`block text-[12px] ${spare != null && spare < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{spare == null ? '' : spare < 0 ? `${-spare} min late for call` : `${spare} min to spare`}</span>
                </span>
                <ChevronDown className={`size-4 shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pb-3">
                    <BoardingPass p={p} t={t} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
