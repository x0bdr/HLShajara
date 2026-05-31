import localFont from 'next/font/local';
import { IBM_Plex_Mono } from 'next/font/google';

/**
 * Self-hosted Thmanyah families (free, by ثمانية — https://font.thmanyah.com).
 * OTF files live in /public/fonts. Each `variable` is consumed by tokens.css
 * (var(--font-display) etc.), so the .ds-* type classes "just work".
 */
export const thmanyahDisplay = localFont({
  variable: '--font-display',
  display: 'swap',
  src: [
    { path: '../../public/fonts/thmanyahserifdisplay-Light.otf',   weight: '300', style: 'normal' },
    { path: '../../public/fonts/thmanyahserifdisplay-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/thmanyahserifdisplay-Medium.otf',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/thmanyahserifdisplay-Bold.otf',    weight: '700', style: 'normal' },
    { path: '../../public/fonts/thmanyahserifdisplay-Black.otf',   weight: '900', style: 'normal' },
  ],
});

export const thmanyahReading = localFont({
  variable: '--font-reading',
  display: 'swap',
  src: [
    { path: '../../public/fonts/thmanyahseriftext-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/thmanyahseriftext-Medium.otf',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/thmanyahseriftext-Bold.otf',    weight: '700', style: 'normal' },
  ],
});

export const thmanyahSans = localFont({
  variable: '--font-sans',
  display: 'swap',
  src: [
    { path: '../../public/fonts/thmanyahsans-Light.otf',   weight: '300', style: 'normal' },
    { path: '../../public/fonts/thmanyahsans-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/thmanyahsans-Medium.otf',  weight: '500', style: 'normal' },
    { path: '../../public/fonts/thmanyahsans-Bold.otf',    weight: '700', style: 'normal' },
    { path: '../../public/fonts/thmanyahsans-Black.otf',   weight: '900', style: 'normal' },
  ],
});

/** No brand monospace was supplied — IBM Plex Mono covers IDs / source refs / audit stamps. */
export const plexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
});

/** Convenience: spread onto <html className>. */
export const fontVars = [
  thmanyahDisplay.variable,
  thmanyahReading.variable,
  thmanyahSans.variable,
  plexMono.variable,
].join(' ');
