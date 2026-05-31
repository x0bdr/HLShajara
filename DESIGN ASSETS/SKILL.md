---
name: hlshajara-design
description: Use this skill to generate well-branded, bilingual (Arabic RTL · English LTR) interfaces and assets for HLShajara (حملة لستَ شجرة) — a civic documentation and accountability archive. Contains design guidelines, color & type tokens, the Thmanyah fonts, the campaign seal, and an Archive UI kit. Scoped to evidence-based, named-individual accountability only — never collective/identity targeting.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key files:
- `README.md` — product context, sources, content fundamentals, and visual foundations.
- `colors_and_type.css` — the token layer (color scales + semantic vars, type roles, spacing, radii, shadows, motion). Link this first.
- `ICONOGRAPHY.md` — icon approach (text-first; Lucide as a flagged substitute).
- `fonts/` — Thmanyah Serif Display / Serif Text / Sans (self-hosted, all weights).
- `assets/` — the campaign seal (`logo.jpeg`).
- `preview/` — design-system specimen cards.
- `ui_kits/archive/` — interactive bilingual recreation of the archive + reviewer console.

If creating visual artifacts (mocks, slides, throwaway prototypes), copy assets out and produce static
HTML for the user to view. If working on production code, copy assets and apply the rules here to design
as an expert in this brand.

**Hard boundary — non-negotiable.** Build only for evidence-based accountability of **named individuals
and entities tied to documented conduct**, each with a credible public source. Do **not** build
components or copy whose purpose is boycott, "social pressure," or targeting of any community, sect,
ethnicity, family, or region as a group. Filter/tag by **conduct, role, and evidence strength — never
identity**. This matches the project's own data model and rejection rules.

If the user invokes this skill without other guidance, ask what they want to build, ask a few focused
questions (surface, audience, language(s), LTR/RTL, fidelity), and act as an expert designer who outputs
HTML artifacts or production code as needed — always respecting the boundary above.
