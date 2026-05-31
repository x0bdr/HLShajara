# Archive — UI Kit

A high-fidelity, interactive recreation of the **HLShajara** public archive and reviewer surfaces.
Bilingual and fully bidirectional: toggle العربية / English in the header to flip the entire interface
between RTL and LTR.

> Open `index.html`. Everything is mock data — names are withheld behind brackets (`[Named Official]`)
> exactly as they would be **before the project's legal gate is passed**, which is authentic to the product.

## Screens (click-through)

1. **Archive home** — sticky header (seal + bilingual lockup + language toggle), recurring legal-note
   banner, lead statement, search field, and a **filter sidebar by conduct / role / evidence strength**
   (with the by-design notice that identity filters do not exist). Below: a grid of **evidence cards**.
2. **Entity record** — click any card. Full record: evidence-strength + legal status, the allegation,
   conduct / period / location, **source citations with tier marks**, an **audit-trail timeline**, and a
   **right-of-reply** panel. "Open in console" jumps to review.
3. **Reviewer console** — the verification pipeline (intake → triage → sources → dual review → legal gate
   → publish), a review queue, and a detail panel with **dual-review state**, legal/safety gate, the
   approve / escalate / reject actions, and the **rejection-rule codes** (`GROUP_TARGET`, `HATE_TONE`, …).

## Files

| File | Role |
|---|---|
| `index.html` | Shell — loads React + Babel, the token CSS, and the kit's component classes |
| `data.jsx` | Bilingual strings + sample entity/allegation/source records + taxonomies |
| `components.jsx` | Primitives: `Logo`, `Header`, `LegalNote`, `EvidenceStrength`, `StatusBadge`, `SourceCite`, `EvidenceCard` |
| `screens.jsx` | `ArchiveHome` (+ `FilterBar`), `EntityDetail`, `ReviewerConsole` |
| `app.jsx` | View routing + language/direction state |

## Notes & conventions

- Uses the root token layer at `../../colors_and_type.css`; the seal at `../../assets/logo.jpeg`.
- All spacing uses **logical properties**, so the single layout mirrors cleanly in RTL.
- IDs, source refs, and version stamps stay **LTR + monospace** even inside Arabic.
- These are cosmetic recreations — actions are non-functional by design (no real publish/review).
- **Boundary:** there are intentionally **no boycott / "social pressure" components**. Search and tagging
  are conduct/role/strength only — identity-based targeting is structurally absent, matching the data model.
