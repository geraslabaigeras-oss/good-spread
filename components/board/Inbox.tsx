'use client';

import { useRef, useState } from 'react';
import type { Extraction, Update } from '@/lib/engine/updates';
import { fmt } from '@/lib/engine/time';
import { cn } from '@/lib/utils';
import { SectionTitle } from './Board';

type Card = {
  inboxId: string; source: string; via: 'ai' | 'cache' | 'rule' | 'none'; ms: number;
  extraction: Extraction; update: Update | null; description: string | null; needsManual: boolean;
  people: { id: string; name: string }[];
};

const DEMO_FILES = [
  { file: 'flight_DA645_change.pdf', label: 'Flight change' },
  { file: 'agency_confirmation_ieva.pdf', label: 'Agency' },
  { file: 'studio_quote.pdf', label: 'Studio quote' },
];

export function Inbox({ slug, onApplied }: { slug: string; onApplied: () => void }) {
  const [drag, setDrag] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [manual, setManual] = useState<{ personId: string; time: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(form: FormData, name: string) {
    setReading(name);
    setErr(null);
    setCard(null);
    setManual(null);
    try {
      form.set('slug', slug);
      const r = await fetch('/api/inbox', { method: 'POST', body: form });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setCard(j);
      if (j.needsManual) setManual({ personId: j.people[0]?.id ?? '', time: '' });
      onApplied();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
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
    const blob = await r.blob();
    sendFile(new File([blob], file, { type: 'application/pdf' }));
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
      const r = await fetch('/api/inbox/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setCard(null);
      setManual(null);
      setText('');
      onApplied();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    } finally {
      setApplying(false);
    }
  }

  const isLog = card?.update?.kind === 'log';

  return (
    <section className="px-5 py-4">
      <SectionTitle right={<span>PDF · screenshot · text</span>}>Inbox</SectionTitle>
      {!card && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) sendFile(f);
            else {
              const t = e.dataTransfer.getData('text/plain');
              if (t) { setText(t); }
            }
          }}
          onPaste={(e) => {
            const f = e.clipboardData.files?.[0];
            if (f) { e.preventDefault(); sendFile(f); }
          }}
          className={cn('border border-dashed px-4 py-4 transition-colors', drag ? 'border-action bg-action-soft' : 'border-input bg-card')}
        >
          {reading ? (
            <div className="py-5 text-center text-sm">
              <span className="inline-block size-2 animate-pulse rounded-full bg-action align-middle" /> Reading {reading}…
            </div>
          ) : (
            <>
              <button onClick={() => fileRef.current?.click()} className="w-full py-2 text-center text-sm">
                <span className="font-medium">Drop a file here</span> <span className="text-muted-foreground">or click to choose</span>
              </button>
              <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = ''; }} />
              <div className="mt-2 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendText()}
                  placeholder="…or paste a message"
                  className="h-8 min-w-0 flex-1 border border-hairline bg-background px-2 text-sm outline-none focus:border-foreground"
                />
                <button onClick={sendText} disabled={!text.trim()} className="h-8 rounded-sm border border-hairline px-3 text-xs disabled:opacity-40">Read</button>
              </div>
            </>
          )}
        </div>
      )}
      {!card && !reading && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          Demo docs:
          {DEMO_FILES.map((d) => (
            <button key={d.file} onClick={() => sendDemo(d.file)} className="rounded-sm border border-hairline px-1.5 py-0.5 hover:bg-muted">{d.label}</button>
          ))}
        </div>
      )}
      {err && <div className="mt-2 text-xs text-conflict">{err}</div>}

      {card && (
        <div className="flash border border-foreground bg-card p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>Read from {card.source}</span>
            <span className="normal-case tracking-normal">
              {card.via === 'ai' ? `AI · ${(card.ms / 1000).toFixed(1)} s` : card.via === 'cache' ? 'cached' : card.via === 'rule' ? 'read by rule' : 'not read'}
            </span>
          </div>
          <div className="mt-2 text-[15px] font-medium">{card.description ?? card.extraction.summary}</div>
          {card.description && card.extraction.summary !== card.description && (
            <div className="mt-0.5 text-xs text-muted-foreground">“{card.extraction.summary}”</div>
          )}
          {manual ? (
            <div className="mt-3 flex items-center gap-2">
              <select value={manual.personId} onChange={(e) => setManual({ ...manual, personId: e.target.value })} className="h-8 border border-hairline bg-background px-1 text-sm">
                {card.people.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">arrives / ready</span>
              <input value={manual.time} onChange={(e) => setManual({ ...manual, time: e.target.value })} placeholder="10:45" className="h-8 w-16 border border-hairline bg-background px-2 text-sm tnum" />
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={apply}
              disabled={applying || (!!manual && !/^\d{1,2}[:.]\d{2}$/.test(manual.time))}
              className="h-9 flex-1 rounded-sm bg-action text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              {applying ? 'Checking the plan…' : isLog ? 'Log it' : 'Apply'}
            </button>
            {!manual && !isLog && card.update && (
              <button
                onClick={() => {
                  const u = card.update!;
                  if (u.kind === 'log') return;
                  setManual({ personId: u.personId, time: fmt(u.kind === 'travel' ? u.arriveMin : u.readyMin) });
                }}
                className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2"
              >
                Edit
              </button>
            )}
            <button onClick={() => { setCard(null); setManual(null); }} className="h-9 px-2 text-xs text-muted-foreground">Discard</button>
          </div>
        </div>
      )}
    </section>
  );
}
