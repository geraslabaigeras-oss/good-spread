'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';

type Step = { key: string; n: number; title: string; text: string; target?: string; label?: string; after?: () => void };
const KEY = 'gs-demo';
const get = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string | null) => { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch {} };
const has = (sel: string) => !!document.querySelector(`[data-demo="${sel}"]`);
const TOTAL = 7;

/** Guided demo: one card, one next step, one button that does it. Runs only after "Try the demo". */
export function DemoGuide() {
  const path = usePathname();
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [step, setStep] = useState<Step | null>(null);

  useEffect(() => { setOn(get(KEY) === '1'); }, [path]);

  useEffect(() => {
    if (!on) return;
    const pick = (): Step | null => {
      const phase = get(`${KEY}-phase`) ?? '';
      if (has('calls-done')) return { key: 'calls-done', n: 3, title: 'The agents answered.', text: 'Each call is saved on the person. Close this to keep going.', target: 'calls-done', label: 'Back to the picks', after: () => set(`${KEY}-phase`, phase === 'approved' ? 'told' : 'called') };
      if (path === '/new') {
        if (!has('build-team')) return { key: 'reading', n: 1, title: 'Reading the references.', text: 'Model look, setting and light are read from the pictures. One brief comes out.' };
        if (!has('call-all')) return { key: 'pick', n: 2, title: 'This is the brief.', text: 'Below are the models, photographers and places that fit it. Let good spread shortlist the best ones.', target: 'auto-pick', label: 'Shortlist the best fits' };
        if (phase !== 'called') return { key: 'call', n: 3, title: 'Call their agents.', text: 'An AI assistant calls every agent at once and asks about the date, rate and usage.', target: 'call-all', label: 'Call them all' };
        return { key: 'build', n: 4, title: 'Build the team.', text: 'Your picks become the team, with travel, stay and the budget.', target: 'build-team', label: 'Build the team' };
      }
      if (path === '/plan/assemble') return { key: 'create', n: 4, title: 'Check the team, then go.', text: 'Flights, hotel and cost are worked out. Create the production to open the shoot day.', target: 'create', label: 'Create the production' };
      if (path.startsWith('/board/')) {
        if (has('approve')) return { key: 'approve', n: 6, title: 'A flight is late.', text: 'good spread found what breaks and priced three fixes. The recommended one costs nothing.', target: 'approve', label: 'Approve the best fix', after: () => set(`${KEY}-phase`, 'approved') };
        if (phase === 'approved' || phase === 'told') {
          if (has('send-all')) return { key: 'send', n: 7, title: 'Everyone gets their new time.', text: 'One message per person, on the channel you choose. Watch them turn to Seen.', target: 'send-all', label: 'Send to everyone', after: () => set(`${KEY}-phase`, 'done') };
        }
        if (phase === 'done') return { key: 'end', n: 7, title: 'That is the whole loop.', text: 'References in, team booked, the day planned, a delay fixed and everyone told. Nobody typed a message.' };
        if (has('simulate-delay')) return { key: 'delay', n: 5, title: 'This is the shoot day.', text: 'Flights, weather, the schedule and the budget, live. Now something goes wrong.', target: 'simulate-delay', label: 'Make a flight late' };
      }
      if (path === '/') return null;
      return null;
    };
    const tick = () => setStep(pick());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [on, path]);

  // highlight the button the step is about
  useEffect(() => {
    document.querySelectorAll('.demo-pulse').forEach((el) => el.classList.remove('demo-pulse'));
    if (!step?.target) return;
    const el = document.querySelector(`[data-demo="${step.target}"]`);
    if (el && !(el as HTMLElement).classList.contains('hidden')) el.classList.add('demo-pulse');
  }, [step?.key, step?.target]);

  if (!on || !step) return null;
  const run = () => {
    const el = document.querySelector<HTMLElement>(`[data-demo="${step.target}"]`);
    if (!el) return;
    if (!el.classList.contains('hidden')) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.click(); step.after?.(); if (step.key === 'pick') setTimeout(() => document.querySelector('[data-demo="call-all"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }, el.classList.contains('hidden') ? 0 : 450);
  };
  const exit = () => { set(KEY, null); set(`${KEY}-phase`, null); setOn(false); if (step.key === 'end') router.push('/'); };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className="fixed bottom-5 left-5 z-[110] w-[min(380px,calc(100vw-40px))] rounded-[18px] bg-neutral-950 p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,.3)]">
        <div className="flex items-center justify-between text-[12px] text-white/60">
          <span>Demo · step {Math.min(step.n, TOTAL)} of {TOTAL}</span>
          <button onClick={exit} aria-label="Exit demo" className="hover:text-white"><X className="size-4" /></button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${(Math.min(step.n, TOTAL) / TOTAL) * 100}%` }} /></div>
        <div className="mt-3 text-[18px] leading-6">{step.title}</div>
        <p className="mt-1 text-[14px] leading-5 text-white/70">{step.text}</p>
        {step.target && <button onClick={run} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-neutral-950">{step.label} <ArrowRight className="size-4" /></button>}
        {step.key === 'end' && <button onClick={exit} className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-4 text-[14px] font-medium text-neutral-950">Finish the demo</button>}
      </motion.div>
    </AnimatePresence>
  );
}

/** Start the guided demo from anywhere: example references, then the brief page plays the reading. */
export function startDemo(push: (href: string) => void) {
  const refs = ['photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1635262090780-2ed9e994fff4'].map((id) => `https://images.unsplash.com/${id}?fm=jpg&q=70&w=900&auto=format&fit=crop`);
  set(KEY, '1'); set(`${KEY}-phase`, null);
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(sessionStorage.getItem('gs-plan-draft') ?? '{}'); } catch {}
  const today = new Date();
  const shoot = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().slice(0, 10);
  sessionStorage.setItem('gs-plan-draft', JSON.stringify({ ...d, title: 'Autumn outerwear', brand: 'Demo brand', cap: 12000, shootISO: shoot, shootDays: 1, refImages: refs, brief: null, place: null, shortlist: [], scoutCity: undefined, strategy: undefined, picks: undefined, demo: true }));
  push('/new?demo=1');
}
