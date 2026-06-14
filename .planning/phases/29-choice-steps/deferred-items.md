# Phase 29 — Deferred Items (out of scope, pre-existing)

These were discovered during Phase-29 execution in `src/app/[locale]/submit/WizardClient.tsx`
but were introduced by Phase 28 (the scaffold), NOT by Phase-29 changes. Per the executor
scope boundary they are logged, not fixed.

- **`react-hooks/set-state-in-effect` (WizardClient ~line 180)** — the draft-restore
  `useEffect` calls `setShowRestore(true)` synchronously. Pre-existing Phase-28 pattern
  (the restore-prompt-on-mount). eslint flags it as an error under the project's rule set,
  but it is not a tsc/build failure and predates this phase. Candidate for a Phase-32 a11y/
  cleanup pass.
- **`@typescript-eslint/no-unused-vars` — `submitting` (WizardClient ~line 112)** — the
  Phase-28 submit skeleton declares `submitting` but the loading UI that reads it lands in
  Phase 31 (Review/Submit). Pre-existing; resolves when Phase 31 wires the submit button's
  pending state.

Neither blocks `tsc --noEmit`, `npm run build`, or the Phase-29 success criteria.
