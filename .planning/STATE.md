---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Report Submission Wizard
status: executing
stopped_at: Completed 28-03-PLAN.md — pure wizard engine (state.ts reducer bound to SubmitInput, registry.ts STEPS+branching/reachability, persistence.ts hls.submit.draft.v1) + 11 shell i18n keys (EN/AR parity). 3/5 Phase 28 plans done.
last_updated: "2026-06-14T00:31:00.000Z"
last_activity: 2026-06-14
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 5
  completed_plans: 3
  percent: 60
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-14)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** Phase 28 — wizard-foundation

## Current Position

Phase: 28 (wizard-foundation) — EXECUTING
Plan: 4 of 5
Status: Ready to execute
Progress: [██████░░░░] 60%
Last activity: 2026-06-14

## Performance Metrics

**Velocity (v1.0):**

- Total phases completed: 9
- Total commits: 28
- Execution time: 1 day

**Velocity (v1.1):**

- Total phases completed: 6 (Phases 10–15)
- Total commits: 12
- Execution time: 1 day

**Velocity (v1.2):**

- Total phases completed: 4 (Phases 16–19) + 2 design passes
- Total commits: 5
- Execution time: 2 sessions

**Velocity (v1.3):**

- Total phases completed: 4 (Phases 24–27)
- Execution time: 1 session

**Velocity (v1.4 — in progress):**

| Phase | Plan | Duration | Tasks | Files | Commits |
|-------|------|----------|-------|-------|---------|
| 28 | 01 | ~12 min | 2 | 3 | 88bcffe (test), 75be711 (feat), bc01155 (refactor) |
| Phase 28 P02 | ~10 min | 2 tasks | 1 files |
| 28 | 03 | ~16 min | 3 | 6 | 4387f0d (test), abb9a2f (feat), 886ef62 (feat), b2b312d (feat) |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

**Phase 28 (28-01):**

- `src/lib/screens.ts` is a **verbatim (byte-identical) lift** of the persist.ts regex arrays + screen* bodies; persist.ts now re-imports from it → one source of truth, client/server cannot drift (EV-05).
- `runScreens` `sourceCount` mirrors `sourceLinks.length` ONLY — uploaded files do NOT count toward WEAK_SOURCE (matches `route.ts:32`). Documented in screens.ts + asserted by parity fixture. Phase 30 must wire the evidence step accordingly.
- Parity regression (`scripts/screens-parity-check.js`) drives the TS lib via Node 24 `--experimental-strip-types` instead of installing a test framework (package installs avoided).
- [Phase ?]: Phase 28 (28-02): WIZARD/STEPPER CSS is token-only + logical-props-only; brass (--brass-500) sanctioned ONLY on .choice-card .check; reduced-motion override disables wizard slide + card lift + auto-advance so downstream wizard components ship zero inline color/layout styles.

**Phase 28 (28-03):**

- `src/lib/wizard/state.ts`: `WizardState.form` is typed AS `SubmitInput` (imported from `@/lib/validation`, never redeclared) — the single anti-drift guarantee binding the wizard to `/api/submit`. The legacy `SubmitClient.tsx` mutators were ported verbatim into reducer cases.
- `isAnonymous` seeds to **true** at the client state (UI-SPEC §8 / S7 anonymity-default); the DB-column default flip remains **BE-04 in Phase 33**. This is a UI-side default only.
- `RESTORE_DRAFT` merges only a hard-coded allowlist of known `SubmitInput` keys from the untrusted `sessionStorage` draft (T-28-06) — never spreads `action.draft`, closing prototype-pollution / arbitrary-key injection from a tampered draft.
- `state.ts ↔ registry.ts` have an intentional circular TYPE reference (`state.ts` imports `StepId`, `registry.ts` imports `WizardState`), both `import type` — resolved by `tsc`, erased at runtime, keeping both modules runtime-pure.
- Draft persistence uses `sessionStorage` (cleared on tab close), **not** `localStorage` (T-28-05 shared-device), keyed on `hls.submit.draft.v1`; all three functions SSR-guarded + try/catch (never throw on quota/parse).
- TDD reducer test drives the pure TS via Node `--experimental-strip-types` (Plan 01 precedent) — no test framework installed (T-28-SC zero installs).
- Registry wires only the **two scaffold steps** for Phase 28; Phases 29–31 append the real 9. The branch-skip (`entityType === "individual"`) + visible-count (`Step N of M` doesn't count skipped "1b") contract is encoded now via `isReachable`/`firstIncompleteStep`/`isCountedStep`/`visibleStepCount`.
- Shell i18n: only the **11** foundation keys added to EN+AR under `submit` with parity; the full ~70-key set is deferred to **Phase 32**.

### v1.4 Architecture Notes

- **Design contract:** `.planning/UI-SPEC.md` is authoritative for this milestone. Guardrails S1–S8 (no PII/identity/loyalty/profession-target fields; coarse location; source-first; anonymity default-on; nothing published on submit) are product requirements enforced in the UI in addition to the server screens.
- **Front-end / backend split:** Phases 28–32 (the wizard) target the **existing** `/api/submit` contract via the §8 interim mappings, so the wizard is fully buildable before backend additions land. Phase 33 (backend support) can ship in parallel or after; the front-end swaps off the interim mappings once it lands.
- **Shared validation:** client screens live in `src/lib/screens.ts` (Phase 28) and mirror `persist.ts` server screens in server order so client and server cannot drift.
- **CSS:** new `/* ===== WIZARD / STEPPER ===== */` block in `src/components/hlshajara.css`, tokens only — no new colors, no Tailwind utilities. Brass reserved for evidence-strength; the card check mark is the only sanctioned brass use in the wizard.
- **This supersedes** the rejected 8-sector boycott taxonomy (see `.planning/reviews/2026-06-14_report-form-taxonomy-review.html`); reintroducing any S1–S4 field is rejected at design review, not negotiated.

### Blockers/Concerns

- **CRITICAL-0 still open:** charter/copy alignment (stripping sect-targeting language from `CONCEPT.md`/`README.md`/`messages`/`WEBSITE-CONTENT.md`) is deferred out of v1.4 scope by operator decision 2026-06-14, but remains open per the taxonomy review.
- **Phase 33 / BE-05:** video uploads are hidden in the media step (images/docs only) until `ffmpeg -map_metadata -1` video metadata stripping lands; do not enable video before then.
- Phase 5 (Legal Release Gate): production publish of any living person remains blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- **Latent screen properties surfaced by 28-01 (pre-existing v1.0 behavior, mirrored not changed):** (1) `INCITEMENT` token set is a strict subset of the group-target screen, so it is effectively unreachable — `GROUP_TARGET` fires first. (2) The Arabic screen regexes use ASCII `\b` boundaries, so purely-Arabic terms only match when ASCII-flanked. Both are candidates for the incitement/hate-tone classifier rework; changing them now would alter `/api/submit` behavior.

### v1.3 Specific Notes (prior milestone)

- Publications are broadcast-only (no comments) to maintain editorial control.
- Twitter OAuth callback URL: `/api/auth/callback/twitter`.
- GTM container ID via `NEXT_PUBLIC_GTM_ID`; no tracking if absent; aggregate-only events, no PII.
- `posts` table migration at `drizzle/0000_posts_table.sql` — apply to production DB.

## Session Continuity

Last session: 2026-06-14T00:31:00.000Z
Stopped at: Completed 28-03-PLAN.md — pure wizard engine (`src/lib/wizard/{state,registry,persistence}.ts`) bound to `SubmitInput` + 11 shell i18n keys (EN/AR parity). 3/5 Phase 28 plans done.
Resume file: None
Next command: `/gsd:execute-phase 28` (resume at plan 28-04 — Chrome components: WizardProgress / WizardNav / WizardPanel)
