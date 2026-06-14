---
phase: 33-backend-support
plan: 02
subsystem: api
tags: [zod, intake, triage, leadnote, sourcetype, privacy-boundary]
requires: ["33-01"]
provides:
  - "submitSchema accepts conductType/roleInConduct/sourceType/leadNote (closed sets via shared const)"
  - "/api/submit persists the 4 fields + auto-populates triageCategory"
  - "leadNote-never-public privacy invariant (grep-gated)"
affects:
  - "src/lib/validation.ts"
  - "src/app/api/submit/route.ts"
  - "src/db/persist.ts"
tech-stack:
  added: []
  patterns:
    - "z.enum bound to the shared closed const (no inline slug arrays)"
    - "Deterministic triage auto-population at the trust boundary; reviewer override preserved"
key-files:
  created: []
  modified:
    - "src/lib/validation.ts"
    - "src/app/api/submit/route.ts"
    - "src/db/persist.ts"
decisions:
  - "Kept the pre-existing leadNote max(5000) (fork-point prereq) rather than re-adding at max(10000) — no drift"
  - "leadNote privacy grep gate uses the REAL public paths: api/entity (singular), posts, dashboard, reply, key-decisions, [locale]/publications, [locale]/record, lib/labels.ts"
metrics:
  completed: 2026-06-14
requirements: [BE-01, BE-02, BE-03, BE-06]
---

# Phase 33 Plan 02: Intake Wiring + LeadNote Boundary Summary

One-liner: `/api/submit` now persists `conductType`/`roleInConduct`/`leadNote` and auto-derives `triageCategory` from conductType via the shared map, with `leadNote` provably never public, never a source, never folded into the description.

## What was built

- **`src/lib/validation.ts`** — imports `conductTypes`/`roleInConductTypes`; `submitSchema` gains optional `conductType` (14-set), `roleInConduct` (7-set), and per-source `sourceType` (`un|court|sanctions|hr|journalism|official`) on the `sourceLinks` item. `leadNote` was already accepted (fork-point prerequisite) — comment updated to note Phase 33 persists it. All additive/optional; `SubmitInput` stays assignable to `WizardState.form`.
- **`src/app/api/submit/route.ts`** — imports `triageFromConduct`; the insert `.values({})` adds `conductType`, `roleInConduct`, `leadNote` and `triageCategory: data.conductType ? triageFromConduct(data.conductType) : null`. `sourceLinks` rides through unchanged (per-source `sourceType` in the JSONB). `sourceCount` unchanged (`data.sourceLinks.length`).
- **`src/db/persist.ts`** — documenting comment at the `sourceCount` site stating leadNote is never counted as a source and never folded into `allegationDescription`. No logic change.

## Verification results

- `npx tsc --noEmit` — 0 errors (validation.ts, route.ts, persist.ts, and the wizard state/registry).
- `npx next build` — succeeds.
- Acceptance greps — all pass:
  - shared-const import = 1; `conductType`/`roleInConduct` z.enum both `.optional()`; `sourceType` exact closed set `.optional()`.
  - route: `triageFromConduct` present, 3 field persists, `triageCategory` derives from `data.conductType`, `sourceCount` = `data.sourceLinks.length`.
  - **leadNote-never-public** (corrected real paths): 0 matches across `api/entity`, `api/posts`, `api/dashboard`, `api/reply`, `api/key-decisions`, `[locale]/publications`, `[locale]/record`, `lib/labels.ts`. Broad scan confirms leadNote appears ONLY in `submit/route.ts` + `validation.ts`.
  - leadNote-never-folded = 0; reviewer override path (`/api/review` triageCategory) untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan-noted correction] leadNote-public grep gate path fix**
- **Issue:** The plan's AC referenced `src/app/api/entities` (plural), which does not exist — the real directory is `src/app/api/entity` (singular). A grep against a non-existent path would falsely pass (0 matches for the wrong reason).
- **Fix:** Ran the privacy gate against the correct public read surface (`api/entity`, plus `posts`, `dashboard`, `reply`, `key-decisions`, `[locale]/publications`, `[locale]/record`, `lib/labels.ts`), all confirmed to exist, so the assertion is meaningful. Result: 0 matches.
- **Files:** verification only (no code change).

**2. [Minor] leadNote length kept at max(5000)**
- **Issue:** Plan said add `leadNote: z.string().max(10000).optional()`, but leadNote already existed (fork-point prereq) at `max(5000)`.
- **Fix:** Per the lane instructions ("verify it's there, do NOT re-add it"), kept the existing `max(5000)` line and only updated its comment — avoids introducing two leadNote declarations / drift. AC `grep -c 'leadNote: z.string()' === 1` satisfied.

## Self-Check: PASSED
- `src/lib/validation.ts`, `src/app/api/submit/route.ts`, `src/db/persist.ts` — FOUND (modified)
- Commits e046aea, 8638672 — FOUND
