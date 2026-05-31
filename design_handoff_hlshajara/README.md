# Handoff: HLShajara design system → Next.js (TypeScript)

A drop-in package to bring the **حملة لستَ شجرة · HLShajara** design system into your Next.js 16 +
TypeScript app: token stylesheet, self-hosted fonts, typed React components, and a starter layout.

## ⚖️ Scope (please keep this boundary)

These components serve the platform's **evidence-based accountability core only** — named individuals/
entities tied to **documented conduct**, each with a credible public source. There are **no** components
for boycott or "social pressure" against any community/sect/group, and search/tagging is by
**conduct, role, and evidence strength — never identity**. This mirrors your own `data-model.json`
(no sect/religion field) and `workflow.json` rejection codes (`GROUP_TARGET`, `HATE_TONE`).

## What's in the box

```
design_handoff_hlshajara/
├── public/
│   ├── fonts/                     # Thmanyah OTFs (Serif Display · Serif Text · Sans)
│   └── logo.jpeg                  # the campaign seal
├── src/
│   ├── styles/tokens.css          # ← the token layer (colors, type roles, spacing, radii, shadows)
│   ├── app/
│   │   ├── fonts.ts               # next/font wiring → sets --font-* variables
│   │   ├── layout.tsx             # starter root layout (sets lang + dir)
│   │   └── example/page.tsx       # working usage example
│   ├── components/
│   │   ├── hlshajara.css          # component classes (consume the tokens)
│   │   ├── EvidenceStrength.tsx   # the 5-rung strength label
│   │   ├── StatusBadge.tsx        # legal-status dot + label
│   │   ├── SourceCitation.tsx     # tier mark + citation
│   │   ├── LegalNote.tsx          # recurring legal-note banner
│   │   ├── Button.tsx             # primary / secondary / ghost / danger
│   │   ├── EvidenceCard.tsx       # the signature card
│   │   └── index.ts               # barrel export
│   └── lib/
│       ├── types.ts               # domain types (Entity, Allegation, Source, …)
│       └── labels.ts              # bilingual label dictionaries (AR/EN)
└── tailwind.tokens.ts             # OPTIONAL Tailwind theme map
```

These `.tsx` files are **production-ready references**, not throwaway mocks: they're plain typed React
with no runtime dependencies beyond React + next/font. Adapt freely to your conventions.

## Install (5 steps)

1. **Copy files into your repo** (paths assume a `src/` app-router project):
   - `public/fonts/*` → `public/fonts/`
   - `public/logo.jpeg` → `public/`
   - `src/styles/tokens.css`, `src/components/*`, `src/lib/*`, `src/app/fonts.ts` → matching locations.

2. **Path alias.** These files import via `@/…`. Ensure `tsconfig.json` has:
   ```json
   { "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
   ```

3. **Wire fonts + global CSS** in your root layout — see `src/app/layout.tsx`. The key lines:
   ```tsx
   import { fontVars } from './fonts';
   import '@/styles/tokens.css';
   import '@/components/hlshajara.css';
   // <html lang={lang} dir={lang==='ar'?'rtl':'ltr'} className={fontVars}>
   ```
   `fonts.ts` assigns each family to a CSS variable (`--font-display`, `--font-sans`, …) that `tokens.css`
   already consumes — so the `.ds-*` type classes render in Thmanyah with **zero layout shift**.

4. **Use the components:**
   ```tsx
   import { EvidenceCard, EvidenceStrength, LegalNote, Button } from '@/components';

   <EvidenceStrength level={4} lang="ar" />
   <EvidenceCard entity={entity} lang={lang} onOpen={(e) => router.push(`/${lang}/entity/${e.id}`)} />
   ```
   See `src/app/example/page.tsx` for a full page.

5. **(Optional) Tailwind.** If you use Tailwind, merge `tailwind.tokens.ts` → `theme.extend` to get
   `bg-brand`, `text-fg2`, `font-display`, `rounded-lg`, `shadow-ds`, etc. The CSS variables remain the
   single source of truth; Tailwind just exposes them as utilities.

## Bilingual / RTL

- Drive everything from `dir` on `<html>` (or a localized `[lang]` segment). All component CSS uses
  **logical properties** (`margin-inline`, `border-inline-start`), so layouts mirror automatically.
- Keep IDs, source refs, and version stamps **LTR + monospace** even inside Arabic (the components already do).
- Label dictionaries live in `src/lib/labels.ts` — extend these rather than hard-coding strings.

## Design tokens (reference)

| Group | Tokens |
|---|---|
| **Brand green** (the seal) | `--green-700 #264D2E` (primary), 950→50 scale |
| **Stone neutrals** | `--fg1 #1B1A16`, `--fg2 #6B6457`, `--fg3`, `--border #E1DBCC` |
| **Warm whites** | `--bg #F7F3EA`, `--surface #FCFAF3` |
| **Accent (brass — evidence only)** | `--brass-500 #9A6B2B`; also the `--focus-ring` |
| **Correction brick** | `--brick-500 #8C3A2E` (rejections/takedowns only) |
| **Evidence ladder** | `--ev-0..4-*` (neutral → brass → green at the strongest rung) |
| **Status dots** | `--st-alleged/investigating/indicted/sanctioned/convicted/deceased` |
| **Type roles** | `.ds-display/.ds-h1/.ds-h2/.ds-h3/.ds-lead/.ds-body/.ds-caption/.ds-meta/.ds-eyebrow/.ds-mono` |
| **Spacing** | `--space-1..24` (4px base) |
| **Radii** | `--radius-sm 3` → `--radius-lg 12`, `--radius-pill` |
| **Elevation** | `--shadow-sm/--shadow/--shadow-md` (soft, low) |
| **Motion** | `--dur 200ms`, `--ease cubic-bezier(.2,0,.2,1)` |

## Fonts

Thmanyah (free, by ثمانية — https://font.thmanyah.com), self-hosted from `public/fonts`. IBM Plex Mono
(IDs/refs) is loaded via `next/font/google` — no brand monospace exists, so this is an intentional choice.

## Components not included here

The full archive also has a **search/filter sidebar**, **header with language toggle**, **entity detail**
page, and **reviewer console**. Those are interactive (client components) — use the reference recreation in
the design-system project (`ui_kits/archive/screens.jsx`) as the visual spec and build them on the same
tokens + component classes, wired to your Drizzle/Postgres data.
