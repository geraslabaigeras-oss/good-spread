'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CreativeBrief } from '@/lib/types';
import { defaultDna, defaultLooks } from '@/lib/engine';
import { useDraft, thumb } from '@/lib/plan-store';
import { Stage, TopBar } from '@/components/glass/Stage';

const ease = [0.2, 0.8, 0.2, 1] as const;

export default function NewBrief() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (!draft) return <Stage><div /></Stage>;
  const d = draft;

  async function addFiles(list: FileList | File[]) {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/')).slice(0, 3);
    if (!imgs.length) return;
    setFiles(imgs);
    const thumbs = await Promise.all(imgs.map((f) => thumb(f, 900)));
    setDraft({ ...d, refImages: thumbs, brief: null });
    setEditing(false);
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
      const [r] = await Promise.all([fetch('/api/brief', { method: 'POST', body: fd }), new Promise((res) => setTimeout(res, 900))]);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setDraft({ ...d, brief: j.brief as CreativeBrief, briefVia: j.via, dnaPreserve: {} });
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  const b = editing ? null : d.brief;
  const dna = d.brief ? defaultDna(d.deliverables, d.brief, defaultLooks(d.brief.garment), []) : [];
  const keep = (id: string, def: boolean) => d.dnaPreserve[id] ?? def;
  const setDel = (k: keyof typeof d.deliverables, v: string | number) => setDraft({ ...d, deliverables: { ...d.deliverables, [k]: v } });

  return (
    <Stage backdrop={d.refImages[0]}>
      <TopBar step={1} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-8 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Reference */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <h1 className="font-serif text-[64px] leading-[0.95] tracking-[-0.03em]">
            Start with
            <br />
            <span className="text-grey-2">a reference.</span>
          </h1>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => input.current?.click()}
            className={`glass relative mt-8 aspect-[4/5] max-h-[68vh] cursor-pointer overflow-hidden transition-all duration-300 ${drag ? 'scale-[1.01] ring-2 ring-ink' : ''}`}
          >
            <AnimatePresence mode="popLayout">
              {d.refImages.length ? (
                <motion.div key={d.refImages[0].slice(-40)} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }} className={`grid h-full w-full gap-1 ${d.refImages.length > 1 ? 'grid-cols-2' : ''}`}>
                  {d.refImages.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`Reference ${i + 1}`} className={`h-full w-full object-cover ${d.refImages.length === 3 && i === 0 ? 'row-span-2' : ''}`} />
                  ))}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center p-10 text-center">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mb-6 flex size-20 items-center justify-center rounded-full border border-hairline-strong bg-white/60 text-3xl font-light">+</motion.div>
                  <div className="font-serif text-[30px] leading-8">Drop a campaign reference</div>
                  <div className="mt-2 text-[14px] text-grey-1">A moodboard, tear sheet or past campaign. Up to three images.</div>
                </motion.div>
              )}
            </AnimatePresence>
            {busy && (
              <div className="pointer-events-none absolute inset-0 bg-black/20">
                <div className="scanline" />
                <div className="absolute bottom-5 left-5 rounded-full bg-black/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur">Reading light, palette, styling…</div>
              </div>
            )}
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>
        </motion.div>

        {/* Inputs → Brief */}
        <div className="lg:pt-[150px]">
          <AnimatePresence mode="wait">
            {!b ? (
              <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.6, ease }} className="glass p-8">
                <div className="g-label">The job</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <F label="Campaign" span><input className="glass-input" value={d.title} onChange={(e) => setDraft({ ...d, title: e.target.value })} /></F>
                  <F label="Brand" span><input className="glass-input" value={d.brand} onChange={(e) => setDraft({ ...d, brand: e.target.value })} /></F>
                  <F label="Budget cap €"><input className="glass-input font-mono" type="number" value={d.cap} onChange={(e) => setDraft({ ...d, cap: Number(e.target.value) || 0 })} /></F>
                  <F label="Delivery deadline"><input className="glass-input font-mono" type="date" value={d.deliverables.deadlineISO} onChange={(e) => setDel('deadlineISO', e.target.value)} /></F>
                  <F label="Retouched stills"><input className="glass-input font-mono" type="number" value={d.deliverables.stills} onChange={(e) => setDel('stills', Number(e.target.value) || 0)} /></F>
                  <F label="Motion assets"><input className="glass-input font-mono" type="number" value={d.deliverables.motion} onChange={(e) => setDel('motion', Number(e.target.value) || 0)} /></F>
                  <F label="Usage"><input className="glass-input" value={d.deliverables.usage} onChange={(e) => setDel('usage', e.target.value)} /></F>
                  <F label="Usage months"><input className="glass-input font-mono" type="number" value={d.deliverables.usageMonths} onChange={(e) => setDel('usageMonths', Number(e.target.value) || 0)} /></F>
                  <F label="Notes for the AI" span><input className="glass-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="must feel like a Baltic autumn" /></F>
                </div>
                <button onClick={read} disabled={busy} className="g-btn mt-7 w-full">
                  {busy ? 'Reading the reference…' : files.length ? 'Read the reference' : 'Use the demo reference'}
                </button>
                {err && <p className="mt-3 text-[13px] text-[var(--g-bad)]">{err}</p>}
              </motion.div>
            ) : (
              <motion.div key="brief" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease }} className="glass p-8">
                <div className="flex items-center justify-between">
                  <span className="g-label">Creative brief · {d.briefVia === 'ai' ? 'read by AI' : d.briefVia === 'cache' ? 'read by AI · cached' : 'demo'}</span>
                  <button onClick={() => setEditing(true)} className="text-[12px] text-grey-1 underline underline-offset-4 hover:text-ink">Edit the job</button>
                </div>
                <motion.p initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.15 }} className="mt-4 font-serif text-[30px] leading-[1.15] tracking-[-0.01em]">
                  {b.summary}
                </motion.p>
                <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 font-serif text-[22px] text-grey-1">
                  {b.aesthetic.map((a, i) => (
                    <motion.span key={a} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                      {a}{i < b.aesthetic.length - 1 && <span className="ml-3 text-ink/20">/</span>}
                    </motion.span>
                  ))}
                </div>
                <div className="mt-6 flex h-16 overflow-hidden rounded-2xl">
                  {b.palette.map((c, i) => (
                    <motion.div key={c} initial={{ flexGrow: 0 }} animate={{ flexGrow: 1 }} transition={{ duration: 0.8, delay: 0.4 + i * 0.07, ease }} className="relative flex items-end p-2" style={{ background: b.paletteHex?.[i] ?? '#444', flexBasis: 0 }}>
                      <span className="font-mono text-[10px] uppercase tracking-wider mix-blend-difference">{c}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                  <Info k="Garment" v={b.garment} />
                  <Info k="Light" v={b.lighting} />
                  <Info k="Setting" v={`${b.setting} · ${b.settingNote}`} />
                  <Info k="Casting" v={b.casting} />
                  <Info k="Styling" v={b.styling} span />
                </div>
                <div className="mt-6">
                  <div className="g-label">Shot list</div>
                  <ol className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                    {b.shotList.map((s, i) => (
                      <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className="flex gap-3 text-[14px]">
                        <span className="font-mono text-grey-2">{String(i + 1).padStart(2, '0')}</span>{s}
                      </motion.li>
                    ))}
                  </ol>
                </div>

                <div className="mt-7 border-t border-hairline pt-6">
                  <div className="g-label">Production DNA · tap to move</div>
                  <LayoutGroup>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      {[true, false].map((col) => (
                        <div key={String(col)} className={`rounded-2xl p-3 ${col ? 'bg-white/70 shadow-[inset_0_0_0_1px_rgb(13_13_13/0.06)]' : 'border border-dashed border-hairline-strong'}`}>
                          <div className="mb-2 text-[12px] font-medium text-grey-1">{col ? 'Must keep' : 'Can change'}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {dna.filter((x) => keep(x.id, x.preserve) === col).map((x) => (
                              <motion.button
                                layout
                                layoutId={`dna-${x.id}`}
                                key={x.id}
                                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                                onClick={() => setDraft({ ...d, dnaPreserve: { ...d.dnaPreserve, [x.id]: !col } })}
                                className={`rounded-full px-3 py-1.5 text-[12px] ${col ? 'bg-ink text-white' : 'border border-hairline-strong text-ink hover:bg-white/70'}`}
                              >
                                {x.label}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </LayoutGroup>
                </div>
                <button onClick={() => router.push('/plan')} className="g-btn mt-7 w-full">See three ways to produce it →</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Stage>
  );
}

function F({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={`block ${span ? 'col-span-2' : ''}`}>
      <span className="g-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Info({ k, v, span }: { k: string; v: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <div className="g-label">{k}</div>
      <div className="mt-0.5 text-ink">{v}</div>
    </div>
  );
}
