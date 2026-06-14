# Phase 28 UI Design Contract — Wizard Foundation

**Canonical contract:** `.planning/UI-SPEC.md` (milestone-wide). This file scopes it to Phase 28 and points downstream agents at the authoritative sections. Read the canonical file in full before planning/implementing.

**Phase 28 requirements:** WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, EV-05.

## What Phase 28 delivers (the foundation only — no step content yet)
The one-step-per-page wizard shell + interaction engine + validation library that all later phases (29–32) build steps into. A placeholder/scaffold choice step and input step prove the two archetypes work end-to-end; real step content lands in Phases 29–31.

## Authoritative sections in `.planning/UI-SPEC.md`
- **§1 Safety constraints (S1–S8)** — design-level guardrails; the shell must make S1–S4 fields structurally absent. Carry into every component.
- **§2 Interaction model** — one step per page (§2.1); choice vs input archetypes (§2.2); card auto-advance timing + reduced-motion (§2.3); Back + progress (§2.4); state/`?step=` routing/sessionStorage draft/history (§2.5); branching guards (§2.6); transitions (§2.7).
- **§5 Card component spec** — `.choice-card` radio-group, auto-advance (scaffold here; full card set in Phase 29).
- **§7 Progress & navigation spec** — `.wizard`, `.wizard-progress`, `.wizard-step-pill`, `.wizard-count`, `.wizard-panel`, `.wizard-nav` classes + RTL/focus rules.
- **§9 Client-side validation** — the shared `src/lib/screens.ts` mirroring server regexes in server order (EV-05); coarse-location blocker.
- **§10–11 Bilingual/RTL + Accessibility** — logical properties, focus management on step change, aria-live step announcement, reduced motion (shell-level).
- **§12 Visual/CSS additions** — new `WIZARD/STEPPER` section in `src/components/hlshajara.css`, tokens only, no Tailwind utilities.

## Design-system anchors (from grounding)
- Styling = global semantic classes in `src/components/hlshajara.css` consuming tokens in `src/styles/tokens.css`. **No Tailwind utility classes.**
- Tokens: `--brand`/`--surface`/`--border`/`--radius-lg`/`--shadow*`/`--dur`/`--ease`/`--focus-ring`/`--space-*`; reuse `.btn`/`.card`/`.chip`/`.legal*`/`.page-container-narrow`/`.ds-*`.
- RTL: inherited `<html dir>`; logical properties only; no Arabic uppercase/letter-spacing; LTR-forced machine strings.
- i18n: `next-intl` `useTranslations("submit")`, flat camelCase keys, mandatory EN/AR parity.
- Existing analog to study: `src/app/[locale]/submit/SubmitClient.tsx` (the form being replaced), `src/components/PageShell.tsx`.

## Phase 28 acceptance (from UI-SPEC §13)
- Exactly one step renders at a time in `.page-container-narrow`; a scaffold choice step auto-advances after `var(--dur)` (instant under reduced-motion); a scaffold input step gates on Next.
- Back on every step but the first; browser Back/Forward + refresh restore the correct step and data via `?step=` + sessionStorage; dirty-draft leave warns.
- Progress pills show done/current/upcoming with `aria-current`; "Step N of M" with Arabic-Indic digits in AR.
- `src/lib/screens.ts` exports the server-mirrored screen functions (NO_SOURCE/WEAK_SOURCE/GROUP_TARGET/INCITEMENT/HATE_TONE/INNOCENT_PARTY/PRIVATE_TARGETING/MISMATCH) in server order, plus the coarse-location address blocker — shared by client and reusable server-side.
- No private-targeting/identity/loyalty/profession field exists in the shell or scaffold (S1–S4).

*Phase: 28-wizard-foundation · Contract scoped 2026-06-14 from `.planning/UI-SPEC.md`*
