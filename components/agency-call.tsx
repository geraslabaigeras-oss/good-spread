'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ROLE_LABEL, type RosterPerson } from '@/lib/roster';
import { LiveCall } from '@/components/live-call';
import { useDraft } from '@/lib/plan-store';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const LANG: Record<string, string> = {
  Paris: 'French', Milan: 'Italian', London: 'English', Copenhagen: 'Danish', Stockholm: 'Swedish', Berlin: 'German',
  Warsaw: 'Polish', Amsterdam: 'Dutch', Vilnius: 'Lithuanian', Riga: 'Latvian', Lisbon: 'Portuguese',
};

/** Tap a person: their pictures and details, then one button to call their agent (or them, if freelance). */
export function AgencyCall({ person, open, onOpenChange, onAnswer, actions }: {
  person: RosterPerson; open: boolean; onOpenChange: (o: boolean) => void;
  onAnswer: (a: 'available' | 'hold' | 'unavailable') => Promise<void>;
  actions?: React.ReactNode;
}) {
  const [draft] = useDraft();
  const local = LANG[person.city] ?? 'English';
  const [lang, setLang] = useState(local);
  const pics = (person.gallery?.length ? person.gallery : person.photo ? [person.photo] : []).slice(0, 6);
  const agent = person.agency ? person.agency : `${person.name} directly`;
  const ext = person as RosterPerson & { heightCm?: number | null; statsText?: string | null; instagram?: string | null; rateIsEstimate?: boolean };
  const date = draft?.shootISO ? new Date(`${draft.shootISO}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'the shoot date';
  const brief = draft?.brief ? `${draft.brief.garment}. ${draft.brief.summary}` : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{person.name}</SheetTitle>
          <SheetDescription>Profile and a call to their agent</SheetDescription>
        </SheetHeader>

        {/* Pictures */}
        <div className="flex snap-x gap-2 overflow-x-auto p-4 pb-0">
          {pics.map((src, i) => <img key={src} src={src} alt={`${person.name} ${i + 1}`} className={`shrink-0 snap-start rounded-2xl object-cover object-top ${i === 0 ? 'h-[340px] w-[250px]' : 'h-[340px] w-[200px]'}`} />)}
        </div>

        <div className="space-y-6 p-6">
          {/* Who */}
          <div>
            <div className="text-[30px] font-light leading-tight tracking-[-0.02em]">{person.name}</div>
            <div className="mt-1 text-[15px] text-neutral-500">{ROLE_LABEL[person.role]} · {person.agency ?? 'Freelance'} · {person.city}</div>
            {(ext.heightCm || ext.statsText) && <div className="mt-2 text-[14px] text-neutral-700">{ext.heightCm ? `${ext.heightCm} cm` : ''}{ext.heightCm && ext.statsText ? ' · ' : ''}{ext.statsText ?? ''}</div>}
            {person.look?.look && <p className="mt-3 text-[15px] leading-6 text-neutral-800">{person.look.look}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
              {person.profileUrl && <a href={person.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 underline-offset-4 hover:underline">Agency page <ArrowUpRight className="size-3.5" /></a>}
              {ext.instagram && <a href={`https://instagram.com/${ext.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 underline-offset-4 hover:underline">{ext.instagram} <ArrowUpRight className="size-3.5" /></a>}
              <span className="text-neutral-500">Day rate {person.dayRate ? `€${person.dayRate}` : 'to ask'}{ext.rateIsEstimate ? ' (estimate until the agent confirms)' : ''}</span>
            </div>
            {actions && <div className="mt-4">{actions}</div>}
          </div>

          {/* Call */}
          <div className="rounded-[24px] bg-[#f3f6fa] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[17px] font-medium">Call {person.agency ? 'their agent' : person.name.split(' ')[0]}</div>
                <p className="mt-0.5 text-[14px] text-neutral-600">Your assistant calls {agent} and asks if {person.name.split(' ')[0]} is free on {date}, the day rate and usage. You hear it live and see every line.</p>
              </div>
            </div>
            {local !== 'English' && (
              <div className="mt-3 inline-flex rounded-full bg-white p-1 text-[13px]">
                {[local, 'English'].map((l) => <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 ${lang === l ? 'bg-neutral-950 text-white' : 'text-neutral-600'}`}>{l}</button>)}
              </div>
            )}
            <div className="mt-4"><LiveCall key={lang} language={lang} agency={agent} city={person.city} model={person.name} date={date} brief={brief} /></div>
            <p className="mt-3 text-[12px] text-neutral-500">Test mode: you or a teammate answer as the agent. With a phone number connected, it rings the agency for real.</p>
          </div>

          {/* Answer */}
          <div>
            <p className="text-[15px] font-medium">What did they say?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([['available', 'Available', 'bg-emerald-600 text-white'], ['hold', 'On hold', 'bg-amber-500 text-white'], ['unavailable', 'Not available', 'bg-neutral-200 text-neutral-800']] as const).map(([k, l, c]) => (
                <button key={k} onClick={() => onAnswer(k)} className={`h-11 rounded-full text-[14px] font-medium ${c}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
