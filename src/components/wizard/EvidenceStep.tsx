"use client";

/**
 * EvidenceStep — Step 6 of the report wizard, the KEYSTONE (Phase 30, EV-01..04).
 *
 * The source-gated core: "no source, no publication." Ports the legacy
 * source-rows + add-source markup from `SubmitClient.tsx` onto the reducer
 * contract.
 *
 *  - The "minimum 2 independent public sources" rule (`sourcesRule`) is surfaced
 *    UP FRONT in a `.legal` block at the TOP, before the rows (EV-01 / S6).
 *  - Each row: a required URL input, an optional source-type select over the six
 *    `SOURCE_TYPE_SLUGS`, and an optional title. The chosen slug is encoded
 *    idempotently into the row TITLE via `prefixSourceType` (§8 interim) — there
 *    is NO `sourceType` contract field yet; re-selecting never double-prefixes.
 *  - Rows are add/removable (existing ADD_SOURCE / REMOVE_SOURCE actions reused).
 *  - The live counter ties advance to LINKS only: `evidenceSourceCount(form) >= 2`
 *    (mirrors the server WEAK_SOURCE screen — files strengthen but do not unlock).
 *  - The optional non-public LEAD NOTE writes to `form.leadNote` only — NEVER
 *    folded into the public description and NEVER counted as a source (T-30-09).
 *
 * Renders the step BODY only (no Next button). No `dangerouslySetInnerHTML`;
 * logical CSS only (RTL-safe).
 */

import { useState, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { SubmitInput } from "@/lib/validation";
import type { WizardAction } from "@/lib/wizard/state";
import {
  SOURCE_TYPE_SLUGS,
  prefixSourceType,
  evidenceSourceCount,
} from "@/lib/wizard/step-logic";

interface EvidenceStepProps {
  form: SubmitInput;
  dispatch: Dispatch<WizardAction>;
}

/** The §3 i18n label key for each of the six source-type slugs (explicit so the
 *  slug→key wiring is grep-auditable and never drifts from SOURCE_TYPE_SLUGS). */
const SOURCE_TYPE_LABEL_KEY = {
  un: "sourceType_un",
  court: "sourceType_court",
  sanctions: "sourceType_sanctions",
  hr: "sourceType_hr",
  journalism: "sourceType_journalism",
  official: "sourceType_official",
} as const;

export function EvidenceStep({ form, dispatch }: EvidenceStepProps) {
  const t = useTranslations("submit");

  // Per-row selected source-type slug (parallel to sourceLinks). Local UI state —
  // the slug itself has no contract field; it is encoded into the row title.
  const [selectedType, setSelectedType] = useState<string[]>(
    form.sourceLinks.map(() => ""),
  );

  function setRowType(index: number, slug: string) {
    setSelectedType((prev) => {
      const next = [...prev];
      next[index] = slug;
      return next;
    });
    // Normalize first (strip any existing token), then re-encode. prefixSourceType
    // is idempotent so re-selecting never double-prefixes.
    const baseTitle = prefixSourceType("", form.sourceLinks[index]?.title ?? "");
    dispatch({
      type: "SET_SOURCE",
      index,
      field: "title",
      value: prefixSourceType(slug, baseTitle),
    });
  }

  function addSource() {
    dispatch({ type: "ADD_SOURCE" });
    setSelectedType((prev) => [...prev, ""]);
  }

  function removeSource(index: number) {
    dispatch({ type: "REMOVE_SOURCE", index });
    setSelectedType((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex-col">
      {/* The 2-source rule, surfaced up front (EV-01 / S6). */}
      <div className="legal mb-16">
        <div className="t">{t("sourcesTitle")}</div>
        <p>{t("sourcesRule")}</p>
      </div>

      {form.sourceLinks.map((link, i) => (
        <div key={i} className="form-field mb-16">
          <div className="form-row">
            <input
              type="url"
              className="ds-input"
              placeholder={t("sourceUrl")}
              required
              value={link.url}
              onChange={(e) =>
                dispatch({ type: "SET_SOURCE", index: i, field: "url", value: e.target.value })
              }
            />
            <select
              className="ds-select"
              aria-label={t("sourceType")}
              value={selectedType[i] ?? ""}
              onChange={(e) => setRowType(i, e.target.value)}
            >
              <option value="">{t("sourceType")}</option>
              {SOURCE_TYPE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {t(SOURCE_TYPE_LABEL_KEY[slug] as never)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <input
              type="text"
              className="ds-input"
              placeholder={t("sourceTitleField")}
              value={link.title ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_SOURCE", index: i, field: "title", value: e.target.value })
              }
            />
            {i > 0 && (
              <button
                type="button"
                className="btn ghost danger"
                onClick={() => removeSource(i)}
              >
                {t("removeSource")}
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" className="btn secondary" onClick={addSource}>
        + {t("addSource")}
      </button>

      <p className="ds-caption mt-16">
        {t("sourceCounter", {
          count: evidenceSourceCount(form),
          files: form.sourceFiles.length,
        })}
      </p>

      {/* Non-public lead note — written to form.leadNote ONLY, never a source. */}
      <div className="legal mt-16">
        <div className="t">{t("leadNote")}</div>
        <p>{t("leadNoteHint")}</p>
        <textarea
          className="ds-input"
          rows={3}
          style={{ resize: "vertical" }}
          value={form.leadNote ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "leadNote", value: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default EvidenceStep;
