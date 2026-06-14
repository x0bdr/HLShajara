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
}

/**
 * Canonical seed shape — field names are LIFTED VERBATIM from the legacy
 * single-page form (`SubmitClient.tsx:17-30`) because they ARE the `/api/submit`
 * contract. The ONE intentional divergence: `isAnonymous` seeds to `true`
 * (UI-SPEC §8 / S7 anonymity-default-on). The schema default is `false`
 * (`validation.ts:87`); the UI flips it at the client seed now, the DB-column
 * default flip is BE-04 in Phase 33.
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
  currentStep: "scaffold-choice",
  dirty: false,
  visited: ["scaffold-choice"],
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
  | { type: "INVALIDATE_DOWNSTREAM" }
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
     * Clear the answers that depend on the actor-class branch when the upstream
     * choice changes (UI-SPEC §2.6) — conduct classification and role are the
     * entityType-dependent downstream answers in the scaffold flow. The
     * presentational layer dispatches this when the branch actually changes.
     */
    case "INVALIDATE_DOWNSTREAM":
      return {
        ...state,
        dirty: true,
        form: {
          ...state.form,
          allegationClassification: "",
          entityRole: "",
        },
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
      return { ...state, dirty: false, form: { ...state.form, ...safe } };
    }

    case "RESET":
      return {
        form: { ...initialForm, sourceLinks: [{ url: "", title: "" }], sourceFiles: [] },
        currentStep: "scaffold-choice",
        dirty: false,
        visited: ["scaffold-choice"],
      };

    default:
      return state;
  }
};
