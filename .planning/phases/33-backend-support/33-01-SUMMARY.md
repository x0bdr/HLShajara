---
phase: 33-backend-support
plan: 01
subsystem: data
tags: [drizzle, pgenum, migration, anti-drift, conduct, role, triage]
requires: []
provides:
  - "src/lib/constants/conduct.ts (shared conduct/role slug const + triage map)"
  - "submissions.conduct_type, submissions.role_in_conduct, submissions.lead_note columns"
  - "is_anonymous DB default = true (new rows)"
  - "drizzle/0001_backend_support_fields.sql"
affects:
  - "src/db/schema.ts"
  - "src/lib/validation.ts (Plan 02 imports the same const)"
tech-stack:
  added: []
  patterns:
    - "One-source-of-truth slug const imported by both Drizzle pgEnum and (Plan 02) Zod z.enum"
    - "Additive, nullable Drizzle migration (no destructive backfill)"
key-files:
  created:
    - "src/lib/constants/conduct.ts"
    - "drizzle/0001_backend_support_fields.sql"
  modified:
    - "src/db/schema.ts"
decisions:
  - "conductToTriageMap typed Record<ConductType,TriageBucket> so missing/extra keys fail to compile"
  - "is_anonymous default flipped on NEW rows only; no UPDATE/backfill of historical rows (audit trail not rewritten)"
  - "drizzle/0000 baseline + meta seeded into the worktree so the incremental 0001 diffs cleanly"
metrics:
  completed: 2026-06-14
requirements: [BE-01, BE-04, BE-06]
---

# Phase 33 Plan 01: Anti-drift Conduct/Role Foundation Summary

One-liner: Shared `conduct.ts` slug const (14 conduct + 7 role) feeding both Drizzle `pgEnum` and (Plan 02) Zod, plus three additive nullable columns and the `is_anonymous` default flip, all in an additive `drizzle/0001` migration.

## What was built

- **`src/lib/constants/conduct.ts`** — `conductTypes` (14 slugs) + `ConductType`; `roleInConductTypes` (7 slugs) + `RoleInConduct`; `conductToTriageMap: Record<ConductType, TriageBucket>` (exhaustive: 5 perpetrator acts → `direct_perpetrator`, 7 support-network acts → `enabler_network`, `command` → `chain_command`, `other` → `manual_review`); `triageFromConduct()` resolver with `manual_review` fallback. No DB/Zod imports — pure const module. No S2–S4 identity slug.
- **`src/db/schema.ts`** — imports the shared const; adds `conductTypeEnum`/`roleInConductEnum` pgEnums; adds nullable `conductType`, `roleInConduct`, `leadNote` columns to `submissions`; flips `isAnonymous` default `false → true`. `allegationClassification` retained (§8 interim mapping).
- **`drizzle/0001_backend_support_fields.sql`** — additive only: 2 `CREATE TYPE … AS ENUM`, 1 `ALTER COLUMN "is_anonymous" SET DEFAULT true`, 3 `ALTER TABLE "submissions" ADD COLUMN`. No DROP/UPDATE/DELETE. `--> statement-breakpoint` convention (5 breakpoints).

## Migration filename

`drizzle/0001_backend_support_fields.sql` (baseline `drizzle/0000_posts_table.sql` + `drizzle/meta/` seeded so the incremental diff is meaningful).

## Verification results

- `npx tsc --noEmit` — 0 errors.
- `npx drizzle-kit generate` (second run) — "No schema changes, nothing to migrate" → schema and migration in sync.
- `npx next build` — succeeds (all routes compiled).
- Acceptance greps — all pass: 14 conduct + 7 role slugs present; both tuples `as const`; 4 triage buckets referenced; S2–S4 absence = 0; migration additive-only with 5 statement-breakpoints; `allegation_classification` retained.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Seeded `drizzle/` baseline into the worktree**
- **Found during:** Task 2 (migration generation).
- **Issue:** `drizzle/0000_posts_table.sql` + `drizzle/meta/` exist only in the main checkout's untracked working tree, not in this worktree. Without the baseline snapshot, `drizzle-kit generate` would emit a full from-scratch schema, not an incremental `0001`.
- **Fix:** Copied `0000_posts_table.sql` + `meta/_journal.json` + `meta/0000_snapshot.json` from the main checkout into the worktree, then generated `0001`. Committed the full consistent `drizzle/` directory (untracked everywhere — no conflict).
- **Files:** `drizzle/0000_posts_table.sql`, `drizzle/meta/*`.
- **Commit:** 0e8d871.

**2. [Rule 3 - Blocking] Replaced symlinked `node_modules` with a real (APFS clone) directory**
- **Found during:** Task 2 (`next build`).
- **Issue:** The worktree's `node_modules` was a symlink to the main checkout (`/Users/...`); Next 16.2.6 / Turbopack panics ("Symlink points out of the filesystem root") because the worktree resolves under `/private/tmp`. `tsc` was unaffected.
- **Fix:** `cp -c -R` (APFS copy-on-write clone, near-zero disk, same physical volume) to replace the symlink with a real `node_modules`. `node_modules` is gitignored — no repo impact, main checkout untouched.
- **Commit:** n/a (gitignored build-env fix).

## Deferred operator follow-up

- **Apply `drizzle/0000_posts_table.sql` + `drizzle/0001_backend_support_fields.sql` to the production DB (with a backup first).** NOT executed in this phase — applying migrations to a live DB is a deferred operator step per CLAUDE.md + 33-CONTEXT.

## Self-Check: PASSED
- `src/lib/constants/conduct.ts` — FOUND
- `src/db/schema.ts` — FOUND (modified)
- `drizzle/0001_backend_support_fields.sql` — FOUND
- Commits ed1f59a, 0e8d871 — FOUND
