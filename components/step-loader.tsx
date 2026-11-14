'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/** A calm full-screen wait that says what is happening, step by step, so a few seconds never feel stuck. */
export function StepLoader({ open, title, steps, done }: { open: boolean; title: string; steps: string[]; done?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) { setI(0); return; }
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 900);
    return () => clearInterval(id);
  }, [open, steps.length]);
  const at = done ? steps.length : i;
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f4f7fb]/90 backdrop-blur-[2px]">
          <div className="gs-grain" />
          <div className="relative w-[min(440px,calc(100vw-48px))]">
            <div className="text-[32px] font-light leading-tight tracking-[-0.02em]">{title}</div>
            <div className="mt-6 space-y-3">
              {steps.map((s, k) => (
                <motion.div key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: k <= at ? 1 : 0.35, y: 0 }} transition={{ delay: k * 0.05 }} className="flex items-center gap-3 text-[16px]">
                  <span className={`flex size-6 items-center justify-center rounded-full ${k < at ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-500 shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)]'}`}>
                    {k < at ? <Check className="size-3.5" /> : k === at ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  </span>
                  <span className={k <= at ? 'text-neutral-900' : 'text-neutral-400'}>{s}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
