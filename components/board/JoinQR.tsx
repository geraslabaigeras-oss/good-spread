'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function JoinQR({ open, onOpenChange, slug }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(`${window.location.origin}/join/${slug}`);
  }, [slug]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95" onClick={() => onOpenChange(false)}>
      <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Good Spread · join the shoot</div>
        <div className="border border-hairline bg-white p-6">
          {url && <QRCodeSVG value={url} size={420} level="M" marginSize={0} />}
        </div>
        <div className="font-display text-3xl">Scan, pick who you are, live the day.</div>
        <div className="text-sm text-muted-foreground tnum">{url.replace(/^https?:\/\//, '')}</div>
        <button onClick={() => onOpenChange(false)} className="h-9 rounded-sm border border-hairline px-4 text-sm hover:bg-muted">Close</button>
      </div>
    </div>
  );
}
