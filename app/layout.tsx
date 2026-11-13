import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'latin-ext'] });
const instrument = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin', 'latin-ext'], weight: '400' });

export const metadata: Metadata = {
  title: 'GOOD SPREAD',
  description: 'Producers plan it. Talent lives it. One change updates everyone.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAFAF7',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
