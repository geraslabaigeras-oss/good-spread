'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Extraction, Update } from '@/lib/engine/updates';
import { fmt, fmtEur } from '@/lib/format';
import { EASE, extractionCard, MS, useTypeIn } from '@/lib/motion';
import { Button, SectionHead, useToast } from '@/components/kit';
import { cn } from '@/lib/utils';

type Card = {
  inboxId: string; source: string; via: 'ai' | 'cache' | 'rule' | 'none'; ms: number;
  extraction: Extraction; update: Update | null; description: string | null; needsManual: boolean;
  people: { id: string; name: string }[];
};

const DEMO_FILES = [
  { file: 'flight_DA645_change.pdf', label: 'flight' },
  { file: 'agency_confirmation_ieva.pdf', label: 'agency' },
  { file: 'studio_quote.pdf', label: 'studio' },
];

type Phase = 'idle' | 'drag' | 'paste' | 'reading' | 'card';

export function Inbox({ slug, onChanged, slow }: { slug: string; onChanged: () => void; slow: <T>(fn: () => Promise<T>) => Promise<T> }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('idle');
  const [reading, setReading] = useState<{ name: string; done: boolean } | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [text, setText] = useState('');
  const [manual, setManual] = useState<{ personId: string; time: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(form: FormData, name: string) {
    setPhase('reading');
    setReading({ name, done: false });
    setCard(null);
    setManual(null);
    try {
      form.set('slug', slug);
      const r = await slow(() => fetch('/api/inbox', { method: 'POST', body: form }));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setReading({ name, done: true });
      await new Promise((res) => setTimeout(res, 200));
      setCard(j);
      if (j.needsManual) setManual({ personId: j.people[0]?.id ?? '', time: '' });
      setPhase('card');
      onChanged();
    } catch (e) {
      toast(`Could not read ${name}: ${e instanceof Error ? e.message : 'error'}`);
      setPhase('idle');
    } finally {
      setReading(null);
    }
  }

  function sendFile(f: File) {
    const fd = new FormData();
    fd.set('file', f);
    send(fd, f.name);
  }

  async function sendDemo(file: string) {
    const r = await fetch(`/demo-docs/${file}`);
    sendFile(new File([await r.blob()], file, { type: 'application/pdf' }));
  }

  function sendText() {
    if (!text.trim()) return;
    const fd = new FormData();
    fd.set('text', text);
    send(fd, 'pasted text');
  }

  async function apply() {
    if (!card) return;
    setApplying(true);
    try {
      const body = manual
        ? { slug, inboxId: card.inboxId, source: card.source, manual }
        : { slug, inboxId: card.inboxId, source: card.source, update: card.update };
      const r = await slow(() => fetch('/api/inbox/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      if (j.logged) toast(`Logged ${card.source}`, { check: true });
      else if (!j.conflicts) toast('Applied · no conflicts', { check: true });
      setCard(null);
      setManual(null);
      setText('');
      setPhase('idle');
      onChanged();
    } catch (e) {
      toast(`Could not apply: ${e instanceof Error ? e.message : 'error'}`);
    } finally {
      setApplying(false);
    }
  }

  const zoneState = phase === 'drag' ? 'drag-over' : phase === 'reading' ? 'reading' : 'idle';

  return (
    <section className="section flex h-full flex-col">
      <SectionHead label="Something changed?" meta="Drop a flight PDF, a screenshot or paste a message" />
      <div className="relative min-h-0 flex-1">
        {phase !== 'card' ? (
          <div
            data-state={zoneState}
            onDragOver={(e) => { e.preventDefault(); if (phase !== 'reading') setPhase('drag'); }}
            onDragLeave={() => phase === 'drag' && setPhase('idle')}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) sendFile(f);
              else {
                const t = e.dataTransfer.getData('text/plain');
                if (t) { setText(t); setPhase('paste'); } else setPhase('idle');
              }
            }}
            onPaste={(e) => {
              const f = e.clipboardData.files?.[0];
              if (f) { e.preventDefault(); sendFile(f); }
            }}
            className={cn(
              'flex h-full flex-col items-center justify-center rounded-[20px] px-5 text-center transition-all duration-[160ms] ease-[cubic-bezier(.4,0,.2,1)]',
              zoneState === 'idle' && 'border border-dashed border-hairline-strong bg-paper',
              zoneState === 'drag-over' && 'border-[1.5px] border-solid border-action bg-action-tint',
              zoneState === 'reading' && 'border border-solid border-hairline bg-paper',
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'drag' && (
                <motion.div key="drag" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.12 } }} className="text-[14px] font-medium leading-5 text-action">
                  Drop to read
                </motion.div>
              )}
              {phase === 'reading' && reading && (
                <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.12 } }} className="w-full">
                  <div className="text-[13px] leading-5">
                    <span className="font-mono">{reading.name}</span> <span className="text-grey-1">· Reading…</span>
                  </div>
                  <div className="mx-6 mt-3 h-px bg-transparent">
                    <motion.div
                      className="h-px bg-action"
                      initial={{ width: '0%' }}
                      animate={reading.done ? { width: '100%', transition: { duration: 0.2 } } : { width: '90%', transition: { duration: MS.readingFake / 1000, ease: EASE.out } }}
                    />
                  </div>
                </motion.div>
              )}
              {phase === 'paste' && (
                <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.12 } }} className="flex h-full w-full flex-col gap-3 py-5">
                  <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendText(); }}
                    placeholder="Paste a message, e.g. “Ieva’s flight now lands 10:45”"
                    className="min-h-0 flex-1 resize-none rounded-[10px] border border-hairline-strong bg-surface p-3 text-left text-[14px] leading-5 placeholder:text-grey-2"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" disabled={!text.trim()} onClick={sendText}>Read</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setPhase('idle'); setText(''); }}>Cancel</Button>
                  </div>
                </motion.div>
              )}
              {phase === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.12 } }} className="flex flex-col items-center">
                  <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 rounded-[10px] px-3 py-1">
                    <Upload size={16} strokeWidth={1.5} className="text-grey-1" />
                    <span className="text-[14px] leading-5">Drop a flight PDF, screenshot or email</span>
                  </button>
                  <Button variant="ghost" size="sm" className="mt-1 text-grey-1" onClick={() => setPhase('paste')}>or paste text</Button>
                  <div className="mt-3 text-[13px] leading-[18px] text-grey-1">
                    Demo files:{' '}
                    {DEMO_FILES.map((d, i) => (
                      <span key={d.file}>
                        {i > 0 && ' · '}
                        <button onClick={() => sendDemo(d.file)} className="underline decoration-hairline-strong underline-offset-2 hover:text-ink">{d.label}</button>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = ''; }} />
          </div>
        ) : (
          card && (
            <ExtractionCard
              key={card.inboxId}
              card={card}
              manual={manual}
              setManual={setManual}
              applying={applying}
              onApply={apply}
              onDiscard={() => { setCard(null); setManual(null); setPhase('idle'); }}
            />
          )
        )}
      </div>
    </section>
  );
}

function fieldsFor(card: Card): [string, string][] {
  const u = card.update;
  const ex = card.extraction;
  const name = (id: string) => card.people.find((x) => x.id === id)?.name ?? id;
  if (u?.kind === 'travel') {
    const route = ex.flight?.from && ex.flight?.to ? `${ex.flight.from} → ${ex.flight.to}` : u.from && u.to ? `${u.from} → ${u.to}` : '—';
    return [
      ['Person', name(u.personId)],
      ['Flight', ex.flight?.number ?? u.number ?? '—'],
      ['Route', route],
      ['Lands', fmt(u.arriveMin)],
    ];
  }
  if (u?.kind === 'late') return [['Person', name(u.personId)], ['Ready at', fmt(u.readyMin)], ['Reason', ex.delay?.reason ?? '—']];
  if (u?.kind === 'cap') return [['Type', 'Budget change'], ['New cap', fmtEur(u.cap)], ['Read', ex.budget?.note ?? ex.summary]];
  if (u?.kind === 'log') return [['Type', ex.type], ['Read', ex.summary]];
  return [['Read', ex.summary]];
}

function ExtractionCard({
  card, manual, setManual, applying, onApply, onDiscard,
}: {
  card: Card; manual: { personId: string; time: string } | null; setManual: (m: { personId: string; time: string } | null) => void;
  applying: boolean; onApply: () => void; onDiscard: () => void;
}) {
  const fields = fieldsFor(card);
  const [doneCount, setDoneCount] = useState(0);
  const allTyped = doneCount >= fields.length;
  const conf = Math.round((card.extraction.confidence ?? 0) * 100);
  const via = card.via === 'cache' ? 'cached' : card.via === 'rule' ? 'by rule' : card.via === 'none' ? 'not read' : `${(card.ms / 1000).toFixed(1)} s`;
  const timeOk = !manual || /^\d{1,2}[:.]\d{2}$/.test(manual.time);
  const isLog = card.update?.kind === 'log';

  return (
    <motion.div variants={extractionCard} initial="hidden" animate="shown" className="flex h-full flex-col rounded-[20px] border border-hairline bg-surface p-4">
      <div className="flex h-4 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="label shrink-0">Read from</span>
          <span className="truncate font-mono text-[12px] leading-4">{card.source}</span>
        </div>
        <span className="shrink-0 font-mono text-[12px] leading-4 text-grey-1 num">{card.via === 'none' ? via : `${conf}% · ${via}`}</span>
      </div>

      {manual ? (
        <div className="mt-3 grid grid-cols-[1fr_96px] gap-2">
          <select
            value={manual.personId}
            onChange={(e) => setManual({ ...manual, personId: e.target.value })}
            className="h-11 rounded-[10px] border border-hairline-strong bg-surface px-3 text-[14px]"
          >
            {card.people.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <input
            value={manual.time}
            onChange={(e) => setManual({ ...manual, time: e.target.value })}
            placeholder="10:45"
            inputMode="numeric"
            className="h-11 rounded-[10px] border border-hairline-strong bg-surface px-3 font-mono text-[14px] num placeholder:text-grey-2"
          />
          <span className="col-span-2 text-[13px] leading-[18px] text-grey-1">New arrival or ready time for that person.</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-[88px_1fr] gap-y-0">
          {fields.map(([k, v], i) => (
            <TypedField key={k} label={k} value={v} delayMs={i * MS.typeFieldGap} onDone={() => setDoneCount((n) => Math.max(n, i + 1))} />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3">
        <Button variant="primary" disabled={applying || (!manual && !allTyped) || !timeOk || (!!manual && !manual.time)} onClick={onApply}>
          {applying ? 'Applying…' : isLog ? 'Log it' : 'Apply'}
        </Button>
        {!manual && !isLog && card.update && card.update.kind !== 'cap' && (
          <Button
            variant="ghost"
            onClick={() => {
              const u = card.update!;
              if (u.kind === 'log' || u.kind === 'cap') return;
              setManual({ personId: u.personId, time: fmt(u.kind === 'travel' ? u.arriveMin : u.readyMin) });
            }}
          >
            Edit
          </Button>
        )}
        <Button variant="ghost" className="ml-auto text-grey-1" onClick={onDiscard}>Discard</Button>
      </div>
    </motion.div>
  );
}

function TypedField({ label, value, delayMs, onDone }: { label: string; value: string; delayMs: number; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [shown, done] = useTypeIn(value, delayMs);
  const fired = useRef(false);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [done, onDone]);
  return (
    <>
      <span className="text-[13px] leading-6 text-grey-1">{label}</span>
      <span className="truncate font-mono text-[13px] font-medium leading-6 num">
        {shown}
        {!done && !reduce && <motion.span className="inline-block w-[1ch] bg-ink align-[-2px]" style={{ height: 14 }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.53, repeat: Infinity, repeatType: 'reverse' }} />}
      </span>
    </>
  );
}
