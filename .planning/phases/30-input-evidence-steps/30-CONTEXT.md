# Phase 30: Input & Evidence Steps - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the five **input steps** of the wizard on the Phase 28 shell + Phase 29 choice answers:

- **Step 2 — Identity** (`entityName` req, `entityRole` req + live MISMATCH notice, country req + coarse governorate/city, optional public identifier)
- **Step 5 — Describe act** (`allegationDescription` `min20 max10000` + live counter + inline screens, optional coarse `allegationPeriod`)
- **Step 6 — Evidence (keystone)** (repeatable `sourceLinks[]`, ≥2-source gate, optional source-type select, **optional non-public lead note**)
- **Step 7 — Media** (`sourceFiles[]` via existing `/api/upload`, images/docs only, social-link rejection)
- **Step 8 — About you** (`isAnonymous` default ON, disables+clears name/email)

Targets the **existing** `/api/submit` + `/api/upload` contracts via §8 interim mappings (locked architecture).
The wizard chrome (WizardClient/InputStep/Nav/Panel) and the `.wizard-*` CSS already exist (Phase 28) — this
phase supplies step **content + field wiring + inline validation**, reusing the existing SubmitClient patterns.
No identity/loyalty/profession/phone/plate/street/map-pin/social-handle field exists anywhere (S1–S5 absent by design).
</domain>

<decisions>
## Implementation Decisions

### Lead note (USER DECISION: persist it)
- The optional non-public lead note is a **real field**: a shared fork-point prerequisite adds optional
  `leadNote?: z.string().max(...).optional()` to `SubmitInput` in `src/lib/validation.ts`, and `/api/submit`
  **accepts-but-ignores** it until Phase 33 (Lane B) adds the DB column + persistence. Backward-compatible/additive.
- Step 6 captures `leadNote` into `form.leadNote` via the reducer. Labeled "For reviewers only — never published,
  never counts as a source." It is **never** folded into `allegationDescription` and **never** counted toward the
  2-source gate. Step 9 (Phase 31) shows it in a distinct non-public block; Step 31 submits it in the payload.

### Evidence gate (fixes the client/server WEAK_SOURCE mismatch)
- The Step-6 **Next gate counts `sourceLinks.length ≥ 2` ONLY** — uploaded files do NOT unlock advance. This
  matches the server `WEAK_SOURCE` screen (`sourceCount = sourceLinks.length`, per `route.ts` + `screens.ts`),
  preventing a "passes client, rejected server" trap. Copy clarifies: links are the sources; media strengthens but
  does not substitute. The live counter may display both ("2 sources · 3 media files") but the unlock is tied to links.
- The "minimum 2 independent public sources" rule is surfaced **up front** at the top of Step 6.

### Source-type select (interim, §8)
- Optional per-row source-type select (UN/IIIM · Court record · Sanctions list · Recognized HR org · Corroborated
  journalism · Official filing). Interim encoding: prepend a stable token `[TYPE: <slug>] ` to that row's `title`
  (slug ∈ `un|court|sanctions|hr|journalism|official`). Idempotent (don't double-prefix). Phase 31 review strips the
  token for display; Phase 33 (BE-03) adds a first-class `sourceType` and a later swap-off removes the token.

### Coarse location
- Country (select, required) + governorate/city (coarse, optional) compose into a single `allegationLocation`
  string as `"{country} — {city}"` (em-dash; `"{country}"` alone if city empty). The street-level address regex
  (`isCoarseLocationClean`, `screens.ts`) blocks inline on the city input (S5); the composed string is therefore clean.

### Inline validation (non-blocking warnings)
- **MISMATCH** runs live (on blur/debounce) on `entityRole` vs `entityType` via `screenMismatch`; shows a
  non-blocking `.filter-notice`; does NOT block Next (it is a warning, hard-blocked only at server submit).
- **Step 5 screens** (GROUP_TARGET / PRIVATE_TARGETING / INNOCENT_PARTY / INCITEMENT / HATE_TONE) run live on
  the screened concatenation (`entityName + entityRole + allegationDescription`) in **server order**, shown inline
  as warnings; Next gated on `≥20 chars` (the per-UI-SPEC hard-block screens block advance, warnings guide).
- **Step 7 optional link** validated on blur via `screenPrivateTargeting`; a personal-social link shows `.legal-error`
  and is not accepted; the field being optional, an empty value is fine.

### Anonymity (S7)
- `isAnonymous` default ON (already seeded `true` in Phase 28 state). Toggling ON disables + **clears**
  `submitterName`/`submitterEmail` (zeroed, not stashed/restored — safety). Server drops them regardless.

### Media (S; video deferred)
- Step 7 uploads images + documents only via the existing `/api/upload`; **video hidden** until Phase 33 (BE-05)
  ships ffmpeg metadata stripping. Per-file removable cards mirror the existing SubmitClient upload UI. Safety copy
  (`.legal`): supporting-only, non-public, metadata stripped, no faces of victims/children/bystanders.

### Claude's Discretion
- Exact EN/AR copy of helpers/counters/notices (terse, legal-register, full parity now).
- Debounce timing for live screens; component decomposition of the input steps.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/wizard/InputStep.tsx` — Phase 28 input-step scaffold (Next-gated archetype).
- `src/app/[locale]/submit/SubmitClient.tsx` — the pre-wizard form: PORT its identity/description/sources/files/
  anonymity field patterns, add-source/remove-file UI, `/api/upload` call, `/api/submit` POST.
- `src/lib/screens.ts` — `screenMismatch`, `screenPrivateTargeting`, `isCoarseLocationClean`, `runScreens`,
  `PRIVATE_DATA_PATTERNS`; documented rule: `sourceCount` mirrors `sourceLinks.length` only.
- `src/lib/wizard/state.ts` (reducer, `form: SubmitInput`), `registry.ts` (input steps already declared positions).
- `src/components/hlshajara.css` — existing form/input/`.legal`/`.filter-notice`/`.legal-error` classes (reuse; tokens only).

### Established Patterns
- `src/lib/validation.ts` SubmitInput is the contract; do NOT redeclare types. The fork-point prerequisite adds
  optional `leadNote`. All other fields already exist (entityName, entityRole, allegationLocation,
  allegationDescription, allegationPeriod, sourceLinks[], sourceFiles[], isAnonymous, submitterName, submitterEmail).
- `/api/upload` returns `{hash,filename,originalName,url,size}`; image EXIF stripped via `sharp`.
- i18n under `submit.*` in `messages/{en,ar}.json`; add Phase-30 keys (UI-SPEC §3 pins them) in full EN+AR parity; `check:i18n` gate.

### Integration Points
- Reducer `SET_FIELD` for each input; lead-note field; location composition; source rows.
- Step registry input steps consume InputStep + a `stepValid` predicate per step (drives Next).
- Build verified via `next build`; pure logic (validators/composition) gated via `tsc` + grep (no test framework).
</code_context>

<specifics>
## Specific Ideas

- Required-to-advance: Step 2 → name+role+country; Step 5 → ≥20 chars (no hard-block screen hit); Step 6 → `sourceLinks.length ≥ 2`.
- i18n keys pinned by UI-SPEC §3: `idName,idRole,idRoleHint,idCountry,idArea,idAreaHint,idPublicRef`,
  `descLabel,descHint,descCounter,period`, `sourcesTitle,sourcesRule,sourceUrl,sourceType,sourceType_{un,court,sanctions,hr,journalism,official},sourceTitleField,addSource,leadNote,leadNoteHint`,
  `mediaTitle,mediaSafety,mediaLink,skip`, `anonTitle,anonToggle,anonHelp` (+ reuse `fullName,email`).
- "Other" conduct from Phase 29 (`allegationClassification="other"`) makes the Step-5 description required to name the act.
</specifics>

<deferred>
## Deferred Ideas
- First-class `leadNote` persistence, per-source `sourceType` column, `conductType`/`roleInConduct`, isAnonymous DB
  default, video stripping → **Phase 33 (Lane B, parallel)**.
- Removing §8 interim encodings (source-type-in-title) once Phase 33 lands → deferred swap-off follow-up.
- Review/submit/confirmation → **Phase 31**. RTL/a11y/full-parity audit → **Phase 32**.
</deferred>
