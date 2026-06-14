"use client";

/**
 * DescribeStep — Step 5 of the report wizard (Phase 30, STEP-04).
 *
 * The free-text "describe the documented act" step. Ports the legacy
 * description-textarea + period markup from `SubmitClient.tsx`, swapping
 * `useState` for the `{ form, dispatch }` reducer contract.
 *
 *  - Live character counter via the `descCounter` ICU key, updating every keystroke;
 *    the registry `requiresDescribe` predicate gates Next at ≥20 chars (no Next here).
 *  - Inline screen warnings: `screenDescribeStep` runs the MIDDLE screens in the
 *    EXACT server order (GROUP_TARGET → INCITEMENT → HATE_TONE → INNOCENT_PARTY →
 *    PRIVATE_TARGETING) and returns the FIRST failing code; exactly one warning
 *    renders in a `.legal-error`, matching what `/api/submit` would return.
 *  - Optional coarse time-period input bound to `allegationPeriod`.
 *
 * Renders the step BODY only (no Next button). No `dangerouslySetInnerHTML`;
 * logical CSS only (RTL-safe).
 */

import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { screenDescribeStep } from "@/lib/wizard/step-logic";

interface DescribeStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

/** Maps the first-failing server screen code to its inline-warning i18n key. */
const WARN_KEY: Record<string, string> = {
  GROUP_TARGET: "descWarnGroup",
  PRIVATE_TARGETING: "descWarnPrivate",
  INNOCENT_PARTY: "descWarnInnocent",
  INCITEMENT: "descWarnIncitement",
  HATE_TONE: "descWarnTone",
};

export function DescribeStep({ form, dispatch }: DescribeStepProps) {
  const t = useTranslations("submit");

  const screen = screenDescribeStep(form);
  const warnKey = !screen.ok ? WARN_KEY[screen.code] : undefined;

  return (
    <div className="flex-col">
      <div className="form-field">
        <label htmlFor="desc-text">{t("descLabel")}</label>
        <p className="ds-caption">{t("descHint")}</p>
        <textarea
          id="desc-text"
          className="ds-input"
          rows={5}
          required
          style={{ resize: "vertical" }}
          value={form.allegationDescription}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "allegationDescription",
              value: e.target.value,
            })
          }
        />
        <p className="ds-caption">
          {t("descCounter", { count: form.allegationDescription.length })}
        </p>
        {warnKey && (
          <p className="legal-error" role="alert">
            {t(warnKey as never)}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="desc-period">{t("period")}</label>
        <input
          id="desc-period"
          type="text"
          className="ds-input"
          value={form.allegationPeriod ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "allegationPeriod", value: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default DescribeStep;
