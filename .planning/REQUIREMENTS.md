# Requirements — HLShajara v1.1 Hardening

Scope: Close operational gaps from v1.0, harden for production use with real data, complete reviewer workflow.

## v1.1 Requirements

### Authentication & Access (AUTH)
- [ ] **AUTH-01**: Staff authenticate with mandatory 2FA (email-OTP via Better Auth; TOTP plugin unavailable in v1.4.7)
- [ ] **AUTH-03**: Login UI page exists and works in both AR/EN

### Internal Draft & Boundary Engine (INTAKE)
- [ ] **INTAKE-02**: Draft validation auto-rejects with all 8 reason codes: GROUP_TARGET, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE, INCITEMENT
- [ ] **INTAKE-04**: Rate limiting is distributed (Redis or PostgreSQL-backed) and covers all internal endpoints
- [ ] **INTAKE-05**: Uploaded files are scanned for malware (ClamAV or similar) before storage

### Verification Pipeline (VERIFY)
- [ ] **VERIFY-01**: Reviewer console has structured triage fields: confirm named actor, specific conduct, assign category
- [ ] **VERIFY-02**: Reviewer verifies each source (exists, authentic, supports claim, credible tier) and captures snapshot/hash at verification time
- [ ] **VERIFY-03**: Two independent reviewers of distinct identities must agree, including explicit identity-resolution confirmation, before entry advances
- [ ] **VERIFY-04**: Legal/safety gate matches published phrasing to evidence-strength tier and re-checks privacy before publish

### Legal Gate (LEGAL)
- [ ] **LEGAL-01**: Publish action correctly checks `isDeceased` status (not hardcoded) before applying lawyer-sign-off requirement
- [ ] **LEGAL-02**: Operating jurisdiction + hosting decision is recorded as a gated Key Decision in the system

### Public Record (RECORD)
- [ ] **RECORD-01**: Public record page exposes UI filters for status, type, and evidence strength
- [ ] **RECORD-03**: Public reads are served from a separate publish projection (materialized view or table) — drafts never exposed

### Right-of-Reply & Correction (REPLY)
- [ ] **REPLY-02**: Named party replies can be approved, corrected, or rejected by admin; corrections/unpublishes record reason in audit trail

### Transparency (TRANS)
- [ ] **TRANS-01**: Public transparency dashboard shows aggregate published / rejected / corrected counts

### Public Site (SITE)
- [ ] **SITE-02**: Dedicated anti-discrimination policy page exists in both AR/EN

### Data & Operations (DATA)
- [ ] **DATA-05**: Real research data is seeded (replace 3 demo entries with actual documented cases)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 10 | Pending |
| AUTH-03 | Phase 10 | Pending |
| INTAKE-02 | Phase 15 | Pending |
| INTAKE-04 | Phase 15 | Pending |
| INTAKE-05 | Phase 15 | Pending |
| VERIFY-01 | Phase 11 | Pending |
| VERIFY-02 | Phase 11 | Pending |
| VERIFY-03 | Phase 11 | Pending |
| VERIFY-04 | Phase 11 | Pending |
| LEGAL-01 | Phase 15 | Pending |
| LEGAL-02 | Phase 15 | Pending |
| RECORD-01 | Phase 12 | Pending |
| RECORD-03 | Phase 12 | Pending |
| REPLY-02 | Phase 13 | Pending |
| TRANS-01 | Phase 14 | Pending |
| SITE-02 | Phase 15 | Pending |
| DATA-05 | Phase 15 | Pending |

## Out of Scope (v1.1)

- Partner API (v2.0)
- Export/citation tooling (v2.0)
- AI-assisted triage classifier (v2.0)
- Formal appeals process (v2.0)
- Mobile app
- Offline mode

---
*Created: 2026-05-31 for v1.1 Hardening milestone*
