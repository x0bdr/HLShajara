---
phase: quick-260618-nqm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/api/submit/route.ts
autonomous: true
requirements:
  - QUICK-260618-nqm
must_haves:
  truths:
    - "A public submission whose content matches a Family B screen (GROUP_TARGET, INCITEMENT, HATE_TONE, INNOCENT_PARTY, PRIVATE_TARGETING, MISMATCH) is ACCEPTED (HTTP 200, ok:true, submissionId) instead of rejected with 400."
    - "When a Family B screen matched, the matched code is recorded as an AUTO-FLAG in the immutable review_logs audit trail (via the existing withAudit reason), so the safety signal is preserved for reviewers."
    - "Non-anonymous submissions with NO screen match still record reason === undefined (byte-identical to prior behavior — no empty-string regression)."
    - "RECAPTCHA_MISSING, RECAPTCHA_FAILED, VALIDATION_ERROR (Zod), and INTERNAL_ERROR still block exactly as before."
  artifacts:
    - path: "src/app/api/submit/route.ts"
      provides: "Submit route where content screens are advisory (audit auto-flag) not a 400 block"
      contains: "AUTO-FLAG"
  key_links:
    - from: "src/app/api/submit/route.ts"
      to: "withAudit reason"
      via: "AUTO-FLAG:${screen.code} appended to the '; '-joined reason string"
      pattern: "AUTO-FLAG:\\$\\{screen\\.code\\}"
---

<objective>
Make the post-submit content screens in the public submission flow ADVISORY ("just a warning") instead of a hard intake block.

Today, when `validateSubmission(...)` returns `!screen.ok` for one of the six Family B content codes (GROUP_TARGET, INCITEMENT, HATE_TONE, INNOCENT_PARTY, PRIVATE_TARGETING, MISMATCH), `/api/submit` returns HTTP 400 and the wizard bounces the user back. The new behavior: such a submission is ACCEPTED and persisted normally, but the matched screen code is recorded as a reviewer-facing AUTO-FLAG in the immutable audit log — the safety signal is kept, the hard block is dropped.

Purpose: stop rejecting submissions at intake on content heuristics (which are advisory by design and known to be imperfect for Arabic), while preserving the screening signal for human review.
Output: a ~6-line edit to `src/app/api/submit/route.ts`. No DB migration, no new columns, no new dependencies.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md

ISOLATED-WORKTREE MANDATE (read before any edit):
The main working tree currently has ~204 lines of UNRELATED uncommitted WIP across 10+ files
(messages/ar.json, messages/en.json, src/app/[locale]/reviewer/ReviewerClient.tsx,
src/app/[locale]/submit/WizardClient.tsx, src/app/api/upload/route.ts,
src/components/wizard/MediaEvidenceStep.tsx, src/components/wizard/ReportDetailsStep.tsx,
src/components/wizard/WizardProgress.tsx, src/lib/report-pdf.ts, src/lib/wizard/category-config.ts,
plus untracked scripts/_test-*.cjs and src/lib/report-md.ts).

This plan's executor MUST run in an isolated git worktree forked off a CLEAN origin/master,
and MUST modify and commit ONLY `src/app/api/submit/route.ts`. It MUST NOT recreate, stage,
or touch any of the WIP files above. Do not `git add -A`. Stage exactly one path.
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Extracted from the codebase. Use these directly — no exploration needed. -->

From src/db/persist.ts (DO NOT MODIFY this file):
```typescript
// validateSubmission returns a discriminated union:
type PersistResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; field?: string };

// withAudit signature — `reason` is OPTIONAL free text (string | undefined),
// stored verbatim into the immutable, hash-chained review_logs row.
interface PersistContext { actorId: number; actorRole: ...; reason?: string }
withAudit<T extends { id: number }>(ctx: PersistContext, mutation, meta): Promise<T[]>
```

Family B content codes returned by validateSubmission (the six that currently 400):
GROUP_TARGET, INCITEMENT, HATE_TONE, INNOCENT_PARTY, PRIVATE_TARGETING, MISMATCH.
(`screens.ts` and `persist.ts` are the source of truth for these — both stay UNCHANGED.)

Current route.ts shape (lines ~66–88), for reference:
```
const screen = validateSubmission({ ... });               // line ~67 — KEEP
if (!screen.ok) { return NextResponse.json(..., {status:400}); }   // lines ~75–80 — REMOVE
...
const isAnonymous = data.isAnonymous || !session;
const [submission] = await withAudit(
  { actorId, actorRole, reason: isAnonymous ? "Anonymous submission" : undefined },   // line ~88 — CHANGE reason
  () => db.insert(submissions)...returning(),
  { action: "create", targetTable: "submissions" }
);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make Family B content screens advisory (audit auto-flag, not a 400)</name>
  <files>src/app/api/submit/route.ts</files>
  <action>
Make EXACTLY these two edits to src/app/api/submit/route.ts and NOTHING else. Touch no other file.

EDIT A — Drop the hard block (lines ~75–80):
REMOVE the entire early-return block:
  if (!screen.ok) { return NextResponse.json({ ok:false, code: screen.code, message: screen.message }, { status: 400 }); }
KEEP the preceding `const screen = validateSubmission({ ... })` call (line ~67) intact — `screen` is still
read in EDIT B. Execution now falls through to the existing getSession / withAudit / db.insert(submissions)
path and returns the normal success response `{ ok: true, submissionId, message }`.

EDIT B — Preserve the safety signal as a reviewer auto-flag (the withAudit call, line ~88):
Replace the inline `reason: isAnonymous ? "Anonymous submission" : undefined` with a `"; "`-joined string
computed from the two optional parts, computed JUST BEFORE the withAudit call:
  - part 1: the anonymous marker — present only when `isAnonymous`, value "Anonymous submission"
  - part 2: the screen auto-flag — present only when `!screen.ok`, value `AUTO-FLAG:${screen.code}`
Build with: const parts = [isAnonymous ? "Anonymous submission" : null, !screen.ok ? `AUTO-FLAG:${screen.code}` : null].filter(Boolean);
Then: const reason = parts.length ? parts.join("; ") : undefined;
Pass `reason` into the withAudit context: `{ actorId, actorRole, reason }`.
CRITICAL: when both parts are absent the value MUST be `undefined` (NOT an empty string) so the
non-anonymous / no-flag path stays byte-identical to prior behavior.

DO NOT TOUCH any other lines. In particular do NOT change:
  - The RECAPTCHA_MISSING / RECAPTCHA_FAILED / VALIDATION_ERROR (Zod) early returns — they STILL block (400).
  - The INTERNAL_ERROR catch — it STILL returns 500.
  - src/lib/screens.ts or src/db/persist.ts (validateSubmission + pure screens return their codes unchanged;
    only this route stops acting on them as a block).
  - WizardClient.tsx (it already handles `{ ok: true, submissionId }` — leave it; it has unrelated WIP).
  - messages/ar.json / messages/en.json (the err_* content keys may remain as harmless dead keys;
    DO NOT edit i18n — avoid parity churn; both files have unrelated WIP).

Per the ISOLATED-WORKTREE MANDATE: stage and commit ONLY src/app/api/submit/route.ts. Never `git add -A`.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    <!-- Then confirm the intended shape mechanically: -->
    <!-- 1) the 400 content block is gone: -->
    <!--    grep -nc 'code: screen.code' src/app/api/submit/route.ts  → expect 0 -->
    <!-- 2) the auto-flag is wired: -->
    <!--    grep -c 'AUTO-FLAG:\${screen.code}' src/app/api/submit/route.ts  → expect 1 -->
    <!-- 3) undefined-preserving reason exists: -->
    <!--    grep -c 'parts.length ? parts.join' src/app/api/submit/route.ts  → expect 1 -->
    <!-- 4) the non-content hard gates survive: -->
    <!--    grep -c 'RECAPTCHA_MISSING' src/app/api/submit/route.ts  → expect 1 -->
    <!--    grep -c 'RECAPTCHA_FAILED' src/app/api/submit/route.ts   → expect 1 -->
    <!--    grep -c 'VALIDATION_ERROR' src/app/api/submit/route.ts   → expect 1 -->
    <!--    grep -c 'INTERNAL_ERROR' src/app/api/submit/route.ts     → expect 1 -->
    <!-- 5) gate scripts unaffected (i18n + wizard reducer untouched): -->
    <!--    node scripts/i18n-parity-check.js && node scripts/wizard-reducer-check.js -->
    <!-- 6) only one file changed: -->
    <!--    git status --short  → must list ONLY src/app/api/submit/route.ts (M) among tracked changes from this work -->
  </verify>
  <done>
    `npx tsc --noEmit` passes. The `if (!screen.ok) return 400` content block is removed; `screen` is still
    computed; `!screen.ok` paths persist normally and the matched code is appended to the withAudit `reason`
    as `AUTO-FLAG:${screen.code}`; the no-flag/non-anonymous path keeps `reason === undefined`. RECAPTCHA_MISSING,
    RECAPTCHA_FAILED, VALIDATION_ERROR, and INTERNAL_ERROR are unchanged. scripts/i18n-parity-check.js and
    scripts/wizard-reducer-check.js still pass. Exactly one file (src/app/api/submit/route.ts) is changed and committed.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no type regressions from the discriminated-union narrowing or the reason variable).
- `git diff --stat` shows ONLY src/app/api/submit/route.ts touched (no WIP files recreated/modified).
- A content-screen-matching payload would now produce HTTP 200 `{ ok:true, submissionId }` (the route returns
  success), with `AUTO-FLAG:<CODE>` written into the review_logs reason for that insert.
- `scripts/i18n-parity-check.js` and `scripts/wizard-reducer-check.js` still pass (i18n + wizard reducer untouched).
</verification>

<success_criteria>
- Family B content screens (GROUP_TARGET, INCITEMENT, HATE_TONE, INNOCENT_PARTY, PRIVATE_TARGETING, MISMATCH)
  no longer reject the submission; they are recorded as reviewer auto-flags instead.
- The four non-content hard gates (RECAPTCHA_MISSING, RECAPTCHA_FAILED, VALIDATION_ERROR, INTERNAL_ERROR) still block.
- `reason` is `undefined` (not "") when there is no anonymous marker and no screen flag.
- Only src/app/api/submit/route.ts changed; src/lib/screens.ts, src/db/persist.ts, WizardClient.tsx, and i18n files untouched.
- Typecheck and the relevant gate scripts pass.
</success_criteria>

<output>
Create `.planning/quick/260618-nqm-make-post-submit-content-screens-advisor/260618-nqm-SUMMARY.md` when done.
Commit message: `feat(submit): make content screens advisory auto-flags instead of intake block`
Stage ONLY src/app/api/submit/route.ts.
</output>
