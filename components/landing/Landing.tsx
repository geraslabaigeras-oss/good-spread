'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { motion } from 'motion/react';
import { TextAnimate } from '@/components/ui/text-animate';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';
import { Safari } from '@/components/ui/safari';
import { Iphone } from '@/components/ui/iphone';
import { BrandLogo } from '@/components/brand-logo';
import { AnimatedList } from '@/components/ui/animated-list';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { Change as RollChange } from '@/components/flow/ui';
import '@/components/flow/flow-theme.css';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
  moment: { lands: string; call: string; newCall: string; who: string; fixes: { label: string; cost: number; people: number; creative: boolean; best: boolean }[] };
};

// Free Unsplash-licensed photography (unsplash.com/license). Credits in the footer.
const u = (id: string, w = 1400) => `https://images.unsplash.com/${id}?fm=jpg&q=60&w=${w}&auto=format&fit=crop`;
const PHOTOS = [
  { id: 'photo-1613915617430-8ab0fd7c6baf', by: 'Chyntia Juls' },
  { id: 'photo-1692180142575-c31fcd106b5b', by: 'Tamara Harhai' },
  { id: 'photo-1508964801641-4b2410705b73', by: 'Nick Karvounis' },
  { id: 'photo-1590972381381-c863cbbf9dd2', by: 'Happy Face Emoji' },
  { id: 'photo-1635262090780-2ed9e994fff4', by: 'mahdi chaghari' },
  { id: 'photo-1550872199-63f4382fe925', by: 'chantelle taylor' },
];

const eur = (n: number) => `€${Math.round(n).toLocaleString('en-US')}`;
const delta = (n: number) => (n === 0 ? '€0' : n > 0 ? `+€${Math.round(n)}` : `−€${Math.round(-n)}`);

/** Film grain over fog (Trelli / Rawdose). */
function Grain() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-[0.12] mix-blend-overlay">
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

function Pill({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3.5 text-[11px] font-medium uppercase tracking-[0.06em] backdrop-blur-md ${dark ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)]' : 'bg-neutral-900/[0.07] text-neutral-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,.6)]'}`}>
      {children}
    </span>
  );
}

/** A photo that floats in gently and then drifts up and down. */
function Float({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={`absolute z-10 ${className ?? ''}`} initial={{ opacity: 0, y: 30, scale: 0.94 }} animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
      transition={{ opacity: { duration: 0.9, delay }, scale: { duration: 0.9, delay }, y: { duration: 6, delay: delay + 0.9, repeat: Infinity, ease: 'easeInOut' } }}>
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`absolute inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,.1)] ${className ?? ''}`}>
      <span className="flex size-4 items-center justify-center rounded-full bg-neutral-950 text-[9px] text-white">✓</span>{children}
    </span>
  );
}

function Panel({ pill, title, children, beam }: { pill: string; title: string; children: React.ReactNode; beam?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-white/45 p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7),0_18px_48px_rgba(80,60,40,.07)] backdrop-blur-xl">
      <Pill>{pill}</Pill>
      <h3 className="mb-4 mt-5 text-2xl font-light tracking-[-0.02em]">{title}</h3>
      {children}
      {beam && <BorderBeam size={140} duration={7} colorFrom="#0a0a0a" colorTo="#9aa7b0" />}
    </div>
  );
}

function Bubble({ children, tone }: { children: React.ReactNode; tone: 'alert' | 'best' | 'plain' | 'ok' }) {
  const c = tone === 'alert' ? 'bg-red-50 text-red-700' : tone === 'best' ? 'bg-neutral-950 text-white' : tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-neutral-800';
  return <div className={`flex w-full items-center rounded-2xl px-4 py-2.5 text-[14px] shadow-[0_4px_14px_rgba(0,0,0,.05)] ${c}`}>{children}</div>;
}

export function Landing({ cap, stills, routes, best, people, moment }: Props) {
  const steps = [
    { k: 'Brief', t: 'Drop a reference. You get the look, palette, light and shot list.' },
    { k: 'Plans', t: `${routes.length} ways to make it, each costed against the €${cap.toLocaleString('en-US')} cap.` },
    { k: 'Team', t: 'The people you actually book. Message them on WhatsApp or iMessage.' },
    { k: 'Shoot day', t: `A change lands, three fixes are priced, ${people} phones update on approve.` },
  ];

  return (
    <div className="bg-[#efeee9] font-sans text-neutral-900">
      {/* Hero: editorial serif + floating real photos in shapes with live chips (after the team's own good-spread hero) */}
      <section className="relative h-[100svh] min-h-[720px] w-full overflow-hidden bg-[#f7f6f3]">
        <Grain />
        <header className="absolute inset-x-0 top-0 z-30 mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-[14px] text-neutral-700">
          <span className="font-medium text-neutral-900">good spread</span>
          <nav className="flex items-center gap-8">
            <a href="#how" className="hidden hover:text-neutral-950 md:inline">How it works</a>
            <Link href="/people" className="hidden hover:text-neutral-950 md:inline">Your people</Link>
            <Link href="/new" className="rounded-full bg-neutral-950 px-5 py-2.5 text-white">Start a shoot</Link>
          </nav>
        </header>

        {/* floating photos: circle, arch, ticket, rounded */}
        <Float className="left-[8%] top-[24%] hidden md:block" delay={0.1}>
          <img src={u('photo-1590972381381-c863cbbf9dd2', 500)} alt="" className="size-40 rounded-full object-cover object-top shadow-[0_20px_50px_rgba(0,0,0,.12)]" />
          <Chip className="-bottom-5 left-[-30px]">Brief read · {stills} stills · {eur(cap)}</Chip>
        </Float>
        <Float className="left-[44%] top-[8%] hidden md:block" delay={0.25}>
          <img src={u('photo-1613915617430-8ab0fd7c6baf', 400)} alt="" className="h-40 w-32 rounded-[22px] object-cover object-top shadow-[0_20px_50px_rgba(0,0,0,.12)]" />
        </Float>
        <Float className="right-[9%] top-[20%] hidden md:block" delay={0.4}>
          <img src="/photos/loc/loc-court2.jpg" alt="" className="h-52 w-44 rounded-t-full object-cover shadow-[0_20px_50px_rgba(0,0,0,.12)]" />
          <Chip className="-bottom-4 right-[-10px]">Pilies courtyard · scouted</Chip>
        </Float>
        <Float className="bottom-[9%] left-[11%] hidden md:block" delay={0.55}>
          <div className="relative h-32 w-48 overflow-hidden rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,.12)] [mask-image:radial-gradient(circle_at_0_50%,transparent_12px,black_13px),radial-gradient(circle_at_100%_50%,transparent_12px,black_13px)] [mask-composite:intersect]">
            <img src={u('photo-1692180142575-c31fcd106b5b', 500)} alt="" className="size-full object-cover" />
          </div>
        </Float>
        <Float className="bottom-[8%] right-[13%] hidden md:block" delay={0.7}>
          <img src={u('photo-1550872199-63f4382fe925', 500)} alt="" className="h-40 w-36 rounded-[44px] object-cover object-top shadow-[0_20px_50px_rgba(0,0,0,.12)]" />
          <Chip className="-top-4 left-[-40px]">Call moved {moment.call} → {moment.newCall}</Chip>
        </Float>

        <div className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center">
          <TextAnimate animation="blurInUp" by="word" as="h1" className="max-w-4xl font-[family-name:var(--font-instrument)] text-5xl leading-[1.02] tracking-[-0.02em] text-neutral-950 md:text-[84px]">
            Your shoot, produced by an agent that makes the calls.
          </TextAnimate>
          <TextAnimate animation="blurIn" by="word" delay={0.5} as="p" className="mt-6 max-w-xl text-[17px] leading-7 text-neutral-700">
            Stay creative. We organise the rest: real locations, your people, agency calls, the budget, and every change on the day.
          </TextAnimate>
          <div className="mt-9 flex items-center gap-3 text-[15px]">
            <Link href="/new" className="rounded-full bg-neutral-950 px-7 py-3.5 text-white">Start a shoot</Link>
            <Link href="/people" className="rounded-full bg-white/70 px-7 py-3.5 text-neutral-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]">Add your people</Link>
          </div>
        </div>
      </section>

      {/* How it works, shown: the real board on a laptop and the real crew page on a phone (Magic UI Safari + iPhone frames) */}
      <section id="how" className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f6f3_0%,#eceeed_55%,#d6dee3_100%)] px-4 py-24 md:px-10">
        <Grain />
        <div className="relative z-[2] mx-auto max-w-6xl">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <h2 className="font-[family-name:var(--font-instrument)] text-5xl leading-[1] tracking-[-0.02em] md:text-6xl">A flight lands late.<br /><span className="italic text-neutral-500">Everyone knows in seconds.</span></h2>
            <p className="max-w-md text-[16px] leading-7 text-neutral-600 md:justify-self-end">You see the clash and three priced fixes on your board. Approve one, and each person gets a text and their new call time on their phone.</p>
          </div>

          <div className="relative mt-14">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.9 }} className="md:mr-[22%]">
              <Safari url="good-spread.app/board" imageSrc="/screens/board.jpg" className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,.18)]" />
              <p className="mt-3 text-[13px] text-neutral-500">Your board: the clash in red, three fixes with their exact cost.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.9, delay: 0.25 }} className="relative mx-auto mt-10 w-[260px] md:absolute md:-bottom-10 md:right-0 md:mt-0 md:w-[300px]">
              <Iphone src="/screens/myday.jpg" className="drop-shadow-[0_30px_60px_rgba(0,0,0,.25)]" />
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 1.1, type: 'spring' }}
                className="absolute -left-10 top-16 w-[280px] rounded-2xl bg-white/90 p-3 shadow-[0_18px_40px_rgba(0,0,0,.18)] backdrop-blur-xl md:-left-24">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500"><BrandLogo name="imessage" size={14} /> Messages · now</div>
                <p className="mt-1 text-[13px] leading-[18px] text-neutral-900"><b>good spread:</b> Your call moved {moment.call} → {moment.newCall}. Tap to confirm.</p>
              </motion.div>
              <p className="mt-3 text-center text-[13px] text-neutral-500">Their phone: new call time, where to be, Got it.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Aceternity Apple Cards Carousel with real photography */}
      <section className="py-20">
        <Carousel
          items={[
            { c: 'Brief', t: 'Drop a reference. Get the brief.' },
            { c: 'Plans', t: `${routes.length} ways to make it, each costed.` },
            { c: 'Team', t: 'Book the people you actually work with.' },
            { c: 'Shoot day', t: 'A flight lands late. Three fixes, priced.' },
            { c: 'On set', t: 'Everyone has their day on their phone.' },
            { c: 'Wrap', t: 'Statements per person.' },
          ].map((x, i) => (
            <Card key={x.t} index={i} card={{ src: u(PHOTOS[i].id), category: x.c, title: x.t, content: <p className="text-base text-neutral-600 md:text-xl">{steps[Math.min(i, steps.length - 1)].t}</p> }} />
          ))}
        />
      </section>

      {/* Trelli close */}
      <section className="px-4 pb-10 md:px-10">
        <div className="relative mx-auto flex h-[70vh] max-w-7xl flex-col items-center justify-center overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#d4d3d1_0%,#8e8e8b_38%,#3a3a37_72%,#1f1f1d_100%)] text-center text-white">
          <Grain />
          <div className="relative z-[3]">
            <p className="text-4xl font-light tracking-[-0.03em] md:text-6xl">Plan your next shoot.</p>
            <p className="mt-4 text-[15px] text-white/70">Start with one reference image.</p>
            <Link href="/new" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-neutral-900">Start a shoot</Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-12 pt-4 text-[12.5px] text-neutral-500 md:px-10">
        <p><span className="text-neutral-900">good spread®</span> · Built at Unfair Weekend Vilnius, 2026</p>
        <p className="mt-1.5">Photography from Unsplash by {PHOTOS.map((p) => p.by).join(', ')}.</p>
      </footer>
    </div>
  );
}
