'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { motion } from 'motion/react';
import Grainient from '@/components/Grainient';
import { VoiceOrb } from '@/components/voice-orb';
import { TextAnimate } from '@/components/ui/text-animate';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';
import { Safari } from '@/components/ui/safari';
import { Iphone } from '@/components/ui/iphone';
import { MessagesScreen } from '@/components/messages-screen';
import { BrandLogo } from '@/components/brand-logo';
import { HeroDrop } from '@/components/hero-drop';
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
    <div className="bg-[#fafafa] font-sans text-neutral-900">
      {/* Hero: headline, then one living stage (Grainient, our fog palette) with the product's moments floating out in 3D */}
      <section className="relative overflow-hidden bg-[#fafafa] pb-24">
        <header className="relative z-30 mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-[14px] text-neutral-700">
          <span className="font-medium text-neutral-900">good spread</span>
          <nav className="flex items-center gap-8">
            <a href="#how" className="hidden hover:text-neutral-950 md:inline">How it works</a>
            <Link href="/people" className="hidden hover:text-neutral-950 md:inline">Your people</Link>
            <Link href="/new" className="rounded-full bg-neutral-950 px-5 py-2.5 text-white">Start a shoot</Link>
          </nav>
        </header>

        <div className="relative z-20 mx-auto max-w-4xl px-6 pt-14 text-center">
          <TextAnimate animation="blurInUp" by="word" as="h1" className="font-[family-name:var(--font-inter)] text-5xl font-light leading-[1.04] tracking-[-0.035em] text-neutral-950 md:text-[76px]">
            Your shoot, produced by an agent that makes the calls.
          </TextAnimate>
          <TextAnimate animation="blurIn" by="word" delay={0.5} as="p" className="mx-auto mt-6 max-w-xl text-[17px] leading-7 text-neutral-600">
            Stay creative. We organise the rest: real locations, your people, agency calls, the budget, and every change on the day.
          </TextAnimate>
          <div className="mt-9 flex items-center justify-center gap-3 text-[15px]">
            <Link href="/new" className="rounded-full bg-neutral-950 px-7 py-3.5 text-white">Start a shoot</Link>
            <Link href="/people" className="rounded-full bg-white px-7 py-3.5 text-neutral-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,.1)]">Add your people</Link>
          </div>
        </div>

        {/* the stage is the reference drop: drop or pick, and the analysis starts */}
        <div className="relative mx-auto mt-14 max-w-5xl px-6">
          <HeroDrop />
        </div>
      </section>

      {/* How it works, shown: the real board on a laptop and the real crew page on a phone (Magic UI Safari + iPhone frames) */}
      <section id="how" className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f7f8_0%,#eef1f3_55%,#dfe5ea_100%)] px-4 py-24 md:px-10">
        <Grain />
        <div className="relative z-[2] mx-auto max-w-6xl">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <h2 className="font-[family-name:var(--font-inter)] text-4xl font-light leading-[1.05] tracking-[-0.035em] md:text-[56px]">A flight lands late.<br /><span className="text-neutral-400">Everyone knows in seconds.</span></h2>
            <p className="max-w-md text-[16px] leading-7 text-neutral-600 md:justify-self-end">You approve one of three priced fixes, and each person gets a text with their new call time.</p>
          </div>

          <div className="relative mt-14">

            <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.9, delay: 0.25 }} className="relative mx-auto mt-6 w-[280px] md:w-[320px]">
              <div className="relative">
                <Iphone className="drop-shadow-[0_30px_60px_rgba(0,0,0,.25)]" />
                <div className="absolute overflow-hidden" style={{ left: `${(21.25 / 433) * 100}%`, top: `${(19.25 / 882) * 100}%`, width: `${(389.5 / 433) * 100}%`, height: `${(843.5 / 882) * 100}%`, borderRadius: `${(55.75 / 389.5) * 100}% / ${(55.75 / 843.5) * 100}%` }}>
                  <MessagesScreen name="Model" before={moment.call} after={moment.newCall} place="Pilies courtyard, Vilnius" url="good-spread.app/p/k3f9" />
                </div>
              </div>
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.9, rotateX: 18, rotateY: -22 }} whileInView={{ opacity: 1, y: [0, -8, 0], scale: 1.06, rotateX: 10, rotateY: -16 }} viewport={{ once: true }}
                transition={{ opacity: { duration: 0.6, delay: 1.1 }, scale: { duration: 0.6, delay: 1.1 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.7 } }}
                style={{ transformPerspective: 900 }}
                className="absolute -left-16 top-24 z-20 w-[300px] rounded-2xl bg-white p-3.5 shadow-[0_40px_80px_rgba(20,40,90,.28),0_10px_20px_rgba(0,0,0,.08)] md:-left-44">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500"><BrandLogo name="imessage" size={14} /> Messages · now</div>
                <p className="mt-1 text-[13px] leading-[18px] text-neutral-900"><b>good spread:</b> Your call moved {moment.call} → {moment.newCall}. Tap to confirm.</p>
              </motion.div>
              <p className="mt-3 text-center text-[13px] text-neutral-500">The text each person gets, sent by Twilio. One tap opens their day.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ElevenLabs-style: framed column, grainy gradient cards, the agency call as bubbles */}
      <section id="agent" className="bg-[#fafafa]">
        <div className="mx-auto max-w-6xl border-x border-neutral-200/80 px-6 py-24 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-[family-name:var(--font-inter)] text-4xl font-light tracking-[-0.035em] text-neutral-950 md:text-5xl">What the agent does for you</h2>
            <Link href="/new" className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[15px] shadow-[0_1px_2px_rgba(0,0,0,.04)]">Try it</Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Feature title="Scouts real places for the look" tag="Claude · Wikipedia" date="Brief">
              <div className="relative h-full bg-[radial-gradient(120%_90%_at_10%_10%,#efe5d8_0%,#cdb79c_40%,#8f7863_75%,#4d4038_100%)]">
                <Grain />
                <div className="absolute left-6 top-6 text-[34px] leading-none tracking-[-0.03em] text-white">Locations</div>
                <div className="absolute bottom-6 right-6 text-[34px] leading-none tracking-[-0.03em] text-white/95">Vilnius · Riga</div>
              </div>
            </Feature>
            <Feature title="Calls agencies in their language" tag="ElevenLabs" date="Team">
              <div className="relative flex h-full items-center justify-center bg-[radial-gradient(90%_70%_at_75%_15%,#dbe5f1_0%,transparent_60%),radial-gradient(80%_80%_at_20%_85%,#3a4a63_0%,transparent_65%),linear-gradient(135deg,#b9c8da,#55667f)]">
                <Grain />
                <div className="relative flex items-center gap-3 text-[40px] tracking-[-0.03em] text-white">Calls <span className="rounded-full border-2 border-white px-3 py-0.5 text-[24px]">FR · IT · SE</span></div>
              </div>
            </Feature>
            <Feature title="Re-plans the minute a flight slips" tag="Engine" date="Shoot day" light>
              <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
                <div className="text-[13px] font-semibold">good spread</div>
                <div className="text-[28px] tracking-[-0.02em]">Three fixes, priced</div>
                <div className="mt-5 grid w-full grid-cols-3 divide-x divide-white/15 rounded-2xl bg-neutral-900 py-4 text-white">
                  {moment.fixes.map((f) => (
                    <div key={f.label} className="flex flex-col items-center gap-1.5 px-2">
                      <span className="text-[11px] leading-tight text-white/60">{f.label}</span>
                      <span className="text-[22px] font-light leading-none tabular-nums">{delta(f.cost)}</span>
                      {f.best && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-neutral-900">Best</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Feature>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="relative min-h-[460px] rounded-[28px] p-8">
              <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[radial-gradient(120%_100%_at_20%_0%,#d7dfe8_0%,#8a9bb1_35%,#3c4656_70%,#1d2129_100%)]"><Grain /></div>
              <div className="relative mx-auto flex max-w-[420px] flex-col gap-3 pt-6 [perspective:900px]">
                <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ rotateY: -12, rotateX: 6 }} className="-mr-6 self-end rounded-full border border-white/50 bg-white/10 px-4 py-2 text-[14px] text-white shadow-[0_20px_40px_rgba(0,0,0,.25)] backdrop-blur md:-mr-24">Bonjour, je suis l&rsquo;assistant de la production. Votre mannequin est-elle disponible le 21 ?</motion.span>
                <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ rotateY: 10, rotateX: 4 }} className="-ml-4 self-start rounded-2xl bg-white px-4 py-2.5 text-[14px] text-neutral-900 shadow-[0_30px_60px_rgba(0,0,0,.35)] md:-ml-20">Oui, elle est disponible. Tarif journalier 600 €, usage web 12 mois.</motion.span>
                <span className="self-end rounded-full border border-white/50 px-4 py-2 text-[14px] text-white">Parfait, je vous envoie le brief.</span>
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} style={{ rotateY: 14, rotateZ: -2 }} className="-ml-2 inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-[14px] text-neutral-900 shadow-[0_24px_50px_rgba(0,0,0,.35)] md:-ml-28"><span className="size-2 rounded-full bg-emerald-500" /> Available · €600 · added to the plan</motion.span>
              </div>
              <div className="absolute bottom-7 left-8 right-8 text-white">
                <div className="text-[15px] text-white/70">Agency calls</div>
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

      <VoiceOrb />

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
