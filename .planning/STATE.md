# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-31)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** v1.2 shipped + 2 editorial redesign passes. Next: UI audit re-run or v2.0 planning.

## Current Position

Milestone: v1.2 Frontend Polish
Phase: All 4 phases (16–19) complete
Plan: `.planning/v1.2-FIXING-PLAN.md`
Status: All 12 UI requirements implemented and deployed to staging
Last activity: 2026-06-01 — v1.2 frontend polish + 2 editorial redesign passes deployed

Progress: [████████████████████] 100% v1.2

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

- UI audit score baseline: 16/24. Target: 22/24. Re-audit pending.
- All pages now have shared Header + Footer via `PageShell` component.
- Dashboard redesigned with token-compliant muted palette (no rainbow colors).
- Evidence cards are clickable and route to entity detail.
- Pagination added to homepage (server-side) and `/record` (client-side).
- Loading skeletons added to Record, Entity Detail, and Dashboard.
- Mobile filter toggle added to ArchiveHome (<860px).
- Translation status labels fixed to match real DB enum values.
- All 12 UI requirements marked Done in `v1.2-FIXING-PLAN.md`.
- **Pass 1**: Editorial archive layout — case file entity detail, form sections, login card, reviewer cards, modal system.
- **Pass 2**: Larger hero seal + kicker, clear filters button, clickable source links, improved empty states.

## Session Continuity

Last session: 2026-06-01
Stopped at: v1.2 + 2 design passes deployed to staging
Resume file: `.planning/v1.2-FIXING-PLAN.md`
