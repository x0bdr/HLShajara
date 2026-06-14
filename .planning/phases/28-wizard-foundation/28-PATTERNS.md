# Phase 28: Wizard Foundation - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 11 (new/modified)
**Analogs found:** 10 / 11 (one new module — `screens.ts` — mirrors an existing server module rather than copying a sibling)

> Scope reminder: Phase 28 is the wizard **foundation only** — the one-step-per-page shell, the interaction/state engine, the shared `screens.ts` validation lib, and the CSS section. A *scaffold* choice step and *scaffold* input step prove both archetypes. Real step content (the 9 numbered steps) lands in Phases 29–32. Map the engine, not the content.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/[locale]/submit/page.tsx` (modify) | route (server wrapper) | request-response | itself / `src/components/PageShell.tsx` | exact |
| `src/app/[locale]/submit/WizardClient.tsx` (new) | component (root container) | event-driven | `src/app/[locale]/submit/SubmitClient.tsx` + `src/app/[locale]/record/RecordClient.tsx` | role-match |
| `src/lib/wizard/state.ts` (new — reducer + types) | store (useReducer) | event-driven | `SubmitClient.tsx` `form` state shape + `src/lib/validation.ts` `submitSchema` | partial (no reducer exists yet) |
| `src/lib/wizard/registry.ts` (new — step registry/branching) | config | transform | `src/i18n/navigation.ts` (small typed config module) | partial |
| `src/lib/wizard/persistence.ts` (new — sessionStorage draft) | utility | file-I/O (browser storage) | `src/lib/gtm.ts` (`typeof window` guard pattern) | partial |
| `src/components/wizard/WizardProgress.tsx` (new) | component | request-response (read state) | `RecordClient.tsx` filter-bar / `.chip` usage | role-match |
| `src/components/wizard/WizardNav.tsx` (new — Back/Next) | component | event-driven | `RecordClient.tsx` pagination-bar + `src/components/Button.tsx` | role-match |
| `src/components/wizard/WizardPanel.tsx` (new — step body shell) | component | request-response | `src/components/PageShell.tsx` (children-wrapper pattern) | role-match |
| `src/components/wizard/ChoiceStep.tsx` (new — scaffold choice) | component | event-driven | `.chip` group in `RecordClient.tsx` + `.card.interactive` | partial (no radiogroup exists) |
| `src/components/wizard/InputStep.tsx` (new — scaffold input) | component | event-driven | `SubmitClient.tsx` `.form-field`/`.ds-input` blocks | role-match |
| `src/lib/screens.ts` (new — shared client/server regex screens) | utility (validation lib) | transform | `src/db/persist.ts` (verbatim regex source) + `src/lib/validation.ts` | exact (mirror target) |
| `src/components/hlshajara.css` (modify — add WIZARD section) | config (styles) | n/a | existing `.btn`/`.card`/`.chip`/`.legal*`/`.form-*` blocks in same file | exact |

> The exact file/folder split above is a recommendation; the planner may flatten `src/lib/wizard/*` into one `WizardClient.tsx` co-located helper set if it prefers fewer files. What is load-bearing is the *patterns*, not the directory layout.

---

## Pattern Assignments

### `src/app/[locale]/submit/page.tsx` (route, server wrapper) — modify

**Analog:** itself (already correct shape — keep it; just swap the client child).

The current file is the canonical server-wrapper pattern: `generateStaticParams` for both locales + `PageShell narrow`. Keep verbatim, only rename the import.

**Full current pattern** (`src/app/[locale]/submit/page.tsx:1-14`):
```tsx
import SubmitClient from "./SubmitClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function SubmitPage() {
  return (
    <PageShell narrow>
      <SubmitClient />
    </PageShell>
  );
}
```
Change: `SubmitClient` → `WizardClient` (the wizard renders inside the existing `.page-container-narrow` that `PageShell narrow` supplies — UI-SPEC §2.1). Do **not** add `dir` handling — `<html dir>` is already set in `src/app/[locale]/layout.tsx:22` and inherited (UI-SPEC §10).

---

### `src/app/[locale]/submit/WizardClient.tsx` (component, root container) — new

**Analogs:** `src/app/[locale]/submit/SubmitClient.tsx` (state shape, API wiring, i18n, GTM), `src/app/[locale]/record/RecordClient.tsx` (router/URL + `useLocale` + reduced-motion-free interactive client).

**`"use client"` + hooks header** — copy from both analogs (`SubmitClient.tsx:1-6`, `RecordClient.tsx:1-8`):
```tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, LegalNote } from "@/components";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";
```
**Routing addendum for the wizard (`?step=`):** `RecordClient.tsx:5` imports `useRouter` from `next/navigation` and builds `URLSearchParams` (`RecordClient.tsx:32-41`). For locale-preserving navigation prefer the project router from `src/i18n/navigation.ts` instead:
```tsx
import { useRouter } from "@/i18n/navigation";          // locale-aware push, from createNavigation()
import { useSearchParams } from "next/navigation";       // read ?step=
// step write (UI-SPEC §2.5: scroll:false so the page doesn't jump on transition):
router.push(`/submit?step=${stepId}`, { scroll: false });
```
> `src/i18n/navigation.ts` exports `{ Link, redirect, usePathname, useRouter }` from `createNavigation({ locales:["ar","en"], localePrefix:"always" })`. Its `useRouter().push("/submit?...")` auto-prefixes the active locale, so you pass the **un-prefixed** path. There is no `useSearchParams` re-export — import that one from `next/navigation`.

**State container (the central change vs. the single-page form):** `SubmitClient.tsx:17-30` holds the whole form in one `useState` object — the wizard **extends this exact shape** (UI-SPEC §8) but lifts it into a `useReducer` (see `src/lib/wizard/state.ts` below). Preserve the field names verbatim — they are the `/api/submit` contract:
```tsx
// SubmitClient.tsx:17-30 — the canonical wizard state seed (keep field names EXACT)
{
  entityName: "", entityType: "individual", entityRole: "",
  allegationDescription: "", allegationPeriod: "", allegationLocation: "",
  allegationClassification: "",
  sourceLinks: [{ url: "", title: "" }], sourceFiles: [] as UploadedFile[],
  submitterEmail: "", submitterName: "", isAnonymous: false,  // ⚠ flip default → true (UI-SPEC §8, BE-04)
}
```

**Submit + GTM + reset pattern** — replicate `SubmitClient.tsx:111-148` on the final review step (Phase 31 wires the real call, but the shell should keep the POST/GTM/reset skeleton):
```tsx
const res = await fetch("/api/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
const data = await res.json();
setResult(data);
pushDataLayer(GTM_EVENTS.SUBMIT_CLICK, {
  success: data.ok, entityType: form.entityType, isAnonymous: form.isAnonymous,
});
if (data.ok) { /* reset to seed + clear sessionStorage draft */ }
```
`GTM_EVENTS.SUBMIT_CLICK` already exists (`src/lib/gtm.ts:18`). The rejection-`code`→step routing (UI-SPEC §3 failure table) reads `data.code` from this same response shape (`{ ok, code?, message }` — see `src/app/api/submit/route.ts:36-41,73-77`).

**Result panel** — reuse the `.legal` variant pattern (`SubmitClient.tsx:159-164`):
```tsx
<div className={`legal ${result.ok ? "legal-success" : "legal-error"}`}>
  <div className="t">{result.ok ? t("successTitle") : t("error")}</div>
  <p>{result.message}</p>
</div>
```

**Reduced-motion gate** for the auto-advance delay (UI-SPEC §2.3.3) — there is no existing JS hook, so read the media query directly:
```tsx
const reduced = typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// choice card: reduced ? advanceNow() : setTimeout(advanceNow, 200 /* var(--dur) */)
```

---

### `src/lib/wizard/state.ts` (store — reducer + types) — new

**Analogs:** `SubmitClient.tsx:17-30` (state shape), `src/lib/validation.ts:52-90` (`submitSchema` — the authoritative field list + lengths the state must satisfy), `src/db/persist.ts` `PersistResult` discriminated-union shape (for the screen-result type).

No `useReducer` exists anywhere in the codebase yet (confirmed via grep). Author a fresh reducer but **mirror the validation contract**:
- The `WizardState.form` type = `SubmitInput` (`src/lib/validation.ts:90` exports `type SubmitInput = z.infer<typeof submitSchema>`) — import and reuse it rather than redeclaring, so the wizard and server can't drift.
- Hard-block lengths to enforce client-side (UI-SPEC §8, "stricter-of-two"): `allegationDescription` **min 20 / max 10000** (`validation.ts:62`), `entityName` 1–255, `entityRole` 1–500, sources `≥2`.
- Reducer result/error type — copy the discriminated-union convention from `persist.ts:30-32`:
```ts
// from src/db/persist.ts:30-32 — reuse this shape for screen results
export type PersistResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; field?: string };
```
Add reducer actions for: `SET_FIELD`, `SET_SOURCE`, `ADD_SOURCE`, `REMOVE_SOURCE`, `ADD_FILE`, `REMOVE_FILE`, `GOTO_STEP`, `INVALIDATE_DOWNSTREAM`, `RESTORE_DRAFT`, `RESET`. The field/link/file mutators already exist as plain functions in `SubmitClient.tsx:42-109` (`updateField`, `updateLink`, `addLink`, `removeFile`) — port their bodies into reducer cases verbatim (immutable spread style is already correct there).

**Branching guard (UI-SPEC §2.6 / WIZ-06):** `Individual` → `entityType="individual"`, skip entity-subtype; `Entity` → show subtype step. Encode reachability as "a step is reachable only if all prior required steps validate"; deep-link to an incomplete `?step=` redirects to the first incomplete step.

---

### `src/lib/wizard/registry.ts` (config — step registry/order) — new

**Analog:** `src/i18n/navigation.ts:1-9` — the project's pattern for a tiny typed config module exported as `as const` literals.

Mirror that style: a `const STEPS = [...] as const` ordered list of `{ id, archetype: "choice" | "input", titleKey, requires?, branchWhen? }`, plus helpers `nextStep(state)`, `prevStep(state)`, `isReachable(id, state)`. Keep IDs as the `?step=` slugs from UI-SPEC §2.5 (`conduct`, `evidence`, …). The Individual-branch skip and progress-count rules (entity-subtype is "1b", doesn't increment visible count — UI-SPEC §3) live here.

For Phase 28 the registry only needs the **two scaffold steps** wired (one `choice`, one `input`) to prove the engine; Phases 29–31 append the real 9.

---

### `src/lib/wizard/persistence.ts` (utility — sessionStorage draft) — new

**Analog:** `src/lib/gtm.ts:7-14` — the `typeof window !== "undefined"` SSR guard before touching a browser global.

```ts
// pattern mirrors src/lib/gtm.ts:7-14
const KEY = "hls.submit.draft.v1";   // UI-SPEC §2.5 exact key
export function saveDraft(state: unknown) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
export function loadDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  try { const v = sessionStorage.getItem(KEY); return v ? JSON.parse(v) as T : null; } catch { return null; }
}
export function clearDraft() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(KEY); } catch {}
}
```
`beforeunload` dirty-guard (UI-SPEC §2.5 refresh guard / WIZ-05): register/cleanup in a `useEffect` inside `WizardClient.tsx` (the `useEffect` + cleanup-return idiom already used at `RecordClient.tsx:31-56`).

---

### `src/components/wizard/WizardProgress.tsx` (component) — new

**Analogs:** `.chip`/`.chip.on` usage in `RecordClient.tsx` filter-bar; `.filter-badge` count pattern (`hlshajara.css:558-565`).

- Render step pills as `.wizard-step-pill` (= `.chip`, `.on` current, `.done` completed). `aria-current="step"` on the active pill (UI-SPEC §7, §11). Completed pills are buttons that `router.push(?step=)`; upcoming pills are inert (`disabled`/no handler).
- Step counter "Step N of M" with **Arabic-Indic digits** via `Intl.NumberFormat(locale)` (UI-SPEC §7) — `locale` from `useLocale()` (`RecordClient.tsx:21`):
```tsx
const fmt = new Intl.NumberFormat(locale);   // locale = "ar" → ٣, "en" → 3
<span className="wizard-count">{t("stepCounter", { n: fmt.format(current), m: fmt.format(total) })}</span>
```
- RTL: progress is a flex row, auto-mirrors. Latin eyebrows pair with `[dir=rtl]{letter-spacing:0;text-transform:none}` — the exact override already used at `hlshajara.css:54` (`.legal .t`) and codified in `.ds-eyebrow:lang(ar)` (`tokens.css:159-163`). **Do not** put `text-transform:uppercase`/`letter-spacing` on Arabic labels.

---

### `src/components/wizard/WizardNav.tsx` (component — Back/Next) — new

**Analogs:** `RecordClient.tsx:128-146` pagination-bar (`.btn secondary` prev/next, `disabled` guards, `.flex-between`); `src/components/Button.tsx` (token-driven variant wrapper).

```tsx
// model on RecordClient.tsx:128-146 + UI-SPEC §7 (.wizard-nav = .flex-between)
<div className="wizard-nav flex-between">
  {!isFirst && (
    <button className="btn ghost back" onClick={onBack}>{/* leading chevron, logical */}{t("back")}</button>
  )}
  {archetype === "input" && (
    <Button variant="primary" className="next" disabled={!stepValid} onClick={onNext}>{t("next")}</Button>
  )}
</div>
```
- Back present on every step except the first (WIZ-03). **No Next on choice steps** (UI-SPEC §2.2 / WIZ-02) — auto-advance instead.
- Chevron is logical/mirrors in RTL (UI-SPEC §7). Use `Button` from `@/components` for the primary Next so disabled styling (`.btn:disabled`, `hlshajara.css:21`) is consistent.

---

### `src/components/wizard/WizardPanel.tsx` (component — step body shell) — new

**Analog:** `src/components/PageShell.tsx:13-23` — the `children: ReactNode` wrapper-with-conditional-class idiom.

`.wizard-panel` = `.card` + `.card-pad-md` (UI-SPEC §7; both classes exist: `hlshajara.css:58`, `:765`). Owns **focus management** (UI-SPEC §7, §11, INTL-03): on step change move focus to the step `<h2 tabindex={-1}>` and announce via a visually-hidden `aria-live="polite"` region ("Step N of M, <title>"). No existing `aria-live` region in the codebase — author it; keep it a single persistent node whose text content updates.

---

### `src/components/wizard/ChoiceStep.tsx` (component — scaffold choice archetype) — new

**Analogs:** `.card.interactive` (`hlshajara.css:61-62` — hover lift + cursor) and the `.chip` selection toggle in `RecordClient.tsx`. No `role="radiogroup"` exists in the codebase — this is net-new a11y; build it per UI-SPEC §5.

- Group: `role="radiogroup"` `aria-labelledby={headingId}`. Each card: `.choice-card` (`.selected` when chosen), `role="radio"` `aria-checked`. Roving tabindex; **Arrow** keys move selection, **Enter/Space** confirm → triggers auto-advance.
- Auto-advance: on confirm, add `.selected`, then after `var(--dur)` (200ms) advance — **instant** under `prefers-reduced-motion` (reduced-motion gate snippet in `WizardClient.tsx` above; UI-SPEC §2.3, §11, WIZ-02).
- Touch target ≥44px; full card is the hit area (UI-SPEC §5).
- Brass check mark (`.choice-card .check`, `--brass-500`) is the *one sanctioned* brass use here — brass is otherwise evidence-strength-only (`tokens.css:41-48`).
- Scaffold scope: two placeholder cards are enough to prove auto-advance + Back-restores-selection (UI-SPEC §2.3.4). Real card sets land Phase 29.

---

### `src/components/wizard/InputStep.tsx` (component — scaffold input archetype) — new

**Analog:** the `.form-field` / `.ds-input` blocks in `SubmitClient.tsx:170-205` (label + input + `updateField`).

```tsx
// model on SubmitClient.tsx:170-179
<div className="form-field">
  <label htmlFor={id}>{t("idName")}</label>
  <input id={id} type="text" className="ds-input"
         value={form.entityName}
         onChange={(e) => dispatch({ type: "SET_FIELD", field: "entityName", value: e.target.value })} />
</div>
```
- Gated on a **Next** button (via `WizardNav`), enabled only when the step validates (UI-SPEC §2.2). Live counter for description min-20 (UI-SPEC §3 Step 5) follows the `ds-caption` helper-text pattern (`SubmitClient.tsx:287-289`).
- Use `.form-row` for two-up fields (`hlshajara.css:152-156`, collapses to 1col <560px — `:169-171`). Reuse `.ds-select` for selects (`hlshajara.css:106-116`).
- Scaffold scope: one placeholder text input proving Next-gating; real fields land Phases 30.

---

### `src/lib/screens.ts` (utility — shared client/server validation lib) — new

**Analog (mirror target, copy VERBATIM):** `src/db/persist.ts` — the regex constants and screen functions. This is the EV-05 keystone: the same regexes must run client-side (advisory, in `InputStep`/review) and remain reusable server-side, so client and server **cannot drift**.

Extract these from `persist.ts` **unchanged** and re-export; then have `persist.ts` import from `screens.ts` (so there is one source). The constants and their exact source lines:

- `BANNED_PATTERNS` — `persist.ts:17-22` (4 regexes: sect/identity terms, group/clan terms, incitement verbs, dehumanizing terms).
- `HATE_PATTERNS` — `persist.ts:24-26`.
- The standalone incitement test regex — `persist.ts:64` (`/\b(اقتلوا|اضربوا|…|القضاء على)\b/gi`).
- `INNOCENT_PROFESSIONS` — `persist.ts:83-85`.
- `ORG_TERMS` — `persist.ts:87-89` (used by mismatch).
- `PRIVATE_DATA_PATTERNS` — `persist.ts:91-96` (phone, GPS, **address** `\b(شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة)\s+\w+`, socials) — UI-SPEC §9 lists these exact four; the address one is also the **coarse-location blocker** (S5) that runs live on the governorate/city field.
- Screen functions verbatim: `screenText` (`persist.ts:36-67`), `screenInnocentParty` (`:98-100`), `screenPrivateTargeting` (`:102-104`), `screenMismatch` (`:106-118`).

**Server order (UI-SPEC §9 / EV-05) — preserve exactly, it is the order `validateSubmission` returns in (`persist.ts:120-216`):**
```
1 NO_SOURCE → 2 WEAK_SOURCE (<2) → 3 GROUP_TARGET → 4 INCITEMENT
→ 5 HATE_TONE → 6 INNOCENT_PARTY → 7 PRIVATE_TARGETING → 8 MISMATCH
```
Screens 3–6 run on the **concatenation** `entityName + " " + entityRole + " " + allegationDescription` — the same join the server uses (`persist.ts:149-155`). Export a single `runScreens(input): PersistResult<...>` that returns the first failing code (matching `validateSubmission`'s early-return cascade) so the surfaced client error == what `/api/submit` would return.

**Caveat for the planner:** `screens.ts` is a `.ts` lib imported by both a `"use client"` component and server code — it must contain **no** server-only imports (no `db`, no `audit`). Lift only the pure regex/screen functions; leave `withAudit`, `validatePublication`, and the DB types in `persist.ts`. After extraction, `persist.ts` re-imports the pure pieces from `screens.ts`.

---

### `src/components/hlshajara.css` (modify — add WIZARD/STEPPER section) — new section

**Analog:** the existing component blocks in the **same file** — `.btn` (`:7-21`), `.card`/`.card.interactive` (`:58-62`), `.chip`/`.chip.on` (`:576-585`), `.filter-badge` (`:558-565`), `.legal*` + its RTL override (`:48-55`, `:805-808`), `.form-*` (`:136-171`), `.flex-between*`/`.card-pad-md` (`:765,784-785`). Tokens from `tokens.css`.

Append one clearly-commented block (UI-SPEC §12):
```css
/* ============================================================
   WIZARD / STEPPER
   ============================================================ */
```
**Conventions to replicate exactly (from the existing file):**
- **Tokens only**, no new colors, no Tailwind utilities. Reference `--brand`/`--surface`/`--border`/`--radius-lg`/`--shadow*`/`--dur`/`--ease`/`--focus-ring`/`--space-*`/`--brass-500`/`--green-500` (all defined in `tokens.css`).
- **Logical properties only** — `padding-inline-*`, `margin-inline-*`, `border-inline-start`, `start/end`, `margin-block-*`. The file header literally states this rule (`hlshajara.css:4`). Example to copy: `.legal { border-inline-start:3px solid … }` + `[dir=rtl] .legal { border-radius:… }` (`:49-51`).
- **RTL machine-string override** — copy the `.card .id` idiom for `.review-sources`/`.ds-mono` (`hlshajara.css:69`): `[dir=rtl] … { direction:ltr; text-align:right; }`.
- **Arabic eyebrow reset** — copy `[dir=rtl] .legal .t { letter-spacing:0; text-transform:none; }` (`:54`) for any Latin small-cap label in the wizard.
- **Reduced-motion** — add wizard transitions/auto-advance under the existing `@media (prefers-reduced-motion: reduce)` block (`:817-819`) pattern: disable slide/opacity transitions.
- **Card selected state** uses `--brand` border + `--shadow-md` and the brass check (UI-SPEC §5) — exactly the `.card.interactive:hover` lift values (`:62`).

Classes to add (UI-SPEC §5, §6, §7, §12): `.wizard`, `.wizard-progress`, `.wizard-step-pill(.on/.done)`, `.wizard-count`, `.wizard-panel`, `.wizard-nav(.back/.next)`, `.choice-grid`, `.choice-card(.selected)` + `.title/.desc/.check`, `.review-group/.review-row/.review-sources/.review-affirm`. (Review-* classes can be deferred to Phase 31 if the planner prefers; the foundation needs `.wizard-*`, `.choice-*`.)

---

## Shared Patterns

### i18n (`useTranslations` + EN/AR parity)
**Source:** `SubmitClient.tsx:38-40`, `RecordClient.tsx:19-21`
**Apply to:** every wizard component.
```tsx
const t = useTranslations("submit");        // all new keys land under "submit"
const legal = useTranslations("legal");
const locale = useLocale();                 // for Intl.NumberFormat + EvidenceCard lang
```
All new strings are flat `camelCase` keys under the existing `submit` namespace in **both** `messages/en.json` and `messages/ar.json` (UI-SPEC §10, INTL-01). Current `submit` keys (28 of them) confirmed: `title, lead, success, error, aboutEntity, fullName, type, type*, role, aboutAllegation, description, period, location, sources, sourceLink, sourceTitle, addSource, uploadFile, uploading, removeFile, yourInfo, email, name, anonymous, submitting, submitButton`. The wizard adds ~70 more (UI-SPEC §3/§10) — run `check:i18n` + the `i18n-checker` agent before merge (INTL-01).

### Routing (locale-preserving `?step=`)
**Source:** `src/i18n/navigation.ts:6` (project router) + `RecordClient.tsx:5,124` (raw `next/navigation` router usage as fallback)
**Apply to:** `WizardClient`, `WizardProgress`, review Edit links.
Prefer `useRouter` from `@/i18n/navigation` (auto-locale-prefix) and pass un-prefixed paths; read the param with `useSearchParams` from `next/navigation`. Always `{ scroll: false }` on step pushes (UI-SPEC §2.5).

### SSR-safe browser-global guard
**Source:** `src/lib/gtm.ts:7-14`
**Apply to:** `persistence.ts` (sessionStorage), reduced-motion check, `beforeunload`.
Always `typeof window !== "undefined"` before touching `sessionStorage`/`matchMedia`/`window`.

### Result / screen discriminated union
**Source:** `src/db/persist.ts:30-32` (`PersistResult<T>`)
**Apply to:** `screens.ts` return type, reducer validation results, API-response handling. Server response shape is `{ ok, code?, message }` (`route.ts:73-77`, error branch `:36-41`) — the rejection-code→step map (UI-SPEC §3) keys off `code`.

### GTM event tracking
**Source:** `src/lib/gtm.ts:7-22` + `SubmitClient.tsx:126-130`
**Apply to:** final submit step. `pushDataLayer(GTM_EVENTS.SUBMIT_CLICK, { success, entityType, isAnonymous })` — event already defined.

### Token-driven CSS (no Tailwind)
**Source:** entire `hlshajara.css` + `tokens.css`
**Apply to:** the new WIZARD section and every component's `className`. Semantic classes consuming tokens; logical properties; no inline-style colors; no utility frameworks. Inline `style={{…}}` is tolerated in the codebase for one-off layout (e.g. `SubmitClient.tsx:219,248`) but **all wizard visuals should be real classes** per UI-SPEC §12.

---

## No Analog Found

| File | Role | Data Flow | Reason / Mitigation |
|------|------|-----------|---------------------|
| `src/lib/wizard/state.ts` (reducer) | store | event-driven | No `useReducer` exists in the repo. Author fresh, but type `form` as `SubmitInput` (`validation.ts:90`) and reuse `PersistResult` (`persist.ts:30`) so it stays contract-bound. |
| `ChoiceStep.tsx` radiogroup a11y | component | event-driven | No `role="radiogroup"`/roving-tabindex/`aria-checked` pattern exists. Build net-new strictly per UI-SPEC §5 + §11; closest visual analogs are `.card.interactive` + `.chip`. |
| `aria-live` step announcer + focus-to-heading | a11y util | event-driven | No `aria-live` region or programmatic focus management in the codebase. Author per UI-SPEC §7/§11 (INTL-03). |

These have **no copy-from** in the repo; the planner should follow UI-SPEC §5/§7/§11 (and RESEARCH.md if present) for them, not invent a different pattern.

---

## Metadata

**Analog search scope:** `src/app/[locale]/{submit,record}/`, `src/components/`, `src/lib/`, `src/db/`, `src/i18n/`, `src/styles/`, `messages/`.
**Files scanned:** 14 read in full (SubmitClient, submit/page, PageShell, persist, validation, navigation, RecordClient, submit route, Button, LegalNote, gtm, Skeleton, tokens.css, hlshajara.css — targeted ranges) + grep across `src/**`.
**Key conventions confirmed:** semantic token classes (no Tailwind), logical properties for RTL, `[dir=rtl]` overrides for letter-spacing/uppercase and machine-string LTR, `useTranslations("submit")` + mandatory EN/AR parity, `typeof window` SSR guards, `PersistResult` discriminated union, `<html dir>` set once in layout (`layout.tsx:22`) and inherited.
**Pattern extraction date:** 2026-06-14
