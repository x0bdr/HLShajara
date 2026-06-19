"use client";

/**
 * ChallengeGate — presentational gray-band math challenge.
 *
 * Surfaced ONLY when the server escalates a low/failed reCAPTCHA v3 score with
 * CHALLENGE_REQUIRED (see WizardClient). Renders the localized bilingual question
 * from the signed operands (the token, not this text, carries the canonical answer),
 * an accessible labelled numeric input, and an aria-live error region. Fully RTL-safe
 * (logical properties / existing wizard classes); accepts Arabic-Indic digits — the
 * server normalizes them.
 */

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components";

interface ChallengeGateProps {
  a: number;
  b: number;
  op: "+" | "-";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  submitting?: boolean;
}

export function ChallengeGate({
  a,
  b,
  op,
  value,
  onChange,
  onSubmit,
  error,
  submitting = false,
}: ChallengeGateProps) {
  const t = useTranslations("submit");
  const inputId = useId();
  const errorId = useId();
  const questionId = useId();

  const question =
    op === "+"
      ? t("challengeQuestionAdd", { a, b })
      : t("challengeQuestionSub", { a, b });

  // The visible <label> shows the math question; the input also carries an explicit
  // accessible name ("Your answer" / "إجابتك") via aria-label, while aria-describedby
  // keeps the question (and any error) announced to screen readers. RTL-safe.
  const describedBy = [questionId, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="legal legal-warning mt-16 mb-16" role="group" aria-label={t("challengeTitle")}>
      <div className="t">{t("challengeTitle")}</div>
      <p>{t("challengeIntro")}</p>

      <div className="form-field mt-16">
        <label htmlFor={inputId} id={questionId}>{question}</label>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="ds-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!submitting) onSubmit();
            }
          }}
          aria-label={t("challengeAnswerLabel")}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          disabled={submitting}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" aria-live="polite" className="legal-error mt-8">
          {error}
        </p>
      ) : null}

      <div className="wizard-nav flex-between mt-16">
        <Button variant="primary" onClick={onSubmit} disabled={submitting}>
          {t("challengeSubmit")}
        </Button>
      </div>
    </div>
  );
}

export default ChallengeGate;
