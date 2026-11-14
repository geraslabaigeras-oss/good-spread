'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { Loader2, PhoneCall } from 'lucide-react';
import { OFFICES, flagUrl, officeFor, type Office } from '@/lib/agencies';
import { ROLE_LABEL, type RosterPerson } from '@/lib/roster';
import { ListenButton } from '@/components/voice';
import { LiveCall } from '@/components/live-call';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Line = { who: 'agent' | 'agency'; text: string; english: string };

/** Agency call: Claude writes the script in the agency's language; ElevenLabs voices it; the producer logs the answer. */
export function AgencyCall({ person, open, onOpenChange, onAnswer }: {
  person: RosterPerson; open: boolean; onOpenChange: (o: boolean) => void;
  onAnswer: (a: 'available' | 'hold' | 'unavailable') => Promise<void>;
}) {
  const [office, setOffice] = useState<Office>(officeFor(person.agency) ?? OFFICES[0]);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function write(o = office) {
    setBusy(true); setErr(null); setLines(null);
    try {
      const r = await fetch('/api/calls/script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        language: o.language, agency: o.agency, city: o.city, model: person.name, role: ROLE_LABEL[person.role], date: 'the shoot date',
      }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'anthropic_not_configured' ? 'Add ANTHROPIC_API_KEY to write scripts.' : 'Could not write the script.');
      setLines(j.lines);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  }
  useEffect(() => { if (open && !lines && !busy) write(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const opening = lines?.find((l) => l.who === 'agent')?.text ?? '';
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><img src={flagUrl(office.cc)} alt="" className="h-4 w-6 rounded-sm object-cover" /> Call {office.agency} {office.city}</SheetTitle>
          <SheetDescription>Your voice agent asks about {person.name}&rsquo;s availability, rate and usage in {office.language}. You see every line in English.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="flex flex-wrap gap-1.5">
            {OFFICES.map((o) => (
              <button key={o.agency + o.city} onClick={() => { setOffice(o); write(o); }} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${o === office ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                <img src={flagUrl(o.cc)} alt="" className="h-3 w-4 rounded-[2px] object-cover" />{o.agency} {o.city}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-[linear-gradient(160deg,#cfd6db,#8d99a3_55%,#3b4046)] p-4">
            {busy && <div className="flex items-center gap-2 py-10 text-sm text-white/80"><Loader2 className="size-4 animate-spin" /> Writing the script in {office.language}…</div>}
            {err && <p className="py-6 text-sm text-white">{err}</p>}
            {lines && (
              <div className="space-y-2.5">
                {lines.map((l, i) => (
                  <div key={i} className={`flex ${l.who === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${l.who === 'agent' ? 'rounded-br-md bg-white text-neutral-900' : 'rounded-bl-md border border-white/40 bg-white/10 text-white'}`}>
                      <p className="text-[14px] leading-5">{l.text}</p>
                      <p className={`mt-1 text-[12px] leading-4 ${l.who === 'agent' ? 'text-neutral-500' : 'text-white/70'}`}>{l.english}</p>
                      {l.who === 'agency' && <p className="mt-1 text-[10px] tracking-wide text-white/50">likely reply</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <LiveCall language={office.language} agency={office.agency} city={office.city} model={person.name} date="the shoot date" firstMessage={lines?.find((l) => l.who === 'agent')?.text} />
          {lines && (
            <div className="flex flex-wrap items-center gap-2">
              <ListenButton text={opening} className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]" />
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500"><BrandLogo name="elevenlabs" size={11} color="#737373" /> voice in {office.language}</span>
            </div>
          )}

          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-medium">What did the agency say?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="outline" className="bg-white" onClick={() => onAnswer('available')}>Available</Button>
              <Button variant="outline" className="bg-white" onClick={() => onAnswer('hold')}>On hold</Button>
              <Button variant="outline" className="bg-white" onClick={() => onAnswer('unavailable')}>Not available</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
