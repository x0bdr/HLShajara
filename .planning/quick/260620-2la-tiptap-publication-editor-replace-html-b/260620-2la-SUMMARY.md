---
phase: quick-260620-2la
plan: 01
subsystem: publications
tags: [tiptap, xss, sanitize-html, editor, i18n, security]
requires: [src/lib/escape.ts (safeHttpUrl), posts.body text column]
provides:
  - src/lib/publication-render.ts (renderPublicationBody — TipTap-JSON/legacy-HTML -> sanitized allowlist HTML)
  - src/lib/publication-body.ts (tiptapDocSchema + parseTiptapDoc + sanitizeDocLinks)
  - src/lib/publication-extensions.ts (shared TipTap extension set — single source of truth)
  - src/components/admin/PublicationEditor.tsx (bilingual RTL-safe accessible editor)
affects:
  - src/app/api/posts/admin/route.ts (POST/PATCH fail-closed body validation)
  - src/app/[locale]/publications/[slug]/page.tsx (raw post.body XSS sink removed)
  - src/app/[locale]/admin/publications/PublicationsAdminClient.tsx (textarea -> editor)
tech-stack:
  added:
    - "@tiptap/react@3.27.1"
    - "@tiptap/pm@3.27.1"
    - "@tiptap/starter-kit@3.27.1"
    - "@tiptap/extension-link@3.27.1"
    - "@tiptap/extension-placeholder@3.27.1"
    - "@tiptap/static-renderer@3.27.1"
    - "sanitize-html@2.17.5"
    - "@types/sanitize-html@2.16.1 (dev)"
  patterns:
    - "One shared TipTap extension set wired into both editor and renderer so author-time and render-time schemas cannot drift"
    - "Three-layer link-href defense: editor validate + sanitizeDocLinks on write + sanitize-html allowedSchemes on render"
key-files:
  created:
    - src/lib/publication-extensions.ts
    - src/lib/publication-body.ts
    - src/lib/publication-body.test.ts
    - src/lib/publication-render.ts
    - src/lib/publication-render.test.ts
    - src/components/admin/PublicationEditor.tsx
    - src/app/api/posts/admin/route.test.ts
  modified:
    - src/app/api/posts/admin/route.ts
    - src/app/[locale]/admin/publications/PublicationsAdminClient.tsx
    - src/app/[locale]/publications/[slug]/page.tsx
    - src/components/hlshajara.css
    - messages/en.json
    - messages/ar.json
    - package.json
    - package-lock.json
decisions:
  - "renderToHTMLString is imported from @tiptap/static-renderer/pm/html-string (NOT json/html-string) — the json subpath does not export it"
  - "Link is configured INSIDE StarterKit (v3 bundles it) — adding @tiptap/extension-link separately triggers a duplicate-extension warning"
  - "All tests run under the existing node Vitest env — no jsdom added; the editor component is verified via tsc + grep + check:i18n, not DOM tests"
metrics:
  duration: "~30 min"
  completed: 2026-06-20
---

# Quick Task 260620-2la: TipTap Publication Editor + Structural XSS Fix Summary

Replaced the raw "Body (HTML)" textarea in the publications admin form with a bilingual,
RTL-safe, accessible TipTap editor, and structurally eliminated the stored-XSS sink on the
public publications page by routing every body (TipTap-JSON or legacy raw HTML) through one
node-safe sanitize-html strict allowlist. `posts.body` stays a `text` column (no migration)
and now stores TipTap doc JSON; the route fails closed on any non-doc body.

## Tasks & Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `5d9b01d` | Install deps + node-safe render/sanitize pipeline (`publication-extensions.ts`, `publication-body.ts`, `publication-render.ts`) + 24 node tests |
| 2 | `27e2a82` | Harden POST/PATCH `/api/posts/admin` — fail-closed TipTap-doc validation + link-href sanitize + 7 route tests |
| 3 | `c4e4414` | Bilingual RTL-safe accessible `PublicationEditor` component + CSS block + `publications.editor` EN/AR i18n |
| 4 | `b392bec` | Wire editor into admin client + replace public raw-body sink with `renderPublicationBody(post.body)` |

Full hashes:
- `5d9b01dbeb7b13658fc6aded5f5450804a95a5a4`
- `27e2a822e05183f6add056d9ef4861f1199494ad`
- `c4e44144a93da45103f776322d4b981ba578634b`
- `b392bec92a57f664820abebffb73c5208a2eb840`

Base: `6212124ef925c1354a8c32b11734684d25e79cc6`

## Dependencies Installed (exact versions, all MIT, verified at 3.27.1 / 2.17.5)

`@tiptap/react@3.27.1`, `@tiptap/pm@3.27.1`, `@tiptap/starter-kit@3.27.1`,
`@tiptap/extension-link@3.27.1`, `@tiptap/extension-placeholder@3.27.1`,
`@tiptap/static-renderer@3.27.1`, `sanitize-html@2.17.5`, and dev `@types/sanitize-html@2.16.1`.
`@tiptap/core@3.27.1` resolved transitively (not added explicitly). No other new deps.

## Verification Gates (run after Task 4)

| Gate | Command | Result |
|------|---------|--------|
| Unit tests | `npm run test` | PASS — 120 tests / 10 files (24 new render+body, 7 new route; all pre-existing suites green) |
| Types | `npx tsc --noEmit` | PASS — exit 0 |
| i18n parity (full tree) | `npm run check:i18n` | PASS — EN↔AR key sets equal, all namespaces |
| i18n parity (submit) | `npm run check:i18n:submit` | PASS — 397 keys each, 67 v1.5 keys present |
| Build | `npx next build` | PASS — exit 0, "Compiled successfully"; `/[locale]/publications/[slug]` builds, admin + posts/admin route build (Better Auth env warnings are pre-existing local-env noise, non-fatal) |

Structural grep gate (public page):
- `grep -c "dangerouslySetInnerHTML" page.tsx` = **2** — line 78 (JSON-LD, trusted, untouched) + line 176 (`renderPublicationBody(post.body)`).
- `grep "__html: post.body"` → **no raw sink remains**.

Security behavior proven by tests:
- `javascript:`/`data:`/protocol-relative link hrefs dropped at all three layers (editor validate, `sanitizeDocLinks` on write, sanitize-html allowedSchemes on render).
- Legacy raw-HTML body: `<script>`, `onerror`, `<img>`, `class`/`style`/`id` all stripped; `<p>ok</p>` survives.
- Non-doc / oversized / over-deep body rejected on write with 400 "Invalid publication body" before any DB write.
- Empty/nullish body -> "".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Correct `renderToHTMLString` import path: `pm/html-string`, not `json/html-string`**
- **Found during:** Task 1 (the plan instructed: "confirm the exact exported function name… adjust the call site to match — do NOT guess").
- **Issue:** The `@tiptap/static-renderer/json/html-string` subpath the plan named exports only the low-level `renderJSONContentToString` (which requires explicit `nodeMapping`/`markMapping`, NOT an `extensions` array). The `extensions`-based `renderToHTMLString({ content, extensions })` the plan expects is exported from `@tiptap/static-renderer/pm/html-string` (and the package root).
- **Fix:** Imported `renderToHTMLString` from `@tiptap/static-renderer/pm/html-string` (the focused, React-free, node-safe subpath; verified it imports no React and renders pure-node).
- **Files:** `src/lib/publication-render.ts`
- **Commit:** `5d9b01d`

**2. [Rule 3 - Blocking] Link configured inside StarterKit, not as a separate extension**
- **Found during:** Task 1 (spike showed "Duplicate extension names found: ['link']").
- **Issue:** StarterKit v3 BUNDLES the Link extension (config key `link: Partial<LinkOptions> | false`). Adding `@tiptap/extension-link` separately registers `link` twice, producing an ambiguous schema + a TipTap warning.
- **Fix:** Configured StarterKit's bundled link (`openOnClick:false`, `autolink:false`, `protocols:["http","https"]`, `isAllowedUri` -> `safeHttpUrl`, forced `rel`/`target`) in the single shared `publicationExtensions`. `@tiptap/extension-link` stays installed (StarterKit's transitive dep; harmless) per the plan's exact install set. `@tiptap/extension-placeholder` is added separately (StarterKit does NOT bundle Placeholder).
- **Files:** `src/lib/publication-extensions.ts`
- **Commit:** `5d9b01d`

**3. [Rule 2 - Critical] `codeBlock`/`code`/`horizontalRule` disabled in StarterKit**
- **Found during:** Task 1.
- **Issue:** The sanitize-html STRICT_ALLOWLIST has no `<pre>`/`<code>`/`<hr>`, so authoring those nodes would silently vanish on render (author/render schema mismatch).
- **Fix:** Disabled `codeBlock`, `code`, and `horizontalRule` in the shared StarterKit config so the editor cannot produce nodes the renderer drops.
- **Files:** `src/lib/publication-extensions.ts`
- **Commit:** `5d9b01d`

## Test-Environment Decision

All tests run under the project's existing **`node` Vitest environment** (`vitest.config.ts`,
unchanged). The render/sanitize libs and the route are node-pure (`@tiptap/static-renderer/pm/html-string`
+ `sanitize-html` + Zod — no DOM), so the security-critical tests (24 render/body + 7 route)
need no jsdom. **No jsdom env was added** — adding it would have required weakening the node-env
isolation for no benefit. The `PublicationEditor` client component (which DOES touch the DOM via
`@tiptap/react`) is verified structurally via `tsc --noEmit` + grep (all 11 toolbar buttons present
with bilingual `aria-label`+`title`) + `check:i18n` parity, exactly as Task 3's `<verify>` specified.
Live interaction/a11y testing is left to manual/E2E (consistent with the Phase-28 precedent of
verifying JSX components via tsc+grep rather than installing a DOM test harness).

## Explicit Constraint Confirmations

- **(a) NO DB migration created.** `posts.body` remains a `text` column; `git diff` touches no
  `drizzle/`, `.sql`, or `schema.ts`. Body now stores TipTap doc JSON in the same text column.
- **(b) JSON-LD / analytics sinks NOT touched.** The `JsonLd` `dangerouslySetInnerHTML` at
  `publications/[slug]/page.tsx` line 78 is unchanged; the page now has exactly 2 sinks
  (JSON-LD trusted + the new sanitized body). `layout.tsx`, `faq`, `GtmScript`, `GaScript` untouched.
- **(c) No raw `post.body` `dangerouslySetInnerHTML` remains.** The only body sink is now
  `renderPublicationBody(post.body)`; `grep "__html: post.body"` returns nothing.
- **(d) Prior intake / upload hardening untouched.** No edits to `/api/submit/route.ts`,
  `/api/upload/route.ts`, `src/lib/escape.ts`, `src/lib/validation.ts`, or `src/lib/challenge.ts`
  (verified via `git diff --name-only` against base). `safeHttpUrl` is REUSED, not modified.

## Known Stubs

None. No empty-value placeholders, no TODO/FIXME, no unwired data sources in any file created or
modified by this plan. The only `placeholder` token is the legitimate editor i18n key; the only
`FUTURE:` comment is the intentional out-of-scope image-embedding note.

## Threat Flags

None. No new network endpoints, auth paths, file-access patterns, or trust-boundary schema changes
were introduced beyond the threat model's registered surface. The change REMOVES the registered
stored-XSS sink (T-2la-01) and adds the three-layer link defense (T-2la-02), write-time fail-closed
validation (T-2la-03), and DoS size bounds (T-2la-04); the trusted JSON-LD sink (T-2la-05) is
preserved untouched.

## Self-Check: PASSED

All 8 created files exist on disk; all 4 task commits (`5d9b01d`, `27e2a82`, `c4e4414`, `b392bec`)
exist in git history.
