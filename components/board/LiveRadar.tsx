'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import type { Map as MLMap, Marker } from 'maplibre-gl';

type Plane = { id: string; callsign: string; country: string; lat: number; lon: number; altM: number | null; speedKmh: number | null; heading: number | null; climb: number | null; onGround: boolean; distKm: number };
type Radar = { airport: { code: string; name: string; lat: number; lon: number }; planes: Plane[]; source: string; at: number; stale?: boolean };

/** ICAO callsign prefix → airline, for the ones that fly around our cities. */
const AIRLINE: Record<string, string> = {
  WZZ: 'Wizz Air', WMT: 'Wizz Air', RYR: 'Ryanair', BTI: 'airBaltic', LOT: 'LOT', DLH: 'Lufthansa', SAS: 'SAS', FIN: 'Finnair', KLM: 'KLM', AFR: 'Air France',
  NOZ: 'Norwegian', NSZ: 'Norwegian', THY: 'Turkish', EZY: 'easyJet', EJU: 'easyJet', BAW: 'British Airways', TAP: 'TAP', ITY: 'ITA', SWR: 'Swiss', AUA: 'Austrian',
  GJT: 'Getjet', KLJ: 'Klasjet', DHK: 'DHL', BCS: 'DHL', VLG: 'Vueling', IBE: 'Iberia', EWG: 'Eurowings', SXS: 'SunExpress', ELY: 'El Al', UAE: 'Emirates', QTR: 'Qatar',
};
const airline = (cs: string) => AIRLINE[cs.slice(0, 3)] ?? null;
/** IATA airline code on a flight number → ICAO callsign prefix. */
const IATA_ICAO: Record<string, string> = { W6: 'WZZ', FR: 'RYR', BT: 'BTI', LO: 'LOT', LH: 'DLH', SK: 'SAS', AY: 'FIN', KL: 'KLM', AF: 'AFR', DY: 'NOZ', D8: 'NSZ', TK: 'THY', U2: 'EZY', BA: 'BAW', TP: 'TAP', AZ: 'ITY', LX: 'SWR', OS: 'AUA', VY: 'VLG', IB: 'IBE', EW: 'EWG' };
export function callsignFor(flightNumber: string) {
  const m = flightNumber.replace(/\s/g, '').toUpperCase().match(/^([A-Z0-9]{2})(\d{1,4})$/);
  return m && IATA_ICAO[m[1]] ? `${IATA_ICAO[m[1]]}${m[2]}` : null;
}

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

function planeEl(highlight: boolean) {
  const el = document.createElement('div');
  el.style.cssText = `width:${highlight ? 30 : 22}px;height:${highlight ? 30 : 22}px;transition:transform 9s linear;`;
  el.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill="${highlight ? '#dc2626' : '#0f172a'}" stroke="#fff" stroke-width="1"/></svg>`;
  return el;
}

/** Live aircraft around the shoot's airport (OpenSky ADS-B), on a light map. The team's own flight is red when it is in the air. */
export function LiveRadar({ airport, watch = [] }: { airport: string; watch?: { callsign: string; label: string }[] }) {
  const { data, error } = useSWR<Radar>(`/api/radar?airport=${airport}`, fetcher, { refreshInterval: 10_000 });
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { m: Marker; el: HTMLDivElement }>());
  const [ready, setReady] = useState(false);
  const watched = new Set(watch.map((w) => w.callsign));

  useEffect(() => {
    if (!box.current || map.current || !data) return;
    let cancelled = false;
    import('maplibre-gl').then(({ Map }) => {
      if (cancelled || !box.current) return;
      map.current = new Map({
        container: box.current, style: 'https://tiles.openfreemap.org/styles/positron',
        center: [data.airport.lon, data.airport.lat], zoom: 7.2, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false,
      });
      map.current.on('load', () => setReady(true));
    });
    return () => { cancelled = true; };
  }, [data]);
  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  useEffect(() => {
    if (!ready || !map.current || !data) return;
    import('maplibre-gl').then(({ Marker }) => {
      const seen = new Set<string>();
      for (const p of data.planes) {
        if (p.onGround) continue;
        seen.add(p.id);
        const hl = watched.has(p.callsign);
        let entry = markers.current.get(p.id);
        if (!entry) {
          const el = planeEl(hl);
          entry = { m: new Marker({ element: el, rotationAlignment: 'map' }).setLngLat([p.lon, p.lat]).addTo(map.current!), el };
          markers.current.set(p.id, entry);
        }
        entry.m.setLngLat([p.lon, p.lat]);
        entry.m.setRotation(p.heading ?? 0);
        entry.el.title = `${p.callsign || 'Unknown'}${airline(p.callsign) ? ` · ${airline(p.callsign)}` : ''}`;
      }
      for (const [id, e] of markers.current) if (!seen.has(id)) { e.m.remove(); markers.current.delete(id); }
    });
  }, [ready, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const flying = data?.planes.filter((p) => !p.onGround) ?? [];
  const landing = flying.filter((p) => (p.climb ?? 0) < -1 && (p.altM ?? 9999) < 4000 && p.distKm < 80).slice(0, 4);
  const ours = flying.filter((p) => watched.has(p.callsign));

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_16px_40px_rgba(20,40,90,.07)]">
      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <div className="flex items-center gap-2 text-[17px] font-medium">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
            Live over {data?.airport.name ?? airport}
          </div>
          <div className="text-[12px] text-neutral-500">{error ? 'Radar is not answering right now' : data ? `${flying.length} planes in the air nearby · updates every 10 s` : 'Connecting…'}</div>
        </div>
        <span className="text-[11px] text-neutral-400">OpenSky Network</span>
      </div>
      <div ref={box} className="mt-3 h-[260px] w-full bg-[#eef2f6]" />
      <div className="space-y-1.5 px-5 py-4">
        {watch.length > 0 && (
          <div className="text-[13px]">
            {ours.length
              ? ours.map((p) => <div key={p.id} className="font-medium text-red-700">{watch.find((w) => w.callsign === p.callsign)?.label}: in the air, {p.distKm} km out, {Math.round((p.altM ?? 0) / 100) * 100} m</div>)
              : <span className="text-neutral-500">Your team&rsquo;s flight{watch.length > 1 ? 's are' : ' is'} not in the air near {airport} right now.</span>}
          </div>
        )}
        {landing.length > 0 && <div className="text-[12px] text-neutral-500">Coming in to land now</div>}
        {landing.map((p) => (
          <div key={p.id} className="flex justify-between text-[13px]">
            <span>{p.callsign || 'Unknown'}{airline(p.callsign) ? <span className="text-neutral-500"> · {airline(p.callsign)}</span> : null}</span>
            <span className="tabular-nums text-neutral-500">{p.distKm} km · {Math.round((p.altM ?? 0) / 10) * 10} m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
