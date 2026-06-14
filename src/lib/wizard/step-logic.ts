/**
 * Wizard input-step logic (Phase 30, STEP-02/STEP-04/EV-01/EV-04).
 *
 * Pure, framework-free logic layer that every Phase-30 input step consumes:
 * coarse-location composition, the idempotent §8 source-type title token, the
 * per-step inline screen runners (in the EXACT server order), the ≥2-source
 * count helper, the media-link screen, and the five step `requires` predicates.
 *
 * NO JSX, NO React, NO client directive. The `SubmitInput` import is type-only,
 * so it is erased at runtime; the screen functions imported from `../screens`
 * are runtime-pure (zero server imports), so this module is drivable directly
 * under Node `--experimental-strip-types` via the same off-thread ESM resolve
 * hook the Phase-29 regression script uses (scripts/wizard-choice-steps-check.js).
 * The screen import is RELATIVE (not the `@/` alias) for the same reason
 * `registry.ts` imports `./encoding` relatively — Node's raw loader resolves a
 * value-side runtime import only by path under `moduleResolution: "bundler"`.
 * The safety-critical regexes live ONLY in `src/lib/screens.ts` —
 * this module calls them, never reimplements them (T-30-01: client/server screens
 * cannot drift).
 */

import type { SubmitInput } from "../validation";
import {
  screenMismatch,
  screenText,
  screenInnocentParty,
  screenPrivateTargeting,
  type PersistResult,
} from "../screens";

/* ---------- COARSE LOCATION (UI-SPEC §3 Step 2; 30-CONTEXT em-dash compose) ---------- */

/**
 * Composes the coarse `allegationLocation` from a required country and an
 * optional governorate/city as `"{country} — {city}"` (U+2014 em-dash, single
 * spaces), country-only when city is empty, and `""` when both are empty. The
 * caller is responsible for passing a STREET-CLEAN city (isCoarseLocationClean),
 * so the composed string never carries a street-level token (S5 / T-30-04).
 */
export function composeLocation(country: string, city: string): string {
  const c = country.trim();
  const town = city.trim();
  if (!c) return "";
  if (!town) return c;
  return `${c} — ${town}`;
}

/* ---------- SOURCE-TYPE TOKEN (UI-SPEC §8 interim source-type-in-title) ---------- */

/**
 * The six source-type slugs in UI-SPEC §3 order. The §8 interim encoding prefixes
 * the chosen slug onto the row title until Phase 33 (BE-03) adds a first-class
 * `sourceType` column.
 */
export const SOURCE_TYPE_SLUGS = [
  "un",
  "court",
  "sanctions",
  "hr",
  "journalism",
  "official",
] as const;

export type SourceTypeSlug = (typeof SOURCE_TYPE_SLUGS)[number];

/**
 * Matches a single leading `[TYPE: <one-of-the-six-slugs>] ` token so re-applying
 * the encoding never double-prefixes (idempotent — single source of truth for §8).
 */
const SOURCE_TYPE_TOKEN_RE = /^\[TYPE: (?:un|court|sanctions|hr|journalism|official)\] /;

/**
 * Idempotently prefixes the §8 source-type token onto a row title:
 * `prefixSourceType("court", "UN report")` → `"[TYPE: court] UN report"`.
 * Strips any existing leading token first, so re-selecting never double-prefixes;
 * an empty slug (no type chosen) returns the bare title unchanged.
 */
export function prefixSourceType(slug: string, title: string): string {
  const base = title.replace(SOURCE_TYPE_TOKEN_RE, "");
  if (!slug) return base;
  return `[TYPE: ${slug}] ${base}`;
}

/* ---------- PER-STEP SCREENS (UI-SPEC §9 server order; T-30-01 no drift) ---------- */

/**
 * Step 2 identity screen — surfaces the type/role MISMATCH as a non-blocking
 * warning (UI-SPEC §9 → `.filter-notice`). Delegates to `screenMismatch`; returns
 * a MISMATCH PersistResult when it fires, else `{ ok: true }`. Warning only —
 * Next gating lives in `requiresIdentity`; the server re-checks MISMATCH.
 */
export function screenIdentityStep(form: SubmitInput): PersistResult<SubmitInput> {
  if (
    form.entityType &&
    form.entityRole &&
    screenMismatch(form.entityType, form.entityRole)
  ) {
    return {
      ok: false,
      code: "MISMATCH",
      message: "Entity type and role/description appear mismatched.",
      field: "entityRole",
    };
  }
  return { ok: true, data: form };
}

/**
 * Step 5 describe screen — runs the MIDDLE screens of `runScreens`
 * (GROUP_TARGET → INCITEMENT → HATE_TONE → INNOCENT_PARTY → PRIVATE_TARGETING)
 * in that EXACT server order on the same
 * `entityName + " " + entityRole + " " + allegationDescription` concatenation the
 * server uses, returning the FIRST failing code (else `{ ok: true }`). Mirrors
 * what `/api/submit` would return so the inline warning matches the server.
 */
export function screenDescribeStep(form: SubmitInput): PersistResult<SubmitInput> {
  const fullText = `${form.entityName} ${form.entityRole} ${form.allegationDescription}`;
  const screen = screenText(fullText);

  if (screen.banned) {
    return {
      ok: false,
      code: "GROUP_TARGET",
      message: "Submission contains identity-based targeting patterns.",
      field: "text",
    };
  }
  if (screen.incitement) {
    return {
      ok: false,
      code: "INCITEMENT",
      message: "Submission contains calls to violence or incitement.",
      field: "text",
    };
  }
  if (screen.hateTone) {
    return {
      ok: false,
      code: "HATE_TONE",
      message: "Submission contains hate speech or dehumanizing language.",
      field: "text",
    };
  }
  if (screenInnocentParty(fullText)) {
    return {
      ok: false,
      code: "INNOCENT_PARTY",
      message: "Submission appears to target a protected or non-combatant party.",
      field: "text",
    };
  }
  if (screenPrivateTargeting(fullText)) {
    return {
      ok: false,
      code: "PRIVATE_TARGETING",
      message: "Submission contains private data (addresses, phone numbers, coordinates, or personal social media).",
      field: "text",
    };
  }
  return { ok: true, data: form };
}

/* ---------- EVIDENCE GATE (EV-01; 30-CONTEXT links-only WEAK_SOURCE mirror) ---------- */

/**
 * Counts source LINKS with a non-empty url — files do NOT count. Mirrors the
 * server `WEAK_SOURCE` screen exactly (`sourceCount = sourceLinks.length`), so a
 * submission that passes this gate also passes the server (no "passes client,
 * rejected server" trap). The lead note is NEVER counted here (T-30-09).
 */
export function evidenceSourceCount(form: SubmitInput): number {
  return form.sourceLinks.filter((s) => s.url.trim().length > 0).length;
}

/* ---------- MEDIA LINK (UI-SPEC §3 Step 7 optional link; T-30-10) ---------- */

/**
 * Validates the OPTIONAL Step-7 link: returns `false` (reject) when
 * `screenPrivateTargeting` matches a personal social link, `true` for an empty
 * value (optional) or a clean url. Delegates to the shared screen — no inline
 * regex. The personal social link is rejected before acceptance (T-30-10).
 */
export function screenMediaLink(url: string): boolean {
  if (url.trim().length === 0) return true;
  return !screenPrivateTargeting(url);
}

/* ---------- STEP `requires` PREDICATES (UI-SPEC §3 Next gates) ---------- */

/**
 * Step 2 gate (UI-SPEC §3): name + role + country present. `allegationLocation`
 * is non-empty exactly when a country was composed in (composeLocation returns
 * "" only when country is empty).
 */
export function requiresIdentity(form: SubmitInput): boolean {
  return (
    form.entityName.trim().length > 0 &&
    form.entityRole.trim().length > 0 &&
    (form.allegationLocation ?? "").trim().length > 0
  );
}

/** Step 5 gate (UI-SPEC §3): the description has at least 20 characters. */
export function requiresDescribe(form: SubmitInput): boolean {
  return form.allegationDescription.trim().length >= 20;
}

/**
 * Step 6 gate (EV-01): at least two source LINKS (files do not unlock advance —
 * mirrors the server WEAK_SOURCE contract).
 */
export function requiresEvidence(form: SubmitInput): boolean {
  return evidenceSourceCount(form) >= 2;
}

/** Step 7 gate (UI-SPEC §3): media is optional — Next is never blocked. */
export function requiresMedia(_form: SubmitInput): boolean {
  return true;
}

/** Step 8 gate (UI-SPEC §3): about-you is optional — Next is never blocked. */
export function requiresAboutYou(_form: SubmitInput): boolean {
  return true;
}
