/**
 * Weather-tile canvas: sky gradient, soft cloud puffs, rain, lightning.
 * Copied from gs-bento.html. Sky stops:
 *   calm  rgb(247,247,247) → rgb(247,247,247)
 *   storm rgb(150,154,158) → rgb(210,212,214)
 * Clouds: 9 radial puffs, r 120–280, drift 6–16 px/s, grey 110–150,
 * alpha (.10 + .30 * storm) * puffAlpha, ellipse (r, r * 0.55).
 *
 * Depends on effects/rain.js, effects/lightning.js, motion/lightning.js.
 */
(function (root) {
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mix(a, b, k) {
    return "rgb(" + a.map(function (v, i) { return Math.round(lerp(v, b[i], k)); }).join(",") + ")";
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function cl(x, a, b) { return Math.min(b == null ? 1 : b, Math.max(a == null ? 0 : a, x)); }
  function seg(t, a, b) { return cl((t - a) / (b - a)); }

  function paintSky(ctx, w, h, storm) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix([247, 247, 247], [150, 154, 158], storm));
    g.addColorStop(1, mix([247, 247, 247], [210, 212, 214], storm));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function makeClouds(w, h, random) {
    const R = random || Math.random;
    const clouds = [];
    for (let i = 0; i < 9; i++) {
      clouds.push({
        x: R() * w,
        y: 20 + R() * h * 0.45,
        r: 120 + R() * 160,
        v: 6 + R() * 10,
        a: 0.6 + R() * 0.4,
        c: 110 + Math.round(R() * 40),
      });
    }
    return clouds;
  }

  function stepClouds(clouds, dt, w) {
    for (let i = 0; i < clouds.length; i++) {
      const p = clouds[i];
      p.x += p.v * dt / 1000;
      if (p.x - p.r > w) p.x = -p.r;
    }
  }

  function paintClouds(ctx, clouds, storm) {
    for (let i = 0; i < clouds.length; i++) {
      const p = clouds[i];
      const a = (0.10 + 0.30 * storm) * p.a;
      const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      rg.addColorStop(0, "rgba(" + p.c + "," + p.c + "," + (p.c + 4) + "," + a + ")");
      rg.addColorStop(1, "rgba(" + p.c + "," + p.c + "," + (p.c + 4) + ",0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r, p.r * 0.55, 0, 0, 6.283);
      ctx.fill();
    }
  }

  /**
   * Draw one weather frame.
   * t is loop time in ms (11s loop in the bento).
   * envelopeFn(msSinceFlashStart) defaults to the measured 1000ms envelope.
   * Pass lightningEnvelopeBento and set flashAt=5000 to match the live bento.
   */
  function paintWeather(ctx, state, t, dt, opts) {
    opts = opts || {};
    const w = state.w, h = state.h;
    const storm = easeInOutCubic(seg(t, 1200, 3800)) * (1 - easeInOutCubic(seg(t, 9000, 10600)));
    const rain = easeOutCubic(seg(t, 3000, 4600)) * (1 - easeOutCubic(seg(t, 8800, 10200)));
    const flashAt = opts.flashAt == null ? 5000 : opts.flashAt;
    const env = opts.envelopeFn || root.lightningEnvelope;
    const ft = t - flashAt;
    const f = env ? env(ft) : 0;

    paintSky(ctx, w, h, storm);
    if (state.clouds) {
      stepClouds(state.clouds, dt, w);
      paintClouds(ctx, state.clouds, storm);
    }
    if (state.drops && root.gsRain) {
      root.gsRain.stepDrops(state.drops, dt, w, h, rain);
      root.gsRain.paintRain(ctx, state.drops, rain);
    }
    if (f > 0.01 && root.gsLightning) {
      if (!state.bolt || ft < 20) state.bolt = root.gsLightning.mkBolt(w, h);
      root.gsLightning.paintLightning(ctx, w, h, f, state.bolt);
    }
    return { storm: storm, rain: rain, flash: f };
  }

  function makeState(w, h) {
    return {
      w: w,
      h: h,
      clouds: makeClouds(w, h),
      drops: root.gsRain ? root.gsRain.makeDrops(w, h, 170) : [],
      bolt: null,
    };
  }

  root.gsWeather = {
    paintSky, makeClouds, stepClouds, paintClouds,
    paintWeather, makeState,
    easeInOutCubic, easeOutCubic, seg, mix,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
