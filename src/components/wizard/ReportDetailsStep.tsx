"use client";

/**
 * ReportDetailsStep — Step 4 of the v1.5 category-based wizard (تفاصيل البلاغ).
 *
 * Shows category-specific detail flags (multi-select cards) and adaptive free-text
 * fields. Owner, investor and labour fields are editable arrays; support_data is a
 * short text box (max 256 chars) for "other" people/roles.
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

  function setDetail(field: keyof ReportMetadata, value: unknown) {
    dispatch({ type: "SET_METADATA", field, value: value as ReportMetadata[keyof ReportMetadata] });
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
        const isArray =
          mapping.field === "ownerNames" ||
          mapping.field === "investorNames" ||
          mapping.field === "labourEntries";
        dispatch({ type: "SET_METADATA", field: mapping.field, value: isArray ? [] : "" });
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

  // ---- array helpers ----
  const ownerNames = meta.ownerNames ?? [];
  function setOwnerNames(next: string[]) {
    setDetail("ownerNames", next);
  }

  const investorNames = meta.investorNames ?? [];
  function setInvestorNames(next: string[]) {
    setDetail("investorNames", next);
  }

  const labourEntries = meta.labourEntries ?? [];
  function setLabourEntries(next: { name: string; role: string }[]) {
    setDetail("labourEntries", next);
  }

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
        <ArrayOrTextField
          key={flag}
          field={mapping.field as DetailFieldId}
          labelKey={mapping.labelKey}
          meta={meta}
          t={t}
          setDetail={setDetail}
          ownerNames={ownerNames}
          setOwnerNames={setOwnerNames}
          investorNames={investorNames}
          setInvestorNames={setInvestorNames}
          labourEntries={labourEntries}
          setLabourEntries={setLabourEntries}
        />
      ))}

      {show("ownerNames") && (
        <StringArrayField
          label={t("detailsOwnerName")}
          values={ownerNames}
          addLabel={t("addOwner")}
          onChange={setOwnerNames}
        />
      )}

      {show("investorNames") && (
        <StringArrayField
          label={t("detailsInvestorName")}
          values={investorNames}
          addLabel={t("addInvestor")}
          onChange={setInvestorNames}
        />
      )}

      {show("labourEntries") && (
        <LabourArrayField
          label={t("detailsLabourInfo")}
          entries={labourEntries}
          addLabel={t("addLabour")}
          onChange={setLabourEntries}
          t={t}
        />
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

      {show("supportDataInfo") && (
        <div className="form-field">
          <label htmlFor="details-support">{t("detailsSupportDataInfo")}</label>
          <p className="ds-caption">{t("detailsOtherPersonHint")}</p>
          <input
            id="details-support"
            type="text"
            className="ds-input"
            maxLength={256}
            value={meta.supportDataInfo ?? ""}
            onChange={(e) => setDetail("supportDataInfo", e.target.value)}
          />
        </div>
      )}

      {show("clubName") && (
        <div className="form-field">
          <label htmlFor="details-club">{t("detailsClubName")}</label>
          <input
            id="details-club"
            type="text"
            className="ds-input"
            value={meta.clubName ?? ""}
            onChange={(e) => setDetail("clubName", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function StringArrayField({
  label,
  values,
  addLabel,
  onChange,
}: {
  label: string;
  values: string[];
  addLabel: string;
  onChange: (next: string[]) => void;
}) {
  function add() {
    onChange([...values, ""]);
  }

  function update(index: number, value: string) {
    onChange(values.map((v, i) => (i === index ? value : v)));
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="flex-col" style={{ gap: 8 }}>
        {values.map((value, index) => (
          <div key={index} className="form-row" style={{ alignItems: "flex-end", gap: 8 }}>
            <input
              type="text"
              className="ds-input"
              value={value}
              onChange={(e) => update(index, e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn danger btn-sm" onClick={() => remove(index)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn ghost btn-sm" onClick={add} style={{ alignSelf: "flex-start" }}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function LabourArrayField({
  label,
  entries,
  addLabel,
  onChange,
  t,
}: {
  label: string;
  entries: { name: string; role: string }[];
  addLabel: string;
  onChange: (next: { name: string; role: string }[]) => void;
  t: (k: string) => string;
}) {
  function add() {
    onChange([...entries, { name: "", role: "" }]);
  }

  function update(index: number, patch: Partial<{ name: string; role: string }>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="flex-col" style={{ gap: 8 }}>
        {entries.map((entry, index) => (
          <div key={index} className="form-row" style={{ alignItems: "flex-end", gap: 8 }}>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <input
                type="text"
                className="ds-input"
                placeholder={t("labourName")}
                value={entry.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <input
                type="text"
                className="ds-input"
                placeholder={t("labourRole")}
                value={entry.role}
                onChange={(e) => update(index, { role: e.target.value })}
              />
            </div>
            <button type="button" className="btn danger btn-sm" onClick={() => remove(index)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn ghost btn-sm" onClick={add} style={{ alignSelf: "flex-start" }}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function ArrayOrTextField({
  field,
  labelKey,
  meta,
  t,
  setDetail,
  ownerNames,
  setOwnerNames,
  investorNames,
  setInvestorNames,
  labourEntries,
  setLabourEntries,
}: {
  field: DetailFieldId;
  labelKey: string;
  meta: ReportMetadata;
  t: (k: string) => string;
  setDetail: (field: keyof ReportMetadata, value: unknown) => void;
  ownerNames: string[];
  setOwnerNames: (next: string[]) => void;
  investorNames: string[];
  setInvestorNames: (next: string[]) => void;
  labourEntries: { name: string; role: string }[];
  setLabourEntries: (next: { name: string; role: string }[]) => void;
}) {
  if (field === "ownerNames") {
    return (
      <StringArrayField
        label={t(labelKey)}
        values={ownerNames}
        addLabel={t("addOwner")}
        onChange={setOwnerNames}
      />
    );
  }
  if (field === "investorNames") {
    return (
      <StringArrayField
        label={t(labelKey)}
        values={investorNames}
        addLabel={t("addInvestor")}
        onChange={setInvestorNames}
      />
    );
  }
  if (field === "labourEntries") {
    return (
      <LabourArrayField
        label={t(labelKey)}
        entries={labourEntries}
        addLabel={t("addLabour")}
        onChange={setLabourEntries}
        t={t}
      />
    );
  }
  if (field === "supportDataInfo") {
    return (
      <div className="form-field">
        <label htmlFor={`flag-field-${field}`}>{t(labelKey)}</label>
        <p className="ds-caption">{t("detailsOtherPersonHint")}</p>
        <input
          id={`flag-field-${field}`}
          type="text"
          className="ds-input"
          maxLength={256}
          value={(meta[field] as string | undefined) ?? ""}
          onChange={(e) => setDetail(field, e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="form-field">
      <label htmlFor={`flag-field-${field}`}>{t(labelKey)}</label>
      <input
        id={`flag-field-${field}`}
        type="text"
        className="ds-input"
        value={(meta[field] as string | undefined) ?? ""}
        onChange={(e) => setDetail(field, e.target.value)}
      />
    </div>
  );
}

export default ReportDetailsStep;
