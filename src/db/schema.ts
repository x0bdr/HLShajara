/**
 * HLShajara — Identity-free data model
 * No schema field exists for sect/religion/ethnicity/family/region/tribe.
 * Every allegation must have ≥1 source. Enforced at DB + persist() layer.
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { conductTypes, roleInConductTypes } from "@/lib/constants/conduct";

/* ---------- ENUMS ---------- */

export const entityTypeEnum = pgEnum("entity_type", [
  "individual",
  "organization",
  "military_unit",
  "security_branch",
  "official_body",
]);

export const entityStatusEnum = pgEnum("entity_status", [
  "alleged",
  "investigating",
  "indicted",
  "sanctioned",
  "convicted",
  "deceased",
  "unpublished",
]);

export const evidenceLevelEnum = pgEnum("evidence_level", [
  "0", // Under review
  "1", // Single credible source
  "2", // Multi-source corroborated
  "3", // UN/IIIM-documented
  "4", // Court-confirmed
]);

export const sourceTierEnum = pgEnum("source_tier", [
  "A", // International tribunal / UN body
  "B", // Recognized HR org / sanctions list
  "C", // Corroborated investigative journalism
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "under_review",
  "verified",
  "ready_to_publish",
  "rejected",
  "published",
  "unpublished",
]);

export const rejectionReasonEnum = pgEnum("rejection_reason", [
  "GROUP_TARGET",
  "INCITEMENT",
  "NO_SOURCE",
  "WEAK_SOURCE",
  "PRIVATE_TARGETING",
  "INNOCENT_PARTY",
  "MISMATCH",
  "HATE_TONE",
]);

export const replyStatusEnum = pgEnum("reply_status", [
  "pending",
  "approved",
  "rejected",
  "corrected",
]);

export const userRoleEnum = pgEnum("user_role", [
  "submitter",
  "reviewer",
  "senior_reviewer",
  "admin",
]);

export const reviewActionEnum = pgEnum("review_action", [
  "create",
  "update",
  "verify",
  "reject",
  "publish",
  "unpublish",
  "correct",
  "lawyer_sign_off",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

// Phase 33 (BE-01/BE-06): closed conduct/role sets — slugs imported from the
// shared anti-drift const so the DB enum, Zod, and the wizard cannot drift.
export const conductTypeEnum = pgEnum("conduct_type", conductTypes);

export const roleInConductEnum = pgEnum("role_in_conduct", roleInConductTypes);

/* ---------- TABLES ---------- */

export const entities = pgTable(
  "entities",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 32 }).notNull().unique(),
    type: entityTypeEnum("type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }),
    role: varchar("role", { length: 500 }).notNull(),
    roleEn: varchar("role_en", { length: 500 }),
    status: entityStatusEnum("status").notNull().default("alleged"),
    evidenceLevel: evidenceLevelEnum("evidence_level").notNull().default("0"),
    version: integer("version").notNull().default(1),
    isDeceased: boolean("is_deceased").notNull().default(false),
    rightOfReplyState: varchar("right_of_reply_state", { length: 20 })
      .notNull()
      .default("none"),
    rightOfReplyText: text("right_of_reply_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    unpublishedAt: timestamp("unpublished_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("entity_public_id_idx").on(table.publicId),
    index("entity_status_idx").on(table.status),
    index("entity_evidence_idx").on(table.evidenceLevel),
    index("entity_type_idx").on(table.type),
  ]
);

export const allegations = pgTable(
  "allegations",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    descriptionEn: text("description_en"),
    period: varchar("period", { length: 100 }),
    location: varchar("location", { length: 200 }),
    classification: varchar("classification", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("allegation_entity_idx").on(table.entityId)]
);

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    tier: sourceTierEnum("tier").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    titleEn: varchar("title_en", { length: 500 }),
    publisher: varchar("publisher", { length: 200 }).notNull(),
    date: varchar("date", { length: 20 }).notNull(),
    url: varchar("url", { length: 2048 }),
    archiveUrl: varchar("archive_url", { length: 2048 }),
    snapshotUrl: varchar("snapshot_url", { length: 2048 }),
    contentHash: varchar("content_hash", { length: 64 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: integer("verified_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("source_tier_idx").on(table.tier)]
);

export const allegationSources = pgTable(
  "allegation_sources",
  {
    allegationId: integer("allegation_id")
      .notNull()
      .references(() => allegations.id, { onDelete: "cascade" }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.allegationId, table.sourceId] }),
  ]
);

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    rejectionReason: rejectionReasonEnum("rejection_reason"),
    rejectionNote: text("rejection_note"),
    entityName: varchar("entity_name", { length: 255 }).notNull(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityRole: varchar("entity_role", { length: 500 }).notNull(),
    allegationDescription: text("allegation_description").notNull(),
    allegationPeriod: varchar("allegation_period", { length: 100 }),
    allegationLocation: varchar("allegation_location", { length: 200 }),
    allegationClassification: varchar("allegation_classification", { length: 100 }),
    // Phase 33 (BE-01): first-class conduct slug; triageCategory is auto-derived
    // from this on intake. Nullable/additive — historical rows stay untouched.
    conductType: conductTypeEnum("conduct_type"),
    // Phase 33 (BE-06): first-class role-in-conduct (closed 7-role set). Nullable.
    roleInConduct: roleInConductEnum("role_in_conduct"),
    // Phase 33 (BE-02): reviewer-only lead note — persisted but NEVER returned on
    // any public path, NEVER counted as a source, NEVER folded into
    // allegationDescription. Nullable/additive.
    leadNote: text("lead_note"),
    sourceLinks: jsonb("source_links").notNull().default("[]"),
    sourceFiles: jsonb("source_files").default("[]"),
    submitterEmail: varchar("submitter_email", { length: 255 }),
    submitterName: varchar("submitter_name", { length: 255 }),
    // Phase 33 (BE-04): default flipped to true for NEW rows only (no backfill;
    // existing rows keep their recorded value — the audit trail is not rewritten).
    isAnonymous: boolean("is_anonymous").notNull().default(true),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: integer("reviewed_by"),
    secondReviewedAt: timestamp("second_reviewed_at", { withTimezone: true }),
    secondReviewedBy: integer("second_reviewed_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: integer("published_by"),
    triageConfirmedActor: boolean("triage_confirmed_actor"),
    triageConfirmedConduct: boolean("triage_confirmed_conduct"),
    triageCategory: varchar("triage_category", { length: 100 }),
    identityResolutionConfirmed: boolean("identity_resolution_confirmed"),
    sourceVerification: jsonb("source_verification"),
    evidenceStrength: varchar("evidence_strength", { length: 20 }),
    privacyCheckPassed: boolean("privacy_check_passed"),
    phrasingApproved: boolean("phrasing_approved"),
    privacyRechecked: boolean("privacy_rechecked"),
    isDeceased: boolean("is_deceased"),
  },
  (table) => [
    index("submission_status_idx").on(table.status),
    index("submission_created_idx").on(table.createdAt),
  ]
);

/* ---------- AUDIT LOG ---------- */

export const reviewLogs = pgTable(
  "review_logs",
  {
    id: serial("id").primaryKey(),
    action: reviewActionEnum("action").notNull(),
    actorId: integer("actor_id").notNull(),
    actorRole: userRoleEnum("actor_role").notNull(),
    entityId: integer("entity_id"),
    submissionId: integer("submission_id"),
    targetTable: varchar("target_table", { length: 50 }).notNull(),
    targetId: integer("target_id").notNull(),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data").notNull(),
    reason: text("reason"),
    prevHash: varchar("prev_hash", { length: 64 }),
    rowHash: varchar("row_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_target_idx").on(table.targetTable, table.targetId),
    index("audit_actor_idx").on(table.actorId),
    index("audit_created_idx").on(table.createdAt),
  ]
);

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const keyDecisions = pgTable("key_decisions", {
  id: serial("id").primaryKey(),
  decisionId: varchar("decision_id", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: varchar("decided_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const replies = pgTable(
  "replies",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id").references(() => entities.id, {
      onDelete: "set null",
    }),
    entityName: varchar("entity_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    statement: text("statement").notNull(),
    status: replyStatusEnum("status").notNull().default("pending"),
    reviewedBy: integer("reviewed_by"),
    reviewNote: text("review_note"),
    processedBy: integer("processed_by"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reply_entity_idx").on(table.entityId)]
);

/* ---------- PUBLICATIONS ---------- */

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    locale: varchar("locale", { length: 10 }).notNull().default("ar"),
    status: postStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 500 }).notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    coverImageUrl: varchar("cover_image_url", { length: 2048 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("post_slug_locale_idx").on(table.slug, table.locale),
    index("post_status_locale_idx").on(table.status, table.locale),
    index("post_published_at_idx").on(table.publishedAt),
  ]
);

/* ---------- USERS (for Better Auth) ---------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    role: userRoleEnum("role").notNull().default("submitter"),
    is2faEnabled: boolean("is_2fa_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)]
);

/* ---------- BETTER AUTH TABLES ---------- */

export const authUser = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  role: text("role").default("submitter"),
});

export const authSession = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const authAccount = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const authVerification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const authTwoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("twoFactor_secret_idx").on(table.secret),
    index("twoFactor_userId_idx").on(table.userId),
  ],
);

export const authUserRelations = relations(authUser, ({ many }) => ({
  sessions: many(authSession),
  accounts: many(authAccount),
  twoFactors: many(authTwoFactor),
}));

export const authSessionRelations = relations(authSession, ({ one }) => ({
  user: one(authUser, { fields: [authSession.userId], references: [authUser.id] }),
}));

export const authAccountRelations = relations(authAccount, ({ one }) => ({
  user: one(authUser, { fields: [authAccount.userId], references: [authUser.id] }),
}));

export const authTwoFactorRelations = relations(authTwoFactor, ({ one }) => ({
  user: one(authUser, { fields: [authTwoFactor.userId], references: [authUser.id] }),
}));
