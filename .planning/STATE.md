# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-31)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** v1.0 milestone complete — planning v1.1 Hardening

## Current Position

Phase: 9 of 9 complete (v1.0 Foundation shipped)
Milestone: v1.0 — Complete
Status: Deployed to staging server (test-sanad)
Last activity: 2026-05-31 — Milestone audit, critical safety closure (Phase 9), milestone completion

Progress: [██████████] 100% v1.0

## Performance Metrics

**Velocity:**
- Total phases completed: 9
- Total commits: 28
- Execution time: 1 day

**By Phase:**

| Phase | Status |
|-------|--------|
| 1. Integrity Core | ✅ Complete |
| 2. Auth & RBAC | ✅ Complete |
| 3. Submission & Boundary Engine | ✅ Complete |
| 4. Verification Pipeline | ✅ Complete |
| 5. Legal Release Gate | ✅ Complete |
| 6. Public Record & Search | ✅ Complete |
| 7. Right-of-Reply | ✅ Complete |
| 8. Bilingual Site & Policies | ✅ Complete |
| 9. Critical Safety Closure | ✅ Complete |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

### Completed Deferred Items

| Category | Item | Status | Completed |
|----------|------|--------|-----------|
| Backend | PostgreSQL connection & migrations | ✅ Done | 2026-05-31 |
| Backend | Serverful deployment | ✅ Done | 2026-05-31 |
| Frontend | next-intl i18n scaffold | ✅ Done | 2026-05-31 |
| Frontend | Full EN translation (all pages) | ✅ Done | 2026-05-31 |
| DevOps | GitHub Actions staging deploy workflow | ✅ Done | 2026-05-31 |
| DevOps | Static export for GitHub Pages | ✅ Done | 2026-05-31 |
| Content | Demo data seeded (3 entities) | ✅ Done | 2026-05-31 |
| Backend | Server-side PostgreSQL search | ✅ Done | 2026-05-31 |
| Backend | Right-of-reply API endpoint | ✅ Done | 2026-05-31 |
| Backend | File upload endpoint | ✅ Done | 2026-05-31 |
| Backend | EXIF/GPS metadata stripping (Sharp) | ✅ Done | 2026-05-31 |
| Backend | Auth enforcement on API routes | ✅ Done | 2026-05-31 |
| Backend | Audit trail wired to state-changing routes | ✅ Done | 2026-05-31 |
| Backend | RBAC enforcement (canPublish, hasRole) | ✅ Done | 2026-05-31 |

### Pending Todos (v1.1)

- Implement OpenSearch / PostgreSQL FTS for Arabic search relevance
- Set up ClamAV malware scanning
- Configure Better Auth 2FA (email-OTP alternative to TOTP)
- Seed real research data (replace demo entries)
- Build login UI page
- Implement structured triage in reviewer console
- Build source verification workflow
- Enforce dual independent review
- Build reply processing admin workflow
- Build transparency dashboard
- Add filter UI for status/type/evidence strength
- Create dedicated anti-discrimination policy page
- Record operating jurisdiction + hosting Key Decision

### Blockers/Concerns

- Phase 5 (Legal Release Gate): operating jurisdiction + hosting decision requires qualified counsel; production publish of any living person is blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): start with curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- Arabic search relevance (OpenSearch vs Meilisearch): benchmark on a real Arabic corpus before committing the engine.
- Better Auth on staging: `BETTER_AUTH_SECRET` is now a secure random value; TOTP 2FA requires Better Auth plugin not available in v1.4.7. Email-OTP alternative possible.
- GitHub Actions staging deploy: workflow fails because SSH secrets (`STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY`) are not configured in repo settings.

## Session Continuity

Last session: 2026-05-31
Stopped at: v1.0 milestone complete, planning v1.1 Hardening
Resume file: None
