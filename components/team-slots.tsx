'use client';

/* eslint-disable @next/next/no-img-element */
import { MapPin, Plane } from 'lucide-react';
import type { Production } from '@/lib/types';
import { catalogLocation, catalogPerson } from '@/data/catalog';
import { fmtEur } from '@/lib/format';

const ROLE: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

/** The team being built: one row per role, filled or waiting to be picked. */
export function TeamSlots({ p, place, onSlot, answers }: { p: Production; place?: { name: string; image: string | null } | null; onSlot?: (role: string, open: boolean) => void; answers?: Record<string, string> }) {
  const city = p.city ?? 'Vilnius';
  const people = p.people.filter((x) => x.role !== 'producer');
  let modelN = 0;
  const loc = p.picks ? catalogLocation(p.picks.location) : null;
  return (
    <div className="rounded-[28px] bg-white/85 p-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_20px_50px_rgba(20,40,90,.07)]">
      {people.map((x) => {
        const c = catalogPerson(x.id);
        const open = x.id.startsWith('open-');
        const label = x.role === 'model' ? `Model ${++modelN}` : ROLE[x.role] ?? x.role;
        const away = c && c.city !== city;
        const av = answers?.[x.id] ?? c?.availability ?? null;
        return (
          <button type="button" key={x.id} onClick={() => onSlot?.(x.role, open)} className="group flex w-full items-center gap-3 rounded-2xl border-b border-black/5 px-2 py-3 text-left transition-colors last:border-0 hover:bg-neutral-50">
            {open ? (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 text-[18px] text-neutral-300">+</span>
            ) : x.photo ? (
              <img src={x.photo} alt="" className="size-12 shrink-0 rounded-full object-cover object-top" />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[15px] text-neutral-600">{x.name[0]}</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-neutral-500">{label}</div>
              <div className={`truncate text-[15px] ${open ? 'text-neutral-400' : 'font-medium text-neutral-900'}`}>{open ? 'Nobody yet' : x.name}</div>
              {!open && away && <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-neutral-500"><Plane className="size-3" /> flies in from {c?.city}</div>}
            </div>
            {!open && (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[13px] tabular-nums text-neutral-700">{fmtEur(x.dayRate)}/day</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${av === 'available' ? 'bg-emerald-50 text-emerald-700' : av === 'hold' ? 'bg-amber-50 text-amber-700' : av === 'unavailable' ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {av === 'available' ? 'Available' : av === 'hold' ? 'On hold' : av === 'unavailable' ? 'Not available' : 'Not called yet'}
                </span>
              </div>
            )}
            {open && <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1.5 text-[12px] font-medium text-white">Add</span>}
          </button>
        );
      })}
      <button type="button" onClick={() => onSlot?.('location', false)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-neutral-50">
        {place?.image || loc?.photo ? <img src={place?.image ?? loc?.photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-300"><MapPin className="size-5" /></span>}
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-neutral-500">Location</div>
          <div className="truncate text-[15px] font-medium text-neutral-900">{place?.name ?? (loc && !loc.id.startsWith('open-') ? loc.name.split(',')[0] : <span className="font-normal text-neutral-400">Nobody yet</span>)}</div>
        </div>
      </button>
    </div>
  );
}
