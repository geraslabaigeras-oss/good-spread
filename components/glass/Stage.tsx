'use client';

import Link from 'next/link';
import Grainient from '@/components/Grainient';
import { Wordmark } from '@/components/kit';
import { VoiceOrb } from '@/components/voice-orb';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';

const noop = () => () => {};
const lastSlug = () => { try { return localStorage.getItem('gs-last-slug') ?? 'jacket-campaign'; } catch { return 'jacket-campaign'; } };

export function Stage({ children, backdrop, voice = false }: { children: React.ReactNode; backdrop?: string | null; voice?: boolean }) {
  return (
    <div className="stage">
      {/* living background: one slow grainy colour field (React Bits Grainient), 1x pixel ratio, no blur on top */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90"><Grainient colors={['#f4f7fb', '#dce7f3', '#bccfe5', '#eef3f9']} lightMode grainAnimated grainAmount={0.1} speed={0.18} flow={1} softness={0.95} dpr={1} /></div>
      {backdrop && <div className="backdrop-img" style={{ backgroundImage: `url(${backdrop})` }} />}
      <div className="grain" />
      <div className="content">{children}</div>
      {voice && <VoiceOrb />}
    </div>
  );
}

const STEPS = [
  { n: 1, label: 'Brief', href: '/new' },
  { n: 3, label: 'Team', href: '/plan/assemble' },
  { n: 4, label: 'Production', href: '/board/jacket-campaign' },
];

export function TopBar({ step, right }: { step: number; right?: React.ReactNode }) {
  const last = useSyncExternalStore(noop, lastSlug, () => 'jacket-campaign');
  return (
    <div className="flex items-center justify-between px-8 pt-6">
      <Link href="/" aria-label="good spread"><Wordmark /></Link>
      <nav className="glass-soft relative flex gap-1 p-1">
        {STEPS.map((s) => (
          <Link key={s.n} href={s.n === 4 ? `/board/${last}` : s.href} className="relative rounded-full px-4 py-1.5 text-[13px]">
            {s.n === step && <motion.span layoutId="step-pill" className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgb(80_60_40/0.1)]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className={`relative ${s.n === step ? 'text-ink' : 'text-grey-1 hover:text-ink'}`}>
              {s.label}
            </span>
          </Link>
        ))}
      </nav>
      <div className="min-w-[120px] text-right">{right}</div>
    </div>
  );
}

/** Number that glides to its new value. */
export function AnimatedNumber({ value, format = (n: number) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const mv = useMotionValue(value);
  const [shown, setShown] = useState(format(value));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.8, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(format(v)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{shown}</span>;
}

/** Clean budget line: big total, what's left, one thin bar split by category with a cap tick. */
export function BudgetLine({
  total, cap, segments, size = 'md',
}: { total: number; cap: number; segments: { value: number; color: string }[]; size?: 'sm' | 'md' }) {
  const over = total > cap;
  const scale = Math.max(cap, total);
  const parts = segments.filter((x) => x.value > 0);
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((t, x) => t + x.value, 0));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <AnimatedNumber value={total} format={(n) => fmtEurPlain(n)} className={`font-serif leading-none tracking-[-0.04em] num ${size === 'sm' ? 'text-[30px]' : 'text-[40px]'} ${over ? 'text-conflict' : ''}`} />
        <span className={`text-[13px] num ${over ? 'text-conflict' : 'text-grey-1'}`}>{over ? `${fmtEurPlain(total - cap)} over` : `${fmtEurPlain(cap - total)} left`} of {fmtEurPlain(cap)}</span>
      </div>
      <div className="relative mt-3 h-1.5 w-full overflow-visible rounded-full bg-ink/[0.07]">
        {parts.map((x, i) => {
          const left = (starts[i] / scale) * 100;
          const width = (x.value / scale) * 100;
          return (
            <motion.span key={i} className="absolute inset-y-0 first:rounded-l-full" style={{ left: `${left}%`, background: x.color }}
              initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }} />
          );
        })}
        <span className="absolute -top-1 bottom-[-4px] w-px bg-ink" style={{ left: `${(cap / scale) * 100}%` }} />
      </div>
    </div>
  );
}

const fmtEurPlain = (n: number) => `€${Math.round(n).toLocaleString('en-US')}`;

export const CAT_COLOR: Record<string, string> = {
  talent: '#0d0d0d', crew: '#4a4744', studio: '#8a8580', travel: '#aaa59f', post: '#c8c3bd', usage: '#ddd8d1',
};

/** Card wrapper (was a 3D tilt; now a light lift on hover for performance). */
export function Tilt({ children, className, onClick, selected }: { children: React.ReactNode; className?: string; onClick?: () => void; selected?: boolean }) {
  return (
    <motion.div onClick={onClick} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}
      className={`${className ?? ''} ${selected ? 'ring-2 ring-ink' : ''}`}>
      {children}
    </motion.div>
  );
}
