"use client";

/**
 * MediaStep — Step 7 of the report wizard (Phase 30, EV-03).
 *
 * Optional supporting-media step. Ports the legacy `/api/upload` flow + removable
 * file cards from `SubmitClient.tsx` onto the reducer contract.
 *
 *  - File input restricted to IMAGES + DOCUMENTS only. Video has NO upload path
 *    here — it is deferred to Phase 33 (BE-05) until ffmpeg metadata stripping
 *    lands; the `accept` attribute and copy exclude it (T-30-08).
 *  - Each selected file POSTs to `/api/upload` as FormData "file"; on `{ok:true}`
 *    an ADD_FILE is dispatched. Uploaded files render as removable `.card`s; an
 *    uploading indicator shows while a request is in flight.
 *  - Safety copy (`mediaSafety`) in a `.legal` block: supporting-only, non-public,
 *    metadata stripped, no faces of victims/children/bystanders.
 *  - An OPTIONAL public-media link is validated via `screenMediaLink`; a personal
 *    social link is rejected inline (`.legal-error`) and not accepted (T-30-10);
 *    an empty value is fine (optional — `requiresMedia` is always-true).
 *
 * Renders the step BODY only (no Next button). No `dangerouslySetInnerHTML`;
 * logical CSS only (RTL-safe).
 */

import { useState, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { screenMediaLink } from "@/lib/wizard/step-logic";

interface MediaStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

/** Images + documents only — NO video extensions (BE-05 deferral). */
const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx,.txt";

export function MediaStep({ form, dispatch }: MediaStepProps) {
  const t = useTranslations("submit");
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState("");
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
    setLink(value);
    // Reject a personal social link inline; an empty value is fine (optional).
    setLinkError(!screenMediaLink(value));
  }

  return (
    <div className="flex-col">
      <div className="t">{t("mediaTitle")}</div>

      <div className="legal mb-16">
        <p>{t("mediaSafety")}</p>
      </div>

      <div className="form-field">
        <input
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
        <label htmlFor="media-link">{t("mediaLink")}</label>
        <input
          id="media-link"
          type="url"
          className="ds-input"
          value={link}
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
    </div>
  );
}

export default MediaStep;
