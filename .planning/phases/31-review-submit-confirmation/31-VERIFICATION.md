---
phase: 31-review-submit-confirmation
status: passed
verified: 2026-06-14
requirements: [REV-01, REV-02, REV-03, REV-04]
gates:
  tsc: pass
  check_i18n: pass
  next_build: pass
---

# Phase 31 Verification — Review, Submit & Confirmation

Goal-backward verification against the 4 ROADMAP "Phase 31:" success criteria. All
automated gates (tsc, check:i18n, next build) and grep/goal-backward checks pass.
The live submit round-trip and rejection-routing UX (and the full a11y/RTL pass) are
deferred to a human/Phase 32 — flagged below as `human_needed`.

**Overall status: passed** (code-level criteria met; runtime UX confirmation is a
reasonable human_needed item per the no-test-framework rails).

## Success Criteria

### SC1 — Review shows every value (optionals "—"), each group's Edit routes there and back
**Status: PASSED (code)**
- Six `.review-group` blocks in flow order; six Edit links to the REAL first-of-group
  registry slugs (`actor-class/conduct/describe/evidence/media/about-you`) — grep: 6/6,
  zero friendly `actor`/`you` targets.
- Empty optionals render via `displayValue` → em-dash "—" (never hidden).
- Parent forwards `onEdit` verbatim to `goTo(id as StepId)`; edit-back returns to review
  via browser Back (no `returnFrom` flag).
- `human_needed`: confirm in a browser that clicking each Edit lands on the right step and
  Back returns to review (Phase 32 QA).

### SC2 — Submit disabled until affirmed AND sources ≥ 2, with inline reasons
**Status: PASSED (code)**
- `disabled = submitting || !affirmed || form.sourceLinks.length < 2`.
- Two INDEPENDENT inline `.legal-error` gates: `errSourcesGate` (sources<2) and
  `errAffirmGate` (not affirmed), each shown only on its own unmet condition.

### SC3 — Submitting POSTs to /api/submit, confirmation with reference id + "what happens next", clears draft
**Status: PASSED (code)**
- `handleSubmit` POSTs the full `state.form` (leadNote rides along) to `/api/submit`.
- Success: `.legal-success` panel with `successTitle`/`successBody` + `submissionId` in
  `.ds-mono` (LTR under RTL); `clearDraft()`; GTM `SUBMIT_CLICK` fired; wizard chrome
  hidden; "Submit another" RESETs to step 1 (reset deferred to the button).
- `human_needed`: live POST round-trip against a running `/api/submit` (success path,
  reference-id rendering, draft cleared) — requires a server + a clean submission.

### SC4 — Server rejection → bilingual message → returns to the offending step
**Status: PASSED (code)**
- `resolveRejection(code)` (closed 8-code map) → `goTo(route.stepId)` + `t(route.messageKey)`
  in the reused `.legal-error` panel. Unknown/VALIDATION_ERROR/network → generic error,
  draft NOT cleared.
- Routing table matches LOCKED UI-SPEC §3: NO_SOURCE/WEAK_SOURCE→evidence,
  PRIVATE_TARGETING/GROUP_TARGET/INNOCENT_PARTY/INCITEMENT/HATE_TONE→describe,
  MISMATCH→identity.
- `human_needed`: trigger each rejection code live and confirm the user lands on the right
  step with the right bilingual copy (Phase 32 QA).

## Automated Gate Results
- `npx tsc --noEmit` — PASS (StepId union widened to include `review`; ReviewStep,
  rejection-map, WizardClient all typecheck).
- `npm run check:i18n` — PASS (EN↔AR submit parity, 156 keys, no empties; negative test
  flags injected drift).
- `npm run build` (next build) — PASS (exit 0, "Compiled successfully"; `/en/submit` +
  `/ar/submit` build as SSG).
- rejection-map type-strip driver — PASS (8 codes route correctly; unknown → null).
- ReviewStep helper type-strip driver — PASS (token strip + em-dash sentinel fixtures).

## Grep / Goal-Backward Checks
| Check | Result |
|---|---|
| Six Edit links use real slugs (no actor/you) | 6/6, 0 friendly |
| rejection-map covers all 8 codes | 8/8 |
| terminal `review` step appended after about-you | yes |
| review-step detection anchored to STEPS[last] | yes |
| two independent inline gates | errSourcesGate + errAffirmGate |
| success panel: legal-success + ds-mono + copy | yes |
| clearDraft + GTM on success; draft not cleared on error | yes |

## human_needed (browser items for Phase 32 QA)
1. Live `/api/submit` success round-trip: submit a clean entry, confirm `.legal-success`
   shows the numeric reference id (mono/LTR) and the draft is cleared.
2. Live rejection routing: trigger NO_SOURCE/WEAK_SOURCE, a §5 text screen, and MISMATCH;
   confirm each routes to evidence/describe/identity with the right bilingual `.legal-error` copy.
3. Edit-back: from review, Edit each group → correct step → browser Back returns to review.

## Deferred (out of Phase-31 scope)
- Full a11y (radiogroup keyboard, focus-to-h2, aria-live) and RTL audit → Phase 32.
- Lead-note server persistence → Phase 33 (BE-02); currently accept-but-ignored by /api/submit.
