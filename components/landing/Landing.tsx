'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import LiquidEther from '@/components/LiquidEther';
import Grainient from '@/components/Grainient';
import { TextAnimate } from '@/components/ui/text-animate';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';

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

function Panel({ pill, title, children }: { pill: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white/45 p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7),0_18px_48px_rgba(80,60,40,.07)] backdrop-blur-xl">
      <Pill>{pill}</Pill>
      <h3 className="mb-4 mt-5 text-2xl font-light tracking-[-0.02em]">{title}</h3>
      {children}
    </div>
  );
}

export function Landing({ cap, routes, best, people, moment }: Props) {
  const steps = [
    { k: 'Brief', t: 'Drop a reference. You get the look, palette, light and shot list.' },
    { k: 'Plans', t: `${routes.length} ways to make it, each costed against the €${cap.toLocaleString('en-US')} cap.` },
    { k: 'Team', t: 'The people you actually book. Message them on WhatsApp or iMessage.' },
    { k: 'Shoot day', t: `A change lands, three fixes are priced, ${people} phones update on approve.` },
  ];

  return (
    <div className="bg-[#efeee9] font-sans text-neutral-900">
      {/* Hero: React Bits Grainient (moving grainy fog) + LiquidEther (liquid you can stir) behind a blur */}
      <section className="relative h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Grainient colors={['#efeee9', '#cfd7dc', '#9fadb7', '#e6e3dc']} lightMode grainAnimated grainAmount={0.12} speed={0.25} softness={0.9} />
        </div>
        <div className="absolute inset-0 blur-[36px]">
          <LiquidEther colors={['#1f1f1f', '#55606a', '#9aa7b0']} lightMode autoDemo autoSpeed={0.35} autoIntensity={1.8} mouseForce={22} cursorSize={140} resolution={0.5} />
        </div>

        <header className="absolute inset-x-0 top-0 z-30 mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-[13px] text-neutral-700">
          <span className="font-medium text-neutral-900">good spread®</span>
          <nav className="flex items-center gap-7">
            <a href="#how" className="hidden hover:text-neutral-950 md:inline">How it works</a>
            <Link href="/people" className="hidden hover:text-neutral-950 md:inline">Your people</Link>
            <Link href="/new" className="rounded-full bg-neutral-900 px-4 py-2 text-white">Start a shoot</Link>
          </nav>
        </header>

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
          <TextAnimate animation="blurIn" by="word" as="h1" className="max-w-4xl text-4xl font-light leading-[1.05] tracking-[-0.03em] text-neutral-900 md:text-6xl">
            The production planner for fashion shoots.
          </TextAnimate>
          <TextAnimate animation="blurIn" by="word" delay={0.35} as="p" className="mt-6 max-w-xl text-[16px] leading-7 text-neutral-600">
            Turn a reference into a costed shoot plan with your team. When a flight, a model or the budget changes, it prices three fixes, and after you approve one, everyone on set gets their new call time.
          </TextAnimate>
          <div className="pointer-events-auto mt-9 flex items-center gap-3 text-[13px]">
            <Link href="/new" className="rounded-full bg-neutral-900 px-5 py-2.5 text-white">Start a shoot</Link>
            <Link href="/people" className="rounded-full bg-white/50 px-5 py-2.5 text-neutral-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7)] backdrop-blur-md">Add your people</Link>
          </div>
          <p className="mt-6 text-[12px] text-neutral-500">Producers plan it. Talent lives it.</p>
        </div>
      </section>

      {/* What it does: our own content, with the fog + grain + frosted-pill treatment */}
      <section id="how" className="relative overflow-hidden bg-[linear-gradient(180deg,#efeee9_0%,#e9ebea_45%,#d3dbe0_100%)] px-4 py-28 md:px-10">
        <Grain />
        <div className="relative z-[2] mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-4xl font-light leading-[1.05] tracking-[-0.03em] md:text-6xl">From one reference to everyone&rsquo;s day.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Panel pill="Plan" title={`${routes.length} plans, each costed`}>
              {routes.map((r) => (
                <div key={r.name} className="flex items-baseline justify-between border-t border-neutral-900/10 py-2.5 text-[15px]">
                  <span className={r.name === best.name ? 'text-neutral-900' : 'text-neutral-500'}>{r.name}{r.name === best.name ? ' · recommended' : ''}</span>
                  <span className={`tabular-nums ${r.overCap ? 'text-neutral-400 line-through' : ''}`}>{eur(r.total)}</span>
                </div>
              ))}
              <p className="mt-3 text-[13px] text-neutral-500">Against a {eur(cap)} cap. Code does the sums, not AI.</p>
            </Panel>
            <Panel pill="Change" title={`${moment.who} lands ${moment.lands}`}>
              <p className="text-[13px] text-neutral-500">Misses {moment.call} hair and makeup. Three fixes:</p>
              {moment.fixes.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between border-t border-neutral-900/10 py-2.5 text-[15px]">
                  <span className={f.best ? 'text-neutral-900' : 'text-neutral-500'}>{f.label}</span>
                  <span className="tabular-nums">{delta(f.cost)}</span>
                </div>
              ))}
            </Panel>
            <Panel pill="Everyone" title={`${people} phones update`}>
              <div className="flex items-baseline gap-3">
                <span className="text-[15px] text-neutral-400 line-through">{moment.call}</span>
                <span className="text-6xl font-light tracking-[-0.04em] tabular-nums">{moment.newCall}</span>
              </div>
              <p className="mt-3 text-[13px] text-neutral-500">Each person gets their new call time by text and taps Got it. You see who has seen it. Nobody types a message.</p>
            </Panel>
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
