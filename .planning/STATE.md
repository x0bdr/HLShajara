# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-31)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** v1.2 Frontend Polish — UI consistency, shared shell, token compliance, mobile UX

## Current Position

Milestone: v1.2 Frontend Polish
Phase: Phase 16 — Not started
Plan: `.planning/v1.2-FIXING-PLAN.md`
Status: UI audit complete (16/24). Fixing plan defined. Ready to execute.
Last activity: 2026-05-31 — v1.2 milestone initialized, fixing plan created

Progress: [░░░░░░░░░░░░░░░░░░░░] 0% v1.2

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
- Total phases planned: 4 (Phases 16–19)
- Estimated execution time: 3–4 days

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

### Blockers/Concerns

- Phase 5 (Legal Release Gate): operating jurisdiction + hosting decision requires qualified counsel; production publish of any living person is blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): start with curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- Arabic search relevance (OpenSearch/Meilisearch): benchmark on a real Arabic corpus before committing the engine.
- Better Auth on staging: `BETTER_AUTH_SECRET` is now a secure random value; TOTP 2FA working via Better Auth twoFactor plugin.
- GitHub Actions staging deploy: workflow fails because SSH secrets are not configured in repo settings. Manual deploy via SSH works.

### v1.2 Specific Notes

- UI audit score: 16/24. Target: 22/24.
- Biggest visual gap: Dashboard page uses bright rainbow colors (`#16a34a`, `#dc2626`, etc.) instead of design tokens.
- Biggest UX gap: Record, Submit, Entity, Login, Dashboard pages have no Header or Footer.
- Biggest interaction gap: Evidence cards are not clickable.
- All backend APIs are solid; v1.2 is 100% frontend work.

## Session Continuity

Last session: 2026-05-31
Stopped at: v1.2 milestone initialized, fixing plan and UI review created
Resume file: `.planning/v1.2-FIXING-PLAN.md`
