'use client';

/* eslint-disable @next/next/no-img-element */
import { memo, useMemo, useState } from 'react';
import { CalendarCheck, Camera, CheckCheck, CloudSun, Package, Plane, Radio, Receipt, Shirt } from 'lucide-react';
import type { Production } from '@/lib/types';
import { fmt, fmtDate } from '@/lib/format';
import { Arrivals } from './Arrivals';
import { RouteGlobe, type LiveDemo } from './RouteGlobe';
import { callsignFor } from './LiveRadar';

function Card({ icon: Icon, title, soon, children }: { icon: typeof Plane; title: string; soon?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-[24px] bg-white/80 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[15px] font-medium"><span className="flex size-8 items-center justify-center rounded-full bg-[#eef3f9]"><Icon className="size-4" /></span>{title}</span>
        {soon && <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] text-neutral-500">Coming soon</span>}
      </div>
      <div className="mt-4 flex-1 text-[14px] text-neutral-700">{children}</div>
    </div>
  );
}

/** Top of the board: what matters before, during and after the shoot. The globe only lives on the shoot day. */
function TravelBandInner({ p }: { p: Production }) {
  const days = p.shootDays ?? 1;
  const phases = [{ key: 'before', label: 'Day before' }, ...Array.from({ length: days }, (_, i) => ({ key: `d${i}`, label: days > 1 ? `Day ${i + 1}` : 'Shoot day' })), { key: 'after', label: 'After' }];
  const [phase, setPhase] = useState('d0');
  const [demo, setDemo] = useState(false);
  const [live, setLive] = useState<LiveDemo>(null);
  const nameOf = (id: string) => p.people.find((x) => x.id === id)?.name ?? id;
  const team = p.people.filter((x) => x.role !== 'producer');
  const wrap = p.blocks.length ? Math.max(...p.blocks.map((b) => b.endMin)) : 1080;
  const tkey = JSON.stringify(p.travel);
  const legs = useMemo(() => p.travel.map((t) => ({ id: t.personId, from: t.from, to: t.to, label: nameOf(t.personId), callsign: callsignFor(t.number), departMin: t.departMin, arriveMin: t.arriveMin, dateISO: p.dateISO })), [tkey]); // eslint-disable-line react-hooks/exhaustive-deps
  const onDay = phase.startsWith('d');
  const first = p.travel[0] ? nameOf(p.travel[0].personId).split(' ')[0] : '';
  const d = p.deliverables;
  const deliveryISO = d?.deadlineISO;

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-white/80 p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]">
          {phases.map((ph) => (
            <button key={ph.key} onClick={() => { setPhase(ph.key); if (ph.key !== 'd0') setDemo(false); }} className={`h-9 rounded-full px-4 text-[14px] transition-colors ${phase === ph.key ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}>{ph.label}</button>
          ))}
        </div>
        {phase === 'd0' && p.travel.length > 0 && (
          <button onClick={() => setDemo((x) => !x)} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] transition-colors ${demo ? 'bg-neutral-950 text-white' : 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50'}`}>
            <Radio className="size-4" /> {demo ? 'Stop live demo' : `Track a real plane as ${first}'s flight`}
          </button>
        )}
      </div>

      {/* Shoot day: globe (built once, kept) + arrivals */}
      <div className={onDay && p.travel.length > 0 ? 'grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]' : 'hidden'}>
        <div className="relative">
          <RouteGlobe legs={legs} height={420} progress={phase === 'd0' ? 0.6 : 0.97} demoLive={demo && phase === 'd0'} onLive={setLive} note={phase === 'd0' ? undefined : `Everyone is in ${p.city ?? 'town'}. No flights today.`} />
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
        <Arrivals p={p} />
      </div>

      {/* Day before: prep */}
      {phase === 'before' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card icon={CalendarCheck} title="Call sheet">
            <div className="text-[28px] font-light tabular-nums">{team.length} people</div>
            <p className="mt-1 text-neutral-500">Sent tonight at 18:00 with each person&rsquo;s own call time. You see who has opened it.</p>
          </Card>
          <Card icon={Plane} title="Flights tomorrow">
            {p.travel.length ? p.travel.map((t) => <div key={t.personId} className="flex justify-between py-0.5"><span className="truncate">{nameOf(t.personId)}</span><span className="tabular-nums text-neutral-500">lands {fmt(t.arriveMin)}</span></div>) : <p className="text-neutral-500">Everyone is local.</p>}
            {p.travel.length > 0 && <p className="mt-2 text-[12px] text-neutral-500">Check-in reminders go out 24 h before.</p>}
          </Card>
          <Card icon={Shirt} title="Wardrobe and kit" soon>
            {p.looks.slice(0, 4).map((l) => <div key={l.id} className="flex justify-between py-0.5"><span className="truncate">{l.name}</span><span className="text-neutral-400">{l.garment}</span></div>)}
            <p className="mt-2 text-[12px] text-neutral-500">Packing list and pick-up from the brand.</p>
          </Card>
          <Card icon={CloudSun} title="Tomorrow">
            <div className="text-[28px] font-light">{fmtDate(p.dateISO).slice(0, 10)}</div>
            <p className="mt-1 text-neutral-500">First call {p.blocks.length ? fmt(Math.min(...p.blocks.map((b) => b.startMin))) : '—'} at {p.studio.name.split(',')[0]}. Forecast is on the weather card below.</p>
          </Card>
        </div>
      )}

      {/* Mid-shoot days without a globe */}
      {onDay && p.travel.length === 0 && (
        <div className="rounded-[24px] bg-white/80 p-5 text-[15px] text-neutral-600 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">Everyone is based in {p.city ?? 'town'}. No flights to watch.</div>
      )}

      {/* After: wrap */}
      {phase === 'after' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card icon={Plane} title="Going home">
            {p.travel.length ? p.travel.map((t) => <div key={t.personId} className="flex justify-between py-0.5"><span className="truncate">{nameOf(t.personId)}</span><span className="tabular-nums text-neutral-500">{t.to} → {t.from}</span></div>) : <p className="text-neutral-500">Everyone is local.</p>}
            <p className="mt-2 text-[12px] text-neutral-500">Car from set at {fmt(wrap + 15)} after wrap.</p>
          </Card>
          <Card icon={Package} title="Kit returns" soon>
            <p className="text-neutral-500">Rental returns, samples back to the brand, damages logged with photos.</p>
          </Card>
          <Card icon={Camera} title="Selects and delivery">
            <div className="text-[28px] font-light tabular-nums">{d?.stills ?? 0} stills{d?.motion ? ` · ${d.motion} clips` : ''}</div>
            <p className="mt-1 text-neutral-500">{deliveryISO ? `Delivered by ${fmtDate(deliveryISO).slice(0, 10)}.` : 'Delivery date set in the brief.'}</p>
          </Card>
          <Card icon={Receipt} title="Payments" soon>
            <div className="text-[28px] font-light">{team.length} statements</div>
            <p className="mt-1 text-neutral-500">Hours, overtime and agency fees per person. Pay crew in 48 h.</p>
            <a href={`/wrap/${p.slug}`} className="mt-2 inline-flex items-center gap-1 text-[13px] text-neutral-900 underline underline-offset-4"><CheckCheck className="size-3.5" /> See statements</a>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Only re-render when the travel or schedule actually changes (the board polls every 2 s). */
export const TravelBand = memo(TravelBandInner, (a, b) => a.p.version === b.p.version && JSON.stringify(a.p.travel) === JSON.stringify(b.p.travel) && a.p.dateISO === b.p.dateISO);
