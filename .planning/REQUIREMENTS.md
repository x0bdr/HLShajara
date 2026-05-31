# Requirements — HLShajara v1.1 Hardening

Scope: Close operational gaps from v1.0, harden for production use with real data, complete reviewer workflow.

## v1.1 Requirements

### Authentication & Access (AUTH)
- [x] **AUTH-01**: Staff authenticate with mandatory 2FA (TOTP via Better Auth twoFactor plugin)
- [x] **AUTH-03**: Login UI page exists and works in both AR/EN

### Internal Draft & Boundary Engine (INTAKE)
- [x] **INTAKE-02**: Draft validation auto-rejects with all 8 reason codes: GROUP_TARGET, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE, INCITEMENT
- [x] **INTAKE-04**: Rate limiting is distributed (PostgreSQL-backed) and covers all internal endpoints
- [x] **INTAKE-05**: Uploaded files are scanned for malware (ClamAV wrapper) before storage

### Verification Pipeline (VERIFY)
- [x] **VERIFY-01**: Reviewer console has structured triage fields: confirm named actor, specific conduct, assign category
- [x] **VERIFY-02**: Reviewer verifies each source (exists, authentic, supports claim, credible tier) and captures snapshot/hash at verification time
- [x] **VERIFY-03**: Two independent reviewers of distinct identities must agree, including explicit identity-resolution confirmation, before entry advances
- [x] **VERIFY-04**: Legal/safety gate matches published phrasing to evidence-strength tier and re-checks privacy before publish

### Legal Gate (LEGAL)
- [x] **LEGAL-01**: Publish action correctly checks `isDeceased` status (read from submission, not hardcoded) before applying lawyer-sign-off requirement
- [x] **LEGAL-02**: Operating jurisdiction + hosting decision is recorded as a gated Key Decision in the system

### Public Record (RECORD)
- [x] **RECORD-01**: Public record page exposes UI filters for status, type, and evidence strength
- [x] **RECORD-03**: Public reads are served from a separate publish projection (materialized view SQL provided) — drafts never exposed

### Right-of-Reply & Correction (REPLY)
- [x] **REPLY-02**: Named party replies can be approved, corrected, or rejected by admin; corrections/unpublishes record reason in audit trail

### Transparency (TRANS)
- [x] **TRANS-01**: Public transparency dashboard shows aggregate published / rejected / corrected counts

### Public Site (SITE)
- [x] **SITE-02**: Dedicated anti-discrimination policy page exists in both AR/EN

### Data & Operations (DATA)
- [x] **DATA-05**: Real research data is seeded (seed script + dynamic homepage loads from DB)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 10 | Done |
| AUTH-03 | Phase 10 | Done |
| INTAKE-02 | Phase 15 | Done |
| INTAKE-04 | Phase 15 | Done |
| INTAKE-05 | Phase 15 | Done |
| VERIFY-01 | Phase 11 | Done |
| VERIFY-02 | Phase 11 | Done |
| VERIFY-03 | Phase 11 | Done |
| VERIFY-04 | Phase 11 | Done |
| LEGAL-01 | Phase 15 | Done |
| LEGAL-02 | Phase 15 | Done |
| RECORD-01 | Phase 12 | Done |
| RECORD-03 | Phase 12 | Done |
| REPLY-02 | Phase 13 | Done |
| TRANS-01 | Phase 14 | Done |
| SITE-02 | Phase 15 | Done |
| DATA-05 | Phase 15 | Done |

## Out of Scope (v1.1)

- Partner API (v2.0)
- Export/citation tooling (v2.0)
- AI-assisted triage classifier (v2.0)
- Formal appeals process (v2.0)
- Mobile app
- Offline mode

---
*Created: 2026-05-31 for v1.1 Hardening milestone*
