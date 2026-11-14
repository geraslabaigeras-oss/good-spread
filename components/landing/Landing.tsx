'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Stage } from '@/components/glass/Stage';
import { fmtEur } from '@/lib/format';

type Props = {
  cap: number;
  stills: number;
  routes: { name: string; total: number; overCap: boolean }[];
  best: { name: string; total: number };
  people: number;
};

const ease = [0.16, 1, 0.3, 1] as const;
const up = (d = 0) => ({ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.9, ease, delay: d } });

export function Landing({ cap, stills, routes, best, people }: Props) {
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
        <div className="relative mx-auto grid w-[calc(100%-36px)] max-w-[1328px] items-end gap-10 md:w-[calc(100%-112px)] md:grid-cols-[8fr_4fr]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
            <span className="g-eyebrow mb-[26px]">Production planning for fashion shoots</span>
            <h1 className="font-serif text-[clamp(48px,6.6vw,98px)] leading-[0.98] tracking-[-0.045em]">Producers plan it.<br />Talent lives it.</h1>
            <p className="mt-8 max-w-[22em] font-serif text-[clamp(18px,1.6vw,22px)] leading-[1.35] tracking-[-0.02em] text-grey-1">
              Upload a reference. Get three costed plans, a team and a call sheet. When something changes, each person on set gets their new times by text.
            </p>
            <div className="mt-[30px] flex items-center gap-[22px]">
              <Link href="/new" className="g-btn">Start with a reference</Link>
              <Link href="/board/jacket-campaign" className="text-[13px] text-grey-1 transition-colors hover:text-ink">or open the live board →</Link>
            </div>
          </motion.div>
          <div ref={par} aria-hidden className="relative h-[380px] md:h-[560px]">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.35 }}
              className="absolute right-[-10%] top-[22%] h-[64%] w-[42%] overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_rgb(13_13_13/0.12)]">
              <img src="/catalog/marta.jpg" alt="" className="size-full object-cover" style={{ objectPosition: '50% 20%' }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.85, filter: 'blur(15px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ opacity: { duration: 0.9, ease }, filter: { duration: 0.9, ease }, scale: { duration: 2.25, ease } }}
              className="absolute right-[18%] top-0 h-full w-[62%] overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_rgb(13_13_13/0.12)]">
              <img src="/catalog/campaign.jpg" alt="" className="size-full object-cover" style={{ objectPosition: '45% 30%' }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* how it works: fog band with hairline timeline (BYSN roadmap) */}
      <section id="how" className="relative py-10">
        <div className="glass relative mx-auto w-[calc(100%-36px)] max-w-[1328px] overflow-hidden !rounded-[36px] px-6 py-12 md:w-[calc(100%-112px)] md:px-16 md:py-[72px]">
          <motion.div {...up()}>
            <span className="g-eyebrow mb-[26px]">How it works</span>
            <h2 className="font-serif text-[clamp(36px,4.4vw,64px)] leading-none tracking-[-0.04em]">Four steps,<br />one plan.</h2>
          </motion.div>
          <div className="relative mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div aria-hidden className="absolute left-1.5 right-0 top-[50px] hidden h-px bg-ink/20 md:block" />
            {steps.map((s, i) => (
              <motion.div key={s.k} {...up(i * 0.09)}>
                <Link href={s.href} className="group block">
                  <span className="g-eyebrow">Step {i + 1}</span>
                  <span className="relative z-[1] my-[13px] ml-0.5 mb-[22px] block size-[9px] rounded-full bg-white shadow-[0_0_0_1px_rgb(28_28_28/0.35),0_0_0_4px_rgb(28_28_28/0.06)] transition-transform group-hover:scale-125" />
                  <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.06em]">{s.k}</h3>
                  <p className="max-w-[22em] text-[13.5px] leading-[1.45] text-grey-1">{s.t}</p>
                  <div className="mt-[18px] font-serif text-[40px] leading-none tracking-[-0.04em] num">{s.big}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* three routes, priced */}
      <section className="relative py-[100px]">
        <div className="mx-auto grid w-[calc(100%-36px)] max-w-[1328px] gap-10 md:w-[calc(100%-112px)] md:grid-cols-[5fr_7fr]">
          <motion.div {...up()}>
            <span className="g-eyebrow mb-[26px]">Strategies</span>
            <h2 className="font-serif text-[clamp(36px,4.4vw,64px)] leading-none tracking-[-0.04em]">Three plans<br />for one brief.</h2>
            <p className="mt-6 max-w-[22em] font-serif text-[20px] leading-[1.35] tracking-[-0.02em] text-grey-1">Same reference, same {fmtEur(cap)} cap. AI reads the reference. The totals are calculated, not estimated.</p>
          </motion.div>
          <div className="grid gap-3">
            {routes.map((r, i) => (
              <motion.div key={r.name} {...up(i * 0.08)} className="glass flex items-baseline justify-between px-7 py-6">
                <span className="font-serif text-[28px] tracking-[-0.03em]">{r.name}</span>
                <span className="flex items-baseline gap-4">
                  {r.name === best.name && <span className="g-eyebrow !mb-0">Recommended</span>}
                  {r.overCap && <span className="text-[12px] text-conflict">over cap</span>}
                  <span className={`font-serif text-[40px] leading-none tracking-[-0.04em] num ${r.overCap ? 'text-grey-2' : ''}`}>{fmtEur(r.total)}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: dark fog with ghost wordmark (Trelli) */}
      <section className="relative pb-20">
        <motion.div {...up()} className="relative mx-auto w-[calc(100%-36px)] max-w-[1328px] overflow-hidden rounded-[36px] bg-[#1c1a19] px-10 py-24 text-center text-[#f4f2ee] md:w-[calc(100%-112px)]">
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
