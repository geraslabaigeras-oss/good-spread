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
import { StepLoader } from '@/components/step-loader';
import { Scout } from '@/components/scout';
import { AgencyCall } from '@/components/agency-call';
import { modelsComSearch } from '@/lib/roster';
import { ArrowUpRight, Plus, Search } from 'lucide-react';

const ease = [0.2, 0.8, 0.2, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;
type Tab = 'models' | 'photographer' | 'location' | 'stay' | 'costs';
const STEPS: [Tab, string][] = [['models', 'Models'], ['photographer', 'Photographer'], ['location', 'Location'], ['stay', 'Stay'], ['costs', 'Costs']];
const HOTEL: Record<string, number> = { Vilnius: 90, Riga: 90, Tallinn: 100, Warsaw: 95, Berlin: 130, Lisbon: 130, Barcelona: 160, Milan: 170, Paris: 200, London: 220, Copenhagen: 190, Stockholm: 170, Amsterdam: 200, Reykjavik: 210, Athens: 120 };
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
        body: JSON.stringify({ strategy, picks, brief: p.brief, deliverables: draft!.deliverables, cap: draft!.cap, startISO: draft!.startISO, shootISO: draft!.shootISO ?? null, shootDays: draft!.shootDays ?? null, scoutCity: draft!.scoutCity ?? null, shortlist: draft!.shortlist ?? null, dnaPreserve: draft!.dnaPreserve, place: draft!.place ?? null }),
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
      <TopBar step={3} right={<button onClick={() => router.push('/new')} className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-950">Back to picks</button>} />
      <div className="mx-auto max-w-[1280px] px-8 pb-16 pt-6">
        <h1 className="text-[52px] font-light leading-[1.05] tracking-[-0.03em]">Your team. <span className="text-neutral-400">Check it, then go.</span></h1>
        <p className="mt-2 text-[15px] text-neutral-600">{fmtDate(sum.shootISO)} · {draft.place?.name ?? def.city} · {fmtEur(Math.round(budget.total))} of {fmtEur(budget.cap)}</p>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <TeamSlots p={p} place={draft.place ? { name: draft.place.name, image: draft.place.image } : null} onSlot={(role, open) => {
            if (role === 'location') { router.push('/new'); return; }
            if (open) { setAdding(role as 'model'); return; }
            const person = p.people.find((x) => x.role === role && !isOpenSlot(x.id));
            if (person) setChecking(person.id);
          }} />

          <div className="flex flex-col gap-5">
            {/* Travel and stay */}
            {(() => {
              const away = p.people.filter((x) => x.role !== 'producer' && !isOpenSlot(x.id) && !x.local);
              const night = HOTEL[def.city] ?? 130;
              const before = new Date(new Date(`${sum.shootISO}T12:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
              const n = Math.max(1, away.length);
              return (
                <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)]">
                  <div className="text-[17px] font-medium">Travel and stay</div>
                  {away.length === 0 ? <p className="mt-2 text-[14px] text-neutral-500">Everyone is based in {def.city}. No flights, no hotel.</p> : (
                    <>
                      <p className="mt-1 text-[14px] text-neutral-500">{away.length} {away.length === 1 ? 'person flies' : 'people fly'} in the day before and {away.length === 1 ? 'needs' : 'need'} one night.</p>
                      <div className="mt-3 flex -space-x-2">{away.map((x) => x.photo ? <img key={x.id} src={x.photo} alt={x.name} title={x.name} className="size-9 rounded-full object-cover object-top ring-2 ring-white" /> : <span key={x.id} className="flex size-9 items-center justify-center rounded-full bg-neutral-200 text-[13px] ring-2 ring-white">{x.name[0]}</span>)}</div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <a href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(def.city)}&checkin=${before}&checkout=${sum.shootISO}&group_adults=${n}&no_rooms=${n}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#f3f5f8] p-3 hover:bg-[#eceff3]">
                          <div className="text-[13px] text-neutral-500">Hotel near set</div>
                          <div className="text-[22px] font-light tabular-nums">€{night}<span className="text-[13px] text-neutral-500">/night est.</span></div>
                          <div className="text-[12px] text-neutral-500">Booking.com ↗</div>
                        </a>
                        <a href={`https://www.airbnb.com/s/${encodeURIComponent(def.city)}/homes?checkin=${before}&checkout=${sum.shootISO}&adults=${n}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#f3f5f8] p-3 hover:bg-[#eceff3]">
                          <div className="text-[13px] text-neutral-500">Apartment for {n}</div>
                          <div className="text-[22px] font-light tabular-nums">€{Math.round(night * 0.8 * Math.max(1, n * 0.6))}<span className="text-[13px] text-neutral-500">/night est.</span></div>
                          <div className="text-[12px] text-neutral-500">Airbnb ↗</div>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Costs, short */}
            <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)]">
              <div className="flex items-baseline justify-between"><span className="text-[17px] font-medium">Cost</span><span className={`text-[13px] ${sum.overCap ? 'text-red-600' : 'text-neutral-500'}`}>{sum.overCap ? `${fmtEur(Math.round(budget.total - budget.cap))} over` : `${fmtEur(Math.round(budget.cap - budget.total))} left`}</span></div>
              <div className="mt-2 text-[40px] font-light leading-none tracking-[-0.03em] tabular-nums">{fmtEur(Math.round(budget.total))}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className={`h-full rounded-full ${sum.overCap ? 'bg-red-600' : 'bg-neutral-950'}`} style={{ width: `${Math.min(100, (budget.total / budget.cap) * 100)}%` }} /></div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                {(['talent', 'crew', 'studio', 'travel'] as const).map((c) => <div key={c} className="flex justify-between"><span className="text-neutral-500">{CAT_LABEL[c]}</span><span className="tabular-nums">{fmtEur(Math.round(budget.byCategory[c]))}</span></div>)}
              </div>
            </div>

            {(conflicts.length > 0 || broken.length > 0) && (
              <div className="rounded-2xl bg-red-50 p-4 text-[13px] text-red-700">{conflicts.map((c, i) => <div key={i}>{c.message}</div>)}{broken.map((x) => <div key={x.id}>Changes the brief: {x.label}</div>)}</div>
            )}
            <button data-demo="create" onClick={create} disabled={busy || conflicts.length > 0} className="h-14 rounded-full bg-neutral-950 text-[16px] font-medium text-white disabled:opacity-40">{busy ? 'Creating…' : 'Create the production →'}</button>
            {err && <p className="text-[13px] text-red-600">{err}</p>}
          </div>
        </div>
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
      <StepLoader open={busy} title="Making your production." steps={['Locking the team and the place', 'Building call times and the day', 'Pricing travel, stay and overtime', 'Writing everyone\'s call sheet', 'Opening the board']} />
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
