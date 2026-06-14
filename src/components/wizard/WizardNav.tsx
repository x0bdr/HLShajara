"use client";

/**
 * WizardNav — persistent Back + conditional Next (Plan 28-04, WIZ-03).
 *
 * Pure presentational chrome; the root container (Plan 05) supplies `isFirst`,
 * the step `archetype`, `stepValid`, and the `onBack`/`onNext` callbacks.
 *
 * Layout rules (UI-SPEC §2.2, §2.4, §7):
 * - Back appears on EVERY step except the first; it is the inline-start
 *   affordance and its leading chevron is drawn by `.wizard-nav .back::before`
 *   using `margin-inline-end`, so it mirrors automatically in RTL — no
 *   left/right anywhere here.
 * - Next renders ONLY for the `input` archetype and is disabled until the step
 *   validates. `choice` steps render NO Next (auto-advance handles forward
 *   motion — WIZ-02).
 *
 * Renders the Plan 28-02 classes verbatim (`.wizard-nav`, `.back`, `.next`) and
 * reuses the token-driven `Button` for the primary Next so `.btn:disabled`
 * styling stays consistent. No inline color.
 */

import { useTranslations } from "next-intl";
import { Button } from "@/components";
import type { StepArchetype } from "@/lib/wizard/registry";

interface WizardNavProps {
  /** True on the very first step — Back is hidden. */
  isFirst: boolean;
  /** Choice steps auto-advance (no Next); input steps get a gated Next. */
  archetype: StepArchetype;
  /** Whether the current input step satisfies its completion gate. */
  stepValid: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function WizardNav({ isFirst, archetype, stepValid, onBack, onNext }: WizardNavProps) {
  const t = useTranslations("submit");

  return (
    <div className="wizard-nav flex-between">
      {!isFirst && (
        <button type="button" className="btn ghost back" onClick={onBack}>
          {t("back")}
        </button>
      )}

      {archetype === "input" && (
        <Button
          variant="primary"
          className="next"
          disabled={!stepValid}
          aria-disabled={!stepValid}
          onClick={onNext}
        >
          {t("next")}
        </Button>
      )}
    </div>
  );
}
