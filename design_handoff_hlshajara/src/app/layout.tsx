import type { ReactNode } from 'react';
import { fontVars } from './fonts';
import '@/styles/tokens.css';
import '@/components/hlshajara.css';

/**
 * Root layout for a localized (AR/EN) app.
 * With an app/[lang]/ segment, pass params.lang; otherwise default to 'ar'.
 * Setting dir on <html> drives the entire bidirectional system — every component
 * uses logical properties, so the layout mirrors automatically.
 */
export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params?: { lang?: 'ar' | 'en' };
}) {
  const lang = params?.lang ?? 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} className={fontVars}>
      <body
        style={{
          margin: 0,
          background: 'var(--bg)',
          color: 'var(--fg1)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
