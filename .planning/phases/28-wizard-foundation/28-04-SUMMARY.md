---
phase: 28-wizard-foundation
plan: 04
subsystem: ui
tags: [react, next-intl, accessibility, rtl, i18n, intl-numberformat, aria-live, wizard]

# Dependency graph
requires:
  - phase: 28-02
    provides: WIZARD/STEPPER CSS classes (.wizard-progress/.wizard-step-pill(.on/.done)/.wizard-count/.wizard-panel/.wizard-nav(.back/.next)), token-only + logical-props-only, reduced-motion overrides
  - phase: 28-03
    provides: wizard engine (registry.ts STEPS/StepId/visibleStepCount/visibleStepIndex/isCountedStep, state.ts WizardState) + 11 shell i18n keys (back/next/stepCounter/scaffold* EN+AR parity)
provides:
  - WizardProgress.tsx — step-pill progress row + Arabic-Indic "Step N of M" counter (WIZ-04)
  - WizardNav.tsx — persistent Back (every step but first) + conditional Next (input only, validity-gated) (WIZ-03)
  - WizardPanel.tsx — accessible step-body shell with focus-to-heading + single persistent aria-live announcer
affects: [28-05, 29-wizard-steps, 30-wizard-steps, 31-wizard-review, 32-wizard-i18n-a11y-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaf presentational chrome — components take state-derived props + callbacks (onJump/onBack/onNext); no routing/business state (root container Plan 05 wires them)"
    - "Intl.NumberFormat(locale) for every user-facing number so AR renders Arabic-Indic digits — used in both the visible counter and the spoken aria-live announcement"
    - "Single persistent aria-live=polite node updated (not remounted) + focus-to-<h2 tabIndex=-1> on step change for accessible step transitions"
    - "Inline clip-style sr-only node only where no helper class exists (no new CSS); all visuals are real classes/tokens"

key-files:
  created:
    - src/components/wizard/WizardProgress.tsx
    - src/components/wizard/WizardNav.tsx
    - src/components/wizard/WizardPanel.tsx
  modified: []

key-decisions:
  - "WizardProgress derives pill status (done/current/upcoming) from registry visibleStepIndex + state.visited so a branch-skipped step never gets a pill and never miscounts M (WIZ-04)"
  - "t(step.titleKey as never) is the dynamic-key escape for next-intl's literal-union message typing — titleKey is a runtime-derived registry string; the cast is the only zero-dep option without a full typed-key map"
  - "WizardPanel renders a single persistent aria-live region whose text is N / M — title (Intl-formatted), not a remounted node, so screen readers announce reliably (UI-SPEC §7/§11)"
  - "Components are stateless leaves: they accept onJump/onBack/onNext callbacks rather than importing the project router, keeping them independently typecheck-gated and Plan-05-wireable"
  - "No new i18n keys added — the 3 components consume only the 5 relevant shell keys (back/next/stepCounter/scaffoldChoiceTitle/scaffoldInputLabel) shipped in 28-03; EN+AR parity verified"

patterns-established:
  - "Wizard chrome = pure props-in/callbacks-out leaf components consuming Plan 02 classes + Plan 03 engine types"
  - "Arabic-Indic numbers everywhere via Intl.NumberFormat(useLocale()) — visible AND announced"
  - "Accessible step change = focus-to-heading (never trap) + one persistent aria-live=polite announcer"

requirements-completed: [WIZ-03, WIZ-04]

# Metrics
duration: ~14min
completed: 2026-06-14
---

# Phase 28 Plan 04: Wizard Chrome Components Summary

**Three leaf chrome components — WizardProgress (Arabic-Indic step pills + counter), WizardNav (Back + validity-gated Next), WizardPanel (focus-to-heading + aria-live announcer) — consuming the Plan 02 WIZARD CSS and Plan 03 engine, all typecheck-clean with zero new dependencies and zero new i18n keys.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-14
- **Completed:** 2026-06-14
- **Tasks:** 3
- **Files modified:** 3 (all created)

## Accomplishments
- **WizardProgress** renders a `.wizard-progress` row of `.wizard-step-pill` pills: the active pill carries `aria-current="step"` (+ `.on`), completed pills are real `<button>`s (`.done`) that call `onJump(id)` to route back, upcoming pills are inert `<span>`s. The `.wizard-count` "Step N of M" uses `Intl.NumberFormat(locale)` so AR shows Arabic-Indic digits, and N/M are derived from the registry's `visibleStepCount`/`visibleStepIndex` so a branch-skipped step never miscounts (WIZ-04, UI-SPEC §7/§11).
- **WizardNav** renders `.wizard-nav.flex-between` with a `.btn ghost back` Back button (only when `!isFirst`; chevron supplied by CSS `.back::before` `margin-inline-end` so it mirrors in RTL) and a primary `.next` `Button` rendered ONLY for `archetype === "input"`, `disabled`/`aria-disabled` until `stepValid`. Choice steps render no Next (auto-advance — WIZ-03, WIZ-02, UI-SPEC §2.2/§2.4/§7).
- **WizardPanel** wraps the step body in `.wizard-panel`, focuses the step `<h2 tabIndex={-1}>` via a `useEffect` keyed on the step (never trapping), and announces "N / M — title" through a single persistent visually-hidden `aria-live="polite"` region. Renders only React text + `children` (no raw-HTML injection — XSS guard T-28-08); reduced-motion is honored structurally (no JS animation; the CSS transition is already disabled under `prefers-reduced-motion`).

## Task Commits

Each task was committed atomically:

1. **Task 1: WizardProgress.tsx — pills + Arabic-Indic Step N of M** — `172b37b` (feat)
2. **Task 2: WizardNav.tsx — Back (every step but first) + conditional Next** — `c383a83` (feat)
3. **Task 3: WizardPanel.tsx — step body + focus management + aria-live announcer** — `d95b553` (feat)

**Plan metadata:** (this commit) docs(28-04)

## Files Created/Modified
- `src/components/wizard/WizardProgress.tsx` — Progress pills + locale-formatted "Step N of M" counter; aria-current on active pill; completed pills jump back via onJump
- `src/components/wizard/WizardNav.tsx` — Back on all but first step + conditional, validity-gated Next on input steps only
- `src/components/wizard/WizardPanel.tsx` — Accessible step-body shell: focus-to-heading + single persistent aria-live announcer; no raw-HTML injection

## Decisions Made
- **Stateless leaf components.** All three take state-derived props + callbacks (`onJump`/`onBack`/`onNext`) instead of importing the router or reducer, so they typecheck independently and the Plan 05 root wires them. Matches the plan's framing ("they consume Plan 03 types but render no business state themselves; the root wires them").
- **`t(step.titleKey as never)`** is the sanctioned dynamic-key escape for next-intl's literal-union message typing — `titleKey` is a runtime registry string, and the cast is the only zero-dependency option short of a full generated typed-key map.
- **Single persistent aria-live node** updated by text content (not remounted) per 28-PATTERNS.md, with the announcement string Intl-formatted so the spoken digits match the visible counter.
- **Inline clip-style sr-only node** used only on the aria-live region (no `sr-only`/`visually-hidden` helper class exists in the codebase, and the plan explicitly permits an inline clip style for that node only — no new CSS introduced).

## Deviations from Plan

None - plan executed exactly as written.

The only mid-task adjustment was non-deviational: the Task 3 verify gate `! grep -q 'dangerouslySetInnerHTML'` is a hard "token must not appear anywhere" gate, so the literal token was removed from a JSDoc comment (rephrased to "never injects raw HTML") to satisfy the gate. No behavior change.

## Issues Encountered
- **Task 3 grep gate tripped on a doc comment.** The `dangerouslySetInnerHTML` exclusion gate matched the word inside my explanatory comment, not in any code. Resolved by rephrasing the comment; the component never used the API. Gate now green.

## TDD Note (Task 1 was tagged `tdd="true"`)
The plan tagged Task 1 TDD, but `WizardProgress` is a JSX React component and this project installs **no test framework** (a standing constraint — threat T-28-SC "zero npm installs"; Plans 01/03 drove their pure-TS reducers under Node `--experimental-strip-types`, which cannot render JSX without a DOM/renderer dependency). The executable verification for all three components is therefore the plan's `<automated>` gate: `tsc --noEmit` (clean) + the per-file grep assertions (`aria-current` + `Intl.NumberFormat` + `wizard-step-pill` for Progress; `wizard-nav`/`isFirst`/`archetype` for Nav; `aria-live` + `tabIndex` + `wizard-panel` + no `dangerouslySetInnerHTML` for Panel) — all passing. The behavioral RED/GREEN intent (Arabic-Indic counter, aria-current placement, jump-back buttons) is encoded as those grep gates rather than a runner. Full interaction/a11y testing (Playwright RTL/LTR, axe) is the explicit remit of Phase 32's audit per UI-SPEC §11.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three chrome components ship and typecheck clean, consuming the Plan 02 classes + Plan 03 engine. Ready for **Plan 05** (the `WizardClient` root) to wire `onJump` → `router.push(?step=)`, `onBack`/`onNext` → registry `prevStep`/`nextStep` dispatch, and to pass `WizardPanel` the registry-derived `stepIndex`/`stepTotal`.
- Accessibility foundations (`aria-current`, focus-to-heading, single `aria-live` announcer, Arabic-Indic digits) are in place for Phase 32's full audit.
- No blockers introduced. No new i18n keys (parity preserved); no new dependencies (T-28-SC honored).

## Self-Check: PASSED

- Files: WizardProgress.tsx, WizardNav.tsx, WizardPanel.tsx, 28-04-SUMMARY.md — all FOUND
- Commits: 172b37b, c383a83, d95b553 — all reachable

---
*Phase: 28-wizard-foundation*
*Completed: 2026-06-14*
