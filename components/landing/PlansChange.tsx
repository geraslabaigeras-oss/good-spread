'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { CheckCheck, Cloud, CloudRain, CloudSun, Plane, RotateCcw, Sun } from 'lucide-react';
import { StormSky } from '@/components/board/WeatherCard';
import { BrandLogo } from '@/components/brand-logo';

const ease = [0.2, 0.7, 0.2, 1] as const;
const CAST = ['photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1508964801641-4b2410705b73', 'photo-1590972381381-c863cbbf9dd2', 'photo-1635262090780-2ed9e994fff4'];
const img = (id: string) => `https://images.unsplash.com/${id}?fm=jpg&q=60&w=200&auto=format&fit=crop`;

function Roll({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`inline-flex overflow-hidden ${className ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.52, ease }}>{value}</motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Plays once when it scrolls into view; Replay runs it again. */
function useChapter(delay = 900) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const [on, setOn] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!inView) return;
    setOn(false);
    const id = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(id);
  }, [inView, run, delay]);
  return { ref, on, replay: () => setRun((n) => n + 1) };
}

function Chapter({ n, title, sub, children, cref, onReplay }: { n: string; title: React.ReactNode; sub: string; children: React.ReactNode; cref: React.RefObject<HTMLDivElement | null>; onReplay: () => void }) {
  return (
    <div ref={cref} className="grid min-h-[560px] grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
      <div>
        <div className="text-[14px] text-neutral-500">{n}</div>
        <h3 className="mt-2 text-[52px] font-medium leading-[1.02] tracking-[-0.04em]">{title}</h3>
        <p className="mt-3 text-[18px] text-neutral-500">{sub}</p>
        <button onClick={onReplay} className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-950"><RotateCcw className="size-3.5" /> Replay</button>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function PlansChange() {
  const storm = useChapter(800);
  const flight = useChapter(900);
  const told = useChapter(700);
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    if (!told.on) { setSeen(0); return; }
    const id = setInterval(() => setSeen((n) => (n >= 5 ? n : n + 1)), 650);
    return () => clearInterval(id);
  }, [told.on]);

  const plan = storm.on
    ? [['10:00', 'Hair & make-up', 'Studio'], ['11:00', 'Look 02 · Exterior', 'Old town courtyard'], ['14:00', 'Look 01 · Studio', 'Talent 01'], ['17:30', 'Wrap', 'Driver to VNO 18:10']]
    : [['10:00', 'Hair & make-up', 'Studio'], ['11:00', 'Look 01 · Studio', 'Talent 01'], ['14:00', 'Look 02 · Exterior', 'Old town courtyard'], ['17:30', 'Wrap', 'Driver to VNO 18:10']];
  const msgs = [
    { app: 'whatsapp' as const, who: 'Talent 01', text: 'Your call moved 12:45 → 13:15. Driver waits at arrivals 10:50.' },
    { app: 'imessage' as const, who: 'Photographer', text: 'Exterior first at 11:00, before the rain. Studio after lunch.' },
    { app: 'gmail' as const, who: 'Studio', text: 'Booking stays 08:00–18:00. Rain cover +€170 added.' },
  ];

  return (
    <section id="changes" className="relative z-[1] px-6 pt-24">
      <div className="relative mx-auto max-w-[1280px]">
        <h2 className="max-w-[820px] text-[56px] font-normal leading-[1.03] tracking-[-0.04em]">Something always breaks. <span className="text-neutral-400">The plan fixes itself.</span></h2>
        <p className="mt-4 text-[13px] text-neutral-400">Mockup data</p>

        {/* 1. Storm */}
        <Chapter n="09:12 · Weather" cref={storm.ref} onReplay={storm.replay} title={<>Rain at 14:00.</>} sub="Exterior shot first. Before the storm.">
          <div className="relative overflow-hidden rounded-[20px] shadow-[0_0_0_0.5px_rgba(0,0,0,.08),0_30px_70px_rgba(20,40,90,.12)]" style={{ minHeight: 420 }}>
            <StormSky storm={storm.on} />
            <AnimatePresence>{storm.on && (
              <motion.div initial={{ y: -20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.9 }}
                className="absolute left-1/2 top-[44%] z-20 w-[min(420px,86%)] -translate-x-1/2 rounded-[20px] bg-neutral-950/90 px-5 py-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15),0_0_40px_rgba(140,180,240,.45),0_24px_60px_rgba(0,0,0,.35)]">
                <div className="text-[20px] font-medium">Look 02 moved to 11:00</div>
                <div className="text-[14px] text-white/70">Thunderstorm from 14:00 · crew told</div>
              </motion.div>
            )}</AnimatePresence>
            <div className="relative grid h-full grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="flex flex-col justify-between">
                <div className={`text-[22px] leading-8 transition-colors duration-700 ${storm.on ? 'text-white' : 'text-neutral-950'}`}>{storm.on ? <>Rain at 14:00. <span className="text-white/70">Exterior to 11:00.</span></> : <>Dry until evening. <span className="text-neutral-400">Exterior at 14:00.</span></>}</div>
                <div className="mt-6 flex w-fit gap-1 rounded-xl bg-white/85 p-2.5">
                  {[[10, Sun], [11, Sun], [12, CloudSun], [13, Cloud], [14, storm.on ? CloudRain : Cloud], [15, storm.on ? CloudRain : CloudSun]].map(([h, I]) => { const Icon = I as typeof Sun; return (
                    <div key={h as number} className="flex w-9 flex-col items-center gap-1 text-[11px]"><span className="text-neutral-500">{h as number}</span><Icon className={`size-4 ${storm.on && (h as number) >= 14 ? 'text-[#4f78b3]' : 'text-neutral-700'}`} /><span>{storm.on && (h as number) >= 14 ? '8°' : '10°'}</span></div>
                  ); })}
                </div>
              </div>
              <div className="rounded-[14px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,.08)]">
                <div className="flex items-center justify-between"><span className="text-[17px]">Saturday, Vilnius</span>{storm.on && <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] text-white">Plan updated</span>}</div>
                <motion.div layout className="mt-3 divide-y divide-black/[0.06]">
                  {plan.map(([t, a, b]) => (
                    <motion.div layout key={a} transition={{ duration: 0.75, ease }} className="flex items-center gap-3 py-2.5">
                      <span className="w-12 text-[14px] tabular-nums text-neutral-600">{t}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px]">{a}</span><span className="block truncate text-[12px] text-neutral-500">{b}</span></span>
                      {storm.on && a.includes('Exterior') && <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] text-white">Moved</span>}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </Chapter>

        {/* 2. Flight */}
        <Chapter n="09:40 · Flight status" cref={flight.ref} onReplay={flight.replay} title={<>Flight late.</>} sub="Driver and call move. Nobody else does.">
          <div className="gs-paper relative overflow-hidden rounded-[20px] bg-white p-7 shadow-[0_0_0_0.5px_rgba(0,0,0,.08),0_30px_70px_rgba(20,40,90,.12)]">
            <AnimatePresence>{flight.on && (
              <motion.div initial={{ y: -16, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 1.3 }}
                className="absolute left-1/2 top-[38%] z-20 w-[min(400px,86%)] -translate-x-1/2 rounded-[20px] bg-neutral-950/90 px-5 py-4 text-white shadow-[0_0_40px_rgba(140,180,240,.45),0_24px_60px_rgba(0,0,0,.3)]">
                <div className="text-[20px] font-medium text-[#ffb4a8]">Delayed 25m</div>
                <div className="text-[14px] text-white/70">Late inbound aircraft · call now 13:15</div>
              </motion.div>
            )}</AnimatePresence>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={img(CAST[0])} alt="" className="size-11 rounded-full object-cover object-top" />
                <div><div className="text-[17px] font-medium">Talent 01</div><div className="text-[13px] text-neutral-500">BT 632 · London → Vilnius</div></div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-500 ${flight.on ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{flight.on ? 'Delayed 25 min' : 'On time'}</span>
            </div>
            <svg viewBox="0 0 600 150" className="mt-6 h-[140px] w-full">
              <path id="arc" d="M30 130 Q 300 -20 570 90" fill="none" stroke="#0d0d0d" strokeWidth="1.4" strokeDasharray="2 6" />
              <circle cx="30" cy="130" r="4" fill="#0d0d0d" /><circle cx="570" cy="90" r="4" fill="#0d0d0d" />
              <text x="20" y="148" fontSize="12" fill="#6b6b6b">LHR</text><text x="552" y="112" fontSize="12" fill="#6b6b6b">VNO</text>
              <motion.g initial={false} animate={{ offsetDistance: flight.on ? '62%' : '82%' } as never} transition={{ duration: 1.2, ease }} style={{ offsetPath: "path('M30 130 Q 300 -20 570 90')", offsetRotate: 'auto' } as React.CSSProperties}>
                <path d="M-9 0 L9 0 M2 -7 L6 0 L2 7 M-7 -3 L-5 0 L-7 3" stroke="#0d0d0d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </motion.g>
            </svg>
            <div className="mt-2 grid grid-cols-3 gap-3 border-t border-black/[0.06] pt-5">
              {[['Lands', flight.on ? '10:45' : '10:20'], ['Driver at VNO', flight.on ? '10:50' : '10:25'], ['Her call', flight.on ? '13:15' : '12:45']].map(([k, v], i) => (
                <div key={k}>
                  <div className="text-[12px] text-neutral-500">{k}</div>
                  <div className="text-[38px] font-light tabular-nums tracking-[-0.02em]"><Roll value={v} className={flight.on && i === 2 ? 'rounded-xl bg-neutral-950 px-2 text-white' : ''} /></div>
                </div>
              ))}
            </div>
          </div>
        </Chapter>

        {/* 3. Everyone told */}
        <Chapter n="09:41 · Messages" cref={told.ref} onReplay={told.replay} title={<>Everyone knows.</>} sub="One tap. One message each.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="relative h-[360px]">
              {msgs.map((m, i) => (
                <motion.div key={m.who} initial={false} animate={told.on ? { opacity: 1, y: i * 104, scale: 1 } : { opacity: 0, y: -40, scale: 0.96 }} transition={{ type: 'spring', stiffness: 220, damping: 22, delay: told.on ? 0.2 + i * 0.55 : 0 }}
                  className="absolute inset-x-0 top-0 rounded-[18px] bg-white/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,.12),0_0_0_0.5px_rgba(0,0,0,.06)]">
                  <div className="flex items-center justify-between text-[12px] text-neutral-500"><span className="inline-flex items-center gap-1.5"><BrandLogo name={m.app} size={14} /> {m.app === 'gmail' ? 'Gmail' : m.app === 'imessage' ? 'iMessage' : 'WhatsApp'}</span><span>now</span></div>
                  <div className="mt-1 text-[14px] font-medium">To {m.who}</div>
                  <div className="text-[14px] leading-5 text-neutral-700">{m.text}</div>
                </motion.div>
              ))}
            </div>
            <div className="gs-paper flex flex-col justify-between rounded-[20px] bg-white p-6 shadow-[0_0_0_0.5px_rgba(0,0,0,.08)]">
              <div>
                <div className="text-[15px] text-neutral-500">Seen by</div>
                <div className="mt-1 text-[64px] font-light leading-none tabular-nums tracking-[-0.03em]"><Roll value={`${seen} of 5`} /></div>
              </div>
              <div className="mt-6 flex -space-x-3">
                {CAST.map((c, i) => (
                  <span key={c} className="relative">
                    <img src={img(c)} alt="" className={`size-12 rounded-full object-cover object-top ring-4 ring-white transition-all duration-500 ${i < seen ? '' : 'grayscale opacity-40'}`} />
                    {i < seen && <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#0a84ff] text-white ring-2 ring-white"><CheckCheck className="size-3" /></span>}
                  </span>
                ))}
              </div>
              <div className={`mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-[14px] transition-colors duration-500 ${seen >= 5 ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-500'}`}>
                <Plane className="size-4" /> {seen >= 5 ? 'Fixed in 40 s · 0 messages typed' : 'Sending…'}
              </div>
            </div>
          </div>
        </Chapter>
      </div>
    </section>
  );
}
