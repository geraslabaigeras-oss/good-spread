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
import { draftProduction, pinsFor } from '@/lib/plan-draft';
import { BudgetLine, CAT_COLOR, Stage, Tilt, TopBar } from '@/components/glass/Stage';
import { type GlobePin } from '@/components/glass/Globe';
import { FlightGlobe } from '@/components/flight-globe';
import { Scout } from '@/components/scout';
import { AgencyCall } from '@/components/agency-call';
import { OFFICES, flagUrl, type Office } from '@/lib/agencies';

const ease = [0.2, 0.8, 0.2, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;
type Tab = 'models' | 'photographer' | 'location';

export default function Assemble() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [tab, setTab] = useState<Tab>('models');
  const [calling, setCalling] = useState<Office | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
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
  const onPin = (id: string) => {
    if (models.some((m) => m.id === id)) { toggleModel(id); setTab('models'); }
    else if (photos.some((x) => x.id === id)) { setPicks({ ...picks, photographer: id }); setTab('photographer'); }
    else if (locs.some((l) => l.id === id)) { setPicks({ ...picks, location: id }); setTab('location'); }
  };

  // Globe: every candidate, chosen ones lit; flights for chosen travellers
  const chosen = pinsFor(p);
  const pins: GlobePin[] = [
    ...models.map((c) => ({ id: c.id, city: c.city, label: c.name, sub: 'model', kind: 'model' as const, photo: c.photo, selected: picks.models.includes(c.id), dim: !picks.models.includes(c.id) })),
    ...photos.map((c) => ({ id: c.id, city: c.city, label: c.name, sub: 'photographer', kind: 'photographer' as const, selected: picks.photographer === c.id, dim: picks.photographer !== c.id })),
    ...chosen.pins.filter((x) => x.kind === 'crew'),
    ...locs.map((l) => ({ id: l.id, city: l.city, label: l.name.split(',')[0].replace(' (demo)', ''), sub: 'location', kind: 'location' as const, selected: picks.location === l.id, dim: picks.location !== l.id })),
  ];

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, picks, brief: p.brief, deliverables: draft!.deliverables, cap: draft!.cap, startISO: draft!.startISO, dnaPreserve: draft!.dnaPreserve, place: draft!.place ?? null }),
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
          <div className="pt-28"><FlightGlobe from={chosen.arcs[0]?.from ?? null} to={def.city} label={chosen.arcs[0] ? `${chosen.arcs[0].label} flies in` : 'no flights'} height="56vh" /></div>

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

        {/* Talent / photographer / location */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }} className="glass flex max-h-[calc(100dvh-110px)] flex-col p-4">
          <div className="relative flex gap-1 rounded-full bg-ink/[0.05] p-1">
            {([['models', `Models ${picks.models.length}/${def.modelSlots}`], ['photographer', 'Photographer'], ['location', def.locationKinds.includes('location') ? 'Location' : 'Studio']] as [Tab, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className="relative flex-1 rounded-full py-2 text-[13px]">
                {tab === k && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgb(80_60_40/0.1)]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className={`relative ${tab === k ? 'text-ink' : 'text-grey-1'}`}>{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-3">
                {tab === 'models' && models.filter((c) => !isOpenSlot(c.id)).map((c) => <CompCard key={c.id} c={c} selected={picks.models.includes(c.id)} onClick={() => toggleModel(c.id)} travel={travel(c)} match={lookMatch(needs?.model, c.lookWords)} onCheck={() => setChecking(c.id)} />)}
                {tab === 'photographer' && photos.filter((c) => !isOpenSlot(c.id)).map((c) => <CompCard key={c.id} c={c} selected={picks.photographer === c.id} onClick={() => setPicks({ ...picks, photographer: c.id })} travel={travel(c)} match={lookMatch(needs?.photographer, c.lookWords)} onCheck={() => setChecking(c.id)} />)}
                {tab === 'location' && draft.brief && <div className="col-span-2"><Scout brief={draft.brief} city={def.city} chosen={draft.place} onChoose={(pl) => setDraft({ ...draft, place: pl })} /></div>}
                {tab === 'location' && !draft.brief && locs.filter((l) => !l.id.startsWith('open-')).map((l) => (
                  <Tilt key={l.id} onClick={() => setPicks({ ...picks, location: l.id })} selected={picks.location === l.id} className="glass-soft cursor-pointer overflow-hidden">
                    <div className="relative h-44 overflow-hidden" style={{ background: l.photo ? `url(${l.photo}) center 20%/cover` : (l.natural ? '#d8c8b4' : '#e4e1dc') }}>
                      <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-wider text-ink/70">{l.tags.join(' · ')}</span>
                    </div>
                    <div className="p-3">
                      <div className="font-serif text-[20px] leading-6">{l.name.split(',')[0]}</div>
                      <div className="mt-1 text-[12px] text-grey-1">{l.note}</div>
                      <div className="mt-2 font-mono text-[12px]">{l.kind === 'location' ? `${fmtEur(l.permit ?? 0)}/day (est.)${l.fixer ? ` · fixer ${fmtEur(l.fixer)}` : ''}` : `${fmtEur(l.hourlyRate)}/h`}</div>
                    </div>
                  </Tilt>
                ))}
              </motion.div>
            </AnimatePresence>
            {(tab === 'models' || tab === 'photographer') && (
              <Link href="/people" className="mt-3 inline-flex items-center gap-1 text-[13px] text-grey-1 hover:text-ink">+ Add your own person (make-up, stylist, anyone)</Link>
            )}
            {(tab === 'models' || tab === 'photographer') && (
              <div className="mt-6">
                <div className="text-[15px] font-medium">Request options from agencies</div>
                <p className="mt-0.5 text-[13px] text-grey-1">Your voice agent calls the agency in its language and asks for {tab === 'models' ? 'models' : 'photographers'} that fit the brief.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {OFFICES.map((o) => (
                    <button key={o.agency + o.city} onClick={() => setCalling(o)} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] transition-colors hover:bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flagUrl(o.cc)} alt="" className="h-6 w-8 rounded object-cover" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{o.agency} {o.city}</span><span className="text-[12px] text-grey-1">{o.language}</span></span>
                      <span className="text-[12px] text-grey-1">Call</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
      {calling && (
        <AgencyCall
          key={calling.agency + calling.city + tab}
          person={{ id: 'request', name: tab === 'models' ? `${def.modelSlots} models that fit our brief` : 'a photographer who fits our brief', role: tab === 'models' ? 'model' : 'photographer', city: def.city, dayRate: 0, createdAt: '', agency: `${calling.agency} ${calling.city}` }}
          open={!!calling}
          onOpenChange={(o) => !o && setCalling(null)}
          onAnswer={async () => setCalling(null)}
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
