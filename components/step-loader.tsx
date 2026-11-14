'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

const ease = [0.2, 0.7, 0.2, 1] as const;

/** A calm, editorial wait: the place behind, the team coming together, one line that changes. */
export function StepLoader({ open, title, steps, faces = [], image }: { open: boolean; title: string; steps: string[]; faces?: (string | null | undefined)[]; image?: string | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) { setI(0); return; }
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 1100);
    return () => clearInterval(id);
  }, [open, steps.length]);
  const pics = faces.filter(Boolean).slice(0, 6) as string[];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f4f7fb]">
          {image && <motion.img src={image} alt="" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: 'easeOut' }} className="absolute inset-0 size-full object-cover opacity-30" />}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,247,251,.55)_0%,rgba(244,247,251,.92)_70%)]" />
          <div className="gs-grain" />
          <div className="relative flex w-[min(560px,calc(100vw-48px))] flex-col items-center text-center">
            {pics.length > 0 && (
              <div className="flex -space-x-4">
                {pics.map((src, k) => (
                  <motion.img key={src} src={src} alt="" initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 + k * 0.12, ease }}
                    className="size-20 rounded-full object-cover object-top ring-4 ring-[#f4f7fb]" />
                ))}
              </div>
            )}
            <h2 className="mt-8 text-[44px] font-light leading-[1.05] tracking-[-0.03em]">{title}</h2>
            <div className="mt-3 h-7">
              <AnimatePresence mode="wait">
                <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="text-[17px] text-neutral-500">{steps[i]}</motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-8 h-[2px] w-56 overflow-hidden rounded-full bg-neutral-950/10">
              <motion.div className="h-full bg-neutral-950" initial={{ width: '6%' }} animate={{ width: `${((i + 1) / steps.length) * 100}%` }} transition={{ duration: 1, ease }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
