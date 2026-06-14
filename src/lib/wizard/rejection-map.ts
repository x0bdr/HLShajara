/**
 * Rejection-routing lookup (Plan 31-01, REV-04).
 *
 * Pure, framework-free module — no JSX, no React, no client directive, and no
 * database / server-runtime imports. Mirrors the pure-module style of
 * `src/lib/screens.ts`; strips to zero runtime deps under Node
 * `--experimental-strip-types` (the `StepId` import is type-only).
 *
 * Maps each server rejection `code` (the eight-code cascade defined in
 * `src/lib/screens.ts` `runScreens` / `src/db/persist.ts` `validateSubmission`)
 * to a `{ messageKey, stepId }` pair per the LOCKED UI-SPEC §3 routing table.
 * `stepId` values are the CANONICAL registry slugs registered by Phase 30
 * (`identity` / `describe` / `evidence`) — NOT the friendly review-group names.
 * tsc enforces every `stepId` against the registry `StepId` union.
 *
 * On a failed POST, the client looks up `code` → `goTo(stepId)` and renders
 * `t(messageKey)` in the reused `.legal-error` panel at the offending step.
 *
 * Security (T-31-01): the map is a CLOSED `Record` keyed only by the eight known
 * codes, and `resolveRejection` returns `null` for any unknown/garbage code, so
 * an attacker-influenced `code` can never produce an attacker-chosen `goTo`
 * target — the null branch falls back to a generic error instead.
 */

import type { StepId } from "./registry";

/**
 * The eight server rejection codes (the `screens.ts` / `persist.ts` cascade
 * order: NO_SOURCE → WEAK_SOURCE → GROUP_TARGET → INCITEMENT → HATE_TONE →
 * INNOCENT_PARTY → PRIVATE_TARGETING → MISMATCH). Codes outside this set
 * (e.g. VALIDATION_ERROR / INTERNAL_ERROR) are deliberately NOT members and
 * resolve to `null` (generic error, stay on review).
 */
export type RejectionCode =
  | "NO_SOURCE"
  | "WEAK_SOURCE"
  | "GROUP_TARGET"
  | "INCITEMENT"
  | "HATE_TONE"
  | "INNOCENT_PARTY"
  | "PRIVATE_TARGETING"
  | "MISMATCH";

/** A rejection route: the i18n message key + the registry step to return to. */
export interface RejectionRoute {
  /** Key under the `submit` i18n namespace, resolved via `t(messageKey)`. */
  readonly messageKey: string;
  /** A real registry `StepId` (tsc-enforced) — `goTo(stepId)` returns here. */
  readonly stepId: StepId;
}

/**
 * LOCKED UI-SPEC §3 routing table (closed Record keyed by all eight codes):
 *   NO_SOURCE / WEAK_SOURCE       → err_sources  → evidence (Step 6)
 *   PRIVATE_TARGETING             → err_private  → describe (Step 5)
 *   GROUP_TARGET                  → err_group    → describe (Step 5)
 *   INNOCENT_PARTY                → err_innocent → describe (Step 5)
 *   INCITEMENT / HATE_TONE        → err_tone     → describe (Step 5)
 *   MISMATCH                      → err_mismatch → identity (Step 2)
 */
export const REJECTION_MAP: Record<RejectionCode, RejectionRoute> = {
  NO_SOURCE: { messageKey: "err_sources", stepId: "media-evidence" },
  WEAK_SOURCE: { messageKey: "err_sources", stepId: "media-evidence" },
  PRIVATE_TARGETING: { messageKey: "err_private", stepId: "experience" },
  GROUP_TARGET: { messageKey: "err_group", stepId: "experience" },
  INNOCENT_PARTY: { messageKey: "err_innocent", stepId: "experience" },
  INCITEMENT: { messageKey: "err_tone", stepId: "experience" },
  HATE_TONE: { messageKey: "err_tone", stepId: "experience" },
  MISMATCH: { messageKey: "err_mismatch", stepId: "entity-type-name" },
};

/** Type guard: is `code` one of the eight known rejection codes? */
function isRejectionCode(code: string): code is RejectionCode {
  return Object.prototype.hasOwnProperty.call(REJECTION_MAP, code);
}

/**
 * Resolve a server rejection `code` to its `{ messageKey, stepId }` route, or
 * `null` when `code` is unknown (so an unknown / VALIDATION_ERROR / garbage code
 * falls back to a generic error rather than driving a bad `goTo`).
 */
export function resolveRejection(code: string): RejectionRoute | null {
  return isRejectionCode(code) ? REJECTION_MAP[code] : null;
}
