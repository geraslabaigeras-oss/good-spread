'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { motion } from 'motion/react';
import { ImagesSlider } from '@/components/ui/images-slider';
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
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-[60]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-white">
          <span className="text-lg font-semibold tracking-tight">good spread</span>
          <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#day" className="hover:text-white">The shoot day</a>
            <Link href="/people" className="hover:text-white">Your people</Link>
          </nav>
          <Link href="/new" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Start a shoot</Link>
        </div>
      </header>

      {/* Aceternity Images Slider */}
      <ImagesSlider className="h-[100svh] bg-neutral-950" images={[PHOTOS.brownCoat.src, PHOTOS.beigeStairs.src, PHOTOS.silhouette.src, PHOTOS.runway.src, PHOTOS.snow.src]}>
        <motion.div initial={{ opacity: 0, y: -80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="z-50 flex flex-col items-center justify-center px-6">
          <motion.p className="text-center text-sm uppercase tracking-[0.3em] text-neutral-200">Production planning for fashion shoots</motion.p>
          <motion.p className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text py-4 text-center text-5xl font-bold text-transparent md:text-8xl">
            Producers plan it. <br /> Talent lives it.
          </motion.p>
          <Link href="/new" className="relative mx-auto mt-4 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-center text-white backdrop-blur-sm">
            <span>Start a shoot →</span>
            <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-white to-transparent" />
          </Link>
        </motion.div>
      </ImagesSlider>

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
