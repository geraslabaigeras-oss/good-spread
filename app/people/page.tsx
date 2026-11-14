'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Check, Link2, Loader2, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { CITIES, type City } from '@/data/catalog';
import { availabilityText, imessageLink, modelsComSearch, ROLE_LABEL, whatsappLink, type RosterInput, type RosterPerson } from '@/lib/roster';
import { useRoster } from '@/lib/use-roster';
import { thumb } from '@/lib/plan-store';
import { BrandLogo } from '@/components/brand-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AGENCIES } from '@/lib/agencies';
import { useDraft } from '@/lib/plan-store';
import type { LookAnalysis } from '@/lib/ai/look';

type Role = RosterInput['role'];
const ROLES: Role[] = ['model', 'photographer', 'mua', 'stylist'];
const empty = { name: '', role: 'model' as Role, city: 'Vilnius' as City, dayRate: '', agency: '', commissionPct: '', phone: '', profileUrl: '', photo: '' };
const select = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

export default function People() {
  const { people, ready, mutate } = useRoster();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [findCity, setFindCity] = useState<City>('Vilnius');
  const [filter, setFilter] = useState<string>('all');
  const [found, setFound] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [look, setLook] = useState<LookAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft] = useDraft();
  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function importLink() {
    if (!f.profileUrl) return;
    setImporting(true);
    setNote(null);
    try {
      const r = await fetch('/api/people/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.profileUrl }) });
      const j = await r.json();
      if (!r.ok) {
        setNote(j.error === 'site_blocks_previews' ? 'This site blocks link previews (models.com does). Save their photo and upload it instead.' : 'Could not read that page.');
        return;
      }
      setF((x) => ({ ...x, name: x.name || (j.title ?? '').split(/[|–-]/)[0].trim(), photo: x.photo || j.image || '', agency: x.agency || j.site || '' }));
      setFound(j.images ?? []);
      setGallery((j.images ?? []).slice(0, 6));
      setNote(j.images?.length ? `Imported from ${j.site}. ${j.images.length} images found: tap to keep or drop, double-tap to make one the main photo.` : `Imported from ${j.site}. No images on that page; upload a photo instead.`);
    } finally {
      setImporting(false);
    }
  }

  async function analyze() {
    const images = (gallery.length ? gallery : f.photo ? [f.photo] : []).slice(0, 6);
    if (!images.length) return;
    setAnalyzing(true);
    try {
      const b = draft?.brief;
      const brief = b ? `${b.summary} Look: ${b.aesthetic.join(', ')}. Casting: ${b.casting}. Palette: ${b.palette.join(', ')}.` : undefined;
      const r = await fetch('/api/people/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images, brief }) });
      const j = await r.json();
      if (!r.ok) { setNote(j.error === 'anthropic_not_configured' ? 'Add ANTHROPIC_API_KEY to analyse looks.' : 'Could not analyse these images.'); return; }
      setLook(j.analysis);
    } finally {
      setAnalyzing(false);
    }
  }

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const body: RosterInput = {
        name: f.name, role: f.role, city: f.city, dayRate: Number(f.dayRate) || 0,
        agency: f.agency || null, commissionPct: f.agency ? Number(f.commissionPct) || 20 : null,
        phone: f.phone || null, profileUrl: f.profileUrl || null, photo: f.photo || null,
        gallery: gallery.length ? gallery : null, look,
      };
      const r = await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.issues?.[0] ?? j.error ?? 'Could not save');
      setF({ ...empty, role: f.role, city: f.city });
      setNote(null);
      setFound([]);
      setGallery([]);
      setLook(null);
      setOpen(false);
      await mutate();
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this person?')) return;
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    await mutate();
  }

  const shown = people.filter((p) => filter === 'all' || p.role === filter);

  return (
    <div className="relative min-h-dvh bg-[linear-gradient(180deg,#f3f2ee_0%,#eceeed_50%,#d9e0e4_100%)] text-neutral-900">
      <svg aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.1] mix-blend-overlay">
        <filter id="pgrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#pgrain)" />
      </svg>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 text-sm">
          <Link href="/" className="font-medium">good spread</Link>
          <nav className="flex items-center gap-6 text-neutral-500">
            <Link href="/new" className="hover:text-neutral-900">New shoot</Link>
            <span className="text-neutral-900">People</span>
          </nav>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-5xl px-6 pb-24 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">People</h1>
            <p className="mt-2 text-neutral-500">The models and crew you book. Plans use only the people here.</p>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setOpen(true)}><Plus /> Add person</Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(String(v))}>
            <TabsList>
              <TabsTrigger value="all">All {people.length}</TabsTrigger>
              {ROLES.map((r) => <TabsTrigger key={r} value={r}>{ROLE_LABEL[r]} {people.filter((p) => p.role === r).length}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <select value={findCity} onChange={(e) => setFindCity(e.target.value as City)} className={`${select} !w-36 bg-white`}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Button variant="outline" className="bg-white" render={<a href={modelsComSearch(findCity, 'models agency')} target="_blank" rel="noreferrer" />} nativeButton={false}>
              <Search /> Find on models.com
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 text-neutral-500">Agencies</span>
          {AGENCIES.map((ag) => (
            <a key={ag.name} href={ag.url} target="_blank" rel="noreferrer" title={ag.cities} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-neutral-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] transition-colors hover:bg-white hover:text-neutral-950">
              {ag.name} <ArrowUpRight className="size-3" />
            </a>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7),0_18px_48px_rgba(80,60,40,.06)] backdrop-blur-xl">
          {ready && !shown.length && (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <p className="text-lg font-medium">No one here yet</p>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">Add the people you work with, or paste a model&rsquo;s agency profile link to import them.</p>
              <Button className="mt-6 rounded-full" onClick={() => setOpen(true)}><Plus /> Add person</Button>
            </div>
          )}
          {shown.map((p, i) => <Row key={p.id} p={p} last={i === shown.length - 1} onRemove={() => remove(p.id)} />)}
        </div>
      </main>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add person</SheetTitle>
            <SheetDescription>Paste an agency profile link to fill this in, or type it yourself. Only add people who agreed to it.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4">
            <div className="space-y-2">
              <Label htmlFor="link">Profile link</Label>
              <div className="flex gap-2">
                <Input id="link" type="url" value={f.profileUrl} onChange={(e) => set('profileUrl', e.target.value)} placeholder="https://agency.com/models/…" />
                <Button variant="outline" disabled={!f.profileUrl || importing} onClick={importLink}>{importing ? <Loader2 className="animate-spin" /> : <Link2 />} Import</Button>
              </div>
              {note && <p className="text-xs text-neutral-500">{note}</p>}
            </div>
            {found.length > 0 && (
              <div className="space-y-2">
                <Label>Polaroids and portfolio</Label>
                <div className="grid grid-cols-4 gap-2">
                  {found.map((src) => {
                    const on = gallery.includes(src);
                    return (
                      <button key={src} type="button" onClick={() => setGallery((g) => (on ? g.filter((x) => x !== src) : [...g, src].slice(0, 8)))} onDoubleClick={() => set('photo', src)}
                        className={`relative aspect-[3/4] overflow-hidden rounded-lg ${on ? 'ring-2 ring-neutral-900' : 'opacity-50'}`}>
                        <img src={src} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                        {f.photo === src && <span className="absolute left-1 top-1 rounded-full bg-white px-1.5 text-[10px] font-medium">Main</span>}
                        {on && <Check className="absolute bottom-1 right-1 size-4 rounded-full bg-neutral-900 p-0.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {(gallery.length > 0 || f.photo) && (
              <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
                <Button variant="outline" className="w-full bg-white" disabled={analyzing} onClick={analyze}>
                  {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />} {look ? 'Analyse again' : draft?.brief ? 'Analyse look against your brief' : 'Analyse look'}
                </Button>
                {look && (
                  <div className="space-y-2 text-sm">
                    <p>{look.look}</p>
                    <p className="text-neutral-500">Hair: {look.hair}</p>
                    <div className="flex flex-wrap gap-1.5">{[...look.vibe, ...look.features].map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}</div>
                    {look.bookShows.length > 0 && <p className="text-neutral-500">Book shows: {look.bookShows.join(', ')}</p>}
                    {look.fitNotes && <p className="rounded-lg bg-white p-3 text-neutral-700">{look.fitNotes}</p>}
                  </div>
                )}
              </div>
            )}
            <Separator />
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <Avatar className="size-20">
                  {f.photo ? <AvatarImage src={f.photo} className="object-cover object-top" /> : null}
                  <AvatarFallback className="bg-neutral-100 text-neutral-400"><Upload className="size-5" /></AvatarFallback>
                </Avatar>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set('photo', await thumb(file, 480)); }} />
              </label>
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={f.role} onChange={(e) => set('role', e.target.value as Role)} className={select}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
              </div>
              <div className="space-y-2">
                <Label>Based in</Label>
                <select value={f.city} onChange={(e) => set('city', e.target.value as City)} className={select}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2"><Label htmlFor="agency">Agency</Label><Input id="agency" value={f.agency} onChange={(e) => set('agency', e.target.value)} placeholder="Optional" /></div>
              <div className="space-y-2"><Label htmlFor="fee">Fee %</Label><Input id="fee" inputMode="numeric" disabled={!f.agency} value={f.commissionPct} onChange={(e) => set('commissionPct', e.target.value.replace(/[^0-9]/g, ''))} placeholder="20" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="rate">Day rate (€)</Label><Input id="rate" inputMode="numeric" value={f.dayRate} onChange={(e) => set('dayRate', e.target.value.replace(/[^0-9]/g, ''))} placeholder="450" /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+370 612 34567" /></div>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
          <SheetFooter>
            <Button size="lg" className="rounded-full" disabled={busy || !f.name || !f.dayRate} onClick={add}>{busy ? 'Saving…' : 'Add person'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ p, last, onRemove }: { p: RosterPerson; last: boolean; onRemove: () => void }) {
  const text = availabilityText(p.name.split(' ')[0], ROLE_LABEL[p.role]);
  return (
    <div className={`group flex items-center gap-4 px-5 py-4 ${last ? '' : 'border-b border-black/5'}`}>
      <Avatar className="size-12">
        {p.photo ? <AvatarImage src={p.photo} className="object-cover object-top" /> : null}
        <AvatarFallback>{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{p.name}</span>
          {p.agency && <Badge variant="secondary" className="font-normal">{p.agency}{p.commissionPct ? ` · ${p.commissionPct}%` : ''}</Badge>}
        </div>
        <div className="text-sm text-neutral-500">{ROLE_LABEL[p.role]} · {p.city} · €{p.dayRate}/day</div>
        {p.look && <div className="mt-1 truncate text-xs text-neutral-500">{[...p.look.vibe, ...p.look.bookShows].join(' · ')}</div>}
        {p.gallery && p.gallery.length > 1 && (
          <div className="mt-2 flex gap-1">{p.gallery.slice(0, 6).map((g) => <img key={g} src={g} alt="" referrerPolicy="no-referrer" className="h-12 w-9 rounded object-cover" />)}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {p.phone && (
          <>
            <Button size="sm" className="rounded-full bg-[#25D366] text-white hover:bg-[#1fb957]" render={<a href={whatsappLink(p.phone, text)} target="_blank" rel="noreferrer" />} nativeButton={false}>
              <BrandLogo name="whatsapp" size={14} color="#fff" /> WhatsApp
            </Button>
            <Button size="sm" className="rounded-full bg-[#34DA50] text-white hover:bg-[#2cc446]" render={<a href={imessageLink(p.phone, text)} />} nativeButton={false}>
              <BrandLogo name="imessage" size={14} color="#fff" /> iMessage
            </Button>
          </>
        )}
        {p.profileUrl && (
          <Button size="sm" variant="ghost" className="rounded-full" render={<a href={p.profileUrl} target="_blank" rel="noreferrer" />} nativeButton={false}>Profile <ArrowUpRight /></Button>
        )}
        <Button size="icon-sm" variant="ghost" aria-label={`Remove ${p.name}`} className="text-neutral-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100" onClick={onRemove}><Trash2 /></Button>
      </div>
    </div>
  );
}
