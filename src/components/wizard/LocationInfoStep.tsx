"use client";

/**
 * LocationInfoStep — Step 2 of the v1.5 category-based wizard (معلومات).
 *
 * Captures coarse location (country required, state/city/nearest optional),
 * contact/website, social-media accounts, and an optional Google Maps link.
 * For Syria the city/state is a dropdown of governorates; for other countries
 * it is a free-text field.
 */

import { useState, useEffect, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { composeLocation } from "@/lib/wizard/step-logic";
import { screenPrivateTargeting } from "@/lib/screens";

interface LocationInfoStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

const COUNTRIES = [
  { value: "سوريا", label: "سوريا" },
  { value: "لبنان", label: "لبنان" },
  { value: "الأردن", label: "الأردن" },
  { value: "تركيا", label: "تركيا" },
  { value: "العراق", label: "العراق" },
  { value: "ألمانيا", label: "ألمانيا" },
  { value: "فرنسا", label: "فرنسا" },
  { value: "هولندا", label: "هولندا" },
  { value: "السويد", label: "السويد" },
  { value: "المملكة المتحدة", label: "المملكة المتحدة" },
  { value: "أخرى", label: "أخرى" },
];

const SYRIAN_GOVERNORATES = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "دير الزور",
  "الرقة",
  "الحسكة",
  "القنيطرة",
  "السويداء",
  "درعا",
  "إدلب",
];

const DEFAULT_COUNTRY = "سوريا";

export function LocationInfoStep({ form, dispatch }: LocationInfoStepProps) {
  const t = useTranslations("submit");

  const meta = form.reportMetadata ?? {};
  const seeded = (form.allegationLocation ?? "").split(" — ");
  const initialCountry = seeded[0] || meta.country || DEFAULT_COUNTRY;
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(seeded.length > 1 ? seeded.slice(1).join(" — ") : meta.city ?? "");
  const isSyria = country === DEFAULT_COUNTRY;

  // Seed the composed location when the step mounts if we defaulted to Syria.
  useEffect(() => {
    if (!form.allegationLocation && initialCountry === DEFAULT_COUNTRY) {
      dispatch({ type: "SET_METADATA", field: "country", value: DEFAULT_COUNTRY });
      dispatch({
        type: "SET_FIELD",
        field: "allegationLocation",
        value: DEFAULT_COUNTRY,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nearest, setNearest] = useState(meta.nearestLocation ?? "");

  function writeLocation(nextCountry: string, nextCity: string) {
    dispatch({
      type: "SET_FIELD",
      field: "allegationLocation",
      value: composeLocation(nextCountry, nextCity),
    });
  }

  function onCountryChange(value: string) {
    setCountry(value);
    setCity(""); // reset city when country changes
    dispatch({ type: "SET_METADATA", field: "country", value });
    dispatch({ type: "SET_METADATA", field: "city", value: "" });
    writeLocation(value, "");
  }

  function onCityChange(value: string) {
    setCity(value);
    dispatch({ type: "SET_METADATA", field: "city", value });
    writeLocation(country, value);
  }

  function onNearestChange(value: string) {
    setNearest(value);
    dispatch({ type: "SET_METADATA", field: "nearestLocation", value });
  }

  const [mapsLink, setMapsLink] = useState(meta.googleMapsLink ?? "");
  const [mapsLinkError, setMapsLinkError] = useState(false);

  function onMapsLinkChange(value: string) {
    setMapsLink(value);
    // Reject a personal social link inline; empty is fine (optional).
    setMapsLinkError(value.trim().length > 0 && screenPrivateTargeting(value));
  }

  return (
    <div className="flex-col">
      <div className="form-row">
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
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="loc-city">{t("locCity")}</label>
          {isSyria ? (
            <select
              id="loc-city"
              className="ds-select"
              value={city}
              aria-describedby="loc-city-hint"
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="">—</option>
              {SYRIAN_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="loc-city"
              type="text"
              className="ds-input"
              value={city}
              aria-describedby="loc-city-hint"
              onChange={(e) => onCityChange(e.target.value)}
            />
          )}
          <p id="loc-city-hint" className="ds-caption">{t("locCityHint")}</p>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="loc-nearest">{t("locNearest")}</label>
        <input
          id="loc-nearest"
          type="text"
          className="ds-input"
          value={nearest}
          aria-describedby="loc-nearest-hint"
          onChange={(e) => onNearestChange(e.target.value)}
        />
        <p id="loc-nearest-hint" className="ds-caption">{t("locNearestHint")}</p>
      </div>

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
          type="text"
          className="ds-input"
          value={meta.websiteName ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "websiteName", value: e.target.value })
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
          aria-describedby={mapsLinkError ? "loc-maps-error" : "loc-maps-hint"}
          onChange={(e) => {
            onMapsLinkChange(e.target.value);
            dispatch({ type: "SET_METADATA", field: "googleMapsLink", value: e.target.value });
          }}
          onBlur={(e) => onMapsLinkChange(e.target.value)}
        />
        <p id="loc-maps-hint" className="ds-caption">{t("locMapsHint")}</p>
        {mapsLinkError && (
          <p id="loc-maps-error" className="legal-error" role="alert">
            {t("locMapsError")}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="loc-social">{t("locSocial")}</label>
        <input
          id="loc-social"
          type="text"
          className="ds-input"
          value={meta.socialMediaAccounts ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "socialMediaAccounts", value: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default LocationInfoStep;
