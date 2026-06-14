/**
 * Wizard input-step logic for the v1.5 category-based wizard.
 *
 * Pure, framework-free logic layer. NO JSX, NO React, NO `"use client"`.
 */

import type { SubmitInput } from "../validation";
import {
  screenMismatch,
  screenText,
  screenInnocentParty,
  screenPrivateTargeting,
  type PersistResult,
} from "../screens";

/* ---------- COARSE LOCATION ---------- */

export function composeLocation(country: string, city: string): string {
  const c = country.trim();
  const town = city.trim();
  if (!c) return "";
  if (!town) return c;
  return `${c} — ${town}`;
}

/* ---------- SOURCE-TYPE TOKEN ---------- */

export const SOURCE_TYPE_SLUGS = [
  "un",
  "court",
  "sanctions",
  "hr",
  "journalism",
  "official",
] as const;

export type SourceTypeSlug = (typeof SOURCE_TYPE_SLUGS)[number];

const SOURCE_TYPE_TOKEN_RE = /^\[TYPE: (?:un|court|sanctions|hr|journalism|official)\] /;

export function prefixSourceType(slug: string, title: string): string {
  const base = title.replace(SOURCE_TYPE_TOKEN_RE, "");
  if (!slug) return base;
  return `[TYPE: ${slug}] ${base}`;
}

/* ---------- SCREENS ---------- */

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

/* ---------- EVIDENCE GATE ---------- */

export function evidenceSourceCount(form: SubmitInput): number {
  return form.sourceLinks.filter((s) => s.url.trim().length > 0).length;
}

/* ---------- MEDIA LINK ---------- */

export function screenMediaLink(url: string): boolean {
  if (url.trim().length === 0) return true;
  return !screenPrivateTargeting(url);
}

/* ---------- STEP `requires` PREDICATES ---------- */

export function requiresLocationInfo(form: SubmitInput): boolean {
  return (form.allegationLocation ?? "").trim().length > 0;
}

export function requiresEntityTypeName(form: SubmitInput): boolean {
  return (
    form.entityName.trim().length > 0 &&
    form.reportCategory.trim().length > 0 &&
    (form.reportMetadata?.orgType ?? "").trim().length > 0
  );
}

export function requiresReportDetails(): boolean {
  // Details are optional hints; any answer (including none) is acceptable.
  return true;
}

export function requiresExperience(form: SubmitInput): boolean {
  return form.allegationDescription.trim().length >= 20;
}

export function requiresMediaEvidence(): boolean {
  // Sources are optional at intake; this step collects optional media only.
  return true;
}

export function requiresAboutYou(): boolean {
  return true;
}
