'use client';

import { useEffect, useRef } from 'react';

/**
 * A depth read of the photo itself: the image is sampled into rows, and each row is drawn as a blue line
 * lifted by the brightness under it (a simple depth map from light). A scan band sweeps down, lines ripple
 * gently behind it. Pure canvas, computed from the real pixels.
 */
export function DepthScan({ src, rows = 46, className }: { src: string; rows?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let off = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (off) return;
      const W = canvas.clientWidth, H = canvas.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      // sample brightness (cover-fit like the photo underneath)
      const cols = 90;
      const s = document.createElement('canvas');
      s.width = cols; s.height = rows;
      const sc = s.getContext('2d')!;
      const r = Math.max(cols / img.width, rows / img.height);
      sc.drawImage(img, (cols - img.width * r) / 2, (rows - img.height * r) / 2, img.width * r, img.height * r);
      let px: Uint8ClampedArray;
      try { px = sc.getImageData(0, 0, cols, rows).data; } catch { return; } // tainted image: skip the effect
      const lum = (x: number, y: number) => { const i = (y * cols + x) * 4; return (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255; };
      const t0 = performance.now();
      const gap = H / rows;
      const draw = (now: number) => {
        const t = (now - t0) / 1000;
        const scan = ((t / 3.2) % 1.25) * H; // sweep top to bottom, short pause
        ctx.clearRect(0, 0, W, H);
        for (let y = 0; y < rows; y++) {
          const baseY = (y + 0.5) * gap;
          const reveal = Math.max(0, Math.min(1, (scan - baseY) / (H * 0.25) + 1));
          const near = Math.max(0, 1 - Math.abs(scan - baseY) / (gap * 6));
          if (reveal <= 0) continue;
          ctx.beginPath();
          for (let x = 0; x < cols; x++) {
            const depth = lum(x, y);
            const ripple = Math.sin(x * 0.22 + t * 2.2 + y * 0.4) * (1.2 + near * 4);
            const px2 = (x / (cols - 1)) * W;
            const py = baseY - depth * gap * 2.4 * reveal + ripple * reveal;
            if (x === 0) ctx.moveTo(px2, py); else ctx.lineTo(px2, py);
          }
          ctx.strokeStyle = `rgba(${120 - near * 60}, ${175 + near * 40}, 255, ${0.35 + reveal * 0.4 + near * 0.25})`;
          ctx.lineWidth = 1 + near * 1.2;
          ctx.stroke();
        }
        // the scan band
        const g = ctx.createLinearGradient(0, scan - 40, 0, scan + 4);
        g.addColorStop(0, 'rgba(120,180,255,0)');
        g.addColorStop(1, 'rgba(160,210,255,0.35)');
        ctx.fillStyle = g;
        ctx.fillRect(0, scan - 40, W, 44);
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    };
    img.src = src;
    return () => { off = true; cancelAnimationFrame(raf); };
  }, [src, rows]);

  return <canvas ref={ref} className={className} />;
}
