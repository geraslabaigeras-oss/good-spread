'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Loader2, Mic, Square, X } from 'lucide-react';
import { loadDraft } from '@/lib/plan-store';
import { BrandLogo } from '@/components/brand-logo';

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
            className="relative w-[340px] rounded-[22px] bg-white p-4 shadow-[0_20px_50px_rgba(20,40,90,.18),inset_0_0_0_1px_rgba(0,0,0,.05)]">
            <button onClick={() => { setTurn(null); setErr(null); }} aria-label="Close" className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-900"><X className="size-4" /></button>
            {err && <p className="text-[14px] text-red-600">{err}</p>}
            {turn && (
              <>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-neutral-100 px-3 py-2 text-[14px]">{turn.q}</p>
                <p className="mt-2 max-w-[92%] rounded-2xl rounded-bl-md bg-neutral-950 px-3 py-2 text-[14px] leading-5 text-white">{turn.a}</p>
              </>
            )}
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-neutral-400"><BrandLogo name="elevenlabs" size={10} color="#a3a3a3" /> voice by ElevenLabs · advice by Claude</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => (state === 'rec' ? rec.current?.stop() : state === 'idle' && start())} disabled={busy}
        className="inline-flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-[15px] shadow-[0_10px_30px_rgba(20,40,90,.16),inset_0_0_0_1px_rgba(0,0,0,.05)]">
        <motion.span animate={state === 'rec' || state === 'speak' ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: Infinity }}
          className="flex size-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#cfe9ff,#3c8dde_45%,#2c5f8a_80%)] text-white">
          {state === 'rec' ? <Square className="size-3.5" /> : busy ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
        </motion.span>
        {state === 'rec' ? 'Listening… tap to stop' : state === 'think' ? 'Thinking…' : state === 'speak' ? 'Speaking…' : 'Ask good spread'}
      </button>
    </div>
  );
}
