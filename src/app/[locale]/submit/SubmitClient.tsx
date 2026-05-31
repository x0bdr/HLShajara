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
    // Reset input so the same file can be selected again
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--fg1)",
    fontFamily: "var(--font-sans)",
    fontSize: 14,
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 8 }}>
        {t("title")}
      </div>
      <p className="ds-lead" style={{ marginBottom: 24 }}>
        {t("lead")}
      </p>

      <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>

      {result && (
        <div
          className="legal"
          style={{
            marginTop: 16,
            marginBottom: 16,
            borderColor: result.ok ? "var(--green-500)" : "var(--brick-500)",
            background: result.ok ? "var(--green-50)" : "var(--brick-100)",
          }}
        >
          <div
            className="t"
            style={{
              color: result.ok ? "var(--green-700)" : "var(--brick-700)",
            }}
          >
            {result.ok ? t("success") : t("error")}
          </div>
          <p>{result.message}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className="ds-h3">{t("aboutEntity")}</div>

        <div>
          <label className="ds-caption">{t("fullName")}</label>
          <input
            type="text"
            value={form.entityName}
            onChange={(e) => updateField("entityName", e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label className="ds-caption">{t("type")}</label>
          <select
            value={form.entityType}
            onChange={(e) => updateField("entityType", e.target.value)}
            style={inputStyle}
          >
            <option value="individual">{t("typeIndividual")}</option>
            <option value="organization">{t("typeOrganization")}</option>
            <option value="military_unit">{t("typeMilitaryUnit")}</option>
            <option value="security_branch">{t("typeSecurityBranch")}</option>
            <option value="official_body">{t("typeOfficialBody")}</option>
          </select>
        </div>

        <div>
          <label className="ds-caption">{t("role")}</label>
          <input
            type="text"
            value={form.entityRole}
            onChange={(e) => updateField("entityRole", e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div className="ds-h3" style={{ marginTop: 8 }}>
          {t("aboutAllegation")}
        </div>

        <div>
          <label className="ds-caption">{t("description")}</label>
          <textarea
            value={form.allegationDescription}
            onChange={(e) =>
              updateField("allegationDescription", e.target.value)
            }
            required
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label className="ds-caption">{t("period")}</label>
            <input
              type="text"
              value={form.allegationPeriod}
              onChange={(e) => updateField("allegationPeriod", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="ds-caption">{t("location")}</label>
            <input
              type="text"
              value={form.allegationLocation}
              onChange={(e) =>
                updateField("allegationLocation", e.target.value)
              }
              style={inputStyle}
            />
          </div>
        </div>

        <div className="ds-h3" style={{ marginTop: 8 }}>
          {t("sources")}
        </div>
        {form.sourceLinks.map((link, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input
              type="url"
              placeholder={t("sourceLink")}
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
              required
              style={{ ...inputStyle, flex: 2 }}
            />
            <input
              type="text"
              placeholder={t("sourceTitle")}
              value={link.title}
              onChange={(e) => updateLink(i, "title", e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
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
        <div>
          <label className="ds-caption">{t("uploadFile")}</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={uploadingFile}
            style={{
              ...inputStyle,
              padding: "8px 14px",
              cursor: uploadingFile ? "not-allowed" : "pointer",
            }}
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--surface)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
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

        <div className="ds-h3" style={{ marginTop: 8 }}>
          {t("yourInfo")}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label className="ds-caption">{t("email")}</label>
            <input
              type="email"
              value={form.submitterEmail}
              onChange={(e) =>
                updateField("submitterEmail", e.target.value)
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label className="ds-caption">{t("name")}</label>
            <input
              type="text"
              value={form.submitterName}
              onChange={(e) =>
                updateField("submitterName", e.target.value)
              }
              style={inputStyle}
            />
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => updateField("isAnonymous", e.target.checked)}
          />
          <span className="ds-body-sm">{t("anonymous")}</span>
        </label>

        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? t("submitting") : t("submitButton")}
        </Button>
      </form>
    </main>
  );
}
