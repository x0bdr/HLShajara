/**
 * Wizard state machine for the v1.5 category-based report wizard.
 *
 * Pure, framework-free reducer + types for the multi-step report wizard. NO JSX,
 * NO React import beyond the `Reducer` type signature, NO `"use client"`. The
 * presentational components and the root container consume this engine.
 *
 * Contract binding: `WizardState.form` IS `SubmitInput` (from `@/lib/validation`)
 * — imported as a TYPE and reused, never redeclared.
 */

import type { Reducer } from "react";
import type { SubmitInput, ReportMetadata } from "@/lib/validation";
import type { StepId } from "./registry";
import { formSatisfiedSteps } from "./registry";

/* ---------- STATE ---------- */

export interface WizardState {
  /** The submission payload — typed AS the `/api/submit` contract. */
  form: SubmitInput;
  /** The currently-rendered step id (mirrors the `?step=` slug). */
  currentStep: StepId;
  /** True once the user has changed any field. */
  dirty: boolean;
  /** Steps the user has reached. */
  visited: StepId[];
  /** Steps the user has ACTIVELY satisfied. */
  completed: StepId[];
  /** Legacy flag — kept for draft-restore shape compatibility. Unused in v1.5. */
  entityChosen: boolean;
}

const initialForm: SubmitInput = {
  entityName: "",
  entityType: "organization",
  reportCategory: "" as unknown as SubmitInput["reportCategory"],
  reportMetadata: {},
  entityRole: "",
  allegationDescription: "",
  allegationPeriod: "",
  allegationLocation: "",
  allegationClassification: "",
  sourceLinks: [],
  sourceFiles: [],
  submitterEmail: "",
  submitterName: "",
  isAnonymous: true,
};

export const initialWizardState: WizardState = {
  form: initialForm,
  currentStep: "report-category",
  dirty: false,
  visited: ["report-category"],
  completed: [],
  entityChosen: false,
};

const RESTORABLE_KEYS: ReadonlyArray<keyof SubmitInput> = [
  "entityName",
  "entityType",
  "reportCategory",
  "reportMetadata",
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
  | { type: "SET_METADATA"; field: keyof ReportMetadata; value: ReportMetadata[keyof ReportMetadata] }
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

export const wizardReducer: Reducer<WizardState, WizardAction> = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        dirty: true,
        entityChosen:
          action.field === "entityType"
            ? action.value !== "individual"
            : state.entityChosen,
        form: { ...state.form, [action.field]: action.value },
      };

    case "SET_METADATA": {
      const metadata: ReportMetadata = { ...state.form.reportMetadata, [action.field]: action.value };
      return {
        ...state,
        dirty: true,
        form: { ...state.form, reportMetadata: metadata },
      };
    }

    case "SET_SOURCE": {
      const sourceLinks = [...state.form.sourceLinks];
      sourceLinks[action.index] = {
        ...sourceLinks[action.index],
        [action.field]: action.value,
      };
      return { ...state, dirty: true, form: { ...state.form, sourceLinks } };
    }

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

    case "COMPLETE_STEP":
      return {
        ...state,
        completed: state.completed.includes(action.step)
          ? state.completed
          : [...state.completed, action.step],
      };

    case "INVALIDATE_SUBTYPE":
      return {
        ...state,
        dirty: true,
        entityChosen: action.entityType === "individual" ? false : state.entityChosen,
        form: {
          ...state.form,
          entityType: action.entityType,
        },
      };

    case "CHOOSE_ENTITY_CLASS":
      return {
        ...state,
        dirty: true,
        entityChosen: true,
      };

    case "RESTORE_DRAFT": {
      const safe: Partial<SubmitInput> = {};
      for (const key of RESTORABLE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(action.draft, key)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (safe as Record<string, unknown>)[key] = (action.draft as Record<string, unknown>)[key];
        }
      }
      const restoredForm = { ...state.form, ...safe };
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
        entityChosen: restoredForm.entityType !== "individual",
      };
    }

    case "RESET":
      return {
        form: {
          ...initialForm,
          sourceLinks: [],
          sourceFiles: [],
          reportMetadata: {},
        },
        currentStep: "report-category",
        dirty: false,
        visited: ["report-category"],
        completed: [],
        entityChosen: false,
      };

    default:
      return state;
  }
};
