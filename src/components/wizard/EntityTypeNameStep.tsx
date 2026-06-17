"use client";

/**
 * EntityTypeNameStep — Step 3 of the v1.5 category-based wizard (نوع واسم).
 *
 * Shows category-specific org/person types as icon cards and asks for the
 * reported name. The selected type is written to `reportMetadata.orgType`; the
 * name is written to `entityName`; and a synthesized role string is written to
 * `entityRole` so the legacy contract stays populated.
 */

import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { getCategoryConfig, getSubTypeLabel, getSubTypeDescription, getSubTypeLabelAr } from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";
import { CardSelect } from "./CardSelect";

interface EntityTypeNameStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

export function EntityTypeNameStep({ form, dispatch }: EntityTypeNameStepProps) {
  const t = useTranslations("submit");
  const meta = form.reportMetadata ?? {};
  const config = getCategoryConfig(form.reportCategory);
  const options = config?.subTypes ?? [];

  const isOther = meta.orgType === "other";

  function clearDetailMetadata() {
    dispatch({ type: "SET_METADATA", field: "detailFlags", value: [] });
    dispatch({ type: "SET_METADATA", field: "ownerName", value: "" });
    dispatch({ type: "SET_METADATA", field: "ownerNames", value: [] });
    dispatch({ type: "SET_METADATA", field: "investorNames", value: [] });
    dispatch({ type: "SET_METADATA", field: "labourEntries", value: [] });
    dispatch({ type: "SET_METADATA", field: "academicStaff", value: [] });
    dispatch({ type: "SET_METADATA", field: "doctors", value: [] });
    dispatch({ type: "SET_METADATA", field: "nurses", value: [] });
    dispatch({ type: "SET_METADATA", field: "members", value: [] });
    dispatch({ type: "SET_METADATA", field: "reportedPersonName", value: "" });
    dispatch({ type: "SET_METADATA", field: "professorName", value: "" });
    dispatch({ type: "SET_METADATA", field: "universityDoctorName", value: "" });
    dispatch({ type: "SET_METADATA", field: "reportedPersonPhone", value: "" });
    dispatch({ type: "SET_METADATA", field: "reportedPersonPosition", value: "" });
    dispatch({ type: "SET_METADATA", field: "reportedPersonSocialMedia", value: "" });
    dispatch({ type: "SET_METADATA", field: "carType", value: "" });
    dispatch({ type: "SET_METADATA", field: "carPlate", value: "" });
    dispatch({ type: "SET_METADATA", field: "driverPhone", value: "" });
    dispatch({ type: "SET_METADATA", field: "driverName", value: "" });
    dispatch({ type: "SET_METADATA", field: "taxiNumber", value: "" });
    dispatch({ type: "SET_METADATA", field: "appName", value: "" });
    dispatch({ type: "SET_METADATA", field: "propertyType", value: "" });
    dispatch({ type: "SET_METADATA", field: "partnerName", value: "" });
    dispatch({ type: "SET_METADATA", field: "investorName", value: "" });
    dispatch({ type: "SET_METADATA", field: "receptionInfo", value: "" });
    dispatch({ type: "SET_METADATA", field: "labourInfo", value: "" });
    dispatch({ type: "SET_METADATA", field: "supportDataInfo", value: "" });
    dispatch({ type: "SET_METADATA", field: "clubName", value: "" });
  }

  function setOrgType(value: string) {
    // Properties under tourism are redirected to the real-estate category.
    if (form.reportCategory === "tourism" && value === "properties") {
      dispatch({ type: "SET_FIELD", field: "reportCategory", value: "real_estate" });
      dispatch({ type: "SET_FIELD", field: "entityType", value: "organization" });
      dispatch({ type: "SET_METADATA", field: "orgType", value: "" });
      dispatch({ type: "SET_METADATA", field: "orgSubTypeOther", value: "" });
      dispatch({ type: "SET_FIELD", field: "entityRole", value: "" });
      clearDetailMetadata();
      return;
    }

    dispatch({ type: "SET_METADATA", field: "orgType", value });
    if (value !== "other") {
      dispatch({ type: "SET_METADATA", field: "orgSubTypeOther", value: "" });
    }
    clearDetailMetadata();
    const labelAr = getSubTypeLabelAr(form.reportCategory, value);
    dispatch({ type: "SET_FIELD", field: "entityRole", value: labelAr });
    if (form.reportCategory === "individuals") {
      dispatch({ type: "SET_FIELD", field: "entityName", value: "" });
    }
  }

  const cardOptions = options.map((opt) => {
    const Icon = getIconByName(opt.iconName);
    return {
      value: opt.value,
      title: getSubTypeLabel(t, form.reportCategory, opt.value),
      description: getSubTypeDescription(t, form.reportCategory, opt.value),
      icon: Icon ? <Icon size={22} /> : null,
    };
  });

  function entityNameLabel(): string {
    const cat = form.reportCategory;
    const sub = meta.orgType;
    if (cat === "commercial" && sub === "brand") return t("etnNameBrand");
    if (cat === "individuals") return t("etnNameIndividual");
    if (cat === "real_estate") return t("etnNameProperty");
    if (cat === "tourism" && (sub === "taxi" || sub === "private_car")) return t("etnNameVehicleOffice");
    return t("etnNameOrganization");
  }

  return (
    <div className="flex-col">
      <CardSelect
        ariaLabel={t("etnType")}
        mode="single"
        selected={meta.orgType ?? ""}
        options={cardOptions}
        onChange={(value, selected) => {
          if (selected) setOrgType(value);
        }}
      />

      {isOther && (
        <div className="form-field">
          <label htmlFor="etn-other">{t("etnOtherSpecify")}</label>
          <input
            id="etn-other"
            type="text"
            className="ds-input"
            required
            value={meta.orgSubTypeOther ?? ""}
            onChange={(e) =>
              dispatch({ type: "SET_METADATA", field: "orgSubTypeOther", value: e.target.value })
            }
          />
        </div>
      )}

      {form.reportCategory !== "individuals" && (
        <div className="form-field">
          <label htmlFor="etn-name">{entityNameLabel()}</label>
          <input
            id="etn-name"
            type="text"
            className="ds-input"
            required
            value={form.entityName}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "entityName", value: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}

export default EntityTypeNameStep;
