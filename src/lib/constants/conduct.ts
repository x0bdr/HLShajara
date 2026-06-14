/**
 * HLShajara — shared conduct/role anti-drift constants (one source of truth).
 *
 * The 14 conduct slugs and 7 role slugs live HERE and ONLY here. Both the Drizzle
 * `pgEnum` definitions (src/db/schema.ts) and the Zod `z.enum` validators
 * (src/lib/validation.ts) IMPORT these tuples, so the client wizard and the server
 * intake path can never drift (the `allegationClassification` free-text lesson).
 *
 * Pure constants module: NO Drizzle and NO Zod imports here.
 *
 * Identity-free invariant (S2–S4): no sect / religion / ethnicity / tribe / loyalty
 * / profession slug may ever appear in these sets. The slug sets are closed and
 * reviewed; adding a slug is a deliberate, reviewable schema change.
 */

/**
 * The 14 conduct slugs in UI-SPEC §3 Step 3 order:
 * perpetrator acts first, then support-network acts, then `other`.
 */
export const conductTypes = [
  // perpetrator acts
  "detention",
  "torture",
  "disappearance",
  "killing",
  "sexualViolence",
  // support-network acts
  "financing",
  "arms",
  "laundering",
  "propaganda",
  "informing",
  "seizure",
  "detentionSite",
  // command
  "command",
  // catch-all
  "other",
] as const;

export type ConductType = (typeof conductTypes)[number];

/**
 * The 7 role-in-conduct slugs in UI-SPEC §3 Step 4 order (closed set).
 */
export const roleInConductTypes = [
  "perpetrator",
  "commander",
  "financier",
  "supplier",
  "informant",
  "owner",
  "other",
] as const;

export type RoleInConduct = (typeof roleInConductTypes)[number];

/**
 * The 4 triage buckets a conduct slug deterministically resolves to.
 */
export type TriageBucket =
  | "direct_perpetrator"
  | "enabler_network"
  | "chain_command"
  | "manual_review";

/**
 * Deterministic, exhaustive map from every conduct slug to its triage bucket:
 *   - the 5 perpetrator acts        -> "direct_perpetrator"
 *   - the 7 support-network acts    -> "enabler_network"
 *   - "command"                     -> "chain_command"
 *   - "other"                       -> "manual_review"
 *
 * Typed as `Record<ConductType, TriageBucket>` so a missing or extra key fails to
 * compile — the map can never silently lose coverage of a conduct slug.
 */
export const conductToTriageMap: Record<ConductType, TriageBucket> = {
  // direct perpetrator acts
  detention: "direct_perpetrator",
  torture: "direct_perpetrator",
  disappearance: "direct_perpetrator",
  killing: "direct_perpetrator",
  sexualViolence: "direct_perpetrator",
  // support-network / enabler acts
  financing: "enabler_network",
  arms: "enabler_network",
  laundering: "enabler_network",
  propaganda: "enabler_network",
  informing: "enabler_network",
  seizure: "enabler_network",
  detentionSite: "enabler_network",
  // chain of command
  command: "chain_command",
  // catch-all -> reviewer decides
  other: "manual_review",
};

/**
 * Resolve a conduct slug to its triage bucket.
 * Returns the "manual_review" fallback when the input is null/undefined or is not
 * a known conduct slug, so the intake path always derives a safe default bucket.
 */
export function triageFromConduct(
  conductType: ConductType | null | undefined
): TriageBucket {
  if (conductType && conductType in conductToTriageMap) {
    return conductToTriageMap[conductType];
  }
  return "manual_review";
}
