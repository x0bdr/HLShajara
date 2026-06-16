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

export const contactMethodSchema = z.object({
  type: z.enum(contactMethodTypes),
  value: z.string().max(255),
});

export type ContactMethod = z.infer<typeof contactMethodSchema>;

const labourEntrySchema = z.object({
  name: z.string().max(255),
  role: z.string().max(255),
});

/** Category-specific metadata captured by the new wizard. */
export const reportMetadataSchema = z.object({
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  nearestLocation: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  governorate: z.string().max(100).optional(),
  contactPhone: z
    .string()
    .max(100)
    .refine((v) => !v || /^[\d\s\+\-\(\)]+$/.test(v), {
      message: "Contact phone must contain only numbers",
    })
    .optional(),
  websiteName: z.string().max(255).optional(),
  entityEmail: z.union([z.string().email().max(255), z.literal("")]).optional(),
  googleMapsLink: z.string().max(2048).optional(),
  socialMediaAccounts: z.string().max(500).optional(),
  socialContactMethods: z.array(contactMethodSchema).optional(),
  orgType: z.string().max(100).optional(),
  orgSubType: z.string().max(100).optional(),
  orgSubTypeOther: z.string().max(255).optional(),
  ownerName: z.string().max(255).optional(),
  ownerNames: z.array(z.string().max(255)).optional(),
  reportedPersonName: z.string().max(255).optional(),
  reportedPersonNickname: z.string().max(255).optional(),
  reportedPersonPhone: z.string().max(100).optional(),
  reportedPersonPosition: z.string().max(255).optional(),
  reportedPersonSocialMedia: z.string().max(500).optional(),
  carType: z.string().max(100).optional(),
  carPlate: z.string().max(100).optional(),
  driverPhone: z.string().max(100).optional(),
  driverName: z.string().max(255).optional(),
  taxiNumber: z.string().max(100).optional(),
  appName: z.string().max(100).optional(),
  propertyType: z.string().max(100).optional(),
  partnerName: z.string().max(255).optional(),
  investorName: z.string().max(255).optional(),
  investorNames: z.array(z.string().max(255)).optional(),
  receptionInfo: z.string().max(255).optional(),
  labourInfo: z.string().max(255).optional(),
  labourEntries: z.array(labourEntrySchema).optional(),
  supportDataInfo: z.string().max(256).optional(),
  clubName: z.string().max(255).optional(),
  supportingDocuments: z.array(z.string().max(100)).optional(),
  detailFlags: z.array(z.string().max(100)).optional(),
  mediaNotes: z.string().max(2000).optional(),
  mediaLink: z.string().url().or(z.literal("")).optional(),
  contactMethods: z.array(contactMethodSchema).optional(),
});

export type ReportMetadata = z.infer<typeof reportMetadataSchema>;

/* ---------- ENTITY ---------- */

export const insertEntitySchema = createInsertSchema(entities, {
  publicId: z.string().min(8).max(32),
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(500),
}).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true, unpublishedAt: true });

export const selectEntitySchema = createSelectSchema(entities);

export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type SelectEntity = z.infer<typeof selectEntitySchema>;

/* ---------- ALLEGATION ---------- */

export const insertAllegationSchema = createInsertSchema(allegations, {
  description: z.string().min(10).max(10000),
}).omit({ id: true, createdAt: true });

export const selectAllegationSchema = createSelectSchema(allegations);

export type InsertAllegation = z.infer<typeof insertAllegationSchema>;

/* ---------- SOURCE ---------- */

export const insertSourceSchema = createInsertSchema(sources, {
  title: z.string().min(1).max(500),
  publisher: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
  url: z.string().url().optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, verifiedAt: true });

export type InsertSource = z.infer<typeof insertSourceSchema>;

/* ---------- SUBMISSION (public intake) ---------- */

export const submitSchema = z.object({
  entityName: z.string().min(1).max(255),
  entityType: z.enum([
    "individual",
    "organization",
    "military_unit",
    "security_branch",
    "official_body",
  ]),
  reportCategory: z.enum(reportCategories),
  reportMetadata: reportMetadataSchema.default({}),
  entityRole: z.string().min(1).max(500),
  allegationDescription: z.string().min(20).max(10000),
  allegationPeriod: z.string().max(100).optional(),
  allegationLocation: z.string().max(200).optional(),
  allegationClassification: z.string().max(100).optional(),
  // Phase 33 (BE-01): first-class conduct slug (closed 14-set via shared const) —
  // drives auto-populated triageCategory on intake. Optional/additive.
  conductType: z.enum(conductTypes).optional(),
  // Phase 33 (BE-06): first-class role-in-conduct (closed 7-set via shared const).
  roleInConduct: z.enum(roleInConductTypes).optional(),
  // Reviewer-only lead note (non-public, never a source, never folded into the description).
  // Phase 33 (BE-02): /api/submit now PERSISTS this (was accept-but-ignore); it is still
  // NEVER returned on any public path, NEVER counted as a source, NEVER folded into
  // allegationDescription.
  leadNote: z.string().max(5000).optional(),
  sourceLinks: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().min(1).max(500).optional(),
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
        filename: z.string(),
        originalName: z.string(),
        url: z.string(),
        size: z.number(),
        label: z.string().optional(),
      })
    )
    .default([]),
  submitterEmail: z.string().email().optional().or(z.literal("")),
  submitterName: z.string().max(255).optional(),
  isAnonymous: z.boolean().default(true),
});

export type SubmitInput = z.infer<typeof submitSchema>;

/* ---------- USER ---------- */

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(1).max(255).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
