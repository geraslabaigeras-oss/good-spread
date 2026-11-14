'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Ripple } from '@/components/ui/ripple';
import { Marquee } from '@/components/ui/marquee';
import type { CreativeBrief } from '@/lib/types';

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

/** Full-screen reading of the reference: depth waves, real colours, analysis chips, other shoots drifting by. */
export function AnalysisStage({ image, brief, onDone }: { image: string; brief: CreativeBrief | null; onDone: () => void }) {
  const [palette, setPalette] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  useEffect(() => { extractPalette(image).then(setPalette).catch(() => {}); }, [image]);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), 900);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (brief && step >= STEPS.length) { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }
  }, [brief, step, onDone]);

  const value = (k: (typeof STEPS)[number]) => {
    if (!brief) return null;
    return k === 'Light' ? brief.lighting : k === 'Palette' ? brief.palette.slice(0, 3).join(', ') : k === 'Texture' ? brief.aesthetic.slice(0, 2).join(', ') : k === 'Garment' ? brief.garment : brief.setting;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-[#f6f7f8]">
      {/* other shoots drifting behind */}
      <div className="pointer-events-none absolute inset-x-0 top-[3%] opacity-30 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <Marquee className="[--duration:28s] [--gap:1rem]">{SHOOTS.map((id) => <img key={id} src={shot(id)} alt="" className="h-28 w-20 rounded-xl object-cover grayscale" />)}</Marquee>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[1.5%] opacity-30 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <Marquee reverse className="[--duration:34s] [--gap:1rem]">{[...SHOOTS].reverse().map((id) => <img key={id} src={shot(id)} alt="" className="h-28 w-20 rounded-xl object-cover grayscale" />)}</Marquee>
      </div>

      {/* the reference with depth waves */}
      <div className="relative flex size-[520px] items-center justify-center">
        <Ripple mainCircleSize={300} numCircles={7} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10 h-[300px] w-[240px] overflow-hidden rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,.25)]">
          <img src={image} alt="Reference" className="size-full object-cover" />
          {!brief && <motion.div className="absolute inset-x-0 h-0.5 bg-white shadow-[0_0_24px_6px_rgba(255,255,255,.8)]" animate={{ top: ['4%', '96%', '4%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />}
        </motion.div>
        {/* colours flying out */}
        {palette.map((c, i) => {
          const a = (i / palette.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.span key={c + i} initial={{ x: 0, y: 0, scale: 0, opacity: 0 }} animate={{ x: Math.cos(a) * 215, y: Math.sin(a) * 215, scale: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 120, damping: 14 }}
              className="absolute z-20 size-12 rounded-full shadow-[0_8px_24px_rgba(0,0,0,.18)] ring-4 ring-white" style={{ background: c }} title={c} />
          );
        })}
      </div>

      {/* analysis chips */}
      <div className="relative z-10 mt-2 flex flex-wrap justify-center gap-2">
        {STEPS.map((k, i) => (
          <motion.div key={k} initial={{ opacity: 0.25 }} animate={{ opacity: i < step ? 1 : 0.25 }} className={`rounded-full px-4 py-2 text-[14px] ${i < step ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-500 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]'}`}>
            {k}{value(k) && i < step ? <span className="ml-2 text-white/70">{value(k)}</span> : null}
          </motion.div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={brief ? 'done' : 'reading'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mt-6 text-[15px] text-neutral-500">
          {brief ? 'Got it. Building your brief…' : 'Reading the reference and comparing it with other shoots…'}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
