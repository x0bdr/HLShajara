/**
 * Wizard step registry + branching/reachability (Plan 28-03, WIZ-06).
 *
 * Pure, framework-free config module. NO JSX, NO React, NO `"use client"`.
 * Mirrors the `as const` typed-config style of `src/i18n/navigation.ts`.
 *
 * For Phase 28 the registry wires ONLY the two SCAFFOLD steps that prove both
 * archetypes — one `choice` step and one `input` step. Phases 29–31 append the
 * real 9 numbered steps; the branching/reachability/visible-count contract they
 * extend is encoded here now so the engine is correct before the content lands.
 *
 * The `WizardState` import is type-only, so this module strips to zero runtime
 * dependencies and stays free of the (intentional) `state.ts ↔ registry.ts`
 * circular TYPE reference (`state.ts` imports `StepId` from here; this file
 * imports `WizardState` from there — both erased at runtime).
 */

import type { WizardState } from "./state";

/* ---------- STEP DEFINITIONS ---------- */

export type StepArchetype = "choice" | "input";

export interface StepDef {
  /** Stable id used as the `?step=` slug. */
  readonly id: string;
  readonly archetype: StepArchetype;
  /** i18n key under the `submit` namespace for the step title. */
  readonly titleKey: string;
  /**
   * Predicate over the form that must hold for this step to be considered
   * complete (and therefore for later steps to be reachable). Absent ⇒ the step
   * has no form-level completion gate.
   */
  readonly requires?: (form: WizardState["form"]) => boolean;
  /**
   * When TRUE, this step is complete ONLY once it has been actively confirmed
   * (its id is in `state.completed`) — used for choice steps whose value is
   * SEEDED (e.g. `entityType: "individual"`), so a seed alone never satisfies the
   * reachability gate. `requires` (form-level) can't express this because a seed
   * makes the form already look "valid"; the explicit completion flag does.
   */
  readonly completionGate?: boolean;
  /**
   * If present and TRUE for the current form, this step is SKIPPED (branch
   * skip) and does NOT increment the visible "Step N of M" count. Phase 29's
   * entity-subtype step ("1b") sets `branchWhen: (f) => f.entityType === "individual"`.
   * NOTE: the scaffold-input step is NOT branch-skipped — only the future
   * entity-subtype step is — so it carries no `branchWhen` here.
   */
  readonly branchWhen?: (form: WizardState["form"]) => boolean;
}

/**
 * Ordered step list. `as const` so `StepId` can be derived from the literal ids.
 * Phase 28 scaffold: a `choice` step then an `input` step — BOTH always shown and
 * counted, so the normal forward flow reads "Step 1 of 2" then "Step 2 of 2".
 *
 * The choice step uses `completionGate` (not `branchWhen`) to demonstrate the
 * reachability contract: its `entityType` value is seeded, so it counts as
 * complete only once actively confirmed. The branch-SKIP contract (where a step
 * is hidden AND uncounted) belongs to Phase 29's entity-subtype step, not to the
 * scaffold-input — putting `branchWhen` on the only input step would hide it and
 * miscount the flow as "Step 0 of 1".
 */
export const STEPS = [
  {
    id: "scaffold-choice",
    archetype: "choice",
    titleKey: "scaffoldChoiceTitle",
    // Seeded `entityType` must not auto-satisfy the gate — require an explicit pick.
    completionGate: true,
  },
  {
    id: "scaffold-input",
    archetype: "input",
    titleKey: "scaffoldInputLabel",
    requires: (form) => form.entityName.trim().length > 0,
  },
] as const satisfies ReadonlyArray<StepDef>;

/** Union of the literal step ids — the type `state.ts` imports. */
export type StepId = (typeof STEPS)[number]["id"];

/* ---------- LOOKUP HELPERS ---------- */

function indexOf(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}

function getStep(id: StepId): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}

/** A step is skipped when its `branchWhen` predicate holds for the current form. */
function isSkipped(step: StepDef, state: WizardState): boolean {
  return step.branchWhen ? step.branchWhen(state.form) : false;
}

/**
 * A step is "complete" when BOTH gates pass:
 *  - the form-level `requires(form)` holds (or there is none), AND
 *  - if it carries a `completionGate`, it has been ACTIVELY confirmed
 *    (its id is in `state.completed`) — a seeded value alone never satisfies it.
 */
function isComplete(step: StepDef, state: WizardState): boolean {
  // `StepDef.id` widens to `string`; compare via the `StepId[]` membership without
  // a cast by checking the completed list contains this id.
  if (step.completionGate && !state.completed.some((id) => id === step.id)) {
    return false;
  }
  return step.requires ? step.requires(state.form) : true;
}

/* ---------- NAVIGATION ---------- */

/**
 * The next non-skipped step after the current one, or `null` if the current
 * step is the last reachable one.
 */
export function nextStep(state: WizardState): StepId | null {
  for (let i = indexOf(state.currentStep) + 1; i < STEPS.length; i++) {
    if (!isSkipped(STEPS[i], state)) return STEPS[i].id;
  }
  return null;
}

/**
 * The previous non-skipped step before the current one, or `null` if the
 * current step is the first.
 */
export function prevStep(state: WizardState): StepId | null {
  for (let i = indexOf(state.currentStep) - 1; i >= 0; i--) {
    if (!isSkipped(STEPS[i], state)) return STEPS[i].id;
  }
  return null;
}

/* ---------- REACHABILITY (WIZ-06) ---------- */

/**
 * A step is reachable only if every prior non-skipped step is complete
 * (UI-SPEC §2.6). Reachability is a UX/correctness guard, NOT a security
 * control — `validateSubmission` on the server remains authoritative (T-28-07).
 */
export function isReachable(id: StepId, state: WizardState): boolean {
  const target = indexOf(id);
  if (target < 0) return false;
  for (let i = 0; i < target; i++) {
    const step = STEPS[i];
    if (isSkipped(step, state)) continue;
    if (!isComplete(step, state)) return false;
  }
  return true;
}

/**
 * The first non-skipped, incomplete step — the deep-link redirect target
 * (UI-SPEC §2.6: deep-linking to a later `?step=` with incomplete state
 * redirects here). Returns the last step's id if every step is complete.
 */
export function firstIncompleteStep(state: WizardState): StepId {
  for (const step of STEPS) {
    if (isSkipped(step, state)) continue;
    if (!isComplete(step, state)) return step.id;
  }
  return STEPS[STEPS.length - 1].id;
}

/* ---------- VISIBLE COUNT (progress "Step N of M") ---------- */

/**
 * Whether a step counts toward the visible "Step N of M" total. A skipped
 * branch step (e.g. entity-subtype "1b" on the Individual branch) is NOT
 * counted (UI-SPEC §3) so the progress component never miscounts M.
 */
export function isCountedStep(id: StepId, state: WizardState): boolean {
  const step = getStep(id);
  return step ? !isSkipped(step, state) : false;
}

/** Total visible steps (M) for the current branch — skipped steps excluded. */
export function visibleStepCount(state: WizardState): number {
  return STEPS.reduce((n, s) => (isSkipped(s, state) ? n : n + 1), 0);
}

/**
 * The 1-based position (N) of a step within the visible count, skipping
 * branch-skipped steps. Returns `0` if the step itself is skipped/unknown.
 */
export function visibleStepIndex(id: StepId, state: WizardState): number {
  let n = 0;
  for (const step of STEPS) {
    if (isSkipped(step, state)) continue;
    n += 1;
    if (step.id === id) return n;
  }
  return 0;
}
