"use client";

/**
 * WizardClient — the root container for the report-submission wizard (Plan 28-05).
 *
 * Wires the pure engine (Plan 03: reducer + registry + persistence) and the
 * presentational chrome (Plan 04: WizardProgress/WizardNav/WizardPanel) into a
 * working one-step-per-page shell. It renders EXACTLY ONE step at a time inside
 * the `.wizard` container that lives within `.page-container-narrow` (supplied by
 * `PageShell narrow`), proving WIZ-01..06 with placeholder content only. The real
 * step content lands in Phases 29-31.
 *
 * Six concerns are wired here (UI-SPEC §2):
 *  (1) ROUTING — the active step is the single source of truth in the `?step=`
 *      URL param, so browser Back/Forward + refresh just work (WIZ-03/WIZ-05).
 *      `goTo(id)` pushes the next-intl OBJECT href
 *      `{ pathname: "/submit", query: { step: id } }` with `{ scroll: false }` —
 *      a STRING href with a query suffix is a no-op under `localePrefix: "always"`.
 *  (2) DRAFT — every reducer change persists via `saveDraft`; on mount a saved
 *      draft surfaces a restore prompt (Resume → RESTORE_DRAFT, Start over →
 *      clearDraft + RESET); a successful submit / Start-over clears the draft.
 *  (3) BEFOREUNLOAD — a dirty, unsubmitted draft warns on tab close/reload.
 *  (4) AUTO-ADVANCE — choice confirm sets the value then advances after
 *      `var(--dur)` (200ms), or IMMEDIATELY under `prefers-reduced-motion`.
 *  (5) BRANCHING / REACHABILITY — an unknown or unreachable `?step=` redirects
 *      to `firstIncompleteStep` (WIZ-06); the server choke point stays
 *      authoritative (T-28-10).
 *  (6) SUBMIT SKELETON — the future final step POSTs to `/api/submit` with the
 *      `SubmitInput` state, pushes the GTM event, resets, and clears the draft
 *      (Phase 31 fills the real copy/flow).
 *
 * Security: restored draft values bind to controlled inputs (auto-escaped); no
 * `dangerouslySetInnerHTML`. The `?step=` guard is UX only.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";
import {
  wizardReducer,
  initialWizardState,
  type WizardState,
} from "@/lib/wizard/state";
import {
  STEPS,
  type StepId,
  type StepDef,
  type StepArchetype,
  nextStep,
  prevStep,
  isReachable,
  firstIncompleteStep,
  visibleStepCount,
  visibleStepIndex,
} from "@/lib/wizard/registry";
import { saveDraft, loadDraft, clearDraft } from "@/lib/wizard/persistence";

import { WizardProgress } from "@/components/wizard/WizardProgress";
import { WizardNav } from "@/components/wizard/WizardNav";
import { WizardPanel } from "@/components/wizard/WizardPanel";
import { ChoiceStep } from "@/components/wizard/ChoiceStep";
import { InputStep } from "@/components/wizard/InputStep";

/** The `var(--dur)` transition window (tokens.css `--dur: 200ms`). */
const ADVANCE_DELAY_MS = 200;

/** True only in the browser AND when the user asked for reduced motion. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Whether a step id is a known registry step. */
function isKnownStep(id: string): id is StepId {
  return STEPS.some((s) => s.id === id);
}

interface SubmitResult {
  ok: boolean;
  message: string;
  code?: string;
}

export function WizardClient() {
  const t = useTranslations("submit");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const submittedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Widen to the declared `StepDef` so optional `requires`/`titleKey`/`branchWhen`
  // are accessible — the `as const` STEPS narrows each member to its literal
  // shape, dropping the optional props from members that omit them.
  const stepDef: StepDef | undefined = STEPS.find((s) => s.id === state.currentStep);
  const archetype: StepArchetype = stepDef?.archetype ?? "choice";

  /* ---------- (1) ROUTING: push the step into ?step= ---------- */
  const goTo = useCallback(
    (id: StepId, replace = false) => {
      dispatch({ type: "GOTO_STEP", step: id });
      // next-intl `createNavigation({ localePrefix: "always" })` does NOT navigate
      // when handed a STRING href carrying a query string ("/submit?step=X") — the
      // locale-prefixing path-builder drops the query and the push is a no-op. The
      // OBJECT (UrlObject) form routes the query through `query` so the locale
      // prefix + `?step=` are both applied client-side (auto-advance, Back/Forward,
      // the mount URL-sync, and the reachability redirect all depend on this).
      const href = { pathname: "/submit", query: { step: id } };
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router],
  );

  /* ---------- (5) BRANCHING / REACHABILITY: sync from ?step= ----------
   * The URL is the source of truth for which step shows. On mount and on every
   * `?step=` change, an unknown or unreachable id redirects to the first
   * incomplete step (WIZ-06, T-28-10). A valid, reachable, different id syncs
   * into the reducer so the rest of the UI follows browser Back/Forward. */
  useEffect(() => {
    const requested = searchParams.get("step");

    // No ?step= yet: land on the canonical first step.
    if (!requested) {
      if (state.currentStep !== STEPS[0].id) {
        goTo(STEPS[0].id, true);
      }
      return;
    }

    // Unknown or unreachable id → redirect to the first incomplete step.
    if (!isKnownStep(requested) || !isReachable(requested, state)) {
      goTo(firstIncompleteStep(state), true);
      return;
    }

    // Reachable id that differs from the reducer (e.g. browser Back/Forward):
    // sync it into state without pushing a new history entry.
    if (requested !== state.currentStep) {
      dispatch({ type: "GOTO_STEP", step: requested });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ---------- (2) DRAFT: restore prompt on mount ---------- */
  useEffect(() => {
    const draft = loadDraft<WizardState>();
    if (draft && draft.form) setShowRestore(true);
  }, []);

  /* ---------- (2) DRAFT: persist every change ---------- */
  useEffect(() => {
    // Don't re-persist the cleared seed after a successful submit.
    if (submittedRef.current) return;
    if (state.dirty) saveDraft(state);
  }, [state]);

  /* ---------- (3) BEFOREUNLOAD: warn on a dirty unsubmitted draft ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (state.dirty && !submittedRef.current) {
        e.preventDefault();
        // Legacy browsers read the return value; modern ones show a generic
        // string. The copy lives in `leaveWarning` for the in-app prompt.
        e.returnValue = t("leaveWarning");
        return e.returnValue;
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.dirty, t]);

  /* ---------- clean up any pending auto-advance timer on unmount ---------- */
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  /* ---------- forward / back navigation ---------- */
  const advance = useCallback(() => {
    const next = nextStep(state);
    if (next) goTo(next);
  }, [state, goTo]);

  const goBack = useCallback(() => {
    const prev = prevStep(state);
    if (prev) goTo(prev);
  }, [state, goTo]);

  /* ---------- (4) AUTO-ADVANCE: choice confirm ----------
   * The scaffold choice commits the actor-class value then marks the choice step
   * actively completed (unlocking the next step), and advances — IMMEDIATELY
   * under reduced motion, else after var(--dur) (UI-SPEC §2.3, WIZ-02). */
  const onChoiceConfirm = useCallback(
    (value: string) => {
      dispatch({ type: "SET_FIELD", field: "entityType", value });
      // Mark the choice step ACTIVELY completed so its seeded value no longer
      // gates reachability — a deep-link past an unanswered choice still redirects
      // back, but a confirmed one unlocks the next step (UI-SPEC §2.6).
      dispatch({ type: "COMPLETE_STEP", step: state.currentStep });
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (prefersReducedMotion()) {
        advance();
      } else {
        advanceTimer.current = setTimeout(advance, ADVANCE_DELAY_MS);
      }
    },
    [advance, state.currentStep],
  );

  /* ---------- (2) DRAFT: restore prompt actions ---------- */
  function resumeDraft() {
    const draft = loadDraft<WizardState>();
    if (draft && draft.form) {
      dispatch({ type: "RESTORE_DRAFT", draft: draft.form });
    }
    setShowRestore(false);
  }

  function discardDraft() {
    clearDraft();
    dispatch({ type: "RESET" });
    setShowRestore(false);
    goTo(STEPS[0].id, true);
  }

  /* ---------- (6) SUBMIT SKELETON ----------
   * Wired to the existing /api/submit choke point with the SubmitInput state
   * (the interim §8 field correspondence). Phase 31 fills the real review/copy;
   * the skeleton keeps the POST + GTM + reset + clearDraft contract so nothing
   * drifts. */
  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    let data: SubmitResult;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.form),
      });
      data = await res.json();
    } catch {
      data = { ok: false, message: t("error") };
    }

    setResult(data);
    setSubmitting(false);

    pushDataLayer(GTM_EVENTS.SUBMIT_CLICK, {
      success: data.ok,
      entityType: state.form.entityType,
      isAnonymous: state.form.isAnonymous,
    });

    if (data.ok) {
      submittedRef.current = true;
      clearDraft();
      dispatch({ type: "RESET" });
      goTo(STEPS[0].id, true);
    }
  }

  /* ---------- derived render values ---------- */
  const isFirst = prevStep(state) === null;
  const stepValid = stepDef?.requires ? stepDef.requires(state.form) : true;
  const stepTitle = stepDef ? t(stepDef.titleKey as never) : "";
  const stepIndex = visibleStepIndex(state.currentStep, state);
  const stepTotal = visibleStepCount(state);
  // Scaffold choice options set the neutral actor-class value (individual vs
  // organization) — never an S1-S4 category. Both branches show the input step.
  const choiceOptions = [
    { value: "individual", title: t("typeIndividual" as never) },
    { value: "organization", title: t("typeOrganization" as never) },
  ];

  return (
    <div className="wizard">
      {showRestore && (
        <div className="legal mt-16 mb-16">
          <div className="t">{t("restoreDraftTitle")}</div>
          <p>{t("restoreDraftBody")}</p>
          <div className="wizard-nav flex-between mt-16">
            <button type="button" className="btn ghost" onClick={discardDraft}>
              {t("restoreDraftDiscard")}
            </button>
            <Button variant="primary" onClick={resumeDraft}>
              {t("restoreDraftResume")}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className={`legal mt-16 mb-16 ${result.ok ? "legal-success" : "legal-error"}`}>
          <div className="t">{result.ok ? t("success") : t("error")}</div>
          <p>{result.message}</p>
        </div>
      )}

      <WizardProgress state={state} onJump={(id) => goTo(id)} />

      <WizardPanel
        title={stepTitle}
        stepIndex={stepIndex}
        stepTotal={stepTotal}
      >
        {archetype === "choice" ? (
          <ChoiceStep
            ariaLabel={stepTitle}
            options={choiceOptions}
            value={state.form.entityType}
            onConfirm={onChoiceConfirm}
          />
        ) : (
          <InputStep
            fieldId="wizard-scaffold-input"
            label={stepTitle}
            value={state.form.entityName}
            dispatch={dispatch}
          />
        )}
      </WizardPanel>

      <WizardNav
        isFirst={isFirst}
        archetype={archetype}
        stepValid={stepValid}
        onBack={goBack}
        onNext={nextStep(state) ? advance : handleSubmit}
      />
    </div>
  );
}

export default WizardClient;
