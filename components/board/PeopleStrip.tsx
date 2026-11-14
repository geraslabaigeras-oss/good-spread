'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { BoardState } from '@/lib/server/views';
import { StatusChip } from '@/components/kit';
import { APPROVE, chipFade, chipFlip } from '@/lib/motion';
import { catalogPerson } from '@/data/catalog';

type P = BoardState['people'][number];
const ROLE: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

/** 5 equal cells (§3.1). Call-time change shows "09:00 → 11:30" for 1.5 s, then the new time (§5.8). */
export function PeopleStrip({ people, version, changedIds }: { people: P[]; version: number; changedIds: string[] }) {
  const reduce = useReducedMotion();
  const prevCalls = useRef<Map<string, string | null> | null>(null);
  const prevVersion = useRef(version);
  const [changed, setChanged] = useState<{ version: number; from: Map<string, string | null> } | null>(null);

  useEffect(() => {
    const now = new Map(people.map((x) => [x.id, x.call]));
    if (prevCalls.current && version !== prevVersion.current) {
      const from = new Map<string, string | null>();
      for (const x of people) if (prevCalls.current.get(x.id) !== x.call) from.set(x.id, prevCalls.current.get(x.id) ?? null);
      setChanged({ version, from });
      const t = setTimeout(() => setChanged(null), APPROVE.stripStart + 5 * APPROVE.stripStagger + 1500);
      prevCalls.current = now;
      prevVersion.current = version;
      return () => clearTimeout(t);
    }
    prevCalls.current = now;
    prevVersion.current = version;
  }, [people, version]);

  // People whose day changed in this version get the highlight, staggered left → right.
  const order = changed ? people.filter((x) => changed.from.has(x.id) || changedIds.includes(x.id)).map((x) => x.id) : [];

  return (
    <div className="grid h-full grid-cols-5 gap-3.5" style={{ perspective: 400 }}>
      {people.map((x) => {
        const idx = order.indexOf(x.id);
        const delay = idx >= 0 ? (APPROVE.stripStart + idx * APPROVE.stripStagger) / 1000 : 0;
        const from = changed?.from.get(x.id);
        const showFrom = changed && changed.from.has(x.id) && from && x.call;
        return (
          <div key={x.id} className="relative isolate flex min-w-0 items-center gap-3 overflow-hidden rounded-[20px] bg-white px-3 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_rgb(80_60_40/0.05)]">
            <Avatar id={x.id} name={x.name} photo={x.photo} />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            {idx >= 0 && changed && (
              <motion.div
                key={`hl-${changed.version}`}
                className="pointer-events-none absolute inset-0 -z-10 bg-action-tint"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0], transition: { duration: reduce ? 1.7 : 1.5, times: [0, 0.01, reduce ? 0.88 : 0.2, 1], ease: 'linear', delay } }}
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[15px] font-medium leading-5 tracking-[-0.005em]">{x.name}</span>
              <span className="shrink-0 font-serif text-[26px] leading-7 num">
                {showFrom ? (
                  <motion.span initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                    <span className="text-grey-1 line-through decoration-1">{from}</span> → {x.call}
                  </motion.span>
                ) : (
                  x.call ?? '—'
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="label truncate">{ROLE[x.role] ?? x.role}</span>
              <span className="relative inline-flex" style={{ transformStyle: 'preserve-3d' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={x.status} variants={reduce ? chipFade : chipFlip} initial="initial" animate="animate" exit="exit" className="inline-flex">
                    <StatusChip status={x.status} />
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ id, name, photo: own }: { id: string; name: string; photo?: string }) {
  const photo = own ?? catalogPerson(id)?.photo;
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className="size-12 shrink-0 rounded-full object-cover object-top" />
  ) : (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ece7df] font-serif text-[20px] text-grey-1">{name[0]}</span>
  );
}
