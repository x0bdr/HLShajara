"use client";

/**
 * WizardPanel — the accessible step-body shell (Plan 28-04).
 *
 * Wraps every step's content in `.wizard-panel` (the Plan 28-02 card-styled
 * container) and owns the two cross-cutting accessibility behaviors the wizard
 * needs (UI-SPEC §7, §11, INTL-03):
 *
 *  1. Focus management — on every step change it moves focus to the step
 *     `<h2 tabIndex={-1}>` so keyboard + screen-reader users land on the new
 *     heading. It NEVER traps focus (the heading is the only programmatic
 *     focus target; tabbing proceeds normally).
 *  2. Live announcement — a SINGLE persistent visually-hidden
 *     `aria-live="polite"` region whose text content is updated (not remounted)
 *     to "Step N of M, <title>" on change, so assistive tech reads the new step.
 *
 * Security (T-28-08): renders only React text + `children` — it never injects
 * raw HTML, so any submitter-derived value passed as a child is auto-escaped by
 * React.
 *
 * Motion: the panel's enter transition lives in CSS and is already disabled
 * under `@media (prefers-reduced-motion: reduce)` (Plan 02); this component runs
 * no JS-driven animation, so reduced-motion is honored structurally.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { useLocale } from "next-intl";

interface WizardPanelProps {
  /** Resolved (already-translated) step title shown in the heading + announcer. */
  title: string;
  /** 1-based visible position of this step (N). */
  stepIndex: number;
  /** Total visible steps (M). */
  stepTotal: number;
  /** The step body (fields, choice grid, etc.). */
  children: ReactNode;
}

export function WizardPanel({ title, stepIndex, stepTotal, children }: WizardPanelProps) {
  const locale = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus moves to the step heading whenever the step (title/position) changes —
  // keyed on the announcement so it re-fires per step, never traps (UI-SPEC §11).
  useEffect(() => {
    headingRef.current?.focus();
  }, [title, stepIndex, stepTotal]);

  // Arabic-Indic digits in AR so the spoken announcement matches the visible
  // counter (UI-SPEC §7). Bare "ar" yields Latin digits in this ICU build, so AR
  // explicitly pins the Arabic numbering system; EN keeps default Latin digits.
  // Single persistent node updated by text content below.
  const fmt = new Intl.NumberFormat(
    locale,
    locale === "ar" ? { numberingSystem: "arab" } : undefined,
  );
  const announcement = `${fmt.format(stepIndex)} / ${fmt.format(stepTotal)} — ${title}`;

  return (
    <section className="wizard-panel">
      <h2 ref={headingRef} tabIndex={-1}>
        {title}
      </h2>

      {/* Single persistent visually-hidden live region. No helper class exists in
          the codebase, so an inline clip style is used here for the sr-only node
          only (per plan); it is never animated and carries no color. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </div>

      {children}
    </section>
  );
}
