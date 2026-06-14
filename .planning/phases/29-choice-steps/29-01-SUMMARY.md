---
phase: 29-choice-steps
plan: 01
subsystem: wizard-logic
tags: [registry, encoding, reducer, choice-steps, interim-encoding]
requires: [phase-28-wizard-shell]
provides:
  - "registry.STEPS = 4 real choice steps (actor-class, entity-subtype, conduct, role-in-act)"
  - "encoding.ts: CONDUCT_SLUGS (14) + ROLE_SLUGS (7) + ROLE_CLAUSE_TOKEN + encode/strip helpers"
  - "state.ts INVALIDATE_SUBTYPE orphan-only invalidation"
affects:
  - "Plan 29-03 (WizardClient wiring consumes registry + encoding)"
  - "Phase 30 (inserts input steps between these)"
  - "Phase 33 BE-01/BE-06 (slug→conductType, clause→roleInConduct)"
tech-stack:
  added: []
  patterns:
    - "Node --experimental-strip-types driver with off-thread module.register resolve hook for bundler-style extensionless .ts imports"
key-files:
  created:
    - src/lib/wizard/encoding.ts
    - scripts/wizard-choice-steps-check.js
  modified:
    - src/lib/wizard/registry.ts
    - src/lib/wizard/state.ts
    - scripts/wizard-reducer-check.js
decisions:
  - "ROLE_CLAUSE_TOKEN = ' — role in act: ' (leading space + em-dash, stable separator for Phase 33 BE-06)"
  - "INVALIDATE_SUBTYPE carries the new entityType and rewrites ONLY entityType; conduct/role preserved byte-identical (branch-independent)"
  - "Driver uses module.register off-thread resolve hook (not source-level .ts extensions) to keep bundler-style imports idiomatic"
metrics:
  duration: "~25 min"
  completed: 2026-06-14
  tasks: 3
  files: 5
requirements: [STEP-01, STEP-03]
---

# Phase 29 Plan 01: Real Choice-Step Registry + Interim Encoding Summary

Pure-logic foundation for the four real wizard choice steps: registry rework with the individual-branch skip, a framework-free interim-encoding module (14 conduct + 7 role slugs, stable role-clause token, round-trip encode/strip), and a narrowed orphan-only reducer invalidation — all gated by `tsc` + a standalone Node strip-types driver with zero new dependencies.

## What Was Built

- **`registry.ts`** — replaced the two Phase-28 scaffold steps with the four real `choice` steps in UI-SPEC §4 order: `actor-class` → `entity-subtype` → `conduct` → `role-in-act`. `entity-subtype` carries `branchWhen: (f) => f.entityType === "individual"` (hidden + uncounted on the Individual branch) plus a `requires` predicate gating on the four entity enum literals. `conduct`/`role-in-act` gate on `allegationClassification` non-empty / `entityRole` containing `ROLE_CLAUSE_TOKEN`. Added a runtime `import { ROLE_CLAUSE_TOKEN } from "./encoding"`. All navigation/reachability/visible-count helpers unchanged in signature.
- **`encoding.ts`** (new, runtime-pure) — `CONDUCT_SLUGS` (14, Other last) and `ROLE_SLUGS` (7, Other last) as `as const` tuples with derived `ConductSlug`/`RoleSlug` union types; `ROLE_CLAUSE_TOKEN = " — role in act: "`; `encodeRoleClause(base, slug)` (strips any prior clause first, so re-pick REPLACES — no stacking past max500); `stripRoleClause(value)` (deterministic inverse). Header documents that conduct `"other"` pairs with the Step-5 required-to-name-the-act flag (consumed in 29-03) and that `triageCategory` is NOT set here (Phase 33).
- **`state.ts`** — retargeted all scaffold seed ids to `actor-class` (initial currentStep/visited, RESET, RESTORE_DRAFT completed-seed). Renamed `INVALIDATE_DOWNSTREAM` → `INVALIDATE_SUBTYPE`, now carrying the new `entityType` and rewriting ONLY `entityType` (conduct + role preserved byte-identical, per CONTEXT Success Criterion 4 — minimal orphan invalidation).
- **`scripts/wizard-choice-steps-check.js`** (new) — standalone CommonJS driver (no test framework) that spawns `node --experimental-strip-types` against registry + encoding + state, with 49 assertions covering step order, individual-skip/uncount + nextStep targets, encode/strip round-trip + clause-replace for all 7 role slugs, slug tuple lengths/Other-last, and INVALIDATE_SUBTYPE orphan-only invalidation.
- **`scripts/wizard-reducer-check.js`** — updated the Phase-28 driver's three stale references (renamed action, retargeted step ids) so it stays green under the new contract.

## Verification Results

| Gate | Result |
|------|--------|
| `node_modules/.bin/tsc --noEmit` | PASS (exit 0) |
| `node scripts/wizard-choice-steps-check.js` | PASS (49/49 assertions) |
| `node scripts/wizard-reducer-check.js` (Phase-28) | PASS (still green) |
| `git diff --stat package.json` | no change (zero new deps) |
| S2-S4 grep-absence (encoding.ts + registry.ts) | clean |
| `src/lib/validation.ts` untouched | confirmed (no diff) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Driver could not resolve the bundler-style extensionless `./encoding` import**
- **Found during:** Task 3 (running the new driver)
- **Issue:** Node's raw ESM loader under `--experimental-strip-types` does not resolve extensionless `./encoding` (this repo uses `moduleResolution: "bundler"`). The Phase-28 drivers never hit this because they had no cross-module *runtime* imports (only `import type`, which is erased); registry→encoding is the first runtime inter-module import.
- **Fix:** The driver writes a tiny off-thread ESM `resolve` hook to a temp file and registers it via `node:module` `register()`, mapping extensionless relative specifiers to their `.ts` sibling. This keeps the **source** imports idiomatic/extensionless (no `.ts`/`.js` added, consistent with the rest of the codebase and the Next build) — the shim lives entirely in the test driver.
- **Files modified:** scripts/wizard-choice-steps-check.js (driver only)
- **Commit:** 848878f

**2. [Rule 3 - Blocking] Phase-28 `wizard-reducer-check.js` referenced the renamed action + scaffold ids**
- **Found during:** Task 3
- **Issue:** The existing Phase-28 driver asserted `INVALIDATE_DOWNSTREAM` and `GOTO_STEP step:"scaffold-input"` / RESET scaffold ids — all renamed/retargeted by this plan, so it would fail.
- **Fix:** Updated its three stale references to `INVALIDATE_SUBTYPE` (now asserting entityType-rewrite + conduct-preservation) and `conduct` as the GOTO target; behavior assertions otherwise unchanged.
- **Commit:** 848878f

## Self-Check: PASSED

- src/lib/wizard/encoding.ts — FOUND
- scripts/wizard-choice-steps-check.js — FOUND
- Commit 848878f — FOUND
