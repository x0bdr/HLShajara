"use client";

/**
 * ReportDetailsStep — Step 4 of the v1.5 category-based wizard (نوع البلاغ).
 *
 * Shows only the free-text fields that are relevant to the subtype chosen in
 * Step 3 (e.g. car fields for taxi/private-car, person fields for individuals).
 */

import { useTranslations } from "next-intl";
import type { SubmitInput, ReportMetadata } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { getSubTypeConfig, type DetailFieldId } from "@/lib/wizard/category-config";

interface ReportDetailsStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

export function ReportDetailsStep({ form, dispatch }: ReportDetailsStepProps) {
  const t = useTranslations("submit");
  const meta = form.reportMetadata ?? {};
  const subTypeConfig = getSubTypeConfig(form.reportCategory, meta.orgType);
  const visibleFields = new Set<DetailFieldId>(subTypeConfig?.detailFields ?? []);

  function setDetail(field: keyof ReportMetadata, value: string) {
    dispatch({ type: "SET_METADATA", field, value });
  }

  function show(field: DetailFieldId) {
    return visibleFields.has(field);
  }

  return (
    <div className="flex-col">
      <p className="ds-caption">{t("detailsHint")}</p>

      {show("ownerName") && (
        <div className="form-field">
          <label htmlFor="details-owner">{t("detailsOwnerName")}</label>
          <input
            id="details-owner"
            type="text"
            className="ds-input"
            value={meta.ownerName ?? ""}
            onChange={(e) => setDetail("ownerName", e.target.value)}
          />
        </div>
      )}

      {show("reportedPersonName") && (
        <div className="form-field">
          <label htmlFor="details-reported-name">{t("detailsReportedName")}</label>
          <input
            id="details-reported-name"
            type="text"
            className="ds-input"
            value={meta.reportedPersonName ?? ""}
            onChange={(e) => setDetail("reportedPersonName", e.target.value)}
          />
        </div>
      )}

      <div className="form-row">
        {show("reportedPersonPhone") && (
          <div className="form-field">
            <label htmlFor="details-reported-phone">{t("detailsReportedPhone")}</label>
            <input
              id="details-reported-phone"
              type="text"
              className="ds-input"
              value={meta.reportedPersonPhone ?? ""}
              onChange={(e) => setDetail("reportedPersonPhone", e.target.value)}
            />
          </div>
        )}

        {show("reportedPersonPosition") && (
          <div className="form-field">
            <label htmlFor="details-reported-position">{t("detailsReportedPosition")}</label>
            <input
              id="details-reported-position"
              type="text"
              className="ds-input"
              value={meta.reportedPersonPosition ?? ""}
              onChange={(e) => setDetail("reportedPersonPosition", e.target.value)}
            />
          </div>
        )}
      </div>

      {show("reportedPersonSocialMedia") && (
        <div className="form-field">
          <label htmlFor="details-reported-social">{t("detailsReportedSocial")}</label>
          <input
            id="details-reported-social"
            type="text"
            className="ds-input"
            value={meta.reportedPersonSocialMedia ?? ""}
            onChange={(e) => setDetail("reportedPersonSocialMedia", e.target.value)}
          />
        </div>
      )}

      <div className="form-row">
        {show("carType") && (
          <div className="form-field">
            <label htmlFor="details-car-type">{t("detailsCarType")}</label>
            <input
              id="details-car-type"
              type="text"
              className="ds-input"
              value={meta.carType ?? ""}
              onChange={(e) => setDetail("carType", e.target.value)}
            />
          </div>
        )}

        {show("carPlate") && (
          <div className="form-field">
            <label htmlFor="details-car-plate">{t("detailsCarPlate")}</label>
            <input
              id="details-car-plate"
              type="text"
              className="ds-input"
              value={meta.carPlate ?? ""}
              onChange={(e) => setDetail("carPlate", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="form-row">
        {show("driverPhone") && (
          <div className="form-field">
            <label htmlFor="details-driver-phone">{t("detailsDriverPhone")}</label>
            <input
              id="details-driver-phone"
              type="text"
              className="ds-input"
              value={meta.driverPhone ?? ""}
              onChange={(e) => setDetail("driverPhone", e.target.value)}
            />
          </div>
        )}

        {show("driverName") && (
          <div className="form-field">
            <label htmlFor="details-driver-name">{t("detailsDriverName")}</label>
            <input
              id="details-driver-name"
              type="text"
              className="ds-input"
              value={meta.driverName ?? ""}
              onChange={(e) => setDetail("driverName", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="form-row">
        {show("taxiNumber") && (
          <div className="form-field">
            <label htmlFor="details-taxi">{t("detailsTaxiNumber")}</label>
            <input
              id="details-taxi"
              type="text"
              className="ds-input"
              value={meta.taxiNumber ?? ""}
              onChange={(e) => setDetail("taxiNumber", e.target.value)}
            />
          </div>
        )}

        {show("appName") && (
          <div className="form-field">
            <label htmlFor="details-app">{t("detailsAppName")}</label>
            <input
              id="details-app"
              type="text"
              className="ds-input"
              value={meta.appName ?? ""}
              onChange={(e) => setDetail("appName", e.target.value)}
            />
          </div>
        )}
      </div>

      {show("propertyType") && (
        <div className="form-field">
          <label htmlFor="details-property">{t("detailsPropertyType")}</label>
          <input
            id="details-property"
            type="text"
            className="ds-input"
            value={meta.propertyType ?? ""}
            onChange={(e) => setDetail("propertyType", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default ReportDetailsStep;
