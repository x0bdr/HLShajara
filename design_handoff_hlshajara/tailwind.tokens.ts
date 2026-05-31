/**
 * OPTIONAL — only if you use Tailwind. Maps the CSS-variable tokens to Tailwind
 * utilities (bg-brand, text-fg2, rounded-md, shadow-ds, etc.). The variables are
 * still the source of truth (defined in src/styles/tokens.css); this just exposes
 * them as classes. Merge `theme.extend` into your tailwind.config.ts.
 */
import type { Config } from 'tailwindcss';

export const hlshajaraTheme: Config['theme'] = {
  extend: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      'surface-sunk': 'var(--surface-sunk)',
      fg1: 'var(--fg1)',
      fg2: 'var(--fg2)',
      fg3: 'var(--fg3)',
      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
      brand: 'var(--brand)',
      'brand-hover': 'var(--brand-hover)',
      'brand-press': 'var(--brand-press)',
      'on-green': 'var(--on-green)',
      brass: 'var(--brass-500)',
      brick: 'var(--brick-500)',
    },
    fontFamily: {
      display: 'var(--font-display)',
      reading: 'var(--font-reading)',
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      DEFAULT: 'var(--radius)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      pill: 'var(--radius-pill)',
    },
    boxShadow: {
      'ds-sm': 'var(--shadow-sm)',
      ds: 'var(--shadow)',
      'ds-md': 'var(--shadow-md)',
    },
  },
};
