/**
 * Wizard draft persistence (Plan 28-03, WIZ-05).
 *
 * SSR-safe `sessionStorage` save/load/clear for the in-progress submission draft.
 * Pure utility — NO React, NO JSX, NO `"use client"`. Mirrors the
 * `typeof window !== "undefined"` SSR-guard idiom of `src/lib/gtm.ts:7-14`.
 *
 * Storage choice is a security decision (T-28-05): `sessionStorage` (cleared on
 * tab close), NOT `localStorage`, so a draft holding submitter-entered values
 * does not survive on a shared device. `clearDraft()` is also called on
 * successful submit and on explicit "Start over" (wired in Plan 05); the
 * shared-device caveat is surfaced in the restore-notice copy.
 *
 * Every function early-returns under SSR and is wrapped in try/catch so a
 * malformed or over-quota draft can never throw (T-28-06): `loadDraft` returns
 * `null` on any parse failure; `saveDraft`/`clearDraft` swallow quota errors.
 */

/** Exact draft key (UI-SPEC §2.5). Versioned so a future shape change can migrate. */
const KEY = "hls.submit.draft.v1";

/** Serialize the wizard state to `sessionStorage`. No-op under SSR / on quota error. */
export function saveDraft(state: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or storage disabled — drafts are best-effort, never fatal */
  }
}

/**
 * Read the draft from `sessionStorage`. Returns `null` under SSR, when no draft
 * exists, or when the stored value is malformed (never throws — T-28-06).
 */
export function loadDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Remove the draft (successful submit / explicit "Start over"). No-op under SSR. */
export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* storage disabled — nothing to clear */
  }
}
