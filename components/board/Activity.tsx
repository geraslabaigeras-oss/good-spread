'use client';

import { AlertTriangle, Check, FileText, MessageSquare, Plane, RotateCcw, Sparkles, UserCheck } from 'lucide-react';
import type { BoardState } from '@/lib/server/views';
import { clock } from '@/lib/format';

const KIND: Record<string, { icon: typeof Check; tone: string }> = {
  inbox_read: { icon: FileText, tone: 'bg-neutral-100 text-neutral-700' },
  inbox_applied: { icon: Plane, tone: 'bg-neutral-100 text-neutral-700' },
  inbox_logged: { icon: FileText, tone: 'bg-neutral-100 text-neutral-700' },
  conflict: { icon: AlertTriangle, tone: 'bg-red-50 text-red-600' },
  approved: { icon: Check, tone: 'bg-neutral-950 text-white' },
  sms_sent: { icon: MessageSquare, tone: 'bg-emerald-50 text-emerald-700' },
  sms_skipped: { icon: MessageSquare, tone: 'bg-neutral-100 text-neutral-500' },
  ack: { icon: UserCheck, tone: 'bg-emerald-50 text-emerald-700' },
  late: { icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
  reset: { icon: RotateCcw, tone: 'bg-neutral-100 text-neutral-500' },
  created: { icon: Sparkles, tone: 'bg-neutral-100 text-neutral-700' },
};

/** Everything that happened on this shoot, newest first, as a timeline. */
export function Activity({ events }: { events: BoardState['events'] }) {
  return (
    <section className="h-full rounded-[28px] bg-white/70 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,.05)]">
      <div className="text-[17px] font-medium">What happened</div>
      <div className="mt-4 max-h-[340px] overflow-y-auto pr-1">
        {!events.length && <p className="text-[14px] text-neutral-500">Nothing yet. Changes, fixes and messages show up here.</p>}
        <ol className="relative">
          {events.map((e, i) => {
            const k = KIND[e.type] ?? KIND.created;
            const Icon = k.icon;
            return (
              <li key={e.id} className="relative flex gap-3 pb-4">
                {i < events.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-neutral-200" />}
                <span className={`relative flex size-7 shrink-0 items-center justify-center rounded-full ${k.tone}`}><Icon className="size-3.5" /></span>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[14px] leading-5 text-neutral-900">{String(e.payload?.text ?? e.type)}</div>
                  <div className="text-[12px] text-neutral-500 tabular-nums">{clock(e.created_at)}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
