'use client';

/* eslint-disable @next/next/no-img-element */
import { motion } from 'motion/react';
import type { Production, Travel } from '@/lib/types';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { AIRPORTS } from '@/lib/airports';

const AIRLINE: Record<string, string> = {
  DA: 'Demo Air', W6: 'Wizz Air', FR: 'Ryanair', BT: 'airBaltic', LO: 'LOT', LH: 'Lufthansa', SK: 'SAS', AY: 'Finnair', KL: 'KLM', AF: 'Air France',
  DY: 'Norwegian', TK: 'Turkish Airlines', U2: 'easyJet', BA: 'British Airways', TP: 'TAP', AZ: 'ITA Airways', LX: 'Swiss', OS: 'Austrian', VY: 'Vueling', IB: 'Iberia', EW: 'Eurowings',
};
const dur = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

/** The traveller's flight as a boarding pass: route, times (old time struck when it moved), and what it means for their call. */
export function BoardingPass({ p, t, index = 0 }: { p: Production; t: Travel; index?: number }) {
  const who = p.people.find((x) => x.id === t.personId);
  const call = callTime(p, t.personId);
  const onSet = t.arriveMin + t.transferMin;
  const moved = t.scheduledArriveMin != null && t.scheduledArriveMin !== t.arriveMin ? t.arriveMin - t.scheduledArriveMin : 0;
  const buffer = call != null ? call - onSet : null;
  const code = t.number.replace(/\s/g, '').slice(0, 2).toUpperCase();
  const airline = AIRLINE[code] ?? 'Flight';
  const date = new Date(`${p.dateISO}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const status = moved > 0 ? { text: `Delayed ${moved} min`, cls: 'bg-red-600 text-white' } : { text: 'On time', cls: 'bg-emerald-600 text-white' };

  return (
    <motion.div initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.6, delay: index * 0.08 }}
      className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_18px_44px_rgba(20,40,90,.10)]">
      {/* top band */}
      <div className="flex items-center justify-between bg-neutral-950 px-5 py-3 text-white">
        <span className="text-[14px] font-medium">{airline} · {t.number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${status.cls}`}>{status.text}</span>
      </div>

      <div className="px-5 pb-4 pt-4">
        <div className="flex items-center gap-3">
          {who?.photo ? <img src={who.photo} alt="" className="size-9 rounded-full object-cover object-top" /> : <span className="flex size-9 items-center justify-center rounded-full bg-[#e3eaf3] text-[14px]">{who?.name[0]}</span>}
          <div className="min-w-0">
            <div className="text-[12px] text-neutral-500">Passenger</div>
            <div className="truncate text-[16px] font-medium">{who?.name ?? t.personId}</div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[46px] font-light leading-none tracking-[-0.03em]">{t.from}</div>
            <div className="mt-1 truncate text-[12px] text-neutral-500">{AIRPORTS[t.from]?.name ?? ''}</div>
          </div>
          <div className="mb-5 flex flex-1 flex-col items-center text-neutral-400">
            <span className="text-[11px]">{dur(Math.max(0, t.arriveMin - t.departMin))}</span>
            <span className="relative mt-1 h-px w-full bg-neutral-300"><span className="absolute -top-[5px] left-1/2 -translate-x-1/2 bg-white px-1 text-[12px] leading-none text-neutral-900">✈</span></span>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[46px] font-light leading-none tracking-[-0.03em]">{t.to}</div>
            <div className="mt-1 truncate text-[12px] text-neutral-500">{AIRPORTS[t.to]?.name ?? ''}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {([['Date', date], ['Departs', fmt(t.departMin)], ['Lands', fmt(t.arriveMin)]] as const).map(([k, v]) => (
            <div key={k}>
              <div className="text-[12px] text-neutral-500">{k}</div>
              <div className="text-[18px] tabular-nums">
                {k === 'Lands' && moved > 0 && t.scheduledArriveMin != null && <span className="mr-1.5 text-[14px] text-neutral-400 line-through">{fmt(t.scheduledArriveMin)}</span>}
                <span className={k === 'Lands' && moved > 0 ? 'rounded-full bg-neutral-950 px-2 text-white' : ''}>{v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* perforation */}
      <div className="relative h-5">
        <span className="absolute -left-2.5 top-0 size-5 rounded-full bg-[#e8eef6]" />
        <span className="absolute -right-2.5 top-0 size-5 rounded-full bg-[#e8eef6]" />
        <span className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-neutral-200" />
      </div>

      {/* stub: what the flight means for the day */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-5 pt-1">
        <div><div className="text-[12px] text-neutral-500">Car to set</div><div className="text-[18px] tabular-nums">{t.transferMin} min</div></div>
        <div><div className="text-[12px] text-neutral-500">On set</div><div className="text-[18px] tabular-nums">{fmt(onSet)}</div></div>
        <div><div className="text-[12px] text-neutral-500">Call</div><div className="text-[18px] tabular-nums">{call != null ? fmt(call) : '—'}</div></div>
        {buffer != null && (
          <div className={`col-span-3 mt-2 rounded-xl px-3 py-2 text-[13px] ${buffer >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {buffer >= 0 ? `${buffer} min to spare before the call` : `Lands ${-buffer} min too late for the call. See the fixes above.`}
          </div>
        )}
      </div>
    </motion.div>
  );
}
