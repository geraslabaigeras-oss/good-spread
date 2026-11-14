'use client';

import useSWR from 'swr';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { ArrowUpRight, Plane, RotateCcw } from 'lucide-react';
import type { BoardState, PublicPending } from '@/lib/server/views';
import type { Change, Receipt } from '@/lib/types';
import { fmtDate, fmtEur } from '@/lib/format';
import { useReveal, APPROVE } from '@/lib/motion';
import { ToastProvider, useToast, Wordmark } from '@/components/kit';
import { Stage } from '@/components/glass/Stage';
import { PeopleStrip } from './PeopleStrip';
import { Timeline } from './Timeline';
import { Decision } from './Decision';
import { Inbox } from './Inbox';
import { BudgetPanel } from './BudgetPanel';
import { Activity } from './Activity';
import { TravelBand } from './TravelBand';
import { DelayAlert } from './DelayAlert';
import { MessageThread } from './MessageThread';
import { WeatherCard } from './WeatherCard';
import { CITY } from '@/components/glass/Globe';
import { CallRun } from '@/components/call-run';
import { RouteGlobe } from './RouteGlobe';
import { BrandLogo } from '@/components/brand-logo';
import { callsignFor } from './LiveRadar';
import { IATA, type City } from '@/data/catalog';
import { callTime } from '@/lib/engine';
import { fmt } from '@/lib/format';
const ROLE_NAME: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Make-up', stylist: 'Stylist', producer: 'Producer' };
const CAT_NAME: Record<string, string> = { talent: 'Talent', crew: 'Crew', studio: 'Location', travel: 'Travel', post: 'Post', usage: 'Usage' };

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export type Approving = { fixId: string; x: number; y: number; pending: PublicPending };
export type Applied = { version: number; label: string; receipt: Receipt; at: string; changedIds?: string[]; changes?: Change[] };

export function Board({ slug }: { slug: string }) {
  return (
    <Stage voice={false} still>
      <ToastProvider position="bottom-right">
        <BoardInner slug={slug} />
      </ToastProvider>
    </Stage>
  );
}

function BoardInner({ slug }: { slug: string }) {
  const { data, error, mutate } = useSWR<BoardState>(`/api/state/${slug}`, fetcher, { refreshInterval: 2000 });
  const toast = useToast();
  const { parent, item } = useReveal();
  const [approving, setApproving] = useState<Approving | null>(null);
  const [justApproved, setJustApproved] = useState<Applied | null>(null);
  const [telling, setTelling] = useState<Change[] | null>(null);
  const [happenOpen, setHappenOpen] = useState(false);
  const busy = useRef(false);

  /** Runs a call; after 3 s without an answer, says so (DESIGN §4.2). */
  const slow = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const t = setTimeout(() => toast('Still working…'), 3000);
    try {
      return await fn();
    } finally {
      clearTimeout(t);
    }
  }, [toast]);

  const approve = useCallback(
    async (fixId: string, x: number, y: number) => {
      if (busy.current || !data?.pending) return;
      busy.current = true;
      const frozen = data.pending;
      try {
        const r = await slow(() =>
          fetch('/api/fixes/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, fixId }) }),
        );
        const j = await r.json();
        if (!r.ok) {
          toast(`Could not approve: ${j.error ?? r.status}`);
          await mutate();
          return;
        }
        // t = 0 of the approve sequence (DESIGN §5.6)
        setApproving({ fixId, x, y, pending: frozen });
        setJustApproved({ version: j.version, label: j.label, receipt: j.receipt, at: new Date().toISOString(), changedIds: (j.changes ?? []).map((c: { personId: string }) => c.personId), changes: j.changes ?? [] });
        if ((j.changes ?? []).length) setTimeout(() => setTelling(j.changes), 1200);
        mutate();
        setTimeout(() => setApproving(null), APPROVE.slotSwap);
      } finally {
        busy.current = false;
      }
    },
    [data?.pending, slug, mutate, toast, slow],
  );

  const reset = useCallback(
    async (full: boolean) => {
      const ok = full
        ? confirm('Full reset: restore the seed and delete every joined device and phone number?')
        : confirm('Reset the plan to the seed? Joined devices stay. (Shift-click Reset for a full reset.)');
      if (!ok) return;
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full, slug }) });
      setJustApproved(null);
      setApproving(null);
      await mutate();
      toast(full ? 'Board reset · devices removed' : 'Board reset', { check: true });
    },
    [mutate, toast, slug],
  );

  if (!data) {
    if (error && String(error.message).includes('404')) {
      try { if (localStorage.getItem('gs-last-slug') === slug) localStorage.removeItem('gs-last-slug'); } catch {}
      return (
        <div className="flex h-dvh flex-col items-center justify-center px-6 text-center">
          <p className="text-[22px] font-medium">This shoot isn&rsquo;t here</p>
          <p className="mt-2 max-w-sm text-[15px] text-grey-1">It was created somewhere else or has been removed. Start a new shoot from a reference, or open the sample shoot.</p>
          <div className="mt-6 flex gap-3">
            <a href="/new" className="g-btn">Start a shoot</a>
            <a href="/board/jacket-campaign" className="g-btn-ghost">Open the sample</a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-dvh items-center justify-center text-grey-1">
        {error ? `Could not load the board. Check the connection and refresh.` : (
          <div className="w-[min(1100px,calc(100vw-64px))] space-y-5">
            <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-white/70" />
            <div className="grid grid-cols-3 gap-5">{[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-[28px] bg-white/70" />)}</div>
            <div className="h-72 animate-pulse rounded-[28px] bg-white/70" />
            <p className="text-center text-[14px] text-neutral-500">Opening the production…</p>
          </div>
        )}
      </div>
    );
  }

  const p = data.production;
  const rev = data.lastRevision;
  const applied: Applied | null =
    justApproved && justApproved.version === p.version
      ? justApproved
      : rev?.receipt && rev.version === p.version
        ? { version: rev.version, label: rev.receipt.label ?? rev.fix_kind ?? '', receipt: rev.receipt, at: rev.created_at, changes: rev.changes }
        : null;
  const animateVersion = justApproved?.version === p.version ? p.version : null;

  const team = data.people.filter((x) => x.role !== 'producer');
  // Demo: the first traveller's flight now lands 10:45 (what a live flight status feed would report)
  const models = team.filter((x) => x.role === 'model');
  const sendUpdate = async (body: Record<string, unknown>) => {
    setHappenOpen(false);
    await fetch('/api/inbox/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, inboxId: `event-${Date.now()}`, ...body }) });
    await mutate();
  };
  const runningLate = (id: string, minutes: number) => {
    const call = callTime(p, id) ?? 540;
    return sendUpdate({ source: `${nameOf(id).split(' ')[0]} by text: running late`, update: { kind: 'late', personId: id, readyMin: call + minutes, source: 'talent' } });
  };
  const cantMakeIt = (id: string) => sendUpdate({ source: `${nameOf(id).split(' ')[0]}'s agent: can't make it`, update: { kind: 'late', personId: id, readyMin: 99999, source: 'agency' } });
  const simulateDelay = async () => {
    setHappenOpen(false);
    const t = p.travel[0];
    if (!t) return;
    const late = Math.max(t.arriveMin + 90, 645);
    const hh = String(Math.floor(late / 60)).padStart(2, '0'), mm = String(late % 60).padStart(2, '0');
    await fetch('/api/inbox/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, inboxId: `status-${Date.now()}`, source: `flight status ${t.number}`, manual: { personId: t.personId, time: `${hh}:${mm}` } }) });
    await mutate();
  };
  const b = data.budget;
  const changes: Change[] = applied?.changes ?? [];
  const changedBy = new Map(changes.map((c) => [c.personId, c]));
  const nameOf = (id: string) => p.people.find((x) => x.id === id)?.name ?? id;
  const roleOf = (id: string) => ROLE_NAME[p.people.find((x) => x.id === id)?.role ?? ''] ?? '';
  const dateLabel = new Date(`${p.dateISO}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const days = p.shootDays ?? 1;
  const endLabel = days > 1 ? new Date(new Date(`${p.dateISO}T12:00:00Z`).getTime() + (days - 1) * 86400000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : null;
  const conflict = data.pending?.conflicts[0];
  const headline = data.pending && conflict ? `${conflict.message}. Pick a fix below.`
    : applied ? `Plan adapted: ${applied.label.charAt(0).toLowerCase()}${applied.label.slice(1)}.`
    : 'Everything is on schedule.';
  const smsSent = data.events.some((e) => e.type === 'sms_sent');
  const place = p.studio.name.split(',')[0];
  const messages = team.filter((x) => x.booking !== 'to_book').map((x) => {
    const c = changedBy.get(x.id);
    const first = x.name.split(' ')[0];
    const call = callTime(p, x.id);
    const t = p.travel.find((tr) => tr.personId === x.id);
    const text = c
      ? `Hi ${first}, ${c.text.charAt(0).toLowerCase()}${c.text.slice(1)} ${place}.`
      : `Hi ${first}, your call is ${call != null ? fmt(call) : 'tbc'} on ${dateLabel} at ${place}.${t ? ` ${t.number} lands ${fmt(t.arriveMin)}, a car takes you to set.` : ''}`;
    return { id: x.id, name: x.name, role: ROLE_NAME[x.role] ?? x.role, photo: x.photo, text };
  });

  // Day schedule: each person's call, plus flight landings, in time order; "was" when the last change moved it
  type Row = { at: number; personId: string; name: string; role: string; what: string; was?: string; kind: 'call' | 'land'; late?: boolean };
  const KIND_WORD: Record<string, string> = { hmu: 'Hair & make-up', shoot: 'Shoot', setup: 'Set-up', lunch: 'Lunch', wrap: 'Wrap' };
  const firstBlock = (id: string) => [...p.blocks].filter((bl) => bl.personIds.includes(id)).sort((a, z) => a.startMin - z.startMin)[0];
  const rows: Row[] = [
    ...team.map((x) => {
      const call = callTime(p, x.id);
      const c = changedBy.get(x.id);
      const fb = firstBlock(x.id);
      const what = fb ? `${KIND_WORD[fb.kind] ?? fb.kind}${fb.kind === 'shoot' && fb.lookIds?.length ? ` · looks ${fb.lookIds.join(', ')}` : ''}` : 'On set';
      return call == null ? null : { at: call, personId: x.id, name: x.name, role: ROLE_NAME[x.role] ?? x.role, what, was: c?.kind === 'call_time' ? c.before : undefined, kind: 'call' as const, late: x.booking === 'delayed' };
    }).filter((r): r is NonNullable<typeof r> => !!r),
    ...p.travel.map((t) => ({ at: t.arriveMin, personId: t.personId, name: nameOf(t.personId), role: '', what: `Lands at ${t.to}${t.number !== 'TBC' ? ` · ${t.number}` : ''}`, was: t.scheduledArriveMin != null && t.scheduledArriveMin !== t.arriveMin ? fmt(t.scheduledArriveMin) : undefined, kind: 'land' as const })),
  ].sort((a, z) => a.at - z.at);

  const NAV = [
    ['plan', 'Plan', changes.length ? `${changes.length} changes` : ''],
    ['team', 'Team', String(team.length)],
    ['schedule', 'Day', ''],
    ['budget', 'Budget', ''],
    ['inbox', 'Updates', ''],
  ] as const;

  return (
    <div className="board-dark flex min-h-dvh">
      <DelayAlert p={p} pending={data.pending} />
      {telling && (
        <CallRun open onClose={() => setTelling(null)}
          targets={telling.map((c) => { const x = data.people.find((y) => y.id === c.personId); return { id: c.personId, name: x?.name ?? c.personId, role: x?.role ?? '', photo: x?.photo }; })}
          mode={{ kind: 'update', lines: Object.fromEntries(telling.map((c) => [c.personId, c.text])) }} />
      )}
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-black/[0.06] bg-white/40 px-5 py-8 lg:flex">
        <a href="/" aria-label="good spread"><Wordmark className="h-[26px]" /></a>
        <div className="mt-14 px-2 text-[13px] text-neutral-500">{p.title.replace(' (demo)', '')} · {p.city ?? 'Vilnius'}</div>
        <nav className="mt-2 flex flex-col gap-0.5">
          {NAV.map(([id, label, meta], i) => (
            <a key={id} href={`#${id}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] transition-colors hover:bg-white ${i === 0 ? 'bg-white' : ''}`}>
              <span>{label}</span>{meta && <span className="text-[13px] text-neutral-500">{meta}</span>}
            </a>
          ))}
          <a href={`/wrap/${slug}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] hover:bg-white"><span>Payments</span><ArrowUpRight className="size-4 text-neutral-400" /></a>
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <p className="text-[13px] leading-5 text-neutral-500">Every change updates everyone&rsquo;s call time and message.</p>
          {slug === 'jacket-campaign' && <button onClick={(e) => reset(e.shiftKey)} className="text-[13px] text-neutral-600 hover:text-neutral-950">Start over</button>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 pb-20 lg:px-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pt-8">
          <div className="text-[15px] text-neutral-500">Shoots <span className="mx-1.5">/</span> {p.title.replace(' (demo)', '')} <span className="mx-1.5">/</span> <span className="text-neutral-900">Plan</span></div>
          <div className="flex items-center gap-4">
            <span className={`border-b-2 pb-0.5 text-[17px] tabular-nums ${b.remaining < 0 ? 'border-red-600 text-red-600' : 'border-neutral-950'}`}>{fmtEur(Math.round(b.total))} <span className="text-neutral-400">/ {fmtEur(b.cap)}</span></span>
            {!data.pending && (
              <div className="relative">
                <button data-demo="simulate-delay" onClick={() => setHappenOpen((x) => !x)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50">Something happens…</button>
                {happenOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[300px] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.18),0_0_0_0.5px_rgba(0,0,0,.08)]">
                    <div className="px-3 pb-1 pt-2 text-[12px] text-neutral-500">Simulate a real-world change</div>
                    {p.travel[0] && <button onClick={simulateDelay} className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50"><span className="text-[14px]">✈ Flight lands late</span><span className="text-[12px] text-neutral-500">{nameOf(p.travel[0].personId)}&rsquo;s flight slips 2 h</span></button>}
                    {models[0] && <button onClick={() => runningLate(models[0].id, 45)} className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50"><span className="text-[14px]">⏱ Someone is running late</span><span className="text-[12px] text-neutral-500">{models[0].name} texts: 45 min late</span></button>}
                    {models[1] && <button onClick={() => cantMakeIt(models[1].id)} className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-neutral-50"><span className="text-[14px]">✕ Someone can&rsquo;t make it</span><span className="text-[12px] text-neutral-500">{models[1].name}&rsquo;s agent cancels</span></button>}
                  </div>
                )}
              </div>
            )}
            <a href="#messages" className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-[15px] font-medium text-white">Call sheet</a>
          </div>
        </div>

        {/* Headline */}
        <motion.div id="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-12">
          <h1 className="text-[52px] font-normal leading-[1.1] tracking-[-0.03em]">{endLabel ? <>{dateLabel.split(' ').slice(0, 2).join(' ')} – {endLabel} <span className="text-neutral-400">· {days} days</span></> : dateLabel}</h1>
          <p className="mt-2 text-[40px] font-light leading-[1.15] tracking-[-0.03em] text-neutral-500">{headline}</p>
        </motion.div>

        {/* Decisions when something broke */}
        {(data.pending || approving) && (
          <div className="mt-10">
            <Decision production={p} pending={approving ? approving.pending : data.pending} approving={approving} applied={null} countUp={false} onApprove={approve} />
          </div>
        )}
        {applied && !data.pending && !approving && (
          <div className="mt-10"><Decision production={p} pending={null} approving={null} applied={applied} countUp={!!animateVersion} onApprove={approve} /></div>
        )}

        {p.travel.length > 0 && <TravelBand p={p} />}

        {/* Today: the day as a timeline; weather and budget beside it */}
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-5">
          <div id="schedule" className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
              <div className="flex justify-between border-b border-black/[0.06] pb-4"><span className="text-[17px] font-medium">Day schedule</span><span className="truncate pl-4 text-[14px] text-neutral-500">{p.studio.name.split(',')[0]}</span></div>
              <div className="relative mt-4">
                <span className="absolute bottom-3 left-[83px] top-3 w-px bg-neutral-200" />
                {rows.map((r, i) => {
                  const person = data.people.find((x) => x.id === r.personId);
                  const tone = r.late ? 'bg-red-500' : r.kind === 'land' ? 'bg-[#6f93c7]' : r.was ? 'bg-neutral-950' : 'bg-white ring-2 ring-neutral-300';
                  return (
                    <div key={i} className="relative flex items-center gap-4 py-2">
                      <span className="w-[64px] shrink-0 text-right">
                        <span className={`block text-[18px] tabular-nums leading-6 ${r.was ? 'font-medium' : ''}`}>{fmt(r.at)}</span>
                        {r.was && <span className="block text-[12px] text-neutral-400 line-through">{r.was}</span>}
                      </span>
                      <span className={`relative z-[1] ml-[2px] size-3 shrink-0 rounded-full ${tone}`} />
                      <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${r.was || r.late ? 'bg-white shadow-[0_6px_20px_rgba(0,0,0,.06)]' : 'hover:bg-white/80'}`}>
                        {r.kind === 'land'
                          ? <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e3eaf3] text-neutral-700"><Plane className="size-4" /></span>
                          : person?.photo ? <img src={person.photo} alt="" className="size-10 shrink-0 rounded-full object-cover object-top" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[14px]">{r.name[0]}</span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px]">{r.kind === 'land' ? `${r.name.split(' ')[0]} lands` : r.name}{r.role && <span className="text-neutral-400"> · {r.role}</span>}</span>
                          <span className="block truncate text-[13px] text-neutral-500">{r.what}</span>
                        </span>
                        {r.was && <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-0.5 text-[12px] text-white">Moved</span>}
                        {r.late && <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-[12px] text-red-700">Late</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            {(() => { const c = CITY[p.city ?? 'Vilnius'] ?? CITY.Vilnius; const ext = p.blocks.find((b) => b.kind === 'shoot'); return <WeatherCard compact lat={c.lat} lng={c.lng} dateISO={p.dateISO} place={p.studio.name.split(',')[0]} exteriorAt={ext ? `the exterior look at ${fmt(ext.startMin)}` : undefined} />; })()}
            <div id="budget" className="rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
              <div className="flex justify-between"><span className="text-[17px] font-medium">Budget</span><span className="text-[14px] text-neutral-500">{fmtDate(p.dateISO).slice(4, 10)}</span></div>
              <div className="mt-6 flex items-baseline gap-3"><span className="text-[34px] font-light tabular-nums">{fmtEur(Math.round(b.total))}</span><span className="text-[20px] font-light text-neutral-500">of {fmtEur(b.cap)}</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200"><motion.div className={`h-full rounded-full ${b.remaining < 0 ? 'bg-red-600' : 'bg-neutral-950'}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (b.total / b.cap) * 100)}%` }} transition={{ duration: 1 }} /></div>
              <div className="mt-4 divide-y divide-black/[0.06]">
                {(['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const).filter((c) => b.byCategory[c] > 0).map((c) => (
                  <div key={c} className="flex justify-between py-2 text-[15px]"><span>{CAT_NAME[c]}</span><span className="tabular-nums">{fmtEur(Math.round(b.byCategory[c]))}</span></div>
                ))}
              </div>
              <p className="mt-3 text-[14px] text-neutral-500">{b.remaining >= 0 ? `${fmtEur(Math.round(b.remaining))} under the cap, ${fmtEur(Math.round(b.contingency))} kept for surprises.` : `${fmtEur(Math.round(-b.remaining))} over the cap.`}{b.overtime > 0 ? ` Includes ${fmtEur(Math.round(b.overtime))} overtime.` : ''}</p>
            </div>
          </div>
        </div>

        <MessageThread messages={messages} title={changes.length ? 'What changed, per person' : 'Call sheet'} autoKey={changes.length && applied ? `v${applied.version}` : null} />

        {/* Team */}
        <section id="team" className="mt-12">
          <h2 className="mb-4 text-[26px] font-light tracking-[-0.02em]">Team</h2>
          <PeopleStrip people={team} version={p.version} changedIds={justApproved?.version === p.version ? justApproved.changedIds ?? [] : []} />
        </section>


        <div id="inbox" className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Inbox slug={slug} onChanged={() => mutate()} slow={slow} />
          <div className="max-h-[420px]"><Activity events={data.events} /></div>
        </div>
      </main>
    </div>
  );
}
