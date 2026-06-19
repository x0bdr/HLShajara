"use client";

/**
 * MediaEvidenceStep — Step 6 of the v1.5 category-based wizard.
 *
 * Collects optional media evidence only: a public-media link, supporting file
 * uploads (with drag-and-drop), and additional notes. Source links are no longer
 * collected at intake.
 */

import { useRef, useState, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import { screenMediaLink } from "@/lib/wizard/step-logic";

interface MediaEvidenceStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

const ACCEPTED_TYPES = "image/*,video/*";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function isAllowedFileType(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function MediaEvidenceStep({ form, dispatch }: MediaEvidenceStepProps) {
  const t = useTranslations("submit");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const meta = form.reportMetadata ?? {};
  const [linkError, setLinkError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const totalAfterUpload = form.sourceFiles.length + files.length;
    if (totalAfterUpload > MAX_FILES) {
      setUploadError(t("uploadTooManyFiles", { max: MAX_FILES }));
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(t("uploadFileTooLarge", { max: "10 MB" }));
        return;
      }
      if (!isAllowedFileType(file)) {
        setUploadError(t("uploadFileTypeNotAllowed"));
        return;
      }
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: data });
        const json = (await res.json()) as { ok: boolean; message?: string; code?: string } & Record<string, unknown>;
        if (json.ok) {
          dispatch({
            type: "ADD_FILE",
            file: {
              hash: String(json.hash),
              filename: String(json.filename),
              originalName: String(json.originalName),
              url: String(json.url),
              size: Number(json.size),
            },
          });
        } else {
          const code = json.code;
          const message =
            code === "INVALID_FILE_TYPE" || code === "UNSUPPORTED_FILE_TYPE"
              ? t("uploadFileTypeNotAllowed")
              : code === "FILE_TOO_LARGE"
                ? t("uploadFileTooLarge", { max: "10 MB" })
                : code === "FFMPEG_UNAVAILABLE"
                  ? t("uploadVideoUnavailable")
                  : code === "MALWARE_DETECTED"
                    ? t("uploadMalwareDetected")
                    : json.message ?? t("uploadFailed");
          setUploadError(message);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError(t("uploadFailed"));
      }
    }

    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    void uploadFiles(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
        <label>{t("mediaTitle")}</label>
        <div
          className={`dropzone ${isDragging ? "dragging" : ""} ${uploading ? "uploading" : ""} ${form.sourceFiles.length >= MAX_FILES ? "disabled" : ""}`}
          onClick={() => {
            if (form.sourceFiles.length < MAX_FILES) inputRef.current?.click();
          }}
          onDrop={(e) => {
            if (form.sourceFiles.length < MAX_FILES) onDrop(e);
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          tabIndex={form.sourceFiles.length >= MAX_FILES ? -1 : 0}
          aria-label={t("mediaTitle")}
          aria-disabled={form.sourceFiles.length >= MAX_FILES || undefined}
          onKeyDown={(e) => {
            if (form.sourceFiles.length >= MAX_FILES) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            disabled={uploading || form.sourceFiles.length >= MAX_FILES}
            className="dropzone-input"
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">☁️</div>
          <div className="dropzone-title">
            {uploading
              ? t("uploading")
              : form.sourceFiles.length >= MAX_FILES
                ? t("uploadMaxReached")
                : t("dropzoneTitle")}
          </div>
          <div className="dropzone-hint">
            {t("dropzoneHint", { maxFiles: MAX_FILES, maxSize: "10 MB" })}
          </div>
        </div>

        {uploadError && (
          <p className="legal-error" role="alert" style={{ marginTop: 8 }}>
            {uploadError}
          </p>
        )}

        {form.sourceFiles.length > 0 && (
          <div className="flex-col mt-16">
            {form.sourceFiles.map((file, i) => (
              <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="flex-between">
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
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <input
                    id={`media-file-label-${i}`}
                    type="text"
                    className="ds-input"
                    value={file.label ?? ""}
                    placeholder={t("mediaFileLabel")}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FILE_LABEL",
                        index: i,
                        value: e.target.value,
                      })
                    }
                  />
                </div>
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
