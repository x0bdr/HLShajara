/**
 * Wizard interim-encoding layer (Plan 29-01, STEP-01 + STEP-03).
 *
 * Pure, framework-free module. NO JSX, NO React, NO `"use client"`. Mirrors the
 * `as const` typed-config style of `registry.ts` so it strips to zero runtime
 * dependencies and is drivable directly under Node `--experimental-strip-types`.
 *
 * PURPOSE — map the Phase-29 choice-card picks onto the EXISTING `/api/submit`
 * Zod contract (`src/lib/validation.ts`) WITHOUT touching that schema:
 *
 *  - Conduct cards write a stable English SLUG to `allegationClassification`
 *    (`z.string().max(100).optional()`). Each slug matches its i18n key suffix
 *    exactly (`conduct_<slug>`), so Phase 33 (BE-01) maps slug → the real
 *    `conductType` enum 1:1 with no localized-text parsing. Every slug is well
 *    under the max100 limit.
 *  - Role-in-act is encoded by APPENDING a stable, parseable clause to the
 *    documented `entityRole` text via `ROLE_CLAUSE_TOKEN`. Phase 33 (BE-06)
 *    extracts this clause into the first-class `roleInConduct` field; the stable
 *    token lets it strip the clause deterministically. `encodeRoleClause` strips
 *    any prior clause first so a re-pick on Back REPLACES rather than stacks —
 *    `entityRole` can never grow past max500 from repeated confirms (T-29-01/07).
 *
 * The conduct slug "other" pairs with the Step-5 description being
 * REQUIRED-TO-NAME-THE-ACT — but that required-flag is consumed in Plan 29-03
 * (the wizard reads `allegationClassification === "other"`); this module only
 * defines the slug. `triageCategory` is NOT set anywhere here — it is deferred
 * entirely to Phase 33 (BE-01).
 *
 * S2-S4: the conduct and role sets below are CLOSED. Every slug names a SPECIFIC
 * ACT (what was done), never a person's group, belief, or occupation category —
 * the banned-target registers are absent by construction and verified by a
 * grep-absence acceptance criterion.
 */

/* ---------- CONDUCT SLUGS (Step 3) ---------- */

/**
 * The 14 conduct slugs in UI-SPEC §3 order: 5 perpetrator acts, then 8
 * support-network acts, then "other" LAST. Each value equals its i18n key
 * suffix (`conduct_<slug>`) and is ≤ 100 chars (allegationClassification max100).
 */
export const CONDUCT_SLUGS = [
  // Perpetrator acts (5)
  "detention",
  "torture",
  "disappearance",
  "killing",
  "sexualViolence",
  // Support-network acts (8)
  "financing",
  "arms",
  "laundering",
  "propaganda",
  "informing",
  "seizure",
  "detentionSite",
  "command",
  // Other (always last)
  "other",
] as const satisfies ReadonlyArray<string>;

/** Union of the literal conduct slug strings. */
export type ConductSlug = (typeof CONDUCT_SLUGS)[number];

/* ---------- ROLE SLUGS (Step 4) ---------- */

/**
 * The 7 role-in-act slugs in UI-SPEC §3 order, "other" LAST. Each value equals
 * its i18n key suffix (`role_<slug>`).
 */
export const ROLE_SLUGS = [
  "perpetrator",
  "commander",
  "financier",
  "supplier",
  "informant",
  "owner",
  "other",
] as const satisfies ReadonlyArray<string>;

/** Union of the literal role slug strings. */
export type RoleSlug = (typeof ROLE_SLUGS)[number];

/* ---------- ROLE CLAUSE TOKEN + HELPERS ---------- */

/**
 * The stable separator token that prefixes the role slug appended to
 * `entityRole`. Documented for Phase 33 (BE-06), which strips this exact literal
 * to recover the base role and extract the slug. Leading space + em-dash so the
 * encoded value reads naturally, e.g.
 *   "Brigadier, Branch 215 — role in act: commander".
 */
export const ROLE_CLAUSE_TOKEN = " — role in act: ";

/**
 * Remove any trailing `ROLE_CLAUSE_TOKEN<slug>` clause from a value, returning
 * the base role unchanged when no token is present. Deterministic inverse of
 * `encodeRoleClause`: split on the token, keep the head, trim trailing
 * whitespace. Only the FIRST occurrence is treated as the clause boundary so a
 * base role that itself contained the token (unexpected) still strips to a
 * stable head.
 */
export function stripRoleClause(value: string): string {
  const idx = value.indexOf(ROLE_CLAUSE_TOKEN);
  if (idx === -1) return value;
  return value.slice(0, idx).replace(/\s+$/, "");
}

/**
 * Append `ROLE_CLAUSE_TOKEN + slug` to the base role, FIRST stripping any
 * existing clause so re-confirming a different role on Back REPLACES rather than
 * appends (idempotent — no double-append). Round-trips with `stripRoleClause`:
 * `stripRoleClause(encodeRoleClause(base, slug)) === base` for every base with no
 * pre-existing clause.
 */
export function encodeRoleClause(baseRole: string, slug: RoleSlug): string {
  return `${stripRoleClause(baseRole)}${ROLE_CLAUSE_TOKEN}${slug}`;
}
