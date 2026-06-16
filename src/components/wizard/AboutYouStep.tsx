"use client";

/**
 * AboutYouStep — Step 7 of the report wizard (Phase 34).
 *
 * Anonymity-default-on guardrail. Uses a switch toggle for anonymous submission
 * and a reusable contact-method picker for the submitter's contact details.
 */

import { useTranslations } from "next-intl";
import type { SubmitInput, ContactMethodType } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { ContactMethodPicker } from "./ContactMethodPicker";

interface AboutYouStepProps {
  form: SubmitInput;
  dispatch: React.Dispatch<WizardAction>;
}

export function AboutYouStep({ form, dispatch }: AboutYouStepProps) {
  const t = useTranslations("submit");
  const methods = form.reportMetadata?.contactMethods ?? [];
  const disabled = form.isAnonymous;

  function setMethods(next: { type: ContactMethodType; value: string }[]) {
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

  return (
    <div className="flex-col">
      <div className="form-field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <label htmlFor="anon-toggle" style={{ margin: 0, fontWeight: 600 }}>
          {t("anonToggle")}
        </label>
        <button
          id="anon-toggle"
          type="button"
          role="switch"
          aria-checked={form.isAnonymous}
          onClick={() => onAnonToggle(!form.isAnonymous)}
          className={`switch-toggle ${form.isAnonymous ? "on" : "off"}`}
          style={{
            position: "relative",
            width: 48,
            height: 26,
            borderRadius: 13,
            border: "none",
            background: form.isAnonymous ? "var(--brand)" : "var(--border)",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: form.isAnonymous ? 25 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s ease",
            }}
          />
        </button>
      </div>

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
        </div>
        <ContactMethodPicker methods={methods} disabled={disabled} onChange={setMethods} />
      </div>

      <p className="ds-caption">{t("anonHelp")}</p>
    </div>
  );
}

export default AboutYouStep;
