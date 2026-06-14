---
phase: 28-wizard-foundation
plan: 01
subsystem: validation
tags: [screens, regex, validation, persist, drizzle, next-intl, evidence-screens]

# Dependency graph
requires:
  - phase: v1.0 (Phase 9 — persist choke point)
    provides: validateSubmission server screen cascade in src/db/persist.ts
provides:
  - "src/lib/screens.ts — pure, server-import-free shared validation lib (runScreens + isCoarseLocationClean)"
  - "Single source of truth for the 8 rejection screens + S5 coarse-location blocker, importable from a use-client module"
  - "persist.ts refactored to re-import screens (no client/server drift)"
  - "scripts/screens-parity-check.js — standalone regression proving server-order parity"
affects: [29-choice-steps, 30-input-steps, 31-review-submit, wizard, inline-advisory-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure framework-free validation lib shared client+server (zero @/db, drizzle, ./audit, ./index imports)"
    - "Server screen cascade mirrored as an early-return runScreens() returning the first failing code"
    - "Standalone Node parity harness driving TS via --experimental-strip-types (no test framework dependency)"

key-files:
  created:
    - src/lib/screens.ts
    - scripts/screens-parity-check.js
  modified:
    - src/db/persist.ts

key-decisions:
  - "screens.ts is a VERBATIM lift of persist.ts regex arrays + screen* bodies (byte-identical), then persist.ts re-imports — one source, no drift"
  - "runScreens sourceCount mirrors sourceLinks.length ONLY (uploaded files do NOT count toward WEAK_SOURCE), matching route.ts:32 — documented in code"
  - "Parity harness uses --experimental-strip-types (Node 24) instead of installing a test framework (package installs are forbidden without a legitimacy checkpoint)"

patterns-established:
  - "Shared screens lib: client advisory hints + server authority run the identical regexes; client edits only lose the user's own hints"
  - "Bilingual fixtures must ASCII-flank Arabic terms because the persist.ts screens use ASCII \\b word boundaries (mirrored, not fixed — out of scope)"

requirements-completed: [EV-05]

# Metrics
duration: ~12min
completed: 2026-06-14
---

# Phase 28 Plan 01: Shared Validation Screens Library Summary

**Pure framework-free `src/lib/screens.ts` (verbatim lift of persist.ts's 8 rejection screens + S5 coarse-location blocker) with `runScreens` reproducing the exact server early-return cascade; persist.ts now re-imports it so client and server can't drift.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-14T~23:55Z (prior session day)
- **Completed:** 2026-06-14T00:07:52Z
- **Tasks:** 2 (Task 1 via TDD: RED → GREEN)
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- **`src/lib/screens.ts`** — pure, server-import-free shared lib. Verbatim (byte-identical) lift of `BANNED_PATTERNS`, `HATE_PATTERNS`, `INNOCENT_PROFESSIONS`, `ORG_TERMS`, `PRIVATE_DATA_PATTERNS`, the standalone incitement regex, `PersistResult`, `screenText`, `screenInnocentParty`, `screenPrivateTargeting`, `screenMismatch`. Adds `runScreens(input)` (server-order early-return cascade) and `isCoarseLocationClean(value)` (S5 street-address blocker).
- **`src/db/persist.ts`** — removed the now-duplicated constants/functions and re-imports the pure pieces from `@/lib/screens`; re-exports `PersistResult` so existing importers keep working. `validateSubmission` order, `validatePublication`, `withAudit`, `PersistContext` all preserved. Public behavior unchanged.
- **`scripts/screens-parity-check.js`** — standalone Node regression (no test framework) driving the TS lib via `--experimental-strip-types`. Asserts all 8 codes in server order + a clean pass + the `2 files / 0 links → WEAK_SOURCE` source-count contract + the S5 coarse-location blocker. Exit 0.

## Task Commits

Each task committed atomically (only this plan's files staged — no unrelated working-tree edits swept in):

1. **Task 1 (TDD RED): failing parity check** — `88bcffe` (test)
2. **Task 1 (TDD GREEN): extract pure screens into src/lib/screens.ts** — `75be711` (feat)
3. **Task 2: persist.ts re-imports from @/lib/screens + parity** — `bc01155` (refactor)

**Plan metadata:** committed separately with SUMMARY + STATE + ROADMAP.

_TDD gate sequence verified in git log: test → feat → refactor._

## Files Created/Modified

- `src/lib/screens.ts` (created, 248 LOC) — pure shared validation screens + `runScreens` + `isCoarseLocationClean`; zero server imports.
- `scripts/screens-parity-check.js` (created, 200 LOC) — standalone server-order parity regression harness.
- `src/db/persist.ts` (modified, 304 → 212 LOC) — deleted duplicated screens, re-imports from `@/lib/screens`, re-exports `PersistResult`, dropped unused `zod` import.

## Decisions Made

- **Verbatim lift, not rewrite.** Every regex array, the incitement regex, and `screenMismatch` body are byte-identical to persist.ts (diff-verified). This guarantees server behavior is unchanged.
- **`sourceCount` = links only.** `runScreens.sourceCount` mirrors the server's `route.ts:32` (`data.sourceLinks.length`); uploaded files do NOT count toward WEAK_SOURCE. Documented in a code comment in screens.ts and asserted by a parity fixture (`2 files + 0 links → WEAK_SOURCE`/`NO_SOURCE`), so Phase 30 doesn't drift into "passes client, server rejects".
- **No test framework installed.** The plan's parity script is the regression harness; it drives the TS source via Node 24's `--experimental-strip-types`. Installing vitest/jest was avoided (package installs are forbidden without a legitimacy checkpoint, and none was warranted).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PersistResult re-export needed a paired local import**
- **Found during:** Task 2 (persist.ts refactor)
- **Issue:** `export type { PersistResult } from "@/lib/screens"` alone does NOT bring the name into local scope, so `validateSubmission`/`validatePublication` return-type annotations failed with `TS2304: Cannot find name 'PersistResult'`.
- **Fix:** Added a paired `import type { PersistResult } from "@/lib/screens"` alongside the re-export line.
- **Files modified:** src/db/persist.ts
- **Verification:** `tsc --noEmit` → 0 errors.
- **Committed in:** `bc01155` (Task 2 commit)

**2. [Rule 1 - Test fixture correctness] Parity fixtures rewritten to fire on real server-regex `\b` semantics**
- **Found during:** Task 1 (GREEN)
- **Issue:** Initial fixtures used purely-Arabic trigger strings (e.g. `علوي`, `شارع الثورة`). The persist.ts screens use ASCII `\b` word boundaries, which do NOT fire around purely-Arabic alternations — so those inputs returned `ok:true` on BOTH the lift AND the real server. The test was asserting behavior the server does not have.
- **Fix:** Rewrote fixtures to ASCII-flank the Arabic terms (e.g. `x5علوي5`, `5شارع Thawra`) or use natively-ASCII alternatives (`doctor`, GPS coordinates) — the way bilingual submissions actually trip these. Added a `REGEX-BOUNDARY NOTE` documenting the `\b` semantics. The screens.ts implementation was NOT changed (it is a verbatim, faithful mirror of the server).
- **Files modified:** scripts/screens-parity-check.js
- **Verification:** Parity exit 0; lifted bodies diff byte-identical to persist.ts.
- **Committed in:** `75be711` (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 test-fixture correctness)
**Impact on plan:** Both essential for a correct, honest regression. No scope creep; no implementation behavior changed.

## Issues Encountered

- **INCITEMENT is subsumed by GROUP_TARGET (latent, pre-existing — mirrored not fixed).** The standalone incitement token set in persist.ts is a strict SUBSET of `BANNED_PATTERNS[2]` (the group-target screen, which runs first). On the real server, any string that would trip `INCITEMENT` (screen 4) trips `GROUP_TARGET` (screen 3) first — so the `INCITEMENT` code is effectively unreachable. The lift faithfully reproduces this. The parity check encodes it as an `INCITEMENT_SUBSUMED → GROUP_TARGET` fixture (proving the cascade order is preserved) rather than asserting an INCITEMENT result the server never returns. This is a pre-existing property of the v1.0 screens (out of scope to change here; changing it would alter `/api/submit` behavior). Flagged for the incitement/hate-tone classifier rework already tracked in STATE blockers.
- **`--experimental-strip-types` cannot directly execute persist.ts** (it imports `./index`/`./audit`/`drizzle` with path aliases that need a bundler). The parity harness therefore drives only the pure `screens.ts`; equivalence to the server is guaranteed structurally by the byte-identical lift (diff-verified) plus the preserved early-return order in `validateSubmission`.

## Known Stubs

None. `screens.ts` is fully wired (real regexes, real cascade); persist.ts consumes it live.

## Threat Flags

None. No new network endpoints, auth paths, file access, or schema changes. T-28-03 (no server imports in a client-reachable lib) is mitigated and grep-verified; T-28-02 (behavior unchanged) is proven by the parity script + verbatim diff.

## Self-Check: PASSED

- `src/lib/screens.ts` — FOUND
- `scripts/screens-parity-check.js` — FOUND
- `src/db/persist.ts` — FOUND (modified)
- Commit `88bcffe` (test/RED) — FOUND
- Commit `75be711` (feat/GREEN) — FOUND
- Commit `bc01155` (refactor) — FOUND
- `tsc --noEmit` — 0 errors
- `node scripts/screens-parity-check.js` — exit 0
- screens.ts server-import-free grep — no matches
- persist.ts imports `@/lib/screens` — match

## Next Phase Readiness

- **EV-05 keystone is ready.** Phases 29–31 can `import { runScreens, isCoarseLocationClean } from "@/lib/screens"` for inline advisory validation; the server remains the authoritative trust boundary.
- **Source-count contract is pinned** (`sourceLinks` only) — Phase 30 must wire the evidence step accordingly to avoid client/server divergence.
- No blockers introduced.

---
*Phase: 28-wizard-foundation*
*Completed: 2026-06-14*
