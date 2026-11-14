/**
 * Weather-tile lightning, copied from gs-bento.html.
 * Crisp jagged bolt + a soft full-tile white flash. No glow.
 * Flash fill is rgba(255,255,255, 0.55 * envelope).
 * Bolt stroke is white, lineWidth 1.4 then 0.8, lineJoin round.
 *
 * Prefer lightningEnvelope (measured, 1000ms) from ../motion/lightning.js.
 * lightningEnvelopeBento is the 700ms variant the current bento uses.
 */
(function (root) {
  function mkBolt(w, h, random) {
    const R = random || Math.random;
    let x = w * (0.42 + R() * 0.12), y = -10;
    const main = [[x, y]];
    while (y < h * 0.62) {
      y += 10 + R() * 16;
      x += (R() - 0.5) * 22;
      main.push([x, y]);
    }
    const br = [];
    const s = main[3 + Math.floor(R() * 3)];
    let bx = s[0], by = s[1];
    br.push([bx, by]);
    for (let i = 0; i < 5; i++) {
      by += 10 + R() * 12;
      bx += 8 + R() * 14;
      br.push([bx, by]);
    }
    return [main, br];
  }

  function paintLightning(ctx, w, h, envelope, bolt) {
    const f = envelope;
    if (f <= 0.01 || !bolt) return;
    ctx.fillStyle = "rgba(255,255,255," + 0.55 * f + ")";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255," + Math.min(1, f * 1.1) + ")";
    ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    for (const pl of bolt) {
      ctx.beginPath();
      pl.forEach(function (p, i) {
        if (i) ctx.lineTo(p[0], p[1]);
        else ctx.moveTo(p[0], p[1]);
      });
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
  }

  root.gsLightning = { mkBolt, paintLightning };
})(typeof globalThis !== "undefined" ? globalThis : this);
