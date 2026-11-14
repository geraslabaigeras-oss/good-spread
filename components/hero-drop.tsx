'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import Grainient from '@/components/Grainient';
import { Marquee } from '@/components/ui/marquee';
import { loadDraft, saveDraft, thumb } from '@/lib/plan-store';

const REFS = ['photo-1550872199-63f4382fe925', 'photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1508964801641-4b2410705b73', 'photo-1590972381381-c863cbbf9dd2', 'photo-1635262090780-2ed9e994fff4', 'photo-1603189343302-e603f7add05a', 'photo-1733322980454-62a1d5727460', 'photo-1739808914849-01ba195c4f93', 'photo-1645561305502-63a9ba09ab09'];
const ref = (id: string, w: number) => `https://images.unsplash.com/${id}?fm=jpg&q=70&w=${w}&auto=format&fit=crop`;

/** The hero is the start: drop or pick a reference and the brief page opens straight into the analysis. */
export function HeroDrop() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [staged, setStaged] = useState<string[]>([]); // your own images, shrunk, waiting for "Read"
  const total = staged.length + picked.length;
  async function stage(files: Blob[]) {
    const imgs = await Promise.all(files.filter((f) => f.type.startsWith('image/')).slice(0, 6).map((f) => thumb(new File([f], 'reference.jpg', { type: f.type || 'image/jpeg' }), 900)));
    setStaged((x) => [...x, ...imgs].slice(0, 6 - picked.length));
  }

  async function readAll() {
    if (!total) return;
    setBusy(true);
    const fromPicks = await Promise.all(picked.map((id) => fetch(ref(id, 900)).then((r) => r.blob()).then((b) => thumb(new File([b], 'reference.jpg', { type: b.type || 'image/jpeg' }), 900))));
    const d = loadDraft();
    saveDraft({ ...d, refImages: [...staged, ...fromPicks].slice(0, 6), brief: null, place: null, shortlist: [], scoutCity: undefined });
    router.push('/new?auto=1');
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); stage(Array.from(e.dataTransfer.files)); }}
        onClick={() => input.current?.click()}
        className={`relative flex h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[36px] transition-transform duration-300 ${drag ? 'scale-[1.01]' : ''}`}
      >
        <div className="absolute inset-0"><Grainient colors={['#f4f7fb', '#d6e2f0', '#aec3dc', '#eef3f9']} grainAnimated grainAmount={0.12} speed={0.22} flow={1.1} softness={0.9} dpr={1} /></div>
        <div className="relative flex flex-col items-center text-center text-white">
          <span className="flex size-16 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm"><ImagePlus className="size-7" strokeWidth={1.5} /></span>
          <p className="mt-4 font-[family-name:var(--font-inter)] text-[28px] font-light tracking-[-0.02em]">{busy ? 'Opening…' : total ? 'Add more, or read them' : 'Drop your moodboard'}</p>
          <p className="mt-1 text-[14px] text-white/80">Up to six references: campaigns, tear sheets, film stills. Or pick some below.</p>
        </div>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) stage(Array.from(e.target.files)); e.target.value = ''; }} />
      </div>
      <Marquee pauseOnHover className="mt-4 [--duration:45s] [--gap:0.75rem]">
        {REFS.map((id) => (
          <button key={id} disabled={busy} onClick={() => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(0, 6)))} className={`group relative h-28 w-[88px] overflow-hidden rounded-[14px] transition-transform hover:-translate-y-1 ${picked.includes(id) ? 'ring-[3px] ring-neutral-950' : ''}`}>
            <img src={ref(id, 240)} alt="Example reference" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {picked.includes(id) && <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-neutral-950 text-[11px] text-white">{picked.indexOf(id) + 1}</span>}
          </button>
        ))}
      </Marquee>
      {total > 0 && (
        <div className="mt-5 flex flex-col items-center gap-3">
          {staged.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {staged.map((src, i) => (
                <span key={i} className="relative h-24 w-[74px] overflow-hidden rounded-xl ring-1 ring-black/10">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button onClick={() => setStaged((x) => x.filter((_, j) => j !== i))} aria-label="Remove" className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-neutral-950/80 text-[12px] text-white">×</button>
                </span>
              ))}
              {total < 6 && <button onClick={() => input.current?.click()} className="flex h-24 w-[74px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 text-[12px] text-neutral-500 hover:border-neutral-500">+ Add</button>}
            </div>
          )}
          {total === 1 && <p className="text-[13px] text-neutral-500">One reference works. Two to six give a better read: add a model look, a place, a mood.</p>}
          <button onClick={readAll} disabled={busy} className="rounded-full bg-neutral-950 px-6 py-3 text-[15px] text-white">{busy ? 'Opening…' : `Read ${total} reference${total > 1 ? 's' : ''}`}</button>
        </div>
      )}
    </div>
  );
}
