import type { MetadataRoute } from 'next';

/** Unlisted: the site is shared by link only and kept out of search engines. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
