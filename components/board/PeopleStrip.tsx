'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { BoardState } from '@/lib/server/views';
import { APPROVE, chipFade, chipFlip } from '@/lib/motion';
import { catalogPerson } from '@/data/catalog';
import { Plane } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {people.map((x) => {
        const idx = order.indexOf(x.id);
        const delay = idx >= 0 ? (APPROVE.stripStart + idx * APPROVE.stripStagger) / 1000 : 0;
        const from = changed?.from.get(x.id);
        const showFrom = changed && changed.from.has(x.id) && from && x.call;
        const photo = x.photo ?? catalogPerson(x.id)?.photo;
        const open = x.booking === 'to_book';
        return (
          <div key={x.id} className="relative isolate overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_16px_40px_rgba(20,40,90,.07)]">
            {idx >= 0 && changed && (
              <motion.div
                key={`hl-${changed.version}`}
                className="pointer-events-none absolute inset-0 z-10 bg-sky-200/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0], transition: { duration: reduce ? 1.7 : 1.5, times: [0, 0.01, reduce ? 0.88 : 0.2, 1], ease: 'linear', delay } }}
              />
            )}
            <div className="relative h-44 overflow-hidden bg-[#e3eaf3]">
              {photo
                ? <img src={photo} alt="" className="size-full object-cover object-top" /> // eslint-disable-line @next/next/no-img-element
                : <span className={`absolute inset-0 flex items-center justify-center text-[72px] font-light ${open ? 'text-neutral-400' : 'text-neutral-500'}`}>{open ? '+' : x.name[0]}</span>}
              <span className="absolute left-3 top-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={x.booking} variants={reduce ? chipFade : chipFlip} initial="initial" animate="animate" exit="exit"
                    className={`inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-2.5 text-[12px] font-medium ${x.booking === 'confirmed' ? 'text-emerald-700' : x.booking === 'delayed' ? 'text-red-700' : 'text-neutral-600'}`}>
                    <span className={`size-1.5 rounded-full ${x.booking === 'confirmed' ? 'bg-emerald-500' : x.booking === 'delayed' ? 'bg-red-500' : 'bg-neutral-400'}`} />
                    {x.booking === 'confirmed' ? 'Confirmed' : x.booking === 'delayed' ? 'Delayed' : 'To book'}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[16px] font-medium">{x.name}</span>
                <span className="shrink-0 text-[12px] text-neutral-500">{ROLE[x.role] ?? x.role}</span>
              </div>
              <div className="mt-2 text-[12px] text-neutral-500">Call time</div>
              <div className="text-[30px] font-light leading-9 tracking-[-0.02em] tabular-nums">
                {showFrom ? <span><span className="text-neutral-400 line-through decoration-1">{from}</span> {x.call}</span> : (x.call ?? '—')}
              </div>
              <div className="mt-1 flex h-5 items-center gap-1 truncate text-[12px] text-neutral-500">
                {x.flight ? <><Plane className="size-3" /> {x.flight.from} → {x.flight.to}, lands {x.flight.lands}</> : 'Local'}
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
