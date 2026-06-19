---
quick_id: 260618-nqm
title: Make post-submit content screens advisory (warn, not block) in submit route
date: 2026-06-18
status: complete
commit: 4fda90a
files_changed:
  - src/app/api/submit/route.ts
---

# Quick Task 260618-nqm — Summary

## Goal
Make the six post-submit content screens ("Family B": `GROUP_TARGET`, `INCITEMENT`,
`HATE_TONE`, `INNOCENT_PARTY`, `PRIVATE_TARGETING`, `MISMATCH`) **advisory** at intake
instead of a hard HTTP-400 block that bounced the submitter back to a step.

## Change (single file: `src/app/api/submit/route.ts`)
1. **Removed** the `if (!screen.ok) return NextResponse.json({...}, { status: 400 })`
   block. `validateSubmission(...)` is still called (its result is read in step 2),
   but a content-screen match no longer rejects — execution falls through to the
   existing `db.insert(submissions)` and returns the normal `{ ok:true, submissionId }`.
2. **Preserved the safety signal:** when `!screen.ok`, the matched code is recorded as
   a reviewer-facing flag in the immutable hash-chained `review_logs` table via the
   existing `withAudit(...)` `reason` parameter:
   ```ts
   const parts = [
     isAnonymous ? "Anonymous submission" : null,
     !screen.ok ? `AUTO-FLAG:${screen.code}` : null,
   ].filter(Boolean);
   const reason = parts.length ? parts.join("; ") : undefined;
   ```
   `reason` stays `undefined` (not `""`) on the no-flag / non-anonymous path, matching
   prior behavior exactly.
3. **Hard gates unchanged:** `RECAPTCHA_MISSING`, `RECAPTCHA_FAILED`, `VALIDATION_ERROR`
   (Zod) still return 400; `INTERNAL_ERROR` still returns 500.

## Explicitly NOT touched
- `src/lib/screens.ts`, `src/db/persist.ts` — pure screens + `validateSubmission` still
  compute and return the same codes; only the route stopped acting on them as a block.
- Live "Family A" inline warnings (`descWarn*`, `ExperienceStep.tsx`) — unchanged.
- `messages/*.json` (`err_*` keys remain as harmless dead keys for content codes) — no
  i18n parity churn. (These files also carried unrelated WIP, left untouched.)
- `WizardClient.tsx` — already handles `{ ok:true, submissionId }` success; no change needed.

## Verification (run in main checkout; worktree lacked node_modules)
- `npx tsc --noEmit` → **0 errors** project-wide (unrelated WIP included).
- `npm run check:screens` → **all PASS** (screen classification + coarse-location intact;
  server cascade order preserved — the screens still *work*, they're just advisory now).
- Grep assertions: no `screen.code` 400 response; exactly 1 `AUTO-FLAG:` interpolation;
  `undefined`-preserving reason present; all 4 hard-gate codes present; 3 `status: 400`
  remain (the hard gates).

## Notes / handoff
- **Intake safety posture changed:** identity-targeting / incitement / hate / innocent-party /
  doxxing / mismatch submissions are now **accepted and flagged** rather than rejected at
  intake. Publication-time gates (≥1 source, lawyer sign-off for living persons in
  `validatePublication`) are **unaffected**. Reviewers must triage `AUTO-FLAG:*` entries.
- **Follow-up (optional):** the flag currently lives in `review_logs.reason`. Surfacing it
  at-a-glance in the reviewer console (a `screen_flags` column + UI badge) would need a
  Drizzle migration — deliberately out of scope here.
- Executor agent died mid-run on a transient `UNKNOWN_CERTIFICATE_VERIFICATION_ERROR` after
  making the (correct) edit; orchestrator committed in-worktree, merged back, and verified.

## Commits (branch `quick/260618-nqm-submit-advisory`)
- `ff7c64a` docs: pre-dispatch plan
- `4fda90a` feat(submit): make content screens advisory (warn, not block) at intake
- `6c02bc1` chore: merge quick task worktree
