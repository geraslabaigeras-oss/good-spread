'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Wordmark } from '@/components/kit';
import { motion } from 'motion/react';
import Grainient from '@/components/Grainient';
import { TextAnimate } from '@/components/ui/text-animate';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';
import { Safari } from '@/components/ui/safari';
import { DevicePhone } from '@/components/device-phone';
import { MessagesScreen } from '@/components/messages-screen';
import { BrandLogo } from '@/components/brand-logo';
import { HeroDrop } from '@/components/hero-drop';
import { PlansChange } from './PlansChange';
import { flagUrl } from '@/lib/agencies';
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
import LOC_ALL from '@/data/europe/locations.json';
const LOC_SHOWCASE = (LOC_ALL as { name: string; city: string; country: string; image_url: string }[]).filter((l) => ['Cabo da Roca', 'Étretat cliffs', 'Reynisfjara black-sand beach'].includes(l.name));
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
    <span className={`inline-flex h-7 items-center rounded-full px-3.5 text-[11px] font-medium backdrop-blur-md ${dark ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)]' : 'bg-neutral-900/[0.07] text-neutral-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,.6)]'}`}>
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

/** A card floating out of the hero stage with a little 3D depth. */
function Pop({ children, className, depth, delay = 0 }: { children: React.ReactNode; className?: string; depth?: { rotateX?: number; rotateY?: number; rotateZ?: number }; delay?: number }) {
  return (
    <motion.div className={`absolute z-10 ${className ?? ''}`} style={{ transformPerspective: 1000, ...depth }}
      initial={{ opacity: 0, y: 30, scale: 0.92 }} animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{ opacity: { duration: 0.8, delay }, scale: { duration: 0.8, delay }, y: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.8 } }}>
      {children}
    </motion.div>
  );
}

function Feature({ title, tag, date, light, children }: { title: string; tag: string; date: string; light?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className={`relative aspect-square overflow-hidden rounded-[22px] ${light ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]' : ''}`}>{children}</div>
      <div className="mt-4 px-1">
        <p className="text-[19px] leading-6 tracking-[-0.01em] text-neutral-950">{title}</p>
        <p className="mt-2 text-[14px]"><span className="text-neutral-900">{tag}</span> <span className="ml-2 text-neutral-400">{date}</span></p>
      </div>
    </div>
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
    <div className="relative bg-[#f4f7fb] font-sans text-neutral-900">
      {/* one slow blue liquid behind the whole page, grain on top */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80"><Grainient colors={['#f6f9fc', '#dbe6f3', '#b7cbe3', '#eef3f9']} lightMode grainAnimated={false} grainAmount={0.08} speed={0.4} flow={1.4} softness={0.92} dpr={0.75} /></div>
      <div className="pointer-events-none fixed inset-0 z-0"><div className="gs-grain" /></div>
      {/* Hero: headline, then one living stage (Grainient, our fog palette) with the product's moments floating out in 3D */}
      <section className="relative z-[1] overflow-hidden pb-24">
        <header className="relative z-30 mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-[14px] text-neutral-700">
          <Wordmark className="h-[24px]" />
          <nav className="flex items-center gap-8">
            <a href="#agent" className="hidden hover:text-neutral-950 md:inline">How it works</a><a href="#changes" className="hidden hover:text-neutral-950 md:inline">When things change</a>
            <Link href="/people" className="hidden hover:text-neutral-950 md:inline">Your people</Link>
            <Link href="/new" className="rounded-full bg-neutral-950 px-5 py-2.5 text-white">Start a shoot</Link>
          </nav>
        </header>

        <div className="relative z-20 mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-6 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} className="text-5xl font-normal leading-[1.02] tracking-[-0.04em] text-neutral-950 md:text-[72px]">
              Stay creative.<br /><span className="text-neutral-400">Production&rsquo;s handled.</span>
            </motion.h1>
            <p className="mt-6 max-w-md text-[17px] leading-7 text-neutral-600">
              For producers of fashion shoots. Drop your references: we find the models, crew and places, call their agents, plan the day and the budget, and keep everyone updated when something changes.
            </p>
            <p className="mt-6 text-[14px] text-neutral-500">Drop a few references on the right, or pick from the examples. The reading starts when you press Read.</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }} className="relative">
            <HeroDrop />
          </motion.div>
        </div>

        {/* the stage is the reference drop: drop or pick, and the analysis starts */}
      </section>

      {/* ElevenLabs-style: framed column, grainy gradient cards, the agency call as bubbles */}
      <section id="agent" className="relative z-[1]">
        <div className="mx-auto max-w-6xl border-x border-neutral-200/80 px-6 py-24 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-[family-name:var(--font-inter)] text-4xl font-light tracking-[-0.035em] text-neutral-950 md:text-5xl">Before the shoot. <span className="text-neutral-400">The agent does the legwork.</span></h2>
            <Link href="/new" className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[15px] shadow-[0_1px_2px_rgba(0,0,0,.04)]">Try it</Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Feature title="Scouts real places for the look" tag="Location scout" date="Brief">
              <div className="grid h-full grid-cols-2 grid-rows-2 gap-2 bg-white p-2">
                {LOC_SHOWCASE.map((l, i) => (
                  <div key={l.name} className={`relative overflow-hidden rounded-[16px] ${i === 0 ? 'row-span-2' : ''}`}>
                    <img src={l.image_url} alt={l.name} className="size-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-white">
                      <div className="text-[14px] font-medium">{l.name}</div>
                      <div className="text-[12px] text-white/80">{l.city}, {l.country}</div>
                    </div>
                    {i === 0 && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] text-neutral-900">Best match · 4 of 5</span>}
                  </div>
                ))}
              </div>
            </Feature>
            <Feature title="Calls agencies in their language" tag="Voice" date="Team">
              <div className="flex h-full flex-col justify-center gap-3 bg-white p-7">
                <div className="flex items-center gap-3 text-[13px] text-neutral-500"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span> On the call · Elite Paris · French</div>
                <div className="flex h-10 items-center justify-between rounded-2xl bg-gradient-to-r from-[#eef3f9] via-[#dde8f5] to-[#eef3f9] px-3">
                  {Array.from({ length: 36 }).map((_, i) => <motion.span key={i} className="w-[3px] rounded-full bg-gradient-to-t from-[#6f93c7] to-[#c9daf0]" animate={{ height: [4, 8 + ((i * 37) % 18), 5, 12 + ((i * 13) % 12), 4] }} transition={{ duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' }} />)}
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-neutral-950 px-4 py-2.5 text-white">
                  <p className="text-[14px] leading-5">Bonjour, je suis l&rsquo;assistant de la production. Est-elle disponible le 21 ?</p>
                  <p className="mt-1 text-[12px] text-white/60">Hello, I&rsquo;m the production&rsquo;s assistant. Is she free on the 21st?</p>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-[#eef2f7] px-4 py-2.5">
                  <p className="text-[14px] leading-5">Oui, elle est disponible. 1 500 € la journée.</p>
                  <p className="mt-1 text-[12px] text-neutral-500">Yes, she is free. €1,500 a day.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-[13px] text-white"><span className="size-1.5 rounded-full bg-white" /> Available · €1,500/day · saved on her card</span>
              </div>
            </Feature>
          </div>

        </div>
      </section>


      <PlansChange />

      {/* Footer: blue liquid band, the line, links, the wordmark big */}
      <footer className="relative z-[1] mt-10 overflow-hidden text-white">
        <div className="absolute inset-0"><Grainient colors={['#9fb8d8', '#6f8fbd', '#3f5f8f', '#b9cbe0']} grainAnimated={false} grainAmount={0.1} speed={0.35} flow={1.4} softness={0.9} dpr={0.75} /></div>
        <div className="gs-grain" />
        <div className="relative mx-auto max-w-[1320px] px-6 pt-24">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 className="text-[56px] font-normal leading-[1.02] tracking-[-0.04em] md:text-[72px]">Stay creative.<br /><span className="text-white/60">Production&rsquo;s handled.</span></h2>
            <Link href="/new" className="inline-flex h-14 items-center rounded-full bg-white px-8 text-[16px] font-medium text-neutral-950">Start a shoot</Link>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-white/20 pt-8 text-[14px] md:grid-cols-4">
            <div><div className="text-white/50">Product</div><div className="mt-3 flex flex-col gap-2"><Link href="/new" className="hover:underline">Start a shoot</Link><Link href="/people" className="hover:underline">People</Link><Link href="/board/jacket-campaign" className="hover:underline">Shoot day board</Link></div></div>
            <div><div className="text-white/50">How it works</div><div className="mt-3 flex flex-col gap-2"><a href="#agent" className="hover:underline">Before the shoot</a><a href="#changes" className="hover:underline">When things change</a></div></div>
            <div><div className="text-white/50">Built at</div><div className="mt-3">Unfair Weekend<br />Vilnius, November 2026</div></div>
            <div><div className="text-white/50">Code</div><div className="mt-3"><a href="https://github.com/geraslabaigeras-oss/good-spread" target="_blank" rel="noreferrer" className="hover:underline">GitHub ↗</a></div></div>
          </div>
        </div>
        <div className="relative mt-16 px-4">
          <Wordmark className="h-auto w-full max-w-none !bg-white" />
        </div>
        <p className="relative mx-auto max-w-[1320px] px-6 pb-8 pt-6 text-[12px] text-white/60">Photography from Unsplash by {PHOTOS.map((p) => p.by).join(', ')}. Location photos from Wikimedia Commons, credited on each card.</p>
      </footer>
    </div>
  );
}
