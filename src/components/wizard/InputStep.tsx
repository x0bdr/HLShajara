"use client";

/**
 * InputStep — the SCAFFOLD input archetype (Plan 28-05, WIZ-01).
 *
 * A single Next-gated `.form-field` + `.ds-input` text field proving the input
 * interaction pattern before the real fields land in Phase 30. Modeled on the
 * legacy `.form-field`/`.ds-input` block (`SubmitClient.tsx:170-179`): a label +
 * controlled text input bound to the reducer via `dispatch({type:"SET_FIELD"})`.
 *
 * The PARENT (`WizardClient`) owns the Next button (rendered by `WizardNav`) and
 * gates it on `stepValid` derived from the registry `requires` predicate — this
 * step just renders the controlled field; it intentionally renders NO Next of
 * its own (UI-SPEC §2.2).
 *
 * S1-S4 (T-28-13): this is a NEUTRAL placeholder text field bound to the
 * existing `entityName` contract field. It is NOT (and is not labelled as) any
 * of the banned S1-S4 targeting categories the design review rejects — no such
 * field appears anywhere in the shell or scaffold. Visuals are Plan 28-02 /
 * existing CSS classes only — no inline color, no `dangerouslySetInnerHTML`.
 */

import type { Dispatch } from "react";
import type { WizardAction } from "@/lib/wizard/state";

interface InputStepProps {
  /** Unique id wiring the `<label htmlFor>` to the input. */
  fieldId: string;
  /** Resolved (already-translated) label text. */
  label: string;
  /** Current controlled value from the form state. */
  value: string;
  /** Reducer dispatch — the field write goes through SET_FIELD. */
  dispatch: Dispatch<WizardAction>;
}

export function InputStep({ fieldId, label, value, dispatch }: InputStepProps) {
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        type="text"
        className="ds-input"
        value={value}
        onChange={(e) =>
          dispatch({ type: "SET_FIELD", field: "entityName", value: e.target.value })
        }
      />
    </div>
  );
}
