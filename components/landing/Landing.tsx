'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { TextAnimate } from '@/components/ui/text-animate';
import { Marquee } from '@/components/ui/marquee';
import { Card, Carousel } from '@/components/ui/apple-cards-carousel';
import { BRAND, BrandLogo, type Brand } from '@/components/brand-logo';

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

export function Landing({ cap, routes, best, people, moment }: Props) {
  const steps = [
    { k: 'Brief', t: 'Drop a reference. You get the look, palette, light and shot list.' },
    { k: 'Plans', t: `${routes.length} ways to make it, each costed against the €${cap.toLocaleString('en-US')} cap.` },
    { k: 'Team', t: 'The people you actually book. Message them on WhatsApp or iMessage.' },
    { k: 'Shoot day', t: `A change lands, three fixes are priced, ${people} phones update on approve.` },
  ];

  return (
    <div className="bg-[#efeee9] font-sans text-neutral-900">
      {/* Hero: Rawdose blurred core + Trelli blurred wordmark, on Aceternity's gradient animation in greys */}
      <BackgroundGradientAnimation
        containerClassName="!h-[100svh] !w-full"
        gradientBackgroundStart="rgb(239, 238, 233)"
        gradientBackgroundEnd="rgb(206, 213, 217)"
        firstColor="196, 196, 196"
        secondColor="214, 220, 224"
        thirdColor="120, 120, 120"
        fourthColor="230, 228, 222"
        fifthColor="178, 190, 198"
        pointerColor="150, 150, 150"
        blendingValue="normal"
        size="70%"
      >
        <Grain />
        <header className="absolute inset-x-0 top-0 z-[60] mx-auto flex h-20 max-w-7xl items-center justify-between px-6 text-[13px] text-neutral-700">
          <span className="font-medium text-neutral-900">good spread®</span>
          <nav className="flex items-center gap-7">
            <a href="#how" className="hidden hover:text-neutral-950 md:inline">How it works</a>
            <Link href="/people" className="hidden hover:text-neutral-950 md:inline">Your people</Link>
            <Link href="/new" className="rounded-full bg-neutral-900 px-4 py-2 text-white">Start a shoot</Link>
          </nav>
        </header>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[30%] z-[2] select-none whitespace-nowrap text-center text-[17vw] font-light leading-none tracking-[-0.06em] text-white/70 blur-[18px]">
          good spread
        </div>

        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center">
          <TextAnimate animation="blurIn" by="word" as="h1" className="text-3xl font-light tracking-[-0.02em] text-neutral-800 md:text-5xl">
            Producers plan it. Talent lives it.
          </TextAnimate>
          <TextAnimate animation="blurIn" by="word" delay={0.4} as="p" className="mt-5 max-w-md text-[15px] leading-6 text-neutral-600">
            One shoot plan. When a flight, a model or the budget changes, everyone on set gets their new day.
          </TextAnimate>
          <div className="mt-9 flex items-center gap-3 text-[13px]">
            <Link href="/new" className="rounded-full bg-neutral-900 px-5 py-2.5 text-white">Start a shoot</Link>
            <Link href="/people" className="rounded-full bg-white/50 px-5 py-2.5 text-neutral-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,.7)] backdrop-blur-md">Add your people</Link>
          </div>
        </div>
      </BackgroundGradientAnimation>

      {/* Logos: Magic UI Marquee, official marks via Simple Icons */}
      <section className="py-10">
        <Marquee pauseOnHover className="[--duration:32s]">
          {(['whatsapp', 'imessage', 'twilio', 'elevenlabs', 'claude', 'googlemaps', 'supabase', 'vercel', 'unsplash'] as Brand[]).map((b) => (
            <span key={b} className="mx-7 inline-flex items-center gap-2.5 text-[15px] text-neutral-600">
              <BrandLogo name={b} size={20} />{BRAND[b].name}
            </span>
          ))}
        </Marquee>
      </section>

      {/* BYSN roadmap card */}
      <section id="how" className="px-4 md:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#f3f2ec_0%,#f1efe8_48%,#dfe2e0_72%,#b9c4cb_100%)] px-8 pb-36 pt-8 md:px-14">
          <Grain />
          <div className="relative z-[2] flex items-center justify-between">
            <Pill>How it works</Pill>
            <span className="text-[13px] font-medium">good spread®</span>
          </div>
          <div className="relative z-[2] mt-20 grid gap-10 md:grid-cols-4">
            <div aria-hidden className="absolute left-1 right-0 top-[44px] hidden h-px bg-neutral-900/20 md:block" />
            {steps.map((s, i) => (
              <div key={s.k}>
                <Pill>Step {i + 1}</Pill>
                <span className="relative mb-5 mt-[13px] block size-[9px] rounded-full bg-white shadow-[0_0_0_1px_rgba(28,28,28,.35),0_0_0_4px_rgba(28,28,28,.06)]" />
                <h3 className="text-[14px] font-medium uppercase tracking-[0.04em]">{s.k}</h3>
                <p className="mt-2 max-w-[22em] text-[13.5px] leading-[1.45] text-neutral-600">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BYSN dark fog card with the real figures */}
      <section className="mt-6 px-4 md:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#c3c5c6_0%,#8a8c8c_28%,#3d3e3c_62%,#262624_100%)] px-8 pb-16 pt-8 text-white md:px-14">
          <Grain />
          <div className="relative z-[2] flex items-center justify-between">
            <Pill dark>Same brief, three plans</Pill>
            <span className="text-[13px] font-medium">good spread®</span>
          </div>
          <div className="relative z-[2] mt-14 grid gap-10 md:grid-cols-4">
            {routes.map((r, i) => (
              <div key={r.name} className="relative pl-5" style={{ marginTop: `${(routes.length - i) * 34}px` }}>
                <span aria-hidden className="absolute bottom-0 left-0 top-1 w-px bg-white/30" />
                <span aria-hidden className="absolute -left-[3px] top-0 size-[7px] rounded-full bg-white/80" />
                <Pill dark>{r.name}</Pill>
                <div className="mt-4 text-[34px] font-light leading-none tracking-[-0.03em]">{eur(r.total)}</div>
                <div className="mt-1 text-[13px] text-white/60">{r.overCap ? `${eur(r.total - cap)} over the cap` : `${eur(cap - r.total)} under the cap`}{r.name === best.name ? ' · recommended' : ''}</div>
              </div>
            ))}
            <div className="relative pl-5">
              <span aria-hidden className="absolute bottom-0 left-0 top-1 w-px bg-white/30" />
              <span aria-hidden className="absolute -left-[3px] top-0 size-[7px] rounded-full bg-white/80" />
              <Pill dark>Shoot day</Pill>
              <div className="mt-4 text-[13px] text-white/60">{moment.who} lands {moment.lands}</div>
              {moment.fixes.map((f) => (
                <div key={f.label} className="mt-2 flex items-baseline justify-between gap-3 text-[14px]">
                  <span className={f.best ? 'text-white' : 'text-white/60'}>{f.label}</span>
                  <span className="font-light tabular-nums">{delta(f.cost)}</span>
                </div>
              ))}
            </div>
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
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[12%] z-[2] select-none whitespace-nowrap text-[16vw] font-light leading-none tracking-[-0.06em] text-white/60 blur-[16px]">good spread</div>
          <div className="relative z-[3] text-[13px] leading-6">
            <p className="font-medium">good spread®</p>
            <p className="mt-4 text-white/80">Plan your next shoot.<br />Start with one reference image.</p>
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
