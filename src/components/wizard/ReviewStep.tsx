"use client";

/**
 * ReviewStep — terminal read-only summary for the v1.5 category-based wizard.
 *
 * Renders seven semantic groups (Category, Location, Entity, Details, Experience,
 * Evidence, You), each with an Edit link to the first step of that group.
 */

import { useLocale, useTranslations } from "next-intl";
import type { SubmitInput, ReportCategory, ReportMetadata } from "@/lib/validation";
import {
  getCategoryConfig,
  getRelevantDetailFieldIds,
  getCategoryLabel,
  getSubTypeLabel,
  getDocumentLabel,
  getCountryLabel,
  type DetailFieldId,
} from "@/lib/wizard/category-config";
import { displayValue } from "./review-helpers";

export { displayValue } from "./review-helpers";

export const REVIEW_GROUP_IDS = [
  "report-category",
  "location-info",
  "entity-type-name",
  "report-details",
  "experience",
  "media-evidence",
  "about-you",
] as const;

const DETAIL_FIELD_LABEL_KEYS: Record<DetailFieldId, string> = {
  ownerName: "detailsOwnerName",
  reportedPersonName: "detailsReportedName",
  reportedPersonNickname: "detailsReportedNickname",
  reportedPersonPhone: "detailsReportedPhone",
  reportedPersonPosition: "detailsReportedPosition",
  reportedPersonSocialMedia: "detailsReportedSocial",
  carType: "detailsCarType",
  carPlate: "detailsCarPlate",
  driverPhone: "detailsDriverPhone",
  driverName: "detailsDriverName",
  taxiNumber: "detailsTaxiNumber",
  appName: "detailsAppName",
  propertyType: "detailsPropertyType",
  partnerName: "detailsPartnerName",
  investorName: "detailsInvestorName",
  receptionInfo: "detailsReceptionInfo",
  labourInfo: "detailsLabourInfo",
  supportDataInfo: "detailsSupportDataInfo",
  clubName: "detailsClubName",
};

const DETAIL_FIELD_META_KEYS: Record<DetailFieldId, keyof ReportMetadata | undefined> = {
  ownerName: "ownerName",
  reportedPersonName: "reportedPersonName",
  reportedPersonNickname: undefined,
  reportedPersonPhone: "reportedPersonPhone",
  reportedPersonPosition: "reportedPersonPosition",
  reportedPersonSocialMedia: "reportedPersonSocialMedia",
  carType: "carType",
  carPlate: "carPlate",
  driverPhone: "driverPhone",
  driverName: "driverName",
  taxiNumber: "taxiNumber",
  appName: "appName",
  propertyType: "propertyType",
  partnerName: "partnerName",
  investorName: "investorName",
  receptionInfo: "receptionInfo",
  labourInfo: "labourInfo",
  supportDataInfo: "supportDataInfo",
  clubName: "clubName",
};

function getDetailFieldValue(meta: ReportMetadata, fieldId: DetailFieldId): string | undefined {
  const key = DETAIL_FIELD_META_KEYS[fieldId];
  if (!key) return undefined;
  return meta[key] as string | undefined;
}

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
  const relevantDetailFields = getRelevantDetailFieldIds(
    form.reportCategory,
    meta.orgType,
    meta.detailFlags,
  );
  const categoryConfig = getCategoryConfig(form.reportCategory as ReportCategory);
  const categoryLabel = categoryConfig
    ? getCategoryLabel(t, categoryConfig.id)
    : displayValue(form.reportCategory);

  const subTypeLabel = meta.orgType
    ? getSubTypeLabel(t, form.reportCategory, meta.orgType)
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
          <span className="v">{meta.country ? getCountryLabel(t, meta.country) : displayValue(meta.country)}</span>
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
        {relevantDetailFields.map((fieldId) => (
          <div className="review-row" key={fieldId}>
            <span className="k">{t(DETAIL_FIELD_LABEL_KEYS[fieldId])}</span>
            <span className="v">{displayValue(getDetailFieldValue(meta, fieldId))}</span>
          </div>
        ))}
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
                  .map((v) => getDocumentLabel(t, v))
                  .join(locale === "ar" ? "، " : ", ")}
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
          <span className="k">{t("mediaLink")}</span>
          <span className="v">{displayValue(meta.mediaLink)}</span>
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
          <button
            type="button"
            className="btn primary"
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            onClick={onSubmit}
          >
            {submitting ? t("submitting") : t("submitButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
