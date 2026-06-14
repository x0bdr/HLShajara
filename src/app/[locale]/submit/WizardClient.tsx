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
 * raw-HTML injection anywhere. The `?step=` guard is UX only.
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
import {
  CONDUCT_SLUGS,
  ROLE_SLUGS,
  ROLE_CLAUSE_TOKEN,
  encodeRoleClause,
  stripRoleClause,
  type RoleSlug,
} from "@/lib/wizard/encoding";

import { resolveRejection } from "@/lib/wizard/rejection-map";

import { WizardProgress } from "@/components/wizard/WizardProgress";
import { WizardNav } from "@/components/wizard/WizardNav";
import { WizardPanel } from "@/components/wizard/WizardPanel";
import { ChoiceStep } from "@/components/wizard/ChoiceStep";
import { InputStep } from "@/components/wizard/InputStep";
import { IdentityStep } from "@/components/wizard/IdentityStep";
import { DescribeStep } from "@/components/wizard/DescribeStep";
import { EvidenceStep } from "@/components/wizard/EvidenceStep";
import { MediaStep } from "@/components/wizard/MediaStep";
import { AboutYouStep } from "@/components/wizard/AboutYouStep";
import ReviewStep from "@/components/wizard/ReviewStep";

/**
 * Local sentinel for "the user picked An entity but has not yet chosen a subtype".
 * Tracked in React state (NOT the SubmitInput form) so a non-enum value never
 * enters `entityType`; Step 1b resolves it to a real enum literal. Used only to
 * render the entity card selected on Back before a subtype is committed.
 */
const ENTITY_MARKER = "entity-marker";

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

/** A string that is non-empty after trimming. */
function hasText(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Build the /api/submit payload from the wizard form, OMITTING every optional
 * string that is empty/whitespace rather than sending it as "" (BLOCKER 2). The
 * server schema marks these `.min(1).optional()` / `.email()`, so an explicit ""
 * is REJECTED (e.g. an untitled source link 400s "sourceLinks: Too small"). The
 * Zod contract already accepts the key being ABSENT, so dropping empties — never
 * sending "" — is the correct client-side fix (validation.ts is the shared
 * contract and stays untouched). Required strings (entityName, entityRole,
 * allegationDescription, source url) are passed through verbatim; their own
 * gates already block empty values upstream.
 */
function buildSubmitPayload(form: SubmitInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    entityName: form.entityName,
    entityType: form.entityType,
    entityRole: form.entityRole,
    allegationDescription: form.allegationDescription,
    sourceFiles: form.sourceFiles,
    isAnonymous: form.isAnonymous,
    sourceLinks: form.sourceLinks.map((link) => {
      const row: Record<string, unknown> = { url: link.url };
      if (hasText(link.title)) row.title = link.title.trim();
      // `sourceType` is `.optional()` with no empty-string union member — only
      // send it when it's a real slug (interim encoding keeps it on the title for
      // now, but guard regardless so a future first-class field never sends "").
      const sourceType = (link as { sourceType?: unknown }).sourceType;
      if (hasText(sourceType)) row.sourceType = sourceType.trim();
      return row;
    }),
  };
  // Top-level optionals: omit when empty/whitespace (each is `.optional()` or
  // `.email().or(literal(""))` — but "" round-trips cleaner as absent).
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
  /** Server-issued reference id on success ({ ok:true, submissionId, message }). */
  submissionId?: number;
}

export function WizardClient() {
  const t = useTranslations("submit");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Step-9 affirmation checkbox (REV-02). UX-only gate; the server screen on
  // /api/submit stays authoritative (T-31-08). Reset on RESET / "Submit another".
  const [affirmed, setAffirmed] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  // `state.entityChosen` (reducer-owned) is the single source of truth for "the
  // user picked An entity but has not committed a subtype yet" — it drives both
  // the entity card's selected-on-Back state AND the registry branch/count so
  // `entity-subtype` is reachable + counted, WITHOUT writing a non-enum value to
  // entityType (S2-S4 / T-29-06). Aliased locally for readability.
  const entityChosen = state.entityChosen;
  // Transient orphan-invalidation notice shown when an actor-class switch on Back
  // clears the entity-subtype answer. Cleared on the next navigation/confirm.
  const [showSubtypeNotice, setShowSubtypeNotice] = useState(false);
  const submittedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest state mirror — the deferred auto-advance timer (and the confirm path
  // that dispatches an actor-class change immediately before advancing) must read
  // POST-dispatch state, not the stale render closure. Without this, picking "An
  // entity" then auto-advancing would compute `nextStep` from the pre-dispatch
  // state (entityChosen=false) and SKIP `entity-subtype` — the BLOCKER-1 trap.
  const stateRef = useRef(state);

  // Widen to the declared `StepDef` so optional `requires`/`titleKey`/`branchWhen`
  // are accessible — the `as const` STEPS narrows each member to its literal
  // shape, dropping the optional props from members that omit them.
  const stepDef: StepDef | undefined = STEPS.find((s) => s.id === state.currentStep);
  const archetype: StepArchetype = stepDef?.archetype ?? "choice";

  /* ---------- keep the latest-state mirror synced (post-render) ----------
   * The deferred auto-advance timer reads `stateRef.current` so it branches on
   * POST-dispatch state. Syncing in an effect (not during render) keeps it
   * lint-clean while still updating before any timer fires. */
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    // Read the freshest state via the ref so a just-dispatched actor-class change
    // (e.g. CHOOSE_ENTITY_CLASS) is reflected before `nextStep` branches.
    const next = nextStep(stateRef.current);
    if (next) goTo(next);
  }, [goTo]);

  const goBack = useCallback(() => {
    // Back is an explicit navigation — clear any transient invalidation notice.
    setShowSubtypeNotice(false);
    const prev = prevStep(state);
    if (prev) goTo(prev);
  }, [state, goTo]);

  /* ---------- (4) AUTO-ADVANCE: shared post-confirm advance ----------
   * Marks the current choice step ACTIVELY completed (unlocking the next step —
   * a deep-link past an unanswered choice still redirects back, UI-SPEC §2.6),
   * then advances IMMEDIATELY under reduced motion, else after var(--dur)
   * (UI-SPEC §2.3, WIZ-02). The advance is armed ONLY here, never on mount/URL-
   * sync, so returning via Back never re-auto-advances. Re-confirming the same
   * card on Back still routes through here, so a re-confirm advances. */
  const completeAndAdvance = useCallback(
    (nextOverride?: StepId) => {
      dispatch({ type: "COMPLETE_STEP", step: state.currentStep });
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      // When the confirm KNOWS its branch target (e.g. "An entity" → entity-subtype),
      // it passes `nextOverride` so the advance never has to recompute `nextStep`
      // from a not-yet-committed dispatch (the stale-closure trap that would skip
      // entity-subtype). Otherwise the ref-backed `advance` resolves the next step.
      const run = nextOverride ? () => goTo(nextOverride) : advance;
      if (prefersReducedMotion()) {
        run();
      } else {
        advanceTimer.current = setTimeout(run, ADVANCE_DELAY_MS);
      }
    },
    [advance, goTo, state.currentStep],
  );

  /* ---------- per-step interim-encoding confirm dispatch ----------
   * Each choice step encodes its pick onto the EXISTING /api/submit contract
   * (Plan 29-01 encoding): actor-class/entity-subtype → entityType (enum only),
   * conduct → allegationClassification slug, role-in-act → the entityRole clause.
   * The entity card NEVER writes a non-enum literal to entityType — it records a
   * local marker and lets Step 1b commit one of the five enum literals. */
  const onChoiceConfirm = useCallback(
    (value: string) => {
      // Explicit next-step target for branch-changing confirms whose dispatch
      // hasn't committed yet (avoids recomputing nextStep from stale state).
      let nextOverride: StepId | undefined;
      switch (state.currentStep) {
        case "actor-class": {
          // Was the branch already committed to entity (subtype answered, or the
          // entity marker set)? Detect an actual actor-class CHANGE on Back.
          const wasEntity = entityChosen || state.form.entityType !== "individual";
          if (value === "individual") {
            // Switching FROM entity TO individual on Back orphans the subtype:
            // invalidate ONLY entity-subtype (rewrite entityType to "individual",
            // preserve conduct/role) and surface the transient aria-live notice.
            if (wasEntity) {
              dispatch({ type: "INVALIDATE_SUBTYPE", entityType: "individual" });
              setShowSubtypeNotice(true);
            } else {
              dispatch({ type: "SET_FIELD", field: "entityType", value: "individual" });
              setShowSubtypeNotice(false);
            }
            // Both paths clear `entityChosen` (INVALIDATE_SUBTYPE/SET_FIELD do so
            // when entityType becomes "individual"), so no extra dispatch needed.
            // The individual branch's next step is always `identity` (entity-subtype
            // skipped) — target it explicitly so the advance doesn't recompute from
            // pre-dispatch state still carrying the entity branch.
            nextOverride = "identity";
          } else {
            // "An entity" — mark the entity branch active (reducer-owned
            // `entityChosen`) so `entity-subtype` is REACHABLE + COUNTED, without
            // committing a non-enum value to entityType. Step 1b commits the real
            // subtype enum. A switch from the individual branch has no orphan to
            // clear (individual carries no subtype answer).
            dispatch({ type: "CHOOSE_ENTITY_CLASS" });
            setShowSubtypeNotice(false);
            // The entity branch's next step is always Step 1b — target it
            // explicitly so the advance doesn't recompute from pre-dispatch state.
            nextOverride = "entity-subtype";
            // entityType stays whatever Step 1b last committed (or the seed); the
            // requires() gate keeps entity-subtype reachable-but-incomplete until
            // a real subtype enum is picked.
          }
          break;
        }
        case "entity-subtype": {
          // value is one of organization/military_unit/security_branch/official_body.
          dispatch({ type: "SET_FIELD", field: "entityType", value });
          setShowSubtypeNotice(false);
          break;
        }
        case "conduct": {
          // value is a CONDUCT_SLUGS slug. Conduct "other" durably encodes
          // allegationClassification="other"; Phase-30 Step 5 reads
          // `allegationClassification === "other"` to mark the description
          // required-to-name-the-act. triageCategory is NOT set here (Phase 33).
          dispatch({ type: "SET_FIELD", field: "allegationClassification", value });
          setShowSubtypeNotice(false);
          break;
        }
        case "role-in-act": {
          // value is a ROLE_SLUGS slug — append the clause to entityRole, stripping
          // any prior clause first so a re-pick on Back REPLACES (no stacking).
          dispatch({
            type: "SET_FIELD",
            field: "entityRole",
            value: encodeRoleClause(stripRoleClause(state.form.entityRole), value as RoleSlug),
          });
          setShowSubtypeNotice(false);
          break;
        }
        default:
          break;
      }
      completeAndAdvance(nextOverride);
    },
    [state.currentStep, state.form.entityType, state.form.entityRole, entityChosen, completeAndAdvance],
  );

  /* ---------- (2) DRAFT: restore prompt actions ---------- */
  function resumeDraft() {
    const draft = loadDraft<WizardState>();
    if (draft && draft.form) {
      const action = { type: "RESTORE_DRAFT", draft: draft.form } as const;
      dispatch(action);
      setShowRestore(false);
      // MED: restoring the FORM is not enough — also land the user on the step they
      // left off (draft.currentStep), not back on actor-class. Compute the restored
      // state locally (the dispatch above is async) to test reachability with the
      // recomputed `completed`/`entityChosen`; navigate there only if it is a known,
      // reachable step, else fall to the first genuinely-incomplete step.
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

  /* ---------- (6) SUBMIT + CONFIRMATION + REJECTION ROUTING (REV-03/REV-04) ----
   * POSTs the assembled SubmitInput to the existing /api/submit choke point. The
   * body serializes the FULL `state.form`, so the optional `leadNote` rides along
   * verbatim when set (the route now PERSISTS it — Phase 33 / BE-02 has landed).
   *
   * On success ({ ok:true, submissionId, message }): clear the draft + fire GTM,
   * but DO NOT reset/redirect — the success `.legal-success` panel replaces the
   * wizard chrome and the reset happens only when the user clicks "Submit another".
   *
   * On rejection ({ ok:false, code, message }): resolve the code via the closed
   * rejection map; a known code → goTo(route.stepId) (a real registry id) and
   * show t(route.messageKey) in the reused `.legal-error` panel at that step. An
   * unknown/garbage code (VALIDATION_ERROR, network) → generic error, stay put
   * (T-31-07). The draft is NEVER cleared on error. */
  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    let data: SubmitResult;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Omit empty optional strings so the server schema's `.min(1).optional()`
        // fields never 400 on an "" (BLOCKER 2 — untitled sources are valid).
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
      // Confirmation: keep the user on the success panel (no RESET here — that is
      // deferred to "Submit another"). Clear the draft so it never persists past a
      // completed submission (T-31-10).
      submittedRef.current = true;
      clearDraft();
      setResult(data);
      return;
    }

    // Rejection: route the (untrusted) code back to the offending step if known.
    const route = resolveRejection(data.code ?? "");
    if (route) {
      setResult({ ok: false, message: t(route.messageKey as never), code: data.code });
      goTo(route.stepId as StepId);
    } else {
      // Unknown / VALIDATION_ERROR / network — generic error, stay on review.
      setResult({ ok: false, message: data.message || t("error"), code: data.code });
    }
  }

  /* ---------- "Submit another" — full reset back to step 1 ---------- */
  function submitAnother() {
    setResult(null);
    setAffirmed(false);
    setSubmitting(false);
    submittedRef.current = false;
    clearDraft();
    dispatch({ type: "RESET" });
    goTo(STEPS[0].id, true);
  }

  /* ---------- derived render values ---------- */
  const isFirst = prevStep(state) === null;
  const stepValid = stepDef?.requires ? stepDef.requires(state.form) : true;
  const stepTitle = stepDef ? t(stepDef.titleKey as never) : "";
  const stepIndex = visibleStepIndex(state.currentStep, state);
  const stepTotal = visibleStepCount(state);
  // The terminal review step (appended to the registry by Plan 31-01). Detect via
  // the real "review" id, anchored to the registry's last step so it can't drift.
  const isReview =
    state.currentStep === "review" &&
    STEPS[STEPS.length - 1].id === "review";
  // Submission confirmed — the success panel replaces the wizard chrome entirely.
  const submitted = result?.ok === true;

  /* ---------- per-step ChoiceStep options + selected value ----------
   * Options resolve their titles/defs through the Plan 29-02 `submit` keys. The
   * `value` is the current form value so the prior card renders selected+focused
   * on Back (ChoiceStep focuses the matching card only when value is non-empty).
   * All sets are CLOSED (S1-S4): every card is a specific ACT or an entity-type
   * enum — never a person's group, belief, or occupation target. */
  let choiceOptions: ReadonlyArray<{ value: string; title: string; desc?: string }> = [];
  let choiceValue = "";

  switch (state.currentStep) {
    case "actor-class":
      choiceOptions = [
        {
          value: "individual",
          title: t("actorIndividual" as never),
          desc: t("actorIndividualHint" as never),
        },
        {
          value: ENTITY_MARKER,
          title: t("actorEntity" as never),
          desc: t("actorEntityHint" as never),
        },
      ];
      // Selected = individual when committed; else (entityType is already one of
      // the four entity enums OR the user just picked "An entity") the marker.
      // `entityChosen` is folded in so the marker shows even before a subtype is
      // committed, but it never widens entityType past its enum (S2-S4 / T-29-06).
      choiceValue =
        state.form.entityType === "individual"
          ? entityChosen
            ? ENTITY_MARKER
            : state.completed.includes("actor-class")
              ? "individual"
              : ""
          : ENTITY_MARKER;
      break;
    case "entity-subtype":
      choiceOptions = [
        { value: "organization", title: t("typeOrganization" as never) },
        { value: "military_unit", title: t("typeMilitaryUnit" as never) },
        { value: "security_branch", title: t("typeSecurityBranch" as never) },
        { value: "official_body", title: t("typeOfficialBody" as never) },
      ];
      // Pre-select only once a real entity subtype enum is committed.
      choiceValue =
        state.form.entityType === "individual" ? "" : state.form.entityType;
      break;
    case "conduct":
      choiceOptions = CONDUCT_SLUGS.map((slug) => ({
        value: slug,
        title: t(`conduct_${slug}` as never),
        desc: t(`conduct_${slug}_def` as never),
      }));
      choiceValue = state.form.allegationClassification ?? "";
      break;
    case "role-in-act":
      choiceOptions = ROLE_SLUGS.map((slug) => ({
        value: slug,
        title: t(`role_${slug}` as never),
      }));
      // Parse the prior role slug out of the entityRole clause for selected-on-Back.
      choiceValue = state.form.entityRole.includes(ROLE_CLAUSE_TOKEN)
        ? state.form.entityRole.split(ROLE_CLAUSE_TOKEN).pop() ?? ""
        : "";
      break;
    default:
      break;
  }

  /* ---------- CONFIRMATION: success replaces the wizard chrome entirely ---------- */
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

      {/* Rejection / generic error panel (success is handled by the early return
          above). On a server rejection this shows t(messageKey) at the offending
          step after goTo routes the user there; the draft is NOT cleared. */}
      {result && !result.ok && (
        <div className="legal legal-error mt-16 mb-16" role="alert">
          <div className="t">{t("error")}</div>
          <p>{result.message}</p>
        </div>
      )}

      <WizardProgress state={state} onJump={(id) => goTo(id)} />

      <WizardPanel
        title={stepTitle}
        stepIndex={stepIndex}
        stepTotal={stepTotal}
      >
        {/* Transient orphan-invalidation notice (CONTEXT Success Criterion 4):
            a one-line `.legal` block — NOT a modal/toast. role="status" is an
            implicit polite live region; the explicit live attr is omitted so the
            wizard keeps exactly ONE step-announcer region (the WizardPanel).
            Shown when an actor-class switch on Back cleared the entity-subtype
            answer; clears on the next navigation/confirm. */}
        {showSubtypeNotice && (
          <div className="legal mb-16" role="status">
            <p>{t("invalidateSubtypeNotice")}</p>
          </div>
        )}
        {/* Render dispatch: the terminal review step renders <ReviewStep>; choice
            steps render the ChoiceStep; the Phase-30 input steps each render their
            own component, routed by currentStep. The Next gate follows from
            `stepValid` (registry `requires`). The scaffold InputStep is the
            defensive fallback for any other input id. */}
        {isReview ? (
          <ReviewStep
            form={state.form}
            affirmed={affirmed}
            submitting={submitting}
            onEdit={(id) => goTo(id as StepId)}
            onAffirmChange={setAffirmed}
            onSubmit={handleSubmit}
          />
        ) : archetype === "choice" ? (
          <ChoiceStep
            ariaLabel={stepTitle}
            options={choiceOptions}
            value={choiceValue}
            onConfirm={onChoiceConfirm}
          />
        ) : state.currentStep === "identity" ? (
          <IdentityStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "describe" ? (
          <DescribeStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "evidence" ? (
          <EvidenceStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "media" ? (
          <MediaStep form={state.form} dispatch={dispatch} />
        ) : state.currentStep === "about-you" ? (
          <AboutYouStep form={state.form} dispatch={dispatch} />
        ) : (
          <InputStep
            fieldId="wizard-scaffold-input"
            label={stepTitle}
            value={state.form.entityName}
            dispatch={dispatch}
          />
        )}
      </WizardPanel>

      {/* On the review step, submission flows ONLY through ReviewStep's own Submit
          button — suppress the scaffold WizardNav Submit path to avoid a double
          Submit control. Back is still available via the registry nav below. */}
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
