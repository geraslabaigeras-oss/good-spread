'use client';

import { motion } from 'motion/react';
import { BrandLogo } from '@/components/brand-logo';

const ease = [0.2, 0.7, 0.2, 1] as const;

/** The same morning, twice: a flight lands late. Left is how it goes today, right is with good spread. */
export function BeforeAfter() {
  const before = [
    ['07:12', 'Flight app: DA 641 delayed'],
    ['07:15', 'Call the agency. Voicemail.'],
    ['07:21', 'WhatsApp the photographer, the stylist, make-up'],
    ['07:34', 'Redo the schedule in a spreadsheet'],
    ['07:52', 'Re-send the call sheet PDF to 9 people'],
    ['08:30', 'Two people still on the old times'],
  ];
  const after = [
    ['07:12', 'good spread reads the delay from the flight status'],
    ['07:12', 'Three fixes, each with its exact cost'],
    ['07:13', 'You tap Swap order, €0'],
    ['07:13', 'Everyone gets their own new time'],
    ['07:16', 'Seen by 9 of 9'],
  ];
  return (
    <section className="relative bg-white px-6 py-28">
      <div className="gs-grain" />
      <div className="relative mx-auto max-w-[1280px]">
        <h2 className="max-w-[860px] text-[52px] font-normal leading-[1.05] tracking-[-0.035em]">One late flight. <span className="text-neutral-400">Two very different mornings.</span></h2>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease }}
            className="gs-paper rounded-[16px] bg-[#f7f7f7] p-7 shadow-[0_0_0_0.5px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between"><span className="text-[17px]">Today</span><span className="text-[14px] text-neutral-500">78 minutes, 14 messages</span></div>
            <div className="mt-6 space-y-3.5">
              {before.map(([t, x], i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease }} className="flex gap-4 text-[15px]">
                  <span className="w-12 shrink-0 tabular-nums text-neutral-400">{t}</span><span className={i === before.length - 1 ? 'text-neutral-950' : 'text-neutral-600'}>{x}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[13px] text-neutral-500"><BrandLogo name="whatsapp" size={14} color="#9ca3af" /><BrandLogo name="gmail" size={14} color="#9ca3af" /><BrandLogo name="imessage" size={14} color="#9ca3af" /> Five apps, one spreadsheet, one tired producer.</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, delay: 0.1, ease }}
            className="gs-paper rounded-[16px] bg-white p-7 shadow-[0_0_0_0.5px_rgba(0,0,0,.08),0_14px_40px_rgba(0,0,0,.06)]">
            <div className="flex items-center justify-between"><span className="text-[17px]">With good spread</span><span className="rounded-full bg-neutral-950 px-3 py-1 text-[13px] text-white">4 minutes, 1 tap</span></div>
            <div className="mt-6 space-y-3.5">
              {after.map(([t, x], i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.09, duration: 0.5, ease }} className="flex gap-4 text-[15px]">
                  <span className="w-12 shrink-0 tabular-nums text-neutral-400">{t}</span><span className="text-neutral-950">{x}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 text-[13px] text-neutral-500">AI only reads the mess. The schedule, the costs and who gets told are worked out by plain code, so it is the same answer every time.</div>
          </motion.div>
        </div>
        <p className="mt-4 text-[12px] text-neutral-400">An illustrative morning, not a measured study.</p>
      </div>
    </section>
  );
}
