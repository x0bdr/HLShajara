"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button, LegalNote } from "@/components";

interface UploadedFile {
  hash: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

export default function SubmitPage() {
  const [form, setForm] = useState({
    entityName: "",
    entityType: "individual",
    entityRole: "",
    allegationDescription: "",
    allegationPeriod: "",
    allegationLocation: "",
    allegationClassification: "",
    sourceLinks: [{ url: "", title: "" }],
    sourceFiles: [] as UploadedFile[],
    submitterEmail: "",
    submitterName: "",
    isAnonymous: false,
  });
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    code?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const t = useTranslations("submit");
  const legal = useTranslations("legal");
  const locale = useLocale();

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateLink(index: number, field: "url" | "title", value: string) {
    setForm((f) => {
      const links = [...f.sourceLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...f, sourceLinks: links };
    });
  }

  function addLink() {
    setForm((f) => ({
      ...f,
      sourceLinks: [...f.sourceLinks, { url: "", title: "" }],
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: data,
        });
        const json = await res.json();
        if (json.ok) {
          setForm((f) => ({
            ...f,
            sourceFiles: [
              ...f.sourceFiles,
              {
                hash: json.hash,
                filename: json.filename,
                originalName: json.originalName,
                url: json.url,
                size: json.size,
              },
            ],
          }));
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setUploadingFile(false);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setForm((f) => ({
      ...f,
      sourceFiles: f.sourceFiles.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResult(data);
    setSubmitting(false);

    if (data.ok) {
      setForm({
        entityName: "",
        entityType: "individual",
        entityRole: "",
        allegationDescription: "",
        allegationPeriod: "",
        allegationLocation: "",
        allegationClassification: "",
        sourceLinks: [{ url: "", title: "" }],
        sourceFiles: [],
        submitterEmail: "",
        submitterName: "",
        isAnonymous: false,
      });
    }
  }

  return (
    <>
      <div className="page-header-center">
        <div className="ds-h1">{t("title")}</div>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>

      {result && (
        <div className={`legal mt-16 mb-16 ${result.ok ? "legal-success" : "legal-error"}`}>
          <div className="t">{result.ok ? t("success") : t("error")}</div>
          <p>{result.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col mt-16">
        {/* About Entity */}
        <div className="form-section">
          <div className="form-section-title">{t("aboutEntity")}</div>
          <div className="form-field">
            <label>{t("fullName")}</label>
            <input
              type="text"
              value={form.entityName}
              onChange={(e) => updateField("entityName", e.target.value)}
              required
              className="ds-input"
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>{t("type")}</label>
              <select
                value={form.entityType}
                onChange={(e) => updateField("entityType", e.target.value)}
                className="ds-input"
              >
                <option value="individual">{t("typeIndividual")}</option>
                <option value="organization">{t("typeOrganization")}</option>
                <option value="military_unit">{t("typeMilitaryUnit")}</option>
                <option value="security_branch">{t("typeSecurityBranch")}</option>
                <option value="official_body">{t("typeOfficialBody")}</option>
              </select>
            </div>
            <div className="form-field">
              <label>{t("role")}</label>
              <input
                type="text"
                value={form.entityRole}
                onChange={(e) => updateField("entityRole", e.target.value)}
                required
                className="ds-input"
              />
            </div>
          </div>
        </div>

        {/* About Allegation */}
        <div className="form-section">
          <div className="form-section-title">{t("aboutAllegation")}</div>
          <div className="form-field">
            <label>{t("description")}</label>
            <textarea
              value={form.allegationDescription}
              onChange={(e) => updateField("allegationDescription", e.target.value)}
              required
              rows={4}
              className="ds-input"
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>{t("period")}</label>
              <input
                type="text"
                value={form.allegationPeriod}
                onChange={(e) => updateField("allegationPeriod", e.target.value)}
                className="ds-input"
              />
            </div>
            <div className="form-field">
              <label>{t("location")}</label>
              <input
                type="text"
                value={form.allegationLocation}
                onChange={(e) => updateField("allegationLocation", e.target.value)}
                className="ds-input"
              />
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="form-section">
          <div className="form-section-title">{t("sources")}</div>
          {form.sourceLinks.map((link, i) => (
            <div key={i} className="form-row" style={{ marginBottom: 10 }}>
              <input
                type="url"
                placeholder={t("sourceLink")}
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                required
                className="ds-input"
              />
              <input
                type="text"
                placeholder={t("sourceTitle")}
                value={link.title}
                onChange={(e) => updateLink(i, "title", e.target.value)}
                className="ds-input"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="btn ghost"
            style={{ alignSelf: "flex-start" }}
          >
            + {t("addSource")}
          </button>

          {/* File uploads */}
          <div className="form-field" style={{ marginTop: 20 }}>
            <label>{t("uploadFile")}</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={uploadingFile}
              className="ds-input"
              style={{ padding: "8px 14px", cursor: uploadingFile ? "not-allowed" : "pointer" }}
            />
            {uploadingFile && (
              <p className="ds-caption" style={{ marginTop: 4 }}>
                {t("uploading")}
              </p>
            )}
            {form.sourceFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {form.sourceFiles.map((file, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                    }}
                  >
                    <span className="ds-body-sm">
                      {file.originalName} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="btn ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                    >
                      {t("removeFile")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Your Info */}
        <div className="form-section">
          <div className="form-section-title">{t("yourInfo")}</div>
          <div className="form-row">
            <div className="form-field">
              <label>{t("email")}</label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={(e) => updateField("submitterEmail", e.target.value)}
                className="ds-input"
              />
            </div>
            <div className="form-field">
              <label>{t("name")}</label>
              <input
                type="text"
                value={form.submitterName}
                onChange={(e) => updateField("submitterName", e.target.value)}
                className="ds-input"
              />
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: "var(--fg1)",
            }}
          >
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => updateField("isAnonymous", e.target.checked)}
            />
            <span>{t("anonymous")}</span>
          </label>
        </div>

        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? t("submitting") : t("submitButton")}
        </Button>
      </form>
    </>
  );
}
