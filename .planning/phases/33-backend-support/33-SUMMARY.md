---
phase: 33-backend-support
subsystem: backend
tags: [drizzle, migration, zod, intake, triage, leadnote, ffmpeg, video, anti-drift]
status: complete
lane: lane-b
branch: lane-b/phase-33
plans: ["33-01", "33-02", "33-03"]
requirements: [BE-01, BE-02, BE-03, BE-04, BE-05, BE-06]
migration: drizzle/0001_backend_support_fields.sql
metrics:
  completed: 2026-06-14
  plans_completed: 3
  commits: 6
---

# Phase 33: Backend Support — Phase Summary

One-liner: Purely additive backend that gives the wizard's §8 interim mappings real persisted fields — first-class `conductType`/`roleInConduct` enums + auto-triage, a reviewer-only `leadNote`, per-source `sourceType`, an `is_anonymous` default flip, and ffmpeg-gated video metadata stripping — all via one additive Drizzle migration, with the §8 interim path left intact.

## Scope

Executed as **Lane B** in an isolated worktree (`/tmp/hlshajara-lane-b`, branch `lane-b/phase-33`) concurrent with the frontend chain in the main checkout. Only backend files were touched; no wizard component, `messages/*.json`, `STATE.md`, or `ROADMAP.md` was modified.

## What was built (by requirement)

- **BE-01 — conductType + triage.** `conduct_type` pgEnum (14 closed slugs) as a nullable column on `submissions`; `/api/submit` auto-populates `triageCategory` from `conductType` via the shared `conductToTriageMap`/`triageFromConduct` (4 buckets: `direct_perpetrator | enabler_network | chain_command | manual_review`; `manual_review` fallback). Reviewer override (`/api/review`) still wins post-intake.
- **BE-02 — leadNote.** Nullable `lead_note` text column added; `/api/submit` swapped accept-but-ignore → **persist**. Provably NEVER returned on any public path, NEVER counted as a source (`sourceCount` stays `sourceLinks.length`), NEVER folded into `allegationDescription` (grep-gated).
- **BE-03 — per-source sourceType.** Optional `sourceType` (`un|court|sanctions|hr|journalism|official`) on the `sourceLinks` JSONB item shape; rides through intake unchanged (no new table).
- **BE-04 — isAnonymous default.** `is_anonymous` DB default flipped `false → true` for **new rows only** (no backfill, no audit-log rewrite).
- **BE-05 — video metadata strip.** `/api/upload` gains an ffmpeg-gated video branch (`ffmpeg -map_metadata -1 -c copy`) that strips metadata before scan/hash; fails closed with 503 `FFMPEG_UNAVAILABLE` when the binary is absent. Image (sharp EXIF) + document paths unchanged. No new npm dep; thin exec helper mirroring `clamav.ts`.
- **BE-06 — roleInConduct.** `role_in_conduct` pgEnum (7 closed slugs) as a nullable column; persisted on intake.

**Anti-drift foundation:** `src/lib/constants/conduct.ts` is the single source of truth for the 14 conduct + 7 role slugs. Both the Drizzle `pgEnum` and the Zod `z.enum` import it — the client wizard and server intake cannot drift (the `allegationClassification` lesson, closed).

## Files changed

Created:
- `src/lib/constants/conduct.ts` — shared slug const + `ConductType`/`RoleInConduct` + `conductToTriageMap` + `triageFromConduct`
- `src/lib/media-metadata.ts` — `isFfmpegAvailable` + `stripVideoMetadata` (Node-built-in exec helper)
- `drizzle/0001_backend_support_fields.sql` — the migration (+ `drizzle/0000` baseline + `drizzle/meta/*` seeded so the incremental diff is clean)

Modified:
- `src/db/schema.ts` — 2 pgEnums, 3 nullable columns, `is_anonymous` default flip
- `src/lib/validation.ts` — `submitSchema` extended with the 4 optional fields (closed sets via shared const)
- `src/app/api/submit/route.ts` — persist the 4 fields + auto-derive `triageCategory`
- `src/db/persist.ts` — documenting comment on the leadNote-never-counted invariant
- `src/app/api/upload/route.ts` — ffmpeg-gated video branch (fail closed)

## Migration

`drizzle/0001_backend_support_fields.sql` — additive only: 2 `CREATE TYPE … AS ENUM` (conduct_type, role_in_conduct), 1 `ALTER COLUMN "is_anonymous" SET DEFAULT true`, 3 `ALTER TABLE "submissions" ADD COLUMN` (conduct_type, role_in_conduct, lead_note). No DROP/UPDATE/DELETE; `--> statement-breakpoint` convention. **Generation only — NOT applied to any database.**

## Verification results

- `npx tsc --noEmit` — **0 errors**.
- `npx drizzle-kit generate` (second run) — **"No schema changes, nothing to migrate"** (schema ⇄ migration in sync).
- `npx next build` — **succeeds** (all routes compiled).
- `is_anonymous` default true, columns nullable/additive, `allegation_classification` retained.
- **S2–S4 identity-field absence** across all phase-touched source — **0 matches**.
- **leadNote never on any public read path** (real paths: `api/entity`, `api/posts`, `api/dashboard`, `api/reply`, `api/key-decisions`, `[locale]/publications`, `[locale]/record`, `lib/labels.ts`) — **0 matches**; leadNote appears only in `submit/route.ts` + `validation.ts` + the const/schema.
- Wizard files / `STATE.md` / `ROADMAP.md` — **not modified** (lane isolation preserved).

## Commits (branch lane-b/phase-33)

- `ed1f59a` feat(33-01): shared anti-drift conduct/role constants + triage map
- `0e8d871` feat(33-01): conduct/role pgEnums + nullable columns + isAnonymous default flip
- `e046aea` feat(33-02): extend submitSchema with conductType/roleInConduct/sourceType
- `8638672` feat(33-02): persist conduct/role/leadNote on intake + auto-populate triageCategory
- `32b7489` feat(33-03): ffmpeg exec helper — availability probe + video metadata strip
- `c431e15` feat(33-03): ffmpeg-gated video branch in /api/upload (fail closed)

## Deviations

- **[Rule 3] Seeded `drizzle/` baseline** (0000 SQL + meta) from the main checkout into the worktree so the incremental `0001` diffs cleanly (the baseline is untracked everywhere — no conflict).
- **[Rule 3] Replaced the symlinked `node_modules`** with a real APFS-clone directory: Next 16.2.6 / Turbopack panics on a `node_modules` symlink that escapes the worktree's filesystem root. `node_modules` is gitignored; main checkout untouched. (tsc was unaffected throughout.)
- **[Rule 1] `Buffer.from()` wrap** on the stripped video buffer to satisfy `Buffer<ArrayBuffer>` typing (matches the existing image branch).
- **[Correction] leadNote-public grep path fix** — the plan referenced `api/entities` (plural, non-existent); used the real `api/entity` + sibling public paths so the privacy assertion is meaningful.
- **[Minor] leadNote length** kept at the pre-existing `max(5000)` (fork-point prereq) instead of re-adding at `max(10000)` — no drift, per lane instructions.
- **[Grep-gate wording]** reworded a doc comment that named `fluent-ffmpeg`/`ffmpeg-static` so the "no heavy dep" grep gate passes on intent, not comment text.

## Deferred follow-ups (operator / infra — NOT done in this phase)

1. **Apply `drizzle/0000_posts_table.sql` + `drizzle/0001_backend_support_fields.sql` to the production DB, with a backup first.** Migration generation only here; applying to a live DB is a deferred operator step (CLAUDE.md + 33-CONTEXT).
2. **Install the `ffmpeg` system binary** on any host that enables video uploads. Until then video stays hidden in the UI and `/api/upload` fails closed (503) rather than storing unstripped video. ffmpeg is a system dependency, not an npm package.
3. **Front-end swap-off of the §8 interim mappings** (conduct-slug-in-classification, role-in-entityRole, type-in-title) to the new first-class fields — a follow-up after Phase 33 merges. Phase 33 is additive; the existing wizard keeps working unchanged.

## Merge note

Do NOT merge `lane-b/phase-33` into master here — the orchestrator merges it after the frontend chain reaches its merge point. The changed files are disjoint from the wizard chain, so the merge is clean.

## Self-Check: PASSED
- All created/modified files FOUND; all 6 commits FOUND on `lane-b/phase-33`.
