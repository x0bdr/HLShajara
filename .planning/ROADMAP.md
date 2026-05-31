# Roadmap: HLShajara (لست شجرة)

## Overview

HLShajara is a bilingual, source-backed accountability archive of named actors tied to specific conduct in Syria. The build is **safeguards-first**: the integrity core (an identity-free data model, a single non-bypassable `persist()` validation choke point, and an append-only hash-chained audit log) lands before anything that depends on it, so no later component can route around the structural protections. From there, auth/RBAC enables the staff and submitter surfaces; the boundary engine guards the public front door; the reviewer console runs the dual-review verification pipeline; a **hard, non-skippable legal gate** blocks public naming of any living person until a qualified lawyer signs off; only then does the public read surface (search, facets, evidence labels) go live; right-of-reply/correction and transparency reporting close the loop. The bilingual public site and legal policy pages proceed in parallel with the backend layers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Integrity Core** - Identity-free data model + single validation choke point + append-only hash-chained audit log
- [ ] **Phase 2: Auth & RBAC** - Mandatory-2FA staff auth, least-privilege roles, identity-lite submitters, distinct-reviewer enforcement
- [ ] **Phase 3: Submission & Boundary Engine** - Public intake with the non-bypassable 8-code rules engine and media sanitization
- [ ] **Phase 4: Verification Pipeline** - Reviewer console: triage, source verification, dual independent review, legal/safety framing gate
- [ ] **Phase 5: Legal Release Gate** - HARD BOUNDARY: publish refuses any living-person entry without recorded lawyer sign-off; jurisdiction/hosting decision recorded
- [ ] **Phase 6: Public Record & Search** - Publish projection, OpenSearch facets by conduct/role/strength/status, AR/EN search, per-entry sources + labels
- [ ] **Phase 7: Right-of-Reply, Correction & Transparency** - Right-of-reply intake, audit-trailed corrections/unpublish, transparency dashboard
- [ ] **Phase 8: Bilingual Site & Policies** - AR-RTL/EN-LTR site, mission, code of conduct, anti-discrimination policy, FAQ, disclaimer/terms/privacy (parallel)

## Phase Details

### Phase 1: Integrity Core
**Goal**: The structural safeguards exist in schema and code so that identity targeting and zero-source publication are impossible by construction, and every state change is tamper-evident.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. An entity can be stored with type (individual | organization | military_unit | security_branch | official_body), role/position, status, and version — and no schema field exists anywhere for sect/religion/ethnicity/family/region/tribe.
  2. An allegation with zero linked sources cannot be saved or published — rejected at both the DB constraint and the `persist()` validation layer.
  3. Every write to the stores passes a single `persist()` choke point that runs a banned-pattern + incitement screen on free-text fields before persisting.
  4. Every state-changing action produces an append-only ReviewLog row that is hash-chained to its predecessor, and tampering with any prior row is detectable on verification.
**Plans**: TBD

### Phase 2: Auth & RBAC
**Goal**: Staff and submitters authenticate appropriately, least privilege is enforced, and no single actor can publish unilaterally.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A staff member (reviewer, senior/legal-safety reviewer, admin) cannot complete sign-in without a second factor (TOTP or passkey).
  2. Role-based access restricts each role to its least-privilege actions, and no role — including admin — can move an entry to published on its own.
  3. A submitter can authenticate with email/identity-lite and view the status of only their own submissions.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Submission & Boundary Engine
**Goal**: Members of the public can submit evidence about a named actor, and structurally disallowed submissions are rejected at the front door before becoming candidates.
**Depends on**: Phase 1, Phase 2
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04
**Success Criteria** (what must be TRUE):
  1. A user can submit evidence naming a specific individual/entity with a specific alleged act/role and at least one source link or upload.
  2. A submission that targets a group, incites, lacks a source, has a weak source, targets private/locating data, names an innocent party, mismatches its source, or uses hate tone is auto-rejected with the corresponding reason code (GROUP_TARGET, INCITEMENT, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE).
  3. Uploaded media has its EXIF/GPS metadata stripped and a content hash recorded at intake.
  4. A submitter can choose to remain anonymized, and repeated rapid submissions are rate-limited to deter brigading.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Verification Pipeline
**Goal**: Reviewers verify sources and resolve identity, two independent reviewers must agree, and a legal/safety gate matches phrasing to evidence before any entry is eligible to publish.
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria** (what must be TRUE):
  1. A reviewer can triage a submission — confirm the named actor and specific conduct and assign a category.
  2. A reviewer can verify each source (exists, authentic, actually supports the specific claim, credible tier) and a snapshot/hash of the source is captured at verification time.
  3. An entry cannot advance until two reviewers of distinct identities each agree, including an explicit identity-resolution confirmation.
  4. The legal/safety gate forces published phrasing to match the entry's evidence-strength tier and re-checks privacy before the entry is marked publishable.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Legal Release Gate
**Goal**: No living person can be published without a recorded lawyer sign-off, and the operating jurisdiction/hosting decision is recorded before any production publish.
**Depends on**: Phase 4
**Requirements**: LEGAL-01, LEGAL-02
**Success Criteria** (what must be TRUE):
  1. Attempting to publish a living-person entry without a recorded lawyer-review artifact in the audit trail is refused by the system, not merely warned against.
  2. The operating jurisdiction + hosting decision is recorded as a gated Key Decision, and production publish is blocked until that decision exists.
  3. The full pipeline (Phases 1-4) is exercisable end-to-end with synthetic/historical data while real living-person publication remains blocked.
**Plans**: TBD

### Phase 6: Public Record & Search
**Goal**: The public can browse and search the published record by conduct/role/strength/status only, with every entry showing its sources and an evidence-strength label, served from a projection that never touches the integrity core.
**Depends on**: Phase 5
**Requirements**: RECORD-01, RECORD-02, RECORD-03, RECORD-04
**Success Criteria** (what must be TRUE):
  1. The public can browse and filter the published record by conduct, role, evidence strength, and status — and no identity-category filter is expressible anywhere in the query layer.
  2. Each published entry displays its sources and an evidence-strength label spanning Under review → … → Court-confirmed.
  3. Anonymous public reads are served from a publish projection/index only and can never reach drafts, rejected submissions, or the integrity core.
  4. The same search query in Arabic and in English each returns relevant results, with Arabic-aware analysis.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Right-of-Reply, Correction & Transparency
**Goal**: Named parties can respond, entries can be corrected/unpublished with reasons in the audit trail, and the public can see aggregate accountability statistics.
**Depends on**: Phase 6
**Requirements**: REPLY-01, REPLY-02, TRANS-01
**Success Criteria** (what must be TRUE):
  1. A named party can submit a right-of-reply / correction request through a prominent surface.
  2. An entry can be corrected, updated, or unpublished, with the reason recorded as a new versioned event in the audit trail (never an overwrite).
  3. A public transparency dashboard shows aggregate published / rejected / corrected counts without exposing any per-target popularity or engagement metric.
**Plans**: TBD
**UI hint**: yes

### Phase 8: Bilingual Site & Policies
**Goal**: A bilingual public site explains the mission and the rules and carries the legal policies, with full AR/EN key parity and copy that matches the structurally enforced boundaries. Can run in parallel with the backend layers.
**Depends on**: Nothing (parallel; legal-review of copy aligns with Phase 5)
**Requirements**: SITE-01, SITE-02, SITE-03
**Success Criteria** (what must be TRUE):
  1. The site renders in both Arabic (RTL) and English (LTR) with full i18n key parity — no missing or untranslated keys in either language.
  2. The site presents mission, "what we do / don't", Code of Conduct, anti-discrimination policy, and FAQ pages whose copy matches the enforced intake rules.
  3. The site presents a legal disclaimer, terms of use, and privacy/data policy in both languages.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order. Phase 8 (bilingual site) may proceed in parallel with Phases 1-7; its policy copy should be finalized alongside the Phase 5 legal review.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Integrity Core | 0/TBD | Not started | - |
| 2. Auth & RBAC | 0/TBD | Not started | - |
| 3. Submission & Boundary Engine | 0/TBD | Not started | - |
| 4. Verification Pipeline | 0/TBD | Not started | - |
| 5. Legal Release Gate | 0/TBD | Not started | - |
| 6. Public Record & Search | 0/TBD | Not started | - |
| 7. Right-of-Reply, Correction & Transparency | 0/TBD | Not started | - |
| 8. Bilingual Site & Policies | 0/TBD | Not started | - |
