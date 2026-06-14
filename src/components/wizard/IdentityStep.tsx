"use client";

/**
 * IdentityStep — Step 2 of the report wizard (Phase 30, STEP-02).
 *
 * The first text-input step. Renders exactly five controlled fields — name
 * (required), documented role/title (required), country (required select),
 * governorate/city (optional, COARSE), and an optional public identifier — bound
 * to the reducer via SET_FIELD, mirroring the legacy `SubmitClient.tsx` field
 * markup (`.form-field`/`.ds-input`).
 *
 * Guardrails:
 *  - S5 coarse-location block: a fine-grained address typed into the city field
 *    fails `isCoarseLocationClean`; an inline `.legal-error` shows and the dirty
 *    token is NEVER composed into `allegationLocation` (T-30-04).
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
import { isCoarseLocationClean, screenPrivateTargeting } from "@/lib/screens";

interface IdentityStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

/**
 * A coarse country list. The select offers a meaningful empty placeholder first
 * (so `requiresIdentity` — country present in the composed location — is
 * enforceable) followed by the relevant countries. Kept short and editable; the
 * value written is the country NAME (it composes into `allegationLocation`).
 */
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

  // Country + city are held as local UI state; the COMPOSED string is the single
  // value written to the form. Seed from any existing composed location.
  const seeded = (form.allegationLocation ?? "").split(" — ");
  const [country, setCountry] = useState(seeded[0] ?? "");
  const [city, setCity] = useState(seeded.length > 1 ? seeded.slice(1).join(" — ") : "");
  const [cityError, setCityError] = useState(false);
  // The optional public identifier has no first-class contract field yet (a
  // dedicated column is a later-phase follow-up). It is held in local UI state
  // only — never folded into entityName/entityRole (which would skew the
  // MISMATCH/describe screens) and never written to allegationLocation.
  //
  // v1.4 H3 (S1): the field is for an OFFICIAL website/registry URL only. It is
  // screened on blur via the shared `screenPrivateTargeting` (the same regex set
  // the server uses) so a personal social profile link is rejected inline with a
  // `.legal-error` instead of slipping in as an unscreened personal identifier.
  const [publicRef, setPublicRef] = useState("");
  const [publicRefError, setPublicRefError] = useState(false);

  function onPublicRefBlur(value: string) {
    // Empty is fine (optional). A personal social link / private-data token trips
    // PRIVATE_DATA_PATTERNS — flag it inline. The value never reaches the payload.
    setPublicRefError(value.trim().length > 0 && screenPrivateTargeting(value));
  }

  function writeLocation(nextCountry: string, nextCity: string) {
    // Only a COARSE-CLEAN city is ever composed in (S5); a dirty token is held in
    // the input but never written to the form location.
    const cleanCity = isCoarseLocationClean(nextCity) ? nextCity : "";
    dispatch({
      type: "SET_FIELD",
      field: "allegationLocation",
      value: composeLocation(nextCountry, cleanCity),
    });
  }

  function onCountryChange(value: string) {
    setCountry(value);
    writeLocation(value, city);
  }

  function onCityChange(value: string) {
    setCity(value);
    if (isCoarseLocationClean(value)) {
      setCityError(false);
      writeLocation(country, value);
    } else {
      // Fine-grained location token: flag inline and DO NOT compose it in.
      setCityError(true);
      writeLocation(country, "");
    }
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

      {/* role="status" is an implicit polite live region; the explicit live
          attribute is intentionally omitted so the wizard tree keeps exactly ONE
          step-announcer region (the WizardPanel) — no double-announce. */}
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
          aria-invalid={cityError || undefined}
          aria-describedby={cityError ? "id-area-error" : undefined}
          onChange={(e) => onCityChange(e.target.value)}
        />
        <p className="ds-caption">{t("idAreaHint")}</p>
        {cityError && (
          <p id="id-area-error" className="legal-error" role="alert">
            {t("idLocationError")}
          </p>
        )}
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
            // Clear a prior error as the user edits; re-screen on blur.
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
