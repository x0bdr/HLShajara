# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-31)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** v1.1 Hardening — production readiness, real data, search, 2FA

## Current Position

Milestone: v1.1 Hardening
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-31 — Milestone v1.1 started

Progress: [░░░░░░░░░░] 0% v1.1

## Performance Metrics

**Velocity (v1.0):**
- Total phases completed: 9
- Total commits: 28
- Execution time: 1 day

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

### Blockers/Concerns

- Phase 5 (Legal Release Gate): operating jurisdiction + hosting decision requires qualified counsel; production publish of any living person is blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): start with curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- Arabic search relevance (OpenSearch vs Meilisearch): benchmark on a real Arabic corpus before committing the engine.
- Better Auth on staging: `BETTER_AUTH_SECRET` is now a secure random value; TOTP 2FA requires Better Auth plugin not available in v1.4.7. Email-OTP alternative planned for v1.1.
- GitHub Actions staging deploy: workflow fails because SSH secrets (`STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY`) are not configured in repo settings.

## Session Continuity

Last session: 2026-05-31
Stopped at: v1.1 Hardening initialized
Resume file: None
