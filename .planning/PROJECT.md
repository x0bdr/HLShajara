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

## Current Milestone: v1.2 Frontend Polish

**Goal:** Fix all UI/UX gaps from the 6-pillar audit, unify the design language across all pages, and make the platform feel like a single coherent product.

**Target features:**
- Shared page shell (Header + Footer on all pages)
- Dashboard redesign using design tokens only
- Evidence card click-through to entity detail
- Pagination for archive views
- Loading skeletons and error states
- Unified search/filter component
- Mobile filter UX (collapsible sidebar)
- Translation gap fixes
- Typography consistency (remove inline styles)
- Empty state design
- Login UX improvements (show password, visible labels)

**Shipped:**
- v1.0 Foundation (2026-05-31) — see `.planning/milestones/v1.0-ROADMAP.md`
- v1.1 Hardening (2026-05-31) — all 17 requirements code-complete and deployed

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

### Validated (v1.1)

- ✓ AUTH-01 — Mandatory 2FA for staff (TOTP via Better Auth twoFactor plugin)
- ✓ AUTH-03 — Login UI page exists and works in both AR/EN
- ✓ INTAKE-02 — Complete auto-reject reason codes (8 rules)
- ✓ INTAKE-04 — Distributed rate limiting (PostgreSQL-backed)
- ✓ INTAKE-05 — ClamAV malware scanning on file uploads
- ✓ VERIFY-01 — Structured triage fields in reviewer console
- ✓ VERIFY-02 — Source verification workflow
- ✓ VERIFY-03 — Dual independent review enforcement
- ✓ VERIFY-04 — Phrasing-to-evidence-strength match + privacy re-check
- ✓ LEGAL-01 — Functional `isDeceased` check in publish API
- ✓ LEGAL-02 — Operating jurisdiction Key Decision recorded
- ✓ RECORD-01 — Filter UI for status, type, evidence strength
- ✓ RECORD-03 — Materialized view for published entities
- ✓ REPLY-02 — Reply processing workflow
- ✓ TRANS-01 — Public transparency dashboard
- ✓ SITE-02 — Dedicated anti-discrimination policy page
- ✓ DATA-05 — Real research data seeding

### Active (v1.2)

- [ ] **UI-01** — Shared page shell (Header + Footer on all pages)
- [ ] **UI-02** — Dashboard redesign using design tokens only
- [ ] **UI-03** — Evidence card click-through to entity detail
- [ ] **UI-04** — Pagination for archive views
- [ ] **UI-05** — Loading skeletons and error states
- [ ] **UI-06** — Unified search/filter component shared between homepage and /record
- [ ] **UI-07** — Mobile filter UX (collapsible sidebar)
- [ ] **UI-08** — Translation gap fixes (status labels, filter notice, creeds)
- [ ] **UI-09** — Typography consistency (remove inline styles, use .ds-* classes)
- [ ] **UI-10** — Empty state design with CTA
- [ ] **UI-11** — Stats bar empty state (show — instead of 0)
- [ ] **UI-12** — Login UX improvements (show password, visible labels, error styling)

### Out of Scope

- Boycott / social-pressure / mobilization features
- Targeting/tagging/filtering by religion, sect, ethnicity, family, region, tribe
- Publishing home addresses, live locations, or contact details
- Naming children or clearly uninvolved persons
- Crowd voting on guilt; unmoderated public comments
- Engagement/virality metrics
- Anonymous-rumor-only entries
- Partner API (v2.0)
- Export/citation tooling (v2.0)
- AI-assisted triage classifier (v2.0)
- Mobile app / PWA
- Dark mode

## Context

- Grew out of a desire for accountability and non-impunity for crimes in Syria, reframed
  away from any collective/identity targeting toward a lawful, evidence-based, named-actor archive.
- v1.0 shipped rapidly in a single day (2026-05-31) with 28 commits.
- v1.1 focused on operational hardening and was code-complete same day.
- v1.2 addresses the UI/UX gaps identified in the 6-pillar audit (UI-REVIEW.md, score 16/24).
  The backend is solid; the frontend feels like multiple products stitched together.
- Key gap: pages like `/record`, `/submit`, `/entity`, `/login`, `/dashboard` have no
  Header or Footer, breaking navigation context. Dashboard uses bright rainbow colors
  that violate the design system's muted palette.

## Constraints

- **Legal**: No living individual is named publicly until a qualified lawyer in the operating
  jurisdiction reviews the publication standard and the first entries.
- **Editorial**: Named individuals/entities only, tied to specific conduct; every claim cited to
  a credible public source.
- **Structural**: Anti-discrimination boundaries enforced in code/schema, not policy alone.
- **Tone**: Serious, legal, human-rights focused, non-sectarian.
- **i18n**: Full AR + EN key parity.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope = documentation/accountability archive | Lawful channels prevent misuse | ✅ v1.0 |
| Anti-discrimination in data model | Structurally impossible to target by identity | ✅ v1.0 |
| Lawyer-review gate before naming living persons | Defamation + data-protection risk | ✅ v1.0 |
| Phase 9 inserted post-audit | Close critical safety gaps inline | ✅ v1.0 |
| Staging on test-sanad | Existing infrastructure; serverful deployment | ✅ v1.0 |
| Email-OTP for 2FA (v1.1) | TOTP plugin unavailable in Better Auth v1.4.7 | ✅ v1.1 |
| v1.2 = Frontend Polish milestone | UI audit score 16/24; user-facing inconsistency is blocking | — v1.2 |

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

*Last updated: 2026-05-31 — v1.2 Frontend Polish initialized*
