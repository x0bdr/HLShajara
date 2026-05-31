# Stack Research

**Domain:** Secure bilingual (AR/EN) human-rights documentation & accountability archive — moderated submission → verification → publish workflow, immutable audit trail, searchable public record
**Researched:** 2026-05-31
**Confidence:** HIGH (core framework, DB, auth, i18n verified against official docs / current releases) / MEDIUM (search-engine Arabic quality, file-integrity stack — verified but with stated caveats)

---

## Context That Drives These Choices

This is not a generic CRUD app. Five domain facts shape every recommendation:

1. **Auditability is a first-class requirement, not a feature.** `ReviewLog` is declared "immutable audit trail"; every published entry needs a versioned history. The DB and ORM must make append-only history easy and tamper-evident.
2. **Structural anti-discrimination + zero-source rules** (`hard_constraints`) must be enforced in schema + code, not policy. This favors a relational DB with `CHECK`/`NOT NULL`/FK constraints and a typed validation layer, not a schemaless store.
3. **Defamation/PDPL/GDPR exposure is the top existential risk.** The stack must support data-protection-by-design: field-level access control, right-of-reply, correction history, deletion/redaction, and a clear hosting jurisdiction.
4. **Arabic search must actually work.** Naming a perpetrator and finding them later is the core function. Arabic morphology (root-and-pattern, diacritics, alef/hamza variants) breaks naive search. This single requirement disqualifies several popular defaults.
5. **Low-trust threat model.** Submitters and named parties may be hostile; the platform may be targeted. Security hardening is non-negotiable.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js (App Router)** | **16.2.x LTS** | Full-stack web framework (SSR public site + server actions for the reviewer console) | Current LTS (16.2.6, May 2026). Server Components keep evidence/PII server-side by default; React Server Components mean translations and authz checks run on the server, never shipping reviewer-only data to the client. One framework for both the public archive and the internal console reduces attack surface. Mature i18n + RTL story via `next-intl`. |
| **TypeScript** | **5.7+** | Language | End-to-end type safety from DB schema → API → validation → UI. Critical when constraint enforcement and "no identity field can be entered" must hold across layers. |
| **PostgreSQL** | **18** (17 acceptable) | Primary relational store + audit history + full-text fallback | Strongest open-source RDBMS for constraint enforcement, JSONB audit payloads, Row-Level Security, and triggers. Constraints (`NOT NULL` source FK, `CHECK` on enums, no identity columns) make the hard_constraints physically true. Native `pgcrypto` for hash-chaining the audit log. PG18 ships improved JSONB + RLS performance. |
| **Drizzle ORM** | **0.45.x** | Typed schema + migrations | Code-first TypeScript schema maps 1:1 to SQL, so `CHECK` constraints, partial indexes, FK `NOT NULL`, and trigger-backed audit tables are explicit and reviewable — exactly what a defamation-sensitive, auditable schema needs. Migration SQL is human-readable and reviewable (important: a lawyer/auditor can read what changed). Lighter and closer to SQL than Prisma; no opaque generated client. |
| **OpenSearch** | **2.19.x** (3.x if stable in your infra) | Full-text + faceted search over the public record | **The Arabic-search decision driver.** PostgreSQL's built-in Arabic FTS (Snowball) is documented as poor (mis-stems common words). Meilisearch/Typesense Arabic support is community-maintained and incomplete. OpenSearch ships a real `arabic` analyzer plus `icu_analyzer`, `arabic_normalization` (alef/hamza/yaa folding), and decompounding — the only mainstream option with production-grade Arabic relevance, faceting (by conduct, role, evidence-strength, status — **never identity**), and self-hostable Apache-2.0 licensing. |
| **next-intl** | **4.x** | i18n (AR RTL + EN LTR) with full key parity | Purpose-built for App Router + Server Components (~2KB). ICU message format handles Arabic's 6 plural forms correctly; locale-driven `dir="rtl"` and middleware locale routing are first-class. Enforces the "full AR + EN key parity" constraint via typed message keys. |
| **Better Auth** | **1.4.x** | Authentication + RBAC (reviewer/legal/admin roles) | Lucia is deprecated (maintenance-only since 2025). Better Auth is the 2026 self-hosted standard: sessions in *your* Postgres (immediate revocation — vital when a reviewer account is compromised), built-in **admin plugin with `createAccessControl` RBAC**, TOTP 2FA, and passkeys built in. Auth.js v5 lacks native 2FA/RBAC and would need custom glue. Full data ownership, no third-party identity vendor (jurisdiction/PII reason). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | **4.x** | Runtime validation of every submission + server-action input | Default validator for Next.js server actions; deepest ecosystem integration. Encodes `submission_accept_requirements` (≥1 source, named actor, specific act) as parse-or-reject schemas at the trust boundary. Mirrors Drizzle types via `drizzle-zod`. |
| **drizzle-zod** | (matches Drizzle) | Derive Zod schemas from DB tables | Single source of truth: schema constraints and API validation stay in sync. |
| **clamscan** (`clamscan`) or **pompelmi** | clamscan 2.x / pompelmi (Apr 2026) | Malware scanning of uploaded evidence (PDFs, images, docs) | Every uploaded source document is untrusted. Scan before storage. `pompelmi` adds direct S3-stream scanning with typed verdicts; `clamscan` is the mature ClamAV daemon wrapper. |
| **Node `crypto` (built-in)** | Node 22 LTS | SHA-256 content hashing for file provenance/integrity | Hash every uploaded source on ingest; store hash + size + MIME + uploader + timestamp. Lets you prove a document hasn't changed and detect duplicates. No third-party dep needed. |
| **file-type** | 19.x | Magic-byte MIME sniffing | Never trust the client `Content-Type`. Reject mismatched/dangerous types (e.g., disguised executables) before scan/store. |
| **sharp** | 0.34.x | Image normalization + EXIF/GPS stripping | `PRIVATE_TARGETING` rejection rule: strip GPS/EXIF metadata from uploaded photos so location data enabling physical harm never persists. Also generates safe thumbnails. |
| **@aws-sdk/client-s3** (or MinIO client) | v3 | Evidence/object storage | Store source documents in object storage (S3-compatible), DB holds only refs + hashes. Use server-side encryption + private buckets + signed, expiring URLs. MinIO if self-hosting in an EU jurisdiction. |
| **next-safe-action** | 8.x | Type-safe server actions with built-in auth + Zod | Wraps every mutation with role check + validation in one place — enforces the legal_safety_gate / dual_review authorization consistently. |
| **pino** | 9.x | Structured app logging (separate from the DB audit trail) | Operational/security logging; ship to a SIEM. Keep distinct from the immutable `ReviewLog` (which lives in Postgres). |

### Database-level audit & integrity pattern (PostgreSQL)

| Mechanism | Purpose |
|-----------|---------|
| **Trigger-based audit table** (JSONB `old_data`/`new_data`, actor, action, txid, timestamp) | Fires regardless of how a row changes — 100% coverage of the immutable `ReviewLog`. Triggers are the documented best practice over app-level logging. |
| **Hash-chained audit rows** (`pgcrypto`: each row stores `sha256(prev_hash ‖ row_payload)`) | Makes the audit trail tamper-*evident*: any retroactive edit breaks the chain. Critical for an accountability archive whose credibility depends on an unfalsifiable record. |
| **Row-Level Security (RLS)** | Field/row-level visibility: drafts and reviewer notes invisible to public role; only `published` rows readable by the anon role. Keep policies LEAKPROOF + index policy columns (documented footgun). |
| **Entry versioning** (history table or `temporal_tables` extension) | "Versioned audit trail on every entry" + ability to show what an entry said at any prior date — important for corrections and right-of-reply disputes. |
| **Append-only / no `DELETE` grant on audit table** | Reviewers/app role can `INSERT` but not `UPDATE`/`DELETE` audit rows; redactions are new rows, not erasures. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Drizzle Kit** | Migration generation/review | Commit generated SQL; require human review of every migration touching constraints or the audit schema. |
| **Playwright** | E2E tests incl. RTL/LTR rendering + workflow gates | Test that group-targeting/no-source submissions are rejected; that unpublished entries are not publicly reachable. |
| **Vitest** | Unit tests for the intake rules engine + Zod schemas | The `rejection_rules` classifier is safety-critical — test exhaustively. |
| **ESLint + typescript-eslint** | Static analysis | Add `eslint-plugin-security`. |
| **Docker / Docker Compose** | Reproducible Postgres + OpenSearch + ClamAV locally and in prod | Mirrors prod jurisdiction-controlled deployment. |

---

## Security Hardening

| Concern | Recommendation |
|---------|----------------|
| **HTTP security headers** | Set CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` via Next.js `headers()` / middleware. Strict CSP (nonce-based) to mitigate XSS on a public, hostile-traffic site. |
| **Rate limiting / abuse** | Rate-limit the submission endpoint (e.g., `@upstash/ratelimit` or a self-hosted Redis token bucket) — intake is a spam/DoS target. |
| **Bot / spam on intake** | Privacy-respecting challenge (e.g., hCaptcha / self-hosted Friendly Captcha) on submission, not on public reads. |
| **Secrets** | No secrets in repo; use the host's secret manager or SOPS-encrypted env. Rotate reviewer credentials. |
| **2FA mandatory for staff** | Enforce Better Auth TOTP/passkey for all reviewer/legal/admin accounts — these accounts can publish accusations. |
| **PII minimization** | Server-only handling of submitter identity; strip EXIF/GPS (sharp); never index identity-class fields (there are none) in OpenSearch. |
| **Dependency audit** | `npm audit` / Dependabot / `osv-scanner` in CI; pin versions. |

---

## Hosting / Jurisdiction Considerations

This is the highest-stakes infrastructure decision and should be a logged Key Decision with legal input. Findings:

- **Choose a jurisdiction with strong press/free-expression protection and a stable rule of law, and host there explicitly** (commonly EU member states such as the Netherlands/Germany/Iceland, or other rights-respecting hosts). Avoid jurisdictions with easy political takedown pressure or weak data-protection law. *(Confidence: MEDIUM — this is a legal/operational judgement, not a technical fact; defer the final choice to the project's lawyer per PROJECT.md constraint.)*
- **Self-host or use an EU-based managed provider** (e.g., Hetzner, OVH, Scaleway, or a managed EU Postgres/OpenSearch) rather than US hyperscaler defaults, to keep PDPL/GDPR data-residency clean and reduce foreign-subpoena exposure. S3-compatible storage via **MinIO** keeps evidence within the chosen jurisdiction.
- **CDN with DDoS protection** in front of the public read path (the public archive is a likely target). Choose a CDN that will not unilaterally drop a controversial-but-lawful human-rights site.
- **Encrypted backups, off-site, in-jurisdiction.** An accountability archive's value is its durability; treat backup integrity as a security property.
- **Keep the reviewer console on a separate hostname/network path** from the public site, ideally IP-allowlisted or behind a VPN/zero-trust gateway.

---

## Installation

```bash
# Core
npm install next@^16.2 react react-dom typescript
npm install drizzle-orm postgres
npm install better-auth
npm install next-intl
npm install zod drizzle-zod next-safe-action

# Search client
npm install @opensearch-project/opensearch

# File handling / provenance
npm install file-type sharp @aws-sdk/client-s3 clamscan
# (or) npm install pompelmi   # S3-stream malware scanning

# Logging / abuse
npm install pino @upstash/ratelimit

# Dev dependencies
npm install -D drizzle-kit vitest @playwright/test eslint typescript-eslint eslint-plugin-security
```

Infrastructure (Docker): PostgreSQL 18, OpenSearch 2.19, ClamAV daemon, MinIO (if self-hosting object storage), Redis (rate limiting).

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **OpenSearch** | **Meilisearch 1.45** | If the team strongly prefers DX/simplicity and accepts weaker Arabic relevance (Charabia Arabic tokenization is community-maintained and imperfect). Fine for an MVP that is English-primary; revisit for Arabic-critical search. |
| **OpenSearch** | **PostgreSQL FTS (`tsvector` + `pg_trgm`)** | Only for English. Avoid for Arabic — built-in Snowball Arabic stemming is documented as poor. `pg_trgm` can help fuzzy English/transliteration matching as a *supplement*, not the primary Arabic engine. |
| **Drizzle ORM** | **Prisma 7.4** | If the team is less SQL-comfortable and wants Prisma Studio / higher-level DX. Prisma 7 dropped the Rust engine (pure TS). Both have first-class Better Auth adapters. Drizzle preferred here for reviewable SQL migrations on a constraint-heavy, auditable schema. |
| **Better Auth** | **Auth.js v5** | If you only need social/OAuth login and the largest community, and are willing to hand-roll 2FA + RBAC. Not preferred — staff accounts need mandatory 2FA + fine-grained RBAC out of the box. |
| **Better Auth** | **Keycloak / Ory (self-hosted IdP)** | If the org needs a full enterprise IdP, SSO federation, or multiple apps sharing identity. Heavier ops; overkill for a single platform. |
| **next-intl** | **next-i18next / i18next** | If you need cross-framework reuse or the i18next plugin ecosystem (CDN delivery, saveMissing, TMS integrations). next-intl preferred for App Router + Server Components simplicity. |
| **MinIO (self-host)** | **AWS S3 / Cloudflare R2** | If jurisdiction allows and managed durability is preferred. Keep buckets private + encrypted + signed URLs regardless. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Lucia Auth** | Deprecated / maintenance-only since 2025; no future features. | Better Auth |
| **PostgreSQL built-in Arabic FTS as the primary search** | Snowball Arabic stemmer mis-stems common words (documented); poor recall on the platform's core function. | OpenSearch with `arabic`/`icu` analyzers + `arabic_normalization` |
| **Typesense for Arabic** | In-RAM and fast, but documented weak Arabic tokenization. | OpenSearch (or Meilisearch as a lighter fallback) |
| **A NoSQL/document DB (Mongo etc.) as primary store** | Cannot cheaply enforce the hard_constraints (FK-required source, no identity columns, CHECK enums) or relational audit/versioning; weak transactional guarantees for a publish workflow. | PostgreSQL |
| **Storing uploaded files as BLOBs in the DB** | Bloats backups, complicates scanning/versioning, hurts performance. | Object storage (MinIO/S3) + DB refs + SHA-256 hash |
| **App-level-only audit logging** | Misses changes made outside the app (direct SQL, admin tooling); not tamper-evident. | DB trigger-based + hash-chained audit table |
| **Client-side-only validation / authz** | Hostile actors bypass the browser; the intake rules engine is safety-critical. | Server-side Zod + RLS + server actions (next-safe-action) |
| **Third-party hosted auth/identity (Clerk/Auth0) by default** | PII/jurisdiction exposure; vendor controls your reviewer identity data. Reconsider only if legal review approves. | Self-hosted Better Auth in your Postgres |
| **US hyperscaler default region without review** | Data-residency + foreign-subpoena exposure for a politically sensitive archive. | Jurisdiction chosen with legal input (often EU) |
| **Any "tagging by community/sect" UX pattern, geotag display, or address field** | Violates hard_constraints + safety rules structurally. | No such fields exist — keep it that way; lint/test against reintroduction |

---

## Stack Patterns by Variant

**If MVP / English-primary launch first:**
- Ship with PostgreSQL `tsvector` + `pg_trgm` for search and defer OpenSearch.
- Because Arabic-grade search is the main reason for a separate engine; if the first entries are English/court-record sourced, you can add OpenSearch in a later phase without rework (keep search behind an interface).

**If full bilingual launch (Arabic content from day one):**
- Stand up OpenSearch from the start with `arabic_normalization` + `icu_analyzer`.
- Because retrofitting Arabic relevance is expensive and the core promise (find a named actor) fails without it.

**If self-hosting in a chosen jurisdiction (recommended):**
- PostgreSQL + OpenSearch + MinIO + ClamAV in Docker on EU infra (Hetzner/OVH/Scaleway), CDN with DDoS protection in front of public reads.
- Because it keeps all evidence + PII in one legally-reviewed jurisdiction with no third-party data processors.

**If a managed path is preferred (smaller ops team):**
- Managed EU Postgres + managed OpenSearch + Cloudflare R2 (EU) — verify each processor's jurisdiction and DPA terms with the lawyer first.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.2 | React 19 / React Compiler 1.0 | Turbopack default; Node 20.9+ required (use Node 22 LTS). |
| Better Auth 1.4.x | Drizzle 0.45 adapter (joins since 1.4.0) | Better Auth ≥1.4.7 restricts Prisma 7 as peer dep — verify adapter status if choosing Prisma 7.4. |
| Drizzle ORM 0.45 | PostgreSQL 17/18, `postgres`/`pg` driver | Use `drizzle-kit` matching the ORM minor; review generated SQL for constraint changes. |
| Zod 4.x | next-safe-action 8.x, drizzle-zod | Zod 4 is the Next.js server-action default; confirm drizzle-zod build targets Zod 4. |
| next-intl 4.x | Next.js 13–16 App Router | First-class Server Component + middleware locale routing. |
| OpenSearch JS client | OpenSearch 2.19 / 3.x server | Pin client to server major; ICU analyzer plugin bundled in standard images. |

---

## Open Questions / Hand to Later Phases

- **Hosting jurisdiction** must be finalized with the project's lawyer (PROJECT.md gates this). Technical recommendation: EU self-host; legal sign-off required.
- **OpenSearch vs Meilisearch** final call can be deferred behind a search interface; benchmark both on a real Arabic corpus of sample entries before committing — needs a phase-specific spike.
- **Incitement / hate-tone classifier** (rejection rules `INCITEMENT`, `HATE_TONE`) — Arabic NLP classification accuracy is its own research topic; the data-model says "banned-pattern + incitement classifier." MVP can start with curated banned-pattern lists + human review; ML classification is a later, separately-researched phase.
- **Bitemporal vs simple history table** for entry versioning — decide in the data-layer phase; `temporal_tables` extension vs hand-rolled history table is a tradeoff between standardization and control.

---

## Sources

- [Next.js 16 / endoflife.date](https://endoflife.date/nextjs) — confirmed 16.2.6 LTS current (May 2026). HIGH
- [Next.js 16 blog](https://nextjs.org/blog/next-16) — Turbopack default, React Compiler 1.0 stable. HIGH
- [PostgreSQL 18 docs — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — RLS semantics, LEAKPROOF footgun. HIGH
- [Bytebase — Postgres RLS footguns](https://www.bytebase.com/blog/postgres-row-level-security-footguns/) — index policy columns, non-LEAKPROOF perf. MEDIUM
- [PostgreSQL FTS docs](https://www.postgresql.org/docs/current/textsearch-intro.html) + [Misraj blog](https://misraj.sa/en/blog/full-text-search-in-postgres) — built-in Arabic Snowball stemming is poor (documented mis-stem). MEDIUM-HIGH
- [Meilisearch language docs / Charabia](https://github.com/meilisearch/charabia) + [Arabic discussion #139](https://github.com/orgs/meilisearch/discussions/139) — Arabic supported but community-maintained, no core Arabic speaker. MEDIUM
- [Meilisearch vs Typesense](https://www.meilisearch.com/blog/meilisearch-vs-typesense) — Typesense weak for Arabic tokenization. MEDIUM
- [Better Auth — Admin plugin / RBAC](https://better-auth.com/docs/plugins/admin) — `createAccessControl`, roles, 2FA. HIGH
- [LogRocket — best Next.js auth 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/) + [BuildPilot comparison](https://trybuildpilot.com/625-better-auth-vs-lucia-vs-nextauth-2026) — Lucia deprecated, Better Auth recommended. MEDIUM
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) + [Prisma 7 peer-dep issue #6746](https://github.com/better-auth/better-auth/issues/6746) — adapter join support since 1.4.0; Prisma 7 caveat. HIGH
- [MakerKit — Drizzle vs Prisma 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) — Prisma 7.4 / Drizzle 0.45 current; migration reviewability. MEDIUM
- [next-intl App Router docs](https://next-intl.dev/docs/getting-started/app-router) + [Locize comparison](https://www.locize.com/blog/next-intl-vs-next-i18next/) — App Router/RSC support, Arabic RTL + plural forms. HIGH
- [Zod v4 vs Valibot 2026](https://dev.to/whoffagents/zod-v4-vs-valibot-runtime-validation-in-2026-i-benchmarked-both-3jnc) — Zod default for Next.js server actions. MEDIUM
- [PostgreSQL audit logging via triggers — OneUptime](https://oneuptime.com/blog/post/2026-01-21-postgresql-audit-logging/view) + [Bytebase guide](https://www.bytebase.com/blog/postgres-audit-logging/) — triggers = 100% coverage best practice. MEDIUM-HIGH
- [pompelmi — ClamAV S3 scanning](https://github.com/pompelmi/pompelmi) + [clamscan npm](https://www.npmjs.com/package/clamscan) — malware scanning of uploads (Apr 2026). MEDIUM
- [temporal_tables extension](https://pgxn.org/dist/temporal_tables/) + [bitemporal overview](https://aiven.io/blog/two-dimensional-time-with-bitemporal-data) — entry versioning options. MEDIUM

---
*Stack research for: secure bilingual human-rights documentation & accountability archive*
*Researched: 2026-05-31*
