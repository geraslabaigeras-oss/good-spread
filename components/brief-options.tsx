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
import { CallRun, type CallResult } from '@/components/call-run';
import { backupStudios, baseCity, LOCATIONS, rankLocations, type EuLocation } from '@/lib/europe';
import { Plus } from 'lucide-react';
import type { City } from '@/data/catalog';
import type { PlanDraft, ScoutedPlace } from '@/lib/plan-store';

const ease = [0.16, 1, 0.3, 1] as const;

/** Straight from the brief: the models and the places that fit it, to pick from right away. */
export function BriefOptions({ brief, draft, setDraft }: { brief: CreativeBrief; draft: PlanDraft; setDraft: (d: PlanDraft) => void }) {
  const roster = useRoster();
  const need = brief.needs?.model ?? brief.casting;
  const [tier, setTier] = useState<'all' | 'top' | 'mid'>('all');
  const byTier = <T extends { p: { tier?: 'top' | 'mid' } }>(xs: T[]) => (tier === 'all' ? xs : xs.filter((x) => (x.p.tier ?? 'mid') === tier));
  const modelsAll = useMemo(() => roster.people
    .filter((p) => p.role === 'model')
    .map((p) => ({ p, m: lookMatch(need, toCatalog(p).lookWords) }))
    .filter((x) => x.m.score >= 0)
    .sort((a, b) => b.m.score - a.m.score), [roster.key, need]); // eslint-disable-line react-hooks/exhaustive-deps
  const models = byTier(modelsAll);
  const shortlist = draft.shortlist ?? [];
  const [viewing, setViewing] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [adding, setAdding] = useState<'model' | 'photographer' | 'mua' | 'stylist' | null>(null);
  const photogsAll = useMemo(() => roster.people
    .filter((p) => p.role === 'photographer')
    .map((p) => ({ p, m: lookMatch(brief.needs?.photographer, toCatalog(p).lookWords) }))
    .sort((a, b) => b.m.score - a.m.score), [roster.key, brief.needs?.photographer]); // eslint-disable-line react-hooks/exhaustive-deps
  const home = draft.scoutCity && draft.scoutCity !== 'auto' ? draft.scoutCity : null;
  const photogs = byTier(photogsAll);
  const crew = byTier(roster.people.filter((p) => p.role === 'mua' || p.role === 'stylist').sort((a, b) => Number(!!b.photo) - Number(!!a.photo) || Number(b.city === home) - Number(a.city === home)).map((p) => ({ p, m: { score: 0, hits: [] as string[] } })));
  const toggle = (id: string) => setDraft({ ...draft, shortlist: shortlist.includes(id) ? shortlist.filter((x) => x !== id) : [...shortlist, id] });

  const [city, setCity] = useState<string>(draft.scoutCity ?? 'auto'); // what we ask the scout for
  const [shown, setShown] = useState<string | null>(draft.scoutCity ?? null); // the city the results are in
  const [places, setPlaces] = useState<ScoutedPlace[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [libCity, setLibCity] = useState<string>('all');
  const locNeed = brief.needs?.location ?? `${brief.setting} ${brief.settingNote}`;
  const [morePlaces, setMorePlaces] = useState(false);
  const library = useMemo(() => rankLocations(locNeed, { city: libCity === 'all' ? undefined : libCity }).slice(0, morePlaces ? 9 : 3), [locNeed, libCity, morePlaces]);
  const libCities = useMemo(() => [...new Set(LOCATIONS.map((l) => baseCity(l)))], []);
  const pick = (l: EuLocation) => {
    const pl: ScoutedPlace = {
      name: l.name, why: l.look, from: `${l.city}, ${l.country} · fly into ${l.airport_iata}`, shootNote: l.permit_notes, description: l.look,
      image: l.image_url, lat: l.lat, lng: l.lng, url: l.source_url, mapsUrl: `https://maps.google.com/?q=${l.lat},${l.lng}`, city: baseCity(l),
    };
    const on = draft.place?.url === pl.url;
    setDraft({ ...draft, place: on ? null : pl, scoutCity: on ? draft.scoutCity : pl.city });
  };
  const text = `${brief.garment}. ${brief.summary} Location: ${brief.needs?.location ?? brief.settingNote}. Light: ${brief.lighting}.`;
  useEffect(() => {
    if (!aiOn) return;
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
  }, [city, brief.summary, aiOn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-10 space-y-12">
      {/* demo guide helper: shortlist the best fits in one go */}
      <button data-demo="auto-pick" className="hidden" onClick={() => {
        const ids = [...models.slice(0, 3), ...photogs.slice(0, 1), ...crew.slice(0, 1)].map((x) => x.p.id);
        const best = library[0]?.l;
        if (best) {
          const pl: ScoutedPlace = { name: best.name, why: best.look, from: `${best.city}, ${best.country} · fly into ${best.airport_iata}`, shootNote: best.permit_notes, description: best.look, image: best.image_url, lat: best.lat, lng: best.lng, url: best.source_url, mapsUrl: `https://maps.google.com/?q=${best.lat},${best.lng}`, city: baseCity(best) };
          setDraft({ ...draft, shortlist: ids, place: pl, scoutCity: pl.city });
        } else setDraft({ ...draft, shortlist: ids });
      }} />
      {/* Price filter for all people rows */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] text-neutral-500">Price</span>
        {([['all', 'All'], ['top', 'Top tier'], ['mid', 'Lower budget']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTier(k)} className={`h-9 rounded-full px-4 text-[14px] transition-colors ${tier === k ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)] hover:bg-neutral-50'}`}>{l}</button>
        ))}
        <span className="text-[12px] text-neutral-400">Day rates are estimates by agency level until the agent confirms.</span>
      </div>

      <PeopleRow title="Models who fit" sub="Closest to your references first. Tap one to see their pictures and call their agent." items={models} limit={6} shortlist={shortlist} onOpen={setViewing} tall />
      <PeopleRow title="Photographer" sub={`Looking for: ${brief.needs?.photographer ?? brief.lighting}.`} items={photogs} limit={5} shortlist={shortlist} onOpen={setViewing} add={() => setAdding('photographer')} addLabel="Add a photographer" />
      <PeopleRow title="Make-up and styling" sub={`${home ? `People near ${home} first. ` : ''}Or add someone you already work with.`} items={crew} limit={5} shortlist={shortlist} onOpen={setViewing} add={() => setAdding('stylist')} addLabel="Add your own" />

      {/* Places: instant from the location library, AI scout on request */}
      <section>
        <h3 className="text-[26px] font-light tracking-[-0.02em]">Places that fit</h3>
        <p className="mt-1 text-[14px] text-neutral-500">Looking for: {locNeed}.</p>
        {morePlaces && <div className="mt-4 flex flex-wrap gap-1.5">
          {['all', ...libCities].map((c) => (
            <button key={c} onClick={() => setLibCity(c)} className={`h-8 rounded-full px-3.5 text-[13px] transition-colors ${libCity === c ? 'bg-neutral-950 text-white' : 'bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900'}`}>{c === 'all' ? 'All Europe' : c}</button>
          ))}
        </div>}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.map(({ l, hits }, i) => {
            const on = draft.place?.url === l.source_url;
            const backup = backupStudios(l)[0];
            // which of the things you asked for this place has (plain word matching against the brief)
            const asked = locNeed.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
            const got = asked.filter((a) => a.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 3 && hits.some((h) => h.startsWith(w.slice(0, 5)) || w.startsWith(h.slice(0, 5)))));
            const settingRef = (() => { const r = brief.references?.find((x) => x.usedFor === 'setting') ?? brief.references?.find((x) => x.usedFor === 'whole mood'); return r ? draft.refImages[r.index - 1] : null; })();
            const light = l.season_light.split(/[;.]/)[0];
            return (
              <motion.button key={l.id} onClick={() => pick(l)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.04, ease }}
                className={`group flex flex-col justify-start overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-neutral-950' : ''}`}>
                <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-[linear-gradient(135deg,#dfe8f3,#b9cbe2)]">
                  <img src={l.image_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] capitalize">{i === 0 && libCity === 'all' ? 'Best match' : l.type}</span>
                  {on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}
                  <span className="absolute bottom-1.5 right-2 max-w-[80%] truncate text-[10px] text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">{l.image_author}, {l.image_licence}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[17px] font-medium leading-6">{l.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[13px] text-neutral-500"><MapPin className="size-3" /> {l.city}, {l.country}</div>
                  {/* why here: what it shares with your setting reference */}
                  <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[#f3f6fa] p-3">
                    {settingRef && <img src={settingRef} alt="Your setting reference" className="h-14 w-11 shrink-0 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <div className="text-[12px] text-neutral-500">Why here</div>
                      <div className="text-[14px] leading-5 text-neutral-900">{got.length ? `Has the ${got.slice(0, 3).join(', ')} from your reference.` : l.look}</div>
                      {asked.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="flex gap-0.5">{asked.slice(0, 6).map((_, k) => <span key={k} className={`h-1.5 w-4 rounded-full ${k < got.length ? 'bg-neutral-950' : 'bg-neutral-300'}`} />)}</span>
                          <span className="text-[12px] text-neutral-500">{got.length} of {Math.min(asked.length, 6)} you asked for</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-[13px] text-neutral-600">
                    <div><span className="text-neutral-400">Light · </span>{light}</div>
                    {backup && <div className="truncate"><span className="text-neutral-400">Rain backup · </span>{backup.name}, {backup.day_rate_listed}</div>}
                    <div><span className="text-neutral-400">Travel · </span>fly into {l.airport_iata}{l.permit_notes ? ' · permit needed' : ''}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {!morePlaces ? (
          <button onClick={() => setMorePlaces(true)} className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50">Show more places</button>
        ) : !aiOn ? (
          <button onClick={() => setAiOn(true)} className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50">Search further: find more real places for this look</button>
        ) : (
          <div className="mt-8">
            <div className="text-[17px] font-medium">More places{shown ? ` near ${shown}` : ''}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <button key={c} onClick={() => { setCity(c); setDraft({ ...draft, scoutCity: c }); }}
                  className={`h-8 rounded-full px-3.5 text-[13px] transition-colors ${shown === c ? 'bg-neutral-950 text-white' : 'bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900'}`}>{c}</button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {busy && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[260px] animate-pulse rounded-[22px] bg-neutral-200/70" />)}
              {!busy && places?.slice(0, 6).map((pl) => {
                const on = draft.place?.url === pl.url;
                return (
                  <button key={pl.url} onClick={() => setDraft({ ...draft, place: on ? null : pl, scoutCity: pl.city ?? draft.scoutCity })}
                    className={`group flex flex-col justify-start overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-neutral-950' : ''}`}>
                    <div className="relative h-[160px] overflow-hidden bg-neutral-200">{pl.image && <img src={pl.image} alt={pl.name} className="size-full object-cover" />}{on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}</div>
                    <div className="p-4">
                      <div className="text-[16px] font-medium">{pl.name}</div>
                      {pl.from && <div className="mt-0.5 flex items-center gap-1 text-[12px] text-neutral-500"><MapPin className="size-3" /> {pl.from}</div>}
                      <p className="mt-2 text-[13px] leading-5 text-neutral-700">{pl.why}</p>
                      {pl.shootNote && <p className="mt-1.5 text-[12px] leading-5 text-neutral-500">{pl.shootNote}</p>}
                    </div>
                  </button>
                );
              })}
              {!busy && places && !places.length && <p className="text-[14px] text-neutral-500">Nothing that fits near {shown ?? city}. Try another city.</p>}
            </div>
          </div>
        )}
      </section>
      {/* Shortlist bar: call everyone at once */}
      {shortlist.length > 0 && (() => {
        const people = shortlist.map((id) => roster.people.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
        return (
          <div className="sticky bottom-5 z-40 mx-auto flex max-w-[760px] items-center gap-4 rounded-full bg-neutral-950 p-2 pl-5 text-white shadow-[0_20px_50px_rgba(0,0,0,.25)]">
            <div className="flex -space-x-2">{people.slice(0, 6).map((x) => x.photo ? <img key={x.id} src={x.photo} alt="" className="size-9 rounded-full object-cover object-top ring-2 ring-neutral-950" /> : <span key={x.id} className="flex size-9 items-center justify-center rounded-full bg-neutral-700 text-[13px] ring-2 ring-neutral-950">{x.name[0]}</span>)}</div>
            <span className="min-w-0 flex-1 truncate text-[15px]">{people.length} shortlisted · {people.filter((x) => x.availability === 'available').length} confirmed available</span>
            <button data-demo="call-all" onClick={() => setCalling(true)} className="h-11 shrink-0 rounded-full bg-white px-5 text-[15px] font-medium text-neutral-950">Call all {people.length} with AI</button>
          </div>
        );
      })()}
      {calling && (
        <CallRun open onClose={() => setCalling(false)}
          targets={shortlist.map((id) => roster.people.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x).map((x) => ({ id: x.id, name: x.name, role: x.role, agency: x.agency, photo: x.photo, dayRate: x.dayRate, email: x.email }))}
          mode={{ kind: 'book', date: draft.shootISO ? new Date(`${draft.shootISO}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'the shoot day' }}
          onResults={async (r: Record<string, CallResult>) => {
            const answers = { ...(draft.answers ?? {}) };
            for (const [id, x] of Object.entries(r)) if (x !== 'confirmed') answers[id] = x;
            setDraft({ ...draft, answers });
            await Promise.all(Object.entries(r).map(([id, ans]) => {
              const v = roster.people.find((x) => x.id === id);
              if (!v || ans === 'confirmed') return null;
              const { id: _i, createdAt: _c, ...data } = v;
              return fetch(`/api/people/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(/^(tb|eu)-/.test(id) ? { availability: ans } : { ...data, availability: ans }) });
            }));
            await roster.mutate();
          }} />
      )}
      {viewing && roster.people.find((x) => x.id === viewing) && (() => {
        const v = roster.people.find((x) => x.id === viewing)!;
        const on = shortlist.includes(v.id);
        return (
          <AgencyCall key={v.id} person={v} open onOpenChange={(o) => !o && setViewing(null)}
            actions={<button onClick={() => { toggle(v.id); setViewing(null); }} className={`h-12 w-full rounded-full text-[15px] font-medium ${on ? 'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]' : 'bg-neutral-950 text-white'}`}>{on ? 'Remove from shortlist' : 'Add to shortlist'}</button>}
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

type Row = { p: import('@/lib/roster').RosterPerson; m: { score: number; hits: string[] } };
function PeopleRow({ title, sub, items, limit, shortlist, onOpen, add, addLabel, tall }: { title: string; sub: string; items: Row[]; limit: number; shortlist: string[]; onOpen: (id: string) => void; add?: () => void; addLabel?: string; tall?: boolean }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, limit);
  const n = shortlist.filter((id) => items.some((x) => x.p.id === id)).length;
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-[26px] font-light tracking-[-0.02em]">{title}</h3>
          <p className="mt-1 text-[14px] text-neutral-500">{sub}</p>
        </div>
        {n > 0 && <span className="shrink-0 text-[14px] text-neutral-700">{n} shortlisted</span>}
      </div>
      <div className="-mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-6 pt-3">
        {shown.map(({ p, m }, i) => {
          const on = shortlist.includes(p.id);
          return (
            <motion.button key={p.id} onClick={() => onOpen(p.id)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.04, ease }}
              className={`group flex w-[210px] shrink-0 flex-col justify-start overflow-hidden rounded-[22px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)] ${on ? 'ring-2 ring-neutral-950' : ''}`}>
              <div className={`relative w-full shrink-0 overflow-hidden ${tall ? 'h-[260px]' : 'h-[180px]'} ${p.photo ? 'bg-neutral-200' : 'gs-talent-ph'}`}>
                {p.photo && <img src={p.photo} alt={p.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />}
                {p.tier === 'top' && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium">Top tier</span>}
                {on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-neutral-950 text-white"><Check className="size-4" /></span>}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <div className="truncate text-[15px] font-medium">{p.name}</div>
                <div className="truncate text-[12px] text-neutral-500">{p.role === 'mua' ? 'Make-up · ' : p.role === 'stylist' ? 'Stylist · ' : ''}{p.agency ?? p.city}</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[14px] tabular-nums">€{p.dayRate.toLocaleString('en-US')}<span className="text-[12px] text-neutral-500">/day{p.rateIsEstimate ? ' est.' : ''}</span></span>
                  {p.availability && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.availability === 'available' ? 'bg-emerald-50 text-emerald-700' : p.availability === 'hold' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>{p.availability === 'available' ? 'Available' : p.availability === 'hold' ? 'On hold' : 'Not free'}</span>}
                </div>
                {m.hits.length > 0 && <div className="mt-1.5 truncate text-[12px] text-neutral-500">Fits: {m.hits.slice(0, 3).join(', ')}</div>}
              </div>
            </motion.button>
          );
        })}
        {!all && items.length > limit && (
          <button onClick={() => setAll(true)} className={`flex w-[150px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-white/60 text-[14px] text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)] hover:bg-white ${tall ? 'h-[360px]' : 'h-[280px]'}`}>
            See all {items.length}
          </button>
        )}
        {add && <AddCard label={addLabel ?? 'Add'} sub="link, screenshots or just a name" onClick={add} />}
        {items.length === 0 && !add && <p className="py-10 text-[14px] text-neutral-500">Nobody in this price range.</p>}
      </div>
    </section>
  );
}
