# Roadmap: HLShajara (لست شجرة)

## Milestones

- ✅ **v1.0 Foundation** — Phases 1–9 (shipped 2026-05-31)
- ✅ **v1.1 Hardening** — Production readiness, real data, search, 2FA (shipped 2026-05-31)
- ✅ **v1.2 Frontend Polish** — UI consistency, shared shell, token compliance, mobile UX (shipped 2026-05-31)
- ✅ **v1.3 Outreach & Analytics** — Publications, Twitter/X OAuth, GTM (shipped 2026-06-01)
- 🚧 **v1.4 Report Submission Wizard** — Phases 28–33 (in progress)
- 📋 **v2.0 Scale** — Partner API, export tools, advanced analytics (future)

## Phases

<details>
<summary>✅ v1.0 Foundation (Phases 1–9) — SHIPPED 2026-05-31</summary>

- [x] Phase 1: Integrity Core — Identity-free schema, validation choke point, hash-chained audit log
- [x] Phase 2: Auth & RBAC — Better Auth scaffold, role hierarchy, session helpers
- [x] Phase 3: Submission & Boundary Engine — Public intake, boundary validation, file upload
- [x] Phase 4: Verification Pipeline — Reviewer console, approve/reject/publish actions
- [x] Phase 5: Legal Release Gate — Lawyer sign-off check, publication validation
- [x] Phase 6: Public Record & Search — Browse, search, entity detail, evidence labels
- [x] Phase 7: Right-of-Reply, Correction & Transparency — Reply intake, correction schema
- [x] Phase 8: Bilingual Site & Policies — AR/EN i18n, mission, FAQ, terms, privacy
- [x] Phase 9: Critical Safety Closure (INSERTED) — Auth enforcement, audit wiring, RBAC

See `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.1 Hardening (Phases 10–15) — SHIPPED 2026-05-31</summary>

- [x] Phase 10: 2FA & Login UI — TOTP for staff; bilingual login page
- [x] Phase 11: Reviewer Console v2 — Structured triage, source verification, dual review
- [x] Phase 12: Search & Filtering — Filter UI, materialized view for published entities
- [x] Phase 13: Reply Processing — Admin workflow for approving/correcting/unpublishing
- [x] Phase 14: Transparency Dashboard — Published/rejected/corrected counts
- [x] Phase 15: Data Hardening — Real research data seed, ClamAV scanning, distributed rate limits

</details>

<details>
<summary>✅ v1.2 Frontend Polish (Phases 16–19) — SHIPPED 2026-05-31</summary>

- [x] **Phase 16: Page Shell & Dashboard Redesign** — Shared Header+Footer wrapper, dashboard token compliance, remove inline styles
- [x] **Phase 17: Interactions & Pagination** — Evidence card click-through, pagination API + UI, loading skeletons, error states
- [x] **Phase 18: Filter UX & Mobile** — Extract shared FilterPanel, collapsible mobile filters, unify search/filter architecture
- [x] **Phase 19: Copy & Polish** — Translation gaps, empty states, login UX, stats bar empty state, final build verification

</details>

<details>
<summary>✅ v1.3 Outreach & Analytics (Phases 24–27) — SHIPPED 2026-06-01</summary>

- [x] **Phase 24: Publications System** — DB schema, public listing + detail pages, card grid, i18n routing
- [x] **Phase 25: Admin Publication Editor** — Dashboard CRUD for posts, WYSIWYG/markdown editor, publish/unpublish
- [x] **Phase 26: Social Authentication** — Twitter/X OAuth via Better Auth, login button, profile linking
- [x] **Phase 27: Analytics & GTM** — Google Tag Manager injection, data-layer events, env-based config

</details>

### 🚧 v1.4 Report Submission Wizard (In Progress)

Design contract: `.planning/UI-SPEC.md`. Every phase preserves guardrails **S1–S8** (no PII/identity/loyalty/profession-target fields; coarse location only; source-first; anonymity default-on; nothing published on submit).

- [ ] **Phase 28: Wizard Foundation** — Stepper shell, state machine, `?step=` routing, draft persistence, browser-history, shared client-validation library
- [ ] **Phase 29: Choice Steps** — Accessible auto-advancing card groups: actor class, entity subtype, conduct type, role-in-act
- [ ] **Phase 30: Input & Evidence Steps** — Identity, describe-act, evidence (≥2 sources + lead note), media, submitter (anon default)
- [ ] **Phase 31: Review, Submit & Confirmation** — Summary with edit-back, affirmation gate, `/api/submit` wiring, rejection-code → bilingual mapping
- [ ] **Phase 32: i18n, RTL & Accessibility** — Full EN/AR `submit` key parity, RTL correctness, keyboard/screen-reader, reduced motion
- [ ] **Phase 33: Backend Support** — `conductType` enum + triage, `leadNote`, per-source `sourceType`, anon default flip, video metadata stripping, `roleInConduct`

### 📋 v2.0 Scale (Future)

- [ ] Phase 34: Partner API — Vetted organization access
- [ ] Phase 35: Export & Citation — Journalist/lawyer/researcher tooling
- [ ] Phase 36: AI-Assisted Triage — Arabic-dialect incitement classifier
- [ ] Phase 37: Appeals Process — Formal appeals with SLA

## Phase Details

### Phase 28: Wizard Foundation
**Goal**: A submitter moves through a one-step-per-page wizard whose navigation, progress, routing, and draft state all work — before any individual step's content exists.
**Depends on**: Nothing (first phase of v1.4; builds on the existing `/submit` route and `hlshajara.css`)
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, EV-05
**Scope notes**: New `/* ===== WIZARD / STEPPER ===== */` block in `src/components/hlshajara.css` (tokens only, no Tailwind, no new colors — §12). Shared `src/lib/screens.ts` holding the client-mirrored regex/order screens so client and server cannot drift (§9). Wizard state as `useReducer` + context at the root; `?step=<id>` URL routing via next-intl navigation; `sessionStorage` draft under `hls.submit.draft.v1` with restore prompt; `beforeunload` dirty-guard; progress pills + "Step N of M" shell; persistent Back; branch/guard logic (Individual skips 1b; deep-link to incomplete step redirects to first incomplete). Step bodies are stubs here — filled in Phases 29–30.
**Success Criteria** (what must be TRUE):
  1. Exactly one step renders at a time in `.page-container-narrow`; a placeholder choice step auto-advances after `var(--dur)` (instant under reduced-motion) and a placeholder input step gates on an explicit Next.
  2. Back appears on every step except the first; browser Back/Forward and a page refresh restore the correct step and any entered data from `?step=` + the sessionStorage draft, and leaving a dirty draft warns the user.
  3. The progress row shows done / current / upcoming pills, a "Step N of M" count, and completed pills are tappable to jump back.
  4. Choosing the Individual branch skips the entity-subtype step, and deep-linking to a later step with incomplete data redirects to the first incomplete step.
  5. `src/lib/screens.ts` exposes the eight server screens in server order (`NO_SOURCE`→`WEAK_SOURCE`→`GROUP_TARGET`→`INCITEMENT`→`HATE_TONE`→`INNOCENT_PARTY`→`PRIVATE_TARGETING`→`MISMATCH`) and a street-level location blocker, ready for downstream steps to consume.
**Plans**: 5 plans
- [x] 28-01-PLAN.md — Lift pure validation screens into `src/lib/screens.ts` (EV-05) + refactor `persist.ts` to re-import + parity regression check
- [ ] 28-02-PLAN.md — WIZARD/STEPPER CSS section (tokens only, logical props, brass check, reduced-motion)
- [ ] 28-03-PLAN.md — Wizard engine: reducer (bound to SubmitInput) + step registry/branching + sessionStorage draft + shell i18n keys
- [ ] 28-04-PLAN.md — Chrome components: WizardProgress (pills + Arabic-Indic counter), WizardNav (Back/Next), WizardPanel (focus + aria-live)
- [ ] 28-05-PLAN.md — Scaffold ChoiceStep/InputStep + WizardClient root (routing/draft/history/branching) + page swap + live human-verify
**UI hint**: yes

### Phase 29: Choice Steps
**Goal**: A submitter answers every "pick one" question by tapping an accessible card that confirms and auto-advances — actor class, entity subtype, conduct type, and role-in-act.
**Depends on**: Phase 28 (wizard shell, routing, state, card auto-advance behavior)
**Requirements**: STEP-01, STEP-03
**Scope notes**: Implement `.choice-grid` / `.choice-card(.selected)` with `.title`/`.desc`/`.check` (§5) as a `role="radiogroup"` with roving tabindex, Arrow-key selection, Enter/Space confirm, brass check mark (sanctioned brass use only). Step 1 (actor class → `entityType="individual"` or branch to 1b), Step 1b (4 entity subtypes → exact `entityType` enum literals), Step 3 (closed conduct card set → controlled `allegationClassification` value), Step 4 (closed role-in-act card set). Conduct/role sets are **closed** — no free identity/loyalty/profession cards (S2–S4). "Other (describe)" routes onward to the description step.
**Success Criteria** (what must be TRUE):
  1. On each choice step, tapping a card shows the selected/confirm state then auto-advances to the next step (instant under reduced-motion), with no Next button.
  2. Choosing "An entity" reveals the subtype step and resolves `entityType` to exactly one of the five enum literals; choosing "An individual" sets `entityType="individual"` and skips it.
  3. Conduct type and role-in-act are each chosen from a closed card set with one-line definitions; there is no card for sect, loyalty, opinion, or profession/sector (S2–S4 verified absent).
  4. Returning via Back re-renders a choice step with the previously chosen card already selected and focused; switching an upstream branch invalidates orphaned downstream answers and shows a one-line notice.
  5. The whole card group is keyboard-operable as a radio group (Arrow to move, Enter/Space to confirm) with `aria-checked` state.
**Plans**: TBD
**UI hint**: yes

### Phase 30: Input & Evidence Steps
**Goal**: A submitter supplies the named actor's identity, a documented-act description, the required ≥2 public sources, optional supporting media, and their (anonymous-by-default) contact — with every privacy/identity guardrail enforced inline.
**Depends on**: Phase 29 (choice answers drive identity/description context); Phase 28 (`screens.ts`, validation order, coarse-location blocker)
**Requirements**: STEP-02, STEP-04, STEP-05, EV-01, EV-02, EV-03, EV-04
**Scope notes**: Step 2 Identity — name (required), documented role/title (required, MISMATCH pre-check vs `entityType`), country (required) + coarse governorate/city (street-level address regex blocks inline, S5), optional public identifier (official/registry URL only, no personal socials). Step 5 Describe — `allegationDescription` `min20 max10000` with live counter and inline GROUP_TARGET/PRIVATE_TARGETING/INNOCENT_PARTY/INCITEMENT/HATE_TONE warnings in server order, optional coarse `allegationPeriod`. Step 6 Evidence (keystone) — repeatable `sourceLinks[]` rows (URL + optional source-type select + optional title), live counter, the ≥2-source rule surfaced up front, gate on `sourceLinks.length + sourceFiles.length ≥ 2`, plus the optional non-public **lead note** (never a source, never published). Step 7 Media — `sourceFiles[]` via existing `/api/upload`, labeled supporting-only/non-public with metadata + no-faces safety copy (images/docs only until video stripping lands in Phase 33). Step 8 About you — `isAnonymous` default ON, disables+clears name/email when on. The form contains **no** field for phone, plate, address/street, map pin, personal social handle, sect/identity, loyalty/opinion, or profession-target (S1–S4 — verified absent by design).
**Success Criteria** (what must be TRUE):
  1. The submitter cannot advance the identity step without name, documented role, and country; entering a street-level location is blocked inline with a "use city/governorate only" message (S5).
  2. The evidence step surfaces the "minimum 2 independent public sources" rule up front and blocks Next until links + files total at least 2; the lead note is clearly labeled non-public and never counts toward that total (S6).
  3. The description step requires ≥20 characters and surfaces GROUP_TARGET / PRIVATE_TARGETING / INNOCENT_PARTY / INCITEMENT / HATE_TONE warnings inline in server order, guiding the submitter to rephrase toward conduct.
  4. Supporting media is labeled supporting-only and non-public with safety guidance, and a personal social link is rejected; anonymity is ON by default and enabling it disables and clears name/email (S7).
  5. No input exists anywhere for phone, car plate, home/street address, map pin, personal social handle, sect/identity, loyalty/opinion, or profession-target category (S1–S4 verified absent).
**Plans**: TBD
**UI hint**: yes

### Phase 31: Review, Submit & Confirmation
**Goal**: A submitter reviews exactly what will be sent, affirms it, submits to the live `/api/submit` contract, and gets a clear bilingual confirmation — or a rejection routed back to the offending step.
**Depends on**: Phases 29 and 30 (all step data exists to summarize and submit); Phase 28 (routing for edit-back)
**Requirements**: REV-01, REV-02, REV-03, REV-04
**Scope notes**: Step 9 read-only summary grouped by step with empty optionals shown as "—" and an Edit link per group that routes to `?step=<id>` and returns (§6 `.review-*`). Explicit source list with count badge. Required affirmation checkbox; Submit disabled until affirmation checked AND sources ≥ 2. POST to the **existing** `/api/submit` using the §8 interim mappings (conduct type → `allegationClassification`, role-in-act + source-type encoded until BE lands) so the wizard ships before Phase 33. Success panel with reference id + "what happens next," clears the draft, fires existing GTM `SUBMIT_CLICK`. Failure maps `result.code` (NO_SOURCE/WEAK_SOURCE→Step 6, PRIVATE_TARGETING/GROUP_TARGET/INNOCENT_PARTY/INCITEMENT/HATE_TONE→Step 5, MISMATCH→Step 2) to plain bilingual copy and returns to that step.
**Success Criteria** (what must be TRUE):
  1. The review screen shows every value that will be sent, optional fields rendered as "—" (never hidden), and each group's Edit link routes to that step and back.
  2. Submit stays disabled until the affirmation checkbox is checked and at least 2 sources are present, with an inline message explaining why when it is disabled.
  3. Submitting posts to `/api/submit`, shows a confirmation with a reference id and a "what happens next" note (nothing public yet), and clears the saved draft (S8).
  4. A server rejection maps to a plain bilingual message and returns the submitter to the exact step that caused it.
**Plans**: TBD
**UI hint**: yes

### Phase 32: i18n, RTL & Accessibility
**Goal**: The entire wizard is correct and operable in both languages — full EN/AR `submit` key parity, RTL layout, and complete keyboard/screen-reader support across every step from Phases 28–31.
**Depends on**: Phases 28–31 (all strings and interactions exist to translate, mirror, and audit)
**Requirements**: INTL-01, INTL-02, INTL-03
**Scope notes**: Every new string (≈70 keys per §3) added under the `submit` namespace in both `messages/en.json` and `messages/ar.json` with full parity; `check:i18n` gate passes and the `i18n-checker` agent is clean. RTL correctness: logical properties only, no Arabic uppercase/letter-spacing (pair Latin eyebrows with `[dir=rtl]` reset), LTR-forced machine strings (`.ds-mono`), mirrored progress/chevrons, Arabic-Indic step counter via `Intl.NumberFormat(locale)`. Accessibility: full keyboard operability, focus moves to the step `<h2>` on change, `aria-live="polite"` step announcements, `aria-current="step"` on the active pill, reduced-motion honored, WCAG AA contrast, ≥44px targets. This is a cross-cutting hardening pass over the steps already built.
**Success Criteria** (what must be TRUE):
  1. Every wizard string exists in both EN and AR under the `submit` namespace with full key parity; `check:i18n` passes and the `i18n-checker` audit is clean.
  2. In Arabic the wizard is RTL-correct: progress and chevrons mirror, no Arabic uppercase/letter-spacing, machine strings stay LTR, and the step counter shows Arabic-Indic digits.
  3. The full flow is keyboard-operable end to end, focus moves to the step heading on each change, and steps are announced to screen readers via an aria-live region.
  4. Reduced motion disables slide/auto-advance delay, and all text/token pairs meet WCAG AA contrast (errors never color-only).
**Plans**: TBD
**UI hint**: yes

### Phase 33: Backend Support
**Goal**: The submission backend gains the structured fields the wizard's interim mappings stand in for — so conduct, role, source type, lead note, anonymity default, and video safety are stored first-class instead of encoded.
**Depends on**: Phases 28–31 conceptually (the wizard defines the field shapes), but is **independently shippable in parallel or after** the front-end — the wizard targets the existing `/api/submit` contract via §8 interim mappings, so it is fully buildable before this phase lands.
**Requirements**: BE-01, BE-02, BE-03, BE-04, BE-05, BE-06
**Scope notes**: All via Drizzle migration files (no schema drift; review SQL touching constraints). BE-01 add a `conductType` enum and populate `triageCategory` from it on intake (replacing free-text `allegationClassification` interim). BE-02 add a non-public `leadNote` field — never surfaced publicly, never counted as a source, never folded into `allegationDescription`. BE-03 capture per-source `sourceType` (UN/court/sanctions/HR/journalism/official). BE-04 flip the `isAnonymous` column default to `true`. BE-05 strip video metadata in `/api/upload` (e.g. `ffmpeg -map_metadata -1`) before video uploads are enabled. BE-06 add a `roleInConduct` field for the actor's role in the documented act. Front-end swaps off the interim mappings (§8) once these land. No identity/loyalty/profession columns are introduced (S2–S4 preserved at the schema level).
**Success Criteria** (what must be TRUE):
  1. A submitted conduct type is stored in a real `conductType` enum and drives a populated `triageCategory` on intake, not a free-text field.
  2. A reviewer-only `leadNote` is persisted that is never returned on any public path and never counts as a source.
  3. Each source carries its own `sourceType`, and the actor's `roleInConduct` is stored as a first-class field.
  4. New submissions default to anonymous (`isAnonymous = true`), and uploaded video has its metadata stripped before storage so the media step can safely accept video.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Integrity Core | v1.0 | — | ✅ Complete | 2026-05-31 |
| 2. Auth & RBAC | v1.0 | — | ✅ Complete | 2026-05-31 |
| 3. Submission & Boundary | v1.0 | — | ✅ Complete | 2026-05-31 |
| 4. Verification Pipeline | v1.0 | — | ✅ Complete | 2026-05-31 |
| 5. Legal Release Gate | v1.0 | — | ✅ Complete | 2026-05-31 |
| 6. Public Record & Search | v1.0 | — | ✅ Complete | 2026-05-31 |
| 7. Right-of-Reply | v1.0 | — | ✅ Complete | 2026-05-31 |
| 8. Bilingual Site & Policies | v1.0 | — | ✅ Complete | 2026-05-31 |
| 9. Critical Safety Closure | v1.0 | — | ✅ Complete | 2026-05-31 |
| 10. 2FA & Login UI | v1.1 | — | ✅ Complete | 2026-05-31 |
| 11. Reviewer Console v2 | v1.1 | — | ✅ Complete | 2026-05-31 |
| 12. Search & Filtering | v1.1 | — | ✅ Complete | 2026-05-31 |
| 13. Reply Processing | v1.1 | — | ✅ Complete | 2026-05-31 |
| 14. Transparency Dashboard | v1.1 | — | ✅ Complete | 2026-05-31 |
| 15. Data Hardening | v1.1 | — | ✅ Complete | 2026-05-31 |
| 16. Page Shell & Dashboard | v1.2 | — | ✅ Complete | 2026-05-31 |
| 17. Interactions & Pagination | v1.2 | — | ✅ Complete | 2026-05-31 |
| 18. Filter UX & Mobile | v1.2 | — | ✅ Complete | 2026-05-31 |
| 19. Copy & Polish | v1.2 | — | ✅ Complete | 2026-05-31 |
| 19b. Editorial Redesign Pass 1 | v1.2 | — | ✅ Complete | 2026-05-31 |
| 19c. Editorial Redesign Pass 2 | v1.2 | — | ✅ Complete | 2026-05-31 |
| 24. Publications System | v1.3 | — | ✅ Complete | 2026-06-01 |
| 25. Admin Publication Editor | v1.3 | — | ✅ Complete | 2026-06-01 |
| 26. Social Authentication | v1.3 | — | ✅ Complete | 2026-06-01 |
| 27. Analytics & GTM | v1.3 | — | ✅ Complete | 2026-06-01 |
| 28. Wizard Foundation | v1.4 | 1/5 | In Progress|  |
| 29. Choice Steps | v1.4 | 0/0 | Not started | - |
| 30. Input & Evidence Steps | v1.4 | 0/0 | Not started | - |
| 31. Review, Submit & Confirmation | v1.4 | 0/0 | Not started | - |
| 32. i18n, RTL & Accessibility | v1.4 | 0/0 | Not started | - |
| 33. Backend Support | v1.4 | 0/0 | Not started | - |
