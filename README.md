# لست شجرة · HLShajara

> منصّة توثيق ومساءلة ومقاطعة شعبية، موجَّهة ضد النظام السوري السابق ومنظومته الأمنية والعسكرية والنصيرية باعتبارها البيئة الحاضنة لهذا النظام.

**Live URL:** https://x0bdr.github.io/HLShajara  
**Repo:** https://github.com/x0bdr/HLShajara

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 + custom design tokens (`tokens.css`) |
| Fonts | Thmanyah Serif Display, Thmanyah Serif Text, Thmanyah Sans (self-hosted OTF) |
| Icons | Lucide React |
| Build | Turbopack (dev) · Static Export (`output: 'export'`) |
| Hosting | GitHub Pages (`basePath: '/HLShajara'`) |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/x0bdr/HLShajara.git
cd HLShajara

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev
# → http://localhost:3000/HLShajara

# 4. Build static export
npm run build
# → Output in ./out/
```

---

## Project Structure

```
src/
  app/                  # Next.js App Router
    fonts.ts            # next/font/local config (Thmanyah families)
    layout.tsx          # Root layout: RTL/LTR, font variables, global CSS
    page.tsx            # Landing page (demo entities + stats)
  components/
    EvidenceCard.tsx    # Signature card component
    EvidenceStrength.tsx
    StatusBadge.tsx
    LegalNote.tsx
    Button.tsx
    hlshajara.css       # Component classes (pills, badges, cards, buttons)
    index.ts            # Barrel export
  styles/
    tokens.css          # Design tokens: colors, type, spacing, shadows
  lib/
    types.ts            # Domain TypeScript types (Entity, Allegation, Source…)
    labels.ts           # Bilingual label dictionaries (AR/EN)

public/
  fonts/                # Self-hosted Thmanyah OTF files
  logo.jpeg

content/                # Project docs (data-model, principles, roadmap…)
design_handoff_hlshajara/  # Claude Design handoff (reference only)
```

---

## Design System

### Tokens (`src/styles/tokens.css`)

- **Color**: `--green-700` (#264D2E) brand primary · `--paper` (#F7F3EA) background · `--brass-*` accent for evidence ladder
- **Evidence ladder**: `ev-0` (neutral) → `ev-4` (institutional green, court-confirmed)
- **Typography**: `.ds-display` through `.ds-mono` — role-based classes, not ad-hoc sizes
- **RTL/LTR**: Logical properties throughout; `[dir=rtl]` overrides for radius and text direction

### Fonts

| Role | CSS Variable | File |
|------|--------------|------|
| Display | `--font-display` | `thmanyahserifdisplay-*.otf` |
| Reading | `--font-reading` | `thmanyahseriftext-*.otf` |
| Sans / UI | `--font-sans` | `thmanyahsans-*.otf` |
| Mono | `--font-mono` | IBM Plex Mono (Google Fonts) |

---

## Bilingual (AR/EN) Architecture

- `lang: 'ar' | 'en'` passed via `params.lang` in layout
- `<html lang={lang} dir={dir}>` toggles RTL/LTR automatically
- All label dictionaries live in `src/lib/labels.ts`
- Arabic gets `line-height: 1.6` override (`:lang(ar)`)

---

## Build & Deploy Workflow

```
# Local iteration
npm run dev          → Turbopack dev server at localhost:3000

# Pre-deploy verification
npm run build        → Static export to ./out/
# Check ./out/index.html, open in browser

# Ship
npm run build
# Commit + push
# GitHub Pages auto-deploys from master branch
```

---

## Content Boundary

This project documents **individuals and specific entities** with publicly available evidence. It is **not** a group-identity targeting platform. All entries are classified by:

- **Evidence strength** (0–4 ladder)
- **Legal-process status** (alleged → convicted)
- **Source tier** (A: international tribunal / B: reputable org / C: investigative journalism)
- **Right of reply** (contact recorded · statement on file or not)

> **Legal note**: Based on the Syrian Constitutional Declaration (13 March 2025), Articles 7 and 10 bind the state, not individuals directly. Article 13 guarantees freedom of expression. This content expresses a political opinion.

---

## License

Content and code are provided for civic documentation purposes. See repository for full terms.
