'use client';

/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight } from 'lucide-react';
import { ROLE_LABEL, type RosterPerson } from '@/lib/roster';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/** Tap a person: their pictures and details, then one button to call their agent (or them, if freelance). */
export function AgencyCall({ person, open, onOpenChange, onAnswer, actions }: {
  person: RosterPerson; open: boolean; onOpenChange: (o: boolean) => void;
  onAnswer: (a: 'available' | 'hold' | 'unavailable') => Promise<void>;
  actions?: React.ReactNode;
}) {
  const pics = (person.gallery?.length ? person.gallery : person.photo ? [person.photo] : []).slice(0, 6);
  const ext = person as RosterPerson & { heightCm?: number | null; statsText?: string | null; instagram?: string | null; rateIsEstimate?: boolean };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{person.name}</SheetTitle>
          <SheetDescription>Profile and a call to their agent</SheetDescription>
        </SheetHeader>

        {/* Pictures */}
        <div className="flex snap-x gap-2 overflow-x-auto p-4 pb-0 pt-14">
          {pics.map((src, i) => <img key={src} src={src} alt={`${person.name} ${i + 1}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} className={`shrink-0 snap-start rounded-2xl bg-neutral-100 object-cover object-top ${i === 0 ? 'h-[380px] w-[280px]' : 'h-[380px] w-[220px]'}`} />)}
        </div>

        <div className="space-y-6 p-6">
          {/* Who */}
          <div>
            <div className="text-[30px] font-light leading-tight tracking-[-0.02em]">{person.name}</div>
            <div className="mt-1 text-[15px] text-neutral-500">{ROLE_LABEL[person.role]} · {person.agency ?? 'Freelance'} · {person.city}</div>
            {(ext.heightCm || ext.statsText) && <div className="mt-2 text-[14px] text-neutral-700">{ext.heightCm ? `${ext.heightCm} cm` : ''}{ext.heightCm && ext.statsText ? ' · ' : ''}{ext.statsText ?? ''}</div>}
            {person.look?.look && <p className="mt-3 text-[15px] leading-6 text-neutral-800">{person.look.look}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
              {person.profileUrl && <a href={person.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 underline-offset-4 outline-none hover:underline focus-visible:underline">Agency page <ArrowUpRight className="size-3.5" /></a>}
              {ext.instagram && <a href={`https://instagram.com/${ext.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 underline-offset-4 outline-none hover:underline focus-visible:underline">{ext.instagram} <ArrowUpRight className="size-3.5" /></a>}
              <span className="text-neutral-500">Day rate {person.dayRate ? `€${person.dayRate}` : 'to ask'}{ext.rateIsEstimate ? ' (estimate until the agent confirms)' : ''}</span>
            </div>
            {actions && <div className="mt-6">{actions}</div>}
            <p className="mt-4 text-[13px] text-neutral-500">Shortlist the people you like, then call all their agents at once with AI.</p>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
