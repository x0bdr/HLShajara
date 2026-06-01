"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, LegalNote } from "@/components";

export default function ReplyPage() {
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");
  const [statement, setStatement] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("reply");
  const legal = useTranslations("legal");
  const locale = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityName, email, statement }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        setSubmitted(true);
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>

      {submitted ? (
        <div className="legal legal-success mt-24">
          <div className="t">{t("successTitle")}</div>
          <p>{t("successText")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-col gap-16 mt-24">
          {result && !result.ok && (
            <div className="legal legal-error">
              <div className="t">Error</div>
              <p>{result.message}</p>
            </div>
          )}

          <div className="form-field">
            <label>{t("entityName")}</label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              required
              className="ds-input"
            />
          </div>
          <div className="form-field">
            <label>{t("contactEmail")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="ds-input"
            />
          </div>
          <div className="form-field">
            <label>{t("statement")}</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              required
              rows={6}
              className="ds-input"
              style={{ resize: "vertical" }}
            />
          </div>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("submitting") : t("submitButton")}
          </Button>
        </form>
      )}
    </>
  );
}
