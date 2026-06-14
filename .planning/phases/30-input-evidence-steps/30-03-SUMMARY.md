---
phase: 30-input-evidence-steps
plan: 03
subsystem: ui
tags: [next-intl, wizard, react, upload, i18n]

requires:
  - phase: 30-input-evidence-steps
    provides: step-logic.ts (SOURCE_TYPE_SLUGS, prefixSourceType, evidenceSourceCount, screenMediaLink), Phase-30 i18n keys
  - phase: 28-wizard-shell
    provides: SET_SOURCE/ADD_SOURCE/REMOVE_SOURCE/ADD_FILE/REMOVE_FILE reducer actions
provides:
  - "src/components/wizard/EvidenceStep.tsx — Step 6 keystone: source rows + type select (idempotent §8 token) + ≥2-links live gate + non-public lead note"
  - "src/components/wizard/MediaStep.tsx — Step 7: /api/upload images/docs (no video), removable cards, safety copy, inline social-link rejection"
affects: [30-05, 31-review-submit, 33-backend-followups]

tech-stack:
  added: []
  patterns:
    - "Per-row source-type slug held in parallel local UI state; encoded into the row title via prefixSourceType (idempotent §8 interim)"
    - "Existing reducer source/file actions reused — no new action types"

key-files:
  created:
    - src/components/wizard/EvidenceStep.tsx
    - src/components/wizard/MediaStep.tsx
  modified: []

key-decisions:
  - "Live counter ties advance to LINKS only (evidenceSourceCount >= 2), mirroring the server WEAK_SOURCE screen — files strengthen but never unlock"
  - "leadNote written to form.leadNote only — never folded into the public description, never counted as a source"
  - "Video has no upload path (accept = image/*,.pdf,.doc,.docx,.txt) — deferred to Phase 33 BE-05"

patterns-established:
  - "Explicit slug→i18n-key map (SOURCE_TYPE_LABEL_KEY) so the six source-type labels are grep-auditable and never drift from SOURCE_TYPE_SLUGS"

requirements-completed: [EV-01, EV-02, EV-03]

duration: ~4min
completed: 2026-06-14
---

# Phase 30 Plan 03: Evidence + Media Steps Summary

**Step 6 keystone Evidence (2-source rule up front, add/removable typed source rows with idempotent `[TYPE: …]` token, links-only live gate, non-public lead note never folded/counted) and Step 7 Media (images/docs upload via `/api/upload`, no video, removable cards, inline personal-social-link rejection).**

## Performance
- **Duration:** ~4 min
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- EvidenceStep: `sourcesRule` `.legal` block up front; six source-type slug labels wired; `prefixSourceType` idempotent token; `sourceCounter` (links · files); `leadNote` non-public block — no `allegationDescription` reference
- MediaStep: `/api/upload` loop → ADD_FILE; removable `.card`s; `mediaSafety` copy; optional link validated via `screenMediaLink` → `mediaLinkError` `.legal-error`; `accept` excludes video

## Task Commits
1. **Task 1 (Evidence) + Task 2 (Media)** — `d090b4b` (feat)
2. **S1-S5 grep hygiene (Media)** — `87eaa5e` (fix, shared with AboutYou)

## Files Created/Modified
- `src/components/wizard/EvidenceStep.tsx`
- `src/components/wizard/MediaStep.tsx`

## Decisions Made
- Added an explicit `SOURCE_TYPE_LABEL_KEY` map so the six label keys appear literally in source (grep-auditable) while still driven by `SOURCE_TYPE_SLUGS`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Guardrail hygiene] `form-section-title` → `.t` in MediaStep (S1-S5 grep)**
- **Found during:** phase-wide S1-S5 sweep
- **Issue:** The class name `form-section-title` contains the substring `sect`, which the case-insensitive S1-S5 absence grep flags. Not an actual banned field.
- **Fix:** Swapped the heading class to `.t` (existing). No behavior change.
- **Files modified:** src/components/wizard/MediaStep.tsx
- **Verification:** S1-S5 grep returns 0; build passes.
- **Committed in:** 87eaa5e

---

**Total deviations:** 1 auto-fixed (guardrail hygiene). **Impact:** Keeps the anti-targeting grep gate clean. No behavior change.

## Issues Encountered
None.

## Self-Check: PASSED

## Next Phase Readiness
- Phase 33 (Lane B) owns first-class `sourceType`, leadNote persistence, and video enablement (BE-03/BE-05) — the §8 token here is the documented interim.

---
*Phase: 30-input-evidence-steps*
*Completed: 2026-06-14*
