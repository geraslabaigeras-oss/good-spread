'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { forwardRef, useRef } from 'react';
import { ArrowRight, CalendarClock, CheckCheck, FileText, Mail, MessageCircle, MessageSquareText, Smartphone, Sparkles, Users, Wallet, Zap } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { BorderBeam } from '@/components/ui/border-beam';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { Iphone } from '@/components/ui/iphone';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Spotlight } from '@/components/ui/spotlight';
import { TextAnimate } from '@/components/ui/text-animate';
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

export function Landing({ cap, routes, best, people, moment }: Props) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#fafaf9] font-sans text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#fafaf9]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-serif text-[22px] tracking-[-0.01em]">good spread</span>
          <nav className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
            <a href="#product" className="transition-colors hover:text-neutral-950">Product</a>
            <a href="#talent" className="transition-colors hover:text-neutral-950">For talent</a>
            <a href="#features" className="transition-colors hover:text-neutral-950">Features</a>
            <Link href="/people" className="transition-colors hover:text-neutral-950">Your people</Link>
          </nav>
          <Button className="h-9 rounded-full px-4" render={<Link href="/new" />} nativeButton={false}>Start a shoot</Button>
        </div>
      </header>

      {/* hero: Aceternity Spotlight + Magic UI shiny text, text animate, shimmer button */}
      <section className="relative">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#d4cfc7" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 text-center md:pt-32">
          <div className="inline-flex rounded-full border border-neutral-200 bg-white">
            <AnimatedShinyText className="inline-flex items-center gap-1.5 px-4 py-1 text-sm">
              <Sparkles className="size-3.5" /> Production planning for fashion shoots
            </AnimatedShinyText>
          </div>
          <h1 className="mt-7 font-serif text-[56px] leading-[0.95] tracking-[-0.02em] md:text-[96px]">
            <TextAnimate animation="blurInUp" by="word" as="span" className="block">Producers plan it.</TextAnimate>
            <TextAnimate animation="blurInUp" by="word" as="span" delay={0.35} className="block italic text-neutral-500">Talent lives it.</TextAnimate>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-balance text-lg leading-7 text-neutral-500">
            Drop in the flight change, the screenshot, the agency email. You get the conflict, three priced fixes, and every person&rsquo;s new day the moment you approve one.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/new">
              <ShimmerButton background="#0a0a0a" className="h-12 px-7 text-[15px] font-medium">Start a shoot <ArrowRight className="ml-2 size-4" /></ShimmerButton>
            </Link>
            <Button variant="outline" className="h-12 rounded-full bg-white px-7 text-[15px]" render={<Link href="/people" />} nativeButton={false}>Add your people</Button>
          </div>
        </div>

        {/* Aceternity Container Scroll with the real production board */}
        <div id="product" className="-mt-24 md:-mt-40">
          <ContainerScroll titleComponent={<span className="sr-only">The production board</span>}>
            <img src="/screens/board.jpg" alt="The good spread production board: timeline, a conflict and a recommended fix" className="size-full rounded-2xl object-cover object-left-top" draggable={false} />
          </ContainerScroll>
        </div>
      </section>

      {/* numbers: Magic UI Number Ticker */}
      <section className="mx-auto -mt-24 max-w-6xl px-6 md:-mt-40">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-4">
          {[
            { v: routes.length, pre: '', l: 'costed plans per brief' },
            { v: best.total, pre: '€', l: `cheapest plan under a €${cap.toLocaleString('en-US')} cap` },
            { v: moment.fixes.length, pre: '', l: 'priced fixes per change' },
            { v: people, pre: '', l: 'phones updated in one approve' },
          ].map((x) => (
            <div key={x.l} className="bg-white px-6 py-8">
              <div className="font-serif text-5xl tabular-nums tracking-[-0.02em]">{x.pre}<NumberTicker value={x.v} className="text-neutral-950" /></div>
              <div className="mt-2 text-sm text-neutral-500">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* talent side: Magic UI iPhone mockup with the real phone page + Animated List */}
      <section id="talent" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-16 px-6 py-28 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-neutral-500">For talent and crew</p>
          <h2 className="mt-3 font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-6xl">Their day, on their phone. <span className="italic text-neutral-500">Live.</span></h2>
          <p className="mt-5 max-w-md text-lg leading-7 text-neutral-500">Everyone scans one QR code and gets their own page: call time, where to be, their looks. When you approve a change they get a text, and you see who has seen it.</p>
          <div className="relative mt-10 h-[300px] overflow-hidden">
            <AnimatedList delay={1600}>
              {NOTES.map((n) => <Note key={n.title} {...n} />)}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#fafaf9]" />
          </div>
        </div>
        <div className="relative mx-auto w-[300px] md:w-[340px]">
          <Iphone src="/screens/myday.jpg" />
        </div>
      </section>

      {/* how: Magic UI Animated Beam */}
      <section className="border-y border-neutral-200 bg-white py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-neutral-500">How it works</p>
            <h2 className="mt-3 font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-6xl">Messy inbox in. <span className="italic text-neutral-500">Clear day out.</span></h2>
            <p className="mt-5 text-lg text-neutral-500">AI only reads the documents. Every cost, call time and fix is calculated by code, so the numbers hold up.</p>
          </div>
          <div className="mt-14"><Flow /></div>
        </div>
      </section>

      {/* features: Magic UI Magic Card + Border Beam */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
        <h2 className="max-w-xl font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-6xl">One plan for the whole shoot.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <MagicCard key={f.title} className="relative overflow-hidden rounded-2xl" gradientFrom="#a8a29e" gradientTo="#e7e5e4">
              <div className="p-7">
                <f.icon className="size-6 text-neutral-900" strokeWidth={1.5} />
                <h3 className="mt-6 text-lg font-medium tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-neutral-500">{f.text}</p>
              </div>
              {i === 1 && <BorderBeam size={120} duration={8} colorFrom="#0a0a0a" colorTo="#a8a29e" />}
            </MagicCard>
          ))}
        </div>
      </section>

      {/* closing: Magic UI Flickering Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-8 py-20 text-center text-white md:px-14">
          <FlickeringGrid className="absolute inset-0 z-0 [mask-image:radial-gradient(520px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#a8a29e" maxOpacity={0.35} flickerChance={0.1} />
          <div className="relative z-10">
            <h2 className="font-serif text-5xl leading-[1] tracking-[-0.02em] md:text-7xl">Plan your next shoot.</h2>
            <p className="mx-auto mt-4 max-w-md text-neutral-400">Start with one reference image. No account needed.</p>
            <div className="mt-8 flex justify-center">
              <Link href="/new"><ShimmerButton background="#fafaf9" shimmerColor="#0a0a0a" className="h-12 px-7 text-[15px] font-medium !text-neutral-950">Start a shoot <ArrowRight className="ml-2 size-4" /></ShimmerButton></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-10 text-sm text-neutral-500 md:flex-row">
          <span><span className="font-serif text-base text-neutral-950">good spread</span> · Built at Unfair Weekend Vilnius, 2026</span>
          <span>Plans use only the people you add. Flights and hotels are estimates until booked.</span>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: FileText, title: 'Reads the inbox', text: 'Flight PDFs, WhatsApp screenshots and agency emails become structured updates you confirm with one tap.' },
  { icon: Zap, title: 'Three fixes, priced', text: 'Swap the order, shift the day or replace someone. Each fix shows its exact cost and who it affects.' },
  { icon: Users, title: 'Your people', text: 'The models and crew you actually book. Find models on models.com and message them on WhatsApp or iMessage.' },
  { icon: Smartphone, title: 'Live pages for everyone', text: 'One QR code. Each person sees only their own day and taps Got it when they have read the change.' },
  { icon: Wallet, title: 'Budget against the cap', text: 'Rates, agency fees, travel, overtime and usage add up live. Overtime is calculated, never typed.' },
  { icon: CalendarClock, title: 'Wrap statements', text: 'Hours, overtime and agency fees per person, ready when the shoot ends.' },
];

const NOTES = [
  { icon: FileText, title: 'Flight change read', body: 'Model A lands 10:45 · from flight_change.pdf', time: 'now' },
  { icon: Zap, title: 'Fix approved', body: 'Swap order · €0 · 5 people updated', time: 'now' },
  { icon: MessageSquareText, title: 'Texts sent', body: 'New call times to 4 phones', time: 'now' },
  { icon: CheckCheck, title: 'Model A tapped Got it', body: 'Call 11:30 · seen on the board', time: 'now' },
];

function Note({ icon: Icon, title, body, time }: (typeof NOTES)[number]) {
  return (
    <figure className="relative mx-auto w-full max-w-md cursor-default overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,.02),0_2px_4px_rgba(0,0,0,.04),0_12px_24px_rgba(0,0,0,.04)] transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-950 text-white"><Icon className="size-4" strokeWidth={1.75} /></div>
        <div className="min-w-0 flex-1">
          <figcaption className="flex items-center gap-2 text-sm font-medium">{title}<span className="text-xs font-normal text-neutral-400">· {time}</span></figcaption>
          <p className="truncate text-sm text-neutral-500">{body}</p>
        </div>
      </div>
    </figure>
  );
}

/* ---------- inputs → engine → phones (Magic UI Animated Beam) ---------- */

const Node = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode; label?: string }>(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-2">
    <div ref={ref} className={cn('z-10 flex size-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]', className)}>
      {children}
    </div>
    {label && <span className="whitespace-nowrap text-xs text-neutral-500">{label}</span>}
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
    <div ref={box} className="relative mx-auto flex h-[380px] w-full max-w-4xl items-center justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-[#fafaf9] px-8 md:px-20">
      <div className="flex flex-col gap-9">
        <Node ref={i1} label="Flight PDF"><FileText className="size-6" strokeWidth={1.5} /></Node>
        <Node ref={i2} label="WhatsApp screenshot"><MessageCircle className="size-6" strokeWidth={1.5} /></Node>
        <Node ref={i3} label="Agency email"><Mail className="size-6" strokeWidth={1.5} /></Node>
      </div>
      <Node ref={hub} className="size-20 border-neutral-950 bg-neutral-950 text-white">
        <Zap className="size-8" strokeWidth={1.5} />
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
