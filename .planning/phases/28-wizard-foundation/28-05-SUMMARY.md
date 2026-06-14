---
phase: 28-wizard-foundation
plan: 05
subsystem: report-submission-wizard
tags: [wizard, scaffold, routing, draft, branching, a11y, rtl, i18n, s1-s4]
status: awaiting-human-verify
requires:
  - "28-02 (WIZARD/STEPPER CSS: .wizard, .choice-grid/.choice-card/.selected/.title/.desc/.check, .wizard-nav)"
  - "28-03 (engine: wizardReducer/initialWizardState/WizardAction; STEPS/StepId/StepDef/nextStep/prevStep/isReachable/firstIncompleteStep/visibleStepCount/visibleStepIndex; saveDraft/loadDraft/clearDraft)"
  - "28-04 (chrome: WizardProgress, WizardNav, WizardPanel)"
provides:
  - "ChoiceStep — accessible auto-advancing radiogroup scaffold (WIZ-02)"
  - "InputStep — Next-gated input scaffold (WIZ-01)"
  - "WizardClient — root container wiring ?step= routing + draft + history + branching + beforeunload + submit (WIZ-01,03,05,06)"
  - "/submit route renders the live wizard shell (SSG, both locales)"
affects:
  - "Phases 29-31 (real step content slots into the proven ChoiceStep/InputStep archetypes + WizardClient registry render)"
  - "Phase 31 (submit/review fills the WizardClient submit skeleton copy)"
tech-stack:
  added: []
  patterns:
    - "useReducer root container consuming a pure framework-free engine (first useReducer in repo)"
    - "?step= URL as single source of truth → free browser Back/Forward + refresh-restore"
    - "reduced-motion-gated auto-advance (matchMedia, SSR-guarded)"
    - "Suspense boundary around a useSearchParams client child for static prerender"
    - "role=radiogroup + roving tabindex + aria-checked (first a11y radiogroup in repo)"
key-files:
  created:
    - "src/components/wizard/ChoiceStep.tsx"
    - "src/components/wizard/InputStep.tsx"
    - "src/app/[locale]/submit/WizardClient.tsx"
  modified:
    - "src/app/[locale]/submit/page.tsx"
decisions:
  - "ChoiceStep names its radiogroup via aria-label (resolved step title) not aria-labelledby — the heading lives in sibling WizardPanel, so a self-contained label avoids a dangling id ref (no WizardPanel edit needed, kept Plan-04 file untouched)."
  - "Scaffold choice options are the entityType individual-vs-organization toggle so the registry branch-skip is exercised live (individual skips the input step; organization surfaces it) — neutral, never an S1-S4 targeting category."
  - "WizardClient default-exports (matches the page.tsx default-import analog) and also named-exports for direct import sites."
  - "page.tsx wraps WizardClient in <Suspense fallback={null}> — useSearchParams requires a Suspense boundary under generateStaticParams static prerender; /en|ar/submit build as SSG."
  - "auto-advance delay constant = 200ms mirrors tokens.css --dur; immediate under prefers-reduced-motion."
metrics:
  duration: "~6 min"
  completed: "2026-06-14"
  tasks_auto_done: 3
  tasks_total: 4
  files_created: 3
  files_modified: 1
---

# Phase 28 Plan 05: Wizard Shell Integration (Scaffolds + Root + Page Swap) Summary

The full report-submission wizard SHELL is live at `/submit`: two scaffold archetype components (an accessible auto-advancing `ChoiceStep` radiogroup and a Next-gated `InputStep`) plus the `WizardClient` root that wires `?step=` routing, sessionStorage draft + restore prompt, `beforeunload` dirty-guard, browser history, choice auto-advance with a reduced-motion gate, and branching/reachability redirect — proving WIZ-01..06 with placeholder content only. The three auto tasks are committed and the production build passes (both locales SSG). The plan's final task is a **blocking human-verify checkpoint**, which is NOT self-approved — it awaits live-browser confirmation.

## Status: 3/4 tasks complete — Task 4 (human-verify) PENDING

## Tasks Completed (auto)

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | ChoiceStep + InputStep scaffold archetypes | `a05195e` | src/components/wizard/ChoiceStep.tsx, src/components/wizard/InputStep.tsx |
| 2 | WizardClient root — ?step= + draft + history + branching | `b760869` | src/app/[locale]/submit/WizardClient.tsx (+ ChoiceStep ariaLabel) |
| 3 | Swap page.tsx to render WizardClient | `f748529` | src/app/[locale]/submit/page.tsx |

## Task Pending

| Task | Name | Gate | Status |
| ---- | ---- | ---- | ------ |
| 4 | Human-verify the live wizard shell end-to-end | `checkpoint:human-verify` (blocking) | Automated gates passed; awaiting live-browser human confirmation |

## What Was Built

- **ChoiceStep** (`role="radiogroup"`): two placeholder `.choice-card`s each `role="radio"` + `aria-checked`; roving tabindex (only the active card is `tabIndex=0`); ArrowUp/Down/Left/Right move the focused card; Enter/Space/pointer-up confirm → `onConfirm(value)`. Selection visuals (`.selected` + brass `.check`) derive purely from the parent-owned `value`. On Back-return with a prior value it pre-selects + focuses the matching card. Renders NO Next (auto-advance owns forward motion).
- **InputStep**: a single Next-gated `.form-field`/`.ds-input` bound to `dispatch({type:"SET_FIELD", field:"entityName", ...})`. Renders no Next of its own; the parent's `WizardNav` gates Next on the registry `requires` predicate (`entityName` non-empty).
- **WizardClient** (root, `useReducer`): renders exactly one step at a time inside `.wizard`. Wires all six concerns —
  1. **Routing** — `goTo(id)` → `router.push("/submit?step="+id, { scroll:false })` via `@/i18n/navigation` (locale-preserving); `?step=` is the source of truth.
  2. **Draft** — `saveDraft(state)` on every dirty change; mount restore prompt (`.legal` with `restoreDraft*` keys) → Resume (`RESTORE_DRAFT`) / Start over (`clearDraft`+`RESET`); `clearDraft()` on successful submit.
  3. **Beforeunload** — warns on a dirty unsubmitted draft, cleaned up on unmount.
  4. **Auto-advance** — choice `onConfirm` sets `entityType` then advances immediately under `prefers-reduced-motion` else after `var(--dur)`=200ms.
  5. **Branching/reachability** — on mount + every `?step=` change, an unknown or `!isReachable` id `router.replace`s to `firstIncompleteStep` (WIZ-06); reachable Back/Forward ids sync into the reducer.
  6. **Submit skeleton** — POST `/api/submit` with the `SubmitInput` state + `pushDataLayer(GTM_EVENTS.SUBMIT_CLICK,...)` + reset + `clearDraft()`.
- **page.tsx** — imports `./WizardClient`, renders `<WizardClient/>` inside `<PageShell narrow>` (wrapped in `<Suspense>`); `generateStaticParams` kept verbatim; no `dir` handling. `SubmitClient.tsx` left on disk (documented analog).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dangling `aria-labelledby` on the ChoiceStep radiogroup**
- **Found during:** Task 2 (wiring ChoiceStep into WizardClient).
- **Issue:** The plan specified the radiogroup is `aria-labelledby={headingId}` pointing at the step heading, but that `<h2>` is rendered by the sibling `WizardPanel` (a Plan-04 file, out of this plan's scope) and carries no matching `id` — the ref would dangle, leaving the radiogroup without an accessible name.
- **Fix:** Changed ChoiceStep to take an `ariaLabel` prop (the resolved step title) and set `aria-label` on the radiogroup instead — a valid, self-contained accessible name; WizardPanel left untouched.
- **Files modified:** src/components/wizard/ChoiceStep.tsx
- **Commit:** `b760869`

**2. [Rule 1/3 - Type error] `stepDef.requires` not accessible on the `as const` STEPS union**
- **Found during:** Task 2 verify (tsc).
- **Issue:** `STEPS.find(...)` returns the literal `as const` union; the choice-step member has no `requires`/`branchWhen`, so TS rejected `stepDef.requires`.
- **Fix:** Imported the declared `StepDef` interface and widened the lookup to `StepDef | undefined`, exposing the optional props.
- **Files modified:** src/app/[locale]/submit/WizardClient.tsx
- **Commit:** `b760869`

**3. [Rule 3 - Blocking gate] Build failed: `useSearchParams()` needs a Suspense boundary**
- **Found during:** Task 3 verify (`next build`).
- **Issue:** With `generateStaticParams` (static prerender), `useSearchParams()` in WizardClient triggered a CSR-bailout prerender error on `/en/submit`.
- **Fix:** Wrapped `<WizardClient/>` in `<Suspense fallback={null}>` in page.tsx (canonical Next.js fix); `generateStaticParams` unchanged. Both locales now build as SSG.
- **Files modified:** src/app/[locale]/submit/page.tsx
- **Commit:** `f748529`

**4. [Rule 3 - Blocking gate] S1-S4 absence greps tripped by my own documentation comments**
- **Found during:** Task 1 + Task 2 verify.
- **Issue:** Doc comments that *named* the banned S1-S4 token categories (and the innocent word "mapping", which the `map.?pin` token matched) failed the blunt `! grep` token-absence gate even though no such field exists.
- **Fix:** Reworded the guardrail comments to describe the constraint categorically ("the banned S1-S4 targeting categories the design review rejects") without spelling each token; "interim §8 mapping" → "interim §8 field correspondence".
- **Files modified:** src/components/wizard/ChoiceStep.tsx, src/components/wizard/InputStep.tsx, src/app/[locale]/submit/WizardClient.tsx
- **Commits:** `a05195e`, `b760869`

## Verification Results

- `node_modules/.bin/tsc --noEmit -p tsconfig.json` → 0 errors.
- `node_modules/.bin/next build` → success; `/[locale]/submit` builds as SSG for `/ar/submit` + `/en/submit`.
- WizardClient greps: `useReducer`, `beforeunload`, `scroll: false`, `prefers-reduced-motion`, `isReachable`/`firstIncompleteStep` all present.
- ChoiceStep greps: `role="radiogroup"`, `aria-checked` present. InputStep: `ds-input` present.
- S1-S4 token grep over ChoiceStep + InputStep + WizardClient → no matches (targeting/identity/loyalty/profession fields absent).

## Known Stubs

The two step components are **intentional scaffolds**, declared as such by the plan (Phase 28 is the wizard foundation; real content lands Phases 29-31):
- `ChoiceStep` renders two placeholder cards (the entityType individual/organization toggle) — real card sets land Phase 29.
- `InputStep` renders one placeholder `entityName` text field — real fields land Phase 30.
- `WizardClient` submit skeleton POSTs to `/api/submit` but the final review step copy/flow is filled in Phase 31.

These are not blocking stubs: the plan's goal (prove WIZ-01..06 end-to-end with placeholder content) is achieved. Each is wired (controlled inputs, real reducer dispatch, real routing), not empty mock data.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern, or schema change was introduced — the wizard routes to the existing `/api/submit` choke point. The `?step=` (T-28-10) and restored-draft (T-28-11/12) mitigations from the plan's threat register are implemented (reachability redirect; controlled-input binding; allowlisted RESTORE_DRAFT merge from Plan 03; clearDraft on submit; sessionStorage lifetime).

## Human-Verify Checkpoint (Task 4 — PENDING)

The full wizard SHELL is built and build-clean. A human must now exercise the live flow in a browser to confirm interaction behavior that static checks cannot prove (auto-advance timing, reduced-motion, browser history, refresh-restore, beforeunload, deep-link redirect, RTL + Arabic-Indic counter, and S1-S4 field absence in the rendered DOM). Dev command: `npm run dev`, then visit `http://localhost:3000/en/submit` and `/ar/submit`. The 10 acceptance checks are listed in the returned checkpoint message. This plan does not complete until the human types "approved".

## Self-Check: PASSED

- All 5 files verified present on disk (3 created, 1 modified, 1 SUMMARY).
- All 3 auto-task commits verified in git history (`a05195e`, `b760869`, `f748529`).
