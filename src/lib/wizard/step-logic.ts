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
import { getSubTypeConfig, DETAIL_FLAG_FIELDS } from "./category-config";

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
  const meta = form.reportMetadata ?? {};
  const hasCountry = (form.allegationLocation ?? "").trim().length > 0;
  const hasGovernorate = (meta.governorate ?? "").trim().length > 0;
  const hasContact =
    (meta.contactPhone ?? "").trim().length > 0 ||
    (meta.entityEmail ?? "").trim().length > 0 ||
    (meta.websiteName ?? "").trim().length > 0 ||
    (meta.googleMapsLink ?? "").trim().length > 0 ||
    (meta.socialContactMethods ?? []).length > 0;
  return hasCountry && hasGovernorate && hasContact;
}

export function requiresEntityTypeName(form: SubmitInput): boolean {
  const meta = form.reportMetadata ?? {};
  const orgType = (meta.orgType ?? "").trim();
  if (!orgType) return false;
  if (orgType === "other" && !(meta.orgSubTypeOther ?? "").trim()) return false;
  if (form.reportCategory === "individuals") return true;
  return form.entityName.trim().length > 0;
}

function detailFlagFieldIsFilled(
  form: SubmitInput,
  flag: string,
): boolean {
  const meta = form.reportMetadata ?? {};
  const mapping = DETAIL_FLAG_FIELDS[flag];
  if (!mapping) return true;
  const value = meta[mapping.field];
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return false;
}

export function requiresReportDetails(form: SubmitInput): boolean {
  const meta = form.reportMetadata ?? {};
  const category = form.reportCategory;
  const orgType = meta.orgType ?? "";

  // Individuals: the visible identity fields are the gate.
  if (category === "individuals") {
    return (meta.reportedPersonName ?? "").trim().length > 0;
  }

  // Tourism vehicles: car plate is the minimum public identifier.
  if (category === "tourism" && orgType === "private_car") {
    return (meta.carPlate ?? "").trim().length > 0;
  }
  if (category === "tourism" && orgType === "taxi") {
    if ((meta.carPlate ?? "").trim().length === 0) return false;
  }

  // Organization categories: at least one detail flag, and the selected flag's field must be filled.
  const flags = meta.detailFlags ?? [];
  if (flags.length === 0) return false;
  return flags.every((flag) => detailFlagFieldIsFilled(form, flag));
}

export function requiresExperience(form: SubmitInput): boolean {
  return form.allegationDescription.trim().length >= 20;
}

export function requiresMediaEvidence(): boolean {
  // Sources are optional at intake; this step collects optional media only.
  return true;
}

export function requiresAboutYou(form: SubmitInput): boolean {
  if (form.isAnonymous) return true;
  const methods = form.reportMetadata?.contactMethods ?? [];
  return methods.length > 0;
}
