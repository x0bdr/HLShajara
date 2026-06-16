"use client";

/**
 * LocationInfoStep — Step 2 of the v1.5 category-based wizard (معلومات الجهة).
 *
 * Captures country, address, contact/website/email, social-media accounts, and
 * an optional Google Maps link. City/state fields were removed per Phase 34.
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput, ContactMethodType } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { COUNTRIES, getCountryLabel } from "@/lib/wizard/category-config";
import { screenPrivateTargeting } from "@/lib/screens";
import { ContactMethodPicker } from "./ContactMethodPicker";

interface LocationInfoStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

const DEFAULT_COUNTRY = "سوريا";

export function LocationInfoStep({ form, dispatch }: LocationInfoStepProps) {
  const t = useTranslations("submit");

  const meta = form.reportMetadata ?? {};
  const [country, setCountry] = useState(meta.country || DEFAULT_COUNTRY);

  useEffect(() => {
    if (!form.allegationLocation) {
      dispatch({ type: "SET_METADATA", field: "country", value: DEFAULT_COUNTRY });
      dispatch({ type: "SET_FIELD", field: "allegationLocation", value: DEFAULT_COUNTRY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onCountryChange(value: string) {
    setCountry(value);
    dispatch({ type: "SET_METADATA", field: "country", value });
    dispatch({ type: "SET_FIELD", field: "allegationLocation", value: value || DEFAULT_COUNTRY });
  }

  const [address, setAddress] = useState(meta.address ?? "");
  function onAddressChange(value: string) {
    setAddress(value);
    dispatch({ type: "SET_METADATA", field: "address", value });
  }

  const [mapsLink, setMapsLink] = useState(meta.googleMapsLink ?? "");
  const [mapsLinkError, setMapsLinkError] = useState(false);

  function onMapsLinkChange(value: string) {
    setMapsLink(value);
    setMapsLinkError(value.trim().length > 0 && screenPrivateTargeting(value));
  }

  const socialMethods = meta.socialContactMethods ?? [];
  function setSocialMethods(next: { type: ContactMethodType; value: string }[]) {
    dispatch({ type: "SET_METADATA", field: "socialContactMethods", value: next });
  }

  return (
    <div className="flex-col">
      <div className="form-field">
        <label htmlFor="loc-country">{t("locCountry")}</label>
        <select
          id="loc-country"
          className="ds-select"
          required
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        >
          <option value="">—</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {getCountryLabel(t, c.value)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="loc-address">{t("locAddress")}</label>
        <input
          id="loc-address"
          type="text"
          className="ds-input"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>

      <p className="ds-caption" style={{ marginTop: 4, marginBottom: 4 }}>
        {t("locAtLeastOne")}
      </p>

      <div className="form-field">
        <label htmlFor="loc-contact">{t("locContact")}</label>
        <input
          id="loc-contact"
          type="text"
          className="ds-input"
          value={meta.contactPhone ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "contactPhone", value: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label htmlFor="loc-website">{t("locWebsite")}</label>
        <input
          id="loc-website"
          type="url"
          className="ds-input"
          value={meta.websiteName ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "websiteName", value: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label htmlFor="loc-email">{t("locEmail")}</label>
        <input
          id="loc-email"
          type="email"
          className="ds-input"
          value={meta.entityEmail ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "entityEmail", value: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label htmlFor="loc-maps">{t("locMaps")}</label>
        <input
          id="loc-maps"
          type="url"
          className="ds-input"
          value={mapsLink}
          aria-invalid={mapsLinkError || undefined}
          aria-describedby={mapsLinkError ? "loc-maps-error" : undefined}
          onChange={(e) => {
            onMapsLinkChange(e.target.value);
            dispatch({ type: "SET_METADATA", field: "googleMapsLink", value: e.target.value });
          }}
          onBlur={(e) => onMapsLinkChange(e.target.value)}
        />
        {mapsLinkError && (
          <p id="loc-maps-error" className="legal-error" role="alert">
            {t("locMapsError")}
          </p>
        )}
      </div>

      <div className="form-field">
        <label>{t("locSocial")}</label>
        <ContactMethodPicker
          methods={socialMethods}
          onChange={setSocialMethods}
          allowTypes={["x", "facebook", "instagram", "telegram", "whatsapp", "website"]}
        />
      </div>
    </div>
  );
}

export default LocationInfoStep;
