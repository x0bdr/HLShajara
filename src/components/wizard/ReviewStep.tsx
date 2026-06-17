"use client";

/**
 * ReviewStep — terminal read-only summary for the v1.5 category-based wizard.
 *
 * Renders seven semantic groups (Category, Location, Entity, Details, Experience,
 * Supporting Media, You), each with an Edit link to the first step of that group.
 * Includes a lightweight math CAPTCHA at the bottom to reduce automated spam.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SubmitInput, ReportMetadata } from "@/lib/validation";
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

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1; // 1-9
  const b = Math.floor(Math.random() * 9) + 1; // 1-9
  return { a, b, answer: a + b };
}

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
  ownerNames: "detailsOwnerName",
  academicStaff: "detailsAcademicStaff",
  doctors: "detailsDoctors",
  nurses: "detailsNurses",
  members: "detailsMembers",
  reportedPersonName: "detailsReportedName",
  professorName: "detailsProfessorName",
  universityDoctorName: "detailsUniversityDoctorName",
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
  investorNames: "detailsInvestorName",
  receptionInfo: "detailsReceptionInfo",
  labourInfo: "detailsLabourInfo",
  labourEntries: "detailsLabourInfo",
  supportDataInfo: "detailsSupportDataInfo",
  clubName: "detailsClubName",
};

const DETAIL_FIELD_META_KEYS: Record<DetailFieldId, keyof ReportMetadata | undefined> = {
  ownerName: "ownerName",
  ownerNames: "ownerNames",
  academicStaff: "academicStaff",
  doctors: "doctors",
  nurses: "nurses",
  members: "members",
  reportedPersonName: "reportedPersonName",
  professorName: "professorName",
  universityDoctorName: "universityDoctorName",
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
  investorNames: "investorNames",
  receptionInfo: "receptionInfo",
  labourInfo: "labourInfo",
  labourEntries: "labourEntries",
  supportDataInfo: "supportDataInfo",
  clubName: "clubName",
};

function getDetailFieldDisplay(
  meta: ReportMetadata,
  fieldId: DetailFieldId,
  locale: string,
): string | undefined {
  if (fieldId === "ownerNames") {
    const arr = meta.ownerNames ?? [];
    return arr.length ? arr.join(locale === "ar" ? "، " : ", ") : undefined;
  }
  if (fieldId === "investorNames") {
    const arr = meta.investorNames ?? [];
    return arr.length ? arr.join(locale === "ar" ? "، " : ", ") : undefined;
  }
  if (fieldId === "doctors") {
    const arr = meta.doctors ?? [];
    return arr.length ? arr.join(locale === "ar" ? "، " : ", ") : undefined;
  }
  if (fieldId === "nurses") {
    const arr = meta.nurses ?? [];
    return arr.length ? arr.join(locale === "ar" ? "، " : ", ") : undefined;
  }
  if (fieldId === "members") {
    const arr = meta.members ?? [];
    return arr.length ? arr.join(locale === "ar" ? "، " : ", ") : undefined;
  }
  if (fieldId === "labourEntries") {
    const arr = meta.labourEntries ?? [];
    return arr.length
      ? arr
          .filter((e) => e.name || e.role)
          .map((e) => (e.name && e.role ? `${e.name} (${e.role})` : e.name || e.role))
          .join(locale === "ar" ? "، " : ", ")
      : undefined;
  }
  if (fieldId === "academicStaff") {
    const arr = meta.academicStaff ?? [];
    return arr.length
      ? arr
          .filter((e) => e.name || e.role)
          .map((e) => (e.name && e.role ? `${e.name} (${e.role})` : e.name || e.role))
          .join(locale === "ar" ? "، " : ", ")
      : undefined;
  }
  const key = DETAIL_FIELD_META_KEYS[fieldId];
  if (!key) return undefined;
  return meta[key] as string | undefined;
}

interface ReviewStepProps {
  form: SubmitInput & { leadNote?: string };
  submitting: boolean;
  onEdit: (stepId: string) => void;
  onSubmit: () => void;
}

export function ReviewStep({
  form,
  submitting,
  onEdit,
  onSubmit,
}: ReviewStepProps) {
  const t = useTranslations("submit");
  const locale = useLocale();
  const meta = form.reportMetadata ?? {};
  const [captcha, setCaptcha] = useState(() => makeCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  const relevantDetailFields = getRelevantDetailFieldIds(
    form.reportCategory,
    meta.orgType,
    meta.detailFlags,
  );
  const categoryConfig = getCategoryConfig(form.reportCategory);
  const categoryLabel = categoryConfig
    ? getCategoryLabel(t, categoryConfig.id)
    : displayValue(form.reportCategory);

  const subTypeLabel = meta.orgType
    ? getSubTypeLabel(t, form.reportCategory, meta.orgType)
    : displayValue(meta.orgType);

  function handleSubmit() {
    const value = parseInt(captchaInput.trim(), 10);
    if (Number.isNaN(value) || value !== captcha.answer) {
      setCaptchaError(true);
      setCaptcha(makeCaptcha());
      setCaptchaInput("");
      return;
    }
    setCaptchaError(false);
    onSubmit();
  }

  return (
    <div className="flex-col">
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
          <span className="v">{meta.country ? getCountryLabel(t, locale, meta.country) : displayValue(meta.country)}</span>
        </div>
        {meta.governorate && (
          <div className="review-row">
            <span className="k">{t("locGovernorate")}</span>
            <span className="v">{displayValue(meta.governorate)}</span>
          </div>
        )}
        <div className="review-row">
          <span className="k">{t("locAddress")}</span>
          <span className="v">{displayValue(meta.address)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locContact")}</span>
          <span className="v">
            {displayValue(
              [meta.contactPhoneCountryCode, meta.contactPhone]
                .filter(Boolean)
                .join(" ")
            )}
          </span>
        </div>
        <div className="review-row">
          <span className="k">{t("locWebsite")}</span>
          <span className="v">{displayValue(meta.websiteName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locEmail")}</span>
          <span className="v">{displayValue(meta.entityEmail)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locMaps")}</span>
          <span className="v">{displayValue(meta.googleMapsLink)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("locSocial")}</span>
          <span className="v">
            {(meta.socialContactMethods ?? []).length === 0
              ? displayValue("")
              : (meta.socialContactMethods ?? [])
                  .map((m) => `${t(`contactType_${m.type}`)}: ${m.value}`)
                  .join(" · ")}
          </span>
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
        {form.reportCategory !== "individuals" && (
          <div className="review-row">
            <span className="k">{t("etnName")}</span>
            <span className="v">{displayValue(form.entityName)}</span>
          </div>
        )}
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
        {relevantDetailFields.map((fieldId) => {
          const value = getDetailFieldDisplay(meta, fieldId, locale);
          return (
            <div className="review-row" key={fieldId}>
              <span className="k">{t(DETAIL_FIELD_LABEL_KEYS[fieldId])}</span>
              <span className="v">{displayValue(value)}</span>
            </div>
          );
        })}
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

      {/* Supporting Media */}
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
              : form.sourceFiles.map((f) => `${f.label ? `${f.label} — ` : ""}${f.originalName}`).join(
                  locale === "ar" ? "، " : ", "
                )}
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
                      .map((m) => {
                        const prefix = m.countryCode ? `${m.countryCode} ` : "";
                        return `${t(`contactType_${m.type}`)}: ${prefix}${m.value}`;
                      })
                      .join(" · ")}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="review-affirm">
        <div className="form-field" style={{ maxWidth: 280 }}>
          <label htmlFor="review-captcha">
            {t("captchaLabel", { a: captcha.a, b: captcha.b })}
          </label>
          <input
            id="review-captcha"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="ds-input"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value);
              if (captchaError) setCaptchaError(false);
            }}
            placeholder={t("captchaPlaceholder")}
            aria-invalid={captchaError || undefined}
            aria-describedby={captchaError ? "review-captcha-error" : undefined}
          />
          {captchaError && (
            <p id="review-captcha-error" className="legal-error" role="alert">
              {t("captchaError")}
            </p>
          )}
        </div>

        <div className="wizard-nav flex-between mt-16">
          <button
            type="button"
            className="btn primary"
            disabled={submitting}
            aria-disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? t("submitting") : t("submitButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
