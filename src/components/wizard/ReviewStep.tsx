"use client";

/**
 * ReviewStep — Step 9 read-only review summary (Phase 31, REV-01/REV-02).
 *
 * A stateless presentational leaf (props-in, callbacks-out — same convention as
 * WizardProgress/WizardNav/WizardPanel). It renders SIX semantic groups in flow
 * order (Actor, Conduct, Description, Evidence, Media, You), each with a
 * `.ds-eyebrow` label and ONE Edit link that routes to the FIRST step of that
 * group via the REAL registry slug (actor-class/conduct/describe/evidence/media/
 * about-you — NEVER the friendly names actor/you, which are not registered ids).
 * Empty optionals render as the em-dash "—" sentinel via `displayValue` (never
 * hidden). The source-type `[TYPE: <slug>]` token is stripped for DISPLAY only;
 * the raw `title` is submitted verbatim by the parent (WizardClient). The lead
 * note renders in the Evidence group inside a distinct "Reviewer note (not
 * published)" sub-block. The component owns the affirmation checkbox plus the two
 * INDEPENDENT inline disabled-reason gates (sources<2, not affirmed); Submit is
 * disabled until `affirmed && sourceLinks.length >= 2 && !submitting`.
 *
 * Reuses only Phase-28 CSS (.review-group/.review-row/.review-sources/
 * .review-affirm/.ds-eyebrow/.ds-mono/.filter-badge/.legal-error/.btn ghost/
 * .btn-sm) — adds NO CSS. All submitter values bind as React text children
 * (auto-escaped, never raw-HTML-injected); logical CSS only (no physical
 * direction props).
 */

import { useTranslations } from "next-intl";
import { Button } from "@/components";
import type { SubmitInput } from "@/lib/validation";
import { stripSourceType, displayValue } from "./review-helpers";

/* ---------- PURE HELPERS ---------- */
// `stripSourceType` + `displayValue` live in the JSX-free sibling
// `./review-helpers` (a `.tsx` cannot be loaded under --experimental-strip-types).
// Re-exported here so the component's public surface keeps both names.
export { stripSourceType, displayValue } from "./review-helpers";

/** The six review groups, in flow order, with their first-of-group edit target. */
export const REVIEW_GROUP_IDS = [
  "actor-class",
  "conduct",
  "describe",
  "evidence",
  "media",
  "about-you",
] as const;

/* ---------- COMPONENT ---------- */

interface ReviewStepProps {
  form: SubmitInput & { leadNote?: string };
  affirmed: boolean;
  submitting: boolean;
  /** Emits a REAL registry slug (actor-class/conduct/describe/evidence/media/about-you). */
  onEdit: (stepId: string) => void;
  onAffirmChange: (checked: boolean) => void;
  onSubmit: () => void;
}

export function ReviewStep({
  form,
  affirmed,
  submitting,
  onEdit,
  onAffirmChange,
  onSubmit,
}: ReviewStepProps) {
  const t = useTranslations("submit");

  const sourcesOk = form.sourceLinks.length >= 2;
  const submitDisabled = submitting || !affirmed || form.sourceLinks.length < 2;

  return (
    <div className="flex-col">
      <div className="t">{t("reviewTitle")}</div>

      {/* ---------- Actor (steps 1/1b/2; first = actor-class) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupActor")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("actor-class")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("idName")}</span>
          <span className="v">{displayValue(form.entityName)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("idRole")}</span>
          <span className="v">{displayValue(form.entityRole)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("type")}</span>
          <span className="v">{displayValue(form.entityType)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("location")}</span>
          <span className="v">{displayValue(form.allegationLocation)}</span>
        </div>
      </div>

      {/* ---------- Conduct (steps 3/4; first = conduct) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupConduct")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("conduct")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("q_conduct")}</span>
          <span className="v">{displayValue(form.allegationClassification)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("q_roleInAct")}</span>
          <span className="v">{displayValue(form.entityRole)}</span>
        </div>
      </div>

      {/* ---------- Description (step 5; first = describe) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupDescription")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("describe")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("descLabel")}</span>
          <span className="v">{displayValue(form.allegationDescription)}</span>
        </div>
        <div className="review-row">
          <span className="k">{t("period")}</span>
          <span className="v">{displayValue(form.allegationPeriod)}</span>
        </div>
      </div>

      {/* ---------- Evidence (step 6: sources + lead note; first = evidence) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupEvidence")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("evidence")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">
            {t("reviewSourcesShort")}
            <span className="filter-badge">{form.sourceLinks.length}</span>
          </span>
          <span className="v">
            {form.sourceLinks.length === 0 ? (
              displayValue("")
            ) : (
              <span className="review-sources flex-col">
                {form.sourceLinks.map((row, i) => {
                  const { type } = stripSourceType(row.title ?? "");
                  return (
                    <span key={i} className="flex-col">
                      <span className="ds-mono">{row.url}</span>
                      {type ? (
                        <span className="ds-caption">
                          {t("reviewSourceTypeLabel")}: {type}
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </span>
            )}
          </span>
        </div>

        {/* Lead note — distinct non-public sub-block (display-only here). */}
        <div className="review-row">
          <span className="k">{t("reviewLeadNoteLabel")}</span>
          <span className="v">{displayValue(form.leadNote)}</span>
        </div>
      </div>

      {/* ---------- Media (step 7; first = media) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupMedia")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("media")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("mediaTitle")}</span>
          <span className="v">
            {form.sourceFiles.length === 0
              ? displayValue("")
              : form.sourceFiles.map((f) => f.originalName).join(", ")}
          </span>
        </div>
      </div>

      {/* ---------- You (step 8; first = about-you) ---------- */}
      <div className="review-group">
        <div className="head flex-between">
          <span className="ds-eyebrow">{t("reviewGroupYou")}</span>
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={() => onEdit("about-you")}
          >
            {t("reviewEdit")}
          </button>
        </div>
        <div className="review-row">
          <span className="k">{t("anonToggle")}</span>
          <span className="v">{form.isAnonymous ? t("anonToggle") : displayValue("")}</span>
        </div>
        {!form.isAnonymous ? (
          <>
            <div className="review-row">
              <span className="k">{t("fullName")}</span>
              <span className="v">{displayValue(form.submitterName)}</span>
            </div>
            <div className="review-row">
              <span className="k">{t("email")}</span>
              <span className="v">{displayValue(form.submitterEmail)}</span>
            </div>
          </>
        ) : null}
      </div>

      {/* ---------- Affirmation + Submit + two independent inline gates ---------- */}
      <div className="review-affirm">
        <label className="flex-between" htmlFor="review-affirm-check">
          <input
            id="review-affirm-check"
            type="checkbox"
            checked={affirmed}
            onChange={(e) => onAffirmChange(e.target.checked)}
          />
          <span className="ds-body-sm">{t("affirm")}</span>
        </label>

        {/* Gate 1 — sources < 2 (shown only when its own condition is unmet). */}
        {!sourcesOk ? (
          <div className="legal legal-error mt-16" role="status" aria-live="polite">
            <p>{t("errSourcesGate")}</p>
          </div>
        ) : null}

        {/* Gate 2 — not affirmed (shown only when its own condition is unmet). */}
        {!affirmed ? (
          <div className="legal legal-error mt-16" role="status" aria-live="polite">
            <p>{t("errAffirmGate")}</p>
          </div>
        ) : null}

        <div className="wizard-nav flex-between mt-16">
          <Button
            variant="primary"
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            onClick={onSubmit}
          >
            {submitting ? t("submitting") : t("submitButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
