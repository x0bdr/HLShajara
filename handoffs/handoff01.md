---
handoff: 01
date: 2026-05-31
time: 18:30
branch: master
commit: d2de6bc
project: HLShajara
project_root: /Users/x0bdr/Desktop/HLShajara
summary: v1.1 Hardening Phases 10-14 code-complete and committed. Phase 15 pending.
---

# Handoff 01 — v1.1 Hardening Phases 10-14 complete

## What was done

- **Phase 10 — 2FA & Login UI**: Configured Better Auth `twoFactor` plugin with TOTP (issuer: "HLShajara", 6 digits, 30s period). Built bilingual `/login` page with 2FA setup flow (QR code) and TOTP verification on login. Added `require2FA()` guard to all reviewer routes.
- **Phase 11 — Reviewer Console v2**: Added structured triage fields (`actorConfirmed`, `conductCategory`, `evidenceMatch`) to `POST /api/review`. Added source verification workflow with `tier`, `snapshotUrl`, `contentHash`. Implemented dual independent review flow: `pending` -> `verified` (first reviewer) -> `ready_to_publish` (second reviewer) -> `published` (senior_reviewer). Added legal/safety gate with `phrasingApproved`, `privacyRechecked`, `hasLawyerSignOff`.
- **Phase 12 — Search & Filtering**: Added filter UI for status, type, and evidence strength in `RecordClient`. Wired `evidence` query param in `GET /api/entity`.
- **Phase 13 — Reply Processing**: Created `GET/POST /api/reply/admin` API for reviewing right-of-reply submissions (requires reviewer + 2FA). Built admin UI at `/admin/replies` with approve/reject actions. Approved replies update entity `rightOfReplyState` to `filed` and write audit log. Rejected/unpublished flow updates entity `status` to `unpublished`.
- **Phase 14 — Transparency Dashboard**: Created public `/dashboard` page with real-time stats (published, rejected, corrected, pending, underReview). Created `GET /api/dashboard` route with aggregation queries. Added `dashboard` locale strings to `messages/en.json` and `messages/ar.json`. Added dashboard nav link to home page.
- **Type fix**: Added `"unpublished"` to `entityStatusEnum` in `src/db/schema.ts` because the reply admin route sets entity status to `unpublished` on rejection. Without this, TypeScript throws `Type '"unpublished"' is not assignable`.

## Current state

- Branch: master @ d2de6bc
- Clean working tree (all changes committed)
- TypeScript compiles cleanly (`npx tsc --noEmit` passes)
- Next.js build succeeds
- Staging deploy: SSH secrets (`STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY`) still missing from repo settings — GitHub Actions workflow cannot deploy

## Next steps (do these first)

1. **Phase 15 — Data Hardening**: Real research data seed (replace demo entities), ClamAV integration for file uploads, distributed rate limits (Redis/upstash), legal gates polish
2. **Add SSH secrets to GitHub repo settings** so staging deploy workflow can run
3. **Add `generateStaticParams()` to `/dashboard/page.tsx`** — currently it is a `"use client"` page but should follow the static params pattern used by other `[locale]` pages

## Blockers

- Staging deploy blocked: GitHub Actions needs `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY` secrets in repo Settings > Secrets and variables > Actions
- Production legal block: Live living-person publication blocked pending lawyer sign-off + jurisdiction/hosting Key Decision (LEGAL-02)

## Key files

- `src/lib/auth.ts` — Better Auth config with 2FA plugin and RBAC helpers
- `src/lib/session.ts` — Server-side session helpers with `require2FA()`
- `src/app/api/review/route.ts` — Reviewer API with dual review, triage, legal gate
- `src/app/api/reply/admin/route.ts` — Admin reply processing API
- `src/app/api/dashboard/route.ts` — Transparency dashboard stats API
- `src/db/schema.ts` — Drizzle schema with dual-review fields, source verification, reply status
- `src/app/[locale]/reviewer/ReviewerClient.tsx` — Reviewer console UI
- `src/app/[locale]/admin/replies/AdminRepliesClient.tsx` — Reply admin UI
- `src/app/[locale]/dashboard/page.tsx` — Transparency dashboard page (needs generateStaticParams)
- `messages/en.json` / `messages/ar.json` — Locale strings including new dashboard keys

## Useful commands

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Deploy to staging (manual, until GH Actions secrets are set)
ssh user@187.77.167.181 "cd /var/www/hlshajara-staging && git pull && npm ci && npm run build && pm2 restart hlshajarah-staging"

# DB migration (if schema changes)
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Gotchas

- The `dashboard` page at `src/app/[locale]/dashboard/page.tsx` is `"use client"` and does NOT export `generateStaticParams()`. Other `[locale]` pages do. This may cause ISR/dynamic issues. Fix: either make it a server component with static params or add a wrapper.
- `entityStatusEnum` now includes `"unpublished"` — if you run `drizzle-kit generate` on an existing DB, you'll need a migration. The enum change is additive so it should be safe, but verify.
- Reply admin `POST` has two actions: `"approve"` and `"unpublish"` (not `"reject"`). The frontend calls `"unpublish"` for rejections.
- All reviewer/admin APIs require BOTH `hasRole("reviewer")` AND `require2FA(session)` — any session without 2FA enabled will get 403.
