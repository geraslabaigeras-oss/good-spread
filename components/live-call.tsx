'use client';

import { useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { motion } from 'motion/react';
import { Loader2, PhoneCall, PhoneOff } from 'lucide-react';

type Msg = { role: string; text: string };
type Props = { language: string; agency: string; city: string; model: string; date: string; firstMessage?: string; brief?: string };

/** A real ElevenLabs voice agent in the browser. You play the agency booker and answer out loud. */
export function LiveCall(props: Props) {
  return <ConversationProvider><LiveCallInner {...props} /></ConversationProvider>;
}

function LiveCallInner({ language, agency, city, model, date, firstMessage, brief }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const conv = useConversation({
    onMessage: (m) => setMsgs((x) => [...x, { role: (m as { role?: string; source?: string }).role ?? (m as { source?: string }).source ?? 'agent', text: m.message }]),
    onError: (e) => setErr(String(e)),
  });
  const live = conv.status === 'connected';

  async function start() {
    setErr(null); setMsgs([]); setOpening(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = await fetch('/api/calls/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language, agency, city, model, date, firstMessage, brief }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'elevenlabs_not_configured' ? 'Voice calls are not set up.' : 'Could not start the call.');
      conv.startSession({ signedUrl: j.signedUrl, overrides: { agent: { prompt: { prompt: j.prompt }, firstMessage: j.firstMessage, language: j.language } } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Microphone not available.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="rounded-2xl bg-neutral-950 p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <span className={`size-2 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-white/30'}`} />
          {live ? (conv.isSpeaking ? 'Agent speaking' : 'Listening to you') : conv.status === 'connecting' || opening ? 'Connecting…' : 'Live call'}
        </div>
        
      </div>
      {live && (
        <div className="mt-3 flex h-6 items-end justify-center gap-1">
          {Array.from({ length: 18 }, (_, i) => (
            <motion.span key={i} className="w-1 rounded-full bg-white" animate={{ height: conv.isSpeaking ? [4, 22, 8, 18, 4] : [3, 6, 3] }} transition={{ duration: conv.isSpeaking ? 0.6 : 1.6, repeat: Infinity, delay: i * 0.05 }} />
          ))}
        </div>
      )}
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-5 ${m.role === 'user' ? 'rounded-br-md bg-white/15' : 'rounded-bl-md bg-white text-neutral-900'}`}>{m.text}</p>
          </div>
        ))}
      </div>
      {err && <p className="mt-2 text-[12px] text-red-300">{err}</p>}
      <div className="mt-3 flex gap-2">
        {!live ? (
          <button onClick={start} disabled={opening || conv.status === 'connecting'} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-medium text-neutral-950">
            {opening || conv.status === 'connecting' ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />} Start live call
          </button>
        ) : (
          <button onClick={() => conv.endSession()} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[14px] font-medium text-white"><PhoneOff className="size-4" /> End call</button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-white/50">You play the agency booker. Answer out loud; the agent replies in {language}.</p>
    </div>
  );
}
