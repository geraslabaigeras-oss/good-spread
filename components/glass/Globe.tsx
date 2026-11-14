'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { GlobeMethods } from 'react-globe.gl';

const ReactGlobe = dynamic(() => import('react-globe.gl'), { ssr: false });

export const CITY: Record<string, { lat: number; lng: number }> = {
  Vilnius: { lat: 54.6872, lng: 25.2797 },
  Lisbon: { lat: 38.7223, lng: -9.1393 },
  Milan: { lat: 45.4642, lng: 9.19 },
};

export type GlobePin = {
  id: string; city: string; label: string; sub: string;
  kind: 'model' | 'photographer' | 'crew' | 'location';
  selected?: boolean; dim?: boolean; photo?: string;
};
export type GlobeArc = { from: string; to: string; label?: string };

type Props = {
  pins: GlobePin[];
  arcs: GlobeArc[];
  focus: string; // city name
  hub?: string; // shoot city, gets a pulse ring
  onPin?: (id: string) => void;
  height?: number | string;
  altitude?: number;
};

const KIND_COLOR: Record<GlobePin['kind'], string> = { model: '#0d0d0d', photographer: '#6e6a69', crew: '#8fa1ad', location: '#c4ae92' };

/** Spread pins that share a city on a small ring so they don't overlap. */
function place(pins: GlobePin[]) {
  const byCity: Record<string, GlobePin[]> = {};
  pins.forEach((p) => (byCity[p.city] ??= []).push(p));
  return pins.map((p) => {
    const group = byCity[p.city];
    const i = group.indexOf(p);
    const c = CITY[p.city] ?? CITY.Vilnius;
    const n = group.length;
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    // two rings when crowded; longitude corrected for latitude so the ring stays round
    const ring = n > 7 && i % 2 ? 1.75 : 1;
    const rad = n === 1 ? 0 : (1.2 + n * 0.28) * ring;
    return { ...p, lat: c.lat + Math.sin(ang) * rad, lng: c.lng + (Math.cos(ang) * rad) / Math.cos((c.lat * Math.PI) / 180) };
  });
}

export function Globe({ pins, arcs, focus, hub, onPin, height = 560, altitude = 1.55 }: Props) {
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [h, setH] = useState(typeof height === 'number' ? height : 560);
  const [countries, setCountries] = useState<object[]>([]);

  useEffect(() => {
    fetch('/globe/countries.geojson').then((r) => r.json()).then((g) => setCountries(g.features)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => { setW(e.contentRect.width); setH(e.contentRect.height); });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  // fly to the focus city
  useEffect(() => {
    const c = CITY[focus];
    if (!c || !ref.current) return;
    ref.current.pointOfView({ lat: c.lat - 8 * altitude / 1.55, lng: c.lng - 6 * (1.55 - altitude), altitude }, 1600);
  }, [focus, w, altitude]);

  const material = useMemo(
    () => new THREE.MeshPhongMaterial({ color: '#e4e2de', emissive: '#d9d6d1', emissiveIntensity: 0.6, shininess: 4 }),
    [],
  );

  const placed = useMemo(() => place(pins), [pins]);
  const arcData = useMemo(
    () => arcs.filter((a) => CITY[a.from] && CITY[a.to]).map((a) => ({
      startLat: CITY[a.from].lat, startLng: CITY[a.from].lng, endLat: CITY[a.to].lat, endLng: CITY[a.to].lng, label: a.label ?? '',
    })),
    [arcs],
  );
  const rings = useMemo(() => (hub && CITY[hub] ? [{ ...CITY[hub] }] : []), [hub]);

  return (
    <div ref={box} style={{ height, maskImage: 'radial-gradient(ellipse 72% 70% at 50% 48%, #000 62%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 72% 70% at 50% 48%, #000 62%, transparent 100%)' }} className="relative w-full">
      <ReactGlobe
        ref={ref}
        width={w}
        height={h}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={material}
        showAtmosphere
        atmosphereColor="#ffffff"
        atmosphereAltitude={0.14}
        hexPolygonsData={countries}
        hexPolygonResolution={3}
        hexPolygonMargin={0.62}
        hexPolygonUseDots
        hexPolygonColor={() => 'rgba(13, 13, 13, 0.42)'}
        arcsData={arcData}
        arcColor={() => ['rgba(13,13,13,0.12)', '#0d0d0d', '#0d0d0d']}
        arcStroke={0.55}
        arcAltitudeAutoScale={0.45}
        arcDashLength={0.45}
        arcDashGap={0.25}
        arcDashAnimateTime={1800}
        ringsData={rings}
        ringColor={() => (t: number) => `rgba(13,13,13,${0.6 * (1 - t)})`}
        ringMaxRadius={5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1100}
        htmlElementsData={placed}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={(d: object) => {
          const p = d as GlobePin;
          const el = document.createElement('div');
          el.className = 'globe-pin';
          const c = KIND_COLOR[p.kind];
          el.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:999px;
              background:${p.selected ? '#0d0d0d' : 'rgba(255,255,255,0.72)'};
              color:${p.selected ? '#fff' : '#0d0d0d'};border:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.7),0 6px 18px rgba(80,60,40,0.12);
              backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font:500 11px/1 var(--font-schibsted),sans-serif;white-space:nowrap;
              opacity:${p.dim ? 0.5 : 1};transition:all .25s">
              <span style="width:${p.photo ? 22 : 18}px;height:${p.photo ? 22 : 18}px;border-radius:999px;background:${p.photo ? `url(${p.photo}) center 20%/cover` : p.selected ? '#fff' : c};display:inline-flex;align-items:center;justify-content:center;
                color:${p.selected ? '#0d0d0d' : '#fff'};font:600 10px/1 var(--font-plex-mono),monospace">${p.photo ? '' : p.label.slice(0, 1)}</span>${p.label}
            </div>`;
          el.onclick = () => onPin?.(p.id);
          return el;
        }}
        onGlobeReady={() => {
          const g = ref.current;
          if (!g) return;
          const ctl = g.controls();
          ctl.autoRotate = true;
          ctl.autoRotateSpeed = 0.35;
          ctl.enableZoom = false;
          const c = CITY[focus];
          if (c) g.pointOfView({ lat: c.lat - 8 * altitude / 1.55, lng: c.lng - 6 * (1.55 - altitude), altitude }, 0);
        }}
      />
    </div>
  );
}
