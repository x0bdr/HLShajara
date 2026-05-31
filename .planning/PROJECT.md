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

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Bilingual (AR/EN) public site: mission, "what we do / don't", Code of Conduct, anti-discrimination policy, FAQ
- [ ] Evidence submission intake for named individuals/entities with required source(s)
- [ ] Intake boundary engine: auto-reject group-targeting, incitement, no-source, private-targeting, innocent-party submissions
- [ ] Reviewer console with source verification and dual independent review
- [ ] Legal/safety gate: phrasing matched to evidence strength + privacy re-check before publish
- [ ] Public record: search/filter (by conduct, role, evidence strength, status — never identity) with per-entry sources visible
- [ ] Evidence-strength labelling on every published entry
- [ ] Right-of-reply and correction process for named parties
- [ ] Immutable review/audit trail on every entry
- [ ] Legal disclaimer, terms, privacy/data policy

### Out of Scope

- Any boycott, social-pressure, or mobilization features — this is an archive that refers to lawful channels, not a campaign that mobilizes the public
- Targeting or tagging by religion, sect, ethnicity, family, region, tribe, or community — structurally impossible in the data model
- Publishing home addresses, live locations, or any data enabling physical targeting — safety
- Naming children or clearly uninvolved persons — privacy of the innocent
- Anonymous-rumor-only entries — fails the evidence standard

## Context

- Grew out of a desire for accountability and non-impunity for crimes in Syria, reframed
  away from any collective/identity targeting toward a lawful, evidence-based, named-actor archive.
- Content already organized into editable JSON under `content/` (project, principles, sources,
  data-model, workflow, roles, roadmap) and a bilingual `CONCEPT.md`.
- Aligned in spirit with established transitional-justice documentation work (UN CoI, IIIM,
  recognized human-rights organizations); intended to feed, not replace, those mechanisms.

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
| Scope = documentation/accountability archive, NOT a boycott campaign | An archive that refers to lawful channels prevents misuse; a mobilization tool cannot be safeguarded | — Pending |
| Anti-discrimination enforced in the data model (no identity fields, no zero-source publish) | Makes collective/identity targeting structurally impossible, not just discouraged | — Pending |
| Lawyer-review gate before naming any living person | Defamation + data-protection risk is the top threat to the project's survival | — Pending |
| Latin brand name = "HLShajara" | User decision | — Pending |

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
*Last updated: 2026-05-31 after initialization*
