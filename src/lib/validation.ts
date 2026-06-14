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
  submissions,
  users,
} from "@/db/schema";
import { conductTypes, roleInConductTypes } from "@/lib/constants/conduct";

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
    .min(1, "At least one source is required"),
  sourceFiles: z
    .array(
      z.object({
        hash: z.string(),
        filename: z.string(),
        originalName: z.string(),
        url: z.string(),
        size: z.number(),
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
