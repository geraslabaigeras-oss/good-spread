'use client';

import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/** The shoot day, picked on a calendar. Past days are off. */
export function ShootDate({ value, onChange, fallbackISO }: { value?: string; onChange: (iso: string) => void; fallbackISO: string }) {
  const iso = value ?? fallbackISO;
  const label = fromISO(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)] hover:bg-neutral-50">
        <CalendarDays className="size-4 text-neutral-500" /> Shoot day <span className="font-medium">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-2" align="start">
        <Calendar mode="single" selected={fromISO(iso)} onSelect={(d) => d && onChange(toISO(d))} disabled={{ before: today }} weekStartsOn={1} />
      </PopoverContent>
    </Popover>
  );
}
