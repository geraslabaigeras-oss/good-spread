'use client';

import { useEffect, useRef, useState } from 'react';
import type { Block, Conflict, Production } from '@/lib/types';
import { fmt } from '@/lib/engine/time';
import { readyAt } from '@/lib/engine/schedule';
import { cn } from '@/lib/utils';

const START = 420; // 07:00
const END = 1080; // 18:00
const SPAN = END - START;
const pct = (m: number) => `${((Math.min(Math.max(m, START), END) - START) / SPAN) * 100}%`;
const width = (a: number, b: number) => `${((Math.min(b, END) - Math.max(a, START)) / SPAN) * 100}%`;

const STYLE: Record<Block['kind'], string> = {
  shoot: 'bg-foreground text-background border-foreground',
  hmu: 'bg-[#D9D6CC] text-foreground border-[#C9C6BB]',
  setup: 'bg-card text-muted-foreground border-hairline',
  lunch: 'bg-[repeating-linear-gradient(135deg,#F1F0EA_0_6px,#FAFAF7_6px_12px)] text-muted-foreground border-hairline',
  wrap: 'bg-card text-muted-foreground border-hairline',
};

function label(b: Block) {
  if (b.kind === 'shoot') return `Shoot${b.lookIds?.length ? ' · ' + b.lookIds.join(' ') : ''}`;
  if (b.kind === 'hmu') return 'Hair & makeup';
  return b.kind.charAt(0).toUpperCase() + b.kind.slice(1);
}

function sig(b: Block) {
  return `${b.startMin}-${b.endMin}-${[...b.personIds].sort().join(',')}-${(b.lookIds ?? []).join(',')}`;
}

export function Timeline({
  production: p, conflicts, preview, flashVersion,
}: { production: Production; conflicts: Conflict[]; preview: Block[] | null; flashVersion: number }) {
  // Blocks that changed in the latest version flash once.
  const prev = useRef<Map<string, string> | null>(null);
  const prevVersion = useRef<number>(p.version);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  useEffect(() => {
    const now = new Map(p.blocks.map((b) => [b.id, sig(b)]));
    if (prev.current && p.version !== prevVersion.current) {
      const c = new Set<string>();
      for (const [id, s] of now) if (prev.current.get(id) !== s) c.add(id);
      setChanged(c);
    }
    prev.current = now;
    prevVersion.current = p.version;
  }, [p]);

  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START + i * 60);
  const conflictBy = new Map(conflicts.filter((c) => c.personId).map((c) => [c.personId!, c]));
  const rows = p.people;

  return (
    <div className="select-none">
      {/* hour ruler */}
      <div className="relative ml-[120px] h-5 text-[10px] text-muted-foreground tnum">
        {hours.map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h) }}>{fmt(h)}</span>
        ))}
      </div>
      <div className="relative">
        {/* grid + booked-until line */}
        <div className="pointer-events-none absolute inset-y-0 left-[120px] right-0">
          {hours.map((h) => (
            <div key={h} className="absolute inset-y-0 w-px bg-hairline/70" style={{ left: pct(h) }} />
          ))}
          <div className="absolute inset-y-0 w-px border-l border-dashed border-ot" style={{ left: pct(p.studio.bookedUntilMin) }} />
          <div className="absolute -top-0.5 translate-x-1 text-[10px] font-medium text-ot" style={{ left: pct(p.studio.bookedUntilMin) }}>
            booked until {fmt(p.studio.bookedUntilMin)}
          </div>
        </div>

        {rows.map((person) => {
          const blocks = p.blocks.filter((b) => b.personIds.includes(person.id));
          const ghost = preview?.filter((b) => b.personIds.includes(person.id)) ?? null;
          const c = conflictBy.get(person.id);
          const ready = readyAt(p, person.id);
          const t = p.travel.find((x) => x.personId === person.id);
          return (
            <div key={person.id} className="relative flex h-[34px] items-center border-b border-hairline/60 last:border-b-0">
              <div className="w-[120px] shrink-0 pr-3 text-[13px]">
                <span className={cn('font-medium', c && 'text-conflict')}>{person.name.split(' (')[0]}</span>
              </div>
              <div className="relative h-full flex-1">
                {/* ready marker (arrival / late) */}
                {ready > 0 && ready < 99999 && (t || c) && (
                  <div className="absolute inset-y-1 z-10" style={{ left: pct(ready) }}>
                    <div className={cn('h-full w-0.5', c ? 'bg-conflict' : 'bg-muted-foreground/50')} />
                    <span className={cn('absolute left-1 top-0 whitespace-nowrap text-[9px] font-medium', c ? 'text-conflict' : 'text-muted-foreground')}>
                      {t ? `lands ${fmt(t.arriveMin)} · ready ${fmt(ready)}` : `ready ${fmt(ready)}`}
                    </span>
                  </div>
                )}
                {(ghost ?? blocks).map((b) => (
                  <div
                    key={`${b.id}-${flashVersion}-${ghost ? 'g' : 'r'}`}
                    title={`${label(b)} ${fmt(b.startMin)}–${fmt(b.endMin)}`}
                    className={cn(
                      'absolute top-[7px] flex h-[20px] items-center overflow-hidden rounded-[2px] border px-1.5 text-[10px] font-medium whitespace-nowrap',
                      STYLE[b.kind],
                      ghost && 'border-dashed border-action bg-action-soft text-action',
                      !ghost && c && c.blockId === b.id && 'outline-2 outline-offset-1 outline-conflict',
                      !ghost && changed.has(b.id) && flashVersion === p.version && 'flash-bar',
                    )}
                    style={{ left: pct(b.startMin), width: width(b.startMin, b.endMin) }}
                  >
                    {label(b)} <span className="ml-1 opacity-60 tnum">{fmt(b.startMin)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
