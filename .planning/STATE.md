---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Report Submission Wizard
status: shipped_to_staging_e2e_passed
stopped_at: v1.4 ALL phases (28–33) code-complete + integrated on master. Built via two parallel lanes — frontend chain 29→30→31→32 (main tree) + backend 33 (isolated worktree, merged at c3ad335). Multi-model review (0 Critical) + i18n-checker passed; 8 review fixes applied (9cc1f12). All gates green (tsc, check:i18n 318 keys, next build, 7 wizard gate scripts). Remaining: human EN/AR staging E2E sign-off + recorded deferred follow-ups.
last_updated: "2026-06-14T11:00:00.000Z"
last_activity: 2026-06-14
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 17
  completed_plans: 17
  percent: 100
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-14)

**Core value:** Every published claim concerns a named individual or entity, backed by a credible public source. No source, no publication. No group, no identity-based targeting.
**Current focus:** Phase 28 — wizard-foundation

## Current Position

Milestone v1.4 (Report Submission Wizard): Phases 28–33 ALL code-complete + integrated on master.
Progress: [██████████] 100% (6/6 phases, 17/17 plans)
Status: code-complete; pending human EN/AR staging E2E sign-off before milestone close.
Last activity: 2026-06-20 - Completed quick task 260620-2la: TipTap publication editor replacing the raw HTML box; structural stored-XSS fix on the public publications page (+ JSON-LD </script> escape); multi-model review 1 High (all fixed)

**v1.4 delivery (this session):** built in two parallel lanes — frontend wizard chain 29→30→31→32
(main tree, sequential) + backend Phase 33 (isolated git worktree, concurrent, merged at `c3ad335`).
40 commits since the Phase-28 close. All 5 phases planned in parallel up front; cross-phase
registry-order bug (identity vs conduct) and Phase-31 step-slug/registration blockers caught at
plan-check and fixed before execution. Multi-model review (Claude+Codex+Kimi, 0 Critical) + i18n-checker
clean; 8 review fixes applied (`9cc1f12`) incl. publish-path interim-token stripping (protects the public
record). Guardrails S1–S8 verified structurally intact; `leadNote` proven never-public; evidence gate
links-only client+server. Gates green: tsc, check:i18n (318 keys / 163 submit, EN/AR parity), next build,
all 7 wizard gate scripts.

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

**Velocity (v1.4 — in progress):**

| Phase | Plan | Duration | Tasks | Files | Commits |
|-------|------|----------|-------|-------|---------|
| 28 | 01 | ~12 min | 2 | 3 | 88bcffe (test), 75be711 (feat), bc01155 (refactor) |
| Phase 28 P02 | ~10 min | 2 tasks | 1 files |
| 28 | 03 | ~16 min | 3 | 6 | 4387f0d (test), abb9a2f (feat), 886ef62 (feat), b2b312d (feat) |
| 28 | 04 | ~14 min | 3 | 3 | 172b37b (feat), c383a83 (feat), d95b553 (feat) |
| 28 | 05 | ~6 min | 3 auto (+ checkpoint pending) | 4 | a05195e (feat), b760869 (feat), f748529 (feat) |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

**Phase 28 (28-01):**

- `src/lib/screens.ts` is a **verbatim (byte-identical) lift** of the persist.ts regex arrays + screen* bodies; persist.ts now re-imports from it → one source of truth, client/server cannot drift (EV-05).
- `runScreens` `sourceCount` mirrors `sourceLinks.length` ONLY — uploaded files do NOT count toward WEAK_SOURCE (matches `route.ts:32`). Documented in screens.ts + asserted by parity fixture. Phase 30 must wire the evidence step accordingly.
- Parity regression (`scripts/screens-parity-check.js`) drives the TS lib via Node 24 `--experimental-strip-types` instead of installing a test framework (package installs avoided).
- [Phase ?]: Phase 28 (28-02): WIZARD/STEPPER CSS is token-only + logical-props-only; brass (--brass-500) sanctioned ONLY on .choice-card .check; reduced-motion override disables wizard slide + card lift + auto-advance so downstream wizard components ship zero inline color/layout styles.

**Phase 28 (28-03):**

- `src/lib/wizard/state.ts`: `WizardState.form` is typed AS `SubmitInput` (imported from `@/lib/validation`, never redeclared) — the single anti-drift guarantee binding the wizard to `/api/submit`. The legacy `SubmitClient.tsx` mutators were ported verbatim into reducer cases.
- `isAnonymous` seeds to **true** at the client state (UI-SPEC §8 / S7 anonymity-default); the DB-column default flip remains **BE-04 in Phase 33**. This is a UI-side default only.
- `RESTORE_DRAFT` merges only a hard-coded allowlist of known `SubmitInput` keys from the untrusted `sessionStorage` draft (T-28-06) — never spreads `action.draft`, closing prototype-pollution / arbitrary-key injection from a tampered draft.
- `state.ts ↔ registry.ts` have an intentional circular TYPE reference (`state.ts` imports `StepId`, `registry.ts` imports `WizardState`), both `import type` — resolved by `tsc`, erased at runtime, keeping both modules runtime-pure.
- Draft persistence uses `sessionStorage` (cleared on tab close), **not** `localStorage` (T-28-05 shared-device), keyed on `hls.submit.draft.v1`; all three functions SSR-guarded + try/catch (never throw on quota/parse).
- TDD reducer test drives the pure TS via Node `--experimental-strip-types` (Plan 01 precedent) — no test framework installed (T-28-SC zero installs).
- Registry wires only the **two scaffold steps** for Phase 28; Phases 29–31 append the real 9. The branch-skip (`entityType === "individual"`) + visible-count (`Step N of M` doesn't count skipped "1b") contract is encoded now via `isReachable`/`firstIncompleteStep`/`isCountedStep`/`visibleStepCount`.
- Shell i18n: only the **11** foundation keys added to EN+AR under `submit` with parity; the full ~70-key set is deferred to **Phase 32**.

**Phase 28 (28-04):**

- The three wizard chrome components (`WizardProgress`/`WizardNav`/`WizardPanel`) are **stateless leaves** — props-in + callbacks-out (`onJump`/`onBack`/`onNext`), importing NO router/reducer. The Plan 05 `WizardClient` root wires them; this keeps each component independently typecheck-gated and Plan-05-swappable.
- `WizardProgress` derives pill status (done/current/upcoming) from registry `visibleStepIndex` + `state.visited`; a branch-skipped step gets no pill and never miscounts M. Counter uses `Intl.NumberFormat(useLocale())` → Arabic-Indic digits in AR (WIZ-04). Active pill = `aria-current="step"`; completed = `<button>` calling `onJump`; upcoming = inert `<span>`.
- `WizardNav`: Back (`.btn ghost back`) only when `!isFirst` (chevron via CSS `.back::before margin-inline-end`, RTL-mirroring); Next (`Button` primary `.next`, `disabled`+`aria-disabled` until `stepValid`) ONLY for `archetype==="input"`; choice steps render no Next (auto-advance, WIZ-02/03).
- `WizardPanel`: focuses `<h2 tabIndex={-1}>` via `useEffect` on step change (never traps); ONE persistent visually-hidden `aria-live="polite"` node announces `N / M — title` (Intl-formatted). Renders only React text + children (no raw-HTML injection — T-28-08); reduced-motion honored in CSS. Inline clip-style used only for the sr-only node (no helper class exists; no new CSS).
- `t(step.titleKey as never)` is the sanctioned next-intl dynamic-key escape — `titleKey` is a runtime registry string; the cast is the only zero-dep option without a generated typed-key map.
- **No new i18n keys** added (the 5 consumed keys — back/next/stepCounter/scaffoldChoiceTitle/scaffoldInputLabel — shipped in 28-03; EN+AR parity verified). **No new dependencies** (T-28-SC honored). TDD Task 1 verified via tsc + grep gates (no test framework installed; JSX can't run under `--experimental-strip-types`); full a11y/interaction testing is Phase 32's remit.

**Phase 28 (28-05):**

- `ChoiceStep` names its `role="radiogroup"` via `aria-label` (the resolved step title), NOT `aria-labelledby` — the step `<h2>` lives in the sibling `WizardPanel` (a Plan-04 file) and carries no id, so a self-contained label avoids a dangling ref and keeps WizardPanel untouched.
- Scaffold choice options are the `entityType` individual-vs-organization toggle so the registry branch-skip runs live: "individual" skips the input step (`branchWhen`), "organization" surfaces it — neutral, never an S1-S4 category.
- `WizardClient` default-exports (matching the `page.tsx` default-import analog) and also named-exports.
- `page.tsx` wraps `<WizardClient/>` in `<Suspense fallback={null}>` — `useSearchParams` (`?step=`) requires a Suspense boundary under `generateStaticParams` static prerender; `/en|ar/submit` now build as **SSG**. (Deviation Rule 3 — build gate.)
- Auto-advance delay = 200ms (mirrors `--dur`), immediate under `prefers-reduced-motion` (`matchMedia`, SSR-guarded). `?step=` is the single source of truth → free browser Back/Forward; unknown/unreachable id `router.replace`s to `firstIncompleteStep` (WIZ-06).
- S1-S4 absence greps initially tripped on doc comments that *named* the banned tokens (and the word "mapping" → `map.?pin`); reworded comments to categorical phrasing so the gate passes without weakening the constraint (Deviation Rule 3).
- **28-05 ends on a BLOCKING human-verify checkpoint** — 3 auto-tasks committed (a05195e/b760869/f748529), `next build` clean, but the plan is NOT complete until a human exercises the live wizard shell and types "approved". Plan counter NOT advanced; ROADMAP `28-05` NOT yet `[x]`.

### v1.4 Architecture Notes

- **Design contract:** `.planning/UI-SPEC.md` is authoritative for this milestone. Guardrails S1–S8 (no PII/identity/loyalty/profession-target fields; coarse location; source-first; anonymity default-on; nothing published on submit) are product requirements enforced in the UI in addition to the server screens.
- **Front-end / backend split:** Phases 28–32 (the wizard) target the **existing** `/api/submit` contract via the §8 interim mappings, so the wizard is fully buildable before backend additions land. Phase 33 (backend support) can ship in parallel or after; the front-end swaps off the interim mappings once it lands.
- **Shared validation:** client screens live in `src/lib/screens.ts` (Phase 28) and mirror `persist.ts` server screens in server order so client and server cannot drift.
- **CSS:** new `/* ===== WIZARD / STEPPER ===== */` block in `src/components/hlshajara.css`, tokens only — no new colors, no Tailwind utilities. Brass reserved for evidence-strength; the card check mark is the only sanctioned brass use in the wizard.
- **This supersedes** the rejected 8-sector boycott taxonomy (see `.planning/reviews/2026-06-14_report-form-taxonomy-review.html`); reintroducing any S1–S4 field is rejected at design review, not negotiated.

### v1.4 Shipped to STAGING + E2E PASSED (2026-06-14)

**v1.4 is deployed and verified on `staging.hlshajara.com`** (live commit `3bcb56a`). The bilingual EN/AR
staging E2E (qa-dept, chrome-devtools) is **GO** — all 14 checklist items pass in both locales, incl. real
submit round-trips (DB rows created), rejection routing, RTL/a11y. Staging E2E found + we fixed 4 bugs the
static gates missed: entity branch was unreachable (`1c9e367`), valid submit 400'd on empty source titles
(`d9c8289`), refresh lost the step (`fd4b3cd`), and the **Arabic safety classifiers were silently dead**
(ASCII `\b` boundaries — `3bcb56a` Unicode-aware fix + `screens-arabic-check.js` corpus; this closed a real
S2–S4 hole for the platform's primary language). Deploy path: push to `master` (the CI `deploy-staging.yml`
SSH step is broken — missing `STAGING_SSH_*` secrets — so deploy-ops deployed manually to test-sanad
`/var/www/hlshajarah` under x0bdr's pm2 + applied migration `0001` to the staging DB after a backup).

### v1.4 Deferred Follow-ups

1. ✅ **DONE — staging E2E sign-off**: automated bilingual E2E passed (GO). PROD verification still pending a
   prod deploy (see #2).
2. **Deploy to PRODUCTION + apply migrations to the prod DB** (`drizzle/0000` + `0001`, additive; **back up
   first**; owner: data-dept/deploy-ops). Only STAGING is deployed + migrated so far.
2b. **Fix CI auto-deploy**: set GitHub repo secrets `STAGING_SSH_HOST` / `STAGING_SSH_USER` (`x0bdr`) /
   `STAGING_SSH_KEY` / `STAGING_SSH_PORT` (`2222`) so `deploy-staging.yml` works (it has failed since v1.3).
   The deploy must target x0bdr's pm2 (`sudo -u x0bdr PM2_HOME=/home/x0bdr/.pm2`) and restore gitignored
   `ecosystem.config.js` + `.env.local`. Also remove root's pm2 hlshajarah entry permanently.
2c. **Reconcile the drizzle journal on staging**: deploy-ops applied `0001` via direct `psql` (idempotent),
   so `__drizzle_migrations` does not reflect it — a future `drizzle-kit migrate` could replay. data-dept to
   reconcile before relying on drizzle-kit on staging. Stale server migration set preserved under
   `/var/www/hlshajarah/backups/predeploy_untracked_20260614_092453/drizzle_server/`.
2d. **EN banned-pattern coverage** (security-dept): the Arabic classifier `\b` hole is fixed; the EN list is
   thin *by design* (curated EN + human review per PROJECT.md). Expand EN coverage if desired (not a regression).
2e. **Staging test rows**: QA created `pending` submissions id 2–10 (fake test data) — purge from the staging
   DB when convenient (not published; harmless).
3. **Apply migrations to prod** — folded into #2 above.
3. **Install `ffmpeg`** on hosts that will enable video uploads (`/api/upload` fails closed `FFMPEG_UNAVAILABLE`
   and video stays UI-hidden until then — BE-05).
4. **Interim→first-class swap-off** (the deferred §8 work): wire the wizard to send first-class `conductType`
   + `roleInConduct` so the Phase-33 columns populate and `triageCategory` auto-fires, then retire the
   interim `allegationClassification`-slug / `entityRole`-clause / `[TYPE:]`-title encodings. Until then the
   publish path defensively strips the interim tokens (`9cc1f12`) so the public record stays clean; the
   columns are currently dead (review H2).
5. **Minor review items (Low):** map-byte MIME sniffing on `/api/upload` (review L9), return `NO_SOURCE`/
   `WEAK_SOURCE` instead of `VALIDATION_ERROR` for a 0-link direct API submit (L8), drop redundant
   double-strip in role encode (L10).
6. **Not pushed:** all v1.4 commits are local on `master` — route through release-manager when ready to push.

### Blockers/Concerns

- **CRITICAL-0 still open:** charter/copy alignment (stripping sect-targeting language from `CONCEPT.md`/`README.md`/`messages`/`WEBSITE-CONTENT.md`) is deferred out of v1.4 scope by operator decision 2026-06-14, but remains open per the taxonomy review.
- **Phase 33 / BE-05:** video uploads are hidden in the media step (images/docs only) until `ffmpeg -map_metadata -1` video metadata stripping lands; do not enable video before then.
- Phase 5 (Legal Release Gate): production publish of any living person remains blocked until lawyer sign-off + jurisdiction Key Decision are recorded.
- Free-text incitement/hate-tone classifier (AR + EN): curated banned-pattern lists + human review behind a swappable interface; ML classification is a separately-researched future effort.
- **Latent screen properties surfaced by 28-01 (pre-existing v1.0 behavior, mirrored not changed):** (1) `INCITEMENT` token set is a strict subset of the group-target screen, so it is effectively unreachable — `GROUP_TARGET` fires first. (2) The Arabic screen regexes use ASCII `\b` boundaries, so purely-Arabic terms only match when ASCII-flanked. Both are candidates for the incitement/hate-tone classifier rework; changing them now would alter `/api/submit` behavior.
- **Intake posture changed (quick task 260618-nqm, 2026-06-18):** the six content screens (`GROUP_TARGET`, `INCITEMENT`, `HATE_TONE`, `INNOCENT_PARTY`, `PRIVATE_TARGETING`, `MISMATCH`) are now **advisory** at `/api/submit` — a match no longer rejects with HTTP 400. The submission is accepted and the matched code is recorded as `AUTO-FLAG:<CODE>` in `review_logs.reason` (immutable audit). `screens.ts`/`persist.ts` are unchanged (they still classify); only the route stopped blocking. Publication-time gates (≥1 source, lawyer sign-off) are unaffected. **Reviewer impact:** flagged submissions land in the queue and must be triaged via the `AUTO-FLAG:*` audit entries. Optional follow-up: surface flags in the reviewer console via a `screen_flags` column (needs a migration). Interacts with CRITICAL-0 (the automated intake gate is no longer a structural block).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260618-nqm | Make post-submit content screens advisory (warn, not block) at intake | 2026-06-18 | 4fda90a | [260618-nqm-make-post-submit-content-screens-advisor](./quick/260618-nqm-make-post-submit-content-screens-advisor/) |
| 260620-0d1 | Intake bot-protection: server-validated honeypot + self-hosted gray-band challenge fallback (never hard-blocks anonymous/Tor); reused rate_limits (no migration); CHALLENGE_SIGNING_SECRET added; multi-model review 3 High fixed | 2026-06-20 | 65fe8ff | [260620-0d1-intake-bot-protection-honeypot-and-self-](./quick/260620-0d1-intake-bot-protection-honeypot-and-self-/) |
| 260620-1jj | Upload/media XSS hardening: server magic-byte sniff (file-type) before allowlist, sharp fail-closed on EXIF/GPS, shared escape.ts (HTML/markdown/URL-scheme) for reviewer-print + report PDF/MD sinks, plain-text media-name sanitizer, http(s)-only URL schema for sourceFiles/sourceLinks, client-side sniff; multi-model review 2 High fixed | 2026-06-20 | 390dcbe | [260620-1jj-upload-media-name-xss-hardening-magic-by](./quick/260620-1jj-upload-media-name-xss-hardening-magic-by/) |
| 260620-2la | TipTap rich-text publication editor replacing the raw Body(HTML) textarea; posts.body now TipTap JSON (no migration); public render via static-renderer → sanitize-html strict allowlist (kills the dangerouslySetInnerHTML stored-XSS, legacy HTML also sanitized); fail-closed TipTap-doc Zod validation + link-href sanitize on POST/PATCH; JSON-LD </script> breakout escaped (jsonLdSafe); coverImageUrl/title/excerpt validated; multi-model review 1 High fixed | 2026-06-20 | c7407a9 | [260620-2la-tiptap-publication-editor-replace-html-b](./quick/260620-2la-tiptap-publication-editor-replace-html-b/) |

### v1.3 Specific Notes (prior milestone)

- Publications are broadcast-only (no comments) to maintain editorial control.
- Twitter OAuth callback URL: `/api/auth/callback/twitter`.
- GTM container ID via `NEXT_PUBLIC_GTM_ID`; no tracking if absent; aggregate-only events, no PII.
- `posts` table migration at `drizzle/0000_posts_table.sql` — apply to production DB.

## Session Continuity

Last session: 2026-06-14T00:38:53.574Z
Stopped at: 28-05 auto-tasks DONE — ChoiceStep + InputStep scaffolds (a05195e), WizardClient root wiring ?step= routing/draft/history/branching/beforeunload/submit (b760869), page.tsx swap to WizardClient + Suspense (f748529); `next build` passes, /en|ar/submit are SSG; S1-S4 fields verified absent. BLOCKING human-verify checkpoint (Task 4) PENDING — plan completes on "approved".
Resume file: None
Next command: Human verifies the live wizard shell — `npm run dev` then exercise `http://localhost:3000/en/submit` + `/ar/submit` against the 10-item §13 checklist (auto-advance + reduced-motion, Back + browser history, refresh-restore, beforeunload, deep-link redirect, RTL + Arabic-Indic counter, S1-S4 absence). On "approved": advance plan counter, mark 28-05 in ROADMAP, final metadata commit.
