'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { qrPanel, useReveal } from '@/lib/motion';
import { Button } from '@/components/kit';

export function JoinQR({ open, onOpenChange, slug }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string }) {
  const [url, setUrl] = useState('');
  const [small, setSmall] = useState(false);
  const { parent, item } = useReveal();

  useEffect(() => {
    setUrl(`${window.location.origin}/join/${slug}`);
    const mq = window.matchMedia('(max-width: 1360px), (max-height: 860px)');
    const on = () => setSmall(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="qr" variants={qrPanel} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center bg-paper">
          <Button variant="ghost" className="absolute right-6 top-6" onClick={() => onOpenChange(false)}>
            <X strokeWidth={1.5} /> Close
          </Button>
          <motion.div variants={parent} initial="hidden" animate="shown" className="flex items-center gap-20">
            <motion.div variants={item} className="rounded-[20px] border border-hairline bg-surface" style={{ padding: small ? 32 : 40 }}>
              {url && <QRCodeSVG value={url} size={small ? 400 : 440} fgColor="#0d0d0d" bgColor="#ffffff" level="M" marginSize={0} />}
            </motion.div>
            <motion.div variants={item} className="max-w-[440px]">
              <div className="label">Join the shoot</div>
              <h2 className="mt-2 font-serif tracking-[-0.025em]" style={{ fontSize: small ? 56 : 64, lineHeight: small ? '56px' : '64px' }}>
                Scan to get your day.
              </h2>
              <div className="mt-6 break-all font-mono text-[20px] leading-7 text-ink">{url.replace(/^https?:\/\//, '')}</div>
              <p className="mt-2 text-[16px] leading-6 text-grey-1">Pick a role. Phone number optional.</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
