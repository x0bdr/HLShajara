# HLShajara (لست شجرة)

## What This Is

HLShajara («لست شجرة») is a civic **documentation and accountability** platform that
preserves a source-backed public record of crimes committed in Syria. It documents
**named individuals and entities** (people, organizations, military/security units,
officials) where **credible public evidence exists**, and channels that record toward
**lawful justice mechanisms** — courts, UN bodies (Commission of Inquiry / IIIM), and
sanctions advocacy — while supporting victims and memory. It is bilingual (Arabic / English).

## Core Value

Every published claim concerns a **named individual or entity** and is backed by a
**credible public source**. No source, no publication. No group, no identity-based targeting.

## Current State

**Shipped:** v1.0 Foundation (2026-05-31)

All 8 planned phases code-complete and deployed to staging (`https://staging.hlshajara.com`).
Phase 9 (critical safety closure) wired auth enforcement, audit trail, and RBAC after
milestone audit found gaps. The system is structurally functional but has significant
operational gaps before production readiness.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + next-intl | PostgreSQL 16 +
Drizzle ORM | Better Auth 1.4.7 | Sharp 0.34.5 | Staging on test-sanad (nginx + PM2)

**Codebase:** ~3,200 LOC TypeScript/React across 47 source files.

## Requirements

### Validated (v1.0)

- ✓ DATA-01 — Identity-free schema — v1.0
- ✓ INTAKE-01 — Internal draft entry with named actor + source — v1.0
- ✓ INTAKE-03 — EXIF/GPS stripping + content hash — v1.0
- ✓ RECORD-02 — Sources + evidence-strength labels — v1.0
- ✓ RECORD-04 — Arabic + English search — v1.0
- ✓ REPLY-01 — Right-of-reply submission — v1.0
- ✓ SITE-01 — Bilingual AR/EN i18n — v1.0
- ✓ SITE-03 — Legal disclaimer, terms, privacy — v1.0
- ✓ DATA-03 — persist() choke point wired — v1.0 Phase 9
- ✓ DATA-04 — Audit trail wired — v1.0 Phase 9
- ✓ AUTH-02 — RBAC enforced — v1.0 Phase 9

### Active

- [ ] AUTH-01 — Mandatory 2FA for staff (TOTP plugin unavailable in Better Auth v1.4.7; email-OTP alternative)
- [ ] INTAKE-02 — Complete auto-reject reason codes (WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH)
- [ ] INTAKE-04 — Distributed rate limiting (Redis or similar)
- [ ] VERIFY-01 — Structured triage fields in reviewer console
- [ ] VERIFY-02 — Source verification workflow (snapshot/hash, tier check)
- [ ] VERIFY-03 — Dual independent review enforcement
- [ ] VERIFY-04 — Phrasing-to-evidence-strength match + privacy re-check
- [ ] LEGAL-01 — Functional `isDeceased` check in publish API
- [ ] LEGAL-02 — Operating jurisdiction + hosting Key Decision gate
- [ ] RECORD-01 — Filter UI for status, type, evidence strength
- [ ] RECORD-03 — Separate publish projection table or materialized view
- [ ] REPLY-02 — Reply processing workflow (approve, correct, unpublish)
- [ ] TRANS-01 — Public transparency dashboard
- [ ] SITE-02 — Dedicated anti-discrimination policy page

### Out of Scope

- Boycott / social-pressure / mobilization features — this is an archive that refers to lawful channels, not a campaign
- Targeting/tagging/filtering by religion, sect, ethnicity, family, region, tribe — structurally impossible
- Publishing home addresses, live locations, or contact details — safety
- Naming children or clearly uninvolved persons — privacy of the innocent
- Crowd voting on guilt; unmoderated public comments — harassment vector
- Engagement/virality metrics — wrong incentives for an accountability archive
- Anonymous-rumor-only entries — fails the evidence standard

## Context

- Grew out of a desire for accountability and non-impunity for crimes in Syria, reframed
  away from any collective/identity targeting toward a lawful, evidence-based, named-actor archive.
- Content already organized into editable JSON under `content/` (project, principles, sources,
  data-model, workflow, roles, roadmap) and a bilingual `CONCEPT.md`.
- Aligned in spirit with established transitional-justice documentation work (UN CoI, IIIM,
  recognized human-rights organizations); intended to feed, not replace, those mechanisms.
- v1.0 shipped rapidly in a single day (2026-05-31) with 28 commits. All work executed inline
  without formal GSD phase directories.

## Constraints

- **Legal**: No living individual is named publicly until a qualified lawyer in the operating
  jurisdiction reviews the publication standard and the first entries — defamation + data-protection exposure.
- **Editorial**: Named individuals/entities only, tied to specific conduct; every claim cited to
  a credible public source (UN, courts, sanctions lists, recognized HR orgs, official filings, corroborated journalism).
- **Structural**: Anti-discrimination boundaries enforced in code/schema (no identity fields,
  no zero-source publication), not policy alone.
- **Tone**: Serious, legal, human-rights focused, non-sectarian. Justice not revenge; documentation not harassment.
- **i18n**: Full AR + EN key parity.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope = documentation/accountability archive, NOT a boycott campaign | An archive that refers to lawful channels prevents misuse; a mobilization tool cannot be safeguarded | ✅ v1.0 |
| Anti-discrimination enforced in the data model (no identity fields, no zero-source publish) | Makes collective/identity targeting structurally impossible, not just discouraged | ✅ v1.0 |
| Lawyer-review gate before naming any living person | Defamation + data-protection risk is the top threat to the project's survival | ✅ v1.0 |
| Latin brand name = "HLShajara" | User decision | ✅ v1.0 |
| Phase 9 inserted post-audit to close critical safety gaps inline | Auth, audit, RBAC gaps were blockers to structural integrity | ✅ v1.0 |
| Staging on test-sanad (Sanad infrastructure) | Existing server infrastructure; serverful deployment keeps API routes active | ✅ v1.0 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 after v1.0 milestone completion*
