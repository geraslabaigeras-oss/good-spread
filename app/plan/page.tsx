'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ChevronDown, Loader2, Plane } from 'lucide-react';
import type { StrategyId } from '@/lib/types';
import { dnaViolations, evaluateDna, summarize } from '@/lib/engine';
import { catalogLocation, stillToBook, STRATEGIES } from '@/data/catalog';
import { fmtDate, fmtEur } from '@/lib/format';
import { useDraft } from '@/lib/plan-store';
import { useRoster } from '@/lib/use-roster';
import { draftProduction } from '@/lib/plan-draft';
import { Stage, TopBar } from '@/components/glass/Stage';

const ease = [0.16, 1, 0.3, 1] as const;
const CATS = ['talent', 'crew', 'studio', 'travel', 'post', 'usage'] as const;
type Advice = { verdict: 'good' | 'mixed' | 'bad'; answer: string; suggestion: string };

/** City photo from Wikipedia (free, real). */
function useCityPhotos(cities: string[]) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    cities.forEach((c) => {
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c)}`)
        .then((r) => r.json())
        .then((j) => { const src = j.originalimage?.source ?? j.thumbnail?.source; if (src) setPhotos((p) => ({ ...p, [c]: src })); })
        .catch(() => {});
    });
  }, [cities.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return photos;
}

export default function Strategies() {
  const router = useRouter();
  const [draft, setDraft] = useDraft();
  const roster = useRoster();
  const [open, setOpen] = useState<StrategyId | null>(null);
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [advice, setAdvice] = useState<(Advice & { q: string }) | null>(null);

  const rows = useMemo(() => {
    if (!draft || !roster.ready) return [];
    const base = draftProduction(draft, STRATEGIES[0].id);
    return STRATEGIES.map((s) => {
      const p = draftProduction(draft, s.id);
      const sum = summarize(p);
      const broken = dnaViolations(evaluateDna(base, p)).filter((x) => !['casting', 'photographer', 'studio', 'schedule'].includes(x.id));
      return { s, p, sum, broken };
    });
  }, [draft, roster.ready, roster.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const cityPhotos = useCityPhotos(STRATEGIES.map((s) => s.city));

  if (!draft) return <Stage><div /></Stage>;
  const recommended = rows
    .filter((r) => !r.sum.overCap && r.sum.fitsDeadline && r.sum.physical === 'full' && !r.broken.length)
    .sort((a, b) => a.sum.total - b.sum.total)[0]?.s.id;

  function choose(id: StrategyId) {
    setDraft({ ...draft!, strategy: id, picks: undefined });
    router.push('/plan/assemble');
  }

  async function ask(question = q) {
    if (!question.trim() || !draft) return;
    setAsking(true);
    try {
      const b = draft.brief;
      const r = await fetch('/api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        question,
        brief: b ? `${b.garment}. ${b.summary} Light: ${b.lighting}. Setting: ${b.setting}.` : 'Fashion campaign',
        date: rows[0] ? fmtDate(rows[0].sum.shootISO) : '',
        plans: rows.map((x) => ({ name: x.s.name, city: x.s.city, total: x.sum.total, cap: x.sum.cap, flights: x.sum.travellers })),
      }) });
      const j = await r.json();
      if (r.ok) setAdvice({ ...j, q: question });
    } finally {
      setAsking(false);
    }
  }

  const photoFor = (city: string, kind: string) => (draft.place?.image && kind !== 'Destination' ? draft.place.image : cityPhotos[city]);

  return (
    <Stage voice>
      <TopBar step={2} right={<span className="text-[13px] text-grey-1">Cap {fmtEur(draft.cap)}</span>} />
      <div className="mx-auto max-w-[1280px] px-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-6 pt-6">
          <h1 className="text-[56px] leading-[0.95] tracking-[-0.02em]">Three ways to make it.</h1>
          {/* Ask the producer assistant */}
          <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex w-full max-w-[460px] items-center gap-2 rounded-full bg-white/80 p-1.5 pl-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08),0_10px_30px_rgba(0,0,0,.06)]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask: what about London? somewhere warmer?" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-neutral-400" />
            <button disabled={asking || !q.trim()} className="flex size-10 items-center justify-center rounded-full bg-neutral-950 text-white disabled:opacity-30" aria-label="Ask">
              {asking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {['Shoot in London?', 'Somewhere warmer?', 'Cheaper option?'].map((s) => (
            <button key={s} onClick={() => { setQ(s); ask(s); }} className="rounded-full bg-white/60 px-3 py-1 text-[13px] text-neutral-600 hover:bg-white hover:text-neutral-900">{s}</button>
          ))}
        </div>

        <AnimatePresence>
          {advice && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ml-auto mt-4 max-w-[560px] rounded-[22px] rounded-tr-md bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,.08)]">
              <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                <span className={`size-2 rounded-full ${advice.verdict === 'good' ? 'bg-emerald-500' : advice.verdict === 'mixed' ? 'bg-amber-500' : 'bg-red-500'}`} />
                {advice.q} · {advice.verdict === 'good' ? 'Good idea' : advice.verdict === 'mixed' ? 'Could work' : 'Not for this one'}
              </div>
              <p className="mt-2 text-[15px] leading-6 text-neutral-800">{advice.answer}</p>
              <p className="mt-2 text-[14px] text-neutral-500">{advice.suggestion}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {rows.map(({ s, p, sum, broken }, i) => {
            const team = p.people.filter((x) => x.role !== 'producer');
            const loc = p.picks ? catalogLocation(p.picks.location) : null;
            const img = loc?.photo ?? photoFor(s.city, s.name);
            const toBook = stillToBook(s.id);
            const isRec = s.id === recommended;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: i * 0.1, ease }}
                className={`overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_20px_50px_rgba(0,0,0,.07)] ${isRec ? 'ring-2 ring-neutral-950' : ''}`}>
                <div className="relative h-60 bg-neutral-200">
                  {img && <img src={img} alt="" className="size-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                  <div className="absolute bottom-4 left-5 text-white">
                    <div className="text-[13px] opacity-80">{s.city}{loc && !loc.id.startsWith('open-') ? ` · ${loc.name.split(',')[0]}` : ''}</div>
                    <div className="text-[40px] leading-none">{s.name}</div>
                  </div>
                  {isRec && <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-[12px] font-medium">Recommended</span>}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {team.map((x) => x.photo
                        ? <img key={x.id} src={x.photo} alt={x.name} title={x.name} className="size-10 rounded-full object-cover object-top ring-2 ring-white" />
                        : <span key={x.id} title={x.name} className={`flex size-10 items-center justify-center rounded-full text-[12px] ring-2 ring-white ${x.id.startsWith('open-') ? 'border border-dashed border-neutral-400 bg-white text-neutral-400' : 'bg-neutral-200 text-neutral-600'}`}>{x.name[0]}</span>)}
                    </div>
                    {sum.travellers > 0 && <span className="inline-flex items-center gap-1 text-[13px] text-neutral-500"><Plane className="size-3.5" /> {sum.travellers} fly in</span>}
                  </div>

                  <div className="mt-5 flex items-baseline justify-between">
                    <span className={`text-[40px] font-light leading-none tracking-[-0.03em] tabular-nums ${sum.overCap ? 'text-red-600' : ''}`}>{fmtEur(Math.round(sum.total))}</span>
                    <span className="text-[13px] text-neutral-500">{sum.overCap ? `${fmtEur(Math.round(sum.total - sum.cap))} over` : `${fmtEur(Math.round(sum.cap - sum.total))} left`}</span>
                  </div>
                  <p className="mt-2 text-[14px] text-neutral-600">{s.tagline} Delivered {fmtDate(sum.deliveryISO).slice(4, 10)}.</p>
                  {(toBook.length > 0 || broken.length > 0) && (
                    <p className="mt-1 text-[13px] text-neutral-400">{broken.length ? `Changes ${broken.map((x) => x.label.toLowerCase()).join(', ')}. ` : ''}{toBook.length ? `Still to book: ${toBook.join(', ').toLowerCase()}.` : ''}</p>
                  )}

                  <button onClick={() => setOpen(open === s.id ? null : s.id)} className="mt-3 inline-flex items-center gap-1 text-[13px] text-neutral-500 hover:text-neutral-900">
                    Costs <ChevronDown className={`size-3.5 transition-transform ${open === s.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {open === s.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-2 space-y-1 text-[13px]">
                          {CATS.filter((c) => sum.byCategory[c] > 0).map((c) => (
                            <div key={c} className="flex justify-between"><span className="capitalize text-neutral-500">{c}</span><span className="tabular-nums">{fmtEur(Math.round(sum.byCategory[c]))}</span></div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button onClick={() => choose(s.id)} className={`mt-5 h-12 w-full rounded-full text-[15px] font-medium ${isRec ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}>Build this team</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}
