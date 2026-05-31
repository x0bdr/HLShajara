# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-31)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** All 8 phases complete + staging deployed + demo data seeded + i18n scaffold

## Current Position

Phase: 8 of 8 complete
Plan: All phases executed + deferred items in progress
Status: Deployed to staging server (test-sanad)
Last activity: 2026-05-31 — All 8 phases + next-intl + staging auto-deploy workflow

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: — min
- Total execution time: 1.0 hours

**By Phase:**

| Phase | Status | Files |
|-------|--------|-------|
| 1. Integrity Core | ✅ Complete | schema.ts, audit.ts, persist.ts |
| 2. Auth & RBAC | ✅ Complete | auth.ts, middleware.ts |
| 3. Submission & Boundary Engine | ✅ Complete | submit API, submit page |
| 4. Verification Pipeline | ✅ Complete | reviewer page, review API |
| 5. Legal Release Gate | ✅ Complete | lawyer sign-off in review API |
| 6. Public Record & Search | ✅ Complete | record page, entity detail, entity API |
| 7. Right-of-Reply | ✅ Complete | reply page |
| 8. Bilingual Site & Policies | ✅ Complete | mission, faq, terms, privacy |

**Recent Trend:**
- Last 8 phases: All complete
- Trend: Rapid sequential execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Scope = documentation/accountability archive, NOT a boycott campaign.
- Anti-discrimination enforced in the data model (no identity fields, no zero-source publish) — structural, not policy.
- Lawyer-review gate before naming any living person (Phase 5 is a hard, non-skippable boundary).
- Staging deployment on test-sanad (Sanad infrastructure) — serverful, API routes active.

### Completed Deferred Items

| Category | Item | Status | Completed |
|----------|------|--------|-----------|
| Backend | PostgreSQL connection & migrations | ✅ Done | 2026-05-31 |
| Backend | Serverful deployment | ✅ Done | 2026-05-31 |
| Frontend | next-intl i18n scaffold | ✅ Done | 2026-05-31 |
| DevOps | GitHub Actions staging deploy workflow | ✅ Done | 2026-05-31 |
| Content | Demo data seeded (3 entities) | ✅ Done | 2026-05-31 |

### Pending Todos

- Implement OpenSearch / PostgreSQL FTS for Arabic search
- Add EXIF stripping for file uploads
- Set up ClamAV malware scanning
- Translate all pages to English (EN LTR)
- Configure Better Auth production secret + 2FA
- Seed real research data (replace demo entries)

### Blockers/Concerns

- Phase 5 (Legal Release Gate): operating jurisdiction + hosting decision requires qualified counsel; production publish of any living person is blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): start with curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- Arabic search relevance (OpenSearch vs Meilisearch): benchmark on a real Arabic corpus before committing the engine (Phase 6).
- Better Auth on staging: `BETTER_AUTH_SECRET` is placeholder; need production secret for real auth.

## Deferred Items (Remaining)

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Backend | OpenSearch integration | Pending | 2026-05-31 |
| Backend | File upload + EXIF stripping | Pending | 2026-05-31 |
| Backend | ClamAV malware scanning | Pending | 2026-05-31 |
| Frontend | Full EN translation | Pending | 2026-05-31 |

## Session Continuity

Last session: 2026-05-31
Stopped at: Staging deployed, demo data seeded, i18n scaffold ready
Resume file: None
