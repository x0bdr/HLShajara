"use client";

/**
 * IdentityStep — legacy Step 2 of the report wizard (Phase 30, STEP-02).
 *
 * The first text-input step. Renders exactly five controlled fields — name
 * (required), documented role/title (required), country (required select),
 * governorate/city (optional), and an optional public identifier — bound to the
 * reducer via SET_FIELD.
 *
 * Guardrails:
 *  - Non-blocking MISMATCH notice: `screenIdentityStep` surfaces a `.filter-notice`
 *    when role/type look mismatched — a WARNING only; Next gating lives in the
 *    registry `requiresIdentity` predicate, not here.
 *  - S1-S4: only the five coarse fields below exist — the design-review-banned
 *    targeting categories have NO field anywhere here (grep-checkable absence).
 *
 * Renders the step BODY only (no Next button — WizardNav owns the gated Next).
 * No `dangerouslySetInnerHTML`; logical CSS only (RTL-safe).
 */

import { useState, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { composeLocation, screenIdentityStep } from "@/lib/wizard/step-logic";
import { screenPrivateTargeting } from "@/lib/screens";

interface IdentityStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

const COUNTRIES = [
  "Syria",
  "Lebanon",
  "Jordan",
  "Turkey",
  "Iraq",
  "Germany",
  "France",
  "Netherlands",
  "Sweden",
  "United Kingdom",
  "Other",
];

export function IdentityStep({ form, dispatch }: IdentityStepProps) {
  const t = useTranslations("submit");

  const seeded = (form.allegationLocation ?? "").split(" — ");
  const [country, setCountry] = useState(seeded[0] ?? "");
  const [city, setCity] = useState(seeded.length > 1 ? seeded.slice(1).join(" — ") : "");

  const [publicRef, setPublicRef] = useState("");
  const [publicRefError, setPublicRefError] = useState(false);

  function onPublicRefBlur(value: string) {
    setPublicRefError(value.trim().length > 0 && screenPrivateTargeting(value));
  }

  function writeLocation(nextCountry: string, nextCity: string) {
    dispatch({
      type: "SET_FIELD",
      field: "allegationLocation",
      value: composeLocation(nextCountry, nextCity),
    });
  }

  function onCountryChange(value: string) {
    setCountry(value);
    writeLocation(value, city);
  }

  function onCityChange(value: string) {
    setCity(value);
    writeLocation(country, value);
  }

  const mismatch = screenIdentityStep(form);

  return (
    <div className="flex-col">
      <div className="form-field">
        <label htmlFor="id-name">{t("idName")}</label>
        <input
          id="id-name"
          type="text"
          className="ds-input"
          required
          value={form.entityName}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "entityName", value: e.target.value })
          }
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="id-role">{t("idRole")}</label>
          <input
            id="id-role"
            type="text"
            className="ds-input"
            required
            value={form.entityRole}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "entityRole", value: e.target.value })
            }
          />
          <p className="ds-caption">{t("idRoleHint")}</p>
        </div>

        <div className="form-field">
          <label htmlFor="id-country">{t("idCountry")}</label>
          <select
            id="id-country"
            className="ds-select"
            required
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            <option value="">—</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!mismatch.ok && (
        <div className="filter-notice" role="status">
          {t("idMismatchNotice")}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="id-area">{t("idArea")}</label>
        <input
          id="id-area"
          type="text"
          className="ds-input"
          value={city}
          aria-describedby="id-area-hint"
          onChange={(e) => onCityChange(e.target.value)}
        />
        <p id="id-area-hint" className="ds-caption">{t("idAreaHint")}</p>
      </div>

      <div className="form-field">
        <label htmlFor="id-public-ref">{t("idPublicRef")}</label>
        <input
          id="id-public-ref"
          type="text"
          className="ds-input"
          value={publicRef}
          aria-invalid={publicRefError || undefined}
          aria-describedby={publicRefError ? "id-public-ref-error" : "id-public-ref-hint"}
          onChange={(e) => {
            setPublicRef(e.target.value);
            if (publicRefError) setPublicRefError(false);
          }}
          onBlur={(e) => onPublicRefBlur(e.target.value)}
        />
        <p id="id-public-ref-hint" className="ds-caption">{t("idPublicRefHint")}</p>
        {publicRefError && (
          <p id="id-public-ref-error" className="legal-error" role="alert">
            {t("idPublicRefError")}
          </p>
        )}
      </div>
    </div>
  );
}

export default IdentityStep;
