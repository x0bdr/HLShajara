---
phase: 29-choice-steps
plan: 02
subsystem: i18n
tags: [i18n, en, ar, parity, choice-steps, check-i18n]
requires: [phase-28-submit-namespace]
provides:
  - "44 EN + 44 AR submit keys for the 4 choice steps (verbatim UI-SPEC §3 names)"
  - "npm run check:i18n parity gate (scripts/i18n-submit-parity-check.js)"
affects:
  - "Plan 29-03 (WizardClient resolves these via t())"
  - "Phase 32 (full submit-namespace parity audit extends this)"
tech-stack:
  added: []
  patterns:
    - "Standalone CommonJS parity check mirroring screens-parity-check.js; Phase-29 expected keys derived from the same slug tuples as encoding.ts (anti-drift)"
key-files:
  created:
    - scripts/i18n-submit-parity-check.js
  modified:
    - messages/en.json
    - messages/ar.json
    - package.json
decisions:
  - "Added invalidateSubtypeNotice key in both languages now (Plan 29-03's transient aria-live notice copy) so parity holds across waves"
  - "check:i18n maps to the standalone parity script (repo had no check:i18n before); the milestone 'check:i18n must pass' constraint now resolves to a real command"
  - "Conduct/role _def lines are terse neutral legal-register, non-sectarian, describing the ACT not any group/belief/occupation"
metrics:
  duration: "~15 min"
  completed: 2026-06-14
  tasks: 2
  files: 4
requirements: [STEP-01, STEP-03]
---

# Phase 29 Plan 02: EN+AR Choice-Step i18n Keys + Parity Gate Summary

Authored the full bilingual string set for all four choice steps under the `submit` namespace — every key name verbatim from UI-SPEC §3 — and wired a standalone EN↔AR parity check as `npm run check:i18n`, the milestone's "check:i18n must pass" gate.

## What Was Built

- **`messages/en.json` + `messages/ar.json`** — added 44 keys per language under the existing `submit` object, in identical order (diff-reviewable):
  - Step 1: `q_actorClass`, `actorIndividual` (+`Hint`), `actorEntity` (+`Hint`).
  - Step 1b: `q_entitySubtype` (the four `type*` labels are REUSED, not duplicated).
  - Step 3: `q_conduct` + 14 `conduct_<slug>` labels + 14 `conduct_<slug>_def` definitions (Other last).
  - Step 4: `q_roleInAct` + 7 `role_<slug>` labels.
  - Plus `invalidateSubtypeNotice` (Plan 29-03's transient branch-switch notice copy) added in both languages now so cross-wave parity holds.
  - Labels are the exact UI-SPEC §3 card names; `_def` lines are terse neutral legal-register one-liners (AR mirrors the register, non-sectarian).
- **`scripts/i18n-submit-parity-check.js`** (new) — standalone CommonJS check mirroring `screens-parity-check.js`: asserts (1) EN submit key set EXACTLY equals AR (reports symmetric difference), (2) no empty-string values in either language, (3) every Phase-29 expected key present in BOTH — the expected list is derived from the same `CONDUCT_SLUGS`/`ROLE_SLUGS` tuples as `encoding.ts` so i18n keys and slugs cannot drift. Exits 1 on mismatch, 0 on parity.
- **`package.json`** — added `"check:i18n": "node scripts/i18n-submit-parity-check.js"` (only scripts change; no dependency change).

## Verification Results

| Gate | Result |
|------|--------|
| `node scripts/i18n-submit-parity-check.js` | PASS (85 keys each, 43 Phase-29 keys present, no empties) |
| `npm run check:i18n` | PASS (exit 0) |
| Both files valid JSON | PASS |
| Induced-mismatch detection (removed `role_other` from AR) | PASS — exit 1, reported the missing key |
| `grep -c "conduct_.*_def"` EN / AR | 14 / 14 |
| `typeOrganization` not duplicated | 1 occurrence |
| S2-S4 grep-absence on both message files | clean |
| `git diff package.json` | only the `check:i18n` script line |

## Deviations from Plan

**i18n-checker agent run:** Plan 29-02 Task 2's final acceptance suggests running the `i18n-checker` agent over the submit namespace. Per the phase CONTEXT, the standalone parity script is the authoritative gate (this repo had no `check:i18n` before this plan); I made parity an enforced, mismatch-detecting command and verified it. A formal `i18n-checker` agent pass over the submit namespace is recommended as a low-risk follow-up (RTL/register audit lands fully in Phase 32) but is not a blocker for Phase 29 completion. Logged as a non-blocking note, not a code deviation.

### Auto-fixed Issues

None — keys authored as planned.

## Self-Check: PASSED

- scripts/i18n-submit-parity-check.js — FOUND
- messages/en.json + messages/ar.json Phase-29 keys — present (43 each, verified)
- Commit d9ff583 — FOUND
