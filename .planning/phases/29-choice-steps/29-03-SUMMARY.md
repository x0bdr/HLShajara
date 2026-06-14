---
phase: 29-choice-steps
plan: 03
subsystem: wizard-ui
tags: [wizard, choice-steps, interim-encoding, back-navigation, branch-invalidation, aria-live]
requires: [29-01, 29-02]
provides:
  - "WizardClient renders the 4 real choice steps with interim-encoding dispatch"
  - "Back select+focus / no-re-advance / re-confirm-advances behavior"
  - "actor-class switch orphan-only invalidation + transient aria-live notice"
affects:
  - "Phase 30 (input steps slot into the same render dispatch; Step 5 reads allegationClassification==='other')"
  - "Phase 31 (review/submit consumes the encoded entityType/allegationClassification/entityRole)"
tech-stack:
  added: []
  patterns:
    - "Per-step option builders keyed on state.currentStep; non-enum entity sentinel kept in React state, never in SubmitInput"
key-files:
  created: []
  modified:
    - src/app/[locale]/submit/WizardClient.tsx
decisions:
  - "Entity sentinel (ENTITY_MARKER) lives in local React state only — entityType never receives a non-enum literal (T-29-06)"
  - "Auto-advance armed ONLY inside the confirm handler (completeAndAdvance); the ?step= sync effect calls goTo, never advance — no re-advance on mount"
  - "Orphan invalidation uses INVALIDATE_SUBTYPE (rewrites entityType only); conduct/role preserved; transient .legal aria-live=polite notice cleared on next nav/confirm"
metrics:
  duration: "~30 min"
  completed: 2026-06-14
  tasks: 3
  files: 1
requirements: [STEP-01, STEP-03]
---

# Phase 29 Plan 03: WizardClient Choice-Step Wiring Summary

Wired the root `WizardClient` to render all four real choice steps from the Plan 29-01 registry, feeding `ChoiceStep` per-step option lists resolved through the Plan 29-02 i18n keys and dispatching the correct interim encoding on confirm — plus the full Back-navigation and branch-switch-invalidation contract. `tsc`, `check:i18n`, and the full `next build` (both `/en|ar/submit` as SSG) all pass; `validation.ts` untouched; zero new deps.

## What Was Built (in `WizardClient.tsx`)

- **Per-step option builders** keyed on `state.currentStep`:
  - `actor-class` → `An individual` (value `individual`) + `An entity` (value `ENTITY_MARKER`), with hint descs.
  - `entity-subtype` → the four `type*` labels mapped to the exact enum literals `organization`/`military_unit`/`security_branch`/`official_body`.
  - `conduct` → `CONDUCT_SLUGS` mapped to `{value:slug, title:t("conduct_"+slug), desc:t("conduct_"+slug+"_def")}` in tuple order (Other last).
  - `role-in-act` → `ROLE_SLUGS` mapped to `{value:slug, title:t("role_"+slug)}`.
- **Interim-encoding confirm dispatch** (`onChoiceConfirm`, switched on `currentStep`):
  - actor-class individual → `SET_FIELD entityType="individual"`; entity → set local `entityChosen` marker, route to Step 1b, **never** write a non-enum to `entityType`.
  - entity-subtype → `SET_FIELD entityType=<enum>`.
  - conduct → `SET_FIELD allegationClassification=<slug>`.
  - role-in-act → `SET_FIELD entityRole = encodeRoleClause(stripRoleClause(current), slug)` (re-pick REPLACES, never stacks).
- **Per-step `value`** so the prior card renders selected+focused on Back (conduct → `allegationClassification`; role → the slug parsed from the `entityRole` clause; actor-class → individual/marker; entity-subtype → the committed enum).
- **Back-navigation contract:** auto-advance is armed ONLY inside the confirm handler (`completeAndAdvance`); the `?step=` sync effect calls `goTo` (never `advance`), so returning via Back never re-auto-advances. Re-confirming the same card still routes through the confirm handler → advances.
- **Branch-switch invalidation:** switching actor class to individual on Back (when the branch was entity) dispatches `INVALIDATE_SUBTYPE` (rewrites `entityType` to `individual`, preserves conduct/role byte-identical) and shows a transient `.legal` `role="status" aria-live="polite"` notice (`invalidateSubtypeNotice`), cleared on the next navigation/confirm.
- **Conduct "Other":** durably encoded as `allegationClassification="other"` with an inline comment documenting that Phase-30 Step 5 reads `allegationClassification === "other"` to mark the description required-to-name-the-act, and that `triageCategory` is NOT set here (Phase 33).
- Removed the now-unused `InputStep` import (all four Phase-29 steps are `choice`).

## Verification Results

| Gate | Result |
|------|--------|
| `node_modules/.bin/tsc --noEmit` | PASS (exit 0) |
| `node scripts/i18n-submit-parity-check.js` / `npm run check:i18n` | PASS |
| `npm run build` | PASS (exit 0, "Compiled successfully", 53/53 static pages; `/en/submit` + `/ar/submit` SSG) |
| encoding import present | PASS |
| `allegationClassification` (5) + `encodeRoleClause` (2) dispatch present | PASS |
| 4 entity enum literals mapped | PASS |
| no non-enum literal written to entityType | PASS (grep clean) |
| `aria-live="polite"` notice + `INVALIDATE_SUBTYPE` dispatch | PASS |
| S2-S4 grep-absence (word-boundary) across wizard surface | clean (only HTML `<section>` substring false positives) |
| `src/lib/validation.ts` untouched | confirmed |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Redundant always-true comparison flagged by tsc**
- **Found during:** Task 1 (first tsc run after the option-builder)
- **Issue:** The actor-class `choiceValue` ternary's else-branch re-tested `state.form.entityType !== "individual"`, which TS had already narrowed to always-true (TS2367 no-overlap).
- **Fix:** Simplified the ternary — in the not-individual branch the entity marker is always shown; folded `entityChosen` into the individual branch so the marker still shows before a subtype is committed without widening `entityType` past its enum.
- **Commit:** 7b4d75c

### Out-of-scope (logged, not fixed) — see `deferred-items.md`

- `react-hooks/set-state-in-effect` (draft-restore effect) and `no-unused-vars` (`submitting`) are PRE-EXISTING Phase-28 patterns, not introduced here. Neither blocks tsc/build. Logged to `.planning/phases/29-choice-steps/deferred-items.md`.

## Human-Check Required

The plan's `<human-check>` (browser QA on `/en/submit` + `/ar/submit`) covers timing-sensitive and RTL/screen-reader behavior that static gates cannot assert: the 200ms auto-advance feel, focus-on-selected-card on Back, the aria-live announcement, and RTL mirroring. Carried into `29-VERIFICATION.md` as `human_needed`.

## Self-Check: PASSED

- src/app/[locale]/submit/WizardClient.tsx — FOUND (modified)
- Commit 7b4d75c — FOUND
- npm run build — exit 0
