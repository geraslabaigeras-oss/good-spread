'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';

/* ---- Kit effects (good-spread-vibe/effects): sky, clouds, rain, measured double-flicker lightning ---- */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`;
function lightningEnvelope(t: number) {
  if (t < 0 || t >= 1000) return 0;
  if (t < 370) return 0.41 * (t / 370);
  if (t < 500) return 1;
  if (t < 700) return 1 - 0.65 * ((t - 500) / 200);
  if (t < 830) return 0.99;
  return 0.99 * (1 - (t - 830) / 170);
}
function mkBolt(w: number, h: number) {
  let x = w * (0.42 + Math.random() * 0.12), y = -10;
  const main: number[][] = [[x, y]];
  while (y < h * 0.62) { y += 10 + Math.random() * 16; x += (Math.random() - 0.5) * 22; main.push([x, y]); }
  const s = main[3 + Math.floor(Math.random() * 3)] ?? main[main.length - 1];
  let bx = s[0], by = s[1]; const br = [[bx, by]];
  for (let i = 0; i < 5; i++) { by += 10 + Math.random() * 12; bx += 8 + Math.random() * 14; br.push([bx, by]); }
  return [main, br];
}

/** Storm sky that eases between calm and storm. Rain and lightning only when it storms. */
export function StormSky({ storm }: { storm: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef(storm ? 1 : 0);
  target.current = storm ? 1 : 0;
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);
    const clouds = Array.from({ length: 9 }, () => ({ x: Math.random() * w, y: 20 + Math.random() * h * 0.45, r: 120 + Math.random() * 160, v: 6 + Math.random() * 10, a: 0.6 + Math.random() * 0.4, c: 110 + Math.round(Math.random() * 40) }));
    const drops = Array.from({ length: 170 }, () => ({ x: Math.random() * w, y: Math.random() * h, v: 620 + Math.random() * 380, l: 9 + Math.random() * 12, w: 0.6 + Math.random() * 0.7, a: 0.35 + Math.random() * 0.45, k: Math.random() }));
    let level = target.current, last = performance.now(), raf = 0, flashAt = -1e9, bolt: number[][][] | null = null, nextFlash = performance.now() + 2500;
    let visible = true; let idle: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 });
    io.observe(cv);
    const frame = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      level += (target.current - level) * Math.min(1, dt / 900);
      const storm = level, rain = Math.max(0, (level - 0.3) / 0.7);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, mix([247, 247, 247], [150, 154, 158], storm));
      g.addColorStop(1, mix([247, 247, 247], [210, 212, 214], storm));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (const p of clouds) {
        p.x += (p.v * dt) / 1000; if (p.x - p.r > w) p.x = -p.r;
        const a = (0.1 + 0.3 * storm) * p.a;
        const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        rg.addColorStop(0, `rgba(${p.c},${p.c},${p.c + 4},${a})`); rg.addColorStop(1, `rgba(${p.c},${p.c},${p.c + 4},0)`);
        ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.55, 0, 0, 6.283); ctx.fill();
      }
      if (rain > 0.01) {
        ctx.lineCap = 'round';
        for (const d of drops) {
          d.y += (d.v * dt) / 1000; d.x += (d.v * 0.12 * dt) / 1000;
          if (d.y > h + 20) { d.y = -20 - Math.random() * h * 0.3; d.x = Math.random() * w * 1.1 - w * 0.1; }
          if (d.k > rain) continue;
          ctx.strokeStyle = `rgba(255,255,255,${d.a * rain})`; ctx.lineWidth = d.w;
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.12, d.y - d.l); ctx.stroke();
        }
      }
      if (storm > 0.8 && now > nextFlash) { flashAt = now; bolt = mkBolt(w, h); nextFlash = now + 5000 + Math.random() * 4000; }
      const f = lightningEnvelope(now - flashAt);
      if (f > 0.01 && bolt) {
        ctx.fillStyle = `rgba(255,255,255,${0.55 * f})`; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, f * 1.1)})`; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
        for (const pl of bolt) { ctx.beginPath(); pl.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.lineWidth = 0.8; }
      }
      const settledCalm = target.current === 0 && level < 0.01;
      if (reduce || settledCalm || !visible || document.hidden) { raf = 0; idle = setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(frame); }, settledCalm ? 400 : 250); }
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); if (idle) clearTimeout(idle); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 size-full" />;
}

type Forecast = { hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weathercode: number[] } };
const icon = (code: number) => (code >= 95 ? CloudLightning : code >= 71 && code < 80 ? CloudSnow : code >= 51 ? CloudRain : code >= 45 ? CloudFog : code >= 3 ? Cloud : code >= 1 ? CloudSun : Sun);
const fetcher = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null));

/** Real forecast for the shoot day and place (Open-Meteo). When rain hits shoot hours, the sky turns to storm. */
export function WeatherCard({ lat, lng, dateISO, place, exteriorAt, compact }: { lat: number; lng: number; dateISO: string; place: string; exteriorAt?: string; compact?: boolean }) {
  const { data } = useSWR<Forecast | null>(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,weathercode&start_date=${dateISO}&end_date=${dateISO}&timezone=auto`, fetcher);
  const [demoRain, setDemoRain] = useState(false);
  const hours = [9, 10, 11, 12, 13, 14, 15, 16].map((h) => {
    const i = data?.hourly.time.findIndex((t) => t.endsWith(`T${String(h).padStart(2, '0')}:00`)) ?? -1;
    const code = demoRain && h >= 14 ? 63 : i >= 0 ? data!.hourly.weathercode[i] : null;
    const rainP = demoRain && h >= 14 ? 90 : i >= 0 ? data!.hourly.precipitation_probability[i] : null;
    return { h, code, rainP, temp: i >= 0 ? Math.round(data!.hourly.temperature_2m[i]) : null };
  });
  const wet = hours.find((x) => (x.rainP ?? 0) >= 60 || (x.code ?? 0) >= 61);
  const storm = !!wet;
  return (
    <div className={`relative overflow-hidden rounded-[28px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)] ${compact ? '' : 'mt-5'}`} style={{ minHeight: compact ? 260 : 300 }}>
      <StormSky storm={storm} />
      <div className={`relative flex h-full flex-col justify-between gap-5 p-6 ${compact ? 'min-h-[260px]' : 'min-h-[300px] md:flex-row md:items-end'}`}>
        <div className="max-w-[460px]">
          <div className={`text-[13px] ${storm ? 'text-white/80' : 'text-neutral-500'}`}>Weather · {place} · {new Date(`${dateISO}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
          <div className={`mt-1 ${compact ? 'text-[19px] leading-6' : 'text-[26px] leading-8'} ${storm ? 'text-white' : 'text-neutral-950'}`}>
            {!data ? 'Reading the forecast…' : storm ? <>Rain from {String(wet!.h).padStart(2, '0')}:00. <span className={storm ? 'text-white/70' : 'text-neutral-400'}>Shoot {exteriorAt ?? 'the exterior look'} before it, or move it to the studio backup.</span></> : <>Dry all day. <span className="text-neutral-400">Good light for the exterior looks.</span></>}
          </div>
          <button onClick={() => setDemoRain((x) => !x)} className={`mt-4 inline-flex h-9 items-center rounded-full px-4 text-[13px] ${storm ? 'bg-white text-neutral-950' : 'bg-neutral-950 text-white'}`}>{demoRain ? 'Back to the real forecast' : 'Simulate rain at 14:00'}</button>
        </div>
        <div className="flex gap-1 rounded-2xl bg-white/85 p-3">
          {hours.map((x) => { const I = x.code != null ? icon(x.code) : Cloud; return (
            <div key={x.h} className={`flex ${compact ? 'w-8' : 'w-11'} flex-col items-center gap-1 text-[12px]`}>
              <span className="text-neutral-500">{x.h}</span>
              <I className={`size-4 ${x.code != null && x.code >= 51 ? 'text-[#4f78b3]' : 'text-neutral-700'}`} />
              <span className="tabular-nums">{x.temp != null ? `${x.temp}°` : '–'}</span>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
