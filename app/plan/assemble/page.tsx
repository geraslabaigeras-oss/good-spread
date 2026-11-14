'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Picks } from '@/lib/types';
import { computeBudget, detectConflicts, dnaViolations, evaluateDna, fmt, summarize } from '@/lib/engine';
import { candidates, locationCandidates, strategyDef, type CatalogPerson, rosterGaps, catalogPerson, isOpenSlot } from '@/data/catalog';
import { useRoster } from '@/lib/use-roster';
import { lookMatch } from '@/lib/match';
import Link from 'next/link';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { draftProduction } from '@/lib/plan-draft';
import { BudgetLine, CAT_COLOR, Stage, Tilt, TopBar } from '@/components/glass/Stage';
import { TeamSlots } from '@/components/team-slots';
import { QuickAdd } from '@/components/quick-add';
import { Scout } from '@/components/scout';
import { AgencyCall } from '@/components/agency-call';
import { modelsComSearch } from '@/lib/roster';
import { ArrowUpRight, Plus, Search } from 'lucide-react';

const ease = [0.2, 0.8, 0.2, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;
type Tab = 'models' | 'photographer' | 'location' | 'stay' | 'costs';
const STEPS: [Tab, string][] = [['models', 'Models'], ['photographer', 'Photographer'], ['location', 'Location'], ['stay', 'Stay'], ['costs', 'Costs']];
const CAT_LABEL: Record<string, string> = { talent: 'Talent', crew: 'Crew', studio: 'Studio and location', travel: 'Travel and stay', post: 'Post-production', usage: 'Usage' };

export default function Assemble() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [tab, setTab] = useState<Tab>('models');
  const [qModel, setQModel] = useState<string | null>(null);
  const [qPhoto, setQPhoto] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [adding, setAdding] = useState<'model' | 'photographer' | 'mua' | 'stylist' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const roster = useRoster();
  const strategy = draft?.strategy ?? 'local';
  const def = strategyDef(strategy);
  const gaps = roster.ready ? rosterGaps(strategy) : [];
  // Saved picks only count if those people are still on your roster.
  const valid = (x?: Picks) => !!x && x.models.length > 0 && x.models.every((m) => catalogPerson(m) && candidates(strategy, 'model').some((c) => c.id === m)) && candidates(strategy, 'photographer').some((c) => c.id === x.photographer) && locationCandidates(strategy).some((l) => l.id === x.location);
  const picks: Picks = valid(draft?.picks) ? draft!.picks! : def.defaultPicks;

  const view = useMemo(() => {
    if (!draft || !roster.ready || gaps.length) return null;
    const base = draftProduction(draft, strategy);
    const p = draftProduction(draft, strategy, picks);
    return { p, sum: summarize(p), budget: computeBudget(p), conflicts: detectConflicts(p).filter((c) => c.code !== 'BUDGET'), dna: evaluateDna(base, p) };
  }, [draft, strategy, picks, roster.ready, roster.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (draft && roster.ready && gaps.length) {
    return (
      <Stage>
        <TopBar step={3} />
        <div className="mx-auto max-w-[640px] px-8 pt-24">
          <h1 className="font-serif text-[52px] leading-[0.95] tracking-[-0.03em]">Add your team first</h1>
          <p className="mt-4 text-[17px] leading-7 text-grey-1">To plan the {def.name.toLowerCase()} shoot you need {gaps.join(', ')}. Add the real people you work with, or find models on models.com and add them once they say yes.</p>
          <Link href="/people" className="g-btn mt-8">Add people →</Link>
        </div>
      </Stage>
    );
  }
  if (!draft || !view) return <Stage><div /></Stage>;
  const { p, sum, budget, conflicts, dna } = view;
  const broken = dnaViolations(dna);
  const needs = draft?.brief?.needs;
  const byMatch = (need?: string) => (a: CatalogPerson, b: CatalogPerson) => lookMatch(need, b.lookWords).score - lookMatch(need, a.lookWords).score;
  const models = [...candidates(strategy, 'model')].sort(byMatch(needs?.model));
  const photos = [...candidates(strategy, 'photographer')].sort(byMatch(needs?.photographer));
  const locs = locationCandidates(strategy);

  const setPicks = (next: Picks) => setDraft({ ...draft, picks: next });
  const toggleModel = (id: string) => {
    const has = picks.models.includes(id);
    let m = has ? picks.models.filter((x) => x !== id) : [...picks.models, id];
    if (m.length > def.modelSlots) m = m.slice(m.length - def.modelSlots);
    if (m.length) setPicks({ ...picks, models: m });
  };
  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, picks, brief: p.brief, deliverables: draft!.deliverables, cap: draft!.cap, startISO: draft!.startISO, shootISO: draft!.shootISO ?? null, dnaPreserve: draft!.dnaPreserve, place: draft!.place ?? null }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`);
      try { localStorage.setItem('gs-last-slug', j.slug); } catch {}
      router.push(`/board/${j.slug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
      setBusy(false);
    }
  }

  const travel = (c: CatalogPerson) => {
    if (c.city === def.city) return `Based in ${c.city}`;
    const t = c.travelTo?.[def.city];
    if (!t) return c.city;
    return t.dayBefore ? `${t.from} → ${t.to} the day before · +${fmtEur(t.flight + t.taxi + (t.hotel ?? 0))}` : `${t.number} ${t.from} → ${t.to}, lands ${fmt(t.arriveMin)} · +${fmtEur(t.flight + t.taxi)}`;
  };
  const next = STEPS[STEPS.findIndex(([k]) => k === tab) + 1];
  const ok = conflicts.length === 0 && !sum.overCap && broken.length === 0;

  return (
    <Stage backdrop={draft.refImages[0]}>
      <TopBar step={3} right={<button onClick={() => router.push('/plan')} className="text-[12px] text-grey-1 underline underline-offset-4 hover:text-ink">Change strategy</button>} />
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-8 pb-10 pt-4 xl:grid-cols-[minmax(0,1fr)_560px]">
        {/* Globe + live plan */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-2 z-10">
            <div className="g-label">{def.name} · shoot in {def.city}</div>
            <h1 className="mt-1 font-serif text-[52px] leading-[0.95] tracking-[-0.03em]">Build the team</h1>
            <p className="mt-2 max-w-[420px] text-[14px] text-grey-1">{needs ? <>Looking for: <span className="text-ink">{needs.model}</span></> : 'Pick from the list. The cost updates with each pick.'}</p>
          </div>
          <div className="pt-36 pb-20"><TeamSlots p={p} place={draft.place ? { name: draft.place.name, image: draft.place.image } : null} onSlot={(role, open) => {
            if (role === 'location') { setTab('location'); return; }
            if (open || role === 'mua' || role === 'stylist') { setAdding(role as 'model'); return; }
            setTab(role === 'model' ? 'models' : 'photographer');
          }} /></div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="glass -mt-16 grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
            <div className="w-[260px]"><BudgetLine total={budget.total} cap={budget.cap} segments={CATS.map((c) => ({ value: budget.byCategory[c], color: CAT_COLOR[c] }))} /></div>
            <div>
              <div className="mt-3 text-[13px]">
                {ok && <span className="text-[var(--g-good)]">No conflicts · brief kept · within budget · delivered {fmtDate(sum.deliveryISO)}</span>}
                {sum.overCap && <div className="text-[var(--g-bad)]">Over the {fmtEur(budget.cap)} cap</div>}
                {conflicts.map((c, i) => <div key={i} className="text-[var(--g-bad)]">{c.message}</div>)}
                {broken.map((x) => <div key={x.id} className="text-[var(--g-bad)]">Breaks must-keep: {x.label}{x.note ? ` (${x.note})` : ''}</div>)}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <button onClick={create} disabled={busy || conflicts.length > 0} className="g-btn">{busy ? 'Creating…' : 'Create production →'}</button>
              {err && <p className="text-[12px] text-[var(--g-bad)]">{err}</p>}
            </div>
          </motion.div>
        </div>

        {/* The search, step by step: models, photographer, location, stay, costs */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }} className="glass flex max-h-[calc(100dvh-110px)] flex-col p-4">
          <div className="flex gap-1 rounded-full bg-ink/[0.05] p-1">
            {STEPS.map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-full py-2 text-[13px] transition-colors ${tab === k ? 'bg-white text-ink shadow-[0_2px_10px_rgba(20,40,90,.08)]' : 'text-grey-1 hover:text-ink'}`}>{label}</button>
            ))}
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                {(tab === 'models' || tab === 'photographer') && (() => {
                  const isModel = tab === 'models';
                  const list = (isModel ? models : photos).filter((c) => !isOpenSlot(c.id));
                  const query = (isModel ? qModel : qPhoto) ?? (isModel ? needs?.model : needs?.photographer) ?? '';
                  const ranked = [...list].sort((a, b) => lookMatch(query, b.lookWords).score - lookMatch(query, a.lookWords).score);
                  const noun = isModel ? 'model' : 'photographer';
                  return (
                    <>
                      <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]">
                        <Search className="size-4 shrink-0 text-neutral-400" />
                        <input value={query} onChange={(e) => (isModel ? setQModel : setQPhoto)(e.target.value)} placeholder={isModel ? 'Model look, e.g. short hair, freckles, editorial' : 'Style, e.g. 35mm film, natural light'} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-neutral-400" />
                      </label>
                      <p className="mt-2 px-1 text-[12px] text-grey-1">{needs ? 'Filled in from your references. ' : ''}{list.length ? `${list.length} ${noun}${list.length === 1 ? '' : 's'} in your people, best match first.` : `No ${noun}s in your people yet.`}</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {ranked.map((c) => isModel
                          ? <CompCard key={c.id} c={c} selected={picks.models.includes(c.id)} onClick={() => toggleModel(c.id)} travel={travel(c)} match={lookMatch(query, c.lookWords)} onCheck={() => setChecking(c.id)} />
                          : <CompCard key={c.id} c={c} selected={picks.photographer === c.id} onClick={() => setPicks({ ...picks, photographer: c.id })} travel={travel(c)} match={lookMatch(query, c.lookWords)} onCheck={() => setChecking(c.id)} />)}
                        <button onClick={() => setAdding(isModel ? 'model' : 'photographer')} className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-[22px] border-2 border-dashed border-neutral-300 px-4 text-center text-[14px] text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-900">
                          <Plus className="size-5" /> Add a {noun}
                          <span className="text-[12px] text-neutral-400">someone you work with, or a profile link</span>
                        </button>
                      </div>
                      <a href={isModel ? modelsComSearch(def.city, query) : `https://www.google.com/search?q=${encodeURIComponent(`fashion photographer ${def.city} ${query}`)}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-[14px] hover:bg-white">
                        <span>Find more {isModel ? 'on models.com' : 'photographers on the web'}<span className="block text-[12px] text-grey-1">Opens a search for &ldquo;{query.slice(0, 40) || def.city}&rdquo;. Add the ones you like here.</span></span>
                        <ArrowUpRight className="size-4 shrink-0 text-grey-1" />
                      </a>
                    </>
                  );
                })()}

                {tab === 'location' && (
                  <>
                    {draft.brief && <Scout brief={draft.brief} city={def.city} chosen={draft.place} onChoose={(pl) => setDraft({ ...draft, place: pl })} />}
                    {!draft.brief && (
                      <div className="grid grid-cols-2 gap-3">
                        {locs.filter((l) => !l.id.startsWith('open-')).map((l) => (
                          <button key={l.id} onClick={() => setPicks({ ...picks, location: l.id })} className={`overflow-hidden rounded-[22px] bg-white text-left ${picks.location === l.id ? 'ring-2 ring-neutral-950' : ''}`}>
                            <div className="h-36" style={{ background: l.photo ? `url(${l.photo}) center/cover` : '#e7ebf1' }} />
                            <div className="p-3"><div className="text-[15px] font-medium">{l.name.split(',')[0]}</div><div className="mt-0.5 text-[12px] text-grey-1">{l.note}</div></div>
                          </button>
                        ))}
                      </div>
                    )}
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(`photo studio ${def.city}`)}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-[14px] hover:bg-white">
                      <span>Studios in {def.city}<span className="block text-[12px] text-grey-1">Real studios on Google Maps, with hours and phone numbers.</span></span>
                      <ArrowUpRight className="size-4 shrink-0 text-grey-1" />
                    </a>
                  </>
                )}

                {tab === 'stay' && (() => {
                  const away = p.people.filter((x) => x.role !== 'producer' && !isOpenSlot(x.id) && !x.local);
                  const before = new Date(new Date(`${sum.shootISO}T12:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
                  const after = sum.shootISO;
                  const n = Math.max(1, away.length);
                  return (
                    <>
                      <p className="px-1 text-[15px]">{away.length ? `${away.length === 1 ? `${away[0].name} flies` : `${away.length} people fly`} in the day before and ${away.length === 1 ? 'needs' : 'need'} a bed for one night.` : `Everyone is based in ${def.city}. Nobody needs a bed.`}</p>
                      {away.length > 0 && (
                        <>
                          <div className="mt-3 space-y-2">
                            {away.map((x) => {
                              const t = p.travel.find((tr) => tr.personId === x.id);
                              return (
                                <div key={x.id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                                  {x.photo ? <img src={x.photo} alt="" className="size-10 rounded-full object-cover object-top" /> : <span className="flex size-10 items-center justify-center rounded-full bg-neutral-200 text-[13px]">{x.name[0]}</span>}
                                  <span className="flex-1"><span className="block text-[14px] font-medium">{x.name}</span><span className="text-[12px] text-grey-1">{t ? `${t.from} → ${t.to}` : 'Travels in'}</span></span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <a href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(def.city)}&checkin=${before}&checkout=${after}&group_adults=${n}&no_rooms=${n}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-white p-4 hover:bg-neutral-50">
                              <span className="text-[15px] font-medium">Hotels</span><span className="mt-0.5 block text-[12px] text-grey-1">Booking.com, {n} {n === 1 ? 'room' : 'rooms'}, {fmtDate(before).slice(4, 10)} to {fmtDate(after).slice(4, 10)}</span>
                            </a>
                            <a href={`https://www.airbnb.com/s/${encodeURIComponent(def.city)}/homes?checkin=${before}&checkout=${after}&adults=${n}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-white p-4 hover:bg-neutral-50">
                              <span className="text-[15px] font-medium">Apartments</span><span className="mt-0.5 block text-[12px] text-grey-1">Airbnb, {n} {n === 1 ? 'guest' : 'guests'}, same dates</span>
                            </a>
                          </div>
                          <p className="mt-3 px-1 text-[12px] text-grey-1">The plan counts {fmtEur(120)} a night per person until you book.</p>
                        </>
                      )}
                    </>
                  );
                })()}

                {tab === 'costs' && (
                  <>
                    <div className="flex items-baseline justify-between px-1">
                      <span className="text-[40px] font-light tracking-[-0.03em] tabular-nums">{fmtEur(Math.round(budget.total))}</span>
                      <span className={`text-[13px] ${sum.overCap ? 'text-[var(--g-bad)]' : 'text-grey-1'}`}>{sum.overCap ? `${fmtEur(Math.round(budget.total - budget.cap))} over the cap` : `${fmtEur(Math.round(budget.cap - budget.total))} left of ${fmtEur(budget.cap)}`}</span>
                    </div>
                    {CATS.filter((c) => budget.byCategory[c] > 0).map((c) => (
                      <div key={c} className="mt-3 rounded-2xl bg-white p-4">
                        <div className="flex justify-between text-[14px] font-medium"><span>{CAT_LABEL[c]}</span><span className="tabular-nums">{fmtEur(Math.round(budget.byCategory[c]))}</span></div>
                        <div className="mt-2 space-y-1">
                          {budget.lines.filter((l) => l.category === c).map((l) => (
                            <div key={l.id} className="flex justify-between gap-3 text-[13px] text-grey-1">
                              <span className="truncate">{l.label}{l.source === 'estimate' ? ' (estimate)' : ''}</span>
                              <span className={`shrink-0 tabular-nums ${l.overtime ? 'text-amber-700' : ''}`}>{fmtEur(Math.round(l.amount))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {budget.contingency > 0 && <div className="mt-3 flex justify-between px-4 text-[13px] text-grey-1"><span>Contingency</span><span className="tabular-nums">{fmtEur(Math.round(budget.contingency))}</span></div>}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {next && (
            <button onClick={() => setTab(next[0])} className="mt-3 h-12 shrink-0 rounded-full bg-neutral-950 text-[15px] font-medium text-white">Next: {next[1]}</button>
          )}
        </motion.div>
      </div>
      {checking && roster.people.find((x) => x.id === checking) && (
        <AgencyCall
          key={checking}
          person={roster.people.find((x) => x.id === checking)!}
          open={!!checking}
          onOpenChange={(o) => !o && setChecking(null)}
          onAnswer={async (ans) => {
            const pp = roster.people.find((x) => x.id === checking)!;
            const { id: _i, createdAt: _c, ...data } = pp;
            await fetch(`/api/people/${pp.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, availability: ans }) });
            await roster.mutate();
            setChecking(null);
          }}
        />
      )}
      {adding && (
        <QuickAdd
          key={adding}
          role={adding}
          city={def.city}
          open={!!adding}
          onOpenChange={(o) => !o && setAdding(null)}
          onAdded={async (id, role) => {
            await roster.mutate();
            if (role === 'model') {
              const slot = picks.models.findIndex((m) => isOpenSlot(m));
              const m = slot >= 0 ? picks.models.map((x, i) => (i === slot ? id : x)) : [...picks.models, id].slice(-def.modelSlots);
              setPicks({ ...picks, models: m });
              setTab('models');
            } else if (role === 'photographer') {
              setPicks({ ...picks, photographer: id });
              setTab('photographer');
            }
          }}
        />
      )}
    </Stage>
  );
}

function CompCard({ c, selected, onClick, travel, match, onCheck }: { c: CatalogPerson; selected: boolean; onClick: () => void; travel: string; match?: { score: number; hits: string[] }; onCheck?: () => void }) {
  return (
    <Tilt onClick={onClick} selected={selected} className="glass-soft relative cursor-pointer overflow-hidden">
      <div className="relative h-40 overflow-hidden" style={{ background: c.photo ? `url(${c.photo}) center 20%/cover` : '#e4e1dc' }}>
        {!c.photo && <span className="absolute bottom-0 right-3 font-serif text-[110px] leading-[0.8] text-ink/10">{c.name[0]}</span>}
        {selected && <motion.span layoutId={undefined} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">Booked</motion.span>}
        <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-ink">{c.agency?.replace(' (demo)', '') ?? 'Freelance'}</span>
        {c.availability && <span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${c.availability === 'available' ? 'bg-emerald-600' : c.availability === 'hold' ? 'bg-amber-500' : 'bg-neutral-500'}`}>{c.availability === 'available' ? 'Available' : c.availability === 'hold' ? 'On hold' : 'Not available'}</span>}
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[22px] leading-7">{c.name}</span>
          <span className="font-mono text-[12px] text-ink">{fmtEur(c.dayRate)}</span>
        </div>
        {c.stats ? (
          <div className="mt-1 font-mono text-[10px] tracking-wide text-grey-1">
            {c.stats.height} · {c.stats.bust}/{c.stats.waist}/{c.stats.hips} · shoe {c.stats.shoe}
            <br />{c.stats.hair} · {c.stats.eyes} eyes
          </div>
        ) : (
          <div className="mt-1 text-[12px] text-grey-1">{c.known ?? c.bio}{c.motion === false ? ' · stills only' : c.role === 'photographer' ? ' · stills + motion' : ''}</div>
        )}
        <div className="mt-2 text-[11px] text-grey-2">{travel}</div>
        {match && match.score > 0 && <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">Matches: {match.hits.slice(0, 3).join(', ')}</div>}
        {onCheck && (
          <button onClick={(e) => { e.stopPropagation(); onCheck(); }} className="mt-2 flex h-8 w-full items-center justify-center rounded-full bg-neutral-950 text-[12px] font-medium text-white">
            {c.availability ? 'Check again' : 'Check availability'}
          </button>
        )}
      </div>
    </Tilt>
  );
}
