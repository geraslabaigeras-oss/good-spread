'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CreativeBrief } from '@/lib/types';
import { defaultDna, defaultLooks } from '@/lib/engine';
import { useDraft, thumb } from '@/lib/plan-store';
import { Steps } from '@/components/plan/Steps';

export default function NewBrief() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (!draft) return null;
  const d = draft;

  async function addFiles(list: FileList | File[]) {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/')).slice(0, 3);
    if (!imgs.length) return;
    setFiles(imgs);
    const thumbs = await Promise.all(imgs.map((f) => thumb(f)));
    setDraft({ ...d, refImages: thumbs, brief: null });
  }

  async function read() {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('title', d.title);
      fd.set('brand', d.brand);
      fd.set('notes', notes);
      files.forEach((f) => fd.append('image', f));
      const r = await fetch('/api/brief', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setDraft({ ...d, brief: j.brief as CreativeBrief, briefVia: j.via, dnaPreserve: {} });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  const b = d.brief;
  const dna = b ? defaultDna(d.deliverables, b, defaultLooks(b.garment), []) : [];
  const preserve = (id: string, def: boolean) => d.dnaPreserve[id] ?? def;

  return (
    <div className="mx-auto min-h-dvh max-w-[1200px] px-6 py-6">
      <Steps step={1} />
      <h1 className="mt-6 font-serif text-[40px] leading-[44px]">One reference. Three ways to produce it.</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Reference drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => input.current?.click()}
          className={`flex min-h-[420px] cursor-pointer items-center justify-center rounded-[20px] border ${drag ? 'border-action bg-action-tint' : 'border-dashed border-hairline-strong'} p-3`}
        >
          {d.refImages.length ? (
            <div className={`grid h-full w-full gap-2 ${d.refImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {d.refImages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Reference ${i + 1}`} className="h-full max-h-[560px] w-full rounded-[10px] object-cover" />
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-[16px]">Drop a campaign reference</div>
              <div className="mt-1 text-[13px] text-grey-1">Moodboard, tear sheet or previous campaign · up to 3 images</div>
            </div>
          )}
          <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </div>

        {/* Brief inputs */}
        <div className="flex flex-col gap-3">
          <Field label="Campaign"><input value={d.title} onChange={(e) => setDraft({ ...d, title: e.target.value })} className={inp} /></Field>
          <Field label="Brand"><input value={d.brand} onChange={(e) => setDraft({ ...d, brand: e.target.value })} className={inp} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget cap (€)"><input type="number" value={d.cap} onChange={(e) => setDraft({ ...d, cap: Number(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Deadline"><input type="date" value={d.deliverables.deadlineISO} onChange={(e) => setDraft({ ...d, deliverables: { ...d.deliverables, deadlineISO: e.target.value } })} className={inp} /></Field>
            <Field label="Retouched stills"><input type="number" value={d.deliverables.stills} onChange={(e) => setDraft({ ...d, deliverables: { ...d.deliverables, stills: Number(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Motion assets"><input type="number" value={d.deliverables.motion} onChange={(e) => setDraft({ ...d, deliverables: { ...d.deliverables, motion: Number(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Usage (months)"><input type="number" value={d.deliverables.usageMonths} onChange={(e) => setDraft({ ...d, deliverables: { ...d.deliverables, usageMonths: Number(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Usage"><input value={d.deliverables.usage} onChange={(e) => setDraft({ ...d, deliverables: { ...d.deliverables, usage: e.target.value } })} className={inp} /></Field>
          </div>
          <Field label="Notes (optional)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inp} h-auto py-2`} placeholder="e.g. must feel like Baltic autumn" /></Field>
          <button onClick={read} disabled={busy} className="h-12 rounded-full bg-action text-[15px] font-medium text-white disabled:opacity-50">
            {busy ? 'Reading the reference…' : files.length ? 'Read the reference' : 'Use the demo brief'}
          </button>
          {err && <p className="text-[13px] text-conflict">{err}</p>}
        </div>
      </div>

      {b && (
        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-hairline pt-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="label">Creative brief · {d.briefVia === 'ai' ? 'read by AI' : d.briefVia === 'cache' ? 'read by AI (cached)' : 'demo brief'}</div>
            <p className="mt-2 font-serif text-[24px] leading-8">{b.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {b.aesthetic.map((a) => <span key={a} className="rounded-full border border-hairline-strong px-3 py-1 text-[13px]">{a}</span>)}
            </div>
            <div className="mt-4 flex gap-2">
              {b.palette.map((c, i) => (
                <div key={c} className="text-center">
                  <div className="h-10 w-14 rounded-[4px] border border-hairline" style={{ background: b.paletteHex?.[i] ?? '#ddd' }} />
                  <div className="mt-1 text-[11px] text-grey-1">{c}</div>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-1 text-[14px]">
              <dt className="text-grey-1">Garment</dt><dd>{b.garment}</dd>
              <dt className="text-grey-1">Light</dt><dd>{b.lighting}</dd>
              <dt className="text-grey-1">Setting</dt><dd>{b.setting} · {b.settingNote}</dd>
              <dt className="text-grey-1">Styling</dt><dd>{b.styling}</dd>
              <dt className="text-grey-1">Casting</dt><dd>{b.casting}</dd>
              <dt className="text-grey-1">Shots</dt><dd>{b.shotList.join(' · ')}</dd>
            </dl>
          </div>
          <div>
            <div className="label">Production DNA · click to move</div>
            <p className="mt-1 text-[13px] text-grey-1">What must survive any change, and what the engine may move to hit budget or time.</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[true, false].map((col) => (
                <div key={String(col)}>
                  <div className="mb-2 text-[13px] font-medium">{col ? 'Must keep' : 'Can change'}</div>
                  {dna.filter((x) => preserve(x.id, x.preserve) === col).map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setDraft({ ...d, dnaPreserve: { ...d.dnaPreserve, [x.id]: !col } })}
                      className="mb-1.5 block w-full rounded-[10px] border border-hairline px-3 py-2 text-left text-[13px] hover:border-ink"
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/plan')} className="mt-6 h-12 w-full rounded-full bg-ink text-[15px] font-medium text-paper">
              See three ways to produce it →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = 'h-10 w-full rounded-[10px] border border-hairline-strong bg-surface px-3 text-[14px]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-grey-1">{label}</span>
      {children}
    </label>
  );
}
