---
phase: 32-i18n-rtl-accessibility
plan: 02
subsystem: ui
tags: [rtl, css, logical-properties, arabic, intl-numberformat, node-script]

requires:
  - phase: 28-31 (wizard CSS + counters)
    provides: the WIZARD/STEPPER hlshajara.css block and the WizardProgress/WizardPanel Intl counters
provides:
  - "[dir=rtl] .ds-mono LTR rule for machine strings in tokens.css"
  - "scripts/wizard-rtl-check.js grep-gate (physical-prop absence + ds-mono/review-sources LTR + Intl counter discipline)"
affects: [32-03]

tech-stack:
  added: []
  patterns:
    - "Rule-by-rule CSS walker that flags physical props only on wizard-scoped selectors outside [dir=rtl] overrides"

key-files:
  created:
    - scripts/wizard-rtl-check.js
  modified:
    - src/styles/tokens.css

key-decisions:
  - "hlshajara.css wizard block was already logical-prop-clean (28-31 followed the discipline); only the ds-mono LTR rule was missing"
  - "DescribeStep/EvidenceStep counters pass raw numbers to bare ICU {count} (latn under ar) — recorded for 32-03's component pass per the plan's file-overlap note"

patterns-established:
  - "Machine strings (.ds-mono / .review-sources) forced direction:ltr;text-align:right under [dir=rtl]"

requirements-completed: [INTL-02]

duration: 20min
completed: 2026-06-14
---

# Phase 32 Plan 02: RTL hardening Summary

**Confirmed the wizard CSS is logical-prop-clean, added the missing `[dir=rtl] .ds-mono` LTR rule for machine strings, and locked RTL correctness with a grep-gate that also enforces Intl.NumberFormat(arab) on every counter.**

## Performance

- **Duration:** ~20 min (shared across all 3 plans)
- **Started:** 2026-06-14T07:57:38Z
- **Completed:** 2026-06-14T08:18:37Z
- **Tasks:** 2 auto tasks
- **Files modified:** 2

## Accomplishments

- **Audit of the WIZARD/STEPPER block (hlshajara.css ~1365-1620)** found it already correct: `margin-inline`/`padding-block` logical props throughout, `.wizard-nav .back::before { margin-inline-end }` chevron, `[dir=rtl]` translateX sign-flip on `.entering-fwd`/`.entering-back`, `[dir=rtl]` resets on `.wizard-eyebrow` + `.wizard-step-pill` (no Arabic uppercase/letter-spacing), and the `[dir=rtl] .review-sources { direction:ltr }` machine-string rule. **No edits needed to hlshajara.css.**
- **tokens.css** — added `[dir=rtl] .ds-mono { direction:ltr; text-align:right }` so reference ids / URLs / hashes stay LTR inside RTL (UI-SPEC §10), modeled on the existing `[dir=rtl] .card .id` and `.review-sources` precedents.
- **scripts/wizard-rtl-check.js** — walks hlshajara.css rule-by-rule, flagging physical box props (`margin/padding/border-left|right`, bare `left:`/`right:`, `text-align:left|right`) on `.wizard-`/`.choice-`/`.review-` selectors outside sanctioned `[dir=rtl]`/`direction:ltr` rules; asserts the ds-mono + review-sources LTR rules; and asserts every wizard component constructing `Intl.NumberFormat` includes the `numberingSystem` branch (with a raw `{stepIndex}/{stepTotal}` JSX-interpolation guard). Negative-tested: a reintroduced `.wizard-count { margin-left }` makes it exit 1.

## Verification Results

- `node scripts/wizard-rtl-check.js` → exit 0 (all five checks pass; 4 Intl-using components after 32-03 added DescribeStep/EvidenceStep formatters).
- `grep -nE "(margin|padding|border)-(left|right)"` over wizard selectors → no non-`[dir=rtl]` matches.
- tokens.css contains `[dir=rtl] .ds-mono { direction:ltr; text-align:right }`.
- `npm run build` → exit 0.
- **Staging note:** the final EN/AR visual RTL sign-off (mirrored pills/chevrons, Arabic-Indic counters rendered live) is a manual browser pass on event.staging.sanadais.com — recorded as `human_needed` in 32-VERIFICATION.md.

## Deviations from Plan

**1. [Rule 1 - Bug] Counter digit defect found, fix routed to 32-03**
- **Found during:** Task 1 counter audit.
- **Issue:** `DescribeStep` (`descCounter`) and `EvidenceStep` (`sourceCounter`) pass raw JS numbers into bare ICU `{count}`/`{files}` placeholders. Verified `Intl.NumberFormat("ar")` defaults to `latn` (Western digits), so AR would render `2 حرفًا` not `٢ حرفًا`.
- **Fix:** Per the plan's explicit instruction (avoid editing components in 32-02 to prevent file overlap), this was recorded here and FIXED in Plan 32-03 (which owns the component pass): both steps now pre-format via `Intl.NumberFormat(locale, arab)`.
- **Commit:** noted in 89e1619; fix landed in 2dc746c.

**2. [No-op] hlshajara.css listed in files_modified but needed no change** — the wizard CSS was already logical-prop-correct, so only tokens.css + the new gate were committed. Not a defect; documented for traceability.

## Known Stubs

None.

## Self-Check: PASSED

- scripts/wizard-rtl-check.js — FOUND
- tokens.css `[dir=rtl] .ds-mono` — FOUND
- commit 89e1619 — FOUND
