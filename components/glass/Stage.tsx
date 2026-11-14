'use client';

import Link from 'next/link';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

export function Stage({ children, backdrop }: { children: React.ReactNode; backdrop?: string | null }) {
  return (
    <div className="stage">
      <div className="aurora"><span /><span /><span /></div>
      {backdrop && <div className="backdrop-img" style={{ backgroundImage: `url(${backdrop})` }} />}
      <div className="grain" />
      <div className="content">{children}</div>
    </div>
  );
}

const STEPS = [
  { n: 1, label: 'Brief', href: '/new' },
  { n: 2, label: 'Strategies', href: '/plan' },
  { n: 3, label: 'Team', href: '/plan/assemble' },
  { n: 4, label: 'Production', href: '/board/jacket-campaign' },
];

export function TopBar({ step, right }: { step: number; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-8 pt-6">
      <span className="font-mono text-[12px] font-medium uppercase tracking-[0.22em]">Good Spread</span>
      <nav className="glass-soft relative flex gap-1 p-1">
        {STEPS.map((s) => (
          <Link key={s.n} href={s.href} className="relative rounded-full px-4 py-1.5 text-[13px]">
            {s.n === step && <motion.span layoutId="step-pill" className="absolute inset-0 rounded-full bg-white/15" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className={`relative ${s.n === step ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
              <span className="font-mono text-[11px] opacity-60">0{s.n}</span> {s.label}
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

/** Budget ring: segments per category, sweep animates; cap = full circle. */
export function BudgetRing({
  segments, cap, size = 168, stroke = 14, children,
}: { segments: { value: number; color: string }[]; cap: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const over = total > cap;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = Math.min(s.value / Math.max(cap, total), 1);
          const start = acc;
          acc += frac;
          return (
            <motion.circle
              key={i}
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${C}`, strokeDashoffset: -start * C }}
              animate={{ strokeDasharray: `${Math.max(frac * C - 2, 0)} ${C}`, strokeDashoffset: -start * C }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.05 }}
            />
          );
        })}
        {over && <circle cx={size / 2} cy={size / 2} r={r + stroke / 2 + 4} fill="none" stroke="var(--g-bad)" strokeWidth={1.5} strokeDasharray="4 4" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export const CAT_COLOR: Record<string, string> = {
  talent: '#8fa8ff', crew: '#b59bff', studio: '#ffb38a', travel: '#ff8ac6', post: '#7ee2d0', usage: '#e9e3a6',
};

/** Tilt-on-hover wrapper for cards. */
export function Tilt({ children, className, onClick, selected }: { children: React.ReactNode; className?: string; onClick?: () => void; selected?: boolean }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useTransform(y, [-0.5, 0.5], [6, -6]);
  const ry = useTransform(x, [-0.5, 0.5], [-8, 8]);
  return (
    <motion.div
      onClick={onClick}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.98 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`${className ?? ''} ${selected ? 'ring-2 ring-[var(--g-accent)]' : ''}`}
    >
      {children}
    </motion.div>
  );
}
