'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { GlobeMethods } from 'react-globe.gl';
import { AIRPORTS } from '@/lib/airports';

const ReactGlobe = dynamic(() => import('react-globe.gl'), { ssr: false });

type Leg = { id: string; from: string; to: string; label: string; callsign?: string | null; departMin: number; arriveMin: number; dateISO: string };
type LivePlane = { id: string; callsign: string; lat: number; lon: number; altM: number | null; heading: number | null; onGround: boolean };

const R = (d: number) => (d * Math.PI) / 180;
const D = (r: number) => (r * 180) / Math.PI;
/** Point along the great circle from a to b at t (0..1). */
function slerp(a: { lat: number; lon: number }, b: { lat: number; lon: number }, t: number) {
  const [φ1, λ1, φ2, λ2] = [R(a.lat), R(a.lon), R(b.lat), R(b.lon)];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  if (d === 0) return { lat: a.lat, lon: a.lon };
  const A = Math.sin((1 - t) * d) / Math.sin(d), B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return { lat: D(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: D(Math.atan2(y, x)) };
}
function bearing(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const [φ1, φ2, Δλ] = [R(a.lat), R(b.lat), R(b.lon - a.lon)];
  return (D(Math.atan2(Math.sin(Δλ) * Math.cos(φ2), Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ))) + 360) % 360;
}
const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => 6371 * 2 * Math.asin(Math.sqrt(Math.sin(R(b.lat - a.lat) / 2) ** 2 + Math.cos(R(a.lat)) * Math.cos(R(b.lat)) * Math.sin(R(b.lon - a.lon) / 2) ** 2));
const ARC = (t: number, peak: number) => 0.004 + peak * Math.sin(Math.PI * t);

/** A small 3D jet: nose to local +y (north), wings on x, top facing out (+z). */
function makePlane(color: string, scale: number) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 });
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 2.2, 6, 12), body);
  g.add(fus);
  // swept wings and tailplane as flat triangles-ish shapes
  const wingShape = new THREE.Shape([new THREE.Vector2(0, 0.35), new THREE.Vector2(1.25, -0.35), new THREE.Vector2(1.25, -0.6), new THREE.Vector2(0, -0.2)]);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: false });
  const r = new THREE.Mesh(wingGeo, body); r.position.set(0.1, 0.1, -0.02); g.add(r);
  const l = new THREE.Mesh(wingGeo, body); l.scale.x = -1; l.position.set(-0.1, 0.1, -0.02); g.add(l);
  const tailShape = new THREE.Shape([new THREE.Vector2(0, 0.15), new THREE.Vector2(0.55, -0.2), new THREE.Vector2(0.55, -0.32), new THREE.Vector2(0, -0.12)]);
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.03, bevelEnabled: false });
  const tr = new THREE.Mesh(tailGeo, body); tr.position.set(0.05, -1.05, -0.015); g.add(tr);
  const tl = new THREE.Mesh(tailGeo, body); tl.scale.x = -1; tl.position.set(-0.05, -1.05, -0.015); g.add(tl);
  const tail = new THREE.Object3D(); tail.position.set(0, -0.92, 0); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.45), body);
  fin.position.set(0, -0.9, 0.22); g.add(fin);
  g.scale.setScalar(scale);
  return g;
}

const fetcher = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null));

/** The team's flights on a globe: route, a 3D plane riding it (live position when it is in the air), and real traffic near the arrival airport. */
export function RouteGlobe({ legs, height = 460 }: { legs: Leg[]; height?: number }) {
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [countries, setCountries] = useState<object[]>([]);
  const planes = useRef(new Map<string, THREE.Object3D>());
  const dest = legs[0]?.to ?? 'VNO';
  const { data: radar } = useSWR<{ planes: LivePlane[] } | null>(`/api/radar?airport=${dest}`, fetcher, { refreshInterval: 15_000 });

  useEffect(() => {
    fetch('/geo/countries-50m.json').then((r) => r.json()).then((topo) => {
      const fc = feature(topo, topo.objects.countries) as unknown as { features: object[] };
      setCountries(fc.features);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(() => box.current && setW(box.current.clientWidth));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const routes = useMemo(() => legs.map((l) => {
    const a = AIRPORTS[l.from], b = AIRPORTS[l.to];
    if (!a || !b) return null;
    const dist = km(a, b);
    const peak = Math.min(0.25, 0.04 + dist / 25000);
    const pts = Array.from({ length: 64 }, (_, i) => { const p = slerp(a, b, i / 63); return [p.lat, p.lon, ARC(i / 63, peak)]; });
    return { l, a, b, dist, peak, pts };
  }).filter((x): x is NonNullable<typeof x> => !!x), [legs]);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const r = routes[0];
    if (!ready || !ref.current || !r) return;
    const mid = slerp(r.a, r.b, 0.5);
    ref.current.pointOfView({ lat: mid.lat - 2, lng: mid.lon, altitude: Math.max(0.35, Math.min(1.6, r.dist / 3500)) }, 1200);
    const c = ref.current.controls() as unknown as { autoRotate: boolean; enableZoom: boolean };
    c.autoRotate = false; c.enableZoom = false;
  }, [routes, ready]);

  const live = radar?.planes ?? [];
  const objects = useMemo(() => {
    const ours = routes.map((r) => {
      const found = r.l.callsign ? live.find((p) => p.callsign === r.l.callsign && !p.onGround) : undefined;
      if (found) return { id: `team-${r.l.id}`, lat: found.lat, lng: found.lon, alt: 0.02, heading: found.heading ?? bearing(r.a, r.b), team: true, live: true };
      const p = slerp(r.a, r.b, 0.6), ahead = slerp(r.a, r.b, 0.61);
      return { id: `team-${r.l.id}`, lat: p.lat, lng: p.lon, alt: ARC(0.6, r.peak), heading: bearing(p, ahead), team: true, live: false };
    });
    const traffic = live.filter((p) => !p.onGround && !routes.some((r) => r.l.callsign === p.callsign)).slice(0, 25)
      .map((p) => ({ id: p.id, lat: p.lat, lng: p.lon, alt: 0.006 + Math.min(0.02, (p.altM ?? 0) / 600000), heading: p.heading ?? 0, team: false, live: true }));
    return [...ours, ...traffic];
  }, [routes, live]);



  const teamObj = useMemo(() => makePlane('#0d0d0d', 1.1), []);
  const trafficObj = useMemo(() => makePlane('#7d8ea3', 0.55), []);
  const globeMat = useMemo(() => new THREE.MeshPhongMaterial({ color: '#dbe6f3', shininess: 8 }), []);
  const anyLive = objects.some((o) => o.team && o.live);

  return (
    <div ref={box} className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_50%_0%,#f4f8fc_0%,#dfe8f3_60%,#cddbeb_100%)] shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]" style={{ height }}>
      <div className="absolute left-6 top-5 z-10">
        <div className="flex items-center gap-2 text-[17px] font-medium">
          <span className={`relative flex size-2 ${anyLive ? '' : 'opacity-60'}`}>{anyLive && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}<span className={`relative inline-flex size-2 rounded-full ${anyLive ? 'bg-emerald-500' : 'bg-neutral-400'}`} /></span>
          Travel
        </div>
        <div className="mt-0.5 text-[13px] text-neutral-600">{anyLive ? 'Live position from the plane itself' : 'Planned route. The plane goes live when it takes off.'}{live.length ? ` · ${live.filter((p) => !p.onGround).length} planes near ${dest} now` : ''}</div>
      </div>
      <ReactGlobe
        ref={ref}
        width={w}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMat}
        showAtmosphere
        atmosphereColor="#a9c2e2"
        atmosphereAltitude={0.16}
        polygonsData={countries}
        polygonCapColor={() => '#f6f8fb'}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#c3d1e2'}
        polygonAltitude={0.004}
        pathsData={routes}
        pathPoints="pts"
        pathPointLat={(p: number[]) => p[0]}
        pathPointLng={(p: number[]) => p[1]}
        pathPointAlt={(p: number[]) => p[2]}
        pathColor={() => '#0d0d0d'}
        pathStroke={2}
        pathDashLength={1}
        pathDashGap={0}
        pathTransitionDuration={0}
        pointsData={routes.flatMap((r) => [{ ...r.a, k: 'a' }, { ...r.b, k: 'b' }])}
        pointLat="lat"
        pointLng="lon"
        pointColor={() => '#0d0d0d'}
        pointAltitude={0.006}
        pointRadius={0.5}
        htmlElementsData={routes.flatMap((r) => [{ lat: r.a.lat, lng: r.a.lon, text: r.l.from }, { lat: r.b.lat, lng: r.b.lon, text: r.l.to }])}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={(d: object) => { const el = document.createElement('div'); el.textContent = (d as { text: string }).text; el.style.cssText = 'transform:translate(-50%,-140%);padding:2px 8px;border-radius:999px;background:#0d0d0d;color:#fff;font:500 12px var(--font-inter),sans-serif;pointer-events:none'; return el; }}
        objectsData={objects}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectRotation={(o: object) => ({ z: -(o as { heading: number }).heading })}
        objectThreeObject={(o: object) => { const d = o as { id: string; team: boolean }; const m = (d.team ? teamObj : trafficObj).clone(); if (d.team) planes.current.set(d.id, m); return m; }}
        enablePointerInteraction={false}
        onGlobeReady={() => setReady(true)}
      />
    </div>
  );
}
