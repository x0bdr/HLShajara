"use client";

/**
 * ReportDetailsStep — Step 4 of the v1.5 category-based wizard (تفاصيل البلاغ).
 *
 * Shows:
 *  1. Category-specific detail flags (multi-select cards) so the user can mark
 *     which parties are involved: owner, partner, investor, reception/front desk,
 *     labour/employees, supportive data, etc.
 *  2. Free-text fields that adapt to the selected flags.
 *  3. Subtype-driven fields (e.g. car/plate fields for taxis) when relevant.
 */

import { useTranslations } from "next-intl";
import type { SubmitInput, ReportMetadata } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { getCategoryConfig, getSubTypeConfig, getFlagLabel, type DetailFieldId, DETAIL_FLAG_FIELDS } from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";
import { CardSelect } from "./CardSelect";

interface ReportDetailsStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

export function ReportDetailsStep({ form, dispatch }: ReportDetailsStepProps) {
  const t = useTranslations("submit");
  const meta = form.reportMetadata ?? {};
  const categoryConfig = getCategoryConfig(form.reportCategory);
  const subTypeConfig = getSubTypeConfig(form.reportCategory, meta.orgType);
  const visibleFields = new Set<DetailFieldId>(subTypeConfig?.detailFields ?? []);
  const selectedFlags = new Set(meta.detailFlags ?? []);

  function setDetail(field: keyof ReportMetadata, value: string) {
    dispatch({ type: "SET_METADATA", field, value });
  }

  function show(field: DetailFieldId) {
    return visibleFields.has(field);
  }

  function toggleFlag(value: string, selected: boolean) {
    const current = meta.detailFlags ?? [];
    const next = selected
      ? [...new Set([...current, value])]
      : current.filter((v) => v !== value);
    dispatch({ type: "SET_METADATA", field: "detailFlags", value: next });

    if (!selected) {
      const mapping = DETAIL_FLAG_FIELDS[value];
      if (mapping) {
        dispatch({ type: "SET_METADATA", field: mapping.field, value: "" });
      }
    }
  }

  const flagOptions = (categoryConfig?.detailFlags ?? []).map((flag) => {
    const Icon = getIconByName(flag.iconName);
    return {
      value: flag.value,
      title: getFlagLabel(t, flag.value),
      icon: Icon ? <Icon size={20} /> : null,
    };
  });

  const adaptiveFields = Array.from(selectedFlags)
    .map((flag) => ({ flag, mapping: DETAIL_FLAG_FIELDS[flag] }))
    .filter(
      (item): item is { flag: string; mapping: { field: keyof ReportMetadata; labelKey: string } } =>
        !!item.mapping && !visibleFields.has(item.mapping.field as DetailFieldId),
    );

  return (
    <div className="flex-col">
      <p className="ds-caption">{t("detailsHint")}</p>

      {flagOptions.length > 0 && (
        <div className="form-field">
          <label>{t("detailsFlags")}</label>
          <CardSelect
            ariaLabel={t("detailsFlags")}
            mode="multi"
            selected={meta.detailFlags ?? []}
            options={flagOptions}
            onChange={toggleFlag}
          />
        </div>
      )}

      {adaptiveFields.map(({ flag, mapping }) => (
        <div className="form-field" key={flag}>
          <label htmlFor={`flag-field-${flag}`}>{t(mapping.labelKey)}</label>
          <input
            id={`flag-field-${flag}`}
            type="text"
            className="ds-input"
            value={(meta[mapping.field] as string | undefined) ?? ""}
            onChange={(e) => setDetail(mapping.field, e.target.value)}
          />
        </div>
      ))}

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
