# Phase 32: i18n, RTL & Accessibility - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

A **cross-cutting hardening pass** over the wizard built in Phases 28–31. No new steps/features — make the entire
flow correct and operable in **both languages** and for **keyboard/screen-reader** users:

- **Full EN/AR `submit` key parity** (≈70 keys per UI-SPEC §3) — `check:i18n` passes, `i18n-checker` agent clean.
- **RTL correctness** — logical properties only; no Arabic uppercase/letter-spacing (pair Latin eyebrows with a
  `[dir=rtl]` reset); LTR-forced machine strings (`.ds-mono`); mirrored progress pills + chevrons; Arabic-Indic step
  counter via `Intl.NumberFormat(locale)`.
- **Accessibility** — full keyboard operability end-to-end; focus moves to the step `<h2>` on change;
  `aria-live="polite"` step announcements; `aria-current="step"` on the active pill; reduced-motion honored;
  WCAG AA contrast (errors never color-only); ≥44px targets.

Phases 28–31 already author EN+AR for their own keys as they ship (per their CONTEXTs), so this phase is an **audit +
fill-the-gaps + RTL/a11y correctness** pass, not a from-scratch translation.
</domain>

<decisions>
## Implementation Decisions

### i18n parity
- Reconcile every `submit.*` key across `messages/en.json` + `messages/ar.json` to full parity (the union of all
  keys Phases 28–31 introduced + any UI-SPEC §3 key still missing). `npm run check:i18n` must exit 0; run the
  `i18n-checker` agent and resolve every finding.
- No machine/interim tokens (e.g. `[TYPE: …]`, `— role in act: …`) are ever user-visible untranslated — they are
  encoded data, displayed via stripped/parsed labels (verify in review screen).

### RTL
- Audit all wizard CSS/markup for physical props introduced in 28–31; convert any `left/right/margin-left` etc. to
  logical (`inset-inline`, `margin-inline-*`, `ps-/pe-`, `start/end`). Latin eyebrows (`.ds-eyebrow`) get a
  `[dir=rtl]` reset (no uppercase/letter-spacing in Arabic). `.ds-mono` stays LTR under RTL. Progress pills + Back/Next
  chevrons mirror in RTL. Step counter renders Arabic-Indic digits via `Intl.NumberFormat(useLocale())` (the Phase 28
  WizardProgress pattern — verify all counters use it).

### Accessibility
- Verify roving-tabindex radiogroups (choice steps), Arrow/Enter/Space, `aria-checked` (Phase 29) end-to-end.
- Focus moves to the step heading `<h2 tabIndex={-1}>` on each change (Phase 28 WizardPanel — verify across all real
  steps); ONE persistent `aria-live="polite"` region announces `N / M — title`; `aria-current="step"` on active pill.
- Inputs labelled (`<label for>`/`aria-labelledby`); errors associated via `aria-describedby`; affirmation checkbox
  reachable + labelled. Reduced-motion disables slide + auto-advance delay (Phase 28 honored — verify across steps).
- WCAG AA contrast on all text/token pairs; errors carry icon/text not color-only; tap targets ≥44px.

### Verification approach
- `check:i18n` + `i18n-checker` agent for parity. RTL + a11y verified via build + targeted DOM/aria assertions
  (grep for physical props, `aria-*` presence, `Intl.NumberFormat`) and a manual EN/AR browser pass on staging
  (event.staging.sanadais.com) — never local-only for the final sign-off.

### Claude's Discretion
- Exact AR phrasing for any newly-discovered missing keys (terse legal-register, non-sectarian).
- Whether to add small `[dir=rtl]` CSS resets vs adjusting existing rules.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `messages/en.json` + `messages/ar.json` — `submit.*` namespace; `next-intl` ICU.
- `src/components/wizard/WizardProgress.tsx` — Arabic-Indic counter via `Intl.NumberFormat(useLocale())`,
  `aria-current="step"` pattern (reference for all counters/pills).
- `src/components/wizard/WizardPanel.tsx` — focus-to-`<h2>`, persistent `aria-live` region (reference for all steps).
- `src/components/hlshajara.css` — wizard CSS; `.ds-mono` LTR rule; reduced-motion overrides; logical-prop precedent.

### Established Patterns
- CLAUDE.md i18n rules: full EN+AR parity always; RTL-safe logical props; `i18n-checker` agent after UI changes.
- `check:i18n` gate (npm script). Brass reserved for `.choice-card .check` only.

### Integration Points
- Touches messages/*.json (parity), wizard component markup/aria, and hlshajara.css (RTL/contrast) — all already
  created by 28–31; this is a correctness pass over them.
</code_context>

<specifics>
## Specific Ideas
- Target ≈70 `submit.*` keys total (UI-SPEC §3 enumerates them). Verify NO English-only or Arabic-only key.
- Machine strings (reference id, interim tokens) must be LTR + never shown raw to users.
</specifics>

<deferred>
## Deferred Ideas
- Backend (Phase 33, parallel lane) is non-UI — out of scope for this i18n/RTL/a11y pass except any user-facing
  error copy it introduces (covered when 33 merges; re-run check:i18n post-merge).
</deferred>
