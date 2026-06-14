---
phase: 30-input-evidence-steps
plan: 05
subsystem: ui
tags: [next-intl, wizard, react, integration]

requires:
  - phase: 30-input-evidence-steps
    provides: registry input ids + requires predicates (30-01); IdentityStep/DescribeStep (30-02); EvidenceStep/MediaStep (30-03); AboutYouStep (30-04)
provides:
  - "WizardClient render dispatch routing each Phase-30 input id to its step component, Next gated by the registry requires predicate via stepValid"
affects: [31-review-submit, 32-a11y-rtl-audit]

tech-stack:
  added: []
  patterns:
    - "Input branch of the render dispatch keys off state.currentStep; scaffold InputStep is the defensive fallback"

key-files:
  created: []
  modified:
    - src/app/[locale]/submit/WizardClient.tsx

key-decisions:
  - "Routed by an archetype check then a currentStep ternary chain (identity/describe/evidence/media/about-you), with the scaffold InputStep as the neutral fallback for any other input id"

patterns-established:
  - "Each Phase-30 input id renders its own component; the gated Next follows automatically from registry requires (no change to stepValid)"

requirements-completed: [STEP-02, STEP-04, STEP-05, EV-01, EV-02, EV-03, EV-04]

duration: ~3min
completed: 2026-06-14
---

# Phase 30 Plan 05: Wire Input Steps into WizardClient Summary

**Each Phase-30 input id (identity, describe, evidence, media, about-you) renders its own component in WizardClient's render dispatch, keyed off `currentStep`, with the gated Next following automatically from the registry `requires` predicate already read into `stepValid`; all routing/draft/beforeunload/auto-advance/branching/submit wiring left byte-for-byte intact.**

## Performance
- **Duration:** ~3 min (auto-task)
- **Tasks:** 1 of 2 (Task 2 is a blocking human-verify checkpoint — PENDING)
- **Files modified:** 1

## Accomplishments
- Five imports + a `currentStep` render sub-switch route each input id to its component
- Scaffold `InputStep` retained as the defensive fallback
- Unchanged-wiring grep count (`saveDraft|beforeunload|onChoiceConfirm|firstIncompleteStep|/api/submit`) holds at 14 (byte-for-byte preserved)
- `tsc` clean; `npm run build` passes; `/en/submit` + `/ar/submit` build

## Task Commits
1. **Task 1 (render dispatch)** — `4c91e44` (feat)

## Files Created/Modified
- `src/app/[locale]/submit/WizardClient.tsx` — input-step render routing

## Decisions Made
- Used an archetype check + `currentStep` ternary chain with the scaffold `InputStep` fallback (the planned "scaffold-input" id no longer exists post-Phase-29, so the fallback is purely defensive).

## Deviations from Plan
None for Task 1 — executed as written.

## Issues Encountered
None.

## Self-Check: PASSED (auto-task portion)

## Checkpoint Status — Task 2 (blocking human-verify): PENDING
The live EN + AR browser pass (flow order: Identity reached as Step 2 before Conduct; S5 block; describe counter + screens; evidence 2-source links-only gate + token + lead note; media upload + no-video + social-link rejection; anonymity disable+clear; RTL) is a human-verify checkpoint. Auto mode is OFF, so execution STOPS here. The plan is NOT marked complete until the checkpoint returns "approved".

## Next Phase Readiness
- Phase 31 (review/submit/confirmation) consumes the wired wizard; Phase 32 owns the full a11y/RTL audit.

---
*Phase: 30-input-evidence-steps*
*Completed (auto-tasks): 2026-06-14 — human-verify pending*
