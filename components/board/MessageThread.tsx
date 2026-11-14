'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

type Msg = { id: string; name: string; role: string; photo?: string; text: string };
type Channel = 'imessage' | 'whatsapp' | 'gmail';
const CH: Record<Channel, { label: string; verb: string }> = {
  imessage: { label: 'iMessage', verb: 'Sent via iMessage' },
  whatsapp: { label: 'WhatsApp', verb: 'Sent via WhatsApp' },
  gmail: { label: 'Gmail', verb: 'Sent via Gmail' },
};

/** One message per person, one channel for all of them. Delivery ticks fill in after sending. */
export function MessageThread({ messages, title, autoKey }: { messages: Msg[]; title: string; autoKey?: string | null }) {
  const [channel, setChannel] = useState<Channel>('imessage');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [key, setKey] = useState<string | null>(null);

  // a new change (after a fix is approved) sends automatically
  useEffect(() => { if (autoKey && autoKey !== key) { setKey(autoKey); setSentAt(Date.now()); } }, [autoKey, key]);
  useEffect(() => {
    if (!sentAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [sentAt]);

  const status = (i: number) => {
    if (!sentAt) return null;
    const ms = now - sentAt;
    if (ms < 600 + i * 250) return 'sending';
    if (ms < 2600 + i * 900) return 'delivered';
    return 'seen';
  };
  const seen = messages.filter((_, i) => status(i) === 'seen').length;
  const time = sentAt ? new Date(sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div id="messages" className="mt-5 rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
        <div>
          <div className="text-[17px] font-medium">{title}</div>
          <div className="text-[13px] text-neutral-500">{sentAt ? `${CH[channel].verb} at ${time} · seen by ${seen} of ${messages.length}` : `One message per person, ready to send to ${messages.length}.`}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-neutral-100 p-1">
            {(Object.keys(CH) as Channel[]).map((c) => (
              <button key={c} onClick={() => setChannel(c)} disabled={!!sentAt} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors ${channel === c ? 'bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,.1)]' : 'text-neutral-500'} disabled:cursor-default`}>
                <BrandLogo name={c} size={14} color={channel === c ? undefined : '#9ca3af'} /> {CH[c].label}
              </button>
            ))}
          </div>
          {!sentAt && <button onClick={() => setSentAt(Date.now())} className="h-10 rounded-full bg-neutral-950 px-5 text-[14px] font-medium text-white">Send to everyone</button>}
        </div>
      </div>
      <div className="divide-y divide-black/[0.05]">
        {messages.map((m, i) => {
          const st = status(i);
          return (
            <div key={m.id} className="flex items-start gap-3 py-3">
              {m.photo ? <img src={m.photo} alt="" className="size-9 shrink-0 rounded-full object-cover object-top" /> : <span className="relative size-9 shrink-0 overflow-hidden rounded-full"><span className="gs-talent-ph absolute inset-0" /></span>}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-neutral-500"><span className="font-medium text-neutral-900">{m.name}</span> · {m.role}</div>
                <p className="mt-0.5 text-[14px] leading-5 text-neutral-800">{m.text}</p>
              </div>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[12px]">
                {st === 'sending' && <span className="text-neutral-400">Sending…</span>}
                {st === 'delivered' && <span className="inline-flex items-center gap-1 text-neutral-500"><Check className="size-3.5" /> Delivered</span>}
                {st === 'seen' && <span className="inline-flex items-center gap-1 text-[#0a84ff]"><CheckCheck className="size-3.5" /> Seen</span>}
              </span>
            </div>
          );
        })}
      </div>
      {sentAt && <p className="pt-3 text-[12px] text-neutral-400">Demo: delivery is simulated. Connected to your account, it sends from your own iMessage, WhatsApp or Gmail.</p>}
    </div>
  );
}
