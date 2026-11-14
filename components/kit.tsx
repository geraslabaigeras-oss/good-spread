'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { press, toast as toastV } from '@/lib/motion';

/* ---------- Button (§4.2) ---------- */
type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
const V: Record<Variant, string> = {
  primary: 'bg-action text-white hover:bg-action-hover disabled:bg-grey-3 disabled:text-grey-2',
  secondary: 'bg-transparent text-ink border border-hairline-strong hover:border-ink disabled:text-grey-2 disabled:hover:border-hairline-strong',
  ghost: 'bg-transparent text-ink hover:bg-grey-3 disabled:text-grey-2 disabled:hover:bg-transparent',
};
const S: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] leading-[18px] gap-1.5 [&_svg]:size-3.5',
  md: 'h-11 px-[18px] text-[14px] leading-5 gap-2 [&_svg]:size-4',
  lg: 'h-14 px-6 text-[16px] leading-6 gap-2 [&_svg]:size-[18px]',
};

export function Button({
  variant = 'secondary', size = 'md', className, children, ...rest
}: { variant?: Variant; size?: Size } & Omit<React.ComponentProps<typeof motion.button>, 'ref'>) {
  return (
    <motion.button
      {...press}
      {...rest}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors duration-[120ms] disabled:pointer-events-none',
        V[variant], S[size], className,
      )}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Status chip (§4.3) ---------- */
export type Status = 'seen' | 'not_seen' | 'no_device';
export function StatusChip({ status }: { status: Status }) {
  if (status === 'seen')
    return (
      <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-seen-tint px-2 text-[12px] font-medium leading-4 text-seen">
        <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="size-1.5 rounded-full bg-seen" />
        Seen
      </span>
    );
  if (status === 'not_seen')
    return (
      <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-hairline-strong bg-paper px-2 text-[12px] font-medium leading-4 text-ink">
        <span className="size-1.5 rounded-full border-[1.5px] border-ink" />
        Not seen yet
      </span>
    );
  return <span className="inline-flex h-[22px] items-center rounded-full border border-dashed border-hairline-strong px-2 text-[12px] font-medium leading-4 text-grey-1">No device</span>;
}

/* ---------- Chips (§4.4) ---------- */
export function SourceChip({ source }: { source: string }) {
  const base = 'inline-flex h-[18px] items-center rounded-[4px] px-1.5 font-mono text-[10px] font-medium leading-3';
  if (source === 'rate_card') return <span className={cn(base, 'bg-grey-3 text-ink')}>Rate card</span>;
  if (source === 'quote') return <span className={cn(base, 'border border-hairline-strong text-ink')}>Quote</span>;
  return <span className={cn(base, 'border border-dashed border-hairline-strong text-grey-1')}>Estimate</span>;
}

export function OvertimeChip() {
  return <span className="inline-flex h-[22px] items-center rounded-full bg-overtime-tint px-2 text-[12px] font-medium leading-4 text-overtime">Overtime</span>;
}

export function RecommendedBadge() {
  return <span className="inline-flex h-[22px] items-center rounded-full bg-action px-2 text-[12px] font-medium leading-4 text-white">Recommended</span>;
}

export function CreativeChip() {
  return (
    <span className="inline-flex h-[22px] items-center gap-1 self-start rounded-full border border-ink px-2 text-[12px] font-medium leading-4 text-ink">
      <TriangleAlert size={12} strokeWidth={1.5} /> Changes the creative
    </span>
  );
}

export function SectionHead({ label, meta, className }: { label: string; meta?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('section-head', className)}>
      <span className="label">{label}</span>
      {meta != null && <span className="truncate pl-3 font-mono text-[12px] leading-4 text-grey-1 num">{meta}</span>}
    </div>
  );
}

/** The good spread wordmark (Identity 01), drawn from /brand/logo.svg in the current text colour. */
export function Wordmark({ className = 'h-[22px]' }: { className?: string; demo?: boolean }) {
  const mask = 'url(/brand/logo.svg) no-repeat left center / contain';
  return <span role="img" aria-label="good spread" className={cn('inline-block aspect-[3372/952] bg-current align-middle text-ink', className)} style={{ WebkitMask: mask, mask }} />;
}

/* ---------- Toasts (§4.12 / §5.15) ---------- */
type T = { id: number; text: string; check?: boolean };
const ToastCtx = createContext<(text: string, opts?: { check?: boolean }) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children, position = 'bottom-right' }: { children: React.ReactNode; position?: 'bottom-right' | 'bottom-center' }) {
  const [items, setItems] = useState<T[]>([]);
  const id = useRef(0);
  const push = useCallback((text: string, opts?: { check?: boolean }) => {
    const t = { id: ++id.current, text, check: opts?.check };
    setItems((xs) => [...xs.slice(-2), t]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className={cn(
          'pointer-events-none fixed z-[60] flex flex-col gap-2',
          position === 'bottom-right' ? 'bottom-6 right-6 items-end' : 'inset-x-0 bottom-[176px] items-center',
        )}
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              variants={toastV}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex h-11 max-w-[360px] items-center gap-2 rounded-[10px] bg-ink px-4 text-[14px] font-medium leading-5 text-paper"
            >
              {t.check && <Check size={16} strokeWidth={1.5} />}
              <span className="truncate">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
