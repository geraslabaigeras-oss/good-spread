'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Check, CheckCheck, Plane } from 'lucide-react';

const ease = [0.2, 0.7, 0.2, 1] as const;
const FIXES = [
  { label: 'Swap order', sub: 'Marta first, Ieva from 11:30', cost: '€0', best: true },
  { label: 'Shift the day', sub: 'Everything moves +2 h', cost: '+€535', best: false },
  { label: 'Replace talent', sub: 'Local option, changes the look', cost: '−€430', best: false },
];
const PEOPLE = [['Ieva', '09:00', '11:30'], ['Marta', '11:30', '09:00'], ['Greta', '09:00', '09:00'], ['Tomas', '08:00', '08:00'], ['Lukas', '08:00', '08:00']] as const;

/** The product's moment, live: a flight slips, three priced fixes, one tap, everyone's day updates. Loops. */
export function HeroMoment() {
  const [t, setT] = useState(0); // 0 calm · 1 alert · 2 fixes · 3 approved · 4 seen
  useEffect(() => {
    const seq = [1200, 1600, 2400, 2000, 3200];
    let i = 0, id: ReturnType<typeof setTimeout>;
    const next = () => { i = (i + 1) % 5; setT(i); id = setTimeout(next, seq[i]); };
    id = setTimeout(next, seq[0]);
    return () => clearTimeout(id);
  }, []);
  const approved = t >= 3;
  const seen = t >= 4;

  return (
    <div className="relative h-[460px] select-none">
      {/* board card */}
      <div className="gs-paper absolute inset-x-0 top-10 rounded-[18px] bg-white p-5 shadow-[0_0_0_0.5px_rgba(0,0,0,.1),0_40px_90px_rgba(20,40,90,.16)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-neutral-500">Saturday · Old town courtyard</div>
            <div className="mt-0.5 text-[22px] leading-7 tracking-[-0.01em]">
              {t === 0 ? 'Everything is on schedule.' : approved ? 'Fixed. Everyone has their new time.' : 'Ieva lands 10:45. Pick a fix.'}
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-300 ${t === 0 ? 'bg-emerald-50 text-emerald-700' : approved ? 'bg-neutral-950 text-white' : 'bg-red-50 text-red-700'}`}>{t === 0 ? 'On time' : approved ? 'Plan v2' : 'Delayed +135 min'}</span>
        </div>

        {/* fixes */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {FIXES.map((f, i) => (
            <motion.div key={f.label} animate={{ opacity: t === 0 ? 0.35 : approved && !f.best ? 0.3 : 1, y: t >= 2 || t === 0 ? 0 : 6, scale: approved && f.best ? 1.02 : 1 }} transition={{ duration: 0.5, delay: t === 2 ? i * 0.08 : 0, ease }}
              className={`rounded-xl p-3 ${f.best ? 'shadow-[0_0_0_1.5px_#0d0d0d]' : 'shadow-[0_0_0_0.5px_rgba(0,0,0,.12)]'}`}>
              <div className="flex items-center justify-between text-[12px]"><span className="font-medium">{f.label}</span>{f.best && <span className="rounded-full bg-neutral-950 px-1.5 py-px text-[10px] text-white">Best</span>}</div>
              <div className="mt-0.5 truncate text-[11px] text-neutral-500">{f.sub}</div>
              <div className={`mt-2 text-[22px] font-light tabular-nums ${f.cost.startsWith('+') ? 'text-amber-700' : ''}`}>{f.cost}</div>
              {f.best && <div className={`mt-2 flex h-7 items-center justify-center gap-1 rounded-full text-[12px] font-medium transition-colors duration-300 ${approved ? 'bg-emerald-600 text-white' : 'bg-neutral-950 text-white'}`}>{approved ? <><Check className="size-3.5" /> Approved</> : 'Approve'}</div>}
            </motion.div>
          ))}
        </div>

        {/* people */}
        <div className="mt-4 divide-y divide-black/[0.06]">
          {PEOPLE.map(([name, before, after], i) => {
            const moved = before !== after;
            const now = approved ? after : before;
            return (
              <div key={name} className="flex items-center justify-between py-2 text-[14px]">
                <span>{name}</span>
                <span className="flex items-center gap-3">
                  {approved && moved && <span className="text-[12px] text-neutral-400 line-through">{before}</span>}
                  <span className="inline-flex w-12 justify-end overflow-hidden tabular-nums">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={now} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.45, delay: i * 0.05, ease }} className={approved && moved ? 'rounded-full bg-neutral-950 px-1.5 text-white' : ''}>{now}</motion.span>
                    </AnimatePresence>
                  </span>
                  <span className={`inline-flex w-14 items-center justify-end gap-1 text-[11px] transition-colors duration-300 ${seen ? 'text-[#0a84ff]' : 'text-neutral-300'}`}>{seen ? <><CheckCheck className="size-3.5" /> Seen</> : approved ? 'Sent' : ''}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* notification */}
      <AnimatePresence>
        {t >= 1 && t <= 2 && (
          <motion.div initial={{ y: -40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="absolute left-1/2 top-0 z-10 w-[86%] -translate-x-1/2 rounded-[16px] bg-white/95 p-3 shadow-[0_24px_50px_rgba(0,0,0,.18),0_0_0_0.5px_rgba(0,0,0,.08)]">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white"><Plane className="size-4" /></span>
              <div className="min-w-0">
                <div className="flex justify-between text-[11px] text-neutral-500"><span>good spread · flight status</span><span>now</span></div>
                <div className="text-[14px] font-medium">DA 641 is late</div>
                <div className="text-[13px] text-neutral-600">Ieva now lands 10:45, after her 09:00 call.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {seen && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-neutral-950 px-4 py-2 text-[13px] text-white shadow-[0_14px_30px_rgba(0,0,0,.2)]">
          <CheckCheck className="size-4" /> Fixed in 40 s · 5 people told · 0 messages typed
        </motion.div>
      )}
    </div>
  );
}
