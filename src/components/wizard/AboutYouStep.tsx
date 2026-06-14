"use client";

/**
 * AboutYouStep — Step 8 of the report wizard (Phase 30, STEP-05).
 *
 * The S7 anonymity-default-on guardrail in the UI. Ports the legacy email/name
 * row + anonymity checkbox from `SubmitClient.tsx` onto the reducer contract,
 * replacing the inline-style checkbox label with token/class markup.
 *
 *  - The anonymity checkbox reflects `form.isAnonymous` (seeded `true` in Phase 28,
 *    so it is checked on first render).
 *  - Toggling it ON dispatches `isAnonymous=true` AND clears `submitterName=""`
 *    AND `submitterEmail=""` (zeroed, NOT stashed/restored — safety, T-30-11);
 *    the name + email inputs are disabled while anonymous.
 *  - Toggling it OFF dispatches `isAnonymous=false` and re-enables the (empty)
 *    inputs; nothing is restored.
 *  - Helper copy (`anonHelp`) states the contact is used only for reviewer
 *    follow-up and is never published.
 *
 * Renders the step BODY only (no Next button — `requiresAboutYou` is always-true,
 * so Next is never blocked here). No `dangerouslySetInnerHTML`; logical CSS only.
 */

import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";

interface AboutYouStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

export function AboutYouStep({ form, dispatch }: AboutYouStepProps) {
  const t = useTranslations("submit");

  function onAnonToggle(checked: boolean) {
    if (checked) {
      // Anonymous ON: clear (zero) contact fields — never stash/restore.
      dispatch({ type: "SET_FIELD", field: "isAnonymous", value: true });
      dispatch({ type: "SET_FIELD", field: "submitterName", value: "" });
      dispatch({ type: "SET_FIELD", field: "submitterEmail", value: "" });
    } else {
      dispatch({ type: "SET_FIELD", field: "isAnonymous", value: false });
    }
  }

  return (
    <div className="flex-col">
      <div className="form-section-title">{t("anonTitle")}</div>

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
          <label htmlFor="about-email">{t("email")}</label>
          <input
            id="about-email"
            type="email"
            className="ds-input"
            disabled={form.isAnonymous}
            value={form.submitterEmail ?? ""}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "submitterEmail", value: e.target.value })
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="about-name">{t("fullName")}</label>
          <input
            id="about-name"
            type="text"
            className="ds-input"
            disabled={form.isAnonymous}
            value={form.submitterName ?? ""}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "submitterName", value: e.target.value })
            }
          />
        </div>
      </div>

      <p className="ds-caption">{t("anonHelp")}</p>
    </div>
  );
}

export default AboutYouStep;
