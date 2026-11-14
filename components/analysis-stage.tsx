'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { CreativeBrief } from '@/lib/types';
import { WavyBackground } from '@/components/ui/wavy-background';
import { useRoster } from '@/lib/use-roster';

const SHOOTS = ['photo-1550872199-63f4382fe925', 'photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1508964801641-4b2410705b73', 'photo-1590972381381-c863cbbf9dd2', 'photo-1635262090780-2ed9e994fff4', 'photo-1603189343302-e603f7add05a', 'photo-1733322980454-62a1d5727460', 'photo-1739808914849-01ba195c4f93', 'photo-1645561305502-63a9ba09ab09'];
const shot = (id: string) => `https://images.unsplash.com/${id}?fm=jpg&q=60&w=260&auto=format&fit=crop`;

/** Real colours from the image: sample pixels, bucket them, keep the most common distinct ones. */
export async function extractPalette(src: string, n = 6): Promise<string[]> {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 64, 64);
  const px = ctx.getImageData(0, 0, 64, 64).data;
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < px.length; i += 4) {
    const key = `${px[i] >> 5}-${px[i + 1] >> 5}-${px[i + 2] >> 5}`;
    const b = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2]; b.n++;
    buckets.set(key, b);
  }
  const out: [number, number, number][] = [];
  for (const b of [...buckets.values()].sort((a, z) => z.n - a.n)) {
    const col: [number, number, number] = [b.r / b.n, b.g / b.n, b.b / b.n];
    if (out.every((o) => Math.abs(o[0] - col[0]) + Math.abs(o[1] - col[1]) + Math.abs(o[2] - col[2]) > 60)) out.push(col);
    if (out.length >= n) break;
  }
  return out.map(([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`);
}

const STEPS = ['Light', 'Palette', 'Texture', 'Garment', 'Setting'] as const;

/** Pseudo-3D carousel: positions from an angle, no 3D CSS (works everywhere). */
function Ring({ photos }: { photos: string[] }) {
  const [a, setA] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { setA(((t - t0) / 40000) * Math.PI * 2); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0">
      {photos.map((src, i) => {
        const ang = a + (i / photos.length) * Math.PI * 2;
        const depth = (Math.cos(ang) + 1) / 2; // 0 back .. 1 front
        return (
 <img key={src} src={src} alt="" className="absolute left-1/2 top-1/2 h-40 w-28 rounded-2xl object-cover shadow-[0_20px_40px_rgba(20,40,90,.18)]"
            style={{ transform: `translate(-50%, -50%) translateX(${Math.sin(ang) * 460}px) translateY(${(depth - 0.5) * 30}px) scale(${0.6 + depth * 0.4})`, opacity: 0.25 + depth * 0.6, zIndex: Math.round(depth * 10) }} />
        );
      })}
    </div>
  );
}

const LINES = ['Reading the light and the mood', 'Looking at the garment and styling', 'Comparing with similar campaigns', 'Writing your brief'];

/** Calm full-screen reading: the reference in the centre, a slow 3D ring of similar looks spinning around it. */
export function AnalysisStage({ image, brief, onDone }: { image: string; brief: CreativeBrief | null; onDone: () => void }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => Math.min(l + 1, LINES.length - 1)), 1600);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (brief) { const t = setTimeout(onDone, 1800); return () => clearTimeout(t); }
  }, [brief, onDone]);

  // the ring shows real faces from your people (the agency book when it is loaded), else licensed campaign photos
  const roster = useRoster();
  const faces = roster.people.filter((p) => p.photo && p.role === 'model').map((p) => p.photo!).slice(0, 12);
  const photos = faces.length >= 6 ? faces : SHOOTS.map(shot);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-[#f3f6fa]">
      {/* blue waves with depth: a slow, blurred back layer and a sharper front layer */}
      <div className="pointer-events-none absolute inset-0 opacity-70"><WavyBackground containerClassName="h-full" colors={['#dbe7f5', '#c4d7ef', '#e9f0f8']} backgroundFill="#f3f6fa" waveOpacity={0.6} blur={30} speed="slow" waveWidth={160} amplitude={260} spread={0.07} /></div>
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply"><WavyBackground containerClassName="h-full" colors={['#9dbbe3', '#7ea4d6', '#b9cfeb', '#5f8cc7']} backgroundFill="transparent" waveOpacity={0.4} blur={6} speed="slow" waveWidth={36} amplitude={180} spread={0.05} /></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(243,246,250,0)_30%,rgba(243,246,250,.85)_85%)]" />
      {/* 3D ring of similar looks */}
      <div className="relative flex h-[440px] w-full items-center justify-center [perspective:1400px]">
        <Ring photos={photos} />
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9 }}
          className="relative z-30 h-[300px] w-[230px] overflow-hidden rounded-[26px] shadow-[0_40px_90px_rgba(20,40,90,.3)] ring-1 ring-white/60">
          <img src={image} alt="Your reference" className="size-full object-cover" />
        </motion.div>
      </div>
      <div className="relative z-10 mt-6 h-14 text-center">
        <AnimatePresence mode="wait">
          <motion.p key={brief ? 'done' : line} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}
            className="font-[family-name:var(--font-inter)] text-[22px] font-light tracking-[-0.02em] text-neutral-800">
            {brief ? `${brief.garment}. ${brief.aesthetic.slice(0, 3).join(', ')}.` : LINES[line]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-[13px] text-neutral-400">{brief ? 'Your brief is ready' : 'Reading your references'}</p>
      </div>
    </motion.div>
  );
}
