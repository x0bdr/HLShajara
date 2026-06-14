"use client";

import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div className="page-container-narrow" style={{ paddingBlock: "var(--space-12)" }}>
      <div className="legal legal-error" role="alert">
        <div className="t">{t("title")}</div>
        <p>{t("body")}</p>
        {error.digest && (
          <p className="ds-mono" style={{ marginTop: "var(--space-4)" }}>
            {error.digest}
          </p>
        )}
        <div className="wizard-nav flex-between" style={{ marginTop: "var(--space-6)" }}>
          <button type="button" className="btn primary" onClick={reset}>
            {t("retry")}
          </button>
        </div>
      </div>
    </div>
  );
}
