'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CreativeBrief } from '@/lib/types';
import { defaultDna, defaultLooks } from '@/lib/engine';
import { useDraft, thumb } from '@/lib/plan-store';
import { VoiceBrief } from '@/components/voice';
import { Marquee } from '@/components/ui/marquee';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisStage } from '@/components/analysis-stage';

// Free Unsplash-licensed editorial photos to start from.
const REFS = ['photo-1550872199-63f4382fe925', 'photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1508964801641-4b2410705b73', 'photo-1590972381381-c863cbbf9dd2', 'photo-1635262090780-2ed9e994fff4', 'photo-1603189343302-e603f7add05a', 'photo-1733322980454-62a1d5727460', 'photo-1739808914849-01ba195c4f93', 'photo-1645561305502-63a9ba09ab09'];
const daysUntil = (from: string, to: string) => Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000));
const addDaysISO = (from: string, n: number) => new Date(Date.parse(from) + n * 86_400_000).toISOString().slice(0, 10);
function Dial({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between"><span className="text-[14px] text-grey-1">{label}</span><span className="font-serif text-[26px] leading-none tabular-nums">{value}</span></div>
      {children}
    </div>
  );
}
const refUrl = (id: string, w: number) => `https://images.unsplash.com/${id}?fm=jpg&q=70&w=${w}&auto=format&fit=crop`;
import { Scout } from '@/components/scout';
import { BriefOptions } from '@/components/brief-options';
import { ShootDate } from '@/components/shoot-date';
import DEMO_READ from '@/data/demo-brief.json';
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
  const [more, setMore] = useState(false);
  const [stage, setStage] = useState<{ image: string; brief: CreativeBrief | null } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Guided demo (?demo=1): the references were read once already; show the reading, then the brief.
  useEffect(() => {
    if (!draft || draft.brief || typeof window === 'undefined' || !window.location.search.includes('demo=1')) return;
    window.history.replaceState(null, '', '/new');
    setStage({ image: draft.refImages[0], brief: null });
    const t = setTimeout(() => {
      const b = { ...(DEMO_READ as unknown as CreativeBrief), title: draft.title, brand: draft.brand, source: 'cache' as const };
      setStage({ image: draft.refImages[0], brief: b });
      setDraft({ ...draft, brief: b, briefVia: 'cache', dnaPreserve: {} });
    }, 3800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.refImages?.[0]]);

  // Arriving from the hero drop (?auto=1): read the stored reference straight away.
  useEffect(() => {
    if (!draft || draft.brief || !draft.refImages[0] || typeof window === 'undefined' || !window.location.search.includes('auto=1')) return;
    window.history.replaceState(null, '', '/new');
    Promise.all(draft.refImages.map((src, i) => fetch(src).then((r) => r.blob()).then((blob) => new File([blob], `reference-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' })))).then((fs) => {
      setFiles(fs);
      read(fs, draft.refImages);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  if (!draft) return <Stage><div /></Stage>;
  const d = draft;

  async function addFiles(list: FileList | File[]) {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/')).slice(0, 6);
    if (!imgs.length) return;
    setFiles(imgs);
    const thumbs = await Promise.all(imgs.map((f) => thumb(f, 900)));
    setDraft({ ...d, refImages: thumbs, brief: null });
    setEditing(false);
    await read(imgs, thumbs);
  }

  /** Use a ready-made reference photo: fetch it, then read it like a dropped file. */
  async function pick(url: string) {
    const blob = await fetch(url).then((r) => r.blob());
    await addFiles([new File([blob], 'reference.jpg', { type: blob.type || 'image/jpeg' })]);
  }

  async function read(useFiles: File[] = files, thumbs: string[] = d.refImages) {
    setBusy(true);
    setErr(null);
    if (thumbs[0]) setStage({ image: thumbs[0], brief: null });
    try {
      const fd = new FormData();
      fd.set('title', d.title || 'Untitled campaign');
      fd.set('brand', d.brand);
      fd.set('notes', notes);
      useFiles.forEach((f) => fd.append('image', f));
      const [r] = await Promise.all([fetch('/api/brief', { method: 'POST', body: fd }), new Promise((res) => setTimeout(res, 900))]);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setDraft({ ...d, refImages: thumbs, brief: j.brief as CreativeBrief, briefVia: j.via, dnaPreserve: {} });
      setStage((st) => (st ? { ...st, brief: j.brief as CreativeBrief } : st));
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
      setStage(null);
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
      <AnimatePresence>{stage && <AnalysisStage key="stage" image={stage.image} brief={stage.brief} onDone={() => setStage(null)} />}</AnimatePresence>
      <div className={`mx-auto grid gap-8 px-8 pb-16 pt-8 ${b ? 'max-w-[760px] grid-cols-1' : 'max-w-[1400px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]'}`}>
        {/* Reference */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className={b ? 'hidden' : ''}>
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
                  <div className="mt-2 text-[14px] text-grey-1">A moodboard, tear sheets or past campaigns. Up to six images.</div>
                </motion.div>
              )}
            </AnimatePresence>
            {busy && (
              <div className="pointer-events-none absolute inset-0 bg-black/20">
                <div className="scanline" />
                <div className="absolute bottom-5 left-5 rounded-full bg-black/50 px-3 py-1.5 font-mono text-[11px] backdrop-blur">Reading light, palette, styling…</div>
              </div>
            )}
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-[13px] text-grey-1">Or start from one of these</p>
            <Marquee pauseOnHover className="[--duration:40s] [--gap:0.75rem] p-0">
              {REFS.map((id) => (
                <button key={id} disabled={busy} onClick={() => pick(refUrl(id, 1200))} className="group relative h-28 w-[88px] shrink-0 overflow-hidden rounded-[14px] transition-transform hover:-translate-y-1 disabled:opacity-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refUrl(id, 240)} alt="Reference option" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              ))}
            </Marquee>
          </div>
        </motion.div>

        {/* Inputs → Brief */}
        <div className={b ? '' : 'lg:pt-[150px]'}>
          <AnimatePresence mode="wait">
            {!b ? (
              <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.6, ease }} className="glass p-8">
                <input aria-label="Campaign name" className="w-full bg-transparent font-serif text-[34px] leading-tight tracking-[-0.01em] outline-none placeholder:text-grey-2" value={d.title} onChange={(e) => setDraft({ ...d, title: e.target.value })} placeholder="Name the campaign" />
                <p className="mt-1 text-[13px] text-grey-1">Drop a reference or pick one. Set the size of the job here.</p>
                <div className="mt-6"><ShootDate value={d.shootISO} days={d.shootDays} fallbackISO={addDaysISO(d.startISO, 7)} onChange={(iso, n) => setDraft({ ...d, shootISO: iso, shootDays: n })} /></div>
                <div className="mt-7 space-y-6">
                  <Dial label="Budget cap" value={`€${d.cap.toLocaleString('en-US')}`}>
                    <Slider value={[d.cap]} min={1000} max={20000} step={250} onValueChange={(v) => setDraft({ ...d, cap: Array.isArray(v) ? v[0] : v })} />
                  </Dial>
                  <Dial label="Retouched stills" value={String(d.deliverables.stills)}>
                    <Slider value={[d.deliverables.stills]} min={2} max={40} step={1} onValueChange={(v) => setDel('stills', Array.isArray(v) ? v[0] : v)} />
                  </Dial>
                  <Dial label="Motion clips" value={String(d.deliverables.motion)}>
                    <Slider value={[d.deliverables.motion]} min={0} max={8} step={1} onValueChange={(v) => setDel('motion', Array.isArray(v) ? v[0] : v)} />
                  </Dial>
                  <Dial label="Delivered in" value={`${daysUntil(d.startISO, d.deliverables.deadlineISO)} days`}>
                    <Slider value={[daysUntil(d.startISO, d.deliverables.deadlineISO)]} min={5} max={45} step={1} onValueChange={(v) => setDel('deadlineISO', addDaysISO(d.startISO, Array.isArray(v) ? v[0] : v))} />
                  </Dial>
                </div>
                <div className="mt-7"><VoiceBrief onText={(t) => setNotes((n) => (n ? `${n} ${t}` : t).slice(0, 1000))} />{notes && <p className="mt-2 text-[13px] text-grey-1">&ldquo;{notes}&rdquo;</p>}</div>
                <button onClick={() => read()} disabled={busy || !files.length} className="g-btn mt-7 w-full">
                  {busy ? 'Reading the reference…' : files.length ? 'Read the reference' : 'Pick or drop a reference to start'}
                </button>
                {err && <p className="mt-3 text-[13px] text-[var(--g-bad)]">{err}</p>}
              </motion.div>
            ) : (
              <motion.div key="brief" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease }} className="glass p-8">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-500">{d.briefVia === 'ai' || d.briefVia === 'cache' ? `Read from ${d.refImages.length} reference${d.refImages.length > 1 ? 's' : ''}` : 'Example brief'}</span>
                  <button onClick={() => setEditing(true)} className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-950">Change references</button>
                </div>
                {/* the references, each tagged with what it was read for */}
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {d.refImages.slice(0, 6).map((src, i) => {
                    const r = b.references?.find((x) => x.index === i + 1);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5, ease }} className="relative h-44 w-[132px] shrink-0 overflow-hidden rounded-2xl" title={r?.note}>
                        <img src={src} alt={`Reference ${i + 1}`} className="size-full object-cover" />
                        {r && <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] capitalize text-neutral-900">{r.usedFor}</span>}
                      </motion.div>
                    );
                  })}
                </div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="mt-6 text-[32px] font-light leading-[1.15] tracking-[-0.02em]">
                  {b.summary.split(/(?<=\.)\s/)[0]}
                </motion.p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.aesthetic.map((a) => <span key={a} className="rounded-full bg-white px-3 py-1 text-[13px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">{a}</span>)}
                </div>
                <div className="mt-6 flex h-14 overflow-hidden rounded-2xl">
                  {b.palette.map((c, i) => (
                    <motion.div key={c} initial={{ flexGrow: 0 }} animate={{ flexGrow: 1 }} transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease }} title={c} style={{ background: b.paletteHex?.[i] ?? '#444', flexBasis: 0 }} />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {b.palette.map((c, i) => (
                    <span key={c} className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600"><span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: b.paletteHex?.[i] ?? '#444' }} />{c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}</span>
                  ))}
                </div>
                {b.needs && (
                  <div className="mt-7 space-y-3">
                    {([['Model', b.needs.model], ['Photographer', b.needs.photographer], ['Location', b.needs.location]] as const).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-4">
                        <span className="w-[104px] shrink-0 pt-1 text-[13px] text-neutral-500">{k}</span>
                        <span className="flex flex-wrap gap-1.5">{v.split(/,\s*/).filter(Boolean).slice(0, 5).map((w) => <span key={w} className="rounded-full bg-neutral-950/[0.05] px-3 py-1 text-[13px] text-neutral-900">{w}</span>)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setMore((x) => !x)} className="mt-7 text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-950">{more ? 'Fewer details' : 'More details: shots, light, styling'}</button>
                {more && <>
                <Tabs defaultValue="shots" className="mt-7">
                  <TabsList className="w-full">
                    <TabsTrigger value="shots">Shots</TabsTrigger>
                    <TabsTrigger value="dna">Keep &amp; change</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  <TabsContent value="shots" className="pt-3">
                  <ol className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                    {b.shotList.map((s, i) => (
                      <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className="flex gap-3 text-[14px]">
                        <span className="font-mono text-grey-2">{String(i + 1).padStart(2, '0')}</span>{s}
                      </motion.li>
                    ))}
                  </ol>
                  </TabsContent>
                  <TabsContent value="dna" className="pt-3">
                  <p className="text-[13px] text-grey-1">Tap to move between must keep and can change.</p>
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
                  </TabsContent>
                  <TabsContent value="details" className="pt-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                  <Info k="Garment" v={b.garment} />
                  <Info k="Light" v={b.lighting} />
                  <Info k="Setting" v={`${b.setting} · ${b.settingNote}`} />
                  <Info k="Casting" v={b.casting} />
                  <Info k="Styling" v={b.styling} span />
                </div>
                  </TabsContent>
                </Tabs>
                </>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {b && (
        <div className="mx-auto max-w-[1200px] px-8 pb-24">
          <div className="flex flex-wrap items-center gap-3">
            <ShootDate value={d.shootISO} days={d.shootDays} fallbackISO={addDaysISO(d.startISO, 7)} onChange={(iso, n) => setDraft({ ...d, shootISO: iso, shootDays: n })} />
            <span className="text-[14px] text-neutral-500">Budget cap {`€${d.cap.toLocaleString('en-US')}`}</span>
          </div>
          <BriefOptions brief={b} draft={d} setDraft={setDraft} />
          <div className="mt-12 flex justify-center">
            <button onClick={() => {
              // one plan, built from what was picked: on location away from home if the place is elsewhere
              const away = d.scoutCity && d.scoutCity !== 'Vilnius' && d.place;
              setDraft({ ...d, strategy: away ? 'destination' : 'local', picks: undefined });
              router.push('/plan/assemble');
            }} data-demo="build-team" className="g-btn h-14 px-10 text-[16px]">Build the team →</button>
          </div>
        </div>
      )}
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
