'use client';

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Check, Mail, PhoneCall, X } from 'lucide-react';

export type CallTarget = { id: string; name: string; role: string; agency?: string | null; photo?: string | null; dayRate?: number; email?: string | null };
export type CallResult = 'available' | 'hold' | 'unavailable' | 'confirmed';
type Mode = { kind: 'book'; date: string; brief?: string } | { kind: 'update'; lines: Record<string, string> };

/** Deterministic demo answer per person (same person, same answer). */
function answerFor(id: string): Exclude<CallResult, 'confirmed'> {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = h % 10;
  return r < 6 ? 'available' : r < 8 ? 'hold' : 'unavailable';
}

function script(t: CallTarget, mode: Mode, result: CallResult): { who: 'ai' | 'them'; text: string }[] {
  const first = t.name.split(' ')[0];
  const agent = t.agency ? t.agency.replace(/ (London|Paris|Milan|Berlin|Copenhagen|Stockholm|Warsaw|Amsterdam|Vilnius|Riga|Lisbon|Barcelona|Tallinn)$/, '') : first;
  if (mode.kind === 'update') return [
    { who: 'ai', text: `Hi, this is the good spread assistant for the shoot. Quick update for ${first}.` },
    { who: 'ai', text: mode.lines[t.id] ?? 'The plan changed slightly.' },
    { who: 'them', text: 'Got it, thanks for the heads up.' },
    { who: 'ai', text: 'Great, the new call sheet is in your messages.' },
  ];
  const ask = { who: 'ai' as const, text: `Hi, I'm an AI assistant calling for a fashion shoot on ${mode.date}. Is ${first} free that day?` };
  if (result === 'available') return [ask, { who: 'them', text: `Let me check. Yes, ${first} is free on ${mode.date}.` }, { who: 'ai', text: `Great. Day rate would be around €${(t.dayRate ?? 0).toLocaleString('en-US')}, usage web and social for 12 months. Can you hold the day?` }, { who: 'them', text: `Yes, ${agent} puts a first option on it. Send the brief over.` }];
  if (result === 'hold') return [ask, { who: 'them', text: `${first} has a second option that day. I can put you on hold.` }, { who: 'ai', text: 'Please do. When will you know?' }, { who: 'them', text: 'By tomorrow noon.' }];
  return [ask, { who: 'them', text: `Sorry, ${first} is booked that week.` }, { who: 'ai', text: 'Understood, thanks. We will look at other options.' }];
}

function Wave({ on }: { on: boolean }) {
  return (
    <div className="flex h-10 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#eef3f9] via-[#dde8f5] to-[#eef3f9] px-3">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-gradient-to-t from-[#6f93c7] to-[#c9daf0]"
          animate={on ? { height: [4, 8 + ((i * 37) % 20), 6, 12 + ((i * 13) % 14), 4] } : { height: 3 }}
          transition={on ? { duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }} />
      ))}
    </div>
  );
}

function CallCard({ t, mode, delay, onDone }: { t: CallTarget; mode: Mode; delay: number; onDone: (id: string, r: CallResult) => void }) {
  const result: CallResult = mode.kind === 'update' ? 'confirmed' : answerFor(t.id);
  const lines = useMemo(() => script(t, mode, result), [t, mode, result]);
  const [phase, setPhase] = useState<'wait' | 'ring' | 'talk' | 'done'>('wait');
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    ids.push(setTimeout(() => setPhase('ring'), delay));
    ids.push(setTimeout(() => setPhase('talk'), delay + 1400));
    lines.forEach((_, i) => ids.push(setTimeout(() => setShown(i + 1), delay + 1600 + i * 1300)));
    ids.push(setTimeout(() => { setPhase('done'); onDone(t.id, result); }, delay + 1600 + lines.length * 1300 + 300));
    return () => ids.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = result === 'available' ? ['Available', 'bg-emerald-600 text-white'] : result === 'hold' ? ['On hold', 'bg-amber-500 text-white'] : result === 'confirmed' ? ['Confirmed', 'bg-emerald-600 text-white'] : ['Not free', 'bg-neutral-300 text-neutral-800'];
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[300px] flex-col rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-3">
        {t.photo ? <img src={t.photo} alt="" className="size-11 rounded-full object-cover object-top" /> : <span className="relative size-11 shrink-0 overflow-hidden rounded-full"><span className="gs-talent-ph absolute inset-0" /></span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium">{t.name}</div>
          <div className="truncate text-[12px] text-neutral-500">{mode.kind === 'update' ? `Calling ${t.name.split(' ')[0]}` : `Calling ${t.agency ?? t.name}`}</div>
        </div>
        {phase === 'done' ? <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${chip[1]}`}>{chip[0]}</span>
          : phase === 'ring' ? <span className="inline-flex items-center gap-1 text-[12px] text-neutral-500"><PhoneCall className="size-3.5 animate-pulse" /> Ringing</span>
          : phase === 'talk' ? <span className="text-[12px] text-[#4f78b3]">On the call</span>
          : <span className="text-[12px] text-neutral-400">Queued</span>}
      </div>
      <div className="mt-3"><Wave on={phase === 'talk'} /></div>
      <div className="mt-2 flex-1 space-y-1.5">
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className={`flex animate-in fade-in slide-in-from-bottom-1 duration-300 ${l.who === 'ai' ? 'justify-end' : 'justify-start'}`}>
            <span className={`max-w-[88%] rounded-2xl px-3 py-1.5 text-[13px] leading-5 ${l.who === 'ai' ? 'rounded-br-md bg-neutral-950 text-white' : 'rounded-bl-md bg-[#eef2f7] text-neutral-900'}`}>{l.text}</span>
          </div>
        ))}
      </div>
      {phase === 'done' && t.email && (
        <a href={`mailto:${t.email}?subject=${encodeURIComponent('Booking request')}`} className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-900"><Mail className="size-3.5" /> Follow up by email</a>
      )}
    </motion.div>
  );
}

/** The assistant calls everyone on the list at once and reports back. Used for booking and for telling people about a change. */
export function CallRun({ open, onClose, targets, mode, onResults }: { open: boolean; onClose: () => void; targets: CallTarget[]; mode: Mode; onResults?: (r: Record<string, CallResult>) => void }) {
  const [res, setRes] = useState<Record<string, CallResult>>({});
  const [t0] = useState(() => Date.now());
  const done = Object.keys(res).length === targets.length && targets.length > 0;
  useEffect(() => { if (done) onResults?.(res); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = (k: CallResult) => Object.values(res).filter((x) => x === k).length;
  const secs = Math.round((Date.now() - t0) / 1000);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] overflow-y-auto bg-[#f7f7f7]/95">
          <div className="gs-grain" />
          <div className="relative mx-auto max-w-[1280px] px-8 py-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-[44px] font-light leading-tight tracking-[-0.03em]">
                  {mode.kind === 'update' ? 'Telling everyone.' : `Calling ${targets.length} ${targets.length === 1 ? 'agency' : 'agencies'}.`}{' '}
                  <span className="text-neutral-400">{done ? 'Done.' : 'All at once.'}</span>
                </h2>
                <p className="mt-2 text-[15px] text-neutral-600">
                  {done
                    ? mode.kind === 'update' ? `${targets.length} people told about the change in ${secs} s. Nobody had to type a message.` : `${count('available')} available, ${count('hold')} on hold, ${count('unavailable')} not free. Answers are saved on each person.`
                    : mode.kind === 'update' ? 'The assistant calls each person whose day changed and tells them the new time.' : 'The assistant asks each agent about the date, the day rate and usage.'}
                </p>
              </div>
              <button onClick={onClose} className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-[15px] font-medium text-white">{done ? <><Check className="size-4" /> Done</> : <><X className="size-4" /> Close</>}</button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {targets.map((t, i) => <CallCard key={t.id} t={t} mode={mode} delay={i * 900} onDone={(id, r) => setRes((x) => ({ ...x, [id]: r }))} />)}
            </div>
            <p className="mt-6 text-[12px] text-neutral-400">Demo run: the answers are simulated. With a phone number connected, the same assistant places real calls.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
