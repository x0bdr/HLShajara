"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, LegalNote } from "@/components";

export default function ReplyPage() {
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");
  const [statement, setStatement] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = useTranslations("reply");
  const legal = useTranslations("legal");
  const locale = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In a real implementation, this would POST to an API
    setSubmitted(true);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 8 }}>
        {t("title")}
      </div>
      <p className="ds-lead" style={{ marginBottom: 24 }}>
        {t("lead")}
      </p>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>

      {submitted ? (
        <div
          className="legal"
          style={{
            marginTop: 24,
            borderColor: "var(--green-500)",
            background: "var(--green-50)",
          }}
        >
          <div className="t" style={{ color: "var(--green-700)" }}>
            {t("successTitle")}
          </div>
          <p>{t("successText")}</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label className="ds-caption">{t("entityName")}</label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
              }}
            />
          </div>
          <div>
            <label className="ds-caption">{t("contactEmail")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
              }}
            />
          </div>
          <div>
            <label className="ds-caption">{t("statement")}</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              required
              rows={6}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
                resize: "vertical",
              }}
            />
          </div>
          <Button variant="primary" type="submit">
            {t("submitButton")}
          </Button>
        </form>
      )}
    </main>
  );
}
