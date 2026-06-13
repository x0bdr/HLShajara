---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Report Submission Wizard
status: planning
last_updated: "2026-06-14T00:00:00.000Z"
last_activity: 2026-06-14
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-14)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** v1.4 Report Submission Wizard — lawful, source-gated, card-driven multi-step intake (named actor + conduct + ≥2 sources). Design contract: `.planning/UI-SPEC.md`.

## Current Position

Phase: 28 — Wizard Foundation
Plan: — (not yet planned)
Status: Planning (roadmap created; `/gsd:plan-phase 28` next)
Progress: [░░░░░░] 0/6 phases (28–33)
Last activity: 2026-06-14 — v1.4 roadmap created (Phases 28–33), v2.0 future placeholders renumbered to 34–37

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

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

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

### v1.3 Specific Notes (prior milestone)

- Publications are broadcast-only (no comments) to maintain editorial control.
- Twitter OAuth callback URL: `/api/auth/callback/twitter`.
- GTM container ID via `NEXT_PUBLIC_GTM_ID`; no tracking if absent; aggregate-only events, no PII.
- `posts` table migration at `drizzle/0000_posts_table.sql` — apply to production DB.

## Session Continuity

Last session: 2026-06-14
Stopped at: v1.4 roadmap created — Phases 28–33 defined, 24/24 requirements mapped, v2.0 placeholders renumbered to 34–37
Resume file: `.planning/ROADMAP.md`
Next command: `/gsd:plan-phase 28`
