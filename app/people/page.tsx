'use client';

/* eslint-disable @next/next/no-img-element */
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Stage, TopBar } from '@/components/glass/Stage';
import { useRoster } from '@/lib/use-roster';
import { AgencyCall } from '@/components/agency-call';
import { QuickAdd } from '@/components/quick-add';
import { toCatalog, type RosterPerson } from '@/lib/roster';

type Role = RosterPerson['role'];
const ROLES: [Role | 'all', string][] = [['all', 'Everyone'], ['model', 'Models'], ['photographer', 'Photographers'], ['stylist', 'Stylists'], ['mua', 'Make-up']];
const ROLE_ONE: Record<Role, string> = { model: 'Model', photographer: 'Photographer', stylist: 'Stylist', mua: 'Make-up' };
const ease = [0.2, 0.7, 0.2, 1] as const;

/** Your people and the directory, in one place: search, filter, tap to see work and call their agent, or add someone. */
export default function People() {
  const roster = useRoster();
  const [role, setRole] = useState<Role | 'all'>('all');
  const [tier, setTier] = useState<'all' | 'top' | 'mid'>('all');
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);
  const [adding, setAdding] = useState<Role | null>(null);
  const [limit, setLimit] = useState(24);

  const mine = roster.people.filter((p) => !/^(tb|eu|sample)-/.test(p.id));
  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return roster.people
      .filter((p) => role === 'all' || p.role === role)
      .filter((p) => tier === 'all' || (p.tier ?? 'mid') === tier)
      .filter((p) => {
        if (!words.length) return true;
        const hay = `${p.name} ${p.agency ?? ''} ${p.city} ${(toCatalog(p).lookWords ?? []).join(' ')}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => Number(!!b.photo) - Number(!!a.photo));
  }, [roster.key, role, tier, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const v = viewing ? roster.people.find((x) => x.id === viewing) : null;

  return (
    <Stage>
      <TopBar step={0} />
      <div className="mx-auto max-w-[1280px] px-8 pb-24 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[52px] font-light leading-[1.05] tracking-[-0.03em]">People. <span className="text-neutral-400">Yours and the directory.</span></h1>
            <p className="mt-2 text-[15px] text-neutral-600">{roster.people.length} people · {mine.length} added by you. Tap anyone to see their work and call their agent.</p>
          </div>
          <div className="flex gap-2">
            {(['model', 'photographer', 'stylist', 'mua'] as Role[]).map((r) => (
              <button key={r} onClick={() => setAdding(r)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50"><Plus className="size-4" /> {ROLE_ONE[r]}</button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label className="flex h-11 min-w-[280px] flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">
            <Search className="size-4 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a look, city or agency: curly, Paris, editorial…" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-neutral-400" />
          </label>
          <div className="flex rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">
            {ROLES.map(([k, l]) => (
              <button key={k} onClick={() => setRole(k)} className={`h-9 rounded-full px-4 text-[14px] transition-colors ${role === k ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}>{l}</button>
            ))}
          </div>
          <div className="flex rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">
            {([['all', 'Any price'], ['top', 'Top tier'], ['mid', 'Lower budget']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTier(k)} className={`h-9 rounded-full px-4 text-[14px] transition-colors ${tier === k ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {!roster.ready && Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-[330px] animate-pulse rounded-[20px] bg-white/60" />)}
          {list.slice(0, limit).map((p, i) => (
            <motion.button key={p.id} onClick={() => setViewing(p.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: Math.min(i, 12) * 0.03, ease }}
              className="group flex flex-col overflow-hidden rounded-[20px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_30px_rgba(0,0,0,.06)] transition-transform duration-150 hover:-translate-y-0.5">
              <div className={`relative h-[230px] w-full overflow-hidden ${p.photo ? 'bg-neutral-200' : 'gs-talent-ph'}`}>
                {p.photo && <img src={p.photo} alt={p.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />}
                {p.tier === 'top' && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium">Top tier</span>}
                {p.availability && <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${p.availability === 'available' ? 'bg-emerald-600 text-white' : p.availability === 'hold' ? 'bg-amber-500 text-white' : 'bg-neutral-300 text-neutral-800'}`}>{p.availability === 'available' ? 'Available' : p.availability === 'hold' ? 'On hold' : 'Not free'}</span>}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <div className="truncate text-[15px] font-medium">{p.name}</div>
                <div className="truncate text-[12px] text-neutral-500">{ROLE_ONE[p.role]} · {p.agency ?? 'Your people'}</div>
                <div className="mt-auto flex items-baseline justify-between pt-2 text-[13px]">
                  <span className="tabular-nums">€{p.dayRate.toLocaleString('en-US')}<span className="text-[11px] text-neutral-500">/day{p.rateIsEstimate ? ' est.' : ''}</span></span>
                  <span className="text-[12px] text-neutral-500">{p.city}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {roster.ready && list.length === 0 && <p className="mt-10 text-center text-[15px] text-neutral-500">Nobody matches. Try another word, or add someone you work with.</p>}
        {list.length > limit && (
          <div className="mt-8 flex justify-center"><button onClick={() => setLimit((n) => n + 24)} className="h-11 rounded-full bg-white px-6 text-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)] hover:bg-neutral-50">Show more ({list.length - limit} left)</button></div>
        )}
      </div>

      {v && (
        <AgencyCall key={v.id} person={v} open onOpenChange={(o) => !o && setViewing(null)}
          onAnswer={async (ans) => {
            const { id: _i, createdAt: _c, ...data } = v;
            await fetch(`/api/people/${v.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(/^(tb|eu|sample)-/.test(v.id) ? { availability: ans } : { ...data, availability: ans }) });
            await roster.mutate();
            setViewing(null);
          }} />
      )}
      {adding && <QuickAdd key={adding} role={adding} city="Vilnius" open onOpenChange={(o) => !o && setAdding(null)} onAdded={async () => { await roster.mutate(); }} />}
    </Stage>
  );
}
