"use client";

/**
 * AboutYouStep — Step 7 of the report wizard (Phase 30, STEP-05).
 *
 * Anonymity-default-on guardrail. Replaces the single optional email field with
 * a dynamic list of contact methods (X, Facebook, Instagram, Telegram, WhatsApp,
 * Email). Each method is rendered with its brand icon, a type dropdown, and a
 * free-text value input. Users may add or remove methods. Toggling anonymous ON
 * clears all contact data and disables the inputs.
 */

import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput, ContactMethodType } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";

interface AboutYouStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

const CONTACT_METHODS: { type: ContactMethodType; labelKey: string }[] = [
  { type: "x", labelKey: "contactType_x" },
  { type: "facebook", labelKey: "contactType_facebook" },
  { type: "instagram", labelKey: "contactType_instagram" },
  { type: "telegram", labelKey: "contactType_telegram" },
  { type: "whatsapp", labelKey: "contactType_whatsapp" },
  { type: "email", labelKey: "contactType_email" },
];

function ContactMethodIcon({
  type,
  size = 18,
}: {
  type: ContactMethodType;
  size?: number;
}) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  } as const;

  switch (type) {
    case "x":
      return (
        <svg {...svgProps}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...svgProps}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...svgProps}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...svgProps}>
          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...svgProps}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      );
    case "email":
      return (
        <svg {...svgProps}>
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AboutYouStep({ form, dispatch }: AboutYouStepProps) {
  const t = useTranslations("submit");
  const methods = form.reportMetadata?.contactMethods ?? [];
  const disabled = form.isAnonymous;

  function setMethods(next: typeof methods) {
    dispatch({ type: "SET_METADATA", field: "contactMethods", value: next });
  }

  function onAnonToggle(checked: boolean) {
    if (checked) {
      dispatch({ type: "SET_FIELD", field: "isAnonymous", value: true });
      dispatch({ type: "SET_FIELD", field: "submitterName", value: "" });
      dispatch({ type: "SET_FIELD", field: "submitterEmail", value: "" });
      setMethods([]);
    } else {
      dispatch({ type: "SET_FIELD", field: "isAnonymous", value: false });
    }
  }

  function addMethod() {
    setMethods([...methods, { type: "email", value: "" }]);
  }

  function removeMethod(index: number) {
    setMethods(methods.filter((_, i) => i !== index));
  }

  function updateMethod(index: number, patch: Partial<(typeof methods)[number]>) {
    setMethods(
      methods.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  return (
    <div className="flex-col">
      <div className="t">{t("anonTitle")}</div>

      <label className="form-field" htmlFor="anon-toggle">
        <span className="flex-between">
          <input
            id="anon-toggle"
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => onAnonToggle(e.target.checked)}
          />
          <span className="ds-body-sm">{t("anonToggle")}</span>
        </span>
      </label>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="about-name">{t("fullName")}</label>
          <input
            id="about-name"
            type="text"
            className="ds-input"
            disabled={disabled}
            value={form.submitterName ?? ""}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "submitterName", value: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-field" style={{ marginTop: 8 }}>
        <div className="flex-between" style={{ marginBottom: 8 }}>
          <label style={{ margin: 0 }}>{t("contactMethodsTitle")}</label>
          {!disabled && (
            <button type="button" className="btn ghost btn-sm" onClick={addMethod}>
              {t("addContactMethod")}
            </button>
          )}
        </div>

        {methods.length === 0 && !disabled ? (
          <p className="ds-caption">{t("contactMethodsEmpty")}</p>
        ) : null}

        <div className="flex-col" style={{ gap: 10 }}>
          {methods.map((method, index) => (
            <div key={index} className="form-row" style={{ alignItems: "flex-end" }}>
              <div className="form-field" style={{ flex: "0 0 auto", minWidth: 48 }}>
                <div
                  className="ds-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 12px",
                    opacity: disabled ? 0.5 : 1,
                  }}
                  aria-hidden="true"
                >
                  <ContactMethodIcon type={method.type} size={18} />
                </div>
              </div>

                <div className="form-field" style={{ flex: 1, minWidth: 130 }}>
                  <select
                    id={`contact-type-${index}`}
                    className="ds-select"
                    disabled={disabled}
                    value={method.type}
                    aria-label={t("contactMethod")}
                    onChange={(e) =>
                      updateMethod(index, { type: e.target.value as ContactMethodType })
                    }
                  >
                    {CONTACT_METHODS.map((m) => (
                      <option key={m.type} value={m.type}>
                        {t(m.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ flex: 2, minWidth: 180 }}>
                  <input
                    id={`contact-value-${index}`}
                    type={method.type === "email" ? "email" : "text"}
                    className="ds-input"
                    disabled={disabled}
                    value={method.value}
                    aria-label={t("contactMethodValue")}
                    placeholder={
                      method.type === "email"
                        ? "name@example.com"
                        : method.type === "whatsapp"
                          ? t("contactMethodValue")
                          : "@username"
                    }
                    onChange={(e) => updateMethod(index, { value: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn danger btn-sm"
                  disabled={disabled}
                  onClick={() => removeMethod(index)}
                  aria-label={t("removeContactMethod")}
                >
                  {t("removeContactMethod")}
                </button>
              </div>
          ))}
        </div>
      </div>

      <p className="ds-caption">{t("anonHelp")}</p>
    </div>
  );
}

export default AboutYouStep;
