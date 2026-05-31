# حملة لستَ شجرة · HLShajara — Design System

A bilingual (Arabic RTL · English LTR) design system for **HLShajara** («حملة لستَ شجرة»), a civic
**documentation and accountability** archive that preserves a source-backed record of crimes committed
in Syria. The visual language is built for **dignity and solemnity** — an archive of record, not a
product launch — with high contrast, readable bilingual typography, and a disciplined, muted palette.

> **The seal reads** «حملة لستَ شجرة» — *"You are not a tree."*

---

## ⚖️ Scope of this design system (read first)

This system was built to serve the project's **legitimate, evidence-based accountability core**: the
parts of HLShajara that document **specific named individuals and entities** tied to **specific
documented conduct**, each backed by a **credible public source**, reviewed under a dual-reviewer +
legal-safety pipeline.

It deliberately **does _not_ provide components for organizing boycott or "social pressure" against any
community, sect, or group as a whole.** That collective-targeting framing appears in some of the source
campaign text, but it cannot be supported in a design system: in the Syrian context, mobilizing pressure
against a religious community by identity has fueled real-world sectarian violence. Everything here is
scoped to the platform's own hard rule — **conduct, not identity; individuals and entities only; no
group target** — which the project's data model itself enforces (there is *no* field for
sect/religion/ethnicity, and `GROUP_TARGET` / `HATE_TONE` are explicit rejection codes).

If you build with this system, keep that boundary. The components are designed so that identity-based
targeting is structurally impossible (e.g. search filters by conduct/role/strength only).

---

## Sources & provenance

This design system was derived from materials the project owner provided. You may have access to these;
they are recorded here so you can explore further and build with higher fidelity.

| Source | Reference |
|---|---|
| Campaign / platform repository | **GitHub:** `github.com/x0bdr/HLShajara` (branch `master`) — `CONCEPT.md`, `README.md`, `CLAUDE.md`, `content/*.json` |
| Brand mark | `uploads/logo.jpeg` (the green calligraphic seal) → copied to `assets/logo.jpeg` |
| Data / evidence model | `content/*.json` in the repo (imported to project root: `sources.json`, `workflow.json`, `data-model.json`, `roles.json`, `principles.json`, `project.json`) |
| Brand typeface | **Thmanyah** by ثمانية — https://font.thmanyah.com (free for commercial + web use), uploaded into `fonts/` |

Explore the GitHub repository for the full content model, planning docs, and the project's own
non-negotiable principles — they are the source of truth for tone and the data constraints.

---

## CONTENT FUNDAMENTALS

How copy is written across the platform.

- **Register: formal, restrained, exact.** This is the language of a court record, not a campaign poster.
  Every sentence is defensible. No hyperbole, no adjectives of outrage, no rhetorical questions.
- **Precision verbs are load-bearing.** The platform uses a fixed vocabulary that maps to evidentiary
  strength and must never be blurred: *alleged → credibly implicated → under investigation → indicted →
  sanctioned → convicted.* Copy uses the strongest term the evidence supports, never stronger.
- **Person ("we"), not "you".** The platform speaks as a research collective: *"We collect, verify, and
  publish…"* It addresses the reader rarely and never accuses the reader.
- **Conduct, not identity — always.** Subjects are described by **what they are credibly alleged to have
  done** and **their role/position**, never by who they are. "Commanding role · detention facility,"
  never any sect, family, region, or community.
- **Bilingual parity, not translation.** Arabic is a first-class voice, not a translated afterthought.
  Arabic copy is written natively (e.g. «الدليل لا الادّعاء»), and both languages carry equal weight in
  every component. Numbers/IDs stay LTR even inside Arabic (`ENT-2024-0117`).
- **Source-first.** Claims are paired with their citation in the same breath. The governing maxim —
  **"No source, no publication" / «لا مصدر، لا نشر»** — is a content rule, not just a policy.
- **No emoji. No slang. No exclamation.** Casing is sentence case in both languages; Latin micro-labels
  may use uppercase tracking (e.g. `SOURCES`), Arabic never does.
- **Right of reply is always present.** Named parties can respond; copy surfaces this on every record
  («حق الرد»), reinforcing fairness over accusation.

**Voice examples (verbatim from the system):**
- EN: *"An archive of record."* · *"Evidence over allegation."* · *"Conduct, not identity."*
- AR: «سجلٌّ موثَّق» · «الدليل لا الادّعاء» · «سلوك لا هوية» · «لا مصالحة فوق حق الضحايا»
- Legal note (recurring): *"This content expresses a political opinion within the scope of freedom of
  expression… It is not legal advice."*

---

## VISUAL FOUNDATIONS

**Overall mood.** Sober, archival, institutional. The page should feel like a well-set legal document or
a human-rights report — calm, high-contrast, generous in whitespace, never urgent or "designed-up."

**Color.** A muted, serious palette of three temperatures:
- **Deep pine green** (`--green-700 #264D2E`, sampled directly from the seal) is the institutional
  primary — used for the brand, primary actions, the footer field, and the *strongest* evidence rung.
- **Warm stone neutrals** (`--stone-*`) carry text, borders and surfaces. Ink is `#1B1A16` (≈13:1 on paper).
- **Warm whites** (`--paper #F7F3EA`, `--paper-raised #FCFAF3`) are the ground. Never pure-white pages.
- **A single accent — muted brass** (`--brass-500 #9A6B2B`) is *reserved* for **evidence strength**. Brass
  is never decorative; if you see brass, it means "evidence." It also serves as the focus-ring color.
- **Muted brick** (`#8C3A2E`) appears only for corrections, takedowns, and rejection codes — sparingly.
- No gradients. No neon. No saturated UI colors. Status uses muted dots, never a traffic-light palette.

**Typography.**
- **Thmanyah Serif Display** — headings and the campaign voice (calligraphic, modern Arabic serif).
- **Thmanyah Serif Text** — long-form reading (context paragraphs, statements).
- **Thmanyah Sans** — UI, labels, and body. Clean, low-contrast, screen-optimized.
- **IBM Plex Mono** — IDs, source refs, audit/version stamps (always LTR).
- Arabic uses generous line-height (1.6–1.7). Latin micro-labels may use uppercase + tracking; Arabic
  labels never do — they step up in size/weight instead.

**Spacing & layout.** 4px base scale. Centered max-width column (~1080px). Logical properties everywhere
(`margin-inline`, `border-inline-start`) so a single layout mirrors cleanly between LTR and RTL. Fixed,
quiet header; no floating action buttons; no sticky promo bars.

**Backgrounds.** Flat warm paper. No hero imagery, no full-bleed photography, no textures, no patterns,
no gradients. Imagery is limited to the seal. (The campaign's own photo set is intentionally *not* used
as decoration — it may contain named individuals and belongs to records, not chrome.)

**Borders, cards & elevation.** Cards are warm-white panels with a 1px hairline (`--border #E1DBCC`),
`12px` radius, and a **soft, low shadow** (`--shadow`) — paper resting on paper, never floating. Radii are
restrained (3–12px; pills only for labels/chips). No heavy drop shadows, no glow.

**Motion.** Calm and minimal. `200ms` with a gentle `cubic-bezier(.2,0,.2,1)` ease. Cards lift `-2px` on
hover; nothing bounces, springs, or auto-animates. Respect reduced-motion by default.

**Hover / press states.**
- *Hover:* primary green darkens (`700→800`); secondary fills with `--stone-100`; ghost gets a faint
  green tint; cards raise shadow + 2px lift; chips gain a green border.
- *Press:* primary darkens further (`→900`) with a 1px downward nudge. No scale-pop.
- *Focus:* 2px **brass** outline, 2px offset — visible and consistent for keyboard/AT users.

**Transparency & blur.** Used once, deliberately: the sticky header is `rgba(paper, .92)` with an `8px`
backdrop blur. Elsewhere surfaces are opaque — legibility over effect.

**Imagery vibe.** The only sanctioned image is the seal (deep green on warm white). It is never recolored,
never placed on busy backgrounds, and reverses by sitting on a paper chip when used on green.

---

## ICONOGRAPHY

See **`ICONOGRAPHY.md`** for the full guidance. In brief: this is a **text-first** system. The source
project ships **no icon set**, so the design system uses **typographic and Unicode marks** (`✓ ✕ ◴ ← →`,
source-tier letters `A/B/C`, status dots) rather than a decorative icon library, and **no emoji**. Where
real icons are unavoidable, the sanctioned substitute is **Lucide** (1.5px stroke, rounded) via CDN — this
is a flagged substitution, not a project asset.

---

## Index / manifest

Root files:

| File | What it is |
|---|---|
| `README.md` | This document — context, sources, content & visual foundations, manifest |
| `ICONOGRAPHY.md` | Iconography approach and rules |
| `SKILL.md` | Agent-Skill manifest (usable in Claude Code) |
| `colors_and_type.css` | **The token layer** — color scales, semantic vars, type roles, spacing, radii, shadows, motion |
| `assets/` | `logo.jpeg` (the seal), `social.jpeg` |
| `fonts/` | Thmanyah Serif Display · Serif Text · Sans (OTF, all weights) |
| `content/*.json` *(at root)* | Imported evidence/source/workflow/role model from the repo |
| `preview/` | Design-system cards (typography, color, spacing, components, brand) |
| `ui_kits/archive/` | The **Archive** UI kit (see its own README) |

UI kits:

| Kit | Path | Surfaces |
|---|---|---|
| **Archive** | `ui_kits/archive/` | Public bilingual archive (home + filters), entity record detail, reviewer console — with live AR/EN + RTL/LTR toggle |

---

## Using the tokens

Link the token layer, then use the semantic CSS vars and `.ds-*` type classes:

```html
<link rel="stylesheet" href="colors_and_type.css">
<h1 class="ds-h1">An archive of record</h1>
<p class="ds-body" style="color:var(--fg2)">No source, no publication.</p>
```

Set `dir="rtl" lang="ar"` on a container (or `<html>`) to flip the entire system to Arabic — all spacing
uses logical properties, so layouts mirror automatically.
