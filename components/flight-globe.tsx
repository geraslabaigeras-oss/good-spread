'use client';

import { useEffect, useState } from 'react';
import Globe from '@/components/flow/Globe';
import '@/components/flow/flow-theme.css';
import { CITY } from '@/components/glass/Globe';
import { IATA, type City } from '@/data/catalog';
import type { Airport } from '@/lib/flow/scenario';

const airport = (c: string): Airport => {
  const p = CITY[c] ?? CITY.Vilnius;
  return { code: IATA[c as City] ?? c.slice(0, 3).toUpperCase(), city: c, lat: p.lat, lon: p.lng, utcOffsetH: 2 };
};

/**
 * The good-spread line globe with the plane, for the first person who travels in.
 * With nobody flying it rests on the shoot city.
 */
export function FlightGlobe({ from, to, label, height = 520 }: { from?: string | null; to: string; label?: string; height?: number | string }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!from || from === to) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((((now - start) / 7000) % 1.25) / 1.25); // 7 s flight, short pause at arrival
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);

  const a = airport(from && from !== to ? from : to);
  const b = airport(to);
  return (
    <div className="flow relative overflow-hidden rounded-[32px] !bg-transparent" style={{ height }}>
      <Globe from={a} to={b} progress={from && from !== to ? Math.min(1, t * 1.25) : 1} fromLabel={a.code} toLabel={label ?? b.code} shiftX={0} />
    </div>
  );
}
