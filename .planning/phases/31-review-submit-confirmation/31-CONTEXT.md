# Phase 31: Review, Submit & Confirmation - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement wizard **Step 9 (Review)** + **Submit** + **Confirmation/Error** on the Phase 28 shell with all
Phase 29–30 data assembled:

- Read-only summary grouped by step with per-group **Edit** (routes to `?step=<id>`) and empty optionals shown as "—".
- Explicit source list with count badge; required **affirmation** checkbox; Submit disabled until affirmation
  checked AND `sourceLinks.length ≥ 2`.
- POST the assembled `SubmitInput` (already interim-encoded by Phases 29–30, plus the persisted `leadNote`) to the
  **existing** `/api/submit`; success panel with reference id + "what happens next" + clears draft + fires GTM
  `SUBMIT_CLICK`; rejection `code` → bilingual message → routes back to the offending step.

Step 9 does NOT transform the form — Phases 29–30 already encoded interim mappings. The `.review-*` / `.legal-success`
/ `.legal-error` CSS already exists (Phase 28 pre-authored §6).
</domain>

<decisions>
## Implementation Decisions

### Review layout
- **Six semantic groups** in flow order, each with an `.ds-eyebrow` label and ONE Edit link routing to the
  **first step in the group**: **Actor** (steps 1/1b/2), **Conduct** (steps 3/4), **Description** (step 5),
  **Evidence** (step 6: sources + lead note), **Media** (step 7), **You** (step 8).
- Empty optionals render as "—" (never hidden). Source-type `[TYPE: <slug>]` token is **stripped for display**
  (shown as "Type: …") but the raw prefixed `title` is still submitted. The lead note shows in the Evidence group
  in a distinct **"Reviewer note (not published)"** sub-block.

### Edit-back return
- Use **browser Back** as the return-to-review mechanism (no new state flag). Edit routes to `?step=<id>`;
  `?step=` history means Back returns to review naturally. (Simplest, platform-native; no `returnFrom` plumbing.)

### Submit enablement
- Submit disabled unless **affirmation checked AND `sourceLinks.length ≥ 2`**. **Two independent** inline
  `.legal-error` blocks: one under the source list ("minimum 2 sources"), one under the affirmation ("check to
  confirm"), each shown only when its own gate is unmet, so the user can fix either independently.

### Rejection routing
- Central lookup module `src/lib/wizard/rejection-map.ts`: `Record<code, { messageKey, stepId }>` matching the
  LOCKED UI-SPEC §3 table — `NO_SOURCE|WEAK_SOURCE → evidence (step 6)`, `PRIVATE_TARGETING|GROUP_TARGET|
  INNOCENT_PARTY|INCITEMENT|HATE_TONE → describe (step 5)`, `MISMATCH → identity (step 2)`. On a failed POST,
  look up `code` → `goTo(stepId)` → render `t(messageKey)` in the reused `.legal-error` panel at the offending step.
  Codes/order are grounded in `src/lib/screens.ts`.

### Success
- `/api/submit` returns `{ ok: true, submissionId, message }`. Show `submissionId` plainly as a reference id in
  `.ds-mono` (LTR even under RTL) inside a `.legal-success` panel with "what happens next (nothing public yet)".
  On success: `clearDraft()` (`hls.submit.draft.v1`), fire existing `GTM_EVENTS.SUBMIT_CLICK`
  (`{success:true, entityType, isAnonymous}`), disable/hide the wizard chrome, show a "Submit another" reset that
  `RESET`s the form and returns to step 1.

### Submit payload
- POST the assembled `SubmitInput` unchanged (Phases 29–30 encoded conduct slug → `allegationClassification`,
  role clause → `entityRole`, source-type token → `title`), PLUS `leadNote` (accepted by the fork-point
  prerequisite contract; persisted once Phase 33 merges). In-flight state disables Submit + shows spinner/skeleton.

### Claude's Discretion
- Exact EN/AR copy of review labels / "what happens next" / disabled-reason messages (terse, full parity now).
- Component decomposition of the review screen.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/submit/SubmitClient.tsx` — existing POST `/api/submit` handler, success/error handling, GTM
  `SUBMIT_CLICK` firing — PORT these patterns into the wizard submit.
- `src/components/wizard/WizardClient.tsx` — has `result` state + `.legal-success`/`.legal-error` panels, `goTo(id)`,
  `clearDraft()`, `RESET` → step 1 already wired (Phase 28).
- `src/components/hlshajara.css` — `.review-group`, `.review-row`, `.review-sources`, `.review-affirm`,
  `.legal-success`, `.legal-error`, `.ds-mono` already exist.
- `src/lib/screens.ts` — rejection code enum + server order.

### Established Patterns
- `/api/submit` response: success `{ok:true, submissionId, message}`; rejection `{ok:false, code, message}` with codes
  NO_SOURCE/WEAK_SOURCE/PRIVATE_TARGETING/GROUP_TARGET/INNOCENT_PARTY/INCITEMENT/HATE_TONE/MISMATCH.
- i18n `submit.*`: `reviewTitle,reviewEdit,affirm,reviewSourcesShort,successTitle,successBody,submitAnother,err_sources,
  err_private,err_group,err_innocent,err_tone,err_mismatch` (UI-SPEC §3/§10) — full EN+AR parity; `check:i18n` gate.

### Integration Points
- New `Step9` review component + `rejection-map.ts`. **The `review` step is NOT yet registered** — no
  Phase-29 or Phase-30 plan appends it (verified: 29-01 registers `actor-class/entity-subtype/conduct/role-in-act`;
  30-01 appends `identity/describe/evidence/media/about-you`; neither adds `review`). Phase 31 MUST append a
  terminal `{ id: "review", … }` StepDef to `registry.ts` itself (Plan 31-01, Task 4) as the FINAL step after
  `about-you`, so `StepId` includes `"review"`, `state.currentStep === "review"` can match, and `goTo`/`isReachable`
  resolve. Without this the `<ReviewStep>` branch never renders and REV-01..04 are all unreachable.
- Reuse WizardClient submit/result/clearDraft/GTM plumbing; build verified via `next build`.

### Canonical post-29/30 StepId set (AUTHORITATIVE — do not re-derive)
The registry's `StepId` union after Phases 29 + 30 execute, in UI-SPEC §3/§4 step order, is EXACTLY:

  `actor-class` (Step 1) · `entity-subtype` (Step 1b, individual-branch-skipped) · `conduct` (Step 3) ·
  `role-in-act` (Step 4) · `identity` (Step 2) · `describe` (Step 5) · `evidence` (Step 6) ·
  `media` (Step 7) · `about-you` (Step 8)

There is **NO** `review` step in the post-29/30 registry — Phase 31 adds it (terminal, Step 9 = `review`).
The slugs `actor`, `you`, and `review` are **NOT** registry ids before Phase 31; any onEdit/goTo to `actor`/`you`
is a bug (goTo to a non-existent step). The six review-group Edit targets (first-step-of-group) are therefore:

  Actor → **`actor-class`** · Conduct → **`conduct`** · Description → **`describe`** ·
  Evidence → **`evidence`** · Media → **`media`** · You → **`about-you`**

The rejection-map stepIds (`identity` · `describe` · `evidence`) and the review-step detection
(`state.currentStep === "review"`) MUST reference ids from this set (plus the Phase-31-added `review`).
</code_context>

<specifics>
## Specific Ideas
- The §3 rejection table is LOCKED — implement exactly. Reference-id = numeric `submissionId`, mono/LTR.
- Edit links route to the FIRST step of each group, not the literal step — and use the ACTUAL registry slug
  (`actor-class` / `about-you`), never the friendly group name (`actor` / `you`).
</specifics>

<deferred>
## Deferred Ideas
- Lead-note server persistence + first-class field swap-offs → Phase 33 (parallel) / later swap-off.
- RTL/a11y/full-parity hardening audit → Phase 32.
</deferred>
</content>
</invoke>
