import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Host_Grotesk, Instrument_Serif, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

// Geist (Vercel) for UI and figures, Instrument Serif for editorial display type.
const sans = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-geist', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-geist-mono', display: 'swap' });
// good-spread site type (components/flow): Inter light for display, Schibsted Grotesk for UI
// brand type: Host Grotesk (Identity 01). Kept on the --font-inter variable so existing display styles pick it up.
const inter = Host_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600', '800'], variable: '--font-inter', display: 'swap' });
const schibsted = Schibsted_Grotesk({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-schibsted', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

export const metadata: Metadata = {
  title: 'Good Spread',
  description: 'Producers plan it. Talent lives it. One change updates everyone.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f1efe8' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${inter.variable} ${schibsted.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
