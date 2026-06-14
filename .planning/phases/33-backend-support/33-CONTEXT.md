# Phase 33: Backend Support - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the **structured backend fields** the wizard's §8 interim mappings stand in for — purely **additive backend**,
runs as **Lane B in an isolated git worktree concurrent with the frontend chain**, merges into main last.

- **BE-01** `conductType` enum + populate `triageCategory` from it on intake.
- **BE-02** non-public `leadNote` field — persist it (the fork-point prerequisite already made `/api/submit`
  accept-but-ignore it; this phase adds the column + writes it).
- **BE-03** per-source `sourceType` (UN/court/sanctions/HR/journalism/official).
- **BE-04** flip `isAnonymous` column default to `true`.
- **BE-05** strip **video** metadata in `/api/upload` (`ffmpeg -map_metadata -1`) before video uploads are enabled.
- **BE-06** first-class `roleInConduct` field.

All via **Drizzle migration files** (no schema drift; review SQL touching constraints; back up before applying on a
server). **No identity/loyalty/profession columns** are introduced (S2–S4 preserved at the schema level). The
**front-end swap-off** (removing §8 interim mappings) is **deferred to a follow-up** — Phase 33 is additive only, so
the existing wizard keeps working unchanged.
</domain>

<decisions>
## Implementation Decisions

### Shared enum constants (anti-drift)
- Create `src/lib/constants/conduct.ts` exporting `conductTypes` (the 14 Phase-29 slugs:
  `detention,torture,disappearance,killing,sexualViolence,financing,arms,laundering,propaganda,informing,seizure,
  detentionSite,command,other`) `as const` + `ConductType`, and `roleInConductTypes`
  (`perpetrator,commander,financier,supplier,informant,owner,other`) + `RoleInConduct`. Both Drizzle `pgEnum` and Zod
  `z.enum` IMPORT these — one source of truth so client/server can't drift (the `allegationClassification` lesson).

### conductType + triageCategory (BE-01)
- `conductType` = `pgEnum("conduct_type", conductTypes)`, new **nullable** column on the submissions table.
- Deterministic `conductToTriageMap: Record<ConductType,string>` in the same constants file:
  perpetrator acts → `direct_perpetrator`; support-network acts → `enabler_network`; `command` → `chain_command`;
  `other` → `manual_review`. `/api/submit` (and/or `persist.ts`) auto-populates `triageCategory` from `conductType`
  on intake when `conductType` is present (falls back to `manual_review`). Reviewers can still override.

### leadNote (BE-02)
- New **nullable** `text` `leadNote` column. `/api/submit` swaps accept-but-ignore → **persist** it. It is NEVER
  returned on any public path, NEVER counted as a source, NEVER folded into `allegationDescription`. Add a test/grep
  asserting no public query selects it.

### roleInConduct (BE-06)
- `roleInConductEnum = pgEnum("role_in_conduct", roleInConductTypes)`, new **nullable** column (closed 7-role set).
  Free-text context for "other" rides in `allegationDescription` as today.

### sourceType (BE-03)
- Extend the intake `sourceLinks` JSONB object shape to `{url, title?, sourceType?}` (`sourceType` ∈
  `un|court|sanctions|hr|journalism|official`). No new table — intake sources are ephemeral pre-review. Zod
  `sourceLinks[]` item schema gains optional `sourceType`. (Front-end swap-off from the `[TYPE:]`-in-title interim is
  a deferred follow-up.)

### isAnonymous default flip (BE-04)
- Migration `ALTER COLUMN is_anonymous SET DEFAULT true`. **New rows only** — existing rows keep their recorded value;
  **no backfill, no audit-log rewrite** (rewriting history would falsify the immutable audit trail).

### Video metadata stripping (BE-05)
- `/api/upload`: keep `sharp` EXIF strip for images; add a video branch that runs `ffmpeg -map_metadata -1`. **Gate
  video behind ffmpeg availability** — detect `ffmpeg -version`; if absent, reject video uploads with a clear
  503/`code` (video stays hidden in the UI until this ships). `ffmpeg` is a system binary (document the dependency;
  optional/lazy require for any node wrapper). Images/docs path unchanged.

### Migration safety
- All new columns **nullable**, additive, **no destructive backfill** of historical rows (can't deterministically map
  old free-text `allegationClassification` → enum). Generate via the project's drizzle-kit flow; commit the generated
  SQL as `drizzle/0001_*.sql` mirroring `0000_posts_table.sql` conventions (`--> statement-breakpoint`). **Back up
  before any server apply**; applying to prod is a deferred operator step (do NOT apply to prod in this phase).

### Claude's Discretion
- Exact triage category string values (within the 4-bucket scheme) and migration filename suffix.
- Whether ffmpeg is wrapped via a thin exec helper vs `fluent-ffmpeg` (prefer no new heavy dep).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets / Source of Truth
- `src/db/schema.ts` — submissions table (`allegationClassification`, `triageCategory` text, `isAnonymous` default
  false @~line 220, `entityRole`, `sourceLinks`/`sourceFiles` JSONB, immutable audit-log table). Add columns + enums here.
- `src/lib/validation.ts` — Zod `SubmitInput`; import the shared enum consts; add optional `conductType`,
  `roleInConduct`, `sourceLinks[].sourceType`, and the already-added `leadNote`.
- `src/app/api/submit/route.ts` + `src/db/persist.ts` — intake insert + triage; swap leadNote accept-ignore → persist;
  auto-populate triageCategory from conductType.
- `src/app/api/upload/route.ts` — `sharp` image EXIF strip; add the ffmpeg video branch + availability gate.
- `drizzle/` (`0000_posts_table.sql`), `drizzle.config.ts`, `package.json` drizzle-kit scripts — migration conventions.

### Established Patterns
- CLAUDE.md: DB changes via migration files only; no schema drift; back up before server migrations; Zod at every
  boundary; new env/system deps documented.
- Anti-drift precedent: `screens.ts` lifted to one source of truth (Phase 28). Mirror that for the enum consts.

### Integration Points
- Disjoint from wizard component files → clean merge into main. Shared files with the fork-point prerequisite:
  `validation.ts` (additive optional fields) + `route.ts` (accept-ignore → persist) — additive, branched after the
  prerequisite, so the merge is clean.
</code_context>

<specifics>
## Specific Ideas
- conductType enum values MUST equal the 14 Phase-29 slugs exactly (shared const guarantees it).
- triage buckets: `direct_perpetrator | enabler_network | chain_command | manual_review`.
- Apply-to-prod of generated migrations is a deferred operator follow-up (record it), NOT executed in this phase.
</specifics>

<deferred>
## Deferred Ideas
- Front-end swap-off of §8 interim mappings (conduct-slug-in-classification, role-in-entityRole, type-in-title) to the
  new first-class fields → follow-up after Phase 33 merges.
- Applying `drizzle/0000_posts_table.sql` + the new `0001_*` migration to the production DB → operator follow-up
  (ledger), with backup first.
</deferred>
