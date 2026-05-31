# Project Research Summary

**Project:** HLShajara (لست شجرة)
**Domain:** Civic human-rights documentation & accountability platform — bilingual (AR/EN), named-actor, source-backed public record aligned with transitional-justice practice
**Researched:** 2026-05-31
**Confidence:** HIGH (stack, features, architecture strongly determined by the project's own encoded contracts and established HR-documentation tooling; legal/safety pitfalls grounded in Berkeley Protocol, Article 19, EU Anti-SLAPP Directive, GDPR Art. 10/85)

## Executive Summary

HLShajara is **not a generic CRUD app and not a boycott or mobilization tool** — it is an accountability *archive* that documents named individuals/entities tied to specific conduct, backed by credible public sources, and refers the record toward lawful justice mechanisms (courts, UN CoI/IIIM, sanctions advocacy). Experts in this domain (UN IIIM, SNHR, VDC, Syrian Archive, HURIDOCS Uwazi) converge on a single shape: structured intake → multi-stage verification → source-tiered evidence with strength labelling → versioned/auditable records → a published record that supports lawful mechanisms. The closest established analog is HURIDOCS Uwazi, but HLShajara differs in two architecture-defining ways: a **non-bypassable pre-save boundary engine** that structurally rejects whole categories of submission, and a **separation-of-duties approval workflow** (dual review + legal/safety gate) that no single actor — including admin — can route around.

The recommended approach is a single Next.js 16 (App Router) full-stack application over PostgreSQL 18 with a strict architectural spine: an **identity-free data model** (anti-discrimination enforced by the *absence* of any sect/ethnicity/family/region/tribe field, not by policy), a **single validation choke point** (`persist()`) that every write must pass, an **append-only hash-chained audit log** for tamper-evidence, OpenSearch for production-grade Arabic search, and Better Auth for self-hosted RBAC with mandatory 2FA on all staff. Three structural safeguards must be true in code and schema, not documentation: (1) **no identity fields exist** so identity targeting is impossible by construction; (2) **no zero-source publication** — `assertAtLeastOneSource()` plus DB NOT-NULL/FK; (3) **a hash-chained audit trail** where corrections are new versioned events, never overwrites.

The dominant risk is **legal/existential, not technical**: publishing a named living person before a qualified lawyer in the operating jurisdiction reviews the publication standard and the first entries. This must be a **system-enforced state and a hard, non-skippable phase boundary** — the publish action must refuse a living-person entry without a recorded lawyer sign-off. Secondary but severe risks are misidentification (the Tripathi failure, acute with transliterated Arabic names), evidentiary-strength drift (asserting guilt on allegation-tier evidence), doxxing/transnational repression against submitters and reviewers (a state-level adversary threat model, not generic web security), and audit-trail tampering. Every one of these maps cleanly to a build phase and a verification check.

## Key Findings

### Recommended Stack

A single typed full-stack app keeps PII and reviewer-only data server-side by default and minimizes attack surface. PostgreSQL is the integrity backbone because the project's `hard_constraints` (FK-required source, no identity columns, CHECK enums) become *physically true* via schema constraints, RLS, triggers, and `pgcrypto` hash-chaining — things a document store cannot cheaply guarantee. OpenSearch is the deliberate Arabic-search decision: Postgres built-in Arabic FTS mis-stems common words and Meilisearch/Typesense Arabic support is community-maintained, so OpenSearch's `arabic`/`icu` analyzers + `arabic_normalization` are the only mainstream production-grade option for the platform's core function (finding a named actor). Hosting jurisdiction is the highest-stakes infra decision and is deferred to the lawyer-review gate (EU self-host recommended technically; legal sign-off required).

**Core technologies:**
- **Next.js 16.2 LTS (App Router) + TypeScript 5.7+**: full-stack web (public SSR site + server-action reviewer console) — Server Components keep evidence/PII and authz server-side; one framework for both surfaces reduces attack surface; mature i18n/RTL.
- **PostgreSQL 18 + Drizzle ORM 0.45**: integrity backbone — constraints make hard_constraints physical; trigger-based + hash-chained audit; RLS hides drafts from public; Drizzle's reviewable SQL migrations matter on a constraint-heavy, lawyer-auditable schema.
- **OpenSearch 2.19**: the only mainstream engine with production-grade Arabic relevance + faceting by conduct/role/strength/status (never identity).
- **Better Auth 1.4**: self-hosted RBAC (reviewer/legal/admin) + mandatory TOTP/passkey 2FA, sessions in your Postgres (immediate revocation); Lucia is deprecated, Auth.js lacks native 2FA/RBAC.
- **next-intl 4 + Zod 4 / next-safe-action**: AR-RTL/EN-LTR key parity with ICU plurals; every submission and server action validated at the trust boundary (`submission_accept_requirements` as parse-or-reject schemas).
- **Supporting integrity/safety libs**: `sharp` (strip EXIF/GPS), `file-type` (magic-byte MIME), `clamscan`/`pompelmi` (malware scan uploads), Node `crypto` (SHA-256 source provenance), S3/MinIO (evidence refs, never DB BLOBs).

### Expected Features

The MVP cannot ship a "lite" version that drops verification or the boundary engine — those are what make it legitimate and safe.

**Must have (table stakes):**
- Bilingual AR/EN public site + policy pages ("what we do / don't", Code of Conduct, anti-discrimination, disclaimer/terms/privacy) with full key parity
- Identity-free data model + conduct/role taxonomy (the foundation everything depends on)
- Source tiers (A/B/C) + evidence-strength labels (5 levels) wired into intake and entries
- Structured submission intake (named actor + specific conduct + ≥1 source + attestation)
- Intake boundary/rules engine — all 8 rejection codes (GROUP_TARGET, INCITEMENT, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE)
- Multi-stage verification pipeline with source verification + dual independent review
- Legal/safety gate (framing-to-evidence, privacy re-check, right-of-reply contact capture)
- Public record search/filter by conduct/role/strength/status **only**, with visible per-entry sources + label
- Right-of-reply & correction process; immutable versioned audit trail per entry
- Victim-support referral page (static); qualified-lawyer review of standard + first entries (release gate)

**Should have (competitive differentiators):**
- Anti-discrimination enforced in the data model (no identity fields exist) — the project's signature, structurally impossible vs policy-only
- Conduct-only taxonomy; per-entry lawful-channels referral surface (refers to courts/IIIM, never mobilizes)
- Transparency reporting (public methodology + source-tier/rejection/correction stats)

**Defer (v1.x / v2+):**
- Transparency reporting and appeals/takedown formalization (v1.x, once there's a body of entries)
- AI-assisted source/metadata triage — **review-assist only, must never bypass dual review or the legal gate**
- External-dataset interoperability; reviewer collaboration / case management

**Anti-features (MUST NEVER BUILD — impossible by construction, not merely disabled):** boycott/social-pressure/name-and-shame mechanics; targeting/tagging/filtering by religion/sect/ethnicity/family/region/tribe/community; doxxing (addresses, live locations); crowd voting on guilt; unmoderated comments; naming children/uninvolved persons; anonymous-rumor/single-social-post entries; auto-publish; engagement/virality metrics.

### Architecture Approach

A **publication pipeline** (intake → triage → verify → dual review → gate → publish → monitor) sits behind a **public read surface**, with a **separate authenticated write/review surface**, and a **cross-cutting audit + policy-enforcement layer** every state transition must pass. The defining property: safeguards are *structural invariants* at the lowest layer (schema + a single validation choke point), not features bolted on, so no caller can route around them. The public read surface is fed only by a **publish projection** into the search index — anonymous traffic never reaches the integrity core, and drafts/rejected submissions are never publicly reachable.

**Major components:**
1. **Submission Service + Boundary Engine** — the public front door; runs the non-bypassable 8-code rules engine *before* anything is persisted as a candidate; rate-limited.
2. **Domain / Workflow Services** — the integrity core: the entry state machine + the single `persist()` write path enforcing schema invariants, no-zero-source, free-text classifier, and separation-of-duties transition guards. The only door to the stores.
3. **Reviewer Console (RBAC)** — authenticated staff UI for triage → source verification → dual review → legal/safety gate → monitor; no self-approval, admin has no publish override.
4. **Immutable Audit Log (ReviewLog)** — append-only, per-row hash-chained, written on every transition; independently verifiable.
5. **Search Index + Public Record** — faceted (conduct/role/strength/status only) read surface fed by publish events; Right-of-Reply intake and Transparency Dashboard read from published entries + audit log.

### Critical Pitfalls

1. **Naming a living person before legal review (existential)** — make "no public naming without a recorded lawyer sign-off" a *system-enforced state*; the publish action checks for a legal-review artifact and refuses otherwise. Schema must distinguish living/deceased and alleged/convicted from the first data-model phase.
2. **Misidentification (the Tripathi failure)** — dual review must confirm *identity resolution* (the source itself names this person), not just that the conduct occurred; handle Arabic transliteration/name-variants explicitly; require identifying specificity (role/unit/facility/dates); fast right-of-reply for removal.
3. **Evidentiary-strength drift (alleged vs convicted)** — bind allowed phrasing to evidence tier in the schema; the legal/safety gate checks claim verbs against tier; serious claims cannot rest on a single Tier-C source (WEAK_SOURCE).
4. **Doxxing / transnational repression** — strip EXIF/GPS on ingest; no locating fields exist; minimal submitter data collection + anonymity; reviewers pseudonymous in the public audit trail; threat-model a state-level adversary, not a generic web app.
5. **Audit-trail tampering** — append-only + hash-chaining from day one (retrofitting is expensive/incomplete); corrections are new versioned events, never overwrites; mandatory MFA + least-privilege roles on the staff surface.

## Implications for Roadmap

Research strongly converges (STACK build order + ARCHITECTURE build order + PITFALLS phase mapping all agree): **safeguards must exist before anything they protect.** The schema's *absence* of identity fields and the single write path must land first, because no later component can then be wired around them. Suggested phase structure:

### Phase 1: Integrity Core — Identity-Free Data Model + Validation Choke Point + Audit Log
**Rationale:** Everything depends on this; building it first makes later bypass impossible. ARCHITECTURE build-order steps 1–2 and the most-cited pitfall-prevention phase.
**Delivers:** `domain/schema/` with **no identity field at all** and `entity.type` excluding group/community; living/deceased + alleged/convicted distinctions; tier↔phrasing binding; `persist()` enforcing schema invariants, `assertAtLeastOneSource()`, free-text classifier interface, and transition guards; append-only hash-chained ReviewLog with DB NOT-NULL/FK/CHECK belt-and-suspenders.
**Addresses:** Data model (no identity fields), source tiers + strength labels (FEATURES P1).
**Uses:** PostgreSQL 18 + Drizzle + pgcrypto + RLS; Zod/drizzle-zod single source of truth.
**Avoids:** Pitfalls 3 (tier-phrasing binding), 4 (no identity fields, structural), 6 (immutable audit from day one).

### Phase 2: Auth / RBAC Role Matrix
**Rationale:** Required before the reviewer console and before differentiating submitter vs staff surfaces (ARCHITECTURE step 3).
**Delivers:** Better Auth with the role matrix (visitor/submitter/reviewer/senior/admin/partner/subject), mandatory 2FA on all privileged accounts, identity-lite submitters, dual-review enforced by *distinct* authenticated identities, submitter PII compartmentalized.
**Implements:** Identity/Auth/RBAC component.
**Avoids:** Pitfall 10 (weak access control); enables structural enforcement of Pitfall 2's distinct-reviewer requirement.

### Phase 3: Submission Service + Boundary Engine
**Rationale:** The public front door; depends on schema + classifier + audit (ARCHITECTURE step 4).
**Delivers:** Rate-limited submission API; the non-bypassable 8-code rules engine (one module per code, standard reasons); submitter attestation; EXIF/GPS stripping + malware scan + magic-byte MIME on uploads; source capture + hash + tier at intake-draft.
**Addresses:** Structured intake + boundary engine (FEATURES P1).
**Avoids:** Pitfalls 4 (GROUP_TARGET auto-reject), 5 (metadata stripping, minimal collection), 8 (rate-limit, attestation).

### Phase 4: Reviewer Console + Workflow State Machine
**Rationale:** Depends on domain, audit, auth (ARCHITECTURE step 5). Separation-of-duties guards live here.
**Delivers:** Triage → source verification (authenticity + MISMATCH + media provenance/AI-gen check + source snapshot/hash) → dual independent review (with explicit identity-resolution confirmation) → legal/safety gate (framing-to-tier, privacy re-check, right-of-reply contact capture). No unilateral publish; admin has no override.
**Addresses:** Verification pipeline + legal/safety gate (FEATURES P1).
**Avoids:** Pitfalls 2 (identity-resolution review), 3 (gate checks phrasing), 7 (source snapshot/hash), 8/9 (MISMATCH, media provenance).

### Phase 5: Legal Gate Enforcement + Jurisdiction/Hosting Decision (RELEASE GATE)
**Rationale:** The #1 existential constraint. This is a *hard, non-skippable phase boundary*, not a checklist item — the system can be fully built and tested with synthetic/historical data, but real publication of any living person is blocked until lawyer sign-off on the standard, the first entries, and the hosting/incorporation jurisdiction.
**Delivers:** Publish action that refuses a living-person entry without a recorded lawyer-review artifact in the audit trail; jurisdiction/hosting chosen with counsel (defamation forum + anti-SLAPP + GDPR Art. 85 posture recorded).
**Avoids:** Pitfalls 1 (the existential pitfall) and 11 (libel tourism / hostile forum).

### Phase 6: Publish Projection + Search Index + Public Record
**Rationale:** Read surface; depends on a workflow that can mark things published (ARCHITECTURE step 6). Gated behind Phase 5 for living persons.
**Delivers:** Publish event → OpenSearch index → public record with facets by conduct/role/strength/status **only** (identity facets not expressible in the query layer); per-entry visible sources + strength label; CDN/cache in front of public reads.
**Addresses:** Public record search/filter (FEATURES P1).
**Uses:** OpenSearch with `arabic`/`icu` analyzers.
**Avoids:** Anti-pattern 4 (no identity facets), Anti-pattern 2 (read/write surface split).

### Phase 7: Right-of-Reply + Monitor/Correct + Transparency
**Rationale:** Depend on published entries existing and the audit log being populated (ARCHITECTURE step 7).
**Delivers:** Prominent fast right-of-reply producing audit-trailed corrections/removals; appeals/new-evidence/takedown; link-health monitoring; transparency dashboard (aggregate stats only, never per-target popularity).
**Addresses:** Right-of-reply + correction (FEATURES P1); transparency reporting (P2).
**Avoids:** Pitfalls 2 (fast correction), 7 (link-rot monitoring).

### Phase 8 (parallel): Bilingual Public Site + Policy Pages
**Rationale:** No dependency on the core (ARCHITECTURE step 8) — can proceed in parallel — but the anti-discrimination/Code-of-Conduct copy must match the enforced rules and be legally reviewed in both languages.
**Delivers:** Bilingual mission, "what we do / don't", Code of Conduct, anti-discrimination policy, FAQ, disclaimer/terms/privacy; victim-support referral page; full AR+EN key parity.
**Addresses:** Bilingual site + policy pages, victim-support referral (FEATURES P1).
**Avoids:** UX pitfall (AR/EN parity gaps in legal text).

### Phase Ordering Rationale

- **Dependency-driven:** Schema + choke point + audit before everything (no later bypass); auth before console; boundary engine before review; review before publish; publish before read surface and post-publish features. All three research files independently produce this order.
- **The legal gate is a phase boundary, not a task** — it sits between "system built and testable with synthetic data" and "real living-person publication." The build can proceed; publication of living persons cannot, until counsel signs off (PROJECT.md #1 constraint).
- **Safeguards-first avoids the dominant failure mode:** the technical capability to publish exists long before legal authorization; sequencing the gate as a hard blocker prevents the existential pitfall.

### Research Flags

Phases likely needing deeper research during planning (`/gsd:plan-phase --research-phase <N>`):
- **Phase 3 / 4 — Free-text incitement/hate-tone classifier (AR + EN):** Arabic NLP classification accuracy is its own research topic. MVP can start with curated banned-pattern lists + human review; ML classification is a later, separately-researched effort. Keep behind one swappable interface.
- **Phase 4 — Media provenance / AI-generated "evidence" detection:** C2PA limitations, AI-gen indicators, hashing/preservation workflow warrant a focused spike.
- **Phase 5 — Jurisdiction/hosting + anti-SLAPP + GDPR Art. 85 posture:** legal/operational judgement, not a technical fact; gated to counsel. Highest-stakes infra decision.
- **Phase 6 — OpenSearch vs Meilisearch final call + Arabic relevance benchmark:** defer behind a search interface; benchmark both on a real Arabic corpus of sample entries before committing.
- **Phase 1 — Bitemporal vs simple history table** for entry versioning (`temporal_tables` vs hand-rolled): decide in the data-layer phase.

Phases with standard patterns (can likely skip research-phase):
- **Phase 2 — Auth/RBAC:** Better Auth admin plugin RBAC + 2FA is well-documented.
- **Phase 8 — Bilingual site/policy pages:** next-intl App Router patterns are established (content/legal review is the real work, not the tech).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework, DB, auth, i18n verified against official docs / current releases. MEDIUM on Arabic-search relevance and file-integrity stack (verified with stated caveats; benchmark before committing). |
| Features | HIGH | Table stakes / anti-features grounded in established HR-documentation practice (SNHR, VDC, Uwazi, IIIM) and the project's own encoded principles/workflow/sources contracts. Differentiators MEDIUM. |
| Architecture | HIGH | Strongly determined by the project's data-model/workflow/roles contracts; cross-checked against Uwazi and standard moderation-pipeline + tamper-evident-log patterns. |
| Pitfalls | HIGH | Legal/evidence/safety grounded in Berkeley Protocol, Article 19, EU Anti-SLAPP Directive 2024/1069, GDPR Art. 10/85, documented real-world failures. MEDIUM on Syria-jurisdiction specifics (require the lawyer-review gate). |

**Overall confidence:** HIGH

### Gaps to Address

- **Hosting/incorporation jurisdiction (legal, not technical):** EU self-host recommended technically; final choice deferred to the lawyer-review gate (Phase 5). Handle as a logged Key Decision with counsel input — defamation forum + anti-SLAPP coverage + GDPR Art. 85 exemption must be confirmed for the chosen jurisdiction.
- **Arabic incitement/hate classifier accuracy:** no high-confidence off-the-shelf solution. Start with curated banned-pattern lists + mandatory human review; treat ML classification as a separately-researched future phase behind a swappable interface.
- **Arabic search relevance (OpenSearch vs Meilisearch):** verified at the analyzer level but not benchmarked on this corpus. Resolve with a phase-specific spike on sample entries before committing the engine.
- **Entry versioning model (bitemporal vs simple history):** standardization (`temporal_tables`) vs control tradeoff; decide in the Phase 1 data-layer work.
- **Media provenance / AI-gen detection maturity:** evolving; treat media as corroborating-only and lean on Tier-A/B textual sourcing regardless.

## Sources

### Primary (HIGH confidence)
- Next.js 16 (endoflife.date, nextjs.org/blog) — 16.2 LTS, Turbopack, React Compiler 1.0
- PostgreSQL 18 docs — Row Security Policies, FTS (Arabic Snowball limitations)
- Better Auth docs — admin plugin RBAC (createAccessControl), 2FA, Drizzle adapter
- next-intl App Router docs — RSC support, Arabic RTL + plural forms
- Berkeley Protocol on Digital Open Source Investigations (OHCHR / UC Berkeley) — identify/collect/preserve/verify, chain of custody
- Article 19 "International and Comparative Defamation Standards" — truth/public-interest defenses
- EU Anti-SLAPP Directive 2024/1069; GDPR Art. 10 & Art. 85
- SNHR Working Methodology; HURIDOCS Uwazi (project + GitHub + docs)
- Project contracts: .planning/PROJECT.md, content/data-model.json, content/workflow.json, content/principles.json, content/roles.json, content/sources.json

### Secondary (MEDIUM confidence)
- Drizzle vs Prisma 2026 (MakerKit); Better Auth vs Lucia vs NextAuth (LogRocket, BuildPilot) — Lucia deprecated
- Meilisearch/Charabia + Typesense Arabic tokenization discussions — weak Arabic support
- PostgreSQL audit logging via triggers (OneUptime, Bytebase); tamper-evident hash chaining (AppMaster, Tracehold)
- Violations Documentation Center, Syrian Archive methodology; content-moderation pipeline patterns (GetStream)
- C2PA / Content Credentials limitations; Syrian HRD transnational repression (US State Dept, EFF, Front Line Defenders)
- Boston Marathon / Sunil Tripathi misidentification; "Digilantism" (Oxford BJC)

### Tertiary (LOW confidence / needs validation)
- pompelmi S3 malware scanning (Apr 2026) — newer, validate in a spike
- Deepfake surge figures (~900% 2023->2025) — directional, not load-bearing
- Specific EU member-state GDPR Art. 85 / anti-SLAPP transposition status — confirm with counsel at Phase 5

---
*Research completed: 2026-05-31*
*Ready for roadmap: yes*
