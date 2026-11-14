'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Link2, Loader2, Upload } from 'lucide-react';
import { CITIES, type City } from '@/data/catalog';
import { ROLE_LABEL, type RosterInput } from '@/lib/roster';
import type { LookAnalysis } from '@/lib/ai/look';
import { useDraft } from '@/lib/plan-store';
import { thumb } from '@/lib/plan-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Role = RosterInput['role'];
const RATE: Record<Role, string> = { model: '450', photographer: '700', mua: '350', stylist: '380' };

/** Add a real person straight into an empty slot. Saves to the roster, then hands back the new id. */
export function QuickAdd({ role, city, open, onOpenChange, onAdded }: { role: Role; city: City; open: boolean; onOpenChange: (o: boolean) => void; onAdded: (id: string, role: Role) => void | Promise<void> }) {
  const [f, setF] = useState({ name: '', city, dayRate: RATE[role], profileUrl: '', photo: '', agency: '' });
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [look, setLook] = useState<LookAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft] = useDraft();

  async function analyze(images: string[]) {
    if (!images.length) return;
    setAnalyzing(true);
    try {
      const b = draft?.brief;
      const r = await fetch('/api/people/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: images.slice(0, 6), role, brief: b ? `${b.summary} Look: ${b.aesthetic.join(', ')}. ${b.needs ? `Looking for: ${role === 'model' ? b.needs.model : role === 'photographer' ? b.needs.photographer : b.styling}` : ''}` : undefined }) });
      const j = await r.json();
      if (r.ok) setLook(j.analysis); else setNote('Could not analyse these images.');
    } finally {
      setAnalyzing(false);
    }
  }
  async function addShots(files: FileList | null) {
    if (!files?.length) return;
    const shots = await Promise.all([...files].slice(0, 6).map((f) => thumb(f, 900)));
    const next = [...gallery, ...shots].slice(0, 6);
    setGallery(next);
    if (!f.photo) set('photo', await thumb(files[0], 480));
    analyze(next);
  }
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function importLink() {
    setImporting(true);
    setNote(null);
    try {
      const r = await fetch('/api/people/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.profileUrl }) });
      const j = await r.json();
      if (!r.ok) {
        const slug = f.profileUrl.match(/models\.com\/models\/([a-z0-9-]+)/i)?.[1];
        if (slug) setF((x) => ({ ...x, name: x.name || slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') }));
        setNote(j.error === 'site_blocks_previews' ? 'This site does not let apps read it (models.com is one). Paste their agency page instead (models.com lists it), or drop screenshots of their pictures below.' : 'Could not read that page. Drop screenshots instead.');
        return;
      }
      setF((x) => ({ ...x, name: x.name || (j.title ?? '').split(/[|–-]/)[0].trim(), photo: x.photo || j.image || '', agency: x.agency || j.site || '' }));
      const imgs: string[] = (j.images ?? []).slice(0, 6);
      setGallery(imgs);
      analyze(imgs.length ? imgs : j.image ? [j.image] : []);
    } finally {
      setImporting(false);
    }
  }

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      const body: RosterInput = {
        name: f.name, role, city: f.city, dayRate: Number(f.dayRate) || 0,
        agency: f.agency || null, commissionPct: f.agency ? 20 : null,
        profileUrl: f.profileUrl || null, photo: f.photo || null,
        gallery: gallery.filter((g) => g.startsWith('https://')).slice(0, 8) || null, look,
      };
      const r = await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.issues?.[0] ?? j.error ?? 'Could not save');
      await onAdded(j.person.id, role);
      onOpenChange(false);
    } catch (x) {
      setNote(x instanceof Error ? x.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add {ROLE_LABEL[role].toLowerCase()}</SheetTitle>
          <SheetDescription>Someone you work with, or a profile link from their agency. They go straight into this slot. Only add people who agreed to it.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="qa-link">Link to their agency page, portfolio or website</Label>
            <div className="flex gap-2">
              <Input id="qa-link" type="url" value={f.profileUrl} onChange={(e) => set('profileUrl', e.target.value)} placeholder="https://…" />
              <Button variant="outline" disabled={!f.profileUrl || importing} onClick={importLink}>{importing ? <Loader2 className="animate-spin" /> : <Link2 />} Fill in</Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {f.photo ? <img src={f.photo} alt="" className="size-20 rounded-2xl object-cover object-top" /> : <span className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-400"><Upload className="size-5" /></span>}
            <label className="cursor-pointer text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900">
              {f.photo ? 'Change photo' : 'Upload a photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set('photo', await thumb(file, 480)); }} />
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qa-name">Name</Label>
            <Input id="qa-name" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qa-city">Based in</Label>
              <select id="qa-city" value={f.city} onChange={(e) => set('city', e.target.value as City)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-rate">Day rate (€)</Label>
              <Input id="qa-rate" inputMode="numeric" value={f.dayRate} onChange={(e) => set('dayRate', e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addShots(e.dataTransfer.files); }} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 px-4 py-5 text-center text-sm text-neutral-600 hover:border-neutral-500">
            Drop screenshots of their work or pictures
            <span className="text-xs text-neutral-400">Instagram, models.com, a portfolio: anything you can screenshot</span>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => addShots(e.target.files)} />
          </label>
          {gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">{gallery.map((g) => <img key={g.slice(-40)} src={g} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover" />)}</div>
          )}
          {analyzing && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="size-4 animate-spin" /> Reading {role === 'model' ? 'their look' : 'their style'}…</p>}
          {look && !analyzing && (
            <div className="rounded-2xl bg-[#f3f6fa] p-4">
              <div className="text-[13px] text-neutral-500">{role === 'model' ? 'Their look' : 'Their style'}</div>
              <p className="mt-1 text-[15px] leading-6">{look.look}</p>
              <p className="mt-1 text-[13px] text-neutral-600">{look.hair}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{[...look.vibe, ...look.bookShows].slice(0, 7).map((v) => <span key={v} className="rounded-full bg-white px-2.5 py-0.5 text-[12px]">{v}</span>)}</div>
              {look.fitNotes && <p className="mt-3 text-[13px] leading-5 text-neutral-800">{look.fitNotes}</p>}
            </div>
          )}
          {note && <p className="text-sm text-amber-700">{note}</p>}
        </div>
        <SheetFooter>
          <Button disabled={!f.name.trim() || busy} onClick={save} className="h-11 rounded-full">{busy ? <Loader2 className="animate-spin" /> : null} Add to the team</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
