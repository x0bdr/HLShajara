# HLShajara — Full UI Review

**Date:** 2026-06-14  
**Scope:** entire public UI, design-system implementation, and the active `/submit` wizard  
**Against:** `DESIGN ASSETS/` design system, `.planning/UI-SPEC.md` v1.5 wizard contract, original `HLShajara-UI-Audit-v1.2-Plan.pdf`  
**Build status:** `next build` passes, `tsc --noEmit` passes, i18n parity passes, wizard a11y/step-logic checks pass  
**Lint status:** 73 errors / 32 warnings (see §7)

---

## Executive Summary

The v1.2 frontend-polish milestone has largely landed: every public page now uses `PageShell`, the dashboard is token-driven, archive cards are clickable, pagination/skeletons/error states exist, and the bilingual shell is mechanically sound. If scored with the original six-pillar rubric, the product would now land in the **21–23 / 24** range, up from 16/24.

The active wizard (`/submit`) is the **v1.5 category-based flow** documented in `.planning/UI-SPEC.md`. It intentionally shifts public-source collection to the reviewer console and allows optional contact/identifier metadata to aid reviewer follow-up. The remaining ship-level gap is **incomplete English localization of config-driven wizard labels**; in the EN locale users still see Arabic category/subtype/flag/location strings, which breaks the bilingual promise.

| Area | Grade | Verdict |
|------|-------|---------|
| Visual consistency / design tokens | B+ | Pages are unified, but token drift and hardcoded values remain |
| Interaction / navigation | A− | Shell, pagination, cards, and history all work |
| Bilingual + RTL | B | Shell parity is good; wizard config labels are largely Arabic-only |
| Accessibility | B+ | Wizard passes automated checks; modals and focus need work |
| Safety / product correctness | B | Wizard aligns with v1.5 spec; reviewer-side source attachment is the chosen model |
| Code hygiene | C | Lint errors, dead code, undefined CSS tokens |

**Highest-priority next actions:**
1. Fully localize wizard labels (categories, subtypes, flags, countries, governorates, document options) into `messages/*.json`.
2. Delete dead code (`SubmitClient.tsx`, legacy wizard steps).
3. Add missing CSS tokens or replace usages.
4. Fix lint errors.
5. Close modal focus and RTL physical-property gaps.

---

## 1. Original v1.2 Audit Findings — Current Status

From `HLShajara-UI-Audit-v1.2-Plan.pdf` (2026-05-31, score 16/24 → target 22/24):

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| 1 | Pages without Header/Footer | **Fixed** | All routes now wrapped in `PageShell.tsx` |
| 2 | Dashboard rainbow colors | **Fixed** | Dashboard uses token-driven `dash-grid` cards |
| 3 | Evidence cards not clickable | **Fixed** | `ArchiveHome` and `RecordClient` pass `onOpen` |
| 4 | No pagination | **Fixed** | `/api/entity` supports page/limit; archive/record render pagination |
| 5 | No skeletons/error states | **Fixed** | `Skeleton`/`SkeletonCard` used on record, entity, dashboard |
| 6 | Inline styles instead of `.ds-*` | **Partial** | Reduced, but still ~120 inline-style matches; Profile/Login worst |
| 7 | Mobile filter UX | **Fixed** | Collapsible filter sidebar below 860 px |
| 8 | Translation gaps | **Partial** | `messages/*.json` parity passes, but config-driven wizard labels are not in messages |

---

## 2. Six-Pillar Re-Score

| Pillar | Score | Notes |
|--------|-------|-------|
| Copywriting | 3/4 | Message parity passes; wizard config labels and separators are not fully localized. |
| Visuals | 4/4 | Unified shell, consistent card language, clickable cards, pagination, skeletons. |
| Color | 3/4 | Dashboard fixed; hardcoded hex/rgba still exist in hero, Twitter button, publications. |
| Typography | 3/4 | `.ds-*` adopted widely; arbitrary px sizes and inline font styles persist. |
| Spacing | 3/4 | `page-container-narrow` consistent; many off-scale px gaps/paddings in `hlshajara.css`. |
| Experience Design | 3/4 | Navigation and loading are solid; bilingual localization is the main remaining gap. |

**Estimated current score: 22–23 / 24** (visual/interaction gains offset by copy/localization gaps).

---

## 3. Critical Product Issues (Active Wizard)

### 3.1 English locale shows Arabic labels (P0)

- `LocationInfoStep.tsx` hardcodes `COUNTRIES` and `SYRIAN_GOVERNORATES` in Arabic.
- `category-config.ts` `subTypes`, `COMMON_FLAGS`, and `SUPPORTING_DOCUMENT_OPTIONS` often have only `labelAr`.
- `ReviewStep.tsx` joins supporting documents with an Arabic comma (`"، "`) regardless of locale.

**Fix:** Move all user-visible wizard labels into `messages/ar.json` + `messages/en.json`; select by locale.

### 3.2 Duplicate data capture (MEDIUM)

- Individual name is asked in `EntityTypeNameStep` (`entityName`) and again in `ReportDetailsStep` (`reportedPersonName`).
- Vehicle plate/app are asked in `EntityTypeNameStep` and again in `ReportDetailsStep`.

**Fix:** Collect identity once; keep granular identifiers only in details if needed.

### 3.3 Review shows country twice; omits media link (LOW)

- `ReviewStep` renders a standalone `locCountry` row plus a `location` row that already includes the country.
- `mediaLink` collected in `MediaEvidenceStep` is not shown in review.

**Fix:** Merge location into one row; add media link row.

---

## 4. Design-System & Visual Audit

### 4.1 What's working

- `PageShell` unifies Header + Footer + main wrapper across every route.
- `src/styles/tokens.css` is the source of truth; most components use semantic tokens (`--bg`, `--surface`, `--fg1`, `--brand`, etc.).
- Logical CSS properties dominate (`margin-inline`, `padding-inline`, `border-inline-start`), so RTL mirroring is largely automatic.
- Arabic-Indic numerals are used in wizard counters via `Intl.NumberFormat(..., { numberingSystem: "arab" })`.

### 4.2 Undefined / missing tokens

These CSS custom properties are referenced but not defined in `src/styles/tokens.css`:

| Token | Used at | Risk |
|-------|---------|------|
| `--bg2` | `hlshajara.css:1296`, `AboutYouStep.tsx:250` | Invalid/transparent background |
| `--card` | `hlshajara.css:1283` | Invalid card background |
| `--brass-400` | `hlshajara.css:954` | Missing accent step |
| `--brick-200`, `--brick-50`, `--brick-600` | `hlshajara.css:726,1188,1460`, `auth/error/page.tsx:38` | Missing rejection scale |
| `--green-300`, `--green-400` | `hlshajara.css:1397,1459` | Missing brand scale |
| `--brand-50` | `hlshajara.css:191` | Has fallback only |

**Fix:** Add the missing scale steps to `tokens.css`, or replace usages with existing tokens.

### 4.3 Hardcoded values and principle violations

`src/components/hlshajara.css` contains hardcoded hex/rgba values and effects that violate the design system's "no gradients / no saturated UI colors" rule:

- Radial/linear gradients in `.hero-dramatic` (lines 399, 923–934).
- Hardcoded black/brass shadows and text shadows (lines 414, 947, 960).
- Pure `#000` / `#fff` Twitter/X button (line 1428–1429).
- One-off border colors like `#E4C4BD` (line 641).
- Dark-mode surface colors not in tokens (lines 983–988, 1097–1106).

**Fix:** Replace with token-based equivalents or document explicit exceptions.

### 4.4 Typography & spacing drift

- `.hero-title` 32–36 px vs token `--text-xl` 28 px.
- `.section-title` 28–32 px vs scale.
- `.legal .t` letter-spacing 0.05 em vs token `--tracking-caps` 0.08 em.
- 371 hardcoded pixel declarations for padding/gap/radius in `hlshajara.css`.

**Fix:** Map component sizes to `--text-*`, `--space-*`, `--radius-*`, `--tracking-*`, `--leading-*` tokens.

### 4.5 Tailwind v4 is effectively dead code

- `tailwindcss@^4` and `@tailwindcss/postcss` are installed.
- There is no `tailwind.config.ts` and no `@theme` block.
- `design_handoff_hlshajara/tailwind.tokens.ts` is not imported anywhere.
- `src/app/globals.css` (only `@import "tailwindcss";`) is not imported by any layout.
- Custom CSS classes like `.text-fg2`, `.font-semibold` are defined in `hlshajara.css`, not Tailwind.

**Fix:** Either wire tokens into Tailwind v4 via `@theme` and adopt utility classes, or remove Tailwind dependencies and commit to the custom-CSS approach.

### 4.6 Components that still feel "stitched together"

1. **Login / Profile vs. core site**
   - Login uses a black Twitter/X button (`#000`) and a custom divider.
   - `ProfileClient.tsx` is almost entirely inline-styled and lacks `.card`/`.form-section` rhythm.
2. **Reviewer / admin vs. public pages**
   - Dense metadata tables and inline-flex layouts; no shared card language.
3. **Publications vs. archive**
   - Uses `var(--green-900)` titles and undefined `--card`/`--bg2`; article body styling is separate from token type scale.
4. **Old vs. new submit flow**
   - `SubmitClient.tsx` (legacy flat form) and unused legacy steps (`DescribeStep`, `IdentityStep`, `InputStep`, `MediaStep`) remain in the tree.

---

## 5. Accessibility

### 5.1 What's working

- Wizard passes `scripts/wizard-a11y-check.js`:
  - `role="radiogroup"` / `role="radio"` on choice cards.
  - `aria-checked` reflects selection.
  - Roving tabindex + Arrow/Enter/Space handling.
  - Single `aria-live="polite"` announcer.
  - Focus moves to step heading on step change.
  - `aria-current="step"` on active progress pill.
  - Every form control has a label association.
  - Errors use `role="alert"` / `role="status"` / `aria-describedby`.

### 5.2 Issues

- **Modals do not trap focus** or return focus to the trigger (reviewer/admin triage modals).
- **Choice cards use `onPointerUp`** instead of `onClick`; switch/voice users may not trigger them.
- **Multi-select cards use roving tabindex** (radio pattern) for checkboxes, which is non-standard.
- **Card mount focus** can override the panel heading focus.
- **No Home/End key handling** in choice grids.
- **`WizardPanel.tsx` focus may skip the draft-restore banner** on initial load.
- **No `loading.tsx` or `error.tsx`** route boundaries under `src/app/[locale]/`.

---

## 6. RTL / Bilingual

### 6.1 Strengths

- `layout.tsx` sets `<html dir="rtl">` for Arabic.
- Logical properties used throughout wizard and shell.
- Arabic-Indic numerals in counters.
- `[dir=rtl] .ds-mono { direction: ltr; text-align: right; }` for machine strings.

### 6.2 Gaps

- **Arabic-only location lists** in `LocationInfoStep.tsx`.
- **Arabic-only category/subtype/flag/document labels** in `category-config.ts`.
- **Hardcoded Arabic comma** in `ReviewStep.tsx` supporting-document list.
- **Back chevron uses `U+2039`**; bidi mirroring is not guaranteed across browsers.
- **Publications blockquote/list** use physical `border-right` / `margin-left` (lines 1393, 1396 of `hlshajara.css`).
- **Placeholders** (`name@example.com`, `@username`) are LTR English inside an Arabic UI.

---

## 7. Code Hygiene

- **Lint:** `npm run lint` reports **73 errors, 32 warnings** (as of 2026-06-14).
  - `any` types in `src/lib/clamav.ts`, `src/lib/session.ts`.
  - Many unused variables/imports in wizard code (`registry.ts`, `state.ts`, `step-logic.ts`, `validation.ts`).
- **Dead code:**
  - `src/app/[locale]/submit/SubmitClient.tsx` — no longer imported.
  - `src/components/wizard/DescribeStep.tsx`, `IdentityStep.tsx`, `InputStep.tsx`, `MediaStep.tsx` — unreferenced.
- **Unused i18n keys:** `reviewGroupActor`, `reviewGroupConduct`, `reviewGroupDescription`, `reviewGroupEvidence`, `reviewGroupMedia` are translated but unused.
- **TypeScript / build:** `tsc --noEmit` and `next build` both pass.

---

## 8. Mobile Responsiveness

- Header nav wraps below 860 px; no hamburger menu. Usable but cramped on small screens.
- Archive filters collapse into a toggle sidebar — good.
- Record filter selects wrap; acceptable but tall.
- Publications grid collapses 3 → 2 → 1 column — good.
- Reviewer/admin modals use fixed `padding:28px` with `max-width:720px`; consume too much viewport on phones.
- Wizard form rows collapse to a single column on narrow screens.

---

## 9. Recommendations (Prioritized)

### P0 — Ship-blocking
1. **Fully localize wizard labels** into `messages/*.json` for EN/AR parity (categories, subtypes, flags, countries, governorates, document options, separators).

### P1 — High quality
2. Delete `SubmitClient.tsx` and unused legacy wizard steps.
3. Add missing CSS tokens (`--bg2`, `--card`, `--brass-400`, `--brick-*`, `--green-300/400`) or replace usages.
4. Replace hardcoded hero/gradient/social-button colors with tokens.
5. Fix lint errors (`any`, unused vars/imports).
6. Trap focus and return focus in reviewer/admin modals.
7. Fix RTL physical properties in publications blockquote/list.

### P2 — Polish
8. Standardize `ProfileClient.tsx` and login page on token classes.
9. Decide Tailwind strategy: wire tokens or remove deps.
10. Add `loading.tsx` / `error.tsx` route boundaries.
11. Add a mobile hamburger menu for the header.
12. Reduce hardcoded px spacing in `hlshajara.css`.

---

## 10. Bottom Line

HLShajara's visual shell and navigation are now coherent and largely meet the v1.2 audit target. The wizard model is now documented in `.planning/UI-SPEC.md` as the v1.5 category-based flow. The remaining ship-level task is completing English localization of config-driven wizard labels so the EN and AR experiences are equivalent. After that, the P1/P2 cleanup (dead code, tokens, lint, modal/RTL polish) will bring the codebase in line with the design system.
