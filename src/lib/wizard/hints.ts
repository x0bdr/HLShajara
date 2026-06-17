/**
 * Inline hint messages for the v1.5 category-based wizard.
 *
 * Pure helper: returns the i18n key of the first unmet requirement for the
 * current step, or null when the step is valid. These are shown above the
 * navigation so the submitter knows why Next is disabled.
 */

import type { SubmitInput } from "@/lib/validation";
import type { StepId } from "./registry";
import { getSubTypeConfig, DETAIL_FLAG_FIELDS } from "./category-config";

export function stepHintKey(step: StepId, form: SubmitInput): string | null {
  const meta = form.reportMetadata ?? {};

  switch (step) {
    case "report-category":
      return form.reportCategory.trim().length > 0 ? null : "hintReportCategory";

    case "location-info": {
      if ((form.allegationLocation ?? "").trim().length === 0) return "hintLocationInfo";
      if ((meta.governorate ?? "").trim().length === 0) return "hintLocationGovernorate";
      const hasContact =
        (meta.contactPhone ?? "").trim().length > 0 ||
        (meta.entityEmail ?? "").trim().length > 0 ||
        (meta.websiteName ?? "").trim().length > 0 ||
        (meta.googleMapsLink ?? "").trim().length > 0 ||
        (meta.socialContactMethods ?? []).length > 0;
      if (!hasContact) return "hintLocationContact";
      return null;
    }

    case "entity-type-name": {
      if (!form.reportCategory) return "hintReportCategory";
      if (!(meta.orgType ?? "").trim()) return "hintEntityType";
      if ((meta.orgType ?? "").trim() === "other" && !(meta.orgSubTypeOther ?? "").trim()) {
        return "hintEntitySubTypeOther";
      }
      // Individuals hide the entityName field, so don't nag for it.
      if (form.reportCategory !== "individuals" && !form.entityName.trim()) return "hintEntityName";
      return null;
    }

    case "report-details": {
      const category = form.reportCategory;
      const orgType = meta.orgType ?? "";

      if (category === "individuals") {
        return (meta.reportedPersonName ?? "").trim().length > 0 ? null : "hintReportDetailsReportedName";
      }

      if (category === "tourism" && orgType === "private_car") {
        return (meta.carPlate ?? "").trim().length > 0 ? null : "hintReportDetailsCarPlate";
      }

      const flags = meta.detailFlags ?? [];
      if (flags.length === 0) return "hintReportDetailsFlag";

      for (const flag of flags) {
        const mapping = DETAIL_FLAG_FIELDS[flag];
        if (!mapping) continue;
        const value = meta[mapping.field];
        const isFilled = Array.isArray(value)
          ? value.length > 0
          : typeof value === "string" && value.trim().length > 0;
        if (!isFilled) return "hintReportDetailsFlagField";
      }

      if (category === "tourism" && orgType === "taxi" && (meta.carPlate ?? "").trim().length === 0) {
        return "hintReportDetailsCarPlate";
      }

      return null;
    }

    case "experience":
      return form.allegationDescription.trim().length >= 20 ? null : "hintExperience";

    case "media-evidence":
      return null;

    case "about-you": {
      if (form.isAnonymous) return null;
      const methods = meta.contactMethods ?? [];
      return methods.length > 0 ? null : "hintAboutYouContact";
    }

    case "review":
      return null;

    default:
      return null;
  }
}
