'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Link2, Loader2, Upload } from 'lucide-react';
import { CITIES, type City } from '@/data/catalog';
import { ROLE_LABEL, type RosterInput } from '@/lib/roster';
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
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function importLink() {
    setImporting(true);
    setNote(null);
    try {
      const r = await fetch('/api/people/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.profileUrl }) });
      const j = await r.json();
      if (!r.ok) { setNote(j.error === 'site_blocks_previews' ? 'This site blocks link previews. Upload their photo instead.' : 'Could not read that page.'); return; }
      setF((x) => ({ ...x, name: x.name || (j.title ?? '').split(/[|–-]/)[0].trim(), photo: x.photo || j.image || '', agency: x.agency || j.site || '' }));
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
            <Label htmlFor="qa-link">Profile link (optional)</Label>
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
          {note && <p className="text-sm text-red-600">{note}</p>}
        </div>
        <SheetFooter>
          <Button disabled={!f.name.trim() || busy} onClick={save} className="h-11 rounded-full">{busy ? <Loader2 className="animate-spin" /> : null} Add to the team</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
