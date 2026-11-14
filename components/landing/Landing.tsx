'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { motion } from 'motion/react';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { ThreeDMarquee } from '@/components/ui/3d-marquee';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { AuroraText } from '@/components/ui/aurora-text';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Marquee } from '@/components/ui/marquee';
import { BRAND, BrandLogo, type Brand } from '@/components/brand-logo';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';
import { Timeline } from '@/components/ui/timeline';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
  moment: { lands: string; call: string; newCall: string; who: string; fixes: { label: string; cost: number; people: number; creative: boolean; best: boolean }[] };
};

// Free Unsplash-licensed photography (unsplash.com/license). Credits in the footer.
const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?fm=jpg&q=60&w=${w}&auto=format&fit=crop`;
const PHOTOS = {
  brownCoat: { src: u('photo-1550872199-63f4382fe925'), by: 'chantelle taylor' },
  beigeStairs: { src: u('photo-1762605135012-56a59a059e60'), by: 'Mina Rad' },
  silhouette: { src: u('photo-1603189343302-e603f7add05a'), by: 'Malicki M Beser' },
  runway: { src: u('photo-1733322980454-62a1d5727460'), by: 'Ben Iwara' },
  snow: { src: u('photo-1739808914849-01ba195c4f93'), by: 'Ali Fallah' },
  blazer: { src: u('photo-1613915617430-8ab0fd7c6baf', 1200), by: 'Chyntia Juls' },
  city: { src: u('photo-1692180142575-c31fcd106b5b', 1200), by: 'Tamara Harhai' },
  wall: { src: u('photo-1508964801641-4b2410705b73', 1200), by: 'Nick Karvounis' },
  blackCoat: { src: u('photo-1590972381381-c863cbbf9dd2', 1200), by: 'Happy Face Emoji' },
  field: { src: u('photo-1635262090780-2ed9e994fff4', 1200), by: 'mahdi chaghari' },
  red: { src: u('photo-1654409848415-9e0a9b0a9c8d', 1200), by: 'Negar Nikkhah' },
};

const MARQUEE = [
  'photo-1550872199-63f4382fe925', 'photo-1762605135012-56a59a059e60', 'photo-1603189343302-e603f7add05a', 'photo-1733322980454-62a1d5727460',
  'photo-1739808914849-01ba195c4f93', 'photo-1613915617430-8ab0fd7c6baf', 'photo-1692180142575-c31fcd106b5b', 'photo-1508964801641-4b2410705b73',
  'photo-1590972381381-c863cbbf9dd2', 'photo-1635262090780-2ed9e994fff4', 'photo-1654409848415-9e0a9b0a9c8d', 'photo-1645561305502-63a9ba09ab09',
  'photo-1645561305577-4cb5be67a40a', 'photo-1647957866343-87662a2daaad', 'photo-1550872199-63f4382fe925', 'photo-1603189343302-e603f7add05a',
].map((id) => u(id, 600));

const eur = (n: number) => (n === 0 ? '€0' : n > 0 ? `+€${Math.round(n)}` : `−€${Math.round(-n)}`);

export function Landing({ cap, routes, best, moment }: Props) {
  const cards = [
    { category: 'Brief', title: 'Drop a reference. Get the brief.', src: PHOTOS.blazer.src, text: 'Upload a moodboard or a past campaign. You get the look, palette, light and shot list as a brief you can edit, and you mark what must stay and what can change.' },
    { category: 'Plans', title: `${routes.length} ways to make it, each costed.`, src: PHOTOS.city.src, text: `Local, destination or hybrid. Every plan is costed line by line against your €${cap.toLocaleString('en-US')} cap. The cheapest one that keeps the brief is ${best.name.toLowerCase()} at €${best.total.toLocaleString('en-US')}.` },
    { category: 'Team', title: 'Book the people you actually work with.', src: PHOTOS.wall.src, text: 'Add your models, photographer and crew. Find models on models.com and message them on WhatsApp or iMessage from the same screen.' },
    { category: 'Shoot day', title: 'A flight lands late. Three fixes, priced.', src: PHOTOS.blackCoat.src, text: `${moment.who} now lands ${moment.lands} and misses ${moment.call} hair and makeup. ${moment.fixes.map((f) => `${f.label}: ${eur(f.cost)}`).join('. ')}.` },
    { category: 'On set', title: 'Everyone has their day on their phone.', src: PHOTOS.field.src, text: 'One QR code. Each person sees their call time, where to be and their looks. When you approve a change they get a text and tap Got it.' },
    { category: 'Wrap', title: 'Statements per person.', src: PHOTOS.red.src, text: 'Hours, overtime and agency fees for everyone on the shoot, ready when the day ends.' },
  ];

  const timeline = [
    { title: moment.lands, content: <Step text={`The new flight PDF arrives. ${moment.who} now lands ${moment.lands}.`} img={PHOTOS.snow.src} /> },
    { title: 'Conflict', content: <Step text={`good spread reads it and flags the clash: ${moment.who.toLowerCase()} can’t make ${moment.call} hair and makeup.`} img={PHOTOS.runway.src} /> },
    { title: 'Fixes', content: <Step text={moment.fixes.map((f) => `${f.label} ${eur(f.cost)}${f.best ? ' (recommended)' : ''}`).join(' · ')} img={PHOTOS.silhouette.src} /> },
    { title: moment.newCall, content: <Step text={`You approve. Every phone updates: ${moment.who.toLowerCase()}’s call moves ${moment.call} → ${moment.newCall}. Nobody types a message.`} img={PHOTOS.beigeStairs.src} /> },
  ];

  return (
    <div className="bg-gradient-to-b from-[#f1efe8] via-[#e8ebec] to-[#d6dee4]">
      {/* Aceternity Background Gradient Animation, tuned to blue-grey off-white */}
      <BackgroundGradientAnimation
        containerClassName="!h-[100svh] !w-full"
        gradientBackgroundStart="rgb(241, 239, 232)"
        gradientBackgroundEnd="rgb(214, 222, 228)"
        firstColor="184, 195, 202"
        secondColor="226, 222, 214"
        thirdColor="196, 208, 220"
        fourthColor="235, 232, 226"
        fifthColor="170, 184, 196"
        pointerColor="200, 210, 220"
        blendingValue="normal"
        size="90%"
      >
        <header className="absolute inset-x-0 top-0 z-[60]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            <span className="text-lg font-semibold tracking-tight text-neutral-900">good spread</span>
            <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
              <a href="#how" className="hover:text-neutral-950">How it works</a>
              <a href="#day" className="hover:text-neutral-950">The shoot day</a>
              <Link href="/people" className="hover:text-neutral-950">Your people</Link>
            </nav>
            <Link href="/new"><InteractiveHoverButton className="text-sm">Start a shoot</InteractiveHoverButton></Link>
          </div>
        </header>

        <div className="absolute inset-0 z-50 mx-auto flex max-w-7xl items-center px-6 pt-20">
          <div className="pointer-events-auto relative z-10 w-full max-w-2xl">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tighter text-neutral-900 md:text-7xl xl:text-8xl">
              Producers plan it.<br />
              <AuroraText colors={['#0f172a', '#64748b', '#94a3b8', '#334155']} speed={0.8}>Talent lives it.</AuroraText>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xl text-neutral-600 md:text-2xl">
              <span>When</span>
              <ContainerTextFlip words={['a flight lands late', 'a model gets sick', 'the budget gets cut', 'the shoot runs over']} className="!text-xl md:!text-2xl" />
            </div>
            <p className="mt-2 text-xl text-neutral-600 md:text-2xl">everyone&rsquo;s day updates. Nobody types a message.</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/new"><InteractiveHoverButton className="bg-neutral-950 text-white">Start a shoot</InteractiveHoverButton></Link>
              <Link href="/people" className="rounded-full border border-neutral-300 bg-white/50 px-6 py-2.5 text-sm text-neutral-800 backdrop-blur">Add your people</Link>
            </div>
          </div>
          {/* Aceternity 3D Marquee of fashion photography */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_25%)] lg:block">
            <ThreeDMarquee images={MARQUEE} className="h-full w-full rounded-none bg-transparent" />
          </div>
        </div>
      </BackgroundGradientAnimation>

      {/* Magic UI Marquee of the services it runs on (official logos via Simple Icons) */}
      <section className="border-y border-neutral-300/50 py-8">
        <Marquee pauseOnHover className="[--duration:30s]">
          {(['whatsapp', 'imessage', 'twilio', 'elevenlabs', 'claude', 'googlemaps', 'supabase', 'vercel', 'unsplash'] as Brand[]).map((b) => (
            <span key={b} className="mx-6 inline-flex items-center gap-2.5 text-lg font-medium text-neutral-700">
              <BrandLogo name={b} size={24} />{BRAND[b].name}
            </span>
          ))}
        </Marquee>
      </section>

      {/* Aceternity Apple Cards Carousel */}
      <section id="how" className="w-full py-20">
        <h2 className="mx-auto max-w-7xl pl-4 font-sans text-xl font-bold text-neutral-800 md:text-5xl">From the brief to the wrap.</h2>
        <Carousel items={cards.map((c, i) => <Card key={c.title} index={i} card={{ src: c.src, title: c.title, category: c.category, content: <CardBody text={c.text} img={c.src} /> }} />)} />
      </section>

      {/* Aceternity Timeline */}
      <section id="day"><Timeline data={timeline} /></section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={u('photo-1645561305502-63a9ba09ab09', 2000)} alt="" className="h-[60vh] w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-start justify-end bg-black/30 p-8 md:p-14">
            <p className="text-4xl font-bold text-white md:text-7xl">Plan your next shoot.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/new" className="rounded-full bg-white px-6 py-3 font-medium text-black">Start a shoot</Link>
              <Link href="/people" className="rounded-full border border-white/40 px-6 py-3 text-white backdrop-blur-sm">Add your people</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-500">
          <p><span className="font-semibold text-neutral-900">good spread</span> · Built at Unfair Weekend Vilnius, 2026</p>
          <p className="mt-2">Photography from Unsplash by {Object.values(PHOTOS).map((p) => p.by).concat('mojtaba mosayebzadeh').join(', ')}.</p>
        </div>
      </footer>
    </div>
  );
}

function CardBody({ text, img }: { text: string; img: string }) {
  return (
    <div className="mb-4 rounded-3xl bg-[#F5F5F7] p-8 md:p-14 dark:bg-neutral-800">
      <p className="mx-auto max-w-3xl font-sans text-base text-neutral-600 md:text-2xl dark:text-neutral-400">{text}</p>
      <img src={img} alt="" className="mx-auto mt-8 h-full w-full max-w-xl rounded-2xl object-contain md:h-1/2 md:w-1/2" />
    </div>
  );
}

function Step({ text, img }: { text: string; img: string }) {
  return (
    <div>
      <p className="mb-8 text-xs font-normal text-neutral-800 md:text-sm dark:text-neutral-200">{text}</p>
      <img src={img} alt="" className="h-40 w-full max-w-md rounded-lg object-cover shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] md:h-72" />
    </div>
  );
}
