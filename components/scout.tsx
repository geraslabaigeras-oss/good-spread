'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Loader2, MapPin, Sparkles } from 'lucide-react';
import type { CreativeBrief } from '@/lib/types';
import type { ScoutedPlace } from '@/lib/plan-store';
import { Button } from '@/components/ui/button';

const CITIES = ['Vilnius', 'Riga', 'Tallinn', 'Warsaw', 'Berlin', 'Copenhagen', 'Stockholm', 'Paris', 'Milan', 'Lisbon', 'Barcelona', 'London'];

/** AI location scout: Claude reads the brief and proposes real places; each one is verified on Wikipedia. */
export function Scout({ brief, chosen, onChoose, city: initialCity = 'Vilnius' }: { brief: CreativeBrief; chosen?: ScoutedPlace | null; onChoose: (p: ScoutedPlace | null) => void; city?: string }) {
  const [city, setCity] = useState(initialCity);
  const [places, setPlaces] = useState<ScoutedPlace[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const text = `${brief.garment}. ${brief.summary} Look: ${brief.aesthetic.join(', ')}. Light: ${brief.lighting}. Setting: ${brief.setting}, ${brief.settingNote}. Palette: ${brief.palette.join(', ')}.`;

  async function run(c = city) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: text, city: c }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'anthropic_not_configured' ? 'Add ANTHROPIC_API_KEY to scout locations.' : 'Scouting failed. Try again.');
      setPlaces(j.places);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Scouting failed.');
    } finally {
      setBusy(false);
    }
  }
  // scout automatically for the brief once
  useEffect(() => { run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [brief.summary]);

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-medium"><Sparkles className="size-4" /> Locations for this look</div>
          <p className="mt-0.5 text-[13px] text-grey-1">Real places that match the brief, each one checked against a public record with a photo.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={city} onChange={(e) => { setCity(e.target.value); run(e.target.value); }} className="h-9 rounded-full border border-hairline-strong bg-white/70 px-3 text-[13px]">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {busy && <div className="mt-4 flex items-center gap-2 text-[13px] text-grey-1"><Loader2 className="size-4 animate-spin" /> Scouting {city}…</div>}
      {err && <p className="mt-4 text-[13px] text-conflict">{err}</p>}
      {places && !busy && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {places.map((p) => {
            const on = chosen?.url === p.url;
            return (
              <div key={p.url} className={`overflow-hidden rounded-[18px] bg-white/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-ink' : ''}`}>
                <div className="relative h-32 bg-black/5">
                  {p.image && <img src={p.image} alt="" className="size-full object-cover" />}
                  {on && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white"><Check className="size-3" /> Chosen</span>}
                </div>
                <div className="p-3">
                  <div className="text-[14px] font-medium leading-5">{p.name}</div>
                  {p.description && <div className="text-[12px] text-grey-2">{p.description}</div>}
                  <p className="mt-1.5 text-[12.5px] leading-[18px] text-grey-1">{p.why}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant={on ? 'secondary' : 'default'} className="h-7 rounded-full text-[12px]" onClick={() => onChoose(on ? null : p)}>{on ? 'Chosen' : 'Use this location'}</Button>
                    <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[12px] text-grey-1 hover:text-ink"><MapPin className="size-3" /> Map</a>
                    <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[12px] text-grey-1 hover:text-ink">Wiki <ArrowUpRight className="size-3" /></a>
                  </div>
                </div>
              </div>
            );
          })}
          {!places.length && <p className="col-span-2 text-[13px] text-grey-1">No verified places found for {city}. Try another city.</p>}
        </div>
      )}
    </div>
  );
}
