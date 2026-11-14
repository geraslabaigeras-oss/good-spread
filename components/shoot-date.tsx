'use client';

import { CalendarDays } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Shoot days on a calendar: tap the first day, then the last. Up to 7 consecutive days. */
export function ShootDate({ value, days = 1, onChange, fallbackISO }: { value?: string; days?: number; onChange: (iso: string, days: number) => void; fallbackISO: string }) {
  const start = fromISO(value ?? fallbackISO);
  const end = addDays(start, Math.max(1, days) - 1);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const label = days > 1 ? `${fmt(start)} – ${fmt(end)}` : start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)] hover:bg-neutral-50">
        <CalendarDays className="size-4 text-neutral-500" /> {days > 1 ? `${days} shoot days` : 'Shoot day'} <span className="font-medium">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-2" align="start">
        <Calendar
          mode="range"
          selected={{ from: start, to: end } as DateRange}
          onSelect={(r) => {
            if (!r?.from) return;
            const to = r.to ?? r.from;
            const n = Math.min(7, Math.max(1, Math.round((to.getTime() - r.from.getTime()) / 86400000) + 1));
            onChange(toISO(r.from), n);
          }}
          disabled={{ before: today }}
          weekStartsOn={1}
          numberOfMonths={2}
        />
        <p className="px-3 pb-2 text-[12px] text-neutral-500">Tap the first day, then the last. Up to 7 days.</p>
      </PopoverContent>
    </Popover>
  );
}
