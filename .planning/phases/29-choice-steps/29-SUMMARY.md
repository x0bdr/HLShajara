---
phase: 29-choice-steps
subsystem: report-wizard
tags: [wizard, choice-steps, interim-encoding, i18n, branch-skip, accessibility]
status: complete
requires: [phase-28-wizard-foundation]
provides:
  - "Four real choice steps (actor-class, entity-subtype, conduct, role-in-act) registered + wired"
  - "Interim encoding: conduct slug → allegationClassification, role clause → entityRole, enum → entityType"
  - "Full EN+AR submit i18n for the choice steps + npm run check:i18n parity gate"
  - "Back select+focus / no-re-advance / orphan-only invalidation with aria-live notice"
affects:
  - "Phase 30 (input steps slot into the render dispatch; Step 5 reads allegationClassification==='other')"
  - "Phase 31 (review/submit consumes the encoded fields)"
  - "Phase 33 (BE-01 slug→conductType, BE-06 clause→roleInConduct via ROLE_CLAUSE_TOKEN)"
requirements: [STEP-01, STEP-03]
plans: [29-01, 29-02, 29-03]
commits:
  - "848878f feat(29-01): registry + encoding + orphan invalidation"
  - "d9ff583 feat(29-02): EN+AR i18n keys + check:i18n gate"
  - "7b4d75c feat(29-03): WizardClient choice-step wiring + Back/branch behavior"
key-files:
  created:
    - src/lib/wizard/encoding.ts
    - scripts/wizard-choice-steps-check.js
    - scripts/i18n-submit-parity-check.js
  modified:
    - src/lib/wizard/registry.ts
    - src/lib/wizard/state.ts
    - src/app/[locale]/submit/WizardClient.tsx
    - scripts/wizard-reducer-check.js
    - messages/en.json
    - messages/ar.json
    - package.json
metrics:
  duration: "~75 min"
  completed: 2026-06-14
  plans: 3
  files: 11
---

# Phase 29: Choice Steps — Summary

A submitter now answers every "pick one" question in the report wizard by tapping an
accessible card that confirms and auto-advances — actor class, entity subtype, conduct
type, and role-in-act — built entirely on the reused Phase-28 scaffold (`ChoiceStep`,
`WizardClient`, the `.choice-*` CSS), with the choices encoded onto the existing
`/api/submit` contract without touching the Zod schema.

## What Was Built

**Plan 29-01 — pure logic (`848878f`).** Replaced the two scaffold registry steps with the
four real `choice` steps in UI-SPEC order (`actor-class` → `entity-subtype` → `conduct` →
`role-in-act`); the Individual branch skips + uncounts `entity-subtype`. New runtime-pure
`encoding.ts`: `CONDUCT_SLUGS` (14, Other last), `ROLE_SLUGS` (7, Other last),
`ROLE_CLAUSE_TOKEN = " — role in act: "`, and round-trip `encodeRoleClause`/`stripRoleClause`
(re-pick replaces, never stacks). Narrowed the reducer's `INVALIDATE_DOWNSTREAM` to
`INVALIDATE_SUBTYPE` (orphan-only: rewrites `entityType`, preserves conduct/role). Added a
standalone 49-assertion Node strip-types driver.

**Plan 29-02 — i18n (`d9ff583`).** Authored 44 EN + 44 AR `submit` keys (verbatim UI-SPEC §3
names): actor-class + hints, entity-subtype heading (reusing the existing `type*` labels),
14 conduct labels + 14 terse legal-register `_def`s, 7 role labels, and the branch-switch
notice. Wired `scripts/i18n-submit-parity-check.js` as `npm run check:i18n` — the milestone's
parity gate — which fails on an induced mismatch.

**Plan 29-03 — wiring (`7b4d75c`).** Wired `WizardClient` to render all four steps with
per-step option builders (resolved through the i18n keys) and interim-encoding confirm
dispatch (enum→`entityType`, slug→`allegationClassification`, clause→`entityRole`). The entity
card keeps a LOCAL sentinel so a non-enum value never reaches `entityType`. Implemented the
Back contract (prior card selected+focused, no re-advance on mount, re-confirm advances) and
the actor-class-switch orphan invalidation with a transient `.legal aria-live="polite"` notice.
Conduct "Other" durably encodes `allegationClassification="other"` with a documented
Step-5/Phase-33 hand-off.

## Verification

| Gate | Result |
|------|--------|
| `tsc --noEmit` | PASS |
| `npm run check:i18n` | PASS |
| `npm run build` | PASS (`/en/submit` + `/ar/submit` SSG) |
| `wizard-choice-steps-check.js` (49 assertions) | PASS |
| `wizard-reducer-check.js` | PASS |
| S2-S4 closed-set absence (submit namespace + wizard surface) | clean |
| `validation.ts` untouched / zero new deps | confirmed |

All five ROADMAP success criteria are met against static gates; `29-VERIFICATION.md` carries
the timing/visual/AT confirmations (auto-advance feel, focus-on-Back, aria-live announcement,
RTL) as `human_needed` browser items — the Phase-28 human-verify precedent.

## Key Decisions

- **Role encoding** appends ` — role in act: <slug>` to `entityRole` via a stable token Phase 33
  (BE-06) strips deterministically; encode strips any prior clause so `entityRole` can't grow
  past max500 on repeated Back-confirms.
- **Conduct encoding** writes a stable English slug matching the i18n key suffix so Phase 33
  (BE-01) maps slug→`conductType` 1:1 with no localized-text parsing; `triageCategory` is NOT
  set in Phase 29.
- **Non-enum safety:** the "An entity" pick never writes a non-enum literal to `entityType`
  (local `ENTITY_MARKER` in React state); only Step 1b commits one of the five enum literals.
- **Orphan-only invalidation:** an actor-class switch on Back clears only the entity-subtype
  (rewriting `entityType`); conduct + role are branch-independent and preserved byte-identical.
- **Driver resolution shim:** the strip-types driver uses an off-thread `module.register`
  resolve hook to follow the bundler-style extensionless `registry → encoding` import, keeping
  the source imports idiomatic (no `.ts`/`.js` extensions added).

## Deferred / Follow-ups

- Two PRE-EXISTING Phase-28 eslint items in WizardClient (`set-state-in-effect` on the
  draft-restore effect; unused `submitting`) logged to `deferred-items.md` — out of scope, not
  blocking; resolve in Phase 31/32.
- A formal `i18n-checker` agent pass over the submit namespace (RTL/register audit) is a
  low-risk follow-up; the full RTL/a11y hardening is Phase 32.

## Stubs

None that block the phase goal. The conduct/role values are interim encodings against the
existing `/api/submit` contract by design (documented hand-off to Phase 33) — not stubs.
