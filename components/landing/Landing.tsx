'use client';

import Link from 'next/link';
import { forwardRef, useRef } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, FileText, Mail, MessageCircle, Smartphone, Sparkles, Users } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
  moment: { lands: string; call: string; newCall: string; who: string; fixes: { label: string; cost: number; people: number; creative: boolean; best: boolean }[] };
};

const ease = [0.16, 1, 0.3, 1] as const;
const eur = (n: number) => (n === 0 ? '€0' : n > 0 ? `+€${Math.round(n)}` : `−€${Math.round(-n)}`);

export function Landing({ cap, routes, best, people, moment }: Props) {
  return (
    <div className="min-h-dvh bg-[#fafaf9] text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-[#fafaf9]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-[15px] font-medium tracking-[-0.15px]">good spread</span>
          <nav className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
            <a href="#how" className="hover:text-neutral-950">How it works</a>
            <a href="#features" className="hover:text-neutral-950">Features</a>
            <Link href="/people" className="hover:text-neutral-950">Your people</Link>
          </nav>
          <Button size="lg" className="rounded-full px-5" render={<Link href="/new" />} nativeButton={false}>Start a shoot</Button>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-xs font-normal text-neutral-600">Production planning for fashion shoots</Badge>
          <h1 className="mt-6 text-balance font-serif text-5xl leading-[1.02] tracking-[-0.045em] md:text-7xl">Producers plan it.<br />Talent lives it.</h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-7 text-neutral-500">
            Drop in the flight change, the screenshot, the agency email. good spread finds what breaks, prices three fixes, and updates everyone&rsquo;s day when you approve one.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" className="h-11 rounded-full px-6" render={<Link href="/new" />} nativeButton={false}>Start a shoot</Button>
            <Button size="lg" variant="outline" className="h-11 rounded-full bg-white px-6" render={<Link href="/people" />} nativeButton={false}>Add your people</Button>
          </div>
        </motion.div>

        <div id="how" className="mt-16 scroll-mt-24">
          <Flow />
        </div>
      </section>

      {/* numbers */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-4">
          {[
            { v: routes.length, pre: '', l: 'costed plans per brief' },
            { v: best.total, pre: '€', l: `cheapest plan under the €${cap.toLocaleString('en-US')} cap` },
            { v: moment.fixes.length, pre: '', l: 'priced fixes per change' },
            { v: people, pre: '', l: 'phones updated in one approve' },
          ].map((x) => (
            <div key={x.l} className="bg-white px-6 py-8">
              <div className="font-serif text-4xl tracking-[-0.04em] tabular-nums md:text-5xl">{x.pre}<NumberTicker value={x.v} className="tracking-[-0.04em] text-neutral-950" /></div>
              <div className="mt-2 text-sm text-neutral-500">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-serif text-4xl tracking-[-0.04em] md:text-5xl">One plan for the whole shoot.</h2>
          <p className="mt-4 text-lg text-neutral-500">AI only reads the messy input. Every cost, call time and fix is calculated by code, so the numbers hold up.</p>
        </div>
        <BentoGrid className="mt-12 auto-rows-[20rem] lg:grid-cols-3">
          <BentoCard
            name="Reads the inbox" Icon={FileText} href="/new" cta="Start a shoot" className="lg:col-span-1"
            description="Flight PDFs, WhatsApp screenshots and agency emails become structured updates."
            background={<InboxVisual />}
          />
          <BentoCard
            name="Three fixes, priced" Icon={Sparkles} href="/new" cta="Start a shoot" className="lg:col-span-2"
            description={`${moment.who} now lands ${moment.lands} and misses ${moment.call} hair and makeup. Pick a fix; the cost is exact.`}
            background={<FixesVisual fixes={moment.fixes} />}
          />
          <BentoCard
            name="Your people" Icon={Users} href="/people" cta="Add your people" className="lg:col-span-2"
            description="The models and crew you actually book. Find models on models.com, message them on WhatsApp or iMessage."
            background={<PeopleVisual />}
          />
          <BentoCard
            name="Everyone's day, live" Icon={Smartphone} href="/people" cta="Add your people" className="lg:col-span-1"
            description="Each person gets their own page and a text. They tap Got it; you see who has seen it."
            background={<PhoneVisual m={moment} />}
          />
        </BentoGrid>
      </section>

      {/* closing */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-neutral-950 px-8 py-14 text-white md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="font-serif text-4xl tracking-[-0.04em] md:text-5xl">Plan your next shoot.</h2>
            <p className="mt-3 text-neutral-400">Start with one reference image. No account needed.</p>
          </div>
          <Button size="lg" variant="secondary" className="h-11 rounded-full px-6" render={<Link href="/new" />} nativeButton={false}>Start a shoot</Button>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-10 text-sm text-neutral-500 md:flex-row">
          <span><span className="font-medium text-neutral-950">good spread</span> · Built at Unfair Weekend Vilnius, 2026</span>
          <span>Plans use only the people you add. Flights and hotels are estimates until booked.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- inputs → good spread → people (Magic UI Animated Beam) ---------- */

const Node = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode; label: string }>(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-2">
    <div ref={ref} className={cn('z-10 flex size-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]', className)}>
      {children}
    </div>
    <span className="whitespace-nowrap text-xs text-neutral-500">{label}</span>
  </div>
));
Node.displayName = 'Node';

function Flow() {
  const box = useRef<HTMLDivElement>(null);
  const i1 = useRef<HTMLDivElement>(null);
  const i2 = useRef<HTMLDivElement>(null);
  const i3 = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const o1 = useRef<HTMLDivElement>(null);
  const o2 = useRef<HTMLDivElement>(null);
  const o3 = useRef<HTMLDivElement>(null);
  const o4 = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="relative mx-auto flex h-[380px] w-full max-w-4xl items-center justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white px-8 md:px-20">
      <div className="flex flex-col gap-9">
        <Node ref={i1} label="Flight PDF"><FileText className="size-6" strokeWidth={1.5} /></Node>
        <Node ref={i2} label="WhatsApp screenshot"><MessageCircle className="size-6" strokeWidth={1.5} /></Node>
        <Node ref={i3} label="Agency email"><Mail className="size-6" strokeWidth={1.5} /></Node>
      </div>
      <Node ref={hub} label="Finds the conflict, prices 3 fixes" className="size-24 border-neutral-950 bg-neutral-950 text-white">
        <span className="text-center text-[13px] font-medium leading-4">good<br />spread</span>
      </Node>
      <div className="flex flex-col gap-4">
        <Node ref={o1} label="Model" className="size-11"><Smartphone className="size-5" strokeWidth={1.5} /></Node>
        <Node ref={o2} label="Photographer" className="size-11"><Smartphone className="size-5" strokeWidth={1.5} /></Node>
        <Node ref={o3} label="Hair & makeup" className="size-11"><Smartphone className="size-5" strokeWidth={1.5} /></Node>
        <Node ref={o4} label="Stylist" className="size-11"><Smartphone className="size-5" strokeWidth={1.5} /></Node>
      </div>
      {[i1, i2, i3].map((r, k) => (
        <AnimatedBeam key={`in${k}`} containerRef={box} fromRef={r} toRef={hub} curvature={(k - 1) * -50} pathColor="#a3a3a3" gradientStartColor="#0a0a0a" gradientStopColor="#737373" duration={4} delay={k * 0.4} />
      ))}
      {[o1, o2, o3, o4].map((r, k) => (
        <AnimatedBeam key={`out${k}`} containerRef={box} fromRef={hub} toRef={r} curvature={(k - 1.5) * -35} pathColor="#a3a3a3" gradientStartColor="#0a0a0a" gradientStopColor="#737373" duration={4} delay={1.6 + k * 0.2} />
      ))}
    </div>
  );
}

/* ---------- bento backgrounds ---------- */

function InboxVisual() {
  const rows = [
    { i: FileText, t: 'flight_change.pdf', s: 'lands 10:45' },
    { i: MessageCircle, t: 'WhatsApp screenshot', s: '30 min late' },
    { i: Mail, t: 'Agency email', s: 'rate confirmed' },
  ];
  return (
    <div className="absolute inset-x-4 top-4 space-y-2 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
      {rows.map((r) => (
        <div key={r.t} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm transition-transform duration-300 group-hover:translate-x-1">
          <r.i className="size-4 text-neutral-500" strokeWidth={1.5} />
          <span className="flex-1 truncate">{r.t}</span>
          <span className="text-xs text-neutral-500">{r.s}</span>
        </div>
      ))}
    </div>
  );
}

function FixesVisual({ fixes }: { fixes: Props['moment']['fixes'] }) {
  return (
    <div className="absolute inset-x-4 top-4 grid grid-cols-3 gap-2 [mask-image:linear-gradient(to_bottom,#000_65%,transparent)]">
      {fixes.map((f) => (
        <div key={f.label} className={cn('rounded-xl border p-4 transition-transform duration-300 group-hover:-translate-y-1', f.best ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white')}>
          <div className={cn('text-xs', f.best ? 'text-neutral-400' : 'text-neutral-500')}>{f.best ? 'Recommended' : f.creative ? 'Changes casting' : 'Overtime'}</div>
          <div className="mt-1 text-sm font-medium">{f.label}</div>
          <div className="mt-4 font-serif text-3xl tracking-[-0.04em] tabular-nums">{eur(f.cost)}</div>
          <div className={cn('mt-1 text-xs', f.best ? 'text-neutral-400' : 'text-neutral-500')}>{f.people} people</div>
        </div>
      ))}
    </div>
  );
}

function PeopleVisual() {
  const rows = [
    { r: 'Model', c: 'Vilnius', d: '€400' },
    { r: 'Model', c: 'Riga · flies in', d: '€450' },
    { r: 'Photographer', c: 'Vilnius', d: '€600' },
    { r: 'Hair & makeup', c: 'Vilnius', d: '€300' },
  ];
  return (
    <div className="absolute inset-x-4 top-4 grid grid-cols-2 gap-2 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
      {rows.map((x, k) => (
        <div key={k} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><Users className="size-4" strokeWidth={1.5} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{x.r}</div>
            <div className="truncate text-xs text-neutral-500">{x.c}</div>
          </div>
          <span className="text-xs tabular-nums text-neutral-500">{x.d}/day</span>
        </div>
      ))}
    </div>
  );
}

function PhoneVisual({ m }: { m: Props['moment'] }) {
  return (
    <div className="absolute left-1/2 top-4 w-[200px] -translate-x-1/2 rounded-[28px] bg-neutral-950 p-1.5 transition-transform duration-300 group-hover:-translate-y-1 [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
      <div className="rounded-[22px] bg-white px-4 pb-5 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500"><CalendarClock className="size-3" /> Your day · updated</div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-sm text-neutral-400 line-through">{m.call}</span>
          <span className="font-serif text-4xl tracking-[-0.04em] tabular-nums">{m.newCall}</span>
        </div>
        <div className="mt-1 text-xs text-neutral-500">Call time · lands {m.lands}</div>
        <div className="mt-4 flex h-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-medium text-white">Got it</div>
      </div>
    </div>
  );
}
