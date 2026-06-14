---
phase: 32-i18n-rtl-accessibility
status: human_needed
verified: 2026-06-14
requirements: [INTL-01, INTL-02, INTL-03]
gates:
  tsc: pass
  check:i18n: pass
  build: pass
  wizard-rtl-check: pass
  wizard-a11y-check: pass
---

# Phase 32 Verification — i18n, RTL & Accessibility

**Verdict: `human_needed`.** All automated gates pass (tsc, `check:i18n`, `next build`, RTL grep-gate, a11y grep-gate). The four ROADMAP success criteria are satisfied at the code/markup/contract level. The two CONTEXT-mandated live items — the `i18n-checker` agent independent audit and the staging EN/AR keyboard + screen-reader + reduced-motion walkthrough — are the remaining human sign-offs (they cannot run in this executor; CONTEXT requires the staging pass, not a local one).

## Automated gate results

| Gate | Command | Result |
|------|---------|--------|
| Type safety | `npx tsc --noEmit` | exit 0 |
| i18n parity | `npm run check:i18n` | exit 0 — 316-key full-tree EN/AR parity, ICU placeholder parity, no empty values |
| RTL | `node scripts/wizard-rtl-check.js` | exit 0 — physical-prop absence + ds-mono/review-sources LTR + Intl(arab) counters |
| a11y | `node scripts/wizard-a11y-check.js` | exit 0 — radiogroup, single aria-live, focus-to-h2, aria-current, labelled inputs, error association |
| Build | `npm run build` | exit 0 |

## Goal-backward against the 4 ROADMAP success criteria

### Criterion 1 — Full EN/AR submit parity; check:i18n passes; i18n-checker clean
- **Code/contract: PASS.** submit namespace = 161 keys, EN/AR sorted-identical; full tree 316/316. `check:i18n` exit 0. Zero machine-token-as-value hits. conduct_*_def pairs 14/14. Reused entity-type keys not duplicated. 5 missing §3 intro keys added at parity. AR spot-check (introTitle/q_actorClass/sourcesRule/affirm/err_private) = genuine legal-register Arabic.
- **`human_needed`:** the **i18n-checker agent** independent audit (CONTEXT mandates the agent be clean, not only the script). The parity script is a superset gate (key + placeholder + empty + stub-warn) and is clean; the agent pass is the second opinion the orchestrator should dispatch.

### Criterion 2 — RTL-correct in Arabic (mirrored pills/chevrons, no AR uppercase/letter-spacing, LTR machine strings, Arabic-Indic counter)
- **Code: PASS.** Wizard CSS is logical-prop-only (chevron `margin-inline-end`, `[dir=rtl]` translateX sign-flip, `[dir=rtl]` resets on `.wizard-eyebrow`/`.wizard-step-pill`). `[dir=rtl] .ds-mono` + `[dir=rtl] .review-sources` force LTR. All four counter components (WizardProgress, WizardPanel, DescribeStep, EvidenceStep) format via `Intl.NumberFormat(locale, {numberingSystem:"arab"})` for AR. RTL gate exit 0.
- **`human_needed`:** live `/ar/submit` render confirming pills/chevrons mirror, `.ds-mono` reference id reads LTR, and counters show ٠-٩ — staging visual pass.

### Criterion 3 — Keyboard-operable end to end; focus to step heading on change; aria-live step announcements
- **Code: PASS.** ChoiceStep is a roving-tabindex radiogroup (Arrow/Enter/Space, `aria-checked`). WizardPanel `<h2 tabIndex={-1}>` + focus-on-change useEffect. Exactly ONE `aria-live="polite"` step announcer (4 duplicate announcers demoted to `role="status"`; server error → `role="alert"`). `aria-current="step"` on the active pill. All inputs labelled; field errors `aria-describedby`+`aria-invalid`+`role="alert"`; affirmation checkbox reachable+labelled. a11y gate exit 0.
- **`human_needed`:** staging VoiceOver + keyboard-only walkthrough (EN + AR): single announcement per step, focus lands on heading, errors announced, affirmation togglable by keyboard.

### Criterion 4 — Reduced motion disables slide/auto-advance; WCAG AA contrast; errors never color-only
- **Code: PASS.** Reduced-motion gated in CSS (`@media (prefers-reduced-motion: reduce)`) + WizardClient (`matchMedia` auto-advance). Contrast computed: all wizard text/interactive pairs ≥6.75:1; fixed `.wizard-count` + `.review-row .k` from `--fg3` (2.48:1) to `--fg2` (7.29:1). Disabled-button contrast left as-is (WCAG 1.4.3 exempts disabled controls). Errors carry `role="alert"`/`role="status"` + icon/text, never color-only. Wizard tap targets ≥44px via wizard-scoped `min-block-size`.
- **`human_needed`:** staging OS "Reduce Motion" pass (immediate advance, no slide/200ms delay) + touch-viewport target-size + contrast legibility check.

## Remaining human items (blocking final phase close)

1. **i18n-checker agent** audit of messages/{en,ar}.json → expect verdict PARITY OK.
2. **Staging EN/AR walkthrough** on event.staging.sanadais.com (NOT local):
   - Keyboard-only: Tab to first choice card → Arrow moves → Enter/Space confirms+advances; Back reachable.
   - VoiceOver: focus to heading + "N / M — title" announced once per step (no double-announce).
   - Trigger validation errors (<2 sources, <20-char description, social media link, fine-grained address) → announced + associated.
   - Step-9 affirmation reachable/togglable by keyboard; Submit disabled until checked + ≥2 sources.
   - OS Reduce Motion → immediate advance.
   - RTL visual: mirrored pills/chevrons, LTR `.ds-mono`, Arabic-Indic counters.

## Deviations summary

- 32-01: rewired `check:i18n` to a generic full-tree checker (kept submit-only as `check:i18n:submit`); added 5 missing §3 intro keys.
- 32-02: hlshajara.css wizard block was already logical-prop-clean (no edits); only `[dir=rtl] .ds-mono` added; counter digit defect routed to 32-03.
- 32-03: collapsed 4 duplicate aria-live regions to a single announcer; labelled placeholder-only inputs; wired aria-describedby; fixed AR counter digits; ≥44px + AA contrast; new a11y gate.

## Commits

- `7d69e4a` feat(32-01): full EN/AR submit parity + generic check:i18n gate
- `89e1619` feat(32-02): RTL hardening — ds-mono LTR rule + wizard-rtl grep-gate
- `2dc746c` feat(32-03): wizard a11y hardening + grep-gate
