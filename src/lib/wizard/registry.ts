/**
 * Wizard step registry + reachability for the v1.5 category-based report wizard.
 *
 * Pure, framework-free config module. NO JSX, NO React, NO `"use client"`.
 *
 * The new flow is linear (no branching):
 *   report-category → location-info → entity-type-name → report-details →
 *   experience → media-evidence → about-you → review
 */

import type { WizardState } from "./state";
import {
  requiresLocationInfo,
  requiresEntityTypeName,
  requiresReportDetails,
  requiresExperience,
  requiresMediaEvidence,
  requiresAboutYou,
} from "./step-logic";

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
   * complete. Absent ⇒ the step has no form-level completion gate.
   */
  readonly requires?: (form: WizardState["form"]) => boolean;
  /**
   * When TRUE, this step is complete ONLY once it has been actively confirmed
   * (its id is in `state.completed`) — used for choice steps whose value is
   * seeded, so a seed alone never satisfies the reachability gate.
   */
  readonly completionGate?: boolean;
}

export const STEPS = [
  {
    id: "report-category",
    archetype: "choice",
    titleKey: "q_reportCategory",
    completionGate: true,
    requires: (form) => form.reportCategory.trim().length > 0,
  },
  {
    id: "location-info",
    archetype: "input",
    titleKey: "q_locationInfo",
    requires: requiresLocationInfo,
  },
  {
    id: "entity-type-name",
    archetype: "input",
    titleKey: "q_entityTypeName",
    requires: requiresEntityTypeName,
  },
  {
    id: "report-details",
    archetype: "input",
    titleKey: "q_reportDetails",
    requires: requiresReportDetails,
  },
  {
    id: "experience",
    archetype: "input",
    titleKey: "q_experience",
    requires: requiresExperience,
  },
  {
    id: "media-evidence",
    archetype: "input",
    titleKey: "q_mediaEvidence",
    requires: requiresMediaEvidence,
  },
  {
    id: "about-you",
    archetype: "input",
    titleKey: "q_aboutYou",
    requires: requiresAboutYou,
  },
  {
    id: "review",
    archetype: "input",
    titleKey: "reviewStepTitle",
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

/**
 * A step is "complete" when BOTH gates pass:
 *  - the form-level `requires(form)` holds (or there is none), AND
 *  - if it carries a `completionGate`, it has been ACTIVELY confirmed.
 */
function isComplete(step: StepDef, state: WizardState): boolean {
  if (step.completionGate && !state.completed.some((id) => id === step.id)) {
    return false;
  }
  return step.requires ? step.requires(state.form) : true;
}

/* ---------- NAVIGATION ---------- */

/** The next step after the current one, or `null` if terminal. */
export function nextStep(state: WizardState): StepId | null {
  const idx = indexOf(state.currentStep);
  if (idx < 0 || idx >= STEPS.length - 1) return null;
  return STEPS[idx + 1].id;
}

/** The previous step before the current one, or `null` if first. */
export function prevStep(state: WizardState): StepId | null {
  const idx = indexOf(state.currentStep);
  if (idx <= 0) return null;
  return STEPS[idx - 1].id;
}

/* ---------- REACHABILITY ---------- */

/** A step is reachable only if every prior step is complete. */
export function isReachable(id: StepId, state: WizardState): boolean {
  const target = indexOf(id);
  if (target < 0) return false;
  for (let i = 0; i < target; i++) {
    if (!isComplete(STEPS[i], state)) return false;
  }
  return true;
}

/** First incomplete step — deep-link redirect target. */
export function firstIncompleteStep(state: WizardState): StepId {
  for (const step of STEPS) {
    if (!isComplete(step, state)) return step.id;
  }
  return STEPS[STEPS.length - 1].id;
}

/* ---------- DRAFT-RESTORE COMPLETION RECOMPUTE ---------- */

export function formSatisfiedSteps(form: WizardState["form"]): StepId[] {
  const out: StepId[] = [];
  const skipState: WizardState = {
    form,
    currentStep: STEPS[0].id,
    dirty: false,
    visited: [],
    completed: [],
    entityChosen: false,
  };
  for (const step of STEPS as readonly StepDef[]) {
    if (step.requires ? step.requires(form) : true) out.push(step.id as StepId);
  }
  return out;
}

/* ---------- VISIBLE COUNT ---------- */

/** Total visible steps (M) for progress. */
export function visibleStepCount(_state: WizardState): number {
  return STEPS.length;
}

/** 1-based position (N) of a step. */
export function visibleStepIndex(id: StepId, _state: WizardState): number {
  const idx = indexOf(id);
  return idx >= 0 ? idx + 1 : 0;
}

export function isCountedStep(id: StepId, _state: WizardState): boolean {
  return STEPS.some((s) => s.id === id);
}
