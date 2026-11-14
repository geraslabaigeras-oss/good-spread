import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** SSRF guard: https only, no credentials, public IPs only. */
const privateIp = (ip: string) =>
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
  ip === '::1' || /^f[cd]/i.test(ip) || /^fe80/i.test(ip) || ip.startsWith('::ffff:127.');

export async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname;
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!ips.length || ips.some(privateIp)) return null;
  return u;
}

/** Fetch with manual, re-checked redirects. */
export async function safeFetch(raw: string, accept: string, timeoutMs = 6000): Promise<Response | null> {
  let url = await safeUrl(raw);
  if (!url) return null;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'good-spread-link-preview/1.0', Accept: accept }, signal: AbortSignal.timeout(timeoutMs) });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      url = await safeUrl(new URL(loc, url).toString());
      if (!url) return null;
      continue;
    }
    return res;
  }
  return null;
}
