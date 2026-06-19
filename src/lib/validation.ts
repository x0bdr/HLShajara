/**
 * Zod schemas derived from Drizzle tables.
 * Single source of truth: schema constraints and API validation stay in sync.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  entities,
  allegations,
  sources,
  users,
} from "@/db/schema";
import { conductTypes, roleInConductTypes } from "@/lib/constants/conduct";
import {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeEmail,
  sanitizeInput,
  sanitizeMediaName,
  sanitizeUrl,
} from "@/lib/validation/is-valid";
import { safeHttpUrl } from "@/lib/escape";

/* ---------- SANITIZED FIELD HELPERS ---------- */

function sanitizedString(max: number) {
  return z.string().max(max).transform(sanitizeInput);
}

function optionalSanitizedString(max: number) {
  return sanitizedString(max).optional();
}

// Plain-text-only field for media labels / file names — strips angle brackets +
// backticks so no markup survives at the submit trust boundary (MEDIA-NAME).
function mediaNameString(max: number) {
  return z.string().max(max).transform((v) => sanitizeMediaName(v, max));
}

function optionalMediaNameString(max: number) {
  return mediaNameString(max).optional();
}

function optionalEmail(max = 255) {
  return sanitizedString(max)
    .transform(sanitizeEmail)
    .refine((v) => !v || isValidEmail(v), { message: "Invalid email" })
    .optional();
}

function optionalUrl(max = 2048) {
  return sanitizedString(max)
    .transform(sanitizeUrl)
    .refine((v) => !v || isValidUrl(v), { message: "Invalid URL" })
    .optional();
}

// SECURITY (H2): a user-supplied URL that ends up in an href (reviewer PDF /
// markdown / console) MUST be an http/https absolute URL or a single-slash
// site-relative path. `safeHttpUrl` returns "" for javascript:/data:/vbscript:/
// file:/protocol-relative inputs, so a non-empty result is the allowlist gate.
// Bilingual message because it can surface to the public submitter.
const UNSAFE_URL_MESSAGE = "Invalid URL / رابط غير صالح";

function httpUrlString(max: number) {
  return sanitizedString(max)
    .transform(sanitizeUrl)
    .refine((v) => safeHttpUrl(v) !== "", { message: UNSAFE_URL_MESSAGE });
}

function optionalPhone(max = 100) {
  return sanitizedString(max)
    .refine((v) => !v || isValidPhone(v), { message: "Invalid phone number" })
    .optional();
}

/* ---------- REPORT CATEGORY (v1.5 category-based wizard) ---------- */

export const reportCategories = [
  "commercial",
  "individuals",
  "educational",
  "service",
  "tourism",
  "medical",
  "organizations",
  "real_estate",
] as const;

export type ReportCategory = (typeof reportCategories)[number];

export const contactMethodTypes = [
  "x",
  "facebook",
  "instagram",
  "telegram",
  "whatsapp",
  "phone",
  "email",
  "website",
  "tiktok",
] as const;

export type ContactMethodType = (typeof contactMethodTypes)[number];

export const contactMethodSchema = z
  .object({
    type: z.enum(contactMethodTypes),
    value: sanitizedString(255),
    countryCode: z.string().max(10).optional(),
  })
  .superRefine((data, ctx) => {
    const { type, value } = data;
    if (!value) return;
    if (type === "email" && !isValidEmail(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid email",
        path: ["value"],
      });
    }
    if (type === "website" && !isValidUrl(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid URL",
        path: ["value"],
      });
    }
    if ((type === "phone" || type === "whatsapp") && !isValidPhone(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid phone number",
        path: ["value"],
      });
    }
  });

export type ContactMethod = z.infer<typeof contactMethodSchema>;

const labourEntrySchema = z.object({
  name: sanitizedString(255),
  role: sanitizedString(255),
});

const academicStaffEntrySchema = z.object({
  name: sanitizedString(255),
  role: sanitizedString(255),
});

/** Category-specific metadata captured by the new wizard. */
export const reportMetadataSchema = z.object({
  country: optionalSanitizedString(100),
  state: optionalSanitizedString(100),
  city: optionalSanitizedString(100),
  nearestLocation: optionalSanitizedString(200),
  address: optionalSanitizedString(300),
  governorate: optionalSanitizedString(100),
  contactPhone: optionalPhone(100),
  contactPhoneCountryCode: optionalSanitizedString(10),
  websiteName: optionalUrl(255),
  entityEmail: optionalEmail(255),
  googleMapsLink: optionalUrl(2048),
  socialMediaAccounts: optionalSanitizedString(500),
  socialContactMethods: z.array(contactMethodSchema).optional(),
  orgType: optionalSanitizedString(100),
  orgSubType: optionalSanitizedString(100),
  orgSubTypeOther: optionalSanitizedString(255),
  ownerName: optionalSanitizedString(255),
  ownerNames: z.array(sanitizedString(255)).optional(),
  reportedPersonName: optionalSanitizedString(255),
  professorName: optionalSanitizedString(255),
  universityDoctorName: optionalSanitizedString(255),
  reportedPersonNickname: optionalSanitizedString(255),
  reportedPersonPhone: optionalPhone(100),
  reportedPersonPosition: optionalSanitizedString(255),
  reportedPersonSocialMedia: optionalSanitizedString(500),
  carType: optionalSanitizedString(100),
  carPlate: optionalSanitizedString(100),
  driverPhone: optionalPhone(100),
  driverName: optionalSanitizedString(255),
  taxiNumber: optionalSanitizedString(100),
  appName: optionalSanitizedString(100),
  propertyType: optionalSanitizedString(100),
  partnerName: optionalSanitizedString(255),
  investorName: optionalSanitizedString(255),
  investorNames: z.array(sanitizedString(255)).optional(),
  receptionInfo: optionalSanitizedString(255),
  labourInfo: optionalSanitizedString(255),
  labourEntries: z.array(labourEntrySchema).optional(),
  labourMembers: z.array(labourEntrySchema).optional(),
  academicStaff: z.array(academicStaffEntrySchema).optional(),
  doctors: z.array(sanitizedString(255)).optional(),
  nurses: z.array(sanitizedString(255)).optional(),
  members: z.array(sanitizedString(255)).optional(),
  supportDataInfo: optionalSanitizedString(256),
  clubName: optionalSanitizedString(255),
  supportingDocuments: z.array(sanitizedString(100)).optional(),
  detailFlags: z.array(sanitizedString(100)).optional(),
  mediaNotes: optionalSanitizedString(2000),
  mediaLink: optionalUrl(2048),
  contactMethods: z.array(contactMethodSchema).optional(),
});

export type ReportMetadata = z.infer<typeof reportMetadataSchema>;

/* ---------- ENTITY ---------- */

export const insertEntitySchema = createInsertSchema(entities, {
  publicId: z.string().min(8).max(32),
  name: sanitizedString(255).refine((v) => v.length >= 1, { message: "Required" }),
  role: sanitizedString(500).refine((v) => v.length >= 1, { message: "Required" }),
}).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true, unpublishedAt: true });

export const selectEntitySchema = createSelectSchema(entities);

export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type SelectEntity = z.infer<typeof selectEntitySchema>;

/* ---------- ALLEGATION ---------- */

export const insertAllegationSchema = createInsertSchema(allegations, {
  description: sanitizedString(10000).refine((v) => v.length >= 10, {
    message: "Description must be at least 10 characters",
  }),
}).omit({ id: true, createdAt: true });

export const selectAllegationSchema = createSelectSchema(allegations);

export type InsertAllegation = z.infer<typeof insertAllegationSchema>;

/* ---------- SOURCE ---------- */

export const insertSourceSchema = createInsertSchema(sources, {
  title: sanitizedString(500).refine((v) => v.length >= 1, { message: "Required" }),
  publisher: sanitizedString(200).refine((v) => v.length >= 1, { message: "Required" }),
  date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
  url: sanitizedString(2048)
    .transform(sanitizeUrl)
    .refine((v) => !v || isValidUrl(v), { message: "Invalid URL" })
    .optional(),
}).omit({ id: true, createdAt: true, verifiedAt: true });

export type InsertSource = z.infer<typeof insertSourceSchema>;

/* ---------- SUBMISSION (public intake) ---------- */

export const submitSchema = z.object({
  entityName: sanitizedString(255).refine((v) => v.length > 0, {
    message: "Entity name is required",
  }),
  entityType: z.enum([
    "individual",
    "organization",
    "military_unit",
    "security_branch",
    "official_body",
  ]),
  reportCategory: z.enum(reportCategories),
  reportMetadata: reportMetadataSchema.default({}),
  entityRole: sanitizedString(500).refine((v) => v.length >= 1, {
    message: "Entity role is required",
  }),
  allegationDescription: sanitizedString(10000).refine((v) => v.length >= 20, {
    message: "Allegation description must be at least 20 characters",
  }),
  allegationPeriod: optionalSanitizedString(100),
  allegationLocation: optionalSanitizedString(200),
  allegationClassification: optionalSanitizedString(100),
  // Phase 33 (BE-01): first-class conduct slug (closed 14-set via shared const) —
  // drives auto-populated triageCategory on intake. Optional/additive.
  conductType: z.enum(conductTypes).optional(),
  // Phase 33 (BE-06): first-class role-in-conduct (closed 7-set via shared const).
  roleInConduct: z.enum(roleInConductTypes).optional(),
  // Reviewer-only lead note (non-public, never a source, never folded into the description).
  // Phase 33 (BE-02): /api/submit now PERSISTS this (was accept-but-ignore); it is still
  // NEVER returned on any public path, NEVER counted as a source, NEVER folded into
  // allegationDescription.
  leadNote: optionalSanitizedString(5000),
  sourceLinks: z
    .array(
      z.object({
        // SECURITY (H2): both gates — a real http/https public-source URL
        // (isValidUrl) AND the href-safety allowlist (safeHttpUrl rejects
        // javascript:/data:/protocol-relative, defense-in-depth at the boundary).
        url: sanitizedString(2048)
          .transform(sanitizeUrl)
          .refine((v) => isValidUrl(v), { message: "Invalid URL" })
          .refine((v) => safeHttpUrl(v) !== "", { message: UNSAFE_URL_MESSAGE }),
        title: optionalSanitizedString(500),
        // Phase 33 (BE-03): per-source provenance tag (closed 6-set). Optional —
        // a sourceLinks item without sourceType still parses.
        sourceType: z.enum(["un","court","sanctions","hr","journalism","official"]).optional(),
      })
    )
    .default([]),
  sourceFiles: z
    .array(
      z.object({
        hash: z.string(),
        filename: sanitizedString(255),
        // Plain-text-only at the trust boundary (MEDIA-NAME): strip markup-forming
        // chars so a crafted originalName/label cannot reach a render sink as HTML/MD.
        originalName: mediaNameString(255),
        // SECURITY (H2): was bare z.string() — a client bypassing /api/upload could
        // submit url:"javascript:alert(1)" which then landed in the reviewer PDF.
        // Now allow only http/https absolute URLs or single-slash relative paths.
        url: httpUrlString(2048),
        size: z.number(),
        label: optionalMediaNameString(255),
      })
    )
    .default([]),
  submitterEmail: optionalEmail(255),
  submitterName: optionalSanitizedString(255),
  isAnonymous: z.boolean().default(true),
  // NOTE: the anti-bot HONEYPOT (`website`) is intentionally NOT a schema field. The
  // route destructures it straight off the raw request body and gates on it FIRST
  // (before reCAPTCHA / any schema parse), evaluating the raw bot-supplied value's
  // truthiness. Adding it here would be dead — the route never feeds it to this schema.
}).refine(
  (data) => data.reportCategory === "individuals" || data.entityName.length > 0,
  {
    message: "Entity name is required",
    path: ["entityName"],
  }
);

export type SubmitInput = z.infer<typeof submitSchema>;

/* ---------- USER ---------- */

export const insertUserSchema = createInsertSchema(users, {
  email: sanitizedString(255)
    .transform(sanitizeEmail)
    .refine((v) => isValidEmail(v), { message: "Invalid email" }),
  name: optionalSanitizedString(255),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
