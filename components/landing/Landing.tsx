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
import { startDemo } from '@/components/demo-guide';
import { HeroMoment } from './HeroMoment';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
  const router = useRouter();
  // a direct link that starts the guided demo: /?demo=start
  useEffect(() => { if (typeof window !== 'undefined' && window.location.search.includes('demo=start')) startDemo(router.push); }, [router]);
  const steps = [
    { k: 'Brief', t: 'Drop a reference. You get the look, palette, light and shot list.' },
    { k: 'Plans', t: `${routes.length} ways to make it, each costed against the €${cap.toLocaleString('en-US')} cap.` },
    { k: 'Team', t: 'The people you actually book. Message them on WhatsApp or iMessage.' },
    { k: 'Shoot day', t: `A change lands, three fixes are priced, ${people} phones update on approve.` },
  ];

  return (
    <div className="relative bg-[#f4f7fb] font-sans text-neutral-900">
      {/* one slow blue liquid behind the whole page, grain on top */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80"><Grainient colors={['#f6f9fc', '#dbe6f3', '#b7cbe3', '#eef3f9']} lightMode grainAnimated={false} grainAmount={0.08} speed={0.14} flow={1.25} softness={0.95} dpr={0.75} /></div>
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
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[15px]">
              <button onClick={() => startDemo(router.push)} className="rounded-full bg-neutral-950 px-7 py-3.5 font-medium text-white">Try the demo</button>
              <a href="#start" className="rounded-full bg-white px-7 py-3.5 text-neutral-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)]">Use your own references</a>
            </div>
            <p className="mt-4 text-[13px] text-neutral-500">Two minutes, guided. Nothing to type.</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }} className="relative">
            <HeroMoment />
          </motion.div>
        </div>

        {/* the stage is the reference drop: drop or pick, and the analysis starts */}
        <div id="start" className="relative mx-auto mt-20 max-w-5xl scroll-mt-10 px-6">
          <p className="mb-4 text-center text-[15px] text-neutral-600">Or start with your own references</p>
          <HeroDrop />
        </div>
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
              <div className="relative h-full bg-[radial-gradient(120%_90%_at_10%_10%,#ffffff_0%,#e3ebf5_40%,#b9cbe0_75%,#8ea8c6_100%)]">
                <Grain />
                <div className="absolute left-6 top-6 text-[34px] leading-none tracking-[-0.03em] text-neutral-900">Locations</div>
                <div className="absolute bottom-6 right-6 text-[34px] leading-none tracking-[-0.03em] text-neutral-800">Vilnius · Riga</div>
              </div>
            </Feature>
            <Feature title="Calls agencies in their language" tag="Voice" date="Team">
              <div className="relative flex h-full items-center justify-center bg-[radial-gradient(90%_70%_at_75%_15%,#ffffff_0%,transparent_60%),radial-gradient(80%_80%_at_20%_85%,#9fb8d8_0%,transparent_65%),linear-gradient(135deg,#dfe8f4,#a9bfdb)]">
                <Grain />
                <div className="relative flex items-center gap-3 text-[40px] tracking-[-0.03em] text-neutral-900">Calls <span className="rounded-full border-2 border-neutral-900 px-3 py-0.5 text-[24px]">FR · IT · SE</span></div>
              </div>
            </Feature>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="relative min-h-[460px] rounded-[28px] p-8">
              <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[radial-gradient(120%_100%_at_20%_0%,#ffffff_0%,#e6eef8_35%,#c4d4e8_70%,#9db5d3_100%)]"><Grain /></div>
              <div className="relative mx-auto flex max-w-[420px] flex-col gap-3 pt-6 [perspective:900px]">
                <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ rotateY: -12, rotateX: 6 }} className="-mr-6 self-end rounded-full border border-neutral-900/15 bg-white/70 px-4 py-2 text-[14px] text-neutral-900 shadow-[0_20px_40px_rgba(0,0,0,.25)] backdrop-blur md:-mr-24">Bonjour, je suis l&rsquo;assistant de la production. Votre mannequin est-elle disponible le 21 ?</motion.span>
                <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ rotateY: 10, rotateX: 4 }} className="-ml-4 self-start rounded-2xl bg-white px-4 py-2.5 text-[14px] text-neutral-900 shadow-[0_30px_60px_rgba(0,0,0,.35)] md:-ml-20">Oui, elle est disponible. Tarif journalier 600 €, usage web 12 mois.</motion.span>
                <span className="self-end rounded-full border border-neutral-900/15 px-4 py-2 text-[14px] text-neutral-900">Parfait, je vous envoie le brief.</span>
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} style={{ rotateY: 14, rotateZ: -2 }} className="-ml-2 inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-[14px] text-neutral-900 shadow-[0_24px_50px_rgba(0,0,0,.35)] md:-ml-28"><span className="size-2 rounded-full bg-emerald-500" /> Available · €600 · added to the plan</motion.span>
              </div>
              <div className="absolute bottom-7 left-8 right-8 text-neutral-900">
                <div className="text-[15px] text-neutral-500">Agency calls</div>
                <p className="mt-1 text-[17px] leading-6">The agent asks for availability, rate and usage in the agency&rsquo;s language. You read along in English and log the answer.</p>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-[28px] bg-[#f3f3f2] p-6">
              <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.05)]">
                <div className="text-[14px] font-medium">Your team</div>
                {[['Model', 'Available', 'bg-emerald-500'], ['Second model', 'On hold', 'bg-amber-500'], ['Photographer', 'Available', 'bg-emerald-500'], ['Stylist', 'Calling…', 'bg-sky-500']].map(([r, st, c]) => (
                  <div key={r} className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-[14px]">
                    <span>{r}</span><span className="inline-flex items-center gap-2 text-neutral-600"><span className={`size-2 rounded-full ${c}`} />{st}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="text-[15px] text-neutral-500">Availability</div>
                <p className="mt-1 text-[17px] leading-6 text-neutral-900">Every answer lands on the person and in the plan, so the budget and call sheet stay true.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <PlansChange />

      {/* Close: light, the drop is the call to action */}
      <section className="relative z-[1] px-6 py-28">
        <div className="gs-grain" />
        <div className="gs-paper relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 rounded-[16px] bg-white p-10 shadow-[0_0_0_0.5px_rgba(0,0,0,.08),0_14px_40px_rgba(0,0,0,.05)] md:grid-cols-2">
          <div>
            <h2 className="text-[48px] font-normal leading-[1.05] tracking-[-0.035em]">Drop in your references. <span className="text-neutral-400">Stay creative.</span></h2>
            <p className="mt-4 max-w-md text-[16px] leading-7 text-neutral-600">A few images are enough. You get the team, the places, the flights, call times and the budget, kept current.</p>
            <Link href="/new" className="mt-8 inline-flex h-12 items-center rounded-full bg-neutral-950 px-6 text-[15px] font-medium text-white">Start a shoot</Link>
          </div>
          <Link href="/new" className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-neutral-300 bg-[#f7f7f7] text-center transition-colors hover:border-neutral-500">
            <span className="text-[17px]">Drop references here</span>
            <span className="text-[13px] text-neutral-500">Photos, a moodboard, a campaign you like</span>
          </Link>
        </div>
      </section>

      <footer className="relative z-[1] mx-auto max-w-7xl px-6 pb-12 pt-4 text-[12.5px] text-neutral-500 md:px-10">
        <p><span className="text-neutral-900">good spread®</span> · Built at Unfair Weekend Vilnius, 2026</p>
        <p className="mt-1.5">Photography from Unsplash by {PHOTOS.map((p) => p.by).join(', ')}.</p>
      </footer>
    </div>
  );
}
