# Phase 29: Choice Steps — UI Design Contract

**Status:** Derived (extract + pointer)
**Authoritative source:** `.planning/UI-SPEC.md` (milestone v1.4 design contract). This phase-level
spec does **not** re-derive design — it extracts the Phase-29-relevant clauses so review can audit
against them. Any conflict resolves in favor of the milestone UI-SPEC.

> Anti-drift: reintroducing any S1–S4 field (sect/identity, loyalty/opinion, profession/sector target)
> is **rejected at design review, not negotiated** (see `.planning/reviews/2026-06-14_report-form-taxonomy-review`).

## Scope (4 choice steps)

| Step | Heading key | Cards → value | Branch |
|------|-------------|---------------|--------|
| 1 — Actor class | `submit.q_actorClass` | "An individual" → `entityType="individual"` (→Step 2); "An entity" → (→Step 1b) | individual skips 1b |
| 1b — Entity subtype | `submit.q_entitySubtype` | Organization→`organization`, Military unit→`military_unit`, Security branch→`security_branch`, Official body→`official_body` | entity branch only |
| 3 — Conduct | `submit.q_conduct` | 14 closed cards + Other → `allegationClassification` slug | — |
| 4 — Role-in-act | `submit.q_roleInAct` | 7 closed cards → appended to `entityRole` | — |

## Locked visual contract (UI-SPEC §5 — already built in Phase 28, reuse as-is)

- `.choice-grid` — 1 col mobile, `1fr 1fr` at ≥560px, `gap:var(--space-3)`.
- `.choice-card` — `padding:18px 20px`, `min-block-size:44px` (touch target), border/shadow on
  `:hover`, `:focus-visible`, `.selected`.
- `.choice-card .title` = `.ds-h3` (display font); `.choice-card .desc` = `.ds-caption`,
  `margin-block-start:4px`.
- `.choice-card .check` — **brass-500**, `opacity 0→1` when `.selected`, `margin-inline-start:auto`.
  This is the **only** sanctioned brass use in the wizard (§2.3).
- **Semantics:** `role="radiogroup"` (labelled by the step heading), each card `role="radio"` +
  `aria-checked`; roving tabindex; **Arrow** moves selection (no confirm), **Enter/Space** confirms.
- **Auto-advance:** on confirm, apply `.selected` + check, advance after `var(--dur)` (200ms), or
  **immediately** under `prefers-reduced-motion`. No Next button on choice steps.

> The `ChoiceStep` component (`src/components/wizard/ChoiceStep.tsx`) already implements all of the
> above. Phase 29 supplies the **content** (option lists + i18n) and **registry wiring**, not new chrome.

## Phase-29 behavioral contract (from CONTEXT decisions)

- Conduct cards render as **one flat radiogroup** in UI-SPEC order (5 perpetrator → 8 support → Other);
  no subheadings. "Other" is **last**, visually identical, routes onward to the description step.
- Conduct value = stable **slug** matching i18n suffix; role = clause appended to `entityRole`
  (` — role in act: <slug>`); `triageCategory`/first-class fields deferred to Phase 33.
- **Back navigation:** prior card selected **+ focused**, no re-auto-advance on mount; re-confirm
  advances; changing actor class invalidates **only** the orphaned subtype with a transient inline
  `.legal` `aria-live="polite"` notice.
- Full **EN + AR** authored for every Phase-29 key; `check:i18n` passes.

## Review targets (for gsd-ui-review)

1. Visual: cards match §5 tokens; brass only on `.check`; no new colors / no Tailwind utilities.
2. A11y: radiogroup + roving tabindex + Arrow/Enter/Space; `aria-checked`; focus on selected on Back;
   reduced-motion honored; ≥44px targets.
3. Guardrails: conduct/role sets are CLOSED — **no** sect/identity, loyalty/opinion, or profession
   target card anywhere (S2–S4 absent).
4. i18n: EN/AR parity for all added keys; RTL-safe (logical props; no Arabic uppercase/letter-spacing).
