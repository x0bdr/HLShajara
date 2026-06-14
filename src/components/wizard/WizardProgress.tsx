"use client";

/**
 * WizardProgress — the step-pill progress row + "Step N of M" counter (Plan 28-04, WIZ-04).
 *
 * Pure presentational chrome. It reads the wizard state (to derive which pills are
 * done / current / upcoming) and an `onJump` callback, but owns NO routing or
 * business state — the root container (Plan 05) wires `onJump` to a locale-aware
 * `router.push(?step=)`.
 *
 * Renders the Plan 28-02 CSS classes verbatim (`.wizard-progress`,
 * `.wizard-step-pill` + `.on`/`.done`, `.wizard-count`) — no inline color, no
 * invented class names. Progress is conveyed by `aria-current="step"` + the text
 * counter, never by color alone (UI-SPEC §11).
 */

import { useTranslations, useLocale } from "next-intl";
import {
  STEPS,
  type StepId,
  isCountedStep,
  visibleStepCount,
  visibleStepIndex,
} from "@/lib/wizard/registry";
import type { WizardState } from "@/lib/wizard/state";

interface WizardProgressProps {
  /** Full wizard state — drives done/current/upcoming + the branch-aware count. */
  state: WizardState;
  /** Called when a completed pill is tapped (parent routes back to that step). */
  onJump: (id: StepId) => void;
}

/**
 * The lifecycle of a visible step relative to the current position:
 * - "done"     → a visited step before the current one (tappable, jumps back)
 * - "current"  → the active step (aria-current, inert)
 * - "upcoming" → not yet reached (inert, non-button)
 */
type PillStatus = "done" | "current" | "upcoming";

export function WizardProgress({ state, onJump }: WizardProgressProps) {
  const t = useTranslations("submit");
  const locale = useLocale();

  // Arabic-Indic digits in AR, Western digits in EN — the single locale-formatter
  // for both N and M so "الخطوة ٣ من ٩" renders correctly (UI-SPEC §7, INTL-02).
  // Bare "ar" yields Latin digits in this ICU build, so AR explicitly pins the
  // Arabic numbering system to render ١/٢; EN keeps the default Latin digits.
  const fmt = new Intl.NumberFormat(
    locale,
    locale === "ar" ? { numberingSystem: "arab" } : undefined,
  );

  // M (visible total) and N (current position) come from the registry so a
  // branch-skipped step (e.g. the Individual-branch "1b") never miscounts (WIZ-04).
  const total = visibleStepCount(state);
  const currentN = visibleStepIndex(state.currentStep, state);

  // Only steps that count toward the visible flow get a pill; skipped branch
  // steps are excluded so the row matches the "Step N of M" denominator.
  const visibleSteps = STEPS.filter((s) => isCountedStep(s.id, state));

  function statusFor(stepId: StepId): PillStatus {
    if (stepId === state.currentStep) return "current";
    const n = visibleStepIndex(stepId, state);
    // A pill is "done" when it sits before the current step AND was visited.
    if (n > 0 && n < currentN && state.visited.includes(stepId)) return "done";
    return "upcoming";
  }

  return (
    <nav className="wizard-progress" aria-label={t("stepCounter", { n: fmt.format(currentN), m: fmt.format(total) })}>
      {visibleSteps.map((step) => {
        const status = statusFor(step.id);
        const label = t(step.titleKey as never);

        // Completed pills are real <button>s that jump back; current + upcoming
        // pills are inert <span>s (no handler) so only visited steps are reachable.
        if (status === "done") {
          return (
            <button
              key={step.id}
              type="button"
              className="wizard-step-pill done"
              onClick={() => onJump(step.id)}
            >
              {label}
            </button>
          );
        }

        return (
          <span
            key={step.id}
            className={`wizard-step-pill${status === "current" ? " on" : ""}`}
            aria-current={status === "current" ? "step" : undefined}
          >
            {label}
          </span>
        );
      })}

      <span className="wizard-count">
        {t("stepCounter", { n: fmt.format(currentN), m: fmt.format(total) })}
      </span>
    </nav>
  );
}
