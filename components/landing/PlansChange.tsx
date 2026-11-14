'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Check, Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { StormSky } from '@/components/board/WeatherCard';
import { BrandLogo } from '@/components/brand-logo';

type Scenario = 'none' | 'delay' | 'rain' | 'budget' | 'talent';
/* Licensed Unsplash fashion photography (credited in the footer), standing in for the cast. */
const CAST: Record<string, string> = {
  'Talent 01': 'photo-1613915617430-8ab0fd7c6baf', 'Talent 02': 'photo-1692180142575-c31fcd106b5b', 'Talent 03': 'photo-1508964801641-4b2410705b73',
  'Talent 04': 'photo-1590972381381-c863cbbf9dd2', 'Talent 05': 'photo-1635262090780-2ed9e994fff4',
};
const img = (id: string) => `https://images.unsplash.com/${id}?fm=jpg&q=60&w=240&auto=format&fit=crop`;
const ease = [0.2, 0.7, 0.2, 1] as const;

/** Mockup data, labelled as such. Tap a change; every tile that depends on it updates. */
const PLAN = {
  none: [['10:00', 'Hair & make-up', 'Studio'], ['11:00', 'Look 01 · Studio', 'Talent 01'], ['14:00', 'Look 02 · Exterior', 'Old town courtyard'], ['17:30', 'Wrap', 'Driver to VNO 18:10']],
  rain: [['10:00', 'Hair & make-up', 'Studio'], ['11:00', 'Look 02 · Exterior', 'Old town courtyard'], ['14:00', 'Look 01 · Studio', 'Talent 01'], ['17:30', 'Wrap', 'Driver to VNO 18:10']],
};

function Roll({ value }: { value: string }) {
  return (
    <span className="inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.52, ease }}>{value}</motion.span>
      </AnimatePresence>
    </span>
  );
}

function Tile({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }}
      className={`gs-paper relative overflow-hidden rounded-[16px] bg-white p-6 shadow-[0_0_0_0.5px_rgba(0,0,0,.08),0_10px_30px_rgba(0,0,0,.05)] transition-transform duration-150 hover:-translate-y-0.5 ${className}`}>
      {children}
    </motion.div>
  );
}

export function PlansChange() {
  const [s, setS] = useState<Scenario>('none');
  const [seen, setSeen] = useState(9);
  useEffect(() => {
    if (s === 'none') { setSeen(9); return; }
    setSeen(0);
    const id = setInterval(() => setSeen((n) => (n >= 9 ? n : n + 1)), 380);
    return () => clearInterval(id);
  }, [s]);

  const delay = s === 'delay', rain = s === 'rain', budget = s === 'budget', talent = s === 'talent';
  const call = delay ? '13:15' : '12:45';
  const total = budget ? 3610 : rain ? 3610 : 3440;
  const cap = budget ? 4000 : 5000;
  const plan = rain ? PLAN.rain : PLAN.none;
  const chat = delay ? 'Call sheet v3: Talent 01 call moved to 13:15. Exterior first at 11:00.' : rain ? 'Rain at 14:00. Exterior moves to 11:00, studio after lunch.' : budget ? 'Budget now €4,000. Retouching cut to 10 images, nothing else changes.' : talent ? 'Talent 02 is out. Talent 05 confirmed for Look 02, same call time.' : 'Call sheet v2 is ready. Look 02 moved to 13:15.';

  return (
    <section id="changes" className="relative bg-[#f7f7f7] px-6 py-28">
      <div className="gs-grain" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[760px] text-[52px] font-normal leading-[1.05] tracking-[-0.035em]">Something always breaks. <span className="text-neutral-400">The plan fixes itself.</span></h2>
          <p className="max-w-[320px] text-[15px] leading-6 text-neutral-600">Tap a change. Every tile that depends on it updates, and the crew gets one message each.</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {([['delay', 'Flight delayed'], ['rain', 'Rain at 14:00'], ['budget', 'Budget cut 20%'], ['talent', 'Talent out']] as [Scenario, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setS(s === k ? 'none' : k)} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] transition-colors duration-150 ${s === k ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-800 shadow-[0_0_0_0.5px_rgba(0,0,0,.12)] hover:bg-neutral-50'}`}>
              <span className={`size-1.5 rounded-full ${s === k ? 'bg-white' : 'bg-neutral-400'}`} />{l}
            </button>
          ))}
          {s !== 'none' && <button onClick={() => setS('none')} className="px-2 text-[13px] text-neutral-500 underline underline-offset-4">Reset</button>}
          <span className="ml-auto text-[12px] text-neutral-400">Mockup data</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Weather + plan */}
          <div className="relative overflow-hidden rounded-[16px] shadow-[0_0_0_0.5px_rgba(0,0,0,.08)] lg:col-span-7" style={{ minHeight: 380 }}>
            <StormSky storm={rain} />
            <div className="relative grid h-full grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="flex flex-col justify-between">
                <div className={`text-[20px] leading-7 ${rain ? 'text-white' : 'text-neutral-950'}`}>{rain ? <>Rain at 14:00. <span className="text-white/70">The exterior look moves to 11:00, before the storm.</span></> : <>Dry until evening. <span className="text-neutral-400">Exterior at 14:00, in the best light.</span></>}</div>
                <div className="mt-6 flex w-fit gap-1 rounded-xl bg-white/85 p-2.5">
                  {[[10, Sun], [11, Sun], [12, CloudSun], [13, Cloud], [14, rain ? CloudRain : Cloud], [15, rain ? CloudRain : CloudSun]].map(([h, I]) => { const Icon = I as typeof Sun; return (
                    <div key={h as number} className="flex w-9 flex-col items-center gap-1 text-[11px]"><span className="text-neutral-500">{h as number}</span><Icon className={`size-4 ${rain && (h as number) >= 14 ? 'text-[#4f78b3]' : 'text-neutral-700'}`} /><span>{rain && (h as number) >= 14 ? '8°' : '10°'}</span></div>
                  ); })}
                </div>
              </div>
              <div className="rounded-[14px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,.08)]">
                <div className="flex items-center justify-between"><span className="text-[17px]">Saturday, Vilnius</span>{rain && <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] text-white">Plan updated</span>}</div>
                <motion.div layout className="mt-3 divide-y divide-black/[0.06]">
                  {plan.map(([t, a, b]) => (
                    <motion.div layout key={a} transition={{ duration: 0.75, ease }} className="flex items-center gap-3 py-2.5">
                      <span className="w-12 text-[14px] tabular-nums text-neutral-600">{t}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px]">{a}</span><span className="block truncate text-[12px] text-neutral-500">{b}</span></span>
                      {rain && a.includes('Exterior') && <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] text-white">Moved</span>}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Flight */}
          <Tile className="lg:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[20px] leading-7">{delay ? <>Talent lands 25 minutes late. <span className="text-neutral-400">The driver and call time follow.</span></> : <>Talent 01 flies in from London. <span className="text-neutral-400">Driver waits at arrivals.</span></>}</div>
              {delay && <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-[12px] text-white">Delayed 25 min</span>}
            </div>
            <svg viewBox="0 0 400 120" className="mt-6 h-[110px] w-full">
              <path d="M20 100 Q 200 -20 380 60" fill="none" stroke="#0d0d0d" strokeWidth="1.4" />
              <circle cx="20" cy="100" r="3.5" fill="#0d0d0d" /><circle cx="380" cy="60" r="3.5" fill="#0d0d0d" />
              <text x="14" y="118" fontSize="11" fill="#6b6b6b">LHR</text><text x="364" y="80" fontSize="11" fill="#6b6b6b">VNO</text>
            </svg>
            <div className="mt-2 grid grid-cols-3 gap-3 border-t border-black/[0.06] pt-4">
              {[['Lands', delay ? '10:45' : '10:20'], ['Driver at VNO', delay ? '10:50' : '10:25'], ['Talent call', call]].map(([k, v]) => (
                <div key={k}><div className="text-[12px] text-neutral-500">{k}</div><div className="text-[30px] font-light tabular-nums"><Roll value={v} /></div></div>
              ))}
            </div>
          </Tile>

          {/* Call time */}
          <Tile className="lg:col-span-3">
            <div className="text-[17px]">Moved, and everyone has seen it.</div>
            {delay && <div className="mt-6 text-[14px] text-neutral-400 line-through">12:45</div>}
            <div className={`${delay ? 'mt-0' : 'mt-11'} text-[64px] font-light leading-none tracking-[-0.03em] tabular-nums`}><Roll value={call} /></div>
            <div className="mt-5 flex items-center justify-between text-[13px] text-neutral-500"><span>Seen by {seen} of 9</span><span className="flex gap-1">{Array.from({ length: 9 }).map((_, i) => <span key={i} className={`size-1.5 rounded-full ${i < seen ? 'bg-neutral-950' : 'bg-neutral-300'}`} />)}</span></div>
          </Tile>

          {/* Budget */}
          <Tile className="lg:col-span-3">
            <div className="flex items-center justify-between"><span className="text-[17px]">Every change, priced live.</span>{(rain || budget) && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]">{rain ? '+€170 rain cover' : 'Cap −20%'}</span>}</div>
            <div className="mt-7 flex items-baseline gap-2"><span className="text-[52px] font-light leading-none tracking-[-0.03em] tabular-nums"><Roll value={`€${total.toLocaleString('en-US')}`} /></span><span className="text-[14px] text-neutral-500">of €{cap.toLocaleString('en-US')}</span></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-200"><motion.div className="h-full rounded-full bg-neutral-950" animate={{ width: `${(total / cap) * 100}%` }} transition={{ duration: 0.8, ease }} /></div>
            <div className="mt-2 flex justify-between text-[12px] text-neutral-500"><span>{Math.round((total / cap) * 100)}% committed</span><span>€{(cap - total).toLocaleString('en-US')} left</span></div>
          </Tile>

          {/* Casting */}
          <Tile className="lg:col-span-3">
            <div className="text-[17px]">Options shuffle. <span className="text-neutral-400">Lead confirmed.</span></div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {(talent ? ['Talent 01', 'Talent 05', 'Talent 03', 'Talent 04'] : ['Talent 01', 'Talent 02', 'Talent 03', 'Talent 04']).map((n, i) => (
                <motion.div layout key={n} transition={{ duration: 0.6, ease }}>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(CAST[n])} alt="" className="size-full object-cover object-top" />
                    {i === 0 || (talent && i === 1) ? <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-2.5" /></span> : null}
                  </div>
                  <div className="mt-1 text-[11px]">{n}</div><div className="text-[10px] text-neutral-500">{i === 0 ? 'Lead' : talent && i === 1 ? 'Replaced' : 'Option'}</div>
                </motion.div>
              ))}
            </div>
          </Tile>

          {/* Crew chat */}
          <Tile className="lg:col-span-3">
            <div className="text-[17px]">The call sheet updates itself.</div>
            <AnimatePresence mode="popLayout">
              <motion.div key={chat} initial={{ y: -30, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="mt-5 rounded-[14px] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,.10),0_0_0_0.5px_rgba(0,0,0,.06)]">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500"><BrandLogo name="whatsapp" size={14} /> WhatsApp · now</div>
                <div className="mt-1 text-[13px] font-medium">Shoot crew</div>
                <p className="text-[13px] leading-5 text-neutral-700">{chat}</p>
              </motion.div>
            </AnimatePresence>
          </Tile>
        </div>
      </div>
    </section>
  );
}
