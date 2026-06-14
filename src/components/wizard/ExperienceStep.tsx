"use client";

/**
 * ExperienceStep — Step 5 of the v1.5 category-based wizard (تجربتك).
 *
 * Free-text experience description + supporting-documents cards. Runs the same
 * middle screens as the legacy describe step so inline warnings match the server.
 */

import { useLocale, useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { screenDescribeStep } from "@/lib/wizard/step-logic";
import { SUPPORTING_DOCUMENT_OPTIONS } from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";
import { CardSelect } from "./CardSelect";

interface ExperienceStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

const WARN_KEY: Record<string, string> = {
  GROUP_TARGET: "descWarnGroup",
  PRIVATE_TARGETING: "descWarnPrivate",
  INNOCENT_PARTY: "descWarnInnocent",
  INCITEMENT: "descWarnIncitement",
  HATE_TONE: "descWarnTone",
};

export function ExperienceStep({ form, dispatch }: ExperienceStepProps) {
  const t = useTranslations("submit");
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(
    locale,
    locale === "ar" ? { numberingSystem: "arab" } : undefined,
  );

  const meta = form.reportMetadata ?? {};
  const selectedDocs: string[] = meta.supportingDocuments ?? [];

  function toggleDoc(value: string, checked: boolean) {
    const next = checked
      ? [...selectedDocs, value]
      : selectedDocs.filter((d) => d !== value);
    dispatch({ type: "SET_METADATA", field: "supportingDocuments", value: next });
  }

  const screen = screenDescribeStep(form);
  const warnKey = !screen.ok ? WARN_KEY[screen.code] : undefined;

  const docOptions = SUPPORTING_DOCUMENT_OPTIONS.map((opt) => {
    const Icon = getIconByName(opt.iconName);
    return {
      value: opt.value,
      title: locale === "ar" ? opt.labelAr : opt.labelEn ?? opt.labelAr,
      icon: Icon ? <Icon size={22} /> : null,
    };
  });

  return (
    <div className="flex-col">
      <div className="form-field">
        <label htmlFor="exp-text">{t("expLabel")}</label>
        <p className="ds-caption">{t("expHint")}</p>
        <textarea
          id="exp-text"
          className="ds-input"
          rows={5}
          required
          style={{ resize: "vertical" }}
          value={form.allegationDescription}
          aria-describedby={warnKey ? "exp-text-error" : undefined}
          aria-invalid={warnKey ? true : undefined}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "allegationDescription",
              value: e.target.value,
            })
          }
        />
        <p className="ds-caption">
          {t("descCounter", { count: fmt.format(form.allegationDescription.length) })}
        </p>
        {warnKey && (
          <p id="exp-text-error" className="legal-error" role="alert">
            {t(warnKey as never)}
          </p>
        )}
      </div>

      <div className="form-field">
        <label>{t("expDocuments")}</label>
        <CardSelect
          ariaLabel={t("expDocuments")}
          mode="multi"
          selected={selectedDocs}
          options={docOptions}
          onChange={toggleDoc}
        />
      </div>
    </div>
  );
}

export default ExperienceStep;
