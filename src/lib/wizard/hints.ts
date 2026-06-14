/**
 * Inline hint messages for the v1.5 category-based wizard.
 *
 * Pure helper: returns the i18n key of the first unmet requirement for the
 * current step, or null when the step is valid. These are shown above the
 * navigation so the submitter knows why Next is disabled.
 */

import type { SubmitInput } from "@/lib/validation";
import type { StepId } from "./registry";

export function stepHintKey(step: StepId, form: SubmitInput): string | null {
  const meta = form.reportMetadata ?? {};

  switch (step) {
    case "report-category":
      return form.reportCategory.trim().length > 0 ? null : "hintReportCategory";

    case "location-info":
      return (form.allegationLocation ?? "").trim().length > 0 ? null : "hintLocationInfo";

    case "entity-type-name": {
      if (!form.reportCategory) return "hintReportCategory";
      if (!(meta.orgType ?? "").trim()) return "hintEntityType";
      if (!form.entityName.trim()) return "hintEntityName";
      return null;
    }

    case "report-details":
      return null;

    case "experience":
      return form.allegationDescription.trim().length >= 20 ? null : "hintExperience";

    case "media-evidence":
      return null;

    case "about-you":
      return null;

    case "review":
      return null;

    default:
      return null;
  }
}
