'use client';

/* eslint-disable @next/next/no-img-element */
import { motion } from 'motion/react';
import { ArrowUpRight, Plane } from 'lucide-react';
import type { Production, Travel } from '@/lib/types';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';

/** Minutes since midnight in Vilnius right now, or null if the shoot is not today. */
function nowOnShootDay(dateISO: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  if (`${g('year')}-${g('month')}-${g('day')}` !== dateISO) return null;
  return Number(g('hour')) * 60 + Number(g('minute'));
}

function daysUntil(dateISO: string) {
  const d = Math.round((new Date(`${dateISO}T12:00:00Z`).getTime() - Date.now()) / 86400000);
  return d <= 0 ? null : d === 1 ? 'Tomorrow' : `In ${d} days`;
}

/** A flight as the people waiting for it care about it: when it lands, when they reach set, and the margin before their call. */
export function FlightCard({ p, t, delayedBy }: { p: Production; t: Travel; delayedBy?: number }) {
  const who = p.people.find((x) => x.id === t.personId);
  const call = callTime(p, t.personId);
  const onSet = t.arriveMin + t.transferMin;
  const buffer = call != null ? call - onSet : null;
  const now = nowOnShootDay(p.dateISO);
  const progress = now == null ? 0 : Math.min(1, Math.max(0, (now - t.departMin) / Math.max(1, t.arriveMin - t.departMin)));
  const status = delayedBy ? { text: `Delayed +${delayedBy} min`, cls: 'bg-red-50 text-red-700' }
    : now == null ? { text: daysUntil(p.dateISO) ?? 'Scheduled', cls: 'bg-sky-50 text-sky-800' }
    : progress >= 1 ? { text: 'Landed', cls: 'bg-emerald-50 text-emerald-700' }
    : progress > 0 ? { text: 'In the air', cls: 'bg-sky-50 text-sky-800' }
    : { text: 'On time', cls: 'bg-emerald-50 text-emerald-700' };
  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${t.from} to ${t.to} on ${p.dateISO}`)}`;
  const live = `https://www.google.com/search?q=${encodeURIComponent(`flight ${t.number.replace(/\s/g, '')}`)}`;

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_16px_40px_rgba(20,40,90,.07)]">
      <div className="flex items-center gap-3">
        {who?.photo ? <img src={who.photo} alt="" className="size-9 rounded-full object-cover object-top" /> : <span className="flex size-9 items-center justify-center rounded-full bg-[#e3eaf3] text-[14px]">{who?.name[0]}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium">{who?.name ?? t.personId}</div>
          <div className="text-[12px] text-neutral-500">{t.mode === 'train' ? 'Train' : 'Flight'} {t.number}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${status.cls}`}>{status.text}</span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-[44px] font-light leading-none tracking-[-0.03em]">{t.from}</div>
          <div className="mt-1 text-[13px] text-neutral-500">Departs {fmt(t.departMin)}</div>
        </div>
        <div className="text-right">
          <div className="text-[44px] font-light leading-none tracking-[-0.03em]">{t.to}</div>
          <div className={`mt-1 text-[13px] ${delayedBy ? 'font-medium text-red-700' : 'text-neutral-500'}`}>Lands {fmt(t.arriveMin)}</div>
        </div>
      </div>
      <div className="relative mt-4 h-6">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-neutral-100" />
        <motion.div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-neutral-900" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
        <motion.span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,.12)]" initial={{ left: 0 }} animate={{ left: `${progress * 100}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <Plane className="size-3.5 rotate-45 fill-neutral-900 text-neutral-900" />
        </motion.span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {([['Lands', fmt(t.arriveMin)], ['Car to set', `${t.transferMin} min`], ['On set', fmt(onSet)]] as const).map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-[#f3f6fa] py-2.5">
            <div className="text-[12px] text-neutral-500">{k}</div>
            <div className="text-[17px] tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      {buffer != null && call != null && (
        <p className={`mt-3 text-[13px] ${buffer >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          {buffer >= 0 ? `${buffer} min to spare before the ${fmt(call)} call` : `${-buffer} min late for the ${fmt(call)} call`}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <a href={gf} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-neutral-100 text-[13px] hover:bg-neutral-200">Google Flights <ArrowUpRight className="size-3.5" /></a>
        <a href={live} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-neutral-100 text-[13px] hover:bg-neutral-200">Live status <ArrowUpRight className="size-3.5" /></a>
      </div>
    </div>
  );
}
