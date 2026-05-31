# Iconography — حملة لستَ شجرة · HLShajara

The platform is **text-first**. In an accountability archive, clarity and unambiguous labels matter more
than decorative iconography, and a restrained icon vocabulary reinforces the sober, document-like tone.

## What the source project ships

The HLShajara repository ships **no icon set, icon font, or SVG sprite**, and **no emoji** in product copy.
So this design system does **not** invent one. Instead it uses:

- **Typographic marks** — source-tier letters in monospace (`A` / `B` / `C`), evidence-strength and status
  rendered as **labels + a small filled dot**, not glyphs.
- **A few Unicode UI marks**, used consistently:
  - `✓` confirmed / reviewer approved
  - `✕` disallowed / rejected (e.g. the "no identity filter" notice)
  - `◴` pending / awaiting second reviewer
  - `←` / `→` back navigation (direction-aware: flips in RTL)
- **The seal** (`assets/logo.jpeg`) — the only brand image. Never recolored, never on busy backgrounds.

## Rules

- **No emoji, anywhere.** Not in UI, not in copy, not as bullets or status.
- **No hand-drawn SVG illustrations.** Imagery is limited to the seal.
- **Color follows meaning, not decoration.** Brass = evidence; green = institutional/strongest; muted
  brick = correction/rejection; stone dots = neutral status.
- Marks must always be paired with a **text label** (bilingual) — never an icon alone for a critical action.

## If real icons become necessary

Some surfaces (a future reviewer dashboard, settings) may need true icons. When that happens:

- **Sanctioned substitute: [Lucide](https://lucide.dev)** — 1.5px stroke, rounded joins, `currentColor`.
  Load from CDN; size at 18–20px inline with text. It is line-based and quiet, which suits the tone.
- This is a **flagged substitution**, not a project asset — the source project has no icons of its own.
  Keep usage minimal and functional (navigation, file/source types, audit actions). Never use filled,
  multicolor, or playful icon styles.

```html
<!-- only if genuinely needed -->
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="file-text" style="width:18px;height:18px;color:var(--fg2)"></i>
```

> Status: **substitution flagged.** If the project later adopts an official icon set, replace this guidance
> and add the assets to `assets/icons/`.
