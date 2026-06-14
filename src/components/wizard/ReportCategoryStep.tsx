"use client";

/**
 * ReportCategoryStep — Step 1 of the v1.5 category-based wizard.
 *
 * Renders the eight report categories as a card grid with icons and
 * descriptions. The selected category maps to `form.entityType` (individual for
 * "أفراد", organization for the rest) and is written to `form.reportCategory`.
 * Notifies the parent via `onConfirm` so choice steps can auto-advance.
 */

import { useLocale, useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { REPORT_CATEGORIES } from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";
import { CardSelect } from "./CardSelect";

interface ReportCategoryStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
  onConfirm?: (value: string) => void;
}

export function ReportCategoryStep({ form, dispatch, onConfirm }: ReportCategoryStepProps) {
  const t = useTranslations("submit");
  const locale = useLocale();

  const options = REPORT_CATEGORIES.map((cat) => {
    const Icon = getIconByName(cat.iconName);
    return {
      value: cat.id,
      title: locale === "ar" ? cat.labelAr : cat.labelEn,
      description: locale === "ar" ? cat.descAr : cat.descEn,
      icon: Icon ? <Icon size={24} /> : null,
    };
  });

  return (
    <CardSelect
      ariaLabel={t("q_reportCategory")}
      mode="single"
      selected={form.reportCategory}
      options={options}
      onChange={(value, selected) => {
        if (!selected) return;
        const config = REPORT_CATEGORIES.find((c) => c.id === value);
        dispatch({
          type: "SET_FIELD",
          field: "entityType",
          value: config?.entityType ?? "organization",
        });
        dispatch({ type: "SET_FIELD", field: "reportCategory", value });
        onConfirm?.(value);
      }}
    />
  );
}

export default ReportCategoryStep;
