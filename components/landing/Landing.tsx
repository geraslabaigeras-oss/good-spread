'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { motion } from 'motion/react';
import { Stage } from '@/components/glass/Stage';
import { fmtEur } from '@/lib/format';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
  moment: { lands: string; call: string; newCall: string; who: string; fixes: { label: string; cost: number; people: number; creative: boolean; best: boolean }[] };
};

const ease = [0.16, 1, 0.3, 1] as const;
const up = (d = 0) => ({ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.9, ease, delay: d } });

export function Landing({ cap, stills, routes, best, people, moment }: Props) {

  const steps = [
    { k: 'Brief', t: 'Upload a reference image. You get the look, palette, lighting and shot list as a brief you can edit.', big: `${stills} stills`, href: '/new' },
    { k: 'Strategies', t: `${routes.map((r) => r.name).join(', ')}. Each is costed line by line against your cap.`, big: fmtEur(best.total), href: '/plan' },
    { k: 'Team', t: 'Choose models, a photographer and a studio. Cost and call times update as you pick.', big: `${people} people`, href: '/plan/assemble' },
    { k: 'Production', t: 'A flight changes. You see three fixes with their cost. Approve one and each person gets their new call time.', big: '0 messages', href: '/plan/assemble' },
  ];

  return (
    <Stage>
      {/* nav: floating glass pill */}
      <header className="glass sticky top-[18px] z-30 mx-auto mt-[18px] flex h-14 w-[calc(100%-32px)] max-w-[1360px] items-center justify-between rounded-[20px] pl-[22px] pr-2.5 md:w-[calc(100%-80px)]">
        <span className="text-[15px] font-medium tracking-[-0.15px]">good spread</span>
        <nav className="hidden gap-[30px] text-[15px] font-medium tracking-[-0.28px] text-grey-1 md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <Link href="/people" className="hover:text-ink">Your people</Link>
        </nav>
        <Link href="/new" className="g-btn !h-10 !px-[18px] !text-[14px]">Start a shoot</Link>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden pb-24 pt-16 md:pt-[120px]">
        <div aria-hidden className="g-ghost left-[-2%] top-[40px]">good spread</div>
        <div className="relative mx-auto w-[calc(100%-36px)] max-w-[1328px] md:w-[calc(100%-112px)]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }} className="max-w-[900px]">
            <span className="g-pill mb-[26px]">Production planning for fashion shoots</span>
            <h1 className="font-serif text-[clamp(48px,6.4vw,96px)] leading-[0.98] tracking-[-0.045em]">Producers plan it.<br />Talent lives it.</h1>
            <p className="mt-8 max-w-[30em] font-serif text-[clamp(18px,1.6vw,22px)] leading-[1.35] tracking-[-0.02em] text-grey-1">
              One plan for the whole shoot. When something changes, you approve a fix and everyone on set gets their new times.
            </p>
            <div className="mt-[30px] flex items-center gap-[22px]">
              <Link href="/new" className="g-btn">Start a shoot</Link>
              <Link href="/people" className="text-[13px] text-grey-1 transition-colors hover:text-ink">or add your people first →</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.25 }} className="mt-16">
            <Moment m={moment} />
          </motion.div>
        </div>
      </section>

      {/* how it works: fog band with hairline timeline (BYSN roadmap) */}
      <section id="how" className="relative py-10">
        <div className="fog-light relative isolate mx-auto w-[calc(100%-36px)] max-w-[1328px] overflow-hidden rounded-[36px] px-6 pb-28 pt-12 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)] md:w-[calc(100%-112px)] md:px-16 md:pt-[72px]">
          <div className="grain-layer" />
          <motion.div {...up()} className="relative">
            <span className="g-pill mb-[26px]">How it works</span>
            <h2 className="font-serif text-[clamp(36px,4.4vw,64px)] leading-none tracking-[-0.04em]">From a reference<br />to a call sheet.</h2>
          </motion.div>
          <div className="relative z-[1] mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div aria-hidden className="absolute left-1.5 right-0 top-[50px] hidden h-px bg-ink/20 md:block" />
            {steps.map((s, i) => (
              <motion.div key={s.k} {...up(i * 0.09)}>
                <Link href={s.href} className="group block">
                  <span className="relative z-[1] mb-[22px] mt-[46px] ml-0.5 block size-[9px] rounded-full bg-white shadow-[0_0_0_1px_rgb(28_28_28/0.35),0_0_0_4px_rgb(28_28_28/0.06)] transition-transform group-hover:scale-125" />
                  <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.06em]">{s.k}</h3>
                  <p className="max-w-[22em] text-[13.5px] leading-[1.45] text-grey-1">{s.t}</p>
                  <div className="mt-[18px] font-serif text-[40px] leading-none tracking-[-0.04em] num">{s.big}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* three plans: BYSN dark fog band */}
      <section className="relative py-10">
        <div className="fog-dark relative isolate mx-auto w-[calc(100%-36px)] max-w-[1328px] overflow-hidden rounded-[36px] px-6 pb-16 pt-12 md:w-[calc(100%-112px)] md:px-16 md:pt-[72px]">
          <div className="grain-layer" />
          <motion.div {...up()} className="relative">
            <span className="g-pill mb-[26px]">Three plans · one brief</span>
            <h2 className="max-w-[14em] font-serif text-[clamp(36px,4.4vw,64px)] leading-none tracking-[-0.04em] text-white">Same reference.<br />Same {fmtEur(cap)} cap.</h2>
          </motion.div>
          <div className="relative mt-16 grid gap-10 md:grid-cols-3">
            {routes.map((r, i) => (
              <motion.div key={r.name} {...up(0.1 + i * 0.12)} className="relative pl-6" style={{ marginTop: `${(2 - i) * 28}px` }}>
                <span aria-hidden className="absolute bottom-0 left-0 top-1 w-px bg-white/30" />
                <span aria-hidden className="absolute left-[-3px] top-0 size-[7px] rounded-full bg-white/80" />
                <span className="g-pill">{r.name}</span>
                <div className={`mt-5 font-serif text-[clamp(44px,4.6vw,68px)] leading-none tracking-[-0.045em] num ${r.overCap ? 'text-white/45' : 'text-white'}`}>{fmtEur(r.total)}</div>
                <div className="mt-2 text-[14px] text-white/60">{r.overCap ? `${fmtEur(r.total - cap)} over the cap` : `${fmtEur(cap - r.total)} under the cap`}{r.name === best.name ? ' · recommended' : ''}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: dark fog with ghost wordmark (Trelli) */}
      <section className="relative pb-20">
        <motion.div {...up()} className="fog-dark relative isolate mx-auto w-[calc(100%-36px)] max-w-[1328px] overflow-hidden rounded-[36px] px-10 pb-24 pt-[150px] text-center md:w-[calc(100%-112px)]">
          <div className="grain-layer" />
          <div aria-hidden className="g-ghost left-1/2 top-[30px] -translate-x-1/2 !text-white/55">good spread</div>
          <div className="relative">
            <h2 className="font-serif text-[clamp(40px,5vw,72px)] leading-none tracking-[-0.04em] text-white">Plan your next shoot.</h2>
            <p className="mx-auto mb-[34px] mt-[22px] max-w-[22em] font-serif text-[20px] leading-[1.35] text-white/70">Start with one reference image. No account needed.</p>
            <div className="flex items-center justify-center gap-[22px]">
              <Link href="/new" className="g-btn !bg-white !text-ink">Start with a reference</Link>
              <Link href="/people" className="text-[13px] text-white/70 hover:text-white">or add your people →</Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="mx-auto grid w-[calc(100%-36px)] max-w-[1328px] gap-10 pb-14 pt-4 text-[12.5px] text-grey-1 md:w-[calc(100%-112px)] md:grid-cols-[1fr_2fr]">
        <div><span className="text-[15px] font-medium text-ink">good spread</span><p className="mt-2.5">Built at Unfair Weekend Vilnius, 2026.</p></div>
        <div>
          <p>Plans use only the people you add. Prices are your rates; flights and hotels are estimates until booked.</p>
          <p className="mt-1.5">AI reads documents and images. Costs, schedules and fixes are calculated by code.</p>
        </div>
      </footer>
    </Stage>
  );
}

/** The product's core moment, as a framed preview. Figures come from the engine (see app/page.tsx). */
function Moment({ m }: { m: Props['moment'] }) {
  const step = (d: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay: d } });
  return (
    <div className="glass overflow-hidden !rounded-[28px]">
      <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center border-b border-white/60 px-[18px]">
        <div className="flex gap-[7px]">{[0, 1, 2].map((i) => <i key={i} className="block size-[11px] rounded-full bg-ink/[0.14]" />)}</div>
        <span className="rounded-full bg-white/60 px-4 py-[5px] text-[12.5px] text-grey-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.7)]">good spread · production board</span>
        <span />
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.6fr_0.9fr] md:p-7">
        {/* 1. inbox */}
        <motion.div {...step(0.6)} className="rounded-[20px] bg-white p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06)]">
          <span className="g-pill">Inbox</span>
          <div className="mt-4 text-[13px] text-grey-1">Read from flight_change.pdf</div>
          <div className="mt-1 text-[17px] leading-6">{m.who}&rsquo;s flight now lands <span className="font-medium">{m.lands}</span></div>
          <div className="mt-4 rounded-[12px] bg-conflict-tint px-3 py-2.5 text-[13px] leading-5 text-conflict">Can&rsquo;t make {m.call} hair and makeup</div>
        </motion.div>
        {/* 2. three fixes */}
        <motion.div {...step(0.9)} className="rounded-[20px] bg-white p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06)]">
          <span className="g-pill">Three fixes</span>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {m.fixes.map((f) => (
              <div key={f.label} className={`rounded-[14px] p-3.5 ${f.best ? 'bg-ink text-white' : 'shadow-[inset_0_0_0_1px_rgb(13_13_13/0.1)]'}`}>
                <div className={`text-[12px] ${f.best ? 'text-white/70' : 'text-grey-1'}`}>{f.best ? 'Recommended' : f.creative ? 'Changes casting' : '\u00a0'}</div>
                <div className="mt-1 text-[14px] font-medium leading-5">{f.label}</div>
                <div className="mt-3 font-serif text-[30px] leading-none tracking-[-0.04em] num">{f.cost === 0 ? '€0' : f.cost > 0 ? `+€${Math.round(f.cost)}` : `−€${Math.round(-f.cost)}`}</div>
                <div className={`mt-1 text-[12px] ${f.best ? 'text-white/70' : 'text-grey-1'}`}>{f.people} people</div>
              </div>
            ))}
          </div>
        </motion.div>
        {/* 3. the phone */}
        <motion.div {...step(1.2)} className="mx-auto w-full max-w-[240px] rounded-[30px] bg-ink p-2">
          <div className="rounded-[24px] bg-[#f6f4f0] px-4 pb-4 pt-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-grey-1">Your day · updated</div>
            <div className="mt-2 text-[13px] text-grey-1">{m.who}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[15px] text-grey-2 line-through">{m.call}</span>
              <span className="font-serif text-[46px] leading-none tracking-[-0.04em] num">{m.newCall}</span>
            </div>
            <div className="mt-1 text-[12px] text-grey-1">Call time · lands {m.lands}</div>
            <div className="mt-4 flex h-10 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-white">Got it</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
