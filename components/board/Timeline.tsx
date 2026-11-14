'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { Block, Conflict, Production } from '@/lib/types';
import { fmt } from '@/lib/format';
import { highlight, highlightReduced, tLayout } from '@/lib/motion';
import { SectionHead } from '@/components/kit';
import { cn } from '@/lib/utils';

const START = 420; // 07:00
const END = 1080; // 18:00
const SPAN = END - START;
const x = (m: number) => ((Math.min(Math.max(m, START), END) - START) / SPAN) * 100;

const BAR: Record<Block['kind'], string> = {
  shoot: 'bg-ink text-paper',
  hmu: 'bg-[#cbbca8] text-ink',
  setup: 'bg-[#e6e2dc] text-ink',
  wrap: 'bg-[#e6e2dc] text-ink',
  lunch: 'bg-transparent border border-dashed border-hairline-strong text-grey-1',
};

const ROLE: Record<string, string> = { producer: 'producer', model: 'model', photographer: 'photo', mua: 'hmu', stylist: 'stylist' };

function looksLabel(ids?: string[]) {
  if (!ids?.length) return '';
  if (ids.length === 2) return ` ${ids[0]}–${ids[1]}`;
  return ` ${ids.join(' ')}`;
}

function barLabel(b: Block) {
  if (b.kind === 'shoot') return `SHOOT${looksLabel(b.lookIds)}`;
  if (b.kind === 'hmu') return 'HMU';
  return b.kind.toUpperCase();
}

/** layoutId = `${personId}-${kind}-${nth}` so a person's nth hmu slides between times (§5.7). */
function keyed(p: Production, personId: string) {
  const counts: Record<string, number> = {};
  return p.blocks
    .filter((b) => b.personIds.includes(personId))
    .sort((a, b) => a.startMin - b.startMin)
    .map((b) => {
      const n = (counts[b.kind] = (counts[b.kind] ?? 0) + 1);
      return { b, key: `${personId}-${b.kind}-${n}`, sig: `${b.startMin}-${b.endMin}-${[...b.personIds].sort().join(',')}-${(b.lookIds ?? []).join(',')}` };
    });
}

export function Timeline({ production: p, conflicts }: { production: Production; conflicts: Conflict[] }) {
  const reduce = useReducedMotion();
  const prev = useRef<Map<string, string> | null>(null);
  const prevVersion = useRef(p.version);
  const [changed, setChanged] = useState<{ version: number; keys: Set<string> } | null>(null);

  useEffect(() => {
    const now = new Map(p.people.flatMap((person) => keyed(p, person.id).map((k) => [k.key, k.sig] as const)));
    if (prev.current && p.version !== prevVersion.current) {
      const keys = new Set<string>();
      for (const [k, s] of now) if (prev.current.get(k) !== s) keys.add(k);
      setChanged({ version: p.version, keys });
    }
    prev.current = now;
    prevVersion.current = p.version;
  }, [p]);

  const conflictBy = new Map(conflicts.filter((c) => c.personId).map((c) => [c.personId!, c]));
  const hours = Array.from({ length: SPAN / 60 + 1 }, (_, i) => START + i * 60);
  const booked = p.studio.bookedUntilMin;

  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="Day" meta="07:00–18:00" />
      <div className="relative min-h-0 flex-1">
        {/* Track overlay: after-hours, gridlines, booked-until line */}
        <div className="pointer-events-none absolute inset-y-0 right-0" style={{ left: 'var(--label-w)' }}>
          <div className="absolute inset-y-0 right-0 bg-after-hours" style={{ left: `${x(booked)}%` }} />
          {hours.map((h) => (
            <div key={h} className="absolute inset-y-0 w-px bg-hairline" style={{ left: `${x(h)}%` }} />
          ))}
          <div className="absolute inset-y-0 w-px bg-ink" style={{ left: `${x(booked)}%` }} />
        </div>

        {/* Axis row (20) */}
        <div className="relative flex h-5 items-center">
          <div className="shrink-0" style={{ width: 'var(--label-w)' }} />
          <div className="relative h-full flex-1">
            {hours.slice(0, -1).filter((h) => h < booked || h >= booked + 120).map((h) => (
              <span key={h} className="absolute top-0.5 pl-1 font-mono text-[11px] leading-[14px] text-grey-1 num" style={{ left: `${x(h)}%` }}>
                {fmt(h).slice(0, 2)}
              </span>
            ))}
            <span
              className="absolute top-0.5 whitespace-nowrap bg-after-hours pl-1 font-mono text-[10px] font-medium leading-[14px] text-ink"
              style={{ left: `${x(booked)}%` }}
            >
              Booked until {fmt(booked)}
            </span>
          </div>
        </div>

        {/* Person rows */}
        <LayoutGroup>
          {p.people.map((person) => {
            const c = conflictBy.get(person.id);
            const t = p.travel.find((tr) => tr.personId === person.id);
            const arrivalConflict = c?.code === 'ARRIVAL';
            return (
              <div key={person.id} className="relative flex items-center" style={{ height: 'var(--row-h)' }}>
                <div className="flex min-w-0 shrink-0 flex-col pr-3" style={{ width: 'var(--label-w)' }}>
                  <span className={cn('truncate text-[13px] font-medium leading-4', c && 'text-conflict')}>{person.name.split(' (')[0]}</span>
                  <span className="font-mono text-[10px] leading-3 text-grey-1">{ROLE[person.role]}</span>
                </div>
                <div className="relative h-full flex-1">
                  {/* Travel: line from depart to arrive, then hollow transfer bar */}
                  {t && t.arriveMin > START && (
                    <>
                      <span
                        className="absolute top-0 whitespace-nowrap font-mono text-[10px] leading-3 text-grey-1 num"
                        style={{ left: `${x(Math.max(t.departMin, START))}%` }}
                      >
                        {t.number} · lands {fmt(t.arriveMin)}
                      </span>
                      <div
                        className={cn('absolute top-[calc(50%-1px)] h-0.5', arrivalConflict ? 'bg-conflict' : 'bg-ink')}
                        style={{ left: `${x(Math.max(t.departMin, START))}%`, width: `${x(t.arriveMin) - x(Math.max(t.departMin, START))}%` }}
                      />
                      <div
                        className={cn('absolute rounded-[9px] border', arrivalConflict ? 'border-conflict' : 'border-ink')}
                        style={{
                          left: `${x(t.arriveMin)}%`, width: `${x(t.arriveMin + t.transferMin) - x(t.arriveMin)}%`,
                          top: 'calc((var(--row-h) - var(--bar-h)) / 2)', height: 'var(--bar-h)',
                        }}
                      />
                    </>
                  )}
                  {keyed(p, person.id).map(({ b, key }) => {
                    const l = x(b.startMin);
                    const w = x(b.endMin) - l;
                    const otFrom = b.endMin > booked ? Math.max(0, (booked - b.startMin) / (b.endMin - b.startMin)) * 100 : null;
                    const isConflict = c && c.blockId === b.id && !arrivalConflict;
                    const isChanged = changed && changed.version === p.version && changed.keys.has(key);
                    return (
                      <motion.div
                        key={key}
                        layout
                        layoutId={key}
                        transition={tLayout}
                        className={cn('absolute rounded-[9px]', BAR[b.kind])}
                        style={{ left: `${l}%`, width: `calc(${w}% - 2px)`, top: 'calc((var(--row-h) - var(--bar-h)) / 2)', height: 'var(--bar-h)' }}
                        title={`${barLabel(b)} ${fmt(b.startMin)}–${fmt(b.endMin)}`}
                      >
                        <span className="block h-full overflow-hidden whitespace-nowrap pl-2.5 text-[11.5px] font-medium leading-[var(--bar-h)]">
                          {barLabel(b)}
                        </span>
                        {otFrom != null && <span className="absolute bottom-0 right-0 h-[3px] rounded-b-[9px] bg-overtime" style={{ left: `${otFrom}%` }} />}
                        {(isConflict || (arrivalConflict && c?.blockId === b.id)) && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.24 } }}
                            className="pointer-events-none absolute -inset-[3.5px] rounded-[6px] border-[1.5px] border-conflict"
                          />
                        )}
                        {isChanged && (
                          <motion.span
                            key={`hl-${p.version}`}
                            variants={reduce ? highlightReduced : highlight}
                            initial="initial"
                            animate="animate"
                            className="pointer-events-none absolute -inset-[3px] rounded-[7px] border-2 border-action"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </LayoutGroup>
      </div>
    </section>
  );
}
