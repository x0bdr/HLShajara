# Requirements — HLShajara (لست شجرة)

Scope: documentation & accountability archive. Named actors + credible sources only.
Anti-discrimination and no-zero-source are enforced **structurally**, not by policy.

## v1 Requirements

### Integrity Core & Data (DATA)
- [ ] **DATA-01**: System stores Entities (individual | organization | military_unit | security_branch | official_body) with role/position, status, and version — and has **no field** for sect/religion/ethnicity/family/region/tribe
- [ ] **DATA-02**: An Allegation cannot be saved or published with zero linked Sources (DB NOT-NULL/FK + validation choke point)
- [ ] **DATA-03**: Every write passes a single `persist()` validation choke point that runs a banned-pattern + incitement screen on free-text fields
- [ ] **DATA-04**: Every state-changing action is recorded in an append-only, hash-chained, tamper-evident audit trail (ReviewLog)

### Authentication & Roles (AUTH)
- [ ] **AUTH-01**: Staff (reviewer, senior/legal-safety reviewer, admin) authenticate with mandatory 2FA (TOTP/passkey)
- [ ] **AUTH-02**: Role-based access control enforces least privilege; no role can publish unilaterally
- [ ] ~~**AUTH-03**: Submitters authenticate with email/identity-lite and can track the status of their own submissions~~ — *Removed: entries are added by internal team only*

### Internal Draft & Boundary Engine (INTAKE)
- [ ] **INTAKE-01**: Internal researcher can draft an entry about a **named** individual/entity with a specific alleged act/role and at least one source link/upload
- [ ] **INTAKE-02**: Draft validation auto-rejects with a reason code: GROUP_TARGET, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE
- [ ] **INTAKE-03**: Uploaded media has EXIF/GPS stripped and a content hash recorded on upload
- [ ] **INTAKE-04**: Rate limiting on internal operations to deter abuse

### Verification Pipeline (VERIFY)
- [ ] **VERIFY-01**: Reviewer can triage a submission (confirm named actor + specific conduct, assign category)
- [ ] **VERIFY-02**: Reviewer verifies each source (exists, authentic, actually supports the specific claim, credible tier) and snapshots/hashes it at verification time
- [ ] **VERIFY-03**: Two independent reviewers (distinct identities) must agree, including explicit **identity-resolution** confirmation, before an entry advances
- [ ] **VERIFY-04**: Legal/safety gate matches published phrasing to evidence strength and re-checks privacy before publish

### Legal Gate (LEGAL)
- [ ] **LEGAL-01**: The publish action **refuses** any living-person entry unless a recorded lawyer sign-off exists (system-enforced release gate)
- [ ] **LEGAL-02**: Operating jurisdiction + hosting decision is recorded as a gated Key Decision before any production publish

### Public Record (RECORD)
- [ ] **RECORD-01**: Public can browse/search the published record, filtered by conduct, role, evidence strength, and status — **never** by identity category
- [ ] **RECORD-02**: Each published entry shows its sources and an evidence-strength label (Under review → … → Court-confirmed)
- [ ] **RECORD-03**: Public read surface reads only from a publish projection/index — anonymous traffic never touches drafts or the integrity core
- [ ] **RECORD-04**: Arabic + English search both return relevant results (Arabic-aware analysis)

### Right-of-Reply & Correction (REPLY)
- [ ] **REPLY-01**: A named party can submit a right-of-reply / correction request
- [ ] **REPLY-02**: Entries can be corrected, updated, or unpublished, with reasons recorded in the audit trail

### Public Site & Policies (SITE)
- [ ] **SITE-01**: Bilingual (AR RTL / EN LTR) site with full i18n key parity
- [ ] **SITE-02**: Mission, "what we do / don't", Code of Conduct, anti-discrimination policy, and FAQ pages
- [ ] **SITE-03**: Legal disclaimer, terms of use, and privacy/data policy

### Transparency (TRANS)
- [ ] **TRANS-01**: Public transparency report/dashboard with published / rejected / corrected counts

## v2 Requirements (deferred)

- [ ] **TRANS-02**: Formal appeals process with SLA
- [ ] **VERIFY-05**: AI-assisted triage / Arabic-dialect incitement-hate classifier (own evaluation)
- [ ] **INTAKE-05**: Media AI-generation / provenance (C2PA) detection as corroborating signal
- [ ] **RECORD-05**: Export/citation tooling for journalists, lawyers, researchers
- [ ] **API-01**: Vetted partner-organization API

## Out of Scope

- Boycott / social-pressure / mobilization features — this is an archive that refers to lawful channels, not a campaign (Core scope decision)
- Any targeting/tagging/filtering by religion, sect, ethnicity, family, region, tribe, community — structurally impossible (anti-discrimination)
- Publishing home addresses, live locations, or contact details — doxxing/safety
- Naming children or clearly uninvolved persons — privacy of the innocent
- Crowd voting on guilt; unmoderated public comments — harassment vector
- Engagement/virality metrics — wrong incentives for an accountability archive
- Anonymous-rumor-only entries — fails the evidence standard

## Traceability

Every v1 REQ maps to exactly one phase. Coverage: 24/24.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| INTAKE-01 | Phase 3 | Pending |
| INTAKE-02 | Phase 3 | Pending |
| INTAKE-03 | Phase 3 | Pending |
| INTAKE-04 | Phase 3 | Pending |
| ~~AUTH-03~~ | ~~Phase 2~~ | ~~Removed~~ |
| VERIFY-01 | Phase 4 | Pending |
| VERIFY-02 | Phase 4 | Pending |
| VERIFY-03 | Phase 4 | Pending |
| VERIFY-04 | Phase 4 | Pending |
| LEGAL-01 | Phase 5 | Pending |
| LEGAL-02 | Phase 5 | Pending |
| RECORD-01 | Phase 6 | Pending |
| RECORD-02 | Phase 6 | Pending |
| RECORD-03 | Phase 6 | Pending |
| RECORD-04 | Phase 6 | Pending |
| REPLY-01 | Phase 7 | Pending |
| REPLY-02 | Phase 7 | Pending |
| TRANS-01 | Phase 7 | Pending |
| SITE-01 | Phase 8 | Pending |
| SITE-02 | Phase 8 | Pending |
| SITE-03 | Phase 8 | Pending |
