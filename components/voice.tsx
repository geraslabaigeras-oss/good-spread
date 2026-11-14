'use client';

import { useRef, useState } from 'react';
import { Loader2, Mic, Square, Volume2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

/** Record a spoken brief; ElevenLabs Scribe turns it into text. */
export function VoiceBrief({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<'idle' | 'rec' | 'busy'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);

  async function start() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState('busy');
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const fd = new FormData();
        fd.set('audio', new File([blob], 'brief.webm', { type: blob.type }));
        const r = await fetch('/api/voice/transcribe', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.text) onText(j.text);
        else setErr(j.error === 'elevenlabs_not_configured' ? 'Add ELEVENLABS_API_KEY to use voice.' : 'Could not transcribe. Try again.');
        setState('idle');
      };
      rec.current = mr;
      mr.start();
      setState('rec');
    } catch {
      setErr('Microphone not available.');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => (state === 'rec' ? rec.current?.stop() : state === 'idle' && start())}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium ${state === 'rec' ? 'bg-red-600 text-white' : 'bg-neutral-900 text-white'}`}
      >
        {state === 'rec' ? <Square className="size-3.5" /> : state === 'busy' ? <Loader2 className="size-3.5 animate-spin" /> : <Mic className="size-3.5" />}
        {state === 'rec' ? 'Stop' : state === 'busy' ? 'Transcribing…' : 'Speak the brief'}
      </button>
      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500"><BrandLogo name="elevenlabs" size={11} color="#737373" /> ElevenLabs</span>
      {err && <span className="text-[12px] text-red-600">{err}</span>}
    </div>
  );
}

/** Read a short text aloud with ElevenLabs. */
export function ListenButton({ text, className }: { text: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  async function play() {
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch('/api/voice/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!r.ok) throw new Error();
      const url = URL.createObjectURL(await r.blob());
      const a = new Audio(url);
      a.onended = () => URL.revokeObjectURL(url);
      await a.play();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" onClick={play} disabled={busy} className={className ?? 'inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)]'}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Volume2 className="size-3.5" />}
      {err ? 'Voice unavailable' : 'Listen to your day'}
    </button>
  );
}
