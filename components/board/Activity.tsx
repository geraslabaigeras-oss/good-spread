'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import type { BoardState } from '@/lib/server/views';
import { clock } from '@/lib/format';
import { logRow } from '@/lib/motion';
import { SectionHead } from '@/components/kit';

export function Activity({ events }: { events: BoardState['events'] }) {
  // Rows present on first load don't animate; only rows that arrive later do (§5.14).
  const initial = useRef<Set<number> | null>(null);
  if (initial.current === null) initial.current = new Set(events.map((e) => e.id));
  const seen = initial.current;
  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="What happened" />
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div key={e.id} variants={logRow} initial="initial" animate="animate" className="relative isolate grid h-7 grid-cols-[48px_1fr] items-center overflow-hidden">
              {!seen.has(e.id) && <motion.span
                className="pointer-events-none absolute inset-0 -z-10 bg-action-tint"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 1, 0], transition: { duration: 1.5, times: [0, 0.2, 1], ease: 'linear' } }}
              />}
              <span className="font-mono text-[12px] leading-4 text-grey-1 num">{clock(e.created_at)}</span>
              <span className="truncate text-[13px] leading-[18px]">{String(e.payload?.text ?? e.type)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!events.length && <p className="pt-1 text-[13px] text-grey-1">Nothing yet.</p>}
      </div>
    </section>
  );
}
