# UI Review — HLShajara Frontend

**Audit date:** 2026-05-31  
**Scope:** All user-facing pages and components (`src/app/[locale]/*`, `src/components/*`)  
**Baseline:** `DESIGN ASSETS/README.md` + `colors_and_type.css` design system spec  
**Staging:** `https://staging.hlshajara.com`

---

## Score Summary

| Pillar | Score | /4 |
|--------|-------|-----|
| Copywriting | 3 | /4 |
| Visuals | 3 | /4 |
| Color | 2 | /4 |
| Typography | 3 | /4 |
| Spacing | 3 | /4 |
| Experience Design | 2 | /4 |
| **Overall** | **16** | **/24** |

---

## 1. Copywriting (3/4)

### What's working
- **Bilingual parity** is strong. Arabic copy is native, not translated — e.g. «الدليل لا الادّعاء», «سلوك لا هوية».
- **Voice is correct:** formal, restrained, exact. No hyperbole, no exclamation, no slang.
- **"Conduct, not identity"** principle is reflected in labels and filter copy.
- Legal note copy is present and consistent across pages.
- Right-of-reply surfaced on every card.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `record` namespace has `status_confirmed` and `status_disputed` but the actual `EntityStatus` enum is `alleged/investigating/indicted/sanctioned/convicted/deceased`. These translation keys don't map to real data. | Medium | `messages/ar.json`, `messages/en.json` |
| 2 | Dashboard stat cards use hardcoded value labels in code (not translated via `useTranslations`). | Low | `src/app/[locale]/dashboard/page.tsx` |
| 3 | Filter notice text is hardcoded in `ArchiveHome.tsx` (not in messages). | Low | `src/components/ArchiveHome.tsx` |
| 4 | Footer creed tags are hardcoded arrays in component, not in messages. | Low | `src/components/Footer.tsx` |
| 5 | Homepage title uses `home.title` = "LST Shajara" / "لست شجرة" but the spec's intended homepage title is "An archive of record" / "سجلٌّ موثَّق". The campaign name works as brand but the archive title is missing. | Medium | `messages/*/home.title` |

### Fixes
- [ ] Add `status_investigating`, `status_indicted`, `status_sanctioned`, `status_convicted`, `status_deceased` to messages. Remove unused `status_confirmed`/`status_disputed`.
- [ ] Move filter-notice and creed strings to `messages/*.json`.
- [ ] Consider adding an `archiveTitle` key that matches the spec's "An archive of record" voice.

---

## 2. Visuals (3/4)

### What's working
- **Header** matches spec: sticky, backdrop blur `rgba(paper, 0.92)`, seal + bilingual lockup, language toggle.
- **Evidence cards** match the preview spec: 1px hairline border, 12px radius, soft shadow, hover lift.
- **Filter sidebar** matches the UI kit: chip toggles, brick-colored identity-filter notice.
- **Footer** matches spec: dark green field, seal, brand name, creed tags as translucent pills.
- **Seal is used correctly** — never recolored, on warm paper or dark green only.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Record, Submit, Entity, Login, Dashboard pages have NO Header or Footer.** Users land on these pages and lose all navigation context. They feel like disconnected islands. | **High** | All `/[locale]/*` client pages |
| 2 | **Hero section compromises the spec.** The spec explicitly states: "No hero imagery, no full-bleed photography, no textures, no patterns, no gradients." The current hybrid keeps a hero with large seal and campaign title. It looks good but is a spec violation. | Medium | `src/components/HeroSection.tsx` |
| 3 | **Dashboard page is visually completely different** from the rest of the site. Uses bright traffic-light colors, no cards, no design tokens, inline styles everywhere. | **High** | `src/app/[locale]/dashboard/page.tsx` |
| 4 | **Evidence cards on homepage are not clickable.** They have `.interactive` hover styling but no `onOpen` handler is passed from `ArchiveHome`. Users expect to click through to detail. | Medium | `src/components/ArchiveHome.tsx` |
| 5 | **Stats bar uses a different visual treatment** on mobile (stacked with borders) vs the spec's restrained approach. Acceptable hybrid but not in the original UI kit. | Low | `src/components/hlshajara.css` |

### Fixes
- [ ] **Add Header + Footer to all pages.** Either wrap each page's `main` content, or create a shared `PageShell` layout component.
- [ ] **Restrain hero further** or remove it entirely per spec. If keeping, reduce seal to 48px and title to `text-2xl` max.
- [ ] **Redesign Dashboard** to use the design token system. Replace bright colors with stone/green/brick palette. Use `.card` classes.
- [ ] **Wire up EvidenceCard `onOpen`** in `ArchiveHome` to route to `/${locale}/entity/${e.id}`.

---

## 3. Color (2/4)

### What's working
- Token system is excellent: green (`#264D2E`), stone (`#1B1A16`), brass (`#9A6B2B`), brick (`#8C3A2E`), warm paper (`#F7F3EA`).
- Evidence-strength ladder is correct: neutral → brass → green at strongest rung.
- Status dots are muted, not traffic-light rainbow.
- Focus ring uses brass (`--brass-500`), consistent across components.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Dashboard uses bright traffic-light colors:** `#16a34a` (green), `#dc2626` (red), `#2563eb` (blue), `#ca8a04` (yellow), `#7c3aed` (purple). This completely violates the spec: "No saturated UI colors. Status uses muted dots, never a traffic-light palette." | **High** | `src/app/[locale]/dashboard/page.tsx` |
| 2 | **Dashboard stat cards use `borderTop` colored bars** — a pattern not used anywhere else and not in the spec. | Medium | `src/app/[locale]/dashboard/page.tsx` |
| 3 | **Stats bar numbers use `--brand` (green-700)** which is correct, but the bar borders use `--border` which is subtle. On mobile the stacked borders feel heavy. | Low | `src/components/hlshajara.css` |
| 4 | **Active nav link uses `background: var(--green-700); color: var(--on-green)`** — correct per spec, but the transition from transparent to solid green is slightly jarring. A subtle background fade would help. | Low | `src/components/hlshajara.css` |

### Fixes
- [ ] **Dashboard color overhaul:** Replace all hardcoded hexes with semantic tokens. Suggested mapping:
  - Published → `--green-700`
  - Rejected → `--brick-500`
  - Corrected → `--brass-600`
  - Pending → `--stone-600`
  - Under Review → `--brass-500`
- [ ] Remove colored `borderTop` from dashboard cards. Use evidence-strength pill style or simple card with status dot.

---

## 4. Typography (3/4)

### What's working
- **Thmanyah font families** loaded correctly via `next/font/local` with all weights.
- **IBM Plex Mono** for IDs/refs is correct.
- **Type scale** is well-defined (`--text-xs` through `--text-4xl`).
- **`.ds-*` semantic classes** exist and are used on homepage.
- **Arabic gets `line-height: 1.6`** for generous leading.
- **LTR IDs inside Arabic** are preserved with `direction: ltr` on `.card .id`.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Dashboard uses hardcoded `fontSize: 36`** without type tokens. No `font-family` specified for numbers. | Medium | `src/app/[locale]/dashboard/page.tsx` |
| 2 | **Many client pages use inline `style={{...}}`** instead of `.ds-*` classes or token variables. This breaks the type system and makes the code unmaintainable. | Medium | `RecordClient`, `SubmitClient`, `EntityDetailClient`, `LoginClient`, `Dashboard` |
| 3 | **Hero title uses `font-weight: 900` (Black)** which is very heavy. In Arabic at large sizes this can feel aggressive. The spec uses `font-weight: 700` for `.ds-display`. | Low | `src/components/hlshajara.css` |
| 4 | **IBM Plex Mono only loads `subsets: ['latin']`**. Arabic numerals in IDs (e.g. `ENT-2024-0117`) will fall back to system mono. This is minor since IDs are Latin-only. | Low | `src/app/fonts.ts` |
| 5 | **Filter group labels use `letter-spacing: 0.07em` and `text-transform: uppercase`** for Latin, but the `[dir=rtl]` override only removes letter-spacing. The uppercase transform stays, which is wrong for Arabic. | Low | `src/components/hlshajara.css` |

### Fixes
- [ ] Refactor all client pages to use `.ds-*` classes and CSS variables instead of inline styles.
- [ ] Reduce hero title weight to `700` or keep `900` only for EN, `700` for AR.
- [ ] Fix `[dir=rtl] .filter-group-label` to also unset `text-transform: uppercase`.

---

## 5. Spacing (3/4)

### What's working
- **Logical properties** (`padding-inline`, `border-inline-start`, `border-inline-end`) used throughout — RTL/LTR mirrors correctly.
- **4px base scale** (`--space-1` through `--space-24`) is consistent.
- **Homepage max-width 1080px** matches the UI kit spec.
- **Card padding** (15–18px) matches the preview spec.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Record, Submit, Entity, Login, Dashboard pages use `maxWidth: 920` and `padding: 32px`** — inconsistent with homepage's 1080px / 20px. | Medium | All client pages |
| 2 | **No shared layout wrapper.** Each page defines its own `main` wrapper dimensions. A `PageShell` component would enforce consistency. | Medium | All pages |
| 3 | **Filter sidebar width is 280px** but the spec's UI kit uses `300px`. Minor. | Low | `src/components/hlshajara.css` |
| 4 | **Hero padding (`36px 20px 0`) + stats bar + legal note + archive section** creates a lot of vertical whitespace before any content. The legal note feels orphaned between stats and archive. | Low | `src/app/[locale]/page.tsx` composition |
| 5 | **Mobile filter sidebar stacks BELOW results** (`order: 2`). Users on small screens see results first, then filters. This is backwards — filters should be collapsible at top or in a drawer. | Medium | `src/components/hlshajara.css` |

### Fixes
- [ ] Create a `PageShell` component: `max-width: 1080px`, consistent padding, includes Header + Footer.
- [ ] Wrap all pages in `PageShell`.
- [ ] On mobile, consider making the filter sidebar collapsible (accordion or drawer) instead of stacking below.

---

## 6. Experience Design (2/4)

### What's working
- **Sticky header** provides persistent navigation.
- **Language toggle** works and flips direction correctly.
- **Search debouncing** on `/record` page (300ms) is good UX.
- **Filter chips** have clear active states with checkmark.
- **Card hover** (shadow lift + 2px translate) is calm and appropriate.
- **Focus rings** are visible and consistent (2px brass, 2px offset).
- **Legal note** is recurring and prominent.

### Issues
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Homepage evidence cards are not clickable.** The `EvidenceCard` component supports `onOpen` but `ArchiveHome` never passes it. Users see hover effects but nothing happens on click. | **High** | `src/components/ArchiveHome.tsx` |
| 2 | **No loading skeletons.** Record, Entity, and Dashboard pages show plain text ("جارِ التحميل..." / "Loading...") instead of skeleton placeholders. | Medium | `RecordClient`, `EntityDetailClient`, `Dashboard` |
| 3 | **Two different search/filter UX patterns:** Homepage does client-side filtering. `/record` does server-side debounced API calls. Users get different behaviors on what looks like the same archive. | **High** | `src/components/ArchiveHome.tsx` vs `src/app/[locale]/record/RecordClient.tsx` |
| 4 | **No pagination.** Homepage limits to 50 entities. If there are more, they're silently hidden. The `/record` page has no pagination either. | **High** | Both archive views |
| 5 | **No empty state design.** When no entities match filters, the page shows plain text "No results." No illustration, no CTA to submit. | Medium | `src/components/ArchiveHome.tsx` |
| 6 | **Stats bar shows "0" for everything when DB is empty.** Looks broken rather than intentional. Should show "—" or hide the bar. | Low | `src/components/StatsBar.tsx` |
| 7 | **No error boundaries.** If `fetch()` fails on Record/Entity/Dashboard, the UI stays in "Loading..." forever. | Medium | All client data-fetching pages |
| 8 | **Submit page has no progress indicator** during file upload — just "جارِ الرفع..." text. No upload percentage. | Low | `src/app/[locale]/submit/SubmitClient.tsx` |
| 9 | **Login page has no "show password" toggle.** Basic accessibility feature missing. | Low | `src/app/[locale]/login/LoginClient.tsx` |
| 10 | **Dashboard page is not linked from the header nav.** The nav has "Dashboard" but the dashboard page has no header, so the link is there but the destination feels broken. | Medium | Circular — header has link, dashboard has no header |

### Fixes
- [ ] **Wire up card clicks** to route to entity detail.
- [ ] **Unify search/filter architecture.** Either make both client-side (load all, filter in JS) or both server-side (API with pagination). Client-side is simpler for <100 records; server-side scales better.
- [ ] **Add pagination** to both archive views.
- [ ] **Add loading skeletons** using the card shape as a placeholder.
- [ ] **Add error states** — "Failed to load. Retry" with a button.
- [ ] **Improve empty state** — show a styled message + "Submit a report" CTA.
- [ ] **Add Header + Footer to all pages** (fixes #10 and the navigation context issue).

---

## Functionality Audit

### API & Data Flow
| Feature | Status | Notes |
|---------|--------|-------|
| Homepage entity fetch | ✓ Working | Falls back to empty array during build |
| Homepage client-side filter | ✓ Working | Status, type, evidence, search |
| `/record` server-side filter | ✓ Working | Debounced API calls |
| Entity detail fetch | ✓ Working | Loads by publicId |
| Submit form | ✓ Working | Anonymous + authenticated |
| File upload | ✓ Working | SHA-256 hashed filenames |
| Login (email/password) | ✓ Working | Better Auth integration |
| 2FA (TOTP) | ✓ Working | Required for staff routes |
| Dashboard stats | ✓ Working | Aggregated from DB |
| Right of reply form | ✓ Working | `/reply` page |
| Language switch | ✓ Working | Client-side route replace |

### Broken / Missing Functionality
| # | Issue | Severity |
|---|-------|----------|
| 1 | **Evidence cards don't link to detail pages.** | High |
| 2 | **No pagination** — archive views silently truncate at 50. | High |
| 3 | **No `loading` skeletons** — plain text loaders. | Medium |
| 4 | **No error handling** on fetch failures — infinite "Loading...". | Medium |
| 5 | **Dashboard not visually integrated** — different design language. | Medium |
| 6 | **Record page has no Header/Footer** — navigation lost. | High |
| 7 | **Submit page has no Header/Footer** — navigation lost. | High |
| 8 | **Entity detail has no Header/Footer** — navigation lost. | High |
| 9 | **Login has no Header/Footer** — navigation lost. | Medium |
| 10 | **Reviewer console has no Header/Footer** — navigation lost. | Medium |

---

## Top 5 Priority Fixes

1. **Add Header + Footer to ALL pages** — this is the biggest UX gap. Every page except homepage feels disconnected.
2. **Wire up evidence card clicks** to entity detail — users expect to navigate from cards.
3. **Redesign Dashboard** to use the design token system — currently looks like a different product.
4. **Unify search/filter** — pick one pattern (client-side or server-side) and apply consistently.
5. **Add pagination** — silent truncation is a data integrity issue, not just UX.

---

## Files Audited

```
src/app/[locale]/page.tsx
src/app/[locale]/layout.tsx
src/app/[locale]/record/RecordClient.tsx
src/app/[locale]/submit/SubmitClient.tsx
src/app/[locale]/entity/[id]/EntityDetailClient.tsx
src/app/[locale]/dashboard/page.tsx
src/app/[locale]/login/LoginClient.tsx
src/components/Header.tsx
src/components/Footer.tsx
src/components/HeroSection.tsx
src/components/StatsBar.tsx
src/components/ArchiveHome.tsx
src/components/EvidenceCard.tsx
src/components/EvidenceStrength.tsx
src/components/StatusBadge.tsx
src/components/LegalNote.tsx
src/components/Button.tsx
src/components/SourceCitation.tsx
src/styles/tokens.css
src/components/hlshajara.css
src/app/fonts.ts
messages/ar.json
messages/en.json
DESIGN ASSETS/README.md
DESIGN ASSETS/colors_and_type.css
```
