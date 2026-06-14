---
phase: 29-choice-steps
status: passed
verified: 2026-06-14
gates:
  tsc: pass
  check_i18n: pass
  next_build: pass
  drivers: pass
  s2_s4_absence: pass
human_needed:
  - "Browser QA: 200ms auto-advance feel + instant under reduced-motion (SC1 timing)"
  - "Browser QA: Back to a choice step lands focus ON the prior selected card; no auto-advance fires on mount (SC4 focus + no-re-advance)"
  - "Browser QA: actor-class switch on Back surfaces the aria-live notice and a screen reader announces it (SC4 AT)"
  - "Browser QA: /ar/submit RTL — cards/progress mirror, machine slugs stay LTR, Arabic-Indic step counter (Phase-32 audits fully)"
---

# Phase 29: Choice Steps — Verification

Goal-backward verification against the five ROADMAP Phase-29 success criteria. All
automated gates pass; the remaining items are timing/visual/screen-reader behaviors
that require a live browser (carried as `human_needed`, consistent with Phase-28's
human-verify precedent).

## Automated Gates

| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `node_modules/.bin/tsc --noEmit -p tsconfig.json` | PASS (exit 0) |
| i18n parity | `npm run check:i18n` | PASS (85 submit keys each, 43 Phase-29 keys EN+AR) |
| Full build | `npm run build` | PASS (exit 0, 53/53 static pages; `/en/submit` + `/ar/submit` SSG) |
| Logic driver | `node scripts/wizard-choice-steps-check.js` | PASS (49/49 assertions) |
| Reducer driver | `node scripts/wizard-reducer-check.js` | PASS |
| S2-S4 absence | submit-namespace + wizard-surface grep | clean |
| validation.ts | `git diff --stat src/lib/validation.ts` | untouched |
| deps | `git diff --stat package.json` (only 29-02 check:i18n) | no dep change |

## Success Criteria (ROADMAP Phase 29)

### SC1 — Tap a card → selected/confirm state then auto-advance, instant under reduced-motion, no Next button — VERIFIED (auto) / human-needed (timing feel)
- `WizardNav` renders Next ONLY for `archetype === "input"`; all four Phase-29 steps are `choice`, so no Next button appears.
- Auto-advance is armed only inside the confirm handler (`completeAndAdvance`): `setTimeout(advance, 200)` normally, `advance()` immediately under `prefersReducedMotion()`.
- HUMAN: the 200ms feel and the instant-under-reduced-motion behavior need a browser.

### SC2 — "An entity" reveals subtype and resolves entityType to one of five enum literals; "An individual" sets individual and skips the subtype — VERIFIED (auto)
- entity-subtype maps all four entity enums (`organization`/`military_unit`/`security_branch`/`official_body`); actor-class individual sets `entityType="individual"`. Five literals total.
- registry `branchWhen: (f) => f.entityType === "individual"` skips + uncounts entity-subtype.
- Driver: individual `visibleStepCount = 3` (subtype excluded), `nextStep(actor-class) = conduct`; entity `visibleStepCount = 4`, `nextStep(actor-class) = entity-subtype`.
- The entity card never writes a non-enum value to `entityType` (local `ENTITY_MARKER` sentinel); grep confirms no `field:"entityType", value:"entity-marker"`.

### SC3 — Conduct and role each a CLOSED card set with one-line defs; no sect/loyalty/opinion/profession card (S2-S4 absent) — VERIFIED (auto)
- `CONDUCT_SLUGS` length 14 (Other last), each with a `conduct_<slug>_def`; `ROLE_SLUGS` length 7 (Other last).
- S2-S4 grep-absence: the `submit` namespace (all Phase-29 keys/values) and the wizard code surface (encoding.ts, registry.ts, WizardClient.tsx, components/wizard/*) contain NO identity/loyalty/profession token. (The only broad-grep hits are (a) the HTML `<section>` element substring and (b) pre-existing anti-discrimination POLICY copy in the unrelated mission/faq/terms/privacy/policy namespaces, which legitimately STATE the prohibition — neither is a wizard card/field.)

### SC4 — Back re-renders the prior card selected + focused; switching an upstream branch invalidates orphaned downstream answers + a one-line notice — VERIFIED (auto) / human-needed (focus + AT)
- `ChoiceStep` focuses the matching card on mount only when `value` is non-empty (`if (value) cardRefs.current[activeIndex]?.focus()`); WizardClient feeds the per-step current value so the prior card is selected on Back.
- Auto-advance is never armed on mount/URL-sync (the `?step=` effect calls `goTo`, never `advance`) → no re-advance on Back; re-confirming the same card routes through the confirm handler → advances.
- actor-class switch on Back dispatches `INVALIDATE_SUBTYPE` (driver: rewrites entityType, preserves `allegationClassification` + `entityRole` byte-identical) and renders a transient `.legal` `role="status" aria-live="polite"` notice, cleared on next nav/confirm.
- HUMAN: that focus visibly lands on the selected card and the screen reader announces the aria-live notice need a browser/AT.

### SC5 — The whole card group is keyboard-operable as a radio group (Arrow move, Enter/Space confirm) with aria-checked — VERIFIED (auto) / human-needed (AT pass)
- `ChoiceStep`: `role="radiogroup"` wrapping `role="radio"` cards with `aria-checked`, roving tabindex (`tabIndex={isActive ? 0 : -1}`), Arrow-key movement (no confirm), Enter/Space/pointer confirm. Reused unchanged from Phase 28.
- HUMAN: end-to-end screen-reader operability is a Phase-32 a11y-audit confirmation; the markup contract is in place now.

## Conclusion

`status: passed` — all four real choice steps are registered, wired, encoded onto the
existing `/api/submit` contract, and gated by tsc + check:i18n + next build + the
standalone logic driver, with the S2-S4 closed-set guarantee verified and
`validation.ts` untouched. The `human_needed` items are timing/visual/AT confirmations
(auto-advance feel, focus-on-Back, aria-live announcement, RTL) appropriate for a live
browser pass — none block the phase's structural completion.
