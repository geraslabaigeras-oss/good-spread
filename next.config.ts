import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Keep dev from writing a large cache to disk (the machine is low on space).
  experimental: { turbopackFileSystemCacheForDev: false },
  // approved talent book and crew ship with the API routes on the live site (never in git)
  outputFileTracingIncludes: { '/api/**': ['./private/**/*'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
