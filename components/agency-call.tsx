'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { ROLE_LABEL, toCatalog, type RosterPerson } from '@/lib/roster';
import { lookMatch } from '@/lib/match';
import { useDraft } from '@/lib/plan-store';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/** "Bust 80 / 31" 1/2; Waist 58 / 23"; …" → [["Bust","80"],["Waist","58"],…] (metric part only). */
function statChips(height?: number | null, text?: string | null): [string, string][] {
  const out: [string, string][] = [];
  for (const part of (text ?? '').split(';')) {
    const m = part.trim().match(/^([A-Za-z]+)\s+(.+)$/);
    if (!m) continue;
    const v = m[2].split('/')[0].trim();
    if (v && !/^cm$/i.test(v)) out.push([m[1], v]);
  }
  return out.slice(0, 7);
}

/** Tap a person: who they are, why they fit this shoot, their pictures, and one button to shortlist them. */
export function AgencyCall({ person, open, onOpenChange, actions }: {
  person: RosterPerson; open: boolean; onOpenChange: (o: boolean) => void;
  onAnswer?: (a: 'available' | 'hold' | 'unavailable') => Promise<void>;
  actions?: React.ReactNode;
}) {
  const [draft] = useDraft();
  const pics = (person.gallery?.length ? person.gallery : person.photo ? [person.photo] : []).slice(0, 6);
  const [cur, setCur] = useState(0);
  const ext = person as RosterPerson & { heightCm?: number | null; statsText?: string | null; instagram?: string | null; rateIsEstimate?: boolean; tier?: 'top' | 'mid' };
  const b = draft?.brief;
  const need = person.role === 'model' ? b?.needs?.model : person.role === 'photographer' ? b?.needs?.photographer : b?.styling;
  const m = lookMatch(need, toCatalog(person).lookWords);
  const asked = (need ?? '').split(/,\s*/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
  const hasIt = (a: string) => a.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 3 && m.hits.some((h) => h.startsWith(w.slice(0, 5)) || w.startsWith(h.slice(0, 5))));
  const chips = statChips(ext.heightCm, ext.statsText);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{person.name}</SheetTitle>
          <SheetDescription>Who they are and why they fit this shoot</SheetDescription>
        </SheetHeader>

        <div className="p-6 pt-12">
          {/* Who */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[32px] font-light leading-tight tracking-[-0.02em]">{person.name}</div>
            {ext.tier === 'top' && <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-0.5 text-[12px] text-white">Top tier</span>}
          </div>
          <div className="mt-1 text-[15px] text-neutral-500">{ROLE_LABEL[person.role]} · {person.agency ?? 'Freelance'}</div>

          {/* Pictures: one big, the rest as thumbnails */}
          {pics.length > 0 && (
            <div className="mt-5">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100">
                <img key={pics[cur]} src={pics[cur]} alt={person.name} className="size-full object-cover object-top" />
              </div>
              {pics.length > 1 && (
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {pics.map((src, i) => (
                    <button key={src} onClick={() => setCur(i)} className={`aspect-[3/4] overflow-hidden rounded-lg ${i === cur ? 'ring-2 ring-neutral-950' : 'opacity-70 hover:opacity-100'}`}>
                      <img src={src} alt="" className="size-full object-cover object-top" onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Why them */}
          <div className="mt-6 rounded-2xl bg-[#f3f6fa] p-5">
            <div className="text-[13px] text-neutral-500">{b ? 'Why them for this shoot' : 'Their look'}</div>
            {person.look?.look && <p className="mt-1 text-[16px] leading-6 text-neutral-900">{person.look.look}</p>}
            {b && asked.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {asked.map((a) => hasIt(a)
                  ? <span key={a} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[12px] text-white"><Check className="size-3" /> {a}</span>
                  : <span key={a} className="rounded-full bg-white px-2.5 py-0.5 text-[12px] text-neutral-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">{a}</span>)}
              </div>
            )}
            {b && <p className="mt-2 text-[12px] text-neutral-500">Green is what your brief asked for and their pictures show.</p>}
          </div>

          {/* Facts */}
          {ext.heightCm ? <div className="mt-6 flex items-baseline gap-2"><span className="text-[44px] font-light leading-none tracking-[-0.03em] tabular-nums">{ext.heightCm}</span><span className="text-[15px] text-neutral-500">cm tall</span></div> : null}
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-3">
            <div><div className="text-[12px] text-neutral-500">Day rate</div><div>{person.dayRate ? `€${person.dayRate.toLocaleString('en-US')}` : 'To ask'}{ext.rateIsEstimate ? <span className="text-neutral-400"> est.</span> : null}</div></div>
            <div><div className="text-[12px] text-neutral-500">Based in</div><div>{person.city}</div></div>
            {chips.map(([k, v]) => <div key={k}><div className="text-[12px] text-neutral-500">{k}</div><div className="truncate">{v}</div></div>)}
          </div>
          {/* What we read from their pictures */}
          {person.look && (
            <div className="mt-5">
              <div className="text-[13px] text-neutral-500">What we read from their pictures</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {person.look.hair && <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]"><div className="text-[12px] text-neutral-500">Hair</div><div className="mt-0.5 text-[14px] leading-5">{person.look.hair.replace(/^Credits:\s*/, '')}</div></div>}
                {person.look.features?.length > 0 && <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]"><div className="text-[12px] text-neutral-500">Features</div><div className="mt-0.5 text-[14px] leading-5">{person.look.features.slice(0, 4).join(', ')}</div></div>}
                {person.look.vibe?.length > 0 && <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]"><div className="text-[12px] text-neutral-500">Mood</div><div className="mt-1 flex flex-wrap gap-1.5">{person.look.vibe.slice(0, 4).map((v) => <span key={v} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] capitalize">{v}</span>)}</div></div>}
                {person.look.bookShows?.length > 0 && <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]"><div className="text-[12px] text-neutral-500">Suits</div><div className="mt-1 flex flex-wrap gap-1.5">{person.look.bookShows.slice(0, 4).map((v) => <span key={v} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px]">{v}</span>)}</div></div>}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-[13px]">
            {person.profileUrl && <a href={person.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-950">Agency page <ArrowUpRight className="size-3.5" /></a>}
            {ext.instagram && <a href={`https://instagram.com/${ext.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-950">{ext.instagram} <ArrowUpRight className="size-3.5" /></a>}
          </div>
        </div>

        {actions && (
          <div className="sticky bottom-0 border-t border-black/5 bg-white/95 p-4 backdrop-blur">
            {actions}
            <p className="mt-2 text-center text-[12px] text-neutral-500">Shortlist the people you like, then call all their agents at once with AI.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
