'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Loader2, Mic, Square, X } from 'lucide-react';
import { loadDraft } from '@/lib/plan-store';

type Turn = { q: string; a: string; verdict?: string };

/** ElevenLabs voice assistant on every page: speak → Scribe → Claude (producer advice) → ElevenLabs voice. */
export function VoiceOrb() {
  const [state, setState] = useState<'idle' | 'rec' | 'think' | 'speak'>('idle');
  const [turn, setTurn] = useState<Turn | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);

  async function start() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); answer(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); };
      rec.current = mr;
      mr.start();
      setState('rec');
    } catch { setErr('Microphone not available.'); }
  }

  async function answer(blob: Blob) {
    setState('think');
    try {
      const fd = new FormData();
      fd.set('audio', new File([blob], 'q.webm', { type: blob.type }));
      const t = await fetch('/api/voice/transcribe', { method: 'POST', body: fd }).then((r) => r.json());
      if (!t.text) throw new Error('I did not catch that.');
      const d = loadDraft();
      const b = d.brief;
      const adv = await fetch('/api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        question: t.text,
        brief: b ? `${b.garment}. ${b.summary} Light: ${b.lighting}. Setting: ${b.setting}.` : `${d.title || 'Fashion shoot'}, budget cap €${d.cap}`,
        date: d.deliverables.deadlineISO, plans: [],
      }) }).then((r) => r.json());
      if (!adv.answer) throw new Error('No answer right now.');
      setTurn({ q: t.text, a: adv.answer, verdict: adv.verdict });
      setState('speak');
      const audio = await fetch('/api/voice/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: adv.answer.slice(0, 600) }) });
      if (audio.ok) {
        const url = URL.createObjectURL(await audio.blob());
        const a = new Audio(url);
        a.onended = () => { URL.revokeObjectURL(url); setState('idle'); };
        await a.play();
      } else setState('idle');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
      setState('idle');
    }
  }

  const busy = state === 'think' || state === 'speak';
  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3">
      <AnimatePresence>
        {(turn || err) && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            className="relative w-[340px] rounded-[24px] bg-white/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,.14),inset_0_0_0_1px_rgba(0,0,0,.05)] backdrop-blur">
            <button onClick={() => { setTurn(null); setErr(null); }} aria-label="Close" className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-900"><X className="size-4" /></button>
            {err && <p className="text-[14px] text-red-600">{err}</p>}
            {turn && (
              <>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-neutral-100 px-3 py-2 text-[14px]">{turn.q}</p>
                <p className="mt-2 max-w-[92%] rounded-2xl rounded-bl-md bg-neutral-950 px-3 py-2 text-[14px] leading-5 text-white">{turn.a}</p>
              </>
            )}
            
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => (state === 'rec' ? rec.current?.stop() : state === 'idle' && start())} disabled={busy}
        className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 pl-4 pr-5 text-[14px] text-white shadow-[0_14px_34px_rgba(0,0,0,.22)]">
        <span className="flex h-4 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="w-[3px] rounded-full bg-white"
              animate={{ height: state === 'idle' ? [4, 8, 4] : [4, 16, 6, 14, 4] }}
              transition={{ duration: state === 'idle' ? 1.6 : 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
          ))}
        </span>
        {state === 'rec' ? <span className="inline-flex items-center gap-2">Listening <Square className="size-3" /></span> : state === 'think' ? <span className="inline-flex items-center gap-2">Thinking <Loader2 className="size-3.5 animate-spin" /></span> : state === 'speak' ? 'Speaking' : <span className="inline-flex items-center gap-2"><Mic className="size-3.5" /> Ask good spread</span>}
      </button>
    </div>
  );
}
