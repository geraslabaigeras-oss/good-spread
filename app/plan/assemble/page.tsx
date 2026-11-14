'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Picks } from '@/lib/types';
import { computeBudget, detectConflicts, dnaViolations, evaluateDna, fmt, summarize } from '@/lib/engine';
import { candidates, locationCandidates, strategyDef, type CatalogPerson } from '@/data/catalog';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { draftProduction, pinsFor } from '@/lib/plan-draft';
import { BudgetLine, CAT_COLOR, Stage, Tilt, TopBar } from '@/components/glass/Stage';
import { Globe, type GlobePin } from '@/components/glass/Globe';

const ease = [0.2, 0.8, 0.2, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;
type Tab = 'models' | 'photographer' | 'location';

export default function Assemble() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [tab, setTab] = useState<Tab>('models');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const strategy = draft?.strategy ?? 'local';
  const def = strategyDef(strategy);
  const picks: Picks = draft?.picks ?? def.defaultPicks;

  const view = useMemo(() => {
    if (!draft) return null;
    const base = draftProduction(draft, strategy);
    const p = draftProduction(draft, strategy, picks);
    return { p, sum: summarize(p), budget: computeBudget(p), conflicts: detectConflicts(p).filter((c) => c.code !== 'BUDGET'), dna: evaluateDna(base, p) };
  }, [draft, strategy, picks]);

  if (!draft || !view) return <Stage><div /></Stage>;
  const { p, sum, budget, conflicts, dna } = view;
  const broken = dnaViolations(dna);
  const models = candidates(strategy, 'model');
  const photos = candidates(strategy, 'photographer');
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
        body: JSON.stringify({ strategy, picks, brief: p.brief, deliverables: draft!.deliverables, cap: draft!.cap, startISO: draft!.startISO, dnaPreserve: draft!.dnaPreserve }),
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
            <p className="mt-2 max-w-[380px] text-[14px] text-grey-1">Pick on the globe or in the list. Cost and call times update with each pick.</p>
          </div>
          <Globe pins={pins} arcs={chosen.arcs} focus={def.city} hub={def.city} onPin={onPin} height="64vh" altitude={0.62} />

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="glass -mt-16 grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
            <div className="w-[260px]"><BudgetLine total={budget.total} cap={budget.cap} segments={CATS.map((c) => ({ value: budget.byCategory[c], color: CAT_COLOR[c] }))} /></div>
            <div>
              <div className="g-label">Call times · {fmtDate(sum.shootISO)} · {p.studio.name.split(',')[0]}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <AnimatePresence mode="popLayout">
                  {sum.callTimes.map((x) => (
                    <motion.span layout key={x.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="rounded-full border border-hairline-strong bg-white/60 px-3 py-1 text-[12px]">
                      {x.name} <span className="font-mono text-grey-1">{x.call != null ? fmt(x.call) : '—'}</span>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
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
                {tab === 'models' && models.map((c) => <CompCard key={c.id} c={c} selected={picks.models.includes(c.id)} onClick={() => toggleModel(c.id)} travel={travel(c)} />)}
                {tab === 'photographer' && photos.map((c) => <CompCard key={c.id} c={c} selected={picks.photographer === c.id} onClick={() => setPicks({ ...picks, photographer: c.id })} travel={travel(c)} />)}
                {tab === 'location' && locs.map((l) => (
                  <Tilt key={l.id} onClick={() => setPicks({ ...picks, location: l.id })} selected={picks.location === l.id} className="glass-soft cursor-pointer overflow-hidden">
                    <div className="relative h-32 overflow-hidden" style={{ background: l.photo ? `url(${l.photo}) center 20%/cover` : (l.natural ? '#d8c8b4' : '#e4e1dc') }}>
                      <span className="absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-wider text-ink/70">{l.tags.join(' · ')}</span>
                    </div>
                    <div className="p-3">
                      <div className="font-serif text-[20px] leading-6">{l.name.split(',')[0]}</div>
                      <div className="mt-1 text-[12px] text-grey-1">{l.note}</div>
                      <div className="mt-2 font-mono text-[12px]">{l.kind === 'location' ? `Permit ${fmtEur(l.permit ?? 0)} · fixer ${fmtEur(l.fixer ?? 0)}` : `${fmtEur(l.hourlyRate)}/h`}</div>
                    </div>
                  </Tilt>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Stage>
  );
}

function CompCard({ c, selected, onClick, travel }: { c: CatalogPerson; selected: boolean; onClick: () => void; travel: string }) {
  return (
    <Tilt onClick={onClick} selected={selected} className="glass-soft relative cursor-pointer overflow-hidden">
      <div className="relative h-40 overflow-hidden" style={{ background: c.photo ? `url(${c.photo}) center 20%/cover` : '#e4e1dc' }}>
        {!c.photo && <span className="absolute bottom-0 right-3 font-serif text-[110px] leading-[0.8] text-ink/10">{c.name[0]}</span>}
        {selected && <motion.span layoutId={undefined} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">Booked</motion.span>}
        <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-ink">{c.agency?.replace(' (demo)', '') ?? 'Freelance'}</span>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[22px] leading-7">{c.name}</span>
          <span className="font-mono text-[12px] text-ink">{fmtEur(c.dayRate)}</span>
        </div>
        {c.stats ? (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-grey-1">
            {c.stats.height} · {c.stats.bust}/{c.stats.waist}/{c.stats.hips} · shoe {c.stats.shoe}
            <br />{c.stats.hair} · {c.stats.eyes} eyes
          </div>
        ) : (
          <div className="mt-1 text-[12px] text-grey-1">{c.known ?? c.bio}{c.motion === false ? ' · stills only' : c.role === 'photographer' ? ' · stills + motion' : ''}</div>
        )}
        <div className="mt-2 text-[11px] text-grey-2">{travel}</div>
      </div>
    </Tilt>
  );
}
