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

  async function go(file: Blob) {
    setBusy(true);
    const img = await thumb(new File([file], 'reference.jpg', { type: file.type || 'image/jpeg' }), 1200);
    const d = loadDraft();
    saveDraft({ ...d, refImages: [img], brief: null, place: null });
    router.push('/new?auto=1');
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) go(f); }}
        onClick={() => input.current?.click()}
        className={`relative flex h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[36px] transition-transform duration-300 ${drag ? 'scale-[1.01]' : ''}`}
      >
        <div className="absolute inset-0"><Grainient colors={['#e9eef5', '#b9c8da', '#7f93ad', '#e8ddd0']} grainAnimated grainAmount={0.12} speed={0.22} flow={1.1} softness={0.9} dpr={1} /></div>
        <div className="relative flex flex-col items-center text-center text-white">
          <span className="flex size-16 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm"><ImagePlus className="size-7" strokeWidth={1.5} /></span>
          <p className="mt-4 font-[family-name:var(--font-inter)] text-[28px] font-light tracking-[-0.02em]">{busy ? 'Opening…' : 'Drop a campaign reference'}</p>
          <p className="mt-1 text-[14px] text-white/80">A moodboard, a tear sheet or a past campaign. Or pick one below.</p>
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) go(f); }} />
      </div>
      <Marquee pauseOnHover className="mt-4 [--duration:45s] [--gap:0.75rem]">
        {REFS.map((id) => (
          <button key={id} disabled={busy} onClick={async () => go(await fetch(ref(id, 1200)).then((r) => r.blob()))} className="group h-28 w-[88px] overflow-hidden rounded-[14px] transition-transform hover:-translate-y-1">
            <img src={ref(id, 240)} alt="Example reference" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </Marquee>
    </div>
  );
}
