import { fail, handle, ok } from '@/lib/server/http';

import { AIRPORTS } from '@/lib/airports';

type Plane = { id: string; callsign: string; country: string; lat: number; lon: number; altM: number | null; speedKmh: number | null; heading: number | null; climb: number | null; onGround: boolean; distKm: number };
const cache = new Map<string, { at: number; planes: Plane[] }>();

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Live aircraft around an airport, from the OpenSky Network (ADS-B, free, no key). Cached 10 s. */
export async function GET(req: Request) {
  return handle(async () => {
    const code = (new URL(req.url).searchParams.get('airport') ?? 'VNO').toUpperCase();
    const ap = AIRPORTS[code];
    if (!ap) return fail(400, 'unknown_airport');
    const hit = cache.get(code);
    if (hit && Date.now() - hit.at < 10_000) return ok({ airport: { code, ...ap }, planes: hit.planes, source: 'OpenSky Network', at: hit.at });
    // 1) adsb.lol (open ADS-B community feed, works from cloud servers)
    try {
      const r = await fetch(`https://api.adsb.lol/v2/point/${ap.lat}/${ap.lon}/80`, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
      if (r.ok) {
        const j = (await r.json()) as { ac?: Record<string, unknown>[] };
        const planes: Plane[] = (j.ac ?? [])
          .filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number')
          .map((a) => {
            const pos = { lat: a.lat as number, lon: a.lon as number };
            const ground = a.alt_baro === 'ground';
            return {
              id: String(a.hex), callsign: String(a.flight ?? '').trim(), country: String(a.t ?? ''), ...pos,
              altM: ground ? 0 : typeof a.alt_baro === 'number' ? Math.round(a.alt_baro * 0.3048) : null,
              speedKmh: typeof a.gs === 'number' ? Math.round(a.gs * 1.852) : null,
              heading: typeof a.track === 'number' ? a.track : (typeof a.true_heading === 'number' ? a.true_heading : null),
              climb: typeof a.baro_rate === 'number' ? a.baro_rate * 0.00508 : null, onGround: ground, distKm: Math.round(km(ap, pos)),
            };
          })
          .sort((x, y) => x.distKm - y.distKm)
          .slice(0, 60);
        cache.set(code, { at: Date.now(), planes });
        return ok({ airport: { code, ...ap }, planes, source: 'adsb.lol', at: Date.now() });
      }
    } catch { /* fall through to OpenSky */ }

    // 2) OpenSky Network
    const box = `lamin=${ap.lat - 1.2}&lomin=${ap.lon - 2}&lamax=${ap.lat + 1.2}&lomax=${ap.lon + 2}`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(`https://opensky-network.org/api/states/all?${box}`, { signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) {
        if (hit) return ok({ airport: { code, ...ap }, planes: hit.planes, source: 'OpenSky Network', at: hit.at, stale: true });
        return fail(502, 'radar_unavailable', { status: r.status });
      }
      const j = (await r.json()) as { states: unknown[][] | null };
      const planes: Plane[] = (j.states ?? [])
        .filter((s) => typeof s[5] === 'number' && typeof s[6] === 'number')
        .map((s) => {
          const p = { lat: s[6] as number, lon: s[5] as number };
          return {
            id: String(s[0]), callsign: String(s[1] ?? '').trim(), country: String(s[2] ?? ''),
            ...p, altM: (s[7] as number | null) ?? (s[13] as number | null), speedKmh: s[9] != null ? Math.round((s[9] as number) * 3.6) : null,
            heading: (s[10] as number | null), climb: (s[11] as number | null), onGround: !!s[8], distKm: Math.round(km(ap, p)),
          };
        })
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 60);
      cache.set(code, { at: Date.now(), planes });
      return ok({ airport: { code, ...ap }, planes, source: 'OpenSky Network', at: Date.now() });
    } catch {
      if (hit) return ok({ airport: { code, ...ap }, planes: hit.planes, source: 'OpenSky Network', at: hit.at, stale: true });
      return fail(504, 'radar_timeout');
    } finally {
      clearTimeout(t);
    }
  });
}
