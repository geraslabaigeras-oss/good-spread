import { z } from 'zod';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { safeFetch, safeUrl } from '@/lib/server/safe-fetch';

/**
 * Preview one model/agency profile URL the producer chose: page title, site name and the images on the page
 * (polaroids, portfolio), shown from the agency's own server. Nothing is crawled beyond this one page.
 */
const meta = (html: string, prop: string) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  const m = html.match(re);
  return (m?.[1] ?? m?.[2])?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
};

function pageImages(html: string, base: URL): string[] {
  const found: string[] = [];
  const add = (src?: string) => {
    if (!src) return;
    const s = src.trim().split(/\s+/)[0].replace(/&amp;/g, '&');
    if (!s || s.startsWith('data:')) return;
    try {
      const u = new URL(s, base);
      if (u.protocol !== 'https:') return;
      if (!/\.(jpe?g|png|webp)(\?|$)/i.test(u.pathname + u.search) && !/image|img|photo|media|cdn/i.test(u.href)) return;
      if (/logo|icon|sprite|favicon|avatar-default|placeholder|\.svg/i.test(u.href)) return;
      if (!found.includes(u.href)) found.push(u.href);
    } catch {}
  };
  add(meta(html, 'og:image'));
  for (const m of html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) add(m[1].split(',').pop());
  return found.slice(0, 16);
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, z.object({ url: z.string().trim().max(500) }));
    if ('error' in parsed) return parsed.error;
    if (!(await safeUrl(parsed.data.url))) return fail(400, 'invalid_url');
    const res = await safeFetch(parsed.data.url, 'text/html');
    if (!res) return fail(400, 'invalid_url');
    if (!res.ok) return fail(422, res.status === 403 ? 'site_blocks_previews' : 'page_unavailable');
    const url = new URL(res.url || parsed.data.url);
    const html = (await res.text()).slice(0, 2_000_000);
    const title = meta(html, 'og:title') ?? html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const images = pageImages(html, url);
    const site = meta(html, 'og:site_name') ?? url.hostname.replace(/^www\./, '');
    return ok({ title, image: images[0] ?? null, images, site, url: url.toString() });
  });
}
