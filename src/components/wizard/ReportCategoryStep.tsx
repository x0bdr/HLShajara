"use client";

/**
 * ReportCategoryStep — Step 1 of the v1.5 category-based wizard.
 *
 * Renders the eight report categories as a card grid with icons and
 * descriptions. The selected category maps to `form.entityType` (individual for
 * "أفراد", organization for the rest) and is written to `form.reportCategory`.
 * A Next button is shown so the user confirms the selection before advancing.
 */

import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { REPORT_CATEGORIES, getCategoryLabel, getCategoryDescription } from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";
import { CardSelect } from "./CardSelect";

interface ReportCategoryStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
  onConfirm?: (value: string) => void;
}

export function ReportCategoryStep({ form, dispatch, onConfirm }: ReportCategoryStepProps) {
  const t = useTranslations("submit");

  const options = REPORT_CATEGORIES.map((cat) => {
    const Icon = getIconByName(cat.iconName);
    return {
      value: cat.id,
      title: getCategoryLabel(t, cat.id),
      description: getCategoryDescription(t, cat.id),
      icon: Icon ? <Icon size={24} /> : null,
    };
  });

  function handleSelect(value: string) {
    const config = REPORT_CATEGORIES.find((c) => c.id === value);
    dispatch({
      type: "SET_FIELD",
      field: "entityType",
      value: config?.entityType ?? "organization",
    });
    dispatch({ type: "SET_FIELD", field: "reportCategory", value });
  }

  const canAdvance = Boolean(form.reportCategory);

  return (
    <div className="flex-col">
      <CardSelect
        ariaLabel={t("q_reportCategory")}
        mode="single"
        selected={form.reportCategory}
        options={options}
        onChange={(value) => handleSelect(value)}
      />

      <div className="wizard-nav flex-between mt-16">
        <div />
        <button
          type="button"
          className="btn primary next"
          disabled={!canAdvance}
          aria-disabled={!canAdvance}
          onClick={() => canAdvance && onConfirm?.(form.reportCategory)}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}

export default ReportCategoryStep;
