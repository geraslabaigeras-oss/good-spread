'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Picks } from '@/lib/types';
import { computeBudget, detectConflicts, dnaViolations, evaluateDna, fmt, summarize } from '@/lib/engine';
import { candidates, locationCandidates, strategyDef, type CatalogPerson } from '@/data/catalog';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { draftProduction } from '@/lib/plan-draft';
import { Steps } from '@/components/plan/Steps';
import { Timeline } from '@/components/board/Timeline';

export default function Assemble() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
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

  if (!draft || !view) return null;
  const { p, sum, budget, conflicts, dna } = view;
  const broken = dnaViolations(dna);

  const setPicks = (next: Picks) => setDraft({ ...draft, picks: next });
  const toggleModel = (id: string) => {
    const has = picks.models.includes(id);
    let models = has ? picks.models.filter((m) => m !== id) : [...picks.models, id];
    if (models.length > def.modelSlots) models = models.slice(models.length - def.modelSlots);
    if (!models.length) return;
    setPicks({ ...picks, models });
  };

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy, picks, brief: p.brief, deliverables: draft!.deliverables, cap: draft!.cap, startISO: draft!.startISO, dnaPreserve: draft!.dnaPreserve,
        }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? `HTTP ${r.status}`);
      router.push(`/board/${j.slug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
      setBusy(false);
    }
  }

  const travelNote = (c: CatalogPerson) => {
    if (c.city === def.city) return `${c.city}, local`;
    const t = c.travelTo?.[def.city];
    if (!t) return c.city;
    return t.dayBefore ? `Flies ${t.from}→${t.to} day before · +${fmtEur(t.flight + t.taxi + (t.hotel ?? 0))}` : `Flies ${t.number} ${t.from}→${t.to}, lands ${fmt(t.arriveMin)} · +${fmtEur(t.flight + t.taxi)}`;
  };

  return (
    <div className="mx-auto min-h-dvh max-w-[1320px] px-6 py-6">
      <Steps step={3} />
      <div className="mt-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[40px] leading-[44px]">Assemble the {def.name.toLowerCase()} production</h1>
          <p className="mt-1 text-[14px] text-grey-1">{def.tagline} Pick {def.modelSlots === 1 ? 'a model' : `${def.modelSlots} models`}, a photographer and a {def.locationKinds.includes('location') ? 'location' : 'studio'}. Every pick re-costs and re-checks the plan.</p>
        </div>
        <button onClick={() => router.push('/plan')} className="text-[13px] text-grey-1 underline">Change strategy</button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Group title={`Models · ${picks.models.length}/${def.modelSlots}`}>
            {candidates(strategy, 'model').map((c) => (
              <Card key={c.id} c={c} selected={picks.models.includes(c.id)} onClick={() => toggleModel(c.id)} note={travelNote(c)} />
            ))}
          </Group>
          <Group title="Photographer">
            {candidates(strategy, 'photographer').map((c) => (
              <Card key={c.id} c={c} selected={picks.photographer === c.id} onClick={() => setPicks({ ...picks, photographer: c.id })} note={`${travelNote(c)}${c.motion === false ? ' · stills only' : ' · stills + motion'}`} />
            ))}
          </Group>
          <Group title={def.locationKinds.includes('location') ? 'Location' : 'Studio'}>
            {locationCandidates(strategy).map((l) => (
              <button key={l.id} onClick={() => setPicks({ ...picks, location: l.id })} className={`rounded-[20px] border p-4 text-left ${picks.location === l.id ? 'border-ink' : 'border-hairline hover:border-hairline-strong'}`}>
                {l.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo} alt="" className="mb-3 aspect-[4/3] w-full rounded-[10px] object-cover" />
                ) : (
                  <div className="mb-3 flex h-20 items-end rounded-[10px] bg-grey-3 p-3 text-[12px] text-ink">{l.tags.join(' · ')}</div>
                )}
                <div className="font-serif text-[20px] leading-6">{l.name.split(',')[0]}</div>
                <div className="mt-1 text-[13px] text-grey-1">{l.note}</div>
                <div className="mt-1 font-mono text-[13px] num">{l.kind === 'location' ? `Permit ${fmtEur(l.permit ?? 0)} + fixer ${fmtEur(l.fixer ?? 0)}` : `${fmtEur(l.hourlyRate)}/h`}</div>
              </button>
            ))}
          </Group>
        </div>

        {/* Live plan */}
        <aside className="h-fit rounded-[20px] border border-hairline p-5 lg:sticky lg:top-6">
          <div className="label">Live plan</div>
          <div className={`mt-2 font-serif text-[44px] leading-[48px] num ${sum.overCap ? 'text-conflict' : ''}`}>{fmtEur(budget.total)}</div>
          <div className="text-[13px] text-grey-1 num">of {fmtEur(budget.cap)} cap · {sum.overCap ? `${fmtEur(budget.total - budget.cap)} over` : `${fmtEur(budget.remaining)} left`}</div>
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-1 text-[14px]">
            <dt className="text-grey-1">Shoot</dt><dd className="num">{fmtDate(sum.shootISO)} · {p.studio.name.split(',')[0]}</dd>
            <dt className="text-grey-1">Delivery</dt><dd className={`num ${sum.fitsDeadline ? '' : 'text-conflict'}`}>{fmtDate(sum.deliveryISO)}</dd>
            <dt className="text-grey-1">Calls</dt><dd className="num">{sum.callTimes.map((x) => `${x.name} ${x.call != null ? fmt(x.call) : '—'}`).join(' · ')}</dd>
          </dl>
          <div className="mt-4">
            <div className="label">Checks</div>
            {conflicts.length === 0 && !sum.overCap && broken.length === 0 && <p className="mt-1 text-[14px] text-seen">No conflicts. Brief kept. Within budget.</p>}
            {sum.overCap && <p className="mt-1 text-[14px] text-conflict">Over the budget cap.</p>}
            {conflicts.map((c, i) => <p key={i} className="mt-1 text-[14px] text-conflict">{c.message}</p>)}
            {broken.map((x) => <p key={x.id} className="mt-1 text-[14px] text-conflict">Breaks must-keep: {x.label}{x.note ? ` (${x.note})` : ''}</p>)}
          </div>
          <button onClick={create} disabled={busy || conflicts.length > 0} className="mt-5 h-12 w-full rounded-full bg-action text-[15px] font-medium text-white disabled:opacity-40">
            {busy ? 'Creating…' : 'Create production →'}
          </button>
          {err && <p className="mt-2 text-[13px] text-conflict">{err}</p>}
        </aside>
      </div>

      <div className="mt-8 h-[300px]" style={{ ['--row-h' as string]: '40px', ['--bar-h' as string]: '28px', ['--label-w' as string]: '120px' }}>
        <Timeline production={p} conflicts={detectConflicts(p)} />
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="label mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>
    </section>
  );
}

function Card({ c, selected, onClick, note }: { c: CatalogPerson; selected: boolean; onClick: () => void; note: string }) {
  return (
    <button onClick={onClick} className={`rounded-[20px] border p-4 text-left ${selected ? 'border-ink bg-surface' : 'border-hairline hover:border-hairline-strong'}`}>
      {c.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photo} alt={c.name} className="mb-3 aspect-[3/4] w-full rounded-[10px] object-cover" />
      ) : (
        <div className="mb-3 flex h-20 items-center justify-center rounded-[10px] bg-grey-3 font-serif text-[36px] text-ink-24">{c.name[0]}</div>
      )}
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[22px] leading-7">{c.name}</span>
        <span className="font-mono text-[13px] num">{fmtEur(c.dayRate)}</span>
      </div>
      <div className="text-[12px] text-grey-1">{c.agency ?? 'Freelance'}{c.commissionPct ? ` · ${c.commissionPct}% fee` : ''}</div>
      <div className="mt-1 text-[13px]">{c.bio}</div>
      <div className="mt-1 text-[12px] text-grey-1">{note}</div>
    </button>
  );
}
