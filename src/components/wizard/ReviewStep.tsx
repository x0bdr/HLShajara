"use client";

/**
 * ReviewStep — terminal read-only summary for the v1.5 category-based wizard.
 *
 * Renders seven semantic groups (Category, Location, Entity, Details, Experience,
 * Evidence, You), each with an Edit link to the first step of that group.
 */

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components";
import type { SubmitInput, ReportCategory } from "@/lib/validation";
import { getCategoryConfig, SUPPORTING_DOCUMENT_OPTIONS } from "@/lib/wizard/category-config";
import {
  stripSourceType,
  displayValue,
} from "./review-helpers";

export { stripSourceType, displayValue } from "./review-helpers";

export const REVIEW_GROUP_IDS = [
  "report-category",
  "location-info",
  "entity-type-name",
  "report-details",
  "experience",
  "media-evidence",
  "about-you",
] as const;

interface ReviewStepProps {
  form: SubmitInput & { leadNote?: string };
  affirmed: boolean;
  submitting: boolean;
  onEdit: (stepId: string) => void;
  onAffirmChange: (checked: boolean) => void;
  onSubmit: () => void;
}

export function ReviewStep({
  form,
  affirmed,
  submitting,
  onEdit,
  onAffirmChange,
  onSubmit,
}: ReviewStepProps) {
  const t = useTranslations("submit");
  const locale = useLocale();
  const meta = form.reportMetadata ?? {};
  const categoryConfig = getCategoryConfig(form.reportCategory as ReportCategory);
  const categoryLabel = categoryConfig
    ? locale === "ar"
      ? categoryConfig.labelAr
      : categoryConfig.labelEn
    : displayValue(form.reportCategory);

  const subType = categoryConfig?.subTypes.find((s) => s.value === meta.orgType);
  const subTypeLabel = subType
    ? locale === "ar"
      ? subType.labelAr
      : subType.labelEn ?? subType.labelAr
    : displayValue(meta.orgType);

  const submitDisabled = submitting || !affirmed;

  return (
    <div className="flex-col">
      <div className="t">{t("reviewTitle")}</div>

      {/* Category */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupCategory")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("report-category")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("q_reportCategory")}</span>
          <span className="v">{categoryLabel}</span>
        </div>
      </div>

      {/* Location */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupLocation")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("location-info")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("locCountry")}</span>
          <span className="v">{displayValue(meta.country)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("location")}</span>
          <span className="v">{displayValue(form.allegationLocation)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locNearest")}</span>
          <span className="v">{displayValue(meta.nearestLocation)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locContact")}</span>
          <span className="v">{displayValue(meta.contactPhone)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locWebsite")}</span>
          <span className="v">{displayValue(meta.websiteName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locMaps")}</span>
          <span className="v">{displayValue(meta.googleMapsLink)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locSocial")}</span>
          <span className="v">{displayValue(meta.socialMediaAccounts)}</span>
        </div>
      </div>

      {/* Entity / Person */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupEntity")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("entity-type-name")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("etnType")}</span>
          <span className="v">{subTypeLabel}</span>
        </div>
        {meta.orgType === "other" && (
          <div className="review-row">
            <span className="k">{t("etnOtherSpecify")}</span>
            <span className="v">{displayValue(meta.orgSubTypeOther)}</span>
          </div>
        )}
        <div className="review-row">
          <span className="k">{t("etnName")}</span>
          <span className="v">{displayValue(form.entityName)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupDetails")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("report-details")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsOwnerName")}</span>
          <span className="v">{displayValue(meta.ownerName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsReportedName")}</span>
          <span className="v">{displayValue(meta.reportedPersonName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsReportedPhone")}</span>
          <span className="v">{displayValue(meta.reportedPersonPhone)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsReportedPosition")}</span>
          <span className="v">{displayValue(meta.reportedPersonPosition)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsReportedSocial")}</span>
          <span className="v">{displayValue(meta.reportedPersonSocialMedia)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsCarType")}</span>
          <span className="v">{displayValue(meta.carType)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsCarPlate")}</span>
          <span className="v">{displayValue(meta.carPlate)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsDriverPhone")}</span>
          <span className="v">{displayValue(meta.driverPhone)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsDriverName")}</span>
          <span className="v">{displayValue(meta.driverName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsTaxiNumber")}</span>
          <span className="v">{displayValue(meta.taxiNumber)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsAppName")}</span>
          <span className="v">{displayValue(meta.appName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsPropertyType")}</span>
          <span className="v">{displayValue(meta.propertyType)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsPartnerName")}</span>
          <span className="v">{displayValue(meta.partnerName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsInvestorName")}</span>
          <span className="v">{displayValue(meta.investorName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsReceptionInfo")}</span>
          <span className="v">{displayValue(meta.receptionInfo)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsLabourInfo")}</span>
          <span className="v">{displayValue(meta.labourInfo)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsSupportDataInfo")}</span>
          <span className="v">{displayValue(meta.supportDataInfo)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("detailsClubName")}</span>
          <span className="v">{displayValue(meta.clubName)}</span>
        </div>
      </div>

      {/* Experience */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupExperience")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("experience")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("expLabel")}</span>
          <span className="v">{displayValue(form.allegationDescription)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("expDocuments")}</span>
          <span className="v">
            {(meta.supportingDocuments ?? []).length === 0
              ? displayValue("")
              : (meta.supportingDocuments ?? [])
                  .map((v) => {
                    const opt = SUPPORTING_DOCUMENT_OPTIONS.find((o) => o.value === v);
                    return opt
                      ? locale === "ar"
                        ? opt.labelAr
                        : opt.labelEn ?? opt.labelAr
                      : v;
                  })
                  .join("، ")}
          </span>
        </div>
      </div>

      {/* Evidence */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupEvidence")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("media-evidence")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">
            {t("reviewSourcesShort")}
            <span className="filter-badge">{form.sourceLinks.length}</span>
          </span>
          <span className="v">
            {form.sourceLinks.length === 0 ? (
              displayValue("")
            ) : (
              <span className="review-sources flex-col">
                {form.sourceLinks.map((row, i) => {
                  const { type } = stripSourceType(row.title ?? "");
                  return (
                    <span key={i} className="flex-col">
                      <span className="ds-mono">{row.url}</span>
                      {type ? (
                        <span className="ds-caption">
                          {t("reviewSourceTypeLabel")}: {type}
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </span>
            )}
          </span>
        </div>
        <div className="review-row">
          <span className="k">{t("mediaTitle")}</span>
          <span className="v">
            {form.sourceFiles.length === 0
              ? displayValue("")
              : form.sourceFiles.map((f) => f.originalName).join(", ")}
          </span>
        </div>
        <div className="review-row">
          <span className="k">{t("mediaNotes")}</span>
          <span className="v">{displayValue(meta.mediaNotes)}</span>
        </div>
      </div>

      {/* You */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupYou")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("about-you")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("anonToggle")}</span>
          <span className="v">{form.isAnonymous ? t("anonToggle") : displayValue("")}</span>
        </div>
        {!form.isAnonymous ? (
          <>
            <div className="review-row">
              <span className="k">{t("fullName")}</span>
              <span className="v">{displayValue(form.submitterName)}</span>
            </div>
            <div className="review-row">
              <span className="k">{t("reviewContactMethods")}</span>
              <span className="v">
                {(meta.contactMethods ?? []).length === 0
                  ? displayValue("")
                  : (meta.contactMethods ?? [])
                      .map((m) => `${t(`contactType_${m.type}`)}: ${m.value}`)
                      .join(" · ")}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="review-affirm">
        <label className="flex-between" htmlFor="review-affirm-check">
          <input
            id="review-affirm-check"
            type="checkbox"
            checked={affirmed}
            onChange={(e) => onAffirmChange(e.target.checked)}
          />
          <span className="ds-body-sm">{t("affirm")}</span>
        </label>

        {!affirmed ? (
          <div className="legal legal-error mt-16" role="status">
            <p>{t("errAffirmGate")}</p>
          </div>
        ) : null}

        <div className="wizard-nav flex-between mt-16">
          <Button
            variant="primary"
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            onClick={onSubmit}
          >
            {submitting ? t("submitting") : t("submitButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
