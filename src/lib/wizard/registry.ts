/**
 * Wizard step registry + branching/reachability (Plan 28-03 WIZ-06; Plan 29-01
 * STEP-01 + STEP-03 — the four real choice steps).
 *
 * Pure, framework-free config module. NO JSX, NO React, NO `"use client"`.
 * Mirrors the `as const` typed-config style of `src/i18n/navigation.ts`.
 *
 * Phase 29 replaces the two Phase-28 SCAFFOLD steps with the four REAL choice
 * steps in UI-SPEC §4 order — `actor-class` → `entity-subtype` → `conduct` →
 * `role-in-act`. The Individual branch SKIPS (and does not count) `entity-subtype`
 * via `branchWhen: (f) => f.entityType === "individual"`. Phase 30 inserts the
 * input steps (identity, describe, evidence, media, about-you) between these; the
 * branching/reachability/visible-count contract they extend is already encoded by
 * the generic helpers below, unchanged in signature.
 *
 * The `WizardState` import is type-only, so it is erased at runtime (the
 * intentional `state.ts ↔ registry.ts` circular TYPE reference: `state.ts`
 * imports `StepId` from here; this file imports `WizardState` from there). The
 * `ROLE_CLAUSE_TOKEN` import is a runtime VALUE — `encoding.ts` is itself
 * runtime-pure (zero imports), so the registry stays drivable directly under
 * Node `--experimental-strip-types`.
 */

import type { WizardState } from "./state";
import { ROLE_CLAUSE_TOKEN } from "./encoding";
import {
  requiresIdentity,
  requiresDescribe,
  requiresEvidence,
  requiresMedia,
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
   * If present and TRUE for the current state, this step is SKIPPED (branch
   * skip) and does NOT increment the visible "Step N of M" count. The
   * `entity-subtype` step ("1b") is skipped ONLY on the Individual branch —
   * i.e. when `entityType === "individual"` AND the user has not actively chosen
   * the entity actor class (`state.entityChosen`). Receiving the FULL state (not
   * just the form) is required because "An entity" is committed BEFORE a real
   * subtype enum is picked: until then `entityType` is still seeded "individual",
   * so the form alone cannot distinguish "individual actor" from "entity actor,
   * subtype pending". The `entityChosen` flag closes that gap so the entity branch
   * reaches AND counts `entity-subtype`. No other step carries a `branchWhen`.
   */
  readonly branchWhen?: (state: WizardState) => boolean;
}

/**
 * Ordered step list. `as const` so `StepId` can be derived from the literal ids.
 *
 * Phase 29 registers the four REAL choice steps in UI-SPEC §4 order:
 *   actor-class → entity-subtype → conduct → role-in-act.
 *
 * All four are `choice` archetype (Step 2 input + the rest are Phase 30). Each
 * carries `completionGate: true` so a SEEDED value never auto-satisfies the
 * reachability gate — only an explicit confirm (id in `state.completed`) does.
 * `requires` predicates additionally gate on the form value once confirmed so a
 * Back-edit that clears the value re-locks downstream steps.
 *
 * Branch rule: `entity-subtype` is SKIPPED + UNCOUNTED on the Individual branch
 * (`entityType === "individual"`); on an entity branch it is required and counted.
 */
export const STEPS = [
  {
    // Step 1 — actor class (individual vs entity). entityType is seeded
    // ("individual") so the gate must be an explicit confirm, not the seed.
    id: "actor-class",
    archetype: "choice",
    titleKey: "q_actorClass",
    completionGate: true,
  },
  {
    // Step 1b — entity subtype. Skipped + uncounted on the Individual branch.
    // Required to resolve entityType to one of the four entity enum literals.
    id: "entity-subtype",
    archetype: "choice",
    titleKey: "q_entitySubtype",
    completionGate: true,
    // Skipped ONLY on the Individual branch: seeded/committed "individual" actor
    // class AND the user has not actively picked the entity actor card. Once
    // `entityChosen` is set (or a real entity-subtype enum is committed, flipping
    // entityType off "individual"), this step is reachable AND counted.
    branchWhen: (state) =>
      state.form.entityType === "individual" && !state.entityChosen,
    requires: (form) =>
      form.entityType === "organization" ||
      form.entityType === "military_unit" ||
      form.entityType === "security_branch" ||
      form.entityType === "official_body",
  },
  {
    // Step 2 — identity (input). Inserted BETWEEN entity-subtype (Step 1b) and
    // conduct (Step 3) per UI-SPEC §3/§4 flow order. Gate: name + role + country
    // (requiresIdentity reads a non-empty composed allegationLocation).
    id: "identity",
    archetype: "input",
    titleKey: "q_identity",
    requires: requiresIdentity,
  },
  {
    // Step 3 — conduct type. Confirmed value writes a CONDUCT_SLUGS slug to
    // allegationClassification (Plan 29-03); the gate is a non-empty slug.
    id: "conduct",
    archetype: "choice",
    titleKey: "q_conduct",
    completionGate: true,
    requires: (form) => (form.allegationClassification ?? "").trim().length > 0,
  },
  {
    // Step 4 — role-in-act. Confirmed value appends the ROLE_CLAUSE_TOKEN clause
    // to entityRole (Plan 29-03); the gate is the clause token's presence.
    id: "role-in-act",
    archetype: "choice",
    titleKey: "q_roleInAct",
    completionGate: true,
    requires: (form) => form.entityRole.includes(ROLE_CLAUSE_TOKEN),
  },
  {
    // Step 5 — describe the act (input). Gate: ≥20 chars (requiresDescribe).
    id: "describe",
    archetype: "input",
    titleKey: "q_describe",
    requires: requiresDescribe,
  },
  {
    // Step 6 — evidence keystone (input). Gate: ≥2 source LINKS (requiresEvidence,
    // links-only — mirrors the server WEAK_SOURCE screen; files do not unlock).
    id: "evidence",
    archetype: "input",
    titleKey: "q_evidence",
    requires: requiresEvidence,
  },
  {
    // Step 7 — media (input). Optional — requiresMedia is always-true (Next never
    // blocked); video upload is deferred to Phase 33 (BE-05).
    id: "media",
    archetype: "input",
    titleKey: "q_media",
    requires: requiresMedia,
  },
  {
    // Step 8 — about you (input). Optional — requiresAboutYou is always-true;
    // anonymity is ON by default and clears name/email when toggled on (S7).
    id: "about-you",
    archetype: "input",
    titleKey: "q_aboutYou",
    requires: requiresAboutYou,
  },
  {
    // Step 9 — review (TERMINAL). Appended by Phase 31 (Plan 31-01 Task 4); NOT
    // registered by Phase 29/30. `archetype: "input"` so it does NOT auto-advance
    // — it is a terminal page the submitter dwells on, and WizardClient renders
    // <ReviewStep> for it instead of the Choice/Input scaffolds. No `requires`
    // (nothing follows it to gate; the affirmation + ≥2-source gate is enforced
    // in ReviewStep/handleSubmit, not via registry reachability), no `branchWhen`
    // (always shown + counted), no `completionGate`. After this, `nextStep` from
    // `about-you` returns `"review"` and `state.currentStep === "review"` is a
    // valid, reachable branch.
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

/** A step is skipped when its `branchWhen` predicate holds for the current form. */
function isSkipped(step: StepDef, state: WizardState): boolean {
  return step.branchWhen ? step.branchWhen(state) : false;
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

/* ---------- DRAFT-RESTORE COMPLETION RECOMPUTE (v1.4 M5) ---------- */

/**
 * Recompute which step ids a RESTORED form already satisfies, IGNORING the
 * `completed` confirmation list (v1.4 M5).
 *
 * `isComplete` refuses to count a `completionGate` step unless its id is already
 * in `state.completed` — correct during live navigation (a seeded value must be
 * explicitly confirmed), but WRONG when rehydrating a draft: the user DID confirm
 * those steps in the prior session, the confirmations just don't survive in the
 * draft form. This helper instead asks ONLY the form-level question — "does the
 * restored form value satisfy this step?" — using each step's `requires`
 * predicate (a `completionGate` step with no `requires`, e.g. `actor-class`, is
 * satisfied by virtue of the draft existing) and skipping `branchWhen` steps.
 *
 * `RESTORE_DRAFT` seeds `state.completed` from this so `firstIncompleteStep` lands
 * the user at the FIRST genuinely-unfinished step rather than redirecting all the
 * way back to `actor-class`. Input steps are included on the SAME rule — they are
 * marked complete only when their `requires` predicate passes (an optional input
 * whose `requires` is always-true counts as complete, which is correct).
 */
export function formSatisfiedSteps(form: WizardState["form"]): StepId[] {
  const out: StepId[] = [];
  // For a RESTORED draft the form value alone determines the branch: a non-
  // "individual" entityType IS an entity actor with a committed subtype, so
  // synthesize `entityChosen` from it for the branch-skip predicate (a draft is
  // only persisted after real data entry, never in the transient "entity chosen,
  // subtype pending" interim). This keeps `entity-subtype` correctly NON-skipped
  // (and thus eligible to be marked satisfied) on a restored entity branch.
  const skipState: WizardState = {
    form,
    currentStep: STEPS[0].id,
    dirty: false,
    visited: [],
    completed: [],
    entityChosen: form.entityType !== "individual",
  };
  // Iterate over the widened `StepDef` view so the optional `branchWhen`/`requires`
  // members are accessible (the `as const` literal union narrows them away, the
  // same reason `isSkipped`/`isComplete` take a `StepDef` parameter).
  for (const step of STEPS as readonly StepDef[]) {
    if (step.branchWhen && step.branchWhen(skipState)) continue; // skipped branch
    if (step.requires ? step.requires(form) : true) out.push(step.id as StepId);
  }
  return out;
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
