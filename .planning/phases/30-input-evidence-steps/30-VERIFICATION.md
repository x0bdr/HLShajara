---
phase: 30-input-evidence-steps
status: human_needed
verified: 2026-06-14
verifier: gsd-executor (goal-backward against ROADMAP Phase 30 success criteria)
---

# Phase 30 Verification — Input & Evidence Steps

**Status: `human_needed`** — every build-provable criterion passes (tsc, check:i18n, next build, registry-order assertion, S1–S5 grep-absence, all regression scripts). The interaction-driven and visual halves of the five success criteria (inline-warning UX, live gating, upload, anonymity clearing, RTL) require the live EN+AR browser pass defined in 30-05 Task 2 (a blocking human-verify checkpoint). The full a11y/RTL audit is owned by Phase 32.

## Automated gate results (all green)

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (exit 0) |
| `npm run check:i18n` | PASS — EN↔AR submit parity, 130 keys each, no empty values |
| `npm run build` | PASS — compiled successfully; `/en/submit` + `/ar/submit` build |
| Registry order assertion | PASS — `actor-class,entity-subtype,identity,conduct,role-in-act,describe,evidence,media,about-you` (identity at index 2, before conduct) |
| `node scripts/step-logic-check.js` | PASS — 25 checks incl. exact id-order, composeLocation, idempotent token, links-only count, media-link, all requires predicates |
| `node scripts/wizard-choice-steps-check.js` | PASS — Phase-29 branch/encoding behavior intact (order/count assertions updated for the inserted input steps) |
| `node scripts/wizard-reducer-check.js` | PASS |
| `node scripts/screens-parity-check.js` | PASS |
| S1–S5 grep-absence (all 5 input-step components) | PASS — 0 hits each (no phone/plate/street/map-pin/social-handle/sect/loyalty/profession field) |
| `dangerouslySetInnerHTML` real usage | 0 (matches are comment negations only) |
| leadNote isolation | PASS — EvidenceStep has 0 `allegationDescription` references; leadNote written to `form.leadNote` only |
| Logical-CSS-only (no left/right/margin-*/padding-*) | PASS — 0 in each input-step component |

## Success criteria — verified vs human_needed

### Criterion 1 — Identity gate + S5 inline block
- **Build-verified:** `requiresIdentity` gates Next on name + role + country (composed `allegationLocation` non-empty) — asserted in step-logic-check (`idMissing=false without country`, `idPresent=true`). `isCoarseLocationClean` wired into the city `onChange`; a dirty token is never composed into the location and surfaces `idLocationError` in `.legal-error`. Country select offers an empty placeholder first.
- **human_needed:** that Next is visibly disabled until the three fields are set, and that typing a street-level address shows the inline "use city/governorate only" message (live interaction).

### Criterion 2 — Evidence ≥2-source rule up front + links-only gate + non-public lead note
- **Build-verified:** `sourcesRule` renders in a `.legal` block at the TOP (before the rows). `requiresEvidence` = `evidenceSourceCount(form) >= 2` (links only; step-logic-check: `evOneLink=false`, `evTwoLinks=true`, `2 files + 1 link -> 1`). `leadNote` writes to `form.leadNote` only, labeled non-public, never counted (grep-isolated).
- **human_needed:** that 1 link keeps Next disabled, a 2nd link enables it, an uploaded file does NOT unlock advance, and the lead note reads as non-public/never-a-source.

### Criterion 3 — Describe ≥20 chars + 5 server-order screen warnings
- **Build-verified:** `requiresDescribe` gates at ≥20 chars (`descShort=false`, `descOk=true`). `screenDescribeStep` returns the first failing code in server order (GROUP_TARGET→INCITEMENT→HATE_TONE→INNOCENT_PARTY→PRIVATE_TARGETING); all five `descWarn*` keys mapped 1:1; live `descCounter`.
- **human_needed:** that the counter updates live, Next is gated below 20 chars, and exactly one matching warning shows inline as banned text is typed.

### Criterion 4 — Media supporting-only/non-public + social-link rejection; anonymity default-ON disable+clear
- **Build-verified:** MediaStep `accept` excludes video (BE-05 deferral); `mediaSafety` `.legal` copy; optional link validated via `screenMediaLink` → `mediaLinkError` `.legal-error` (`screenMediaLink` rejects facebook.com, passes ""). AboutYouStep: checkbox reflects `form.isAnonymous` (seeded true); ON dispatches isAnonymous=true + submitterName="" + submitterEmail=""; inputs `disabled={form.isAnonymous}`.
- **human_needed:** that an upload yields a removable card, the picker offers no video, a pasted personal social link is rejected inline, and toggling anonymity disables+clears the contact fields live.

### Criterion 5 — S1–S4 banned fields absent everywhere
- **Verified (build-provable):** S1–S5 grep-absence returns 0 across all five input-step components — no field for phone, plate, street/home address, map pin, personal social handle, sect/identity, loyalty/opinion, or profession-target.

## Human-browser items (for 30-05 Task 2 checkpoint)
0. FLOW ORDER — Identity reached as Step 2, BEFORE Conduct/role (the order fix).
1. Identity gating + S5 inline block + non-blocking MISMATCH notice.
2. Describe live counter + ≥20-char gate + single server-order screen warning.
3. Evidence: rule up front, 1-link locked / 2-link unlocked, file does NOT unlock, idempotent `[TYPE: …]` token, non-public lead note.
4. Media: upload → removable card, no video in picker, social-link rejection.
5. About-you: anonymity default ON, disable+clear on toggle.
6. RTL: `/ar/submit` renders right-to-left, Arabic labels, machine strings (URLs) stay LTR.

## Gaps / follow-ups
- None blocking. Interim §8 source-type-in-title token and leadNote accept-but-ignore are documented deferrals to Phase 33 (BE-03 sourceType, leadNote persistence, BE-04 anon default flip, BE-05 video stripping).
- Full a11y/RTL/parity audit is Phase 32.

---
*Phase: 30-input-evidence-steps — auto-verification complete; live human-verify pending.*
