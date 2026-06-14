---
phase: 28-wizard-foundation
plan: 03
subsystem: ui
tags: [wizard, useReducer, sessionStorage, next-intl, typescript, state-machine, i18n]

# Dependency graph
requires:
  - phase: 28-01
    provides: "src/lib/screens.ts (PersistResult, runScreens) — the shared validation contract the reducer re-uses"
provides:
  - "Pure wizard engine: src/lib/wizard/{state,registry,persistence}.ts (no JSX, no React runtime)"
  - "WizardState reducer bound AS SubmitInput (the /api/submit contract) — client/server cannot drift"
  - "Typed step registry (STEPS as const) + WIZ-06 branching/reachability/visible-count helpers"
  - "SSR-safe sessionStorage draft persistence keyed on hls.submit.draft.v1 (WIZ-05)"
  - "11 shell i18n keys (back/next/begin/stepCounter/restoreDraft*/leaveWarning/scaffold*) in EN+AR with parity"
affects: [28-04, 28-05, 29-choice-steps, 30-input-steps, 31-review-submit, 32-i18n-parity, 33-backend-support]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useReducer state machine typed AS the Zod contract (import type SubmitInput) — no redeclared form shape"
    - "RESTORE_DRAFT key-allowlist merge (no spread of untrusted draft → no prototype pollution)"
    - "Step registry as const + derived StepId union (mirrors src/i18n/navigation.ts)"
    - "type-only circular ref between state.ts (imports StepId) and registry.ts (imports WizardState) — erased at runtime"
    - "SSR-guarded sessionStorage utility (typeof window) mirroring src/lib/gtm.ts"
    - "no-test-framework regression: drive pure TS reducer via Node --experimental-strip-types (Plan 01 precedent)"

key-files:
  created:
    - "src/lib/wizard/state.ts — useReducer state machine + WizardState/WizardAction types"
    - "src/lib/wizard/registry.ts — ordered STEPS + StepId + nextStep/prevStep/isReachable/firstIncompleteStep/visibleStepCount"
    - "src/lib/wizard/persistence.ts — saveDraft/loadDraft/clearDraft (hls.submit.draft.v1)"
    - "scripts/wizard-reducer-check.js — TDD reducer contract test (no framework)"
  modified:
    - "messages/en.json — +11 shell keys under submit"
    - "messages/ar.json — +11 shell keys under submit (full parity)"

key-decisions:
  - "WizardState.form typed AS SubmitInput (imported, never redeclared) so wizard and /api/submit can't drift"
  - "isAnonymous seeds to true at the client state (UI-SPEC §8 / S7); DB-column default flip remains BE-04 in Phase 33"
  - "RESTORE_DRAFT merges only a hard-coded allowlist of SubmitInput keys (T-28-06) — malformed/injected drafts can't write arbitrary keys"
  - "Reducer driven via Node type-stripping for TDD (Plan 01 precedent) instead of installing a test framework (T-28-SC: zero installs)"
  - "Phase 28 registry wires only the two scaffold steps; the real 9 land in Phases 29-31 — the branch-skip + visible-count contract is encoded now"

patterns-established:
  - "Reducer-as-contract: form state IS the Zod-inferred SubmitInput type"
  - "Registry-as-config: STEPS as const + derived StepId union, helpers take WizardState"
  - "Draft persistence: sessionStorage (not localStorage) + SSR guard + try/catch (never throws on quota/parse)"

requirements-completed: [WIZ-05, WIZ-06]

# Metrics
duration: ~16min
completed: 2026-06-14
---

# Phase 28 Plan 03: Wizard Engine + Shell i18n Summary

**Pure (no-JSX) wizard engine — a useReducer state machine bound AS the `/api/submit` `SubmitInput` contract, a typed `STEPS as const` registry with WIZ-06 branching/reachability/visible-count helpers, SSR-safe `sessionStorage` draft persistence (`hls.submit.draft.v1`), and 11 EN/AR-parity shell i18n keys — all typecheck-clean and consumed by the UI plans (04/05).**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-06-14
- **Completed:** 2026-06-14
- **Tasks:** 3 (Task 1 TDD: RED → GREEN)
- **Files modified/created:** 6 (3 wizard modules, 1 test script, 2 message files)

## Accomplishments
- `state.ts`: a 10-action wizard reducer whose `form` is typed AS `SubmitInput` (imported, not redeclared) so client and server cannot drift; `isAnonymous` seeds `true` (S7 anonymity-default); the legacy `SubmitClient.tsx` field/source/file mutators ported verbatim into reducer cases.
- `registry.ts`: an ordered `STEPS as const` (two scaffold steps proving the choice/input archetypes), a derived `StepId` union, and the full WIZ-06 helper set — `nextStep`/`prevStep`/`isReachable`/`firstIncompleteStep` (deep-link redirect) plus `isCountedStep`/`visibleStepCount`/`visibleStepIndex` so a skipped branch step never miscounts "Step N of M". The Individual-branch skip predicate keys on `entityType === "individual"`.
- `persistence.ts`: `saveDraft`/`loadDraft`/`clearDraft` keyed on `hls.submit.draft.v1`, each SSR-guarded and try/catch-wrapped — `loadDraft` returns `null` on parse failure, writes never throw on quota; `sessionStorage` (not `localStorage`) per the shared-device threat (T-28-05).
- 11 shell i18n keys added to BOTH `messages/en.json` and `messages/ar.json` under `submit` with full EN/AR parity (`stepCounter` is the ICU `{n}/{m}` template; the rest of the wizard's ~70 keys are deferred to Phase 32 as planned).
- A no-framework TDD reducer contract test (`scripts/wizard-reducer-check.js`, 20 assertions) drives the pure reducer via Node `--experimental-strip-types`, following the Plan 01 precedent and the no-installs constraint (T-28-SC).

## Task Commits

1. **Task 1 (RED): failing reducer contract test** - `4387f0d` (test)
2. **Task 1 (GREEN): wizard reducer + types (state.ts)** - `abb9a2f` (feat)
3. **Task 2: step registry + branching/reachability (registry.ts)** - `886ef62` (feat)
4. **Task 3: draft persistence + shell i18n keys (persistence.ts, messages/*)** - `b2b312d` (feat)

**Plan metadata:** committed separately (docs: complete plan).

## Files Created/Modified
- `src/lib/wizard/state.ts` (created) - `useReducer` state machine; `WizardState`/`WizardAction`; `initialWizardState` (isAnonymous=true); 10 reducer cases with key-allowlisted `RESTORE_DRAFT`.
- `src/lib/wizard/registry.ts` (created) - `STEPS as const`; `StepId`; `nextStep`/`prevStep`/`isReachable`/`firstIncompleteStep`/`isCountedStep`/`visibleStepCount`/`visibleStepIndex`.
- `src/lib/wizard/persistence.ts` (created) - SSR-safe `sessionStorage` draft save/load/clear on `hls.submit.draft.v1`.
- `scripts/wizard-reducer-check.js` (created) - TDD reducer regression (20 assertions, no test framework).
- `messages/en.json` (modified) - +11 shell keys under `submit`.
- `messages/ar.json` (modified) - +11 shell keys under `submit` (full parity).

## Decisions Made
- **Form-as-contract:** `WizardState.form` is the imported `SubmitInput` type, never a redeclared shape — the single anti-drift guarantee the whole milestone hangs on.
- **Anonymity default at the seed:** `isAnonymous: true` lives in the client seed now (UI-SPEC §8 / S7); the database-column default flip stays BE-04 (Phase 33), so this is a UI-side default only.
- **RESTORE_DRAFT allowlist:** the reducer merges only a hard-coded list of known `SubmitInput` keys from the untrusted draft (T-28-06), never spreading `action.draft` — closing prototype-pollution / arbitrary-key injection from a tampered `sessionStorage` value.
- **Type-only circular reference:** `state.ts` imports `StepId` from `registry.ts` and `registry.ts` imports `WizardState` from `state.ts`, both `import type` — `tsc` resolves it cleanly and Node type-stripping erases both, keeping each module runtime-pure.
- **No test framework:** drove the reducer via Node `--experimental-strip-types` (Plan 01 precedent) to honor the zero-install constraint (T-28-SC).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created `registry.ts` (Task 2) before running Task 1's `tsc` gate**
- **Found during:** Task 1 (state.ts)
- **Issue:** `state.ts` imports `StepId` from `./registry` (a genuine, plan-specified mutual TYPE dependency). Task 1's `tsc --noEmit` verify gate cannot pass in isolation because `./registry` does not exist until Task 2.
- **Fix:** Authored `registry.ts` immediately after `state.ts` (its own task, still committed separately as `886ef62`) so the project-wide `tsc` gate is green at every commit boundary. The reducer's runtime TDD test (`abb9a2f` GREEN) runs independently because the `StepId` import is type-only and erased by type-stripping.
- **Files modified:** none beyond the planned files — purely an ordering note.
- **Verification:** `tsc --noEmit` exits 0 at the `state.ts` commit (with `registry.ts` present); reducer test 20/20 green standalone.
- **Committed in:** `abb9a2f` (state.ts) + `886ef62` (registry.ts)

---

**Total deviations:** 1 (sequencing only — no scope change, no extra files beyond the TDD test artifact).
**Impact on plan:** None. All three planned modules and the 11 i18n keys delivered exactly as specified; the only adjustment was committing the two mutually-type-dependent modules back-to-back so each commit typechecks.

## Issues Encountered
None. The intentional `state.ts ↔ registry.ts` type circularity is handled by `import type` on both sides (erased at runtime, resolved by `tsc`); the reducer TDD test runs standalone because its only imports are type-only.

## Known Stubs
The two scaffold steps (`scaffold-choice`, `scaffold-input`) and their two placeholder i18n strings (`scaffoldChoiceTitle`, `scaffoldInputLabel`) are intentional Phase-28 scaffolds proving the choice/input archetypes — the real 9 numbered steps and their copy land in Phases 29-31 (per 28-PATTERNS.md scope). Not blocking: the engine is complete and the scaffold is the documented Phase 28 deliverable.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The pure engine (state + registry + persistence) is contract-bound to `SubmitInput` and typecheck-clean — ready for Plan 04 (presentational components) and Plan 05 (root container + `?step=` routing + `beforeunload` guard).
- Branching/reachability (WIZ-06) and draft survival (WIZ-05) primitives are in place; Phases 29-31 append real steps to `STEPS` and Phase 32 adds the full ~70-key i18n set.
- Backend follow-up unchanged: `isAnonymous` DB-column default flip is BE-04 (Phase 33); the client default is already `true`.

## Self-Check: PASSED

All created files present (`state.ts`, `registry.ts`, `persistence.ts`, `wizard-reducer-check.js`, `28-03-SUMMARY.md`); all task commits present (`4387f0d`, `abb9a2f`, `886ef62`, `b2b312d`).

---
*Phase: 28-wizard-foundation*
*Completed: 2026-06-14*
