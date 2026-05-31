# Architecture Research

**Domain:** Bilingual (AR/EN) human-rights documentation & accountability platform — sourced, named-actor public record with non-bypassable anti-abuse boundary, dual review, legal/safety gate, and immutable audit trail.
**Researched:** 2026-05-31
**Confidence:** HIGH (architecture is strongly determined by the project's own data-model/workflow/roles contracts; cross-checked against established HR-documentation tooling — HURIDOCS Uwazi — and standard moderation-pipeline + tamper-evident-log patterns)

## Standard Architecture

This domain has a recognizable shape: a **publication pipeline** (intake → triage → verify → dual review → gate → publish → monitor) sitting behind a **public read surface**, with a **separate write/review surface**, and a **cross-cutting audit + policy-enforcement layer** that every state transition must pass through. The defining property here is that the safeguards (anti-discrimination, no-zero-source) are not features bolted on — they are *structural invariants* enforced at the lowest layer (schema + a single validation choke point) so no caller can route around them.

The closest established analog is **HURIDOCS Uwazi** (open-source HR documentation DB: entity/document templates, thesauri, connections, public submission forms, full-text + faceted search over a document store with Elasticsearch). HLShajara differs from Uwazi in two ways that drive the architecture: (1) a *hard* pre-save boundary engine that rejects categories of submission, and (2) a *multi-actor approval workflow with separation of duties* required before anything becomes public. Those two requirements are what make this more than "a database with a form."

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PUBLIC SURFACE (read-only)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Public Site  │  │ Public Record│  │ Right-of-    │  │Transparency│ │
│  │ (mission,    │  │ Search/Filter│  │ Reply intake │  │ Dashboard  │ │
│  │ policy, i18n)│  │ (NEVER by ID)│  │ (named party)│  │ (metrics)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │  reads published, evidence-strength-labelled entries only    │
└─────────┼─────────────────┼─────────────────┼────────────────┼────────┘
          │                 │  ══════ TRUST BOUNDARY (anon public) ══════
          ▼                 ▼                  ▼                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       SUBMISSION SERVICE                               │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │  Submission API  →  *** BOUNDARY / ANTI-ABUSE ENGINE ***         │ │
│   │  (every submission MUST pass; rejects with reason code)          │ │
│   │  GROUP_TARGET · INCITEMENT · NO_SOURCE · WEAK_SOURCE ·           │ │
│   │  PRIVATE_TARGETING · INNOCENT_PARTY · MISMATCH · HATE_TONE       │ │
│   └─────────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────────┼────────────────────────────────────┘
                                   │  accepted draft only
          ══════════════ TRUST BOUNDARY (staff-only) ══════════════
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  REVIEWER CONSOLE  (authenticated, RBAC)               │
│   triage → source_verification → dual_review → legal_safety_gate       │
│   → publish → monitor_and_correct                                      │
│   (no single role publishes; two independent reviewers + gate)         │
└─────────────────────────────────┬────────────────────────────────────┘
                                   │  reads/writes via Domain Services
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│              DOMAIN / WORKFLOW SERVICES  (state machine)               │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  *** VALIDATION CHOKE POINT (single write path) ***            │   │
│   │  - schema invariants (no identity field exists at all)         │   │
│   │  - no-zero-source guard (Allegation w/o Source = reject)       │   │
│   │  - banned-pattern + incitement classifier on EVERY free-text   │   │
│   │  - state-transition guard (who may move what, when)            │   │
│   └──────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│                          DATA STORES                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────────┐    │
│  │ Entity / │ │ Source / │ │ Right-of-│ │  Immutable Audit Log    │    │
│  │Allegation│ │ evidence │ │  Reply   │ │  (append-only, hash-    │    │
│  │  store   │ │  refs    │ │          │ │  chained ReviewLog)     │    │
│  └────┬─────┘ └──────────┘ └──────────┘ └────────────────────────┘    │
│       │ (publish event projects to)                                    │
│       ▼                                                                │
│  ┌──────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Search Index          │   │ Identity / Auth / RBAC               │  │
│  │ (published only,      │   │ (visitor/submitter/reviewer/senior/  │  │
│  │  faceted by conduct/  │   │  admin/partner/subject)              │  │
│  │  role/strength/status)│   │                                      │  │
│  └──────────────────────┘   └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility (owns) | Typical Implementation |
|-----------|----------------------|------------------------|
| **Public Site** | Mission, "what we do/don't", Code of Conduct, anti-discrimination policy, FAQ, legal/terms/privacy — fully bilingual | Static/SSG pages with i18n bundles (AR+EN key parity); no DB writes |
| **Public Record (Search/Filter)** | Read-only browse of *published* entries; facets by conduct, role, evidence strength, status — **never by identity**; per-entry sources visible | Server-rendered list/detail backed by the search index, not the write DB |
| **Submission Service + Boundary Engine** | Accepts public submissions; runs the **non-bypassable** rules engine that rejects GROUP_TARGET / INCITEMENT / NO_SOURCE / WEAK_SOURCE / PRIVATE_TARGETING / INNOCENT_PARTY / MISMATCH / HATE_TONE *before anything is persisted as a candidate* | Stateless API service in front of the domain layer; returns reason codes; rate-limited |
| **Reviewer Console** | Authenticated staff UI for triage, source verification, dual review, legal/safety gate, monitor/correct; enforces separation of duties (no self-approval) | Separate authenticated app/route group; talks only to domain services |
| **Domain / Workflow Services** | The entry state machine + the **single validation choke point**; the only path that writes Entity/Allegation/Source; emits audit + publish events | Service layer with explicit state-transition guards; one `persist()` boundary |
| **Entity / Allegation / Source Store** | Canonical records. Entity has `role_or_position` (role, NOT identity); `type` is individual/org/unit/branch/body — **never a group/community** | Relational (Postgres) recommended for integrity constraints + transitions; or document store (Uwazi uses MongoDB) |
| **Immutable Audit Log (ReviewLog)** | Append-only, tamper-evident record of every action (actor, action, note, timestamp, target) across the whole lifecycle | Append-only table + per-row hash chaining (each row hashes the previous) for tamper-evidence |
| **Search Index** | Fast faceted/full-text search over **published entries only** | Elasticsearch/OpenSearch (Uwazi's choice) or Postgres FTS at small scale; updated by publish events only |
| **Right-of-Reply** | Named-party statement/correction intake + publication toggle, linked to the Entity | Dedicated entity + workflow; partner_org/admin handle |
| **Transparency Dashboard** | Public metrics: submissions received/rejected by reason, time-to-review, corrections/takedowns, quarterly methodology report | Read-only aggregation over audit log + entry states |
| **Identity / Auth / RBAC** | Who is who; enforces the role matrix; identity-lite for submitters, vetted accounts for staff/partners | Auth provider + role/permission middleware on every staff route |

## Recommended Project Structure

```
src/
├── public-site/            # bilingual marketing/policy pages (SSG)
│   ├── content/            # AR + EN bundles, key-parity enforced
│   └── pages/
├── public-record/          # read-only search/browse of published entries
│   ├── search/             # query builder — facets exclude identity by design
│   └── views/              # list + entry detail (sources + strength label)
├── submission/             # PUBLIC write surface
│   ├── api/                # submission endpoints (rate-limited)
│   └── boundary/           # *** anti-abuse rules engine ***
│       ├── rules/          # one module per rejection code
│       ├── classifier.ts   # banned-pattern + incitement on free-text
│       └── index.ts        # single screen() entry point
├── review/                 # AUTHENTICATED staff surface (reviewer console)
│   ├── triage/
│   ├── verification/
│   ├── dual-review/
│   ├── legal-safety-gate/
│   └── monitor/            # appeals, rebuttals, takedowns, re-audit
├── domain/                 # *** the integrity core ***
│   ├── schema/             # entity/allegation/source/reply types — NO identity field
│   ├── validation/         # single choke point: invariants + no-zero-source + classifier
│   ├── workflow/           # state machine + transition guards (separation of duties)
│   ├── persist.ts          # the ONLY write path to stores
│   └── events.ts           # emits audit + publish projections
├── audit/                  # append-only, hash-chained ReviewLog + verifier
├── search-index/           # projection from publish events → index
├── right-of-reply/         # named-party intake + publication
├── transparency/           # public metrics aggregation
└── auth/                   # identity-lite + RBAC role matrix middleware
```

### Structure Rationale

- **`submission/boundary/` is its own module and the public API depends on it, never the reverse.** The boundary engine is the front door; it cannot be skipped by composing endpoints differently.
- **`domain/persist.ts` is the single write path.** Reviewer console, submission service, and admin tools all call into it — none touches the stores directly. This guarantees the validation choke point runs on *every* mutation.
- **`domain/schema/` has no identity field at all.** Anti-discrimination is enforced by *absence*: there is literally nothing to write sect/religion/ethnicity/tribe/family into. This is stronger than validation — it is structural impossibility (per PROJECT.md and data-model.json hard_constraints).
- **`public-record/` reads from `search-index/`, not the write DB.** Public traffic never hits the integrity core; the public surface can only ever see published, labelled entries.
- **`audit/` is write-once and verifiable independently** of the rest of the system.

## Architectural Patterns

### Pattern 1: Single Validation Choke Point (Mandatory Pass-Through)

**What:** All writes funnel through one `persist()`/`validate()` boundary that enforces schema invariants, the no-zero-source rule, the free-text classifier, and transition guards. No component writes to a store directly.
**When to use:** Whenever a safeguard must be *guaranteed* rather than *encouraged* — i.e., the entire reason this project exists.
**Trade-offs:** Slight verbosity (everything routes through one layer); in exchange you get a single auditable place where invariants are proven and a guarantee no future feature can bypass them.

```typescript
// domain/persist.ts — the only write path
async function persist(draft: EntryDraft, actor: Actor) {
  assertNoIdentityFields(draft);            // structural: should be impossible by type
  assertAtLeastOneSource(draft.allegation); // NO_SOURCE invariant
  await classifyFreeText(draft);            // banned-pattern + incitement on every field
  assertTransitionAllowed(draft, actor);    // separation of duties
  const saved = await store.write(draft);
  await audit.append({ actor, action: draft.transition, target: saved.id });
  return saved;
}
```

### Pattern 2: Separation-of-Duties State Machine (No Unilateral Publish)

**What:** An entry advances through explicit states (intake → triage → source_verification → dual_review → legal_safety_gate → published → monitored). Transition guards require *two independent reviewers* to agree and a *senior/legal-safety* sign-off; the same actor cannot fill two required roles, and **admin cannot bypass dual review** (roles.json).
**When to use:** Any high-stakes publication workflow where a single mistaken/malicious actor must not be able to publish.
**Trade-offs:** More states and assignment logic; in exchange, publication is provably the product of multiple independent humans.

```typescript
// domain/workflow — guard example
function canPublish(entry, actor) {
  return entry.dualReview.approvals.length === 2
    && allDistinctActors(entry.dualReview.approvals)
    && entry.legalSafetyGate.signedBy?.role === 'senior_or_legal_safety_reviewer'
    && actor.role !== 'submitter';
  // admin has NO override path here
}
```

### Pattern 3: Read/Write Surface Split via Publish Projection

**What:** The integrity core owns canonical records; a **publish event** projects published entries into the search index and the public read model. The public never queries the write DB.
**When to use:** When the read surface is anonymous/high-volume and the write surface is sensitive — exactly this domain.
**Trade-offs:** Eventual consistency between publish and visibility (acceptable — publication is a deliberate, human-gated act, not real-time). Buys you a clean trust boundary and the ability to keep drafts/rejected submissions entirely invisible to the public.

### Pattern 4: Append-Only Hash-Chained Audit Trail

**What:** ReviewLog rows are insert-only; each row stores a hash of (its contents + previous row's hash), forming a tamper-evident chain. Append-only alone is *not* tamper-evident — chaining is what makes after-the-fact edits detectable (per the audit-log literature).
**When to use:** When the audit trail itself is a credibility asset (a defamation/accountability platform's survival depends on "we can prove what happened, when, and who did it").
**Trade-offs:** Slightly more write cost and a periodic verification job; in exchange the trail withstands legal scrutiny and insider tampering.

## Data Flow

### Submission → Publication Flow (the core pipeline)

```
[Submitter (identity-lite, authed)]
        ↓ submit (named actor + specific conduct + ≥1 source + attestation)
[Submission API]
        ↓
[BOUNDARY ENGINE]  ──reject(reason_code)──▶ [Submitter sees reason]  ──▶ [audit: rejection logged]
        ↓ accept (candidate draft)
[Triage]  (reviewer: named actor? specific conduct? assign category)
        ↓
[Source Verification]  (each source: exists, authentic, supports the claim, credible tier)
        ↓
[Dual Review]  (TWO independent reviewers must agree; disagreement → escalate)
        ↓
[Legal/Safety Gate]  (phrasing matched to evidence strength; privacy/safety re-check;
                      right-of-reply contact recorded; lawyer review before first live persons)
        ↓ publish (human decision, logged immutably)
[Entity/Allegation/Source store]  ──publish event──▶ [Search Index] ──▶ [Public Record]
        ↓
[Monitor & Correct]  (appeals, rebuttals, new evidence, takedowns; versioned)
        │
        └────────────▶ [Immutable Audit Log] (every transition appends a row, all stages)
```

### Right-of-Reply Flow

```
[Subject / Named Party]  →  [Right-of-Reply intake]  →  [partner_org / admin handling]
        →  [senior reviewer routes]  →  statement published (toggle) + linked to Entity
        →  [audit log]; may trigger re-audit / correction of the original entry
```

### Trust Boundaries (explicit)

1. **Anonymous public ↔ Submission Service:** the boundary engine is the gate; nothing the public sends becomes a candidate until it passes.
2. **Submission Service ↔ Reviewer Console:** accepted drafts cross from public-facing to staff-only; submitters can track status but not see other submissions.
3. **Everything ↔ Domain validation choke point:** all writes pass schema invariants + no-zero-source + classifier + transition guard.
4. **Write core ↔ Public read surface:** only the publish projection crosses; rejected/draft data never reaches the public record.

### Where the structural safeguards live (for the roadmap)

| Safeguard | Enforced at | Mechanism |
|-----------|-------------|-----------|
| **No identity-based targeting** | `domain/schema/` (data layer) | The field *does not exist*; `entity.type` enum excludes group/community. Structural impossibility, not validation. |
| **No zero-source publication** | `domain/validation/` (single choke point) | `assertAtLeastOneSource()` runs on every Allegation save/publish; DB-level NOT-NULL/FK + check constraint as belt-and-suspenders. |
| **No incitement / hate / group-targeting language** | `submission/boundary/` (intake) + `domain/validation/` (every free-text write) | Banned-pattern + incitement classifier runs twice: at the public front door and again on any staff edit. |
| **No unilateral publish** | `domain/workflow/` transition guards | Two distinct reviewers + senior/legal-safety gate; admin has no override. |
| **Tamper-evident accountability** | `audit/` | Append-only, hash-chained ReviewLog written on every transition. |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k entries / low traffic | Single deployable monolith with the module boundaries above. Postgres FTS can serve search; no separate Elasticsearch needed. SSG public site. This is correct for v1. |
| 1k–100k entries | Move search to Elasticsearch/OpenSearch (Uwazi's path) via the publish projection. CDN/cache the public read surface aggressively (it's all published, public data). |
| 100k+ entries | Split the reviewer console and submission service into separate deployables; keep the domain core and audit log central. Read replicas for the public read model. |

### Scaling Priorities

1. **First bottleneck: public search read load** — entirely cacheable because it serves only published, immutable-until-corrected data. Fix with CDN + a dedicated search index before touching anything else.
2. **Second bottleneck: reviewer throughput (human, not machine)** — the dual-review + legal gate is intentionally slow. The architectural answer is better triage/queue tooling in the console (queue by category + evidence strength, per roles.json), not removing review steps.

## Anti-Patterns

### Anti-Pattern 1: Treating safeguards as validation rules in the API layer

**What people do:** Put the "no group targeting / no zero source" checks in request handlers.
**Why it's wrong:** A new endpoint, admin tool, import job, or migration can write around them, and the safeguard silently disappears. For a platform whose credibility *is* the safeguards, that's existential.
**Do this instead:** Enforce in the schema (absent fields) + a single domain write path that every caller must use. Validation in the API is an *additional* early reject, never the only line of defense.

### Anti-Pattern 2: One unified app for public reading and staff reviewing

**What people do:** Serve the public record and the reviewer console from the same authenticated app/DB.
**Why it's wrong:** Anonymous traffic now reaches the integrity core; draft/rejected/sensitive data is one bug away from leaking; the trust boundary blurs.
**Do this instead:** Split read (public, projection-fed) from write (staff, RBAC-gated). Only the publish projection crosses the boundary.

### Anti-Pattern 3: Mutable audit log / "edit history" table

**What people do:** Use an updatable table or ORM soft-deletes as the "audit trail."
**Why it's wrong:** Append-only-by-convention is not tamper-evident; an insider or bug can rewrite history with no fingerprint, destroying the trail's evidentiary value.
**Do this instead:** Insert-only table with per-row hash chaining + periodic chain verification; never expose update/delete on it.

### Anti-Pattern 4: Letting the public record be searchable/filterable by identity

**What people do:** Add convenient facets (by name, by region) to the public search.
**Why it's wrong:** Region/community/family facets reintroduce exactly the identity-targeting the project forbids; even a name-autocomplete can become a targeting tool.
**Do this instead:** Facets are conduct, role, evidence strength, status — only. Build the search query layer so identity facets are not expressible.

### Anti-Pattern 5: Admin "publish override" for convenience

**What people do:** Give admin a button to push something live to clear a backlog.
**Why it's wrong:** It collapses separation of duties — the single most important defamation safeguard. roles.json explicitly forbids it.
**Do this instead:** No publish path exists that bypasses dual review + legal/safety gate. Admin manages users/categories/appeals/takedowns, not publishing.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Incitement/hate classifier | Library or API behind `boundary/classifier.ts` | Must run on every free-text field (data-model hard_constraint). Keep behind one interface so the model can be swapped; consider AR+EN coverage explicitly. |
| Source/link verification | Service in `verification/` | Checks URL liveness/archival; pair with manual reviewer confirmation that source *supports the specific claim* (MISMATCH rule). Consider link-archiving (e.g., a snapshot service) so evidence survives link rot. |
| Auth provider | Behind `auth/` middleware | Identity-lite for submitters; stronger vetting for reviewer/senior/partner roles. |
| Object storage (uploaded documents) | Referenced via `Source.url_or_document_ref` | Evidence files stored outside the relational store; access-controlled; never publicly enumerable. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Submission API ↔ Boundary Engine | Direct, mandatory in-process call | The API cannot accept a submission without a passing screen result. |
| All writers ↔ Domain `persist()` | Direct, single path | The only door to the stores; runs the choke-point checks. |
| Domain ↔ Search Index | Event/projection (publish event) | One-directional; index is derived, never authoritative. |
| Workflow ↔ Audit Log | Append on every transition | Synchronous append within the same transaction as the state change where possible, for completeness. |
| Public Record ↔ Stores | None (only via Search Index) | Hard boundary; public never reads the write DB. |

## Build Order Implications (dependency-aware)

The roadmap should sequence so that **safeguards exist before anything they protect**. Recommended order:

1. **Domain schema + validation choke point + identity-free data model first.** Everything depends on it; building it first means no later component can be wired around it. (Includes no-zero-source invariant and the free-text classifier interface.)
2. **Immutable audit log next.** Every subsequent state transition must be able to append; building it before the workflow guarantees full-lifecycle coverage from day one.
3. **Auth / RBAC role matrix.** Required before the reviewer console and before differentiating submitter vs staff surfaces.
4. **Submission service + boundary engine.** The public front door; depends on schema + classifier + audit. This is where intake rejection codes live.
5. **Reviewer console + workflow state machine (triage → verification → dual review → legal/safety gate).** Depends on domain, audit, auth. Separation-of-duties guards live here.
6. **Publish projection + search index + public record.** Read surface; depends on a workflow that can mark things published.
7. **Right-of-reply + monitor/correct + transparency dashboard.** Depend on published entries existing and the audit log being populated.
8. **Public site / policy pages + i18n parity** can proceed in parallel (no dependency on the core) but the anti-discrimination/Code-of-Conduct copy should match the enforced rules.

**Cross-cutting constraint for the roadmap:** the *lawyer-review gate before naming any living person* (PROJECT.md) is a release gate on step 6/7, not a build step — the system can be fully built and tested with synthetic/historical data, but real publication of living individuals is blocked until legal sign-off on the standard and first entries.

## Sources

- [HURIDOCS Uwazi — open-source HR documentation database](https://huridocs.org/technology/uwazi/) — entity/template/thesaurus model, public submission forms, Elasticsearch search (MEDIUM/HIGH: official project site + GitHub)
- [huridocs/uwazi GitHub](https://github.com/huridocs/uwazi) and [Uwazi docs (Read the Docs)](https://uwazi.readthedocs.io/en/latest/admin-docs/introduction-to-uwazi.html) — Node + MongoDB + Elasticsearch stack, information-architecture concepts (MEDIUM)
- [HURIDOCS sunset of Casebox/OpenEvsys](https://huridocs.org/2020/10/sunset-of-casebox-openevsys-to-expand-uwazi/) — confirms Uwazi as the current standard tool in this domain (MEDIUM)
- [Content moderation pipeline patterns (GetStream)](https://getstream.io/blog/content-moderation-trends/) — intake → triage → human review → publish/enforcement, audit-friendly infrastructure (LOW/MEDIUM: vendor blog, corroborated across multiple sources)
- [Tamper-evident audit trails with hash chaining (AppMaster)](https://appmaster.io/blog/tamper-evident-audit-trails-postgresql) and [HMAC hash-chain audit log (Tracehold)](https://tracehold.ai/blog/immutable-audit-log-hmac-hash-chain/) — append-only is NOT tamper-evident; per-row hash chaining is required (MEDIUM: multiple independent sources agree)
- Project contracts: `.planning/PROJECT.md`, `content/data-model.json`, `content/workflow.json`, `content/roles.json` (HIGH: authoritative for this system's required structure and invariants)

---
*Architecture research for: bilingual human-rights documentation & accountability platform*
*Researched: 2026-05-31*
