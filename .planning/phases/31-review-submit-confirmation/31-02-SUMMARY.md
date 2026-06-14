---
phase: 31-review-submit-confirmation
plan: 02
subsystem: wizard-review-ui
tags: [review-screen, presentational, affirmation-gate, source-token-strip]
requires: [31-01]
provides: [review-step-component, review-display-helpers]
affects: [31-03]
tech-stack:
  added: []
  patterns: [stateless-leaf-props-in-callbacks-out, jsx-free-helper-sibling, display-only-token-strip]
key-files:
  created:
    - src/components/wizard/ReviewStep.tsx
    - src/components/wizard/review-helpers.ts
  modified: []
decisions:
  - "Pure helpers (stripSourceType/displayValue) extracted to a JSX-free sibling so they stay type-strip testable; ReviewStep re-exports both names."
  - "Six review groups rendered explicitly (one .review-group block each) in flow order; one Edit link per group to the real first-of-group registry slug."
metrics:
  duration: ~10m
  completed: 2026-06-14
---

# Phase 31 Plan 02: Step-9 ReviewStep Summary

A stateless six-group read-only review summary (REV-01/REV-02) — empties as "—", display-only source-type token stripping, a non-public lead-note sub-block, the affirmation checkbox, and two independent inline disabled-reason gates. Props-in, callbacks-out; mounts in Plan 31-03.

## What was built

- **`src/components/wizard/ReviewStep.tsx`** (new, 291 lines): `"use client"` stateless component. Six `.review-group` blocks in flow order (Actor / Conduct / Description / Evidence / Media / You), each with a `.ds-eyebrow` label and ONE `.btn ghost btn-sm` Edit link calling `onEdit(<real slug>)` — `actor-class` / `conduct` / `describe` / `evidence` / `media` / `about-you` (never the friendly `actor`/`you`). Optionals pass through `displayValue` (em-dash "—"). Evidence group renders the source list in `.review-sources` (url in `.ds-mono`, "Type: …" line when a `[TYPE:<slug>]` token is present) with a `.filter-badge` count, then the lead note in a distinct `reviewLeadNoteLabel` ("Reviewer note (not published)") sub-block. The `.review-affirm` block owns the affirmation checkbox + Submit (`disabled = submitting || !affirmed || sourceLinks.length < 2`) and two INDEPENDENT inline `.legal-error` gates (one per unmet condition).
- **`src/components/wizard/review-helpers.ts`** (new): JSX-free `stripSourceType` + `displayValue`, re-exported from ReviewStep.

## Verification

- Helper type-strip driver (against the sibling): all behavior fixtures pass (token strip, no-token, token-only, empty, em-dash sentinel, passthrough). PASS.
- grep gates: 6 `.review-group`, 6 reviewGroup* eyebrows, 6 real edit slugs, 0 friendly actor/you targets, `stripSourceType` used + no `.title=` reassignment, lead-note sub-block, 3-gate submit disable, two `.legal-error` blocks, `displayValue` used, no raw-HTML/inline-color/physical-direction. PASS.
- `npx tsc --noEmit` clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pure helpers extracted to a JSX-free sibling (Task 1)**
- **Found during:** Task 1
- **Issue:** Task 1's `<verify>` drives `stripSourceType`/`displayValue` via `node --experimental-strip-types`, but a `.tsx` cannot be loaded that way (`ERR_UNKNOWN_FILE_EXTENSION` — JSX is not strippable). The plan's Task-1 `<action>` explicitly authorized moving the helpers to a "sibling pure import … but they MUST remain in this file's exports."
- **Fix:** Created `src/components/wizard/review-helpers.ts` (JSX-free) as the canonical definition; `ReviewStep.tsx` imports + re-exports both names, so the component's public surface is unchanged and the helpers are unit-testable under type-strip.
- **Trade-off:** The literal Task-1 greps (`export function stripSourceType` and the slug regex *inside ReviewStep.tsx*) no longer match, because the canonical definitions live in the sibling. The functional `<verify>` driver (the real correctness gate) passes against the sibling, and the names are exported from ReviewStep.tsx via re-export.
- **Files modified:** src/components/wizard/ReviewStep.tsx, src/components/wizard/review-helpers.ts
- **Commit:** 1eaf9d9

**2. [Rule 3 - Blocking] Reworded header comment to pass the no-raw-HTML absence grep**
- **Found during:** Task 2
- **Issue:** `grep -vqE 'dangerouslySetInnerHTML'` flagged the documentation comment that described the component as having no `dangerouslySetInnerHTML`.
- **Fix:** Reworded to "never raw-HTML-injected"; no such JSX exists.
- **Files modified:** src/components/wizard/ReviewStep.tsx
- **Commit:** 1eaf9d9

## Known Stubs
None. The component renders live `form` values; no hardcoded/empty data sources. (Lead-note is display-only by design — server persistence is Phase 33.)

## Self-Check: PASSED
- src/components/wizard/ReviewStep.tsx — FOUND
- src/components/wizard/review-helpers.ts — FOUND
- Commit 1eaf9d9 — FOUND
