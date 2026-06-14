"use client";

/**
 * MediaEvidenceStep — Step 6 of the v1.5 category-based wizard.
 *
 * Collects optional public-media link, supporting file uploads, and additional
 * notes. Sources are no longer required at intake.
 */

import { useState, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { screenMediaLink } from "@/lib/wizard/step-logic";

interface MediaEvidenceStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx,.txt,video/*";

export function MediaEvidenceStep({ form, dispatch }: MediaEvidenceStepProps) {
  const t = useTranslations("submit");

  const [uploading, setUploading] = useState(false);
  const meta = form.reportMetadata ?? {};
  const [linkError, setLinkError] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: data });
        const json = await res.json();
        if (json.ok) {
          dispatch({
            type: "ADD_FILE",
            file: {
              hash: json.hash,
              filename: json.filename,
              originalName: json.originalName,
              url: json.url,
              size: json.size,
            },
          });
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setUploading(false);
    e.target.value = "";
  }

  function onLinkChange(value: string) {
    dispatch({ type: "SET_METADATA", field: "mediaLink", value });
    setLinkError(value.trim().length > 0 && !screenMediaLink(value));
  }

  return (
    <div className="flex-col">
      <div className="form-field">
        <label htmlFor="media-link">{t("mediaLink")}</label>
        <input
          id="media-link"
          type="url"
          className="ds-input"
          value={meta.mediaLink ?? ""}
          aria-invalid={linkError || undefined}
          aria-describedby={linkError ? "media-link-error" : undefined}
          onChange={(e) => onLinkChange(e.target.value)}
          onBlur={(e) => onLinkChange(e.target.value)}
        />
        {linkError && (
          <p id="media-link-error" className="legal-error" role="alert">
            {t("mediaLinkError")}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="media-files">{t("mediaTitle")}</label>
        <input
          id="media-files"
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          disabled={uploading}
          className="ds-input"
          aria-label={t("mediaTitle")}
          style={{ cursor: uploading ? "not-allowed" : "pointer" }}
          onChange={handleFileChange}
        />
        {uploading && <p className="ds-caption">{t("uploading")}</p>}

        {form.sourceFiles.length > 0 && (
          <div className="flex-col mt-16">
            {form.sourceFiles.map((file, i) => (
              <div key={i} className="card flex-between">
                <span className="ds-body-sm">
                  {file.originalName} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => dispatch({ type: "REMOVE_FILE", index: i })}
                >
                  {t("removeFile")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="media-notes">{t("mediaNotes")}</label>
        <textarea
          id="media-notes"
          className="ds-input"
          rows={3}
          style={{ resize: "vertical" }}
          value={meta.mediaNotes ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_METADATA", field: "mediaNotes", value: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default MediaEvidenceStep;
