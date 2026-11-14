/**
 * Weather-tile rain, copied from gs-bento.html.
 * 170 streaks. Each drop: v 620–1000 px/s, length 9–21, width 0.6–1.3,
 * alpha 0.35–0.80, a random k so some appear only as rain intensity rises.
 * Drift is v * 0.12 horizontally (down-right). Colour is white, not a glow.
 * rain is 0..1, faded in 3000–4600ms and out 8800–10200ms of the 11s loop.
 */
(function (root) {
  function makeDrops(w, h, n, random) {
    const R = random || Math.random;
    const count = n == null ? 170 : n;
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: R() * w,
        y: R() * h,
        v: 620 + R() * 380,
        l: 9 + R() * 12,
        w: 0.6 + R() * 0.7,
        a: 0.35 + R() * 0.45,
        k: R(),
      });
    }
    return drops;
  }

  function stepDrops(drops, dt, w, h, rain) {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.v * dt / 1000;
      d.x += d.v * 0.12 * dt / 1000;
      if (d.y > h + 20) {
        d.y = -20 - Math.random() * h * 0.3;
        d.x = Math.random() * w * 1.1 - w * 0.1;
      }
    }
    return rain;
  }

  function paintRain(ctx, drops, rain) {
    if (rain <= 0.01) return;
    ctx.lineCap = "round";
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.k > rain) continue;
      ctx.strokeStyle = "rgba(255,255,255," + d.a * rain + ")";
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.l * 0.12, d.y - d.l);
      ctx.stroke();
    }
  }

  root.gsRain = { makeDrops, stepDrops, paintRain };
})(typeof globalThis !== "undefined" ? globalThis : this);
