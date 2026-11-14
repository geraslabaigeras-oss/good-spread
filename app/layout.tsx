import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader, Schibsted_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const serif = Newsreader({ subsets: ['latin', 'latin-ext'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Schibsted_Grotesk({ subsets: ['latin', 'latin-ext'], variable: '--font-schibsted', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'latin-ext'], weight: ['200', '300', '400', '500'], variable: '--font-inter', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Good Spread',
  description: 'Producers plan it. Talent lives it. One change updates everyone.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f1efe8' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
