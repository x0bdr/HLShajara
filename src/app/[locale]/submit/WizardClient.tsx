"use client";

/**
 * WizardClient — root container for the v1.5 category-based report wizard.
 *
 * Wires the pure engine (reducer + registry + persistence) and the presentational
 * chrome into a one-step-per-page shell. The URL `?step=` is the source of truth
 * for the active step.
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
import type { SubmitInput } from "@/lib/validation";
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
import { resolveRejection } from "@/lib/wizard/rejection-map";
import { stepHintKey } from "@/lib/wizard/hints";

import { WizardProgress } from "@/components/wizard/WizardProgress";
import { WizardNav } from "@/components/wizard/WizardNav";
import { WizardPanel } from "@/components/wizard/WizardPanel";
import { ReportCategoryStep } from "@/components/wizard/ReportCategoryStep";
import { LocationInfoStep } from "@/components/wizard/LocationInfoStep";
import { EntityTypeNameStep } from "@/components/wizard/EntityTypeNameStep";
import { ReportDetailsStep } from "@/components/wizard/ReportDetailsStep";
import { ExperienceStep } from "@/components/wizard/ExperienceStep";
import { MediaEvidenceStep } from "@/components/wizard/MediaEvidenceStep";
import { AboutYouStep } from "@/components/wizard/AboutYouStep";
import ReviewStep from "@/components/wizard/ReviewStep";

const ADVANCE_DELAY_MS = 200;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isKnownStep(id: string): id is StepId {
  return STEPS.some((s) => s.id === id);
}

function hasText(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function buildSubmitPayload(form: SubmitInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    entityName: form.entityName,
    entityType: form.entityType,
    reportCategory: form.reportCategory,
    reportMetadata: form.reportMetadata,
    entityRole: form.entityRole,
    allegationDescription: form.allegationDescription,
    sourceFiles: form.sourceFiles,
    isAnonymous: form.isAnonymous,
    sourceLinks: form.sourceLinks
      .filter((link) => hasText(link.url))
      .map((link) => {
        const row: Record<string, unknown> = { url: link.url.trim() };
        if (hasText(link.title)) row.title = link.title.trim();
        const sourceType = (link as { sourceType?: unknown }).sourceType;
        if (hasText(sourceType)) row.sourceType = sourceType.trim();
        return row;
      }),
  };
  if (hasText(form.allegationPeriod)) payload.allegationPeriod = form.allegationPeriod.trim();
  if (hasText(form.allegationLocation)) payload.allegationLocation = form.allegationLocation.trim();
  if (hasText(form.allegationClassification))
    payload.allegationClassification = form.allegationClassification.trim();
  if (hasText(form.leadNote)) payload.leadNote = form.leadNote.trim();
  if (hasText(form.submitterEmail)) payload.submitterEmail = form.submitterEmail.trim();
  if (hasText(form.submitterName)) payload.submitterName = form.submitterName.trim();
  return payload;
}

interface SubmitResult {
  ok: boolean;
  message: string;
  code?: string;
  submissionId?: number;
}

export function WizardClient() {
  const t = useTranslations("submit");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [affirmed, setAffirmed] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const submittedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  const stepDef: StepDef | undefined = STEPS.find((s) => s.id === state.currentStep);
  const archetype: StepArchetype = stepDef?.archetype ?? "choice";

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const goTo = useCallback(
    (id: StepId, replace = false) => {
      dispatch({ type: "GOTO_STEP", step: id });
      const href = { pathname: "/submit", query: { step: id } };
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const requested = searchParams.get("step");

    if (!requested) {
      if (state.currentStep !== STEPS[0].id) {
        goTo(STEPS[0].id, true);
      }
      return;
    }

    if (!isKnownStep(requested) || !isReachable(requested, state)) {
      goTo(firstIncompleteStep(state), true);
      return;
    }

    if (requested !== state.currentStep) {
      dispatch({ type: "GOTO_STEP", step: requested });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const draft = loadDraft<WizardState>();
    if (draft && draft.form) setShowRestore(true);
  }, []);

  useEffect(() => {
    if (submittedRef.current) return;
    if (state.dirty) saveDraft(state);
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (state.dirty && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = t("leaveWarning");
        return e.returnValue;
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.dirty, t]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const advance = useCallback(() => {
    const next = nextStep(stateRef.current);
    if (next) goTo(next);
  }, [goTo]);

  const goBack = useCallback(() => {
    const prev = prevStep(state);
    if (prev) goTo(prev);
  }, [state, goTo]);

  const completeAndAdvance = useCallback(
    (nextOverride?: StepId) => {
      dispatch({ type: "COMPLETE_STEP", step: state.currentStep });
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      const run = nextOverride ? () => goTo(nextOverride) : advance;
      if (prefersReducedMotion()) {
        run();
      } else {
        advanceTimer.current = setTimeout(run, ADVANCE_DELAY_MS);
      }
    },
    [advance, goTo, state.currentStep],
  );

  const onChoiceConfirm = useCallback(
    (value: string) => {
      if (state.currentStep === "report-category") {
        dispatch({ type: "SET_FIELD", field: "reportCategory", value });
      }
      completeAndAdvance();
    },
    [state.currentStep, completeAndAdvance],
  );

  function resumeDraft() {
    const draft = loadDraft<WizardState>();
    if (draft && draft.form) {
      const action = { type: "RESTORE_DRAFT", draft: draft.form } as const;
      dispatch(action);
      setShowRestore(false);
      const restored = wizardReducer(state, action);
      const saved = draft.currentStep;
      const target =
        typeof saved === "string" && isKnownStep(saved) && isReachable(saved, restored)
          ? saved
          : firstIncompleteStep(restored);
      goTo(target, true);
      return;
    }
    setShowRestore(false);
  }

  function discardDraft() {
    clearDraft();
    dispatch({ type: "RESET" });
    setAffirmed(false);
    setShowRestore(false);
    goTo(STEPS[0].id, true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    let data: SubmitResult;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmitPayload(state.form)),
      });
      data = await res.json();
    } catch {
      data = { ok: false, message: t("error") };
    }

    setSubmitting(false);

    pushDataLayer(GTM_EVENTS.SUBMIT_CLICK, {
      success: data.ok,
      entityType: state.form.entityType,
      isAnonymous: state.form.isAnonymous,
    });

    if (data.ok) {
      submittedRef.current = true;
      clearDraft();
      setResult(data);
      return;
    }

    const route = resolveRejection(data.code ?? "");
    if (route) {
      setResult({ ok: false, message: t(route.messageKey as never), code: data.code });
      goTo(route.stepId as StepId);
    } else {
      setResult({ ok: false, message: data.message || t("error"), code: data.code });
    }
  }

  function submitAnother() {
    setResult(null);
    setAffirmed(false);
    setSubmitting(false);
    submittedRef.current = false;
    clearDraft();
    dispatch({ type: "RESET" });
    goTo(STEPS[0].id, true);
  }

  const isFirst = prevStep(state) === null;
  const stepValid = stepDef?.requires ? stepDef.requires(state.form) : true;
  const stepTitle = stepDef ? t(stepDef.titleKey as never) : "";
  const hintKey = stepHintKey(state.currentStep, state.form);
  const stepHint = hintKey ? t(hintKey as never) : null;
  const stepIndex = visibleStepIndex(state.currentStep, state);
  const stepTotal = visibleStepCount(state);
  const isReview = state.currentStep === "review";
  const submitted = result?.ok === true;

  if (submitted) {
    return (
      <div className="wizard">
        <div className="legal legal-success mt-16 mb-16" role="status">
          <div className="t">{t("successTitle")}</div>
          <p>{t("successBody")}</p>
          <p className="mt-16">
            {t("referenceIdLabel")}:{" "}
            <span className="ds-mono">{result?.submissionId}</span>
          </p>
          <div className="wizard-nav flex-between mt-16">
            <Button variant="primary" onClick={submitAnother}>
              {t("submitAnother")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      {result && !result.ok && (
        <div className="legal legal-error mt-16 mb-16" role="alert">
          <div className="t">{t("error")}</div>
          <p>{result.message}</p>
        </div>
      )}

      <WizardProgress state={state} onJump={(id) => goTo(id)} />

      <WizardPanel title={stepTitle} stepIndex={stepIndex} stepTotal={stepTotal}>
        {isReview ? (
          <ReviewStep
            form={state.form}
            affirmed={affirmed}
            submitting={submitting}
            onEdit={(id) => goTo(id as StepId)}
            onAffirmChange={setAffirmed}
            onSubmit={handleSubmit}
          />
        ) : state.currentStep === "report-category" ? (
          <ReportCategoryStep
            form={state.form}
            dispatch={dispatch}
            onConfirm={onChoiceConfirm}
          />
        ) : state.currentStep === "location-info" ? (
          <LocationInfoStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "entity-type-name" ? (
          <EntityTypeNameStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "report-details" ? (
          <ReportDetailsStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "experience" ? (
          <ExperienceStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "media-evidence" ? (
          <MediaEvidenceStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "about-you" ? (
          <AboutYouStep form={state.form} dispatch={dispatch} />
        ) : null}

        {!isReview && stepHint ? (
          <div className="filter-notice mt-16" role="status">
            {stepHint}
          </div>
        ) : null}
      </WizardPanel>

      <WizardNav
        isFirst={isFirst}
        archetype={isReview ? "choice" : archetype}
        stepValid={stepValid}
        onBack={goBack}
        onNext={nextStep(state) ? advance : handleSubmit}
      />
    </div>
  );
}

export default WizardClient;
