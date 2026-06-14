/**
 * Pure DISPLAY helpers for the Step-9 review screen (Phase 31, REV-01/REV-02).
 *
 * Extracted from `ReviewStep.tsx` into a JSX-free sibling so they are unit-testable
 * via Node `--experimental-strip-types` (a `.tsx` cannot be loaded directly because
 * JSX is not strippable). `ReviewStep.tsx` re-exports both names, so the component's
 * public surface is unchanged. No React, no JSX — DISPLAY-only. The one runtime
 * import (`stripRoleClause` / `ROLE_CLAUSE_TOKEN`) is from the framework-free,
 * zero-dependency `@/lib/wizard/encoding` (also pure), so this stays bundler- and
 * server-safe (route.ts imports `stripSourceType` from here).
 */

import { stripRoleClause, ROLE_CLAUSE_TOKEN } from "@/lib/wizard/encoding";

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

/* ---------- v1.4 DISPLAY-ONLY LOCALIZATION HELPERS ---------- */
// These map the raw SUBMITTED slugs/enums to the `submit.*` i18n KEY a label
// should render under. They NEVER mutate the submitted payload — the wizard still
// sends `entityType`, `allegationClassification`, and the clause-appended
// `entityRole` byte-identically. The component resolves the returned key via
// `useTranslations("submit")`; a `null` return means "no localized label — show
// the raw value verbatim" (e.g. free-text "other" conduct).

/** The five entityType enum literals (mirrors the /api/submit `entityType` enum). */
const ENTITY_TYPE_KEYS: Record<string, string> = {
  individual: "typeIndividual",
  organization: "typeOrganization",
  military_unit: "typeMilitaryUnit",
  security_branch: "typeSecurityBranch",
  official_body: "typeOfficialBody",
};

/**
 * The `submit.*` i18n key for an entityType enum value, or `null` for an unknown
 * value (render the raw value verbatim). Display-only.
 */
export function entityTypeLabelKey(entityType: string | undefined | null): string | null {
  if (!entityType) return null;
  return ENTITY_TYPE_KEYS[entityType] ?? null;
}

/** The 14 closed conduct slugs (mirrors src/lib/constants/conduct.ts conductTypes). */
const CONDUCT_SLUG_SET = new Set([
  "detention", "torture", "disappearance", "killing", "sexualViolence",
  "financing", "arms", "laundering", "propaganda", "informing",
  "seizure", "detentionSite", "command", "other",
]);

/**
 * The `submit.conduct_<slug>` i18n key for a closed conduct slug, or `null` when
 * the value is empty, "other", or any free-text value — in which case the caller
 * renders the raw value verbatim (UI-SPEC: "other"/free text falls back). Display-only.
 */
export function conductLabelKey(classification: string | undefined | null): string | null {
  if (!classification) return null;
  const slug = classification.trim();
  if (slug === "" || slug === "other") return null;
  return CONDUCT_SLUG_SET.has(slug) ? `conduct_${slug}` : null;
}

/** The 7 closed role-in-act slugs (mirrors roleInConductTypes). */
const ROLE_SLUG_SET = new Set([
  "perpetrator", "commander", "financier", "supplier", "informant", "owner", "other",
]);

/**
 * The base documented role/title with the interim ` — role in act: <slug>` clause
 * stripped — what the Actor group should DISPLAY for the documented role (the raw
 * clause-appended `entityRole` is still SUBMITTED verbatim). Re-exports the pure
 * `stripRoleClause`. Display-only.
 */
export function displayDocumentedRole(entityRole: string | undefined | null): string {
  if (!entityRole) return "";
  return stripRoleClause(entityRole);
}

/**
 * Extract the role-in-act slug appended to `entityRole` (after `ROLE_CLAUSE_TOKEN`)
 * and return its `submit.role_<slug>` i18n key, or `null` when no clause is present
 * or the slug is "other"/unknown (caller renders the stripped role verbatim).
 * Display-only.
 */
export function roleInActLabelKey(entityRole: string | undefined | null): string | null {
  if (!entityRole) return null;
  const idx = entityRole.indexOf(ROLE_CLAUSE_TOKEN);
  if (idx === -1) return null;
  const slug = entityRole.slice(idx + ROLE_CLAUSE_TOKEN.length).trim();
  if (slug === "" || slug === "other") return null;
  return ROLE_SLUG_SET.has(slug) ? `role_${slug}` : null;
}
