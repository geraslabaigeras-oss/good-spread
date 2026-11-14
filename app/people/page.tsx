'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ArrowUpRight, Search, Trash2, Upload } from 'lucide-react';
import { CITIES, type City } from '@/data/catalog';
import { availabilityText, imessageLink, modelsComSearch, ROLE_LABEL, whatsappLink, type RosterInput, type RosterPerson } from '@/lib/roster';
import { useRoster } from '@/lib/use-roster';
import { thumb } from '@/lib/plan-store';
import { BrandLogo } from '@/components/brand-logo';
import { Stage, TopBar } from '@/components/glass/Stage';

type Role = RosterInput['role'];
const ROLES: Role[] = ['model', 'photographer', 'mua', 'stylist'];
const ease = [0.16, 1, 0.3, 1] as const;

const empty = { name: '', role: 'model' as Role, city: 'Vilnius' as City, dayRate: '', agency: '', commissionPct: '', phone: '', profileUrl: '', photo: '' };

export default function People() {
  const { people, ready, mutate } = useRoster();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [findCity, setFindCity] = useState<City>('Vilnius');
  const [filter, setFilter] = useState<Role | 'all'>('all');

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body: RosterInput = {
        name: f.name, role: f.role, city: f.city, dayRate: Number(f.dayRate) || 0,
        agency: f.agency || null, commissionPct: f.agency ? Number(f.commissionPct) || 20 : null,
        phone: f.phone || null, profileUrl: f.profileUrl || null, photo: f.photo || null,
      };
      const r = await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.issues?.[0] ?? j.error ?? 'Could not save');
      setF({ ...empty, role: f.role, city: f.city });
      await mutate();
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this person from your people?')) return;
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    await mutate();
  }

  const shown = people.filter((p) => filter === 'all' || p.role === filter);

  return (
    <Stage>
      <TopBar step={0} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-8 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <h1 className="font-serif text-[56px] leading-[0.95] tracking-[-0.03em]">Your people</h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-grey-1">
            The models, photographers and crew you actually work with. Plans, call sheets and budgets use only the people here.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {(['all', ...ROLES] as const).map((r) => (
              <button key={r} onClick={() => setFilter(r)} className={`h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${filter === r ? 'bg-ink text-white' : 'bg-white/60 text-grey-1 shadow-[inset_0_0_0_1px_rgb(13_13_13/0.08)] hover:text-ink'}`}>
                {r === 'all' ? `All ${people.length}` : `${ROLE_LABEL[r]} ${people.filter((p) => p.role === r).length}`}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {shown.map((p) => <PersonCard key={p.id} p={p} onRemove={() => remove(p.id)} />)}
            </AnimatePresence>
            {ready && !shown.length && (
              <div className="col-span-full rounded-[20px] border border-dashed border-hairline-strong px-6 py-14 text-center text-[15px] text-grey-1">
                No one here yet. Add the first person on the right.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* find real models */}
          <div className="glass p-6">
            <div className="g-label">Find models</div>
            <p className="mt-2 text-[14px] leading-5 text-grey-1">Search models.com for models and agencies in a city. Add them here once they agree.</p>
            <div className="mt-4 flex gap-2">
              <select value={findCity} onChange={(e) => setFindCity(e.target.value as City)} className="glass-input !w-auto flex-1">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <a href={modelsComSearch(findCity, 'models agency')} target="_blank" rel="noreferrer" className="g-btn !h-[46px] !px-5">
                <Search size={16} strokeWidth={1.75} /> models.com
              </a>
            </div>
          </div>

          {/* add a person */}
          <form onSubmit={add} className="glass space-y-3 p-6">
            <div className="g-label">Add a person</div>
            <div className="flex gap-3">
              <label className="relative flex size-[92px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[16px] bg-white/70 text-grey-1 shadow-[inset_0_0_0_1px_rgb(13_13_13/0.08)]">
                {f.photo ? <img src={f.photo} alt="" className="size-full object-cover object-top" /> : <Upload size={20} strokeWidth={1.5} />}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set('photo', await thumb(file, 480)); }} />
              </label>
              <div className="flex-1 space-y-2">
                <input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className="glass-input" />
                <select value={f.role} onChange={(e) => set('role', e.target.value as Role)} className="glass-input">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={f.city} onChange={(e) => set('city', e.target.value as City)} className="glass-input">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input required inputMode="numeric" value={f.dayRate} onChange={(e) => set('dayRate', e.target.value.replace(/[^0-9]/g, ''))} placeholder="Day rate €" className="glass-input" />
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <input value={f.agency} onChange={(e) => set('agency', e.target.value)} placeholder="Agency (optional)" className="glass-input" />
              <input inputMode="numeric" disabled={!f.agency} value={f.commissionPct} onChange={(e) => set('commissionPct', e.target.value.replace(/[^0-9]/g, ''))} placeholder="Fee %" className="glass-input disabled:opacity-40" />
            </div>
            <input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone, e.g. +370 612 34567" className="glass-input" />
            <input type="url" value={f.profileUrl} onChange={(e) => set('profileUrl', e.target.value)} placeholder="models.com or agency profile link" className="glass-input" />
            {err && <p className="text-[13px] text-conflict">{err}</p>}
            <button disabled={busy || !f.name || !f.dayRate} className="g-btn w-full">{busy ? 'Saving…' : 'Add person'}</button>
            <p className="text-[12px] leading-4 text-grey-2">Only add people who agreed to it. Photos are stored with your plans.</p>
          </form>
        </div>
      </div>
    </Stage>
  );
}

function PersonCard({ p, onRemove }: { p: RosterPerson; onRemove: () => void }) {
  const text = availabilityText(p.name.split(' ')[0], ROLE_LABEL[p.role]);
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease }}
      className="group overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_rgb(80_60_40/0.05)]">
      <div className="relative aspect-[4/3] bg-[#ece7df]">
        {p.photo ? <img src={p.photo} alt="" className="size-full object-cover object-top" /> : <span className="absolute inset-0 flex items-center justify-center font-serif text-[64px] text-grey-2">{p.name[0]}</span>}
        <button onClick={onRemove} aria-label={`Remove ${p.name}`} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/85 text-grey-1 opacity-0 transition-opacity hover:text-conflict group-hover:opacity-100">
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
        {p.agency && <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium">{p.agency}</span>}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-serif text-[22px] leading-7">{p.name}</span>
          <span className="shrink-0 text-[13px] num">€{p.dayRate}/day</span>
        </div>
        <div className="text-[13px] text-grey-1">{ROLE_LABEL[p.role]} · {p.city}{p.agency ? ` · ${p.commissionPct ?? 20}% fee` : ''}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.phone && (
            <>
              <a href={whatsappLink(p.phone, text)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-[12px] font-medium text-white"><BrandLogo name="whatsapp" size={14} color="#fff" /> WhatsApp</a>
              <a href={imessageLink(p.phone, text)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#34DA50] px-3 text-[12px] font-medium text-white"><BrandLogo name="imessage" size={14} color="#fff" /> iMessage</a>
            </>
          )}
          {p.profileUrl && (
            <a href={p.profileUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-medium text-grey-1 shadow-[inset_0_0_0_1px_rgb(13_13_13/0.14)] hover:text-ink">Profile <ArrowUpRight size={12} /></a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
