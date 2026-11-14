'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Radio } from 'lucide-react';
import type { Production } from '@/lib/types';
import { fmt } from '@/lib/format';
import { Arrivals } from './Arrivals';
import { RouteGlobe, type LiveDemo } from './RouteGlobe';
import { callsignFor } from './LiveRadar';

type Phase = { key: string; label: string };

/** Travel at the top of the board: globe + who's moving, for the day before, each shoot day, and after. */
export function TravelBand({ p }: { p: Production }) {
  const days = p.shootDays ?? 1;
  const phases: Phase[] = [{ key: 'before', label: 'Day before' }, ...Array.from({ length: days }, (_, i) => ({ key: `d${i}`, label: days > 1 ? `Day ${i + 1}` : 'Shoot day' })), { key: 'after', label: 'After' }];
  const [phase, setPhase] = useState('d0');
  const [demo, setDemo] = useState(false);
  const [live, setLive] = useState<LiveDemo>(null);
  const nameOf = (id: string) => p.people.find((x) => x.id === id)?.name ?? id;
  const wrap = p.blocks.length ? Math.max(...p.blocks.map((b) => b.endMin)) : 1080;
  const firstDay = phase === 'd0';
  const midDay = phase.startsWith('d') && !firstDay;

  const out = p.travel.map((t) => ({ id: t.personId, from: t.from, to: t.to, label: nameOf(t.personId), callsign: callsignFor(t.number), departMin: t.departMin, arriveMin: t.arriveMin, dateISO: p.dateISO }));
  const back = p.travel.map((t) => ({ id: t.personId, from: t.to, to: t.from, label: nameOf(t.personId), callsign: null, departMin: wrap + 120, arriveMin: wrap + 120 + Math.max(60, t.arriveMin - t.departMin), dateISO: p.dateISO }));
  const legs = phase === 'after' ? back : out;
  const progress = phase === 'before' ? 0.03 : phase === 'after' ? 0.35 : midDay ? 0.97 : 0.6;
  const note = phase === 'before' ? `${p.travel.length} ${p.travel.length === 1 ? 'person flies' : 'people fly'} in tomorrow morning. Check-in opens 24 h before.`
    : phase === 'after' ? `Return flights after wrap at ${fmt(wrap)}.`
    : midDay ? `Everyone is in ${p.city ?? 'town'}. No flights today.`
    : undefined;
  const first = p.travel[0] ? nameOf(p.travel[0].personId).split(' ')[0] : '';

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-white/80 p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]">
          {phases.map((ph) => (
            <button key={ph.key} onClick={() => { setPhase(ph.key); if (ph.key !== 'd0') setDemo(false); }} className={`h-9 rounded-full px-4 text-[14px] transition-colors ${phase === ph.key ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}>{ph.label}</button>
          ))}
        </div>
        {firstDay && (
          <button onClick={() => setDemo((x) => !x)} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] transition-colors ${demo ? 'bg-neutral-950 text-white' : 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50'}`}>
            <Radio className="size-4" /> {demo ? 'Stop live demo' : `Track a real plane as ${first}'s flight`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative">
          <RouteGlobe key={phase} legs={legs} height={460} progress={progress} demoLive={demo && firstDay} onLive={setLive} title={phase === 'after' ? 'Going home' : 'Travel'} note={note} />
          {demo && live && (
            <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-4 gap-3 rounded-2xl bg-neutral-950/90 p-4 text-white">
              <div><div className="text-[11px] text-white/60">Standing in</div><div className="truncate text-[16px]">{live.callsign}</div></div>
              <div><div className="text-[11px] text-white/60">From {p.travel[0]?.to}</div><div className="text-[16px] tabular-nums">{live.distKm} km</div></div>
              <div><div className="text-[11px] text-white/60">Altitude</div><div className="text-[16px] tabular-nums">{live.altM != null ? `${Math.round(live.altM / 10) * 10} m` : '—'}</div></div>
              <div><div className="text-[11px] text-white/60">Speed</div><div className="text-[16px] tabular-nums">{live.speedKmh != null ? `${live.speedKmh} km/h` : '—'}</div></div>
            </div>
          )}
          {demo && !live && <div className="absolute bottom-4 left-4 z-10 rounded-full bg-white/90 px-4 py-2 text-[13px] text-neutral-600">Looking for a plane in the air near {p.travel[0]?.to}…</div>}
        </div>
        {phase === 'd0' ? <Arrivals p={p} /> : (
          <div className="rounded-[24px] bg-white/80 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
            <div className="text-[17px] font-medium">{phase === 'after' ? 'Departures' : phase === 'before' ? 'Flying in tomorrow' : 'On set'}</div>
            <div className="mt-3 divide-y divide-black/[0.06]">
              {p.travel.map((t) => {
                const who = p.people.find((x) => x.id === t.personId);
                const right = phase === 'after' ? `Leaves ${fmt(wrap + 120)}` : phase === 'before' ? `Lands ${fmt(t.arriveMin)}` : 'In town';
                const sub = phase === 'after' ? `${t.to} → ${t.from} · car from set ${fmt(wrap + 15)}` : phase === 'before' ? `${t.from} → ${t.to} · reminder sent tonight` : `Hotel near ${p.studio.name.split(',')[0]}`;
                return (
                  <div key={t.personId} className="flex items-center gap-3 py-3">
                    {who?.photo ? <img src={who.photo} alt="" className="size-10 rounded-full object-cover object-top" /> : <span className="flex size-10 items-center justify-center rounded-full bg-neutral-200">{who?.name[0]}</span>}
                    <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{who?.name}</span><span className="block truncate text-[13px] text-neutral-500">{sub}</span></span>
                    <span className="shrink-0 text-[14px] tabular-nums">{right}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
