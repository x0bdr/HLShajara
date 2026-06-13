# Requirements — HLShajara v1.4 Report Submission Wizard

Scope: Replace the single-page `/submit` form with a lawful, source-gated, card-driven multi-step wizard (one step per page, auto-advancing choice cards, persistent Back, final review-before-submit). Every entry is a **named actor + documented conduct + ≥2 credible public sources**. Bilingual EN/AR + RTL. Design contract: `.planning/UI-SPEC.md`.

**Hard guardrails (S1–S8, enforced as product requirements):** no phone/car-plate/home-address/map-pin/social-handle fields; no sect/identity fields; no loyalty/opinion field; no profession/sector target categories; coarse location only; source-first with a non-public lead note replacing personal-anecdote-as-evidence; anonymity default-on; nothing published on submit.

## v1.4 Requirements

### Wizard shell & navigation (WIZ)
- [ ] **WIZ-01**: User progresses through the form one step per page (a single step renders at a time in `.page-container-narrow`), not a single scroll.
- [ ] **WIZ-02**: On a choice step, the user taps a card to select; selection shows a confirm state then auto-advances to the next step (instant under `prefers-reduced-motion`). No "Next" button on choice steps.
- [ ] **WIZ-03**: User can go Back from every step except the first; browser Back/Forward navigate steps correctly.
- [ ] **WIZ-04**: User sees a progress indicator (step N of M, completed/current/upcoming); completed steps are tappable to jump back.
- [ ] **WIZ-05**: User's in-progress draft survives refresh and is restorable (sessionStorage); step is reflected in the URL (`?step=`); an unsaved-draft guard warns before leaving.
- [ ] **WIZ-06**: Choosing "individual" skips the entity-subtype step; deep-linking to a later step with incomplete data redirects to the first incomplete step.

### Submission steps (STEP)
- [ ] **STEP-01**: User selects actor class (individual / entity) and, for entities, a subtype card mapping to exactly one of the 5 `entityType` enums.
- [ ] **STEP-02**: User enters identity — name (required), documented role/title (required), coarse location (country + governorate/city, no street), optional public identifier; a type/role MISMATCH is warned inline.
- [ ] **STEP-03**: User selects a conduct type from a closed card set and a role-in-the-act from a closed card set.
- [ ] **STEP-04**: User writes the documented-act description (≥20 chars) and optional coarse time period; client screens warn on banned/private/identity content inline.
- [ ] **STEP-05**: User sets submitter info with anonymity ON by default; enabling anonymity disables and clears name/email.

### Evidence & safety boundaries (EV)
- [ ] **EV-01**: User must provide ≥2 sources (links + files combined) before advancing the evidence step; the 2-source rule is surfaced up front, not after submit.
- [ ] **EV-02**: User can add an optional, clearly-labeled non-public "lead note" that never counts as a source and can never publish on its own (replaces personal-experience-as-evidence).
- [ ] **EV-03**: User can optionally attach supporting media, labeled as supporting-only and non-public, with safety guidance (metadata stripped, no faces of victims/children/bystanders).
- [ ] **EV-04**: The form contains NO field for phone, car plate, home/street address, map pin, personal social handle, sect/identity, loyalty/opinion, or profession-target category (S1–S4 — verified absent by design).
- [ ] **EV-05**: Client-side validation mirrors the server screens (`NO_SOURCE`/`WEAK_SOURCE`/`GROUP_TARGET`/`INCITEMENT`/`HATE_TONE`/`INNOCENT_PARTY`/`PRIVATE_TARGETING`/`MISMATCH`) in server order; street-level location input is blocked inline.

### Review & submit (REV)
- [ ] **REV-01**: User reviews a complete summary of everything that will be sent (optional fields show "—") with an Edit link back to each step.
- [ ] **REV-02**: Submit is disabled until a required affirmation checkbox is checked AND ≥2 sources are present.
- [ ] **REV-03**: Submitting posts to `/api/submit`, shows a confirmation with reference and "what happens next," and clears the draft.
- [ ] **REV-04**: A server rejection maps to a plain bilingual message and returns the user to the offending step.

### i18n, RTL & accessibility (INTL)
- [ ] **INTL-01**: Every new string exists in EN and AR under the `submit` namespace with full key parity (`check:i18n` passes; `i18n-checker` clean).
- [ ] **INTL-02**: The wizard is RTL-correct — logical properties only, no Arabic uppercase/letter-spacing, LTR-forced machine strings, mirrored progress and chevrons, Arabic-Indic step counter.
- [ ] **INTL-03**: The wizard is fully keyboard-operable (radio-group arrow/Enter on cards), moves focus to the step heading on change, announces steps to screen readers, honors reduced motion, and meets WCAG AA contrast.

### Backend support (BE)
- [ ] **BE-01**: Add a `conductType` enum and populate `triageCategory` from it on intake.
- [ ] **BE-02**: Add a non-public `leadNote` field to submissions (never surfaced publicly, never counted as a source).
- [ ] **BE-03**: Capture per-source `sourceType` (UN/court/sanctions/HR/journalism/official).
- [ ] **BE-04**: Flip the `isAnonymous` default to `true`.
- [ ] **BE-05**: Strip video metadata in `/api/upload` (e.g. `ffmpeg -map_metadata -1`) before enabling video uploads.
- [ ] **BE-06**: Add a `roleInConduct` field capturing the actor's role in the documented act.

## Out of Scope (v1.4)

- Charter/copy alignment — stripping the sect-targeting "nurturing environment / Nusayri / Alawites" language from `CONCEPT.md`, `README.md`, `messages/{ar,en}.json`, `WEBSITE-CONTENT.md` (deferred by operator decision 2026-06-14; CRITICAL-0 remains open per `.planning/reviews/2026-06-14_report-form-taxonomy-review.html`)
- Any private-targeting, identity, loyalty, or profession-target field (excluded by design, S1–S4)
- Reviewer-side fields on the public form (`evidenceLevel`, source `tier`, entity `status` — set after intake)
- OpenSearch/Arabic-relevance changes; reviewer console changes; publish-pipeline changes
- Multi-actor / multi-incident single submissions (one named actor per submission for v1.4)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIZ-01 | Phase 28 | Pending |
| WIZ-02 | Phase 28 | Pending |
| WIZ-03 | Phase 28 | Pending |
| WIZ-04 | Phase 28 | Pending |
| WIZ-05 | Phase 28 | Pending |
| WIZ-06 | Phase 28 | Pending |
| EV-05 | Phase 28 | Pending |
| STEP-01 | Phase 29 | Pending |
| STEP-03 | Phase 29 | Pending |
| STEP-02 | Phase 30 | Pending |
| STEP-04 | Phase 30 | Pending |
| STEP-05 | Phase 30 | Pending |
| EV-01 | Phase 30 | Pending |
| EV-02 | Phase 30 | Pending |
| EV-03 | Phase 30 | Pending |
| EV-04 | Phase 30 | Pending |
| REV-01 | Phase 31 | Pending |
| REV-02 | Phase 31 | Pending |
| REV-03 | Phase 31 | Pending |
| REV-04 | Phase 31 | Pending |
| INTL-01 | Phase 32 | Pending |
| INTL-02 | Phase 32 | Pending |
| INTL-03 | Phase 32 | Pending |
| BE-01 | Phase 33 | Pending |
| BE-02 | Phase 33 | Pending |
| BE-03 | Phase 33 | Pending |
| BE-04 | Phase 33 | Pending |
| BE-05 | Phase 33 | Pending |
| BE-06 | Phase 33 | Pending |

**Coverage:** 24/24 v1.4 requirements mapped to exactly one phase. No orphans, no duplicates. (EV-05's `screens.ts` foundation lands in Phase 28; its per-step inline application is exercised by Phases 29–31 but the requirement is owned once, in Phase 28.)

---
*Created: 2026-06-14 for v1.4 Report Submission Wizard milestone*
