---
phase: 32-i18n-rtl-accessibility
plan: 01
subsystem: i18n
tags: [next-intl, i18n, parity, arabic, check-gate, node-script]

requires:
  - phase: 28-31 (report-form wizard)
    provides: the submit.* message keys each wizard phase shipped
provides:
  - generic full-tree EN/AR i18n parity checker (scripts/i18n-parity-check.js)
  - check:i18n npm gate rewired to the generic checker
  - the 5 missing UI-SPEC §3 intro keys added at full EN/AR parity
affects: [32-03, 33 (re-run check:i18n after backend error-copy merges)]

tech-stack:
  added: []
  patterns:
    - "Generic recursive flatten + dot-path key-diff for any-namespace i18n parity"
    - "Pre-formatted numbers passed into bare ICU placeholders (no {x, number})"

key-files:
  created:
    - scripts/i18n-parity-check.js
  modified:
    - package.json
    - messages/en.json
    - messages/ar.json

key-decisions:
  - "Rewired check:i18n to a generic full-tree checker; kept the submit-only slug-lock checker as check:i18n:submit (not lost)"
  - "intro keys (introTitle, introRule1-3, introGate) were genuinely missing; added verbatim §10 phrasings + authored introGate copy"

patterns-established:
  - "i18n parity gate scans ALL namespaces (311→316 keys), not just submit, via recursive flatten"

requirements-completed: [INTL-01]

duration: 20min
completed: 2026-06-14
---

# Phase 32 Plan 01: Full EN/AR submit parity + check:i18n gate Summary

**Reconciled the submit namespace to full EN/AR parity (161 keys, zero machine tokens) and replaced the submit-only check:i18n with a generic full-tree (316-key) parity + ICU-placeholder + empty-value gate.**

## Performance

- **Duration:** ~20 min (shared across all 3 plans)
- **Started:** 2026-06-14T07:57:38Z
- **Completed:** 2026-06-14T08:18:37Z
- **Tasks:** 2 auto tasks (Task 1 checker, Task 2 reconcile) + 1 human-verify checkpoint deferred
- **Files modified:** 4

## Accomplishments

- **scripts/i18n-parity-check.js** — `"use strict"` CommonJS, `node:path` + the two message JSONs only. Recursively flattens both locales to dot-path key sets and reports: EN-only / AR-only keys, per-key ICU placeholder mismatches, empty/whitespace values (all FAIL → exit 1), plus an advisory stub-warning for byte-identical submit AR=EN values (WARN, non-fatal). Exits 0 against the current 316-key tree.
- **check:i18n rewired** to the generic checker; the prior submit-only slug-lock checker is preserved as `check:i18n:submit`.
- **5 intro keys added** at full parity to both locales (verbatim UI-SPEC §10 for `introTitle`/`introRule1-3`; authored terse legal-register `introGate`). Submit namespace is now 161 keys, sorted-identical across locales.

## Verification Results

- `npm run check:i18n` → exit 0 (316-key full-tree parity, placeholder parity, no empty values).
- submit namespace: 161 keys, EN/AR sorted-equal, ≥70 target far exceeded.
- machine-token-as-value scan: 0 hits for `/\[(TYPE|CONDUCT|ROLE|SOURCE)\s*:|—\s*role in act:/`.
- conduct_*_def pairs: 14 EN / 14 AR (parity, ≥14).
- reused entity-type keys (typeOrganization/MilitaryUnit/SecurityBranch/OfficialBody): exactly one occurrence each (no duplication).
- `next build` → exit 0 (no missing-message error).

## Deviations from Plan

### Auto-fixed / interpreted

**1. [Rule 3 - Blocking] check:i18n already pointed at a different script**
- **Found during:** Task 1 (load state).
- **Issue:** `check:i18n` already existed wired to `scripts/i18n-submit-parity-check.js`; the plan wants a new `scripts/i18n-parity-check.js` wired as `check:i18n`.
- **Fix:** Created the new generic checker, repointed `check:i18n` to it, and added `check:i18n:submit` to retain the older slug-lock check (it ties i18n keys to encoding slugs — still valuable). No script lost.
- **Files:** package.json, scripts/i18n-parity-check.js
- **Commit:** 7d69e4a

**2. [Spec interpretation] intro keys vs lead/begin**
- The wizard intro screen ships as `lead` + `begin` (no separate intro step in the registry), but UI-SPEC §3/§10 enumerate `introTitle`/`introRule1-3`/`introGate` as §3 keys. They were absent in both locales; added per the plan's "fill the §3 union" instruction. Wiring those keys into a rendered intro screen is out of this plan's file scope (messages/package/script only) and is not required for parity — recorded as a forward note, not a defect.

## Known Stubs

None. All added keys carry genuine EN + AR copy.

## Self-Check: PASSED

- scripts/i18n-parity-check.js — FOUND
- check:i18n → i18n-parity-check — FOUND
- commit 7d69e4a — FOUND
- i18n-checker agent independent audit — DEFERRED to human/orchestrator (see 32-VERIFICATION.md `human_needed`).
