---
phase: 31-review-submit-confirmation
plan: 01
subsystem: wizard-foundations
tags: [rejection-routing, registry, i18n, review-step]
requires: [29-01, 30-01]
provides: [rejection-map, terminal-review-step, review-submit-i18n-keys]
affects: [31-02, 31-03]
tech-stack:
  added: []
  patterns: [closed-record-lookup, type-only-stepid-import, terminal-input-step]
key-files:
  created:
    - src/lib/wizard/rejection-map.ts
  modified:
    - src/lib/wizard/registry.ts
    - messages/en.json
    - messages/ar.json
decisions:
  - "rejection-map keyed by a closed RejectionCode union; resolveRejection returns null for unknown codes (T-31-01)."
  - "review step archetype=input (terminal, no auto-advance), no requires/branchWhen/completionGate."
metrics:
  duration: ~12m
  completed: 2026-06-14
---

# Phase 31 Plan 01: Rejection Map + Terminal Review Step + Review i18n Summary

Closed rejection-routing lookup (`resolveRejection`), a terminal `review` step appended to the wizard registry, and the full EN+AR `submit`-namespace review/submit/confirmation key set — the three pure foundations Plans 31-02/31-03 consume.

## What was built

- **`src/lib/wizard/rejection-map.ts`** (new): pure, framework-free module exporting `RejectionCode` (8-code union), `RejectionRoute` (`{messageKey, stepId}` with a type-only `StepId` import), `REJECTION_MAP` (closed `Record` per LOCKED UI-SPEC §3), and `resolveRejection(code)` returning `null` for unknown codes. Drives clean under `node --experimental-strip-types`.
- **`src/lib/wizard/registry.ts`**: appended a terminal `{ id: "review", archetype: "input", titleKey: "reviewStepTitle" }` StepDef after `about-you`. `StepId` now includes `"review"`; nav/reachability helpers untouched (they iterate `STEPS` generically). All 9 prior Phase-29/30 ids preserved and unreordered.
- **`messages/en.json` + `messages/ar.json`**: 26 new flat camelCase keys under `submit` (reviewStepTitle/reviewTitle/reviewEdit, six reviewGroup* eyebrows, reviewEmpty/reviewSourceTypeLabel/reviewLeadNoteLabel/reviewSourcesShort, affirm, errSourcesGate/errAffirmGate, successTitle/successBody/referenceIdLabel, submitAnother, and the five err_* rejection messages). Full EN/AR parity (156 keys each); natural Arabic copy.

## Verification

- rejection-map type-strip driver: all 8 codes route correctly; WEAK_SOURCE→evidence, MISMATCH→identity, unknown→null. PASS.
- EN/AR submit parity (156 keys, no empties, Phase-28 keys preserved). PASS.
- `scripts/i18n-submit-parity-check.js` (the wired `npm run check:i18n`) passes + negative-test (injected stray key) flags. PASS.
- `npx tsc --noEmit` clean with the widened StepId union.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded module header prose to pass the server-free grep gate**
- **Found during:** Task 1
- **Issue:** The Task-1 acceptance grep `grep -vqE '@/db|drizzle|"use client"|next/server'` flagged because the documentation comment described what the module does NOT import using those literal tokens.
- **Fix:** Reworded the header comment to "no database / server-runtime imports" — no actual server import existed; the module is genuinely pure.
- **Files modified:** src/lib/wizard/rejection-map.ts
- **Commit:** 7acb912

**2. [Rule 3 - Pre-existing] scripts/i18n-submit-parity-check.js already present (Task 3)**
- **Found during:** Task 3
- **Issue:** The parity-gate script already exists in the repo (wired as `npm run check:i18n` from an earlier phase). It diffs the EN/AR `submit` key sets, exits 1 on mismatch, asserts no empty values — fully satisfying Task 3's contract.
- **Fix:** Did NOT recreate it. It uses `path.join(__dirname, "..", "messages", "en.json")` rather than the literal `require("../messages/en.json")` the acceptance grep expected — functionally equivalent and dependency-free. Verified it passes the positive run AND the plan's negative test (injected stray key flagged).
- **Files modified:** none (left as-is)
- **Commit:** n/a

### Note: Task-4 terminal-step type-strip
The Task-4 acceptance included a `--experimental-strip-types` driver to assert `review` is terminal. `registry.ts` uses extensionless sibling imports (`./encoding`, `./step-logic`), which Node's ESM resolver rejects, so that driver cannot run. Terminality is instead proven by the plan's own `<verify>` (`node -e` source-order check) + tsc (StepId union widened). Both pass.

## Self-Check: PASSED
- src/lib/wizard/rejection-map.ts — FOUND
- registry `review` step — FOUND (terminal, after about-you)
- 26 submit keys EN+AR — FOUND (156-key parity)
- Commit 7acb912 — FOUND
