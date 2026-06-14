/**
 * Pure DISPLAY helpers for the Step-9 review screen (Phase 31, REV-01/REV-02).
 *
 * Extracted from `ReviewStep.tsx` into a JSX-free sibling so they are unit-testable
 * via Node `--experimental-strip-types` (a `.tsx` cannot be loaded directly because
 * JSX is not strippable). `ReviewStep.tsx` re-exports both names, so the component's
 * public surface is unchanged. No React, no JSX, no runtime deps — DISPLAY-only.
 */

/** The six valid source-type slugs (Phase 30 §8 interim `[TYPE: <slug>]` token). */
const SOURCE_TYPE_RE = /^\[TYPE:\s*(un|court|sanctions|hr|journalism|official)\]\s*/;

/**
 * DISPLAY-only split of a source title. When the title is prefixed with a
 * `[TYPE: <slug>] ` token, returns the captured slug + the remainder; otherwise
 * `{ type: null, title: rawTitle }`. NEVER mutates the input — the raw
 * `[TYPE: <slug>]`-prefixed title is submitted verbatim by Plan 03. Idempotent.
 */
export function stripSourceType(rawTitle: string): { type: string | null; title: string } {
  const m = SOURCE_TYPE_RE.exec(rawTitle);
  if (!m) return { type: null, title: rawTitle };
  return { type: m[1], title: rawTitle.slice(m[0].length) };
}

/**
 * Render helper for optional fields: returns the em-dash "—" sentinel when `v`
 * is nullish or trims to empty, else `v` unchanged. Empty optionals are SHOWN
 * (never hidden) so the submitter sees exactly what will be sent.
 */
export function displayValue(v: string | undefined | null): string {
  if (v == null || v.trim() === "") return "—";
  return v;
}
