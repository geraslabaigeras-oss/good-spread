import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';

/**
 * Link preview for a model/agency profile URL: reads the page's public Open Graph tags
 * (og:title, og:image, og:site_name), like a chat app's link preview. One URL, chosen by the producer.
 * Guarded against SSRF: https only, public IPs only, 3 redirects, 6 s, 1.5 MB.
 */
const privateIp = (ip: string) =>
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
  ip === '::1' || /^f[cd]/i.test(ip) || /^fe80/i.test(ip) || ip.startsWith('::ffff:127.');

async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname;
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!ips.length || ips.some(privateIp)) return null;
  return u;
}

const meta = (html: string, prop: string) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  const m = html.match(re);
  return (m?.[1] ?? m?.[2])?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
};

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ url: z.string().trim().max(500) }));
    if ('error' in parsed) return parsed.error;
    let url = await safeUrl(parsed.data.url);
    if (!url) return fail(400, 'invalid_url');
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'good-spread-link-preview/1.0', Accept: 'text/html' }, signal: AbortSignal.timeout(6000) });
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        url = await safeUrl(new URL(loc, url).toString());
        if (!url) return fail(400, 'invalid_redirect');
        continue;
      }
      break;
    }
    if (!res || !res.ok) return fail(422, res?.status === 403 ? 'site_blocks_previews' : 'page_unavailable');
    const html = (await res.text()).slice(0, 1_500_000);
    const title = meta(html, 'og:title') ?? html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const imgRaw = meta(html, 'og:image') ?? meta(html, 'twitter:image');
    const image = imgRaw ? await safeUrl(new URL(imgRaw, url).toString()) : null;
    const site = meta(html, 'og:site_name') ?? url.hostname.replace(/^www\./, '');
    return ok({ title, image: image?.toString() ?? null, site, url: url.toString() });
  });
}
