/**
 * Wizard state machine (Plan 28-03, WIZ-05).
 *
 * Pure, framework-free reducer + types for the multi-step report wizard. NO JSX,
 * NO React import beyond the `Reducer` type signature, NO `"use client"`. The
 * presentational components (Plan 04) and the root container (Plan 05) consume
 * this engine; building it as a pure module lets typecheck gate it independently
 * of the UI.
 *
 * Contract binding: `WizardState.form` IS `SubmitInput` (from `@/lib/validation`,
 * the `/api/submit` Zod contract) — imported as a TYPE and reused, never
 * redeclared, so the wizard and the server cannot drift. The `SubmitInput` and
 * `StepId` imports are type-only, so this module strips to zero runtime
 * dependencies (drivable directly under Node `--experimental-strip-types`).
 */

import type { Reducer } from "react";
import type { SubmitInput } from "@/lib/validation";
import type { StepId } from "./registry";
// v1.4 M5: runtime helper to recompute which steps a RESTORED draft already
// satisfies (form-level only, ignoring the lost `completed` confirmations). The
// import is RELATIVE (not the `@/` alias) so the strip-types regression drivers
// can resolve it via their off-thread `.ts` resolve hook, matching registry.ts.
import { formSatisfiedSteps } from "./registry";

/* ---------- STATE ---------- */

export interface WizardState {
  /** The submission payload — typed AS the `/api/submit` contract (no drift). */
  form: SubmitInput;
  /** The currently-rendered step id (mirrors the `?step=` slug). */
  currentStep: StepId;
  /** True once the user has changed any field (drives the beforeunload guard). */
  dirty: boolean;
  /** Steps the user has reached, for progress / reachability. */
  visited: StepId[];
  /**
   * Steps the user has ACTIVELY satisfied (a choice confirmed, an input filled),
   * as opposed to merely seeded or visited. A choice step's seed value (e.g.
   * `entityType: "individual"`) does NOT make it complete — only an explicit
   * confirmation adds it here, so a deep-link past an unanswered choice redirects
   * back (reachability gate, UI-SPEC §2.6). Phase 29's real steps reuse this.
   */
  completed: StepId[];
  /**
   * TRUE once the user has actively chosen the "An entity" actor class but BEFORE
   * a concrete entity-subtype enum is committed. This is the ONLY signal that
   * distinguishes "individual actor" from "entity actor, subtype pending" while
   * `entityType` is still seeded "individual" — it makes the registry reach AND
   * count `entity-subtype` on the entity branch (the `branchWhen` predicate reads
   * it). Cleared when the user picks the "An individual" card; set when they pick
   * "An entity". Committing a real subtype enum (entityType off "individual")
   * makes it redundant but it stays consistent.
   */
  entityChosen: boolean;
}

/**
 * Canonical seed shape — field names are LIFTED VERBATIM from the legacy
 * single-page form (`SubmitClient.tsx:17-30`) because they ARE the `/api/submit`
 * contract. `isAnonymous` seeds to `true` (UI-SPEC §8 / S7 anonymity-default-on),
 * matching the Zod schema default (`validation.ts` `isAnonymous.default(true)`,
 * flipped in v1.4 M6) and the Phase-33 DB-column default flip (BE-04).
 */
const initialForm: SubmitInput = {
  entityName: "",
  entityType: "individual",
  entityRole: "",
  allegationDescription: "",
  allegationPeriod: "",
  allegationLocation: "",
  allegationClassification: "",
  sourceLinks: [{ url: "", title: "" }],
  sourceFiles: [],
  submitterEmail: "",
  submitterName: "",
  isAnonymous: true,
};

export const initialWizardState: WizardState = {
  form: initialForm,
  currentStep: "actor-class",
  dirty: false,
  visited: ["actor-class"],
  // Nothing is actively completed at start — the seeded `entityType` is NOT a
  // user selection, so `actor-class` stays incomplete until confirmed.
  completed: [],
  // No actor class chosen yet — the entity branch is not active until "An entity".
  entityChosen: false,
};

/**
 * The only `SubmitInput` keys `RESTORE_DRAFT` is allowed to merge from an
 * untrusted sessionStorage draft (T-28-06): a malformed/injected draft can only
 * write these known fields, never arbitrary or prototype-polluting keys.
 */
const RESTORABLE_KEYS: ReadonlyArray<keyof SubmitInput> = [
  "entityName",
  "entityType",
  "entityRole",
  "allegationDescription",
  "allegationPeriod",
  "allegationLocation",
  "allegationClassification",
  "sourceLinks",
  "sourceFiles",
  "submitterEmail",
  "submitterName",
  "isAnonymous",
  "leadNote",
];

/* ---------- ACTIONS ---------- */

export type WizardAction =
  | { type: "SET_FIELD"; field: keyof SubmitInput; value: SubmitInput[keyof SubmitInput] }
  | { type: "SET_SOURCE"; index: number; field: "url" | "title"; value: string }
  | { type: "ADD_SOURCE" }
  | { type: "REMOVE_SOURCE"; index: number }
  | { type: "ADD_FILE"; file: SubmitInput["sourceFiles"][number] }
  | { type: "REMOVE_FILE"; index: number }
  | { type: "GOTO_STEP"; step: StepId }
  | { type: "COMPLETE_STEP"; step: StepId }
  | { type: "INVALIDATE_SUBTYPE"; entityType: SubmitInput["entityType"] }
  | { type: "CHOOSE_ENTITY_CLASS" }
  | { type: "RESTORE_DRAFT"; draft: Partial<Record<string, unknown>> }
  | { type: "RESET" };

/* ---------- REDUCER ---------- */

/**
 * Pure wizard reducer. Every case returns a NEW state object (immutable spread
 * style) — ported verbatim from the legacy `SubmitClient.tsx` mutators
 * (`updateField` :42-47, `updateLink` :49-55, `addLink` :57-62, `removeFile`
 * :104-109), which already used the correct immutable pattern.
 */
export const wizardReducer: Reducer<WizardState, WizardAction> = (state, action) => {
  switch (action.type) {
    /** Port of `updateField` (SubmitClient.tsx:42-47). */
    case "SET_FIELD":
      return {
        ...state,
        dirty: true,
        // Keep `entityChosen` consistent when `entityType` is written directly:
        // a real entity-subtype enum (Step 1b commit) sets it true; an explicit
        // "individual" clears it. Any other field leaves it untouched.
        entityChosen:
          action.field === "entityType"
            ? action.value !== "individual"
            : state.entityChosen,
        form: { ...state.form, [action.field]: action.value },
      };

    /** Port of `updateLink` (SubmitClient.tsx:49-55). */
    case "SET_SOURCE": {
      const sourceLinks = [...state.form.sourceLinks];
      sourceLinks[action.index] = {
        ...sourceLinks[action.index],
        [action.field]: action.value,
      };
      return { ...state, dirty: true, form: { ...state.form, sourceLinks } };
    }

    /** Port of `addLink` (SubmitClient.tsx:57-62). */
    case "ADD_SOURCE":
      return {
        ...state,
        dirty: true,
        form: {
          ...state.form,
          sourceLinks: [...state.form.sourceLinks, { url: "", title: "" }],
        },
      };

    case "REMOVE_SOURCE":
      return {
        ...state,
        dirty: true,
        form: {
          ...state.form,
          sourceLinks: state.form.sourceLinks.filter((_, i) => i !== action.index),
        },
      };

    case "ADD_FILE":
      return {
        ...state,
        dirty: true,
        form: {
          ...state.form,
          sourceFiles: [...state.form.sourceFiles, action.file],
        },
      };

    /** Port of `removeFile` (SubmitClient.tsx:104-109). */
    case "REMOVE_FILE":
      return {
        ...state,
        dirty: true,
        form: {
          ...state.form,
          sourceFiles: state.form.sourceFiles.filter((_, i) => i !== action.index),
        },
      };

    case "GOTO_STEP":
      return {
        ...state,
        currentStep: action.step,
        visited: state.visited.includes(action.step)
          ? state.visited
          : [...state.visited, action.step],
      };

    /**
     * Mark a step as ACTIVELY satisfied (choice confirmed / input filled). Idempotent
     * — drives the reachability gate so a deep-link past an unanswered choice step
     * redirects back to it (UI-SPEC §2.6). Does NOT touch `dirty`/`form`; it records
     * only UI progress.
     */
    case "COMPLETE_STEP":
      return {
        ...state,
        completed: state.completed.includes(action.step)
          ? state.completed
          : [...state.completed, action.step],
      };

    /**
     * Switch the actor class on Back and invalidate ONLY the orphaned
     * entity-subtype answer (UI-SPEC §2.6, CONTEXT Success Criterion 4). The
     * entity-subtype IS `entityType` itself, so the orphan-clear writes the
     * freshly-chosen actor class — leaving the entity branch for "individual"
     * resolves entityType to "individual"; switching back to an entity branch
     * resets it to that branch and re-requires the Step-1b pick. Conduct
     * (`allegationClassification`) and role (`entityRole`) are BRANCH-INDEPENDENT
     * and preserved BYTE-IDENTICAL — minimal invalidation, no downstream nuke.
     */
    case "INVALIDATE_SUBTYPE":
      return {
        ...state,
        dirty: true,
        // Switching the actor class back to "individual" leaves the entity branch:
        // clear `entityChosen` so `entity-subtype` is skipped + uncounted again.
        entityChosen:
          action.entityType === "individual" ? false : state.entityChosen,
        form: {
          ...state.form,
          entityType: action.entityType,
        },
      };

    /**
     * User actively picked the "An entity" actor card. Marks the entity branch
     * active so `entity-subtype` is REACHABLE + COUNTED even though `entityType`
     * is still seeded "individual" (a concrete subtype enum is committed at Step
     * 1b). Does NOT write `entityType` — a non-enum value must never enter it.
     */
    case "CHOOSE_ENTITY_CLASS":
      return {
        ...state,
        dirty: true,
        entityChosen: true,
      };

    /**
     * Shallow-merge ONLY known `SubmitInput` keys from an untrusted draft
     * (T-28-06): never spread `action.draft` directly — that would let a
     * malformed/injected sessionStorage payload write arbitrary or
     * prototype-polluting keys.
     */
    case "RESTORE_DRAFT": {
      const safe: Partial<SubmitInput> = {};
      for (const key of RESTORABLE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(action.draft, key)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (safe as Record<string, unknown>)[key] = (action.draft as Record<string, unknown>)[key];
        }
      }
      const restoredForm = { ...state.form, ...safe };
      // v1.4 M5: a restored draft lost its `completed` confirmations, but the form
      // values prove which steps were already satisfied. Recompute `completed` for
      // EVERY step the restored form satisfies (not just actor-class) so
      // `firstIncompleteStep` lands the user at the first genuinely-unfinished step
      // instead of redirecting all the way back. Input steps are only marked when
      // their `requires` predicate passes (formSatisfiedSteps enforces this). Merge
      // with any pre-existing `completed` ids, de-duplicated.
      const satisfied = formSatisfiedSteps(restoredForm);
      const completed = [...state.completed];
      for (const id of satisfied) {
        if (!completed.includes(id)) completed.push(id);
      }
      return {
        ...state,
        dirty: false,
        form: restoredForm,
        completed,
        // A restored entity branch always carries a committed subtype enum, so
        // derive `entityChosen` from the restored entityType.
        entityChosen: restoredForm.entityType !== "individual",
      };
    }

    case "RESET":
      return {
        form: { ...initialForm, sourceLinks: [{ url: "", title: "" }], sourceFiles: [] },
        currentStep: "actor-class",
        dirty: false,
        visited: ["actor-class"],
        completed: [],
        entityChosen: false,
      };

    default:
      return state;
  }
};
