'use client';

/* eslint-disable @next/next/no-img-element */
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import type { CreativeBrief } from '@/lib/types';
import { CITIES } from '@/data/catalog';
import { toCatalog } from '@/lib/roster';
import { lookMatch } from '@/lib/match';
import { useRoster } from '@/lib/use-roster';
import { QuickAdd } from '@/components/quick-add';
import { AgencyCall } from '@/components/agency-call';
import { Plus } from 'lucide-react';
import type { City } from '@/data/catalog';
import type { PlanDraft, ScoutedPlace } from '@/lib/plan-store';

const ease = [0.16, 1, 0.3, 1] as const;

/** Straight from the brief: the models and the places that fit it, to pick from right away. */
export function BriefOptions({ brief, draft, setDraft }: { brief: CreativeBrief; draft: PlanDraft; setDraft: (d: PlanDraft) => void }) {
  const roster = useRoster();
  const need = brief.needs?.model ?? brief.casting;
  const models = useMemo(() => roster.people
    .filter((p) => p.role === 'model')
    .map((p) => ({ p, m: lookMatch(need, toCatalog(p).lookWords) }))
    .filter((x) => x.m.score >= 0)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 10), [roster.key, need]); // eslint-disable-line react-hooks/exhaustive-deps
  const shortlist = draft.shortlist ?? [];
  const [viewing, setViewing] = useState<string | null>(null);
  const [adding, setAdding] = useState<'model' | 'photographer' | 'mua' | 'stylist' | null>(null);
  const photogs = useMemo(() => roster.people
    .filter((p) => p.role === 'photographer')
    .map((p) => ({ p, m: lookMatch(brief.needs?.photographer, toCatalog(p).lookWords) }))
    .sort((a, b) => b.m.score - a.m.score), [roster.key, brief.needs?.photographer]); // eslint-disable-line react-hooks/exhaustive-deps
  const crew = roster.people.filter((p) => p.role === 'mua' || p.role === 'stylist');
  const toggle = (id: string) => setDraft({ ...draft, shortlist: shortlist.includes(id) ? shortlist.filter((x) => x !== id) : [...shortlist, id] });

  const [city, setCity] = useState<string>(draft.scoutCity ?? 'auto'); // what we ask the scout for
  const [shown, setShown] = useState<string | null>(draft.scoutCity ?? null); // the city the results are in
  const [places, setPlaces] = useState<ScoutedPlace[] | null>(null);
  const [busy, setBusy] = useState(false);
  const text = `${brief.garment}. ${brief.summary} Location: ${brief.needs?.location ?? brief.settingNote}. Light: ${brief.lighting}.`;
  useEffect(() => {
    let off = false;
    setBusy(true);
    fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: text, city }) })
      .then((r) => r.json())
      .then((j) => {
        if (off || !j.places) return;
        setPlaces(j.places.map((p: ScoutedPlace) => ({ ...p, city: j.city })));
        setShown(j.city);
        if (city === 'auto' && j.city && draft.scoutCity !== j.city) setDraft({ ...draft, scoutCity: j.city });
      })
      .finally(() => !off && setBusy(false));
    return () => { off = true; };
  }, [city, brief.summary]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-10 space-y-12">
      {/* Models */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[26px] font-light tracking-[-0.02em]">Models who fit</h3>
            <p className="mt-1 text-[14px] text-neutral-500">Ranked by how close their look is to your references. Tap one to see their pictures and call their agent.</p>
          </div>
          {shortlist.length > 0 && <span className="shrink-0 text-[14px] text-neutral-700">{shortlist.length} shortlisted</span>}
        </div>
        <div className="-mx-2 mt-5 flex snap-x gap-4 overflow-x-auto px-2 pb-3">
          {!roster.ready && Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[340px] w-[210px] shrink-0 animate-pulse rounded-[22px] bg-neutral-200/70" />)}
          {models.map(({ p, m }, i) => {
            const on = shortlist.includes(p.id);
            return (
              <motion.button key={p.id} onClick={() => setViewing(p.id)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.05, ease }}
                className={`group w-[210px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] transition-shadow ${on ? 'ring-2 ring-neutral-950' : ''}`}>
                <div className="relative h-[260px] overflow-hidden bg-neutral-200">
                  {p.photo && <img src={p.photo} alt={p.name} className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />}
                  {on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}
                </div>
                <div className="p-3.5">
                  <div className="truncate text-[15px] font-medium">{p.name}</div>
                  <div className="truncate text-[12px] text-neutral-500">{p.agency ?? p.city}</div>
                  {m.hits.length > 0 && <div className="mt-2 truncate text-[12px] text-neutral-700">Fits: {m.hits.slice(0, 3).join(', ')}</div>}
                  {p.availability && <div className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${p.availability === 'available' ? 'bg-emerald-50 text-emerald-700' : p.availability === 'hold' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>{p.availability === 'available' ? 'Available' : p.availability === 'hold' ? 'On hold' : 'Not available'}</div>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Photographer */}
      <section>
        <h3 className="text-[26px] font-light tracking-[-0.02em]">Photographer</h3>
        <p className="mt-1 text-[14px] text-neutral-500">Looking for: {brief.needs?.photographer ?? brief.lighting}. Add one with a link to their portfolio and we read their style.</p>
        <div className="-mx-2 mt-5 flex gap-4 overflow-x-auto px-2 pb-3">
          {photogs.map(({ p, m }) => {
            const on = shortlist.includes(p.id);
            return (
              <button key={p.id} onClick={() => setViewing(p.id)} className={`w-[210px] shrink-0 overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-neutral-950' : ''}`}>
                <div className="relative h-[160px] bg-neutral-200">{p.photo && <img src={p.photo} alt={p.name} className="size-full object-cover" />}{on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}</div>
                <div className="p-3.5"><div className="truncate text-[15px] font-medium">{p.name}</div><div className="truncate text-[12px] text-neutral-500">{p.look?.look ?? p.city}</div>{m.hits.length > 0 && <div className="mt-2 truncate text-[12px] text-neutral-700">Fits: {m.hits.slice(0, 3).join(', ')}</div>}</div>
              </button>
            );
          })}
          <AddCard label="Add a photographer" sub="portfolio link or screenshots" onClick={() => setAdding('photographer')} />
        </div>
      </section>

      {/* Your own crew */}
      <section>
        <h3 className="text-[26px] font-light tracking-[-0.02em]">Your own crew</h3>
        <p className="mt-1 text-[14px] text-neutral-500">Already have a make-up artist or stylist? Add them and they go into the plan. Otherwise we keep the slot open and price it.</p>
        <div className="-mx-2 mt-5 flex gap-4 overflow-x-auto px-2 pb-3">
          {crew.map((p) => (
            <div key={p.id} className="flex w-[260px] shrink-0 items-center gap-3 rounded-[22px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)]">
              {p.photo ? <img src={p.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-neutral-200">{p.name[0]}</span>}
              <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{p.name}</span><span className="text-[12px] text-neutral-500">{p.role === 'mua' ? 'Hair & make-up' : 'Stylist'}</span></span>
            </div>
          ))}
          <AddCard label="Add make-up artist" sub="link, Instagram screenshot or just a name" onClick={() => setAdding('mua')} small />
          <AddCard label="Add stylist" sub="link, Instagram screenshot or just a name" onClick={() => setAdding('stylist')} small />
        </div>
      </section>

      {/* Places */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-[26px] font-light tracking-[-0.02em]">Places that fit{places?.[0]?.city ? `, near ${places[0].city}` : ''}</h3>
            <p className="mt-1 text-[14px] text-neutral-500">Real places, chosen for the location in your references. Tap one to build the shoot around it.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <button key={c} onClick={() => { setCity(c); setDraft({ ...draft, scoutCity: c }); }}
              className={`h-8 rounded-full px-3.5 text-[13px] transition-colors ${shown === c ? 'bg-neutral-950 text-white' : 'bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900'}`}>{c}</button>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {busy && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-[22px] bg-neutral-200/70" />)}
          {!busy && places?.slice(0, 6).map((pl, i) => {
            const on = draft.place?.url === pl.url;
            return (
              <motion.button key={pl.url} onClick={() => setDraft({ ...draft, place: on ? null : pl, scoutCity: pl.city ?? draft.scoutCity })} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.06, ease }}
                className={`group overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-neutral-950' : ''}`}>
                <div className="relative h-[180px] overflow-hidden bg-neutral-200">
                  {pl.image && <img src={pl.image} alt={pl.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                  {on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}
                </div>
                <div className="p-4">
                  <div className="text-[16px] font-medium">{pl.name}</div>
                  {pl.from && <div className="mt-0.5 flex items-center gap-1 text-[12px] text-neutral-500"><MapPin className="size-3" /> {pl.from}</div>}
                  <p className="mt-2 text-[13px] leading-5 text-neutral-700">{pl.why}</p>
                  {pl.shootNote && <p className="mt-1.5 text-[12px] leading-5 text-neutral-500">{pl.shootNote}</p>}
                </div>
              </motion.button>
            );
          })}
          {!busy && places && !places.length && <p className="text-[14px] text-neutral-500">Nothing that fits near {shown ?? city}. Try another city.</p>}
        </div>
      </section>
      {viewing && roster.people.find((x) => x.id === viewing) && (() => {
        const v = roster.people.find((x) => x.id === viewing)!;
        const on = shortlist.includes(v.id);
        return (
          <AgencyCall key={v.id} person={v} open onOpenChange={(o) => !o && setViewing(null)}
            actions={<button onClick={() => toggle(v.id)} className={`h-11 rounded-full px-5 text-[14px] font-medium ${on ? 'bg-neutral-950 text-white' : 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]'}`}>{on ? 'Shortlisted' : 'Add to shortlist'}</button>}
            onAnswer={async (ans) => {
              const { id: _i, createdAt: _c, ...data } = v;
              await fetch(`/api/people/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v.id.startsWith('tb-') ? { availability: ans } : { ...data, availability: ans }) });
              await roster.mutate();
              if (ans !== 'unavailable' && !on) toggle(v.id);
              setViewing(null);
            }} />
        );
      })()}
      {adding && (
        <QuickAdd key={adding} role={adding} city={(draft.scoutCity && draft.scoutCity !== 'auto' ? draft.scoutCity : 'Vilnius') as City} open={!!adding} onOpenChange={(o) => !o && setAdding(null)}
          onAdded={async (id) => { await roster.mutate(); setDraft({ ...draft, shortlist: [...shortlist, id] }); }} />
      )}
    </div>
  );
}

function AddCard({ label, sub, onClick, small }: { label: string; sub: string; onClick: () => void; small?: boolean }) {
  return (
    <button onClick={onClick} className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-[22px] border-2 border-dashed border-neutral-300 px-4 text-center text-[14px] text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-900 ${small ? 'h-[72px] w-[240px]' : 'h-[240px] w-[210px]'}`}>
      <span className="flex items-center gap-1.5"><Plus className="size-4" /> {label}</span>
      <span className="text-[12px] text-neutral-400">{sub}</span>
    </button>
  );
}
