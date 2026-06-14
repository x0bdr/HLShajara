# Phase 29: Choice Steps - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the four **choice steps** of the report-submission wizard as accessible,
auto-advancing card groups on top of the Phase 28 shell:

- **Step 1 — Actor class** (`individual` vs `entity`; individual branch skips Step 1b)
- **Step 1b — Entity subtype** (4 cards → `organization` / `military_unit` / `security_branch` / `official_body`)
- **Step 3 — Conduct type** (closed 14-card set + "Other" → `allegationClassification` interim value)
- **Step 4 — Role-in-act** (closed 7-card set → appended to `entityRole` interim)

The visual contract is **locked by UI-SPEC §3 + §5** and the CSS (`.choice-grid`/`.choice-card`/
`.title`/`.desc`/`.check`) + the `ChoiceStep` component already exist from Phase 28. This phase wires
the **real step registry entries**, the **card content (EN+AR)**, the **interim encoding**, and the
**branch-switch / Back-navigation** behavior. Input steps (2, 5–8), review (9), and i18n/a11y hardening
are out of scope (Phases 30–32). Conduct/role sets are **CLOSED** — no identity/loyalty/profession cards
(S2–S4 verified absent).
</domain>

<decisions>
## Implementation Decisions

### Interim Data Encoding (choices → existing `/api/submit` schema)
- Each **conduct card** writes a **stable English slug** to `allegationClassification` that matches the
  i18n key suffix (`detention`, `torture`, `disappearance`, `killing`, `sexualViolence`, `financing`,
  `arms`, `laundering`, `propaganda`, `informing`, `seizure`, `detentionSite`, `command`, `other`). This
  lets Phase 33 (BE-01) map slug→`conductType` enum 1:1 without parsing localized text. `max100` honored.
- **Role-in-act** is encoded by appending a human-readable clause to **`entityRole`** (e.g.
  `"Brigadier, Branch 215 — role in act: ordered/commanded"`), NOT injected into `allegationDescription`.
  Rationale: keeps the description clean for the Step-5 char counter (`min20`) and the GROUP/PRIVATE/
  INNOCENT/INCITEMENT/HATE screens (which run on `entityName + entityRole + allegationDescription`).
  Phase 33 (BE-06) extracts this clause into the first-class `roleInConduct` field. Use a **stable
  separator token** (` — role in act: <slug>`) so Phase 33 can parse/strip it deterministically.
- Conduct **"Other (describe)"** sets `allegationClassification="other"` and makes the Step-5
  description **required to name the act**; no extra Step-3 field.
- **`triageCategory` is NOT populated in Phase 29** — deferred entirely to Phase 33 (BE-01). Phase 29
  is frontend-only against the existing contract.

### Branch-switch & Back-navigation Behavior (Success Criterion 4)
- On Back, changing **actor class** invalidates **only the orphaned** answer (the entity-subtype when
  leaving the entity branch); conduct/role/identity are preserved (branch-independent). Minimal
  invalidation — do not nuke the whole downstream chain.
- The invalidation **notice** is a transient inline `.legal` note at the top of the affected step,
  `aria-live="polite"` (not a modal, not a toast).
- Returning to a choice step via Back renders the prior card **selected + focused** (roving tabindex
  lands on the chosen card) but does **not** re-auto-advance on mount — only an explicit new pick advances.
- **Re-confirming the same card** on Back auto-advances forward (consistent "tap = advance" model);
  **changing** the value invalidates orphans first, then advances.

### Card Content, Ordering & i18n
- Conduct cards render as **one flat `role="radiogroup"`** in UI-SPEC order (5 perpetrator acts →
  8 support-network acts → Other); no visual subheadings (cleaner a11y, simpler roving tabindex).
- Card definitions (`_def`) are **terse, neutral legal-register** one-liners, non-sectarian, matching
  project tone; AR mirrors the register.
- **Full EN + AR authored now** for every Phase 29 label/definition — parity from the start. Phase 32
  audits RTL/a11y; it does not fill missing keys. `check:i18n` must pass at the end of this phase for
  the keys added here.
- The **"Other"** card is always **last**, visually identical to the others, and routes onward to the
  description step.

### Claude's Discretion
- Exact EN/AR wording of each conduct/role definition (within the terse legal-register guidance).
- The precise separator-token string for the role clause (must be stable + documented for Phase 33).
- Plan/task decomposition and TDD approach (mirror Phase 28's no-new-deps, `tsc`+grep gate pattern).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (already built — do NOT rebuild)
- `src/components/wizard/ChoiceStep.tsx` — fully functional roving-tabindex radiogroup: Arrow to move,
  Enter/Space confirm, `.selected` + brass check, `onConfirm(value)` callback, no Next button. Props:
  `{ariaLabel, options:[{value,title,desc?}], value, onConfirm}`.
- `src/components/wizard/{WizardClient,WizardProgress,WizardNav,WizardPanel}.tsx` — root owns
  auto-advance delay (200ms, instant under reduced-motion), `?step=` routing, focus-to-heading, aria-live.
- `src/components/hlshajara.css` `/* ===== WIZARD / STEPPER ===== */` (≈1365–1615) — all `.choice-*`
  classes exist incl. brass `.check` (opacity 0→1 on `.selected`); 2-col grid at ≥560px. No CSS additions
  expected for Phase 29.
- `src/lib/wizard/registry.ts` — step registry with `branchWhen`/`isReachable`/`isCountedStep`/
  `firstIncompleteStep`/`visibleStepCount`. Currently only 2 scaffold steps; Phase 29 appends the real
  choice steps (1, 1b, 3, 4) and reworks the branch-skip to the real `entityType==="individual"` rule.
- `src/lib/wizard/state.ts` — reducer; `form: SubmitInput` (type from `@/lib/validation`); `SET_FIELD`,
  `completed`/`visited`, allowlisted `RESTORE_DRAFT`.

### Established Patterns
- Enum source of truth: `src/lib/validation.ts` `entityType: z.enum(["individual","organization",
  "military_unit","security_branch","official_body"])`; `allegationClassification: z.string().max(100).optional()`.
- Client screens mirror server in `src/lib/screens.ts` (server order; `sourceCount` mirrors `sourceLinks.length`).
- i18n: `messages/en.json` + `messages/ar.json` under `submit.*` (≈41 keys today, incl. the
  `typeOrganization/typeMilitaryUnit/typeSecurityBranch/typeOfficialBody` reused by Step 1b). Phase 29 adds
  ~23 new keys (q_actorClass, actor*, q_entitySubtype, q_conduct + 14×conduct_* + _def, q_roleInAct + 7×role_*).
- No new dependencies; no test framework — drive pure TS via `tsc` + grep gates (Phase 28 precedent).

### Integration Points
- Registry: append real steps + branch rule; keep `Step N of M` not counting skipped "1b".
- `ChoiceStep` consumers: new step components (or registry-driven option lists) feed `options` + `onConfirm`.
- Reducer: `onConfirm` dispatches `SET_FIELD` for `entityType` / `allegationClassification` / `entityRole`
  clause; add branch-orphan invalidation handling.
- i18n keys land in both `messages/*.json`; `check:i18n` gate.
</code_context>

<specifics>
## Specific Ideas

- Conduct card set (UI-SPEC §3, exact, closed): **Perpetrator acts** — Arbitrary detention, Torture,
  Enforced disappearance, Extrajudicial killing, Sexual violence. **Support-network acts** — Material
  support (financing), Arms/logistics supply, Money laundering, Propaganda/whitewashing, Providing
  information to security (informing), Property/asset seizure, Operating a detention/torture site,
  Command responsibility. Plus **Other (describe)**.
- Role-in-act set (UI-SPEC §3, exact): Direct perpetrator · Ordered/commanded it · Financed it ·
  Supplied it · Informed/provided information · Owned/controlled the implicated entity · Other.
- i18n key names are pinned by UI-SPEC §3 — use them verbatim (`submit.conduct_detention`, etc.).
- Enabler network is NOT a separate entity card — a front company/financier/outlet is `organization`
  (or `individual`) distinguished by its **conduct** in Step 3 (UI-SPEC note under Step 1b).
</specifics>

<deferred>
## Deferred Ideas

- `conductType` enum + `triageCategory` population, first-class `roleInConduct`, per-source `sourceType`,
  `leadNote`, `isAnonymous` DB-default flip, video metadata stripping → **Phase 33 (Backend Support)**.
- Input steps (2, 5–8), evidence/lead-note, media, about-you → **Phase 30**.
- Review/submit/confirmation → **Phase 31**.
- RTL/a11y/full-parity hardening audit → **Phase 32** (Phase 29 still authors EN+AR for its own keys).
</deferred>
