'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Stage } from '@/components/glass/Stage';
import { Globe, type GlobePin } from '@/components/glass/Globe';
import { fmtEur } from '@/lib/format';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
  pins: GlobePin[];
  total: number;
};

const ease = [0.16, 1, 0.3, 1] as const;
const up = (d = 0) => ({ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.9, ease, delay: d } });

export function Landing({ cap, stills, routes, best, people, pins }: Props) {
  const par = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => { if (par.current) par.current.style.transform = `translate3d(0, ${Math.min(120, window.scrollY * 0.08)}px, 0)`; };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const steps = [
    { k: 'Brief', t: 'Upload a reference image. You get the look, palette, lighting and shot list as a brief you can edit.', big: `${stills} stills`, href: '/new' },
    { k: 'Strategies', t: `${routes.map((r) => r.name).join(', ')}. Each is costed line by line against your cap.`, big: fmtEur(best.total), href: '/plan' },
    { k: 'Team', t: 'Choose models, a photographer and a studio. Cost and call times update as you pick.', big: `${people} people`, href: '/plan/assemble' },
    { k: 'Production', t: 'A flight changes. You see three fixes with their cost. Approve one and each person gets their new call time.', big: '0 messages', href: '/board/jacket-campaign' },
  ];

  return (
    <Stage>
      {/* nav: floating glass pill */}
      <header className="glass sticky top-[18px] z-30 mx-auto mt-[18px] flex h-14 w-[calc(100%-32px)] max-w-[1360px] items-center justify-between rounded-[20px] pl-[22px] pr-2.5 md:w-[calc(100%-80px)]">
        <span className="text-[15px] font-medium tracking-[-0.15px]">good spread</span>
        <nav className="hidden gap-[30px] text-[15px] font-medium tracking-[-0.28px] text-grey-1 md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <Link href="/board/jacket-campaign" className="hover:text-ink">Live board</Link>
          <Link href="/wrap/jacket-campaign" className="hover:text-ink">Wrap</Link>
        </nav>
        <Link href="/new" className="g-btn !h-10 !px-[18px] !text-[14px]">Start a shoot</Link>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden pb-24 pt-16 md:pt-[120px]">
        <div aria-hidden className="g-ghost left-[-2%] top-[40px]">good spread</div>
        <div className="relative mx-auto grid w-[calc(100%-36px)] max-w-[1328px] items-center gap-10 md:w-[calc(100%-112px)] md:grid-cols-[5fr_7fr]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
            <span className="g-eyebrow mb-[26px]">Production planning for fashion shoots</span>
            <h1 className="whitespace-nowrap font-serif text-[clamp(40px,4.9vw,76px)] leading-[0.98] tracking-[-0.045em]">Producers plan it.<br />Talent lives it.</h1>
            <p className="mt-8 max-w-[22em] font-serif text-[clamp(18px,1.6vw,22px)] leading-[1.35] tracking-[-0.02em] text-grey-1">
              Upload a reference. Get three costed plans, a team and a call sheet. When something changes, each person on set gets their new times by text.
            </p>
            <div className="mt-[30px] flex items-center gap-[22px]">
              <Link href="/new" className="g-btn">Start with a reference</Link>
              <Link href="/board/jacket-campaign" className="text-[13px] text-grey-1 transition-colors hover:text-ink">or open the live board →</Link>
            </div>
          </motion.div>
          <div ref={par} className="relative h-[460px] md:h-[640px] md:-mr-14">
            <Globe pins={pins} arcs={[{ from: 'Milan', to: 'Vilnius', label: 'Ieva' }, { from: 'Vilnius', to: 'Lisbon', label: 'Lukas' }]} focus="Vilnius" hub="Vilnius" height="100%" altitude={1.05} spread={2.3} />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.8 }}
              className="glass pointer-events-none absolute bottom-6 left-4 flex items-center gap-3 !rounded-[18px] py-2.5 pl-2.5 pr-5">
              <img src="/catalog/ieva.jpg" alt="" className="size-10 rounded-full object-cover object-top" />
              <div>
                <div className="text-[13px] font-medium">Ieva · DA 641 Milan → Vilnius</div>
                <div className="font-mono text-[11px] text-grey-1 num">lands 07:40 · call 09:00</div>
              </div>
            </motion.div>
          </div>
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
              <Link href="/join/jacket-campaign" className="text-[13px] text-white/70 hover:text-white">or join the demo shoot as crew →</Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="mx-auto grid w-[calc(100%-36px)] max-w-[1328px] gap-10 pb-14 pt-4 text-[12.5px] text-grey-1 md:w-[calc(100%-112px)] md:grid-cols-[1fr_2fr]">
        <div><span className="text-[15px] font-medium text-ink">good spread</span><p className="mt-2.5">Built at Unfair Weekend Vilnius, 2026.</p></div>
        <div>
          <p>Demo: people, agencies, prices and flights are invented. Photos are placeholders.</p>
          <p className="mt-1.5">AI reads documents and images. Costs, schedules and fixes are calculated by code.</p>
        </div>
      </footer>
    </Stage>
  );
}
