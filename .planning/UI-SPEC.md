# UI-SPEC — "Submit a Report" Wizard (v1.5 category-based flow)

**Status:** Aligned with current implementation · **Date:** 2026-06-14 · **Owner:** frontend-dept  
**Replaces:** the single-page `SubmitClient.tsx` form and the v1.4 actor/conduct wizard draft.  
**Design contract for:** a one-step-per-page, card-driven, bilingual (EN/AR + RTL) report intake. The active flow collects a **report category + named entity/person + location + details + experience + optional media + submitter identity**, then routes to dual review where public sources are attached.

---

## 0. Purpose & scope

A guided wizard that walks a submitter from "what category" → "who" → "where" → "what happened" → "media" → "who are you" → review → submit. It is structurally incapable of publishing on submit; every entry enters the existing `submissions` → dual-review → lawyer-gate pipeline.

**In scope:** the public submission UI, its interaction model, fields, validation, bilingual/RTL/a11y behavior, and the CSS/component additions.  
**Out of scope:** reviewer console, the publish pipeline, backend schema changes beyond the existing `/api/submit` contract.

---

## 1. Safety constraints (as implemented)

These are enforced in the UI in addition to the server screens.

| # | Rule | UI consequence |
|---|------|----------------|
| S1 | **No published PII.** | Phone, car plate, map links, social handles, and nearest-location fields are **optional metadata** collected for reviewer context only; they are never rendered on any public path and are surfaced only in the reviewer console. |
| S2 | **No identity/sect fields.** | No sect, religion, ethnicity, family, tribe, or region field exists. Categories are economic/service sectors (`commercial`, `medical`, `tourism`, …) plus `individuals`; they describe the *reported actor's role*, not an identity group. |
| S3 | **No loyalty/opinion field.** | No "supports the regime?", "attitude," or "sympathizer" card exists. Reports are framed around documented conduct and experience. |
| S4 | **No profession target lists.** | Professions appear only as sub-types of reportable categories (e.g., a taxi driver or cleaner as the *named actor* of a report), not as a target list for boycott. |
| S5 | **Coarse location only.** | Country is required; state/city is optional and coarse. The Google-Maps link field rejects personal-social links inline. |
| S6 | **Source-first intake.** | Public sources are **not collected from submitters** in v1.5; the wizard states clearly that reviewers attach credible public sources during review. A submitter may add an optional public-media link and supporting files/notes. |
| S7 | **Anonymity by default.** | `isAnonymous` defaults **on**. When ON, name/email/contact methods are disabled and cleared. |
| S8 | **Nothing publishes on submit.** | Copy throughout states that entries enter review and that nothing is public yet. |

> **Note on v1.4 divergence:** The earlier v1.4 spec required ≥2 public source links from the submitter and omitted all private-targeting fields. The v1.5 flow intentionally shifts source collection to the reviewer console and allows optional contact/identifier metadata to aid reviewer follow-up. This document describes the shipped v1.5 behavior.

---

## 2. Interaction model

### 2.1 One step per page
The wizard renders **exactly one step at a time**, centered in `.page-container-narrow` (max-width 720px).

### 2.2 Two step archetypes
| Archetype | Advance trigger | Examples |
|---|---|---|
| **Choice step** | Tapping a **card** auto-advances (single-select). No "Next" button. | Report category |
| **Input step** | Explicit **Next** button (`.btn primary`), gated on validation. | Type/name, location, details, experience, media, about you |

### 2.3 Card auto-advance behavior
1. On `pointerup`/`Enter`/`Space`, the chosen card gets `.choice-card.selected`.
2. After **`var(--dur)` (200ms)** the wizard transitions to the next step.
3. `prefers-reduced-motion: reduce` → advance is **immediate**.
4. Returning via **Back** re-renders the choice step with the prior card already `.selected` and focused.

### 2.4 Back & progress
- A persistent **Back** control (`.btn ghost`, leading chevron) on every step except the first. It mirrors automatically in RTL via logical properties.
- A **progress indicator** at the top: a row of step pills (`.wizard-progress` → `.chip`/`.chip.on`) showing *completed · current · upcoming*, plus text "Step N of M / الخطوة N من M". Pills for completed steps are tappable (jump back); upcoming pills are inert.
- Browser **Back/Forward** work: each step pushes a history entry.

### 2.5 State, routing, persistence
- **Single source of truth:** one `wizard` state object held in a `useReducer` at the wizard root.
- **Routing:** step is reflected in the URL as `?step=<id>` via `next-intl` `router.push` with `scroll:false`.
- **Draft persistence:** on every change, serialize `wizard` to `sessionStorage` under `hls.submit.draft.v1`. On mount, offer to restore (`.legal` notice). Clear on successful submit and on explicit "Start over."
- **Refresh guard:** `beforeunload` warns if the draft is dirty and unsubmitted.

### 2.6 Linear flow & reachability
The v1.5 flow is **linear** (no branching). A step is reachable only if every prior step is complete. Deep-linking to a later `?step=` with incomplete state redirects to the first incomplete step.

Flow:
```
report-category → entity-type-name → location-info → report-details →
experience → media-evidence → about-you → review
```

### 2.7 Transitions
- Step change: cross-fade + 12px inline-directional slide, `transform`/`opacity`, `var(--dur) var(--ease)`.
- All transitions disabled under `prefers-reduced-motion: reduce`.

---

## 3. Step-by-step page flow

Total **M = 8** numbered steps.

### Step 1 — Report category *(choice)*
- **Cards (single-select, auto-advance):**
  - Commercial — shops, factories, brands, stores and malls
  - Individuals — vendors, drivers, employees, influencers, cleaners
  - Educational — academies, institutes, courses, professors and kindergartens
  - Service — cleaning, delivery, beauty, exchange, repair, wedding halls
  - Tourism — hotels, restaurants, taxis, car rentals, chalets
  - Medical — pharmacies, clinics, hospitals and medical centers
  - Organizations — civil society, media, unions, student clubs
  - Real Estate — houses, apartments, villas, farms, lands, shops and offices
- Maps to `form.reportCategory` and sets `form.entityType` (`organization` for all categories except `individuals`).
- **i18n:** `submit.q_reportCategory`, `submit.catCommercial`, `submit.catIndividuals`, etc.

### Step 2 — Entity / person type and name *(input)*
- **Subtype cards:** category-specific options (e.g., `brand`, `factory`, `street_vendor`, `driver`, `taxi`, `hotel`, `pharmacy`, `house`, …). Selected value written to `reportMetadata.orgType`.
- **Other subtype:** if the user selects `other`, a free-text "Specify type" field appears (`reportMetadata.orgSubTypeOther`).
- **Name field:** label adapts by category/subtype:
  - Brand → "Brand / product name"
  - Individuals → "Reported person's name"
  - Real estate → "Property / project name"
  - Taxi / private car → "Office / operator / app name"
  - Default → "Organization / facility name"
- `entityRole` is auto-synthesized from the selected subtype label so the legacy `/api/submit` contract stays populated.
- **Next** gated on subtype selected + name non-empty.
- **i18n:** `submit.q_entityTypeName`, `submit.etnType`, `submit.etnName*`, `submit.etnOtherSpecify`.

### Step 3 — Location information *(input)*
| Field | Maps to | Required | Notes |
|---|---|---|---|
| Country | `reportMetadata.country` + `allegationLocation` | ✓ | Select with hardcoded list (Syria default). |
| State / City | `reportMetadata.city` + `allegationLocation` | optional | Dropdown of Syrian governorates when country = Syria; free text otherwise. |
| Nearest area | `reportMetadata.nearestLocation` | optional | Nearby public landmarks. |
| Contact number | `reportMetadata.contactPhone` | optional | Reviewer context only. |
| Website / e-shop | `reportMetadata.websiteName` | optional | Public identifier. |
| Google Maps link | `reportMetadata.googleMapsLink` | optional | Rejects personal-social links inline. |
| Social media accounts | `reportMetadata.socialMediaAccounts` | optional | Reviewer context only. |
- **Next** gated on country selected.
- **i18n:** `submit.q_locationInfo`, `submit.locCountry`, `submit.locCity`, `submit.locNearest`, `submit.locContact`, `submit.locWebsite`, `submit.locMaps`, `submit.locSocial`.

### Step 4 — Report details *(input)*
- **Detail flags (multi-select cards):** owner/partner, reception/front desk, labour/employees, supportive data, instructor, doctor/nurse, investor, student, club name — depending on category.
- **Free-text fields:** rendered based on subtype and selected flags:
  - Owner / partner name
  - Reported person's name, nickname, phone, position, social media
  - Car type, license plate, driver phone/name, taxi number, app name
  - Property type
  - Reception / labour / support data / club name
- **Next** always enabled (details are optional hints).
- **i18n:** `submit.q_reportDetails`, `submit.detailsFlags`, `submit.detailsHint`, `submit.details*`.

### Step 5 — Your experience *(input)*
- **Description** (`allegationDescription`, required, ≥20 chars). Live character counter.
- **Inline screens** run on `entityName + entityRole + allegationDescription` and warn for `GROUP_TARGET`, `PRIVATE_TARGETING`, `INNOCENT_PARTY`, `INCITEMENT`, `HATE_TONE`.
- **Supporting documents** (multi-select cards): photos, videos, audio, official documents, screenshots, other.
- **Next** gated on ≥20 chars.
- **i18n:** `submit.q_experience`, `submit.expLabel`, `submit.expHint`, `submit.expDocuments`, `submit.descCounter`, `submit.descWarn*`.

### Step 6 — Media evidence *(input, optional)*
- **Public media link** (`reportMetadata.mediaLink`). Rejected if it matches personal-social patterns.
- **File uploads** via `/api/upload` (images, video, PDF, Word, TXT). Drag-drop + picker; per-file removable cards.
- **Additional notes** (`reportMetadata.mediaNotes`).
- **Next / Skip** always enabled.
- **i18n:** `submit.q_mediaEvidence`, `submit.mediaLink`, `submit.mediaTitle`, `submit.mediaNotes`, `submit.dropzoneTitle`, `submit.dropzoneHint`, `submit.uploading`, `submit.removeFile`.

### Step 7 — About you *(input)*
- **Anonymous toggle** `isAnonymous`, **default ON**. When ON, name/email/contact methods are disabled and cleared.
- When OFF:
  - Optional `submitterName`.
  - Optional contact methods: X, Facebook, Instagram, Telegram, WhatsApp, Phone, Email. Each added via an icon dropdown and rendered as icon + value input + remove.
- **Next** always enabled.
- **i18n:** `submit.q_aboutYou`, `submit.anonTitle`, `submit.anonToggle`, `submit.anonHelp`, `submit.fullName`, `submit.contactMethodsTitle`, `submit.addContactMethod`, `submit.contactType_*`, etc.

### Step 8 — Review before submit *(summary)*
- Read-only summary grouped by step: Category, Location, Entity/Person, Details, Experience, Evidence, You.
- Each group has an **Edit** link that routes to the corresponding `?step=`.
- **Affirmation checkbox (required):** "I affirm this concerns documented conduct by a named actor; reviewers will attach public sources during review."
- **Submit** (`.btn primary`) → POST `/api/submit`. Spinner state while in-flight.
- **Success:** `.legal-success` panel — "Received. It now enters review; nothing is public yet." + reference id + "Submit another" reset.
- **Failure:** maps API `result.code` to bilingual message and routes back to the offending step:
  | code | message key | returns to |
  |---|---|---|
  | `GROUP_TARGET` | `submit.err_group` | experience |
  | `PRIVATE_TARGETING` | `submit.err_private` | experience |
  | `INNOCENT_PARTY` | `submit.err_innocent` | experience |
  | `INCITEMENT` / `HATE_TONE` | `submit.err_tone` | experience |
  | `MISMATCH` | `submit.err_mismatch` | entity-type-name |
- **i18n:** `submit.reviewStepTitle`, `submit.reviewTitle`, `submit.reviewEdit`, `submit.reviewGroup*`, `submit.affirm`, `submit.errAffirmGate`, `submit.submitButton`, `submit.submitting`, `submit.successTitle`, `submit.successBody`, `submit.submitAnother`.

---

## 4. Information architecture map

```
report-category
 └─ entity-type-name (subtype card + name)
     └─ location-info (country, city, contact, maps, social)
         └─ report-details (flags + adaptive fields)
             └─ experience (description + supporting docs)
                 └─ media-evidence (link + uploads + notes)
                     └─ about-you (anon toggle + contact methods)
                         └─ review → submit → confirmation
```

---

## 5. Card component spec (`.choice-card`)

Reuses existing `.card.interactive` + `.chip` patterns.

```
.choice-grid        → display:grid; gap:var(--space-3); grid-template-columns:1fr;
                      @media(min-width:560px){ grid-template-columns:1fr 1fr; }
.choice-card        → background:var(--surface); border:1px solid var(--border);
                      border-radius:var(--radius-lg); box-shadow:var(--shadow);
                      padding:18px 20px; cursor:pointer; text-align:start;
                      transition: box-shadow var(--dur) var(--ease),
                                  transform var(--dur) var(--ease),
                                  border-color var(--dur) var(--ease);
.choice-card:hover  → box-shadow:var(--shadow-md); transform:translateY(-2px);
.choice-card:focus-visible → outline:2px solid var(--focus-ring); outline-offset:2px;
.choice-card.selected → border-color:var(--brand); box-shadow:var(--inset-hair),var(--shadow-md);
.choice-card .title   → .ds-h3 / font-display; color:var(--fg1);
.choice-card .desc    → .ds-caption; color:var(--fg2); margin-block-start:4px;
.choice-card .check   → inline-end aligned; color:var(--brass-500); opacity:0 → 1 when .selected;
```
- **Semantics:** single-mode cards use `role="radiogroup"` + `role="radio"` + `aria-checked`; multi-mode uses `role="group"` + `role="checkbox"`.
- **Keyboard:** roving tabindex on single-select; Arrow/Enter/Space to select.
- **Touch target:** full card is the hit area.

---

## 6. Review screen spec (`.review-*`)

```
.review-group   → .card; .card-pad; margin-block-end:var(--space-4);
.review-group .head → .flex-between; title (.ds-eyebrow) + Edit (.btn ghost btn-sm)
.review-row     → .flex-between-start; gap:var(--space-4); padding-block:6px; border-block-end:1px solid var(--border)
.review-row .k  → .ds-meta; color:var(--fg3); min-inline-size:120px
.review-row .v  → .ds-body; color:var(--fg1); white-space:pre-wrap; word-break:break-word
.review-affirm  → .legal; checkbox + label; Submit disabled until checked
```
- Empty optional fields render as `—` in `--fg3`.

---

## 7. Progress & navigation spec (`.wizard-*`)

```
.wizard            → .page-container-narrow; padding-block:var(--space-8)
.wizard-progress   → display:flex; gap:var(--space-2); flex-wrap:wrap; margin-block-end:var(--space-6)
.wizard-step-pill  → .chip; (.on when current; .done when completed; inert when upcoming)
.wizard-count      → .ds-meta; color:var(--fg3)
.wizard-panel      → .card; .card-pad-md; the step body
.wizard-nav        → .flex-between; margin-block-start:var(--space-6)
.wizard-nav .back  → .btn ghost; leading chevron (logical, mirrors)
.wizard-nav .next  → .btn primary; disabled:[aria-disabled] until step valid
```
- **RTL:** progress runs start→end. No `uppercase`/`letter-spacing` on Arabic labels.
- **Focus management:** on step change, move focus to the step `<h2>` (`tabindex=-1`).

---

## 8. Data mapping to `/api/submit`

| Wizard data | API field | Notes |
|---|---|---|
| Category card | `reportCategory` | One of 8 enum values. |
| Category-derived entity class | `entityType` | `individual` for "Individuals"; `organization` for all others. |
| Subtype card | `reportMetadata.orgType` + synthesized `entityRole` | `entityRole` is the Arabic subtype label by default. |
| Other subtype text | `reportMetadata.orgSubTypeOther` | Only when subtype = `other`. |
| Name input | `entityName` | Required. |
| Country + city | `allegationLocation`, `reportMetadata.country/city` | Coarse only. |
| Nearest area / contact / website / maps / social | `reportMetadata.*` | Optional reviewer context. |
| Detail flags + adaptive fields | `reportMetadata.*` | Owner, reported person, car/plate/driver, property, etc. |
| Experience description | `allegationDescription` | Required, ≥20 chars. |
| Supporting documents | `reportMetadata.supportingDocuments` | Array of slugs. |
| Public media link | `reportMetadata.mediaLink` | Optional; screened for personal-social links. |
| Uploaded files | `sourceFiles[]` | Hash, filename, originalName, url, size. |
| Media notes | `reportMetadata.mediaNotes` | Optional. |
| Anonymous toggle | `isAnonymous` | Defaults `true`. |
| Submitter name | `submitterName` | Optional; cleared when anonymous. |
| Contact methods | `reportMetadata.contactMethods` | Optional; cleared when anonymous. |

---

## 9. Client-side validation

Validation runs in the server's order so surfaced errors match what `/api/submit` would return:

1. `MISMATCH` — cross-check chosen `entityType` vs `entityRole` text at entity-type-name step.
2. `GROUP_TARGET` / `INCITEMENT` / `HATE_TONE` / `INNOCENT_PARTY` / `PRIVATE_TARGETING` — run on `entityName + entityRole + allegationDescription` in the experience step.

**Hard-block (cannot advance):**
- Missing required field (category, subtype, name, country, description ≥20 chars).

**Warn-but-explain:**
- Screen hits on description show a `.legal-error` naming why and how to rephrase toward conduct.

---

## 10. Bilingual (EN/AR) + RTL spec

- **Every** user-facing string in the static wizard chrome lives as a flat `camelCase` key under the **`submit`** namespace in both `messages/en.json` and `messages/ar.json` — full parity is mandatory (`check:i18n` gate).
- **Config-driven labels** (category names, subtype names, flag labels, supporting-document options, country/governorate lists) currently live in code constants (`category-config.ts`, `LocationInfoStep.tsx`) with Arabic-only or mixed labels. This is a known gap; the long-term target is to move them into `messages/*.json` and select by locale.
- Direction is inherited from `<html dir>` (set in `layout.tsx`); the wizard manages no `dir` itself. Use **logical properties only**.
- Arabic typography: no `uppercase`/`letter-spacing` on Arabic labels; use Arabic-Indic digits in the step counter via `Intl.NumberFormat(locale)`.
- Machine strings (URLs, ids, hashes) forced LTR inside RTL via `[dir=rtl] .ds-mono { direction:ltr; text-align:right }`.

---

## 11. Accessibility

- **Keyboard:** full operability. Choice cards = radio/checkbox groups with roving tabindex + Arrow/Enter/Space. Inputs standard tab order. Back/Next reachable.
- **Focus:** on step change, focus the step heading (`tabindex=-1`); `:focus-visible` = 2px `var(--focus-ring)` brass, offset 2px.
- **Screen reader:** `aria-live="polite"` step announcement; progress conveyed via `aria-current="step"` on active pill and text count. Card selection state via `aria-checked`.
- **Reduced motion:** disable slide/auto-advance delay.
- **Contrast:** all text/token pairs meet WCAG AA on `--surface`/`--bg`; error reliance is never color-only.
- **Targets:** ≥44px; inputs use existing `.ds-input` focus ring.

---

## 12. Visual / CSS additions

Wizard styles live in `src/components/hlshajara.css` under a `/* ===== WIZARD / STEPPER ===== */` block.

Key classes:
- `.wizard`, `.wizard-progress`, `.wizard-step-pill(.on/.done)`, `.wizard-count`, `.wizard-panel`, `.wizard-nav(.back/.next)`
- `.choice-grid`, `.choice-card(.selected)`, `.choice-card .title/.desc/.check`
- `.review-group`, `.review-row`, `.review-affirm`
- `.dropzone`, `.dropzone.dragging`, `.dropzone.uploading`, `.dropzone-input`
- `.contact-method-add`, `.contact-method-menu`

Only reference existing tokens (`--brand`, `--surface`, `--border`, `--radius-lg`, `--shadow*`, `--dur`, `--ease`, `--focus-ring`, `--space-*`, `--green-500/600`, `.ds-*`).

---

## 13. Acceptance criteria

- [ ] One step renders at a time in `.page-container-narrow`; choice steps auto-advance on card select after `var(--dur)` (instant under reduced-motion); input steps gate on a Next button.
- [ ] Back is present on every step but the first; browser Back/Forward and refresh restore the correct step and data (`?step=` + `sessionStorage` draft).
- [ ] Progress pills show done/current/upcoming, are RTL-correct, and read with `aria-current`.
- [ ] Linear flow is enforced; deep-linking to a later step redirects to the first incomplete step.
- [ ] Category selection sets `reportCategory` and the correct `entityType`.
- [ ] Subtype selection + name input satisfy the entity-type-name step gate.
- [ ] Country selection satisfies the location-info step gate.
- [ ] Experience description ≥20 chars and no hard-block screen hit satisfies the experience step gate.
- [ ] `isAnonymous` defaults **on**; enabling it disables+clears name/email/contact methods.
- [ ] Review screen shows everything to be sent (optional = "—"), edit-routes to each step, and requires the affirmation checkbox before Submit.
- [ ] Client screens mirror the server regexes; rejection codes map to bilingual messages and route back to the offending step.
- [ ] All static wizard strings exist in EN **and** AR under `submit`; `check:i18n` passes; RTL verified.
- [ ] Full keyboard + screen-reader operable; focus moves to step heading on change; AA contrast.
