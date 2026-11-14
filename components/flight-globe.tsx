'use client';

import { useMemo } from 'react';
import type { COBEOptions } from 'cobe';
import { Plane } from 'lucide-react';
import { Globe } from '@/components/ui/globe';
import { CITY } from '@/components/glass/Globe';

/**
 * Magic UI Globe (cobe): light and smooth. Blue markers on the shoot city and on wherever someone flies in from.
 */
export function FlightGlobe({ from, to, label, height = 520 }: { from?: string | null; to: string; label?: string; height?: number | string }) {
  const config = useMemo<COBEOptions>(() => {
    const pts = [to, ...(from && from !== to ? [from] : [])].map((c) => CITY[c] ?? CITY.Vilnius);
    return {
      width: 800, height: 800, onRender: () => {}, devicePixelRatio: 2,
      phi: 0, theta: 0.35, dark: 0, diffuse: 1.1, mapSamples: 14000, mapBrightness: 5,
      baseColor: [0.86, 0.9, 0.97], markerColor: [0.16, 0.35, 0.95], glowColor: [0.72, 0.82, 1],
      markers: pts.map((p, i) => ({ location: [p.lat, p.lng] as [number, number], size: i === 0 ? 0.09 : 0.06 })),
    };
  }, [from, to]);

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(80%_70%_at_50%_40%,#eef3ff_0%,#dfe8f7_45%,#cdd9ec_100%)]" style={{ height }}>
      <div className="absolute left-1/2 top-[3%] aspect-square w-[min(460px,78%)] -translate-x-1/2">
        <Globe config={config} className="!max-w-none" />
      </div>
      <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[13px] text-neutral-800 shadow-[0_8px_24px_rgba(30,60,140,.12)] backdrop-blur">
        {from && from !== to ? <><Plane className="size-3.5" /> {from} → {to}{label ? ` · ${label}` : ''}</> : <>Shooting in {to} · nobody flies</>}
      </div>
    </div>
  );
}
