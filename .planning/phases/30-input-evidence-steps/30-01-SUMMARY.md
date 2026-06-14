---
phase: 30-input-evidence-steps
plan: 01
subsystem: ui
tags: [next-intl, wizard, validation, i18n, pure-logic]

requires:
  - phase: 28-wizard-shell
    provides: WizardState reducer, StepDef registry + nav/reachability helpers, screens.ts
  - phase: 29-choice-steps
    provides: the four real choice steps (actor-class, entity-subtype, conduct, role-in-act) + encoding helpers
provides:
  - "src/lib/wizard/step-logic.ts — composeLocation, SOURCE_TYPE_SLUGS, prefixSourceType (idempotent §8 token), screenIdentityStep/screenDescribeStep (server-order screens), evidenceSourceCount (links-only), screenMediaLink, and the five requires predicates"
  - "Registry STEPS extended to the nine-step UI-SPEC §3 flow order (identity inserted between entity-subtype and conduct)"
  - "All Phase-30 submit i18n keys in EN+AR parity"
  - "scripts/step-logic-check.js — no-test-framework regression with the exact id-order assertion"
affects: [30-02, 30-03, 30-04, 30-05, 31-review-submit]

tech-stack:
  added: []
  patterns:
    - "Pure-logic step module driven under Node --experimental-strip-types via an off-thread ESM resolve hook (mirrors wizard-choice-steps-check.js)"
    - "Extensionless relative import of value-side screen functions (../screens), matching registry → ./encoding"

key-files:
  created:
    - src/lib/wizard/step-logic.ts
    - scripts/step-logic-check.js
  modified:
    - src/lib/wizard/registry.ts
    - messages/en.json
    - messages/ar.json
    - scripts/wizard-choice-steps-check.js

key-decisions:
  - "Imported screen functions relatively (../screens, extensionless) not via @/ alias so the module loads under --experimental-strip-types; the grep criterion's intent (screen re-use) is satisfied by the relative import"
  - "leadNote was pre-satisfied (commit 6366ab3) — validation.ts left untouched"

patterns-established:
  - "step-logic.ts is the single source of truth for location composition, the §8 source-type token, per-step screens, the ≥2-source count, and the five requires predicates"

requirements-completed: [STEP-02, STEP-04, EV-01, EV-04]

duration: ~6min
completed: 2026-06-14
---

# Phase 30 Plan 01: Input-Step Logic Layer Summary

**Pure step-logic module (coarse-location compose, idempotent §8 source-type token, server-order screen runners, ≥2-links count, five requires predicates) plus the registry insert that puts `identity` at Step 2 between entity-subtype and conduct, with full EN+AR i18n parity.**

## Performance
- **Duration:** ~6 min
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- `step-logic.ts`: 12 exports, runtime-pure, no reimplemented regexes (re-uses screens.ts verbatim)
- Registry STEPS now `actor-class, entity-subtype, identity, conduct, role-in-act, describe, evidence, media, about-you` — `identity` at index 2 (before conduct), exact-order asserted
- All Phase-30 submit keys added in EN+AR (130 keys each, parity)
- `step-logic-check.js`: 25 checks incl. the exact id-order assertion

## Task Commits
1. **Task 1 + 2 + 3** — `5874f3e` (feat) — committed atomically as one plan commit

## Files Created/Modified
- `src/lib/wizard/step-logic.ts` — the pure input-step logic layer
- `src/lib/wizard/registry.ts` — five input StepDefs inserted in flow order
- `messages/{en,ar}.json` — Phase-30 keys (submit namespace)
- `scripts/step-logic-check.js` — regression with order assertion
- `scripts/wizard-choice-steps-check.js` — stale Phase-29 order/count assertions updated

## Decisions Made
- Screen functions imported relatively (`../screens`, extensionless) for strip-types loadability — see Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Relative screen import instead of `@/lib/screens` alias**
- **Found during:** Task 1
- **Issue:** Task 1's acceptance criterion runs a bare `node --experimental-strip-types` import of step-logic.ts AND expects `from "@/lib/screens"`. The `@/` alias is not resolvable by Node's raw loader for a value-side runtime import — the bare load fails with ERR_MODULE_NOT_FOUND. (state.ts/registry.ts avoid this because their `@/` imports are type-only and erased.)
- **Fix:** Imported the screen functions via the extensionless relative path `../screens` (exactly as registry.ts imports `./encoding`) and drive the module under the repo's established off-thread ESM resolve hook (mirrors scripts/wizard-choice-steps-check.js). The criterion's intent — screen re-use, no reimplemented regexes — is fully satisfied; the literal `@/lib/screens` string is incompatible with the runtime-load criterion, so the relative form was used.
- **Files modified:** src/lib/wizard/step-logic.ts
- **Verification:** Loads under the hook (12 exports); all 25 step-logic-check assertions pass; tsc clean.
- **Committed in:** 5874f3e

**2. [Rule 1 - Bug] Updated stale Phase-29 order/count assertions in wizard-choice-steps-check.js**
- **Found during:** Task 2
- **Issue:** Inserting `identity` between entity-subtype and conduct changed the registry shape the Phase-29 regression script hard-asserted (STEPS=4 steps, nextStep(actor-class)=conduct, visibleStepCount=3/4). Five Phase-29 checks failed by design.
- **Fix:** Updated the five stale assertions to the post-Phase-30 reality (four choice ids keep their relative order; Individual `nextStep`=identity, visibleStepCount=8; Entity visibleStepCount=9). The branch-skip / encoding / INVALIDATE_SUBTYPE semantics are unchanged — only the literal order/count totals shifted.
- **Files modified:** scripts/wizard-choice-steps-check.js
- **Verification:** All Phase-29 choice-step checks pass again.
- **Committed in:** 5874f3e

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug). **Impact:** Necessary for runtime-loadability and to keep the prior regression gate green. No scope creep.

## Issues Encountered
None beyond the deviations above.

## Self-Check: PASSED

## Next Phase Readiness
- Plans 02/03/04 build components against these 12 exports; Plan 05 wires them. All consumers ready.

---
*Phase: 30-input-evidence-steps*
*Completed: 2026-06-14*
