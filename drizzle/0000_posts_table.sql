CREATE TYPE "public"."entity_status" AS ENUM('alleged', 'investigating', 'indicted', 'sanctioned', 'convicted', 'deceased', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('individual', 'organization', 'military_unit', 'security_branch', 'official_body');--> statement-breakpoint
CREATE TYPE "public"."evidence_level" AS ENUM('0', '1', '2', '3', '4');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."rejection_reason" AS ENUM('GROUP_TARGET', 'INCITEMENT', 'NO_SOURCE', 'WEAK_SOURCE', 'PRIVATE_TARGETING', 'INNOCENT_PARTY', 'MISMATCH', 'HATE_TONE');--> statement-breakpoint
CREATE TYPE "public"."reply_status" AS ENUM('pending', 'approved', 'rejected', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('create', 'update', 'verify', 'reject', 'publish', 'unpublish', 'correct', 'lawyer_sign_off');--> statement-breakpoint
CREATE TYPE "public"."source_tier" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'under_review', 'verified', 'ready_to_publish', 'rejected', 'published', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('submitter', 'reviewer', 'senior_reviewer', 'admin');--> statement-breakpoint
CREATE TABLE "allegation_sources" (
	"allegation_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "allegation_sources_allegation_id_source_id_pk" PRIMARY KEY("allegation_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "allegations" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"description" text NOT NULL,
	"description_en" text,
	"period" varchar(100),
	"location" varchar(200),
	"classification" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text DEFAULT 'submitter',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"type" "entity_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"role" varchar(500) NOT NULL,
	"role_en" varchar(500),
	"status" "entity_status" DEFAULT 'alleged' NOT NULL,
	"evidence_level" "evidence_level" DEFAULT '0' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_deceased" boolean DEFAULT false NOT NULL,
	"right_of_reply_state" varchar(20) DEFAULT 'none' NOT NULL,
	"right_of_reply_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"unpublished_at" timestamp with time zone,
	CONSTRAINT "entities_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "key_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "key_decisions_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'ar' NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(500) NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"cover_image_url" varchar(2048),
	"published_at" timestamp with time zone,
	"author_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer,
	"entity_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"statement" text NOT NULL,
	"status" "reply_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"review_note" text,
	"processed_by" integer,
	"processed_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" "review_action" NOT NULL,
	"actor_id" integer NOT NULL,
	"actor_role" "user_role" NOT NULL,
	"entity_id" integer,
	"submission_id" integer,
	"target_table" varchar(50) NOT NULL,
	"target_id" integer NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb NOT NULL,
	"reason" text,
	"prev_hash" varchar(64),
	"row_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" "source_tier" NOT NULL,
	"title" varchar(500) NOT NULL,
	"title_en" varchar(500),
	"publisher" varchar(200) NOT NULL,
	"date" varchar(20) NOT NULL,
	"url" varchar(2048),
	"archive_url" varchar(2048),
	"snapshot_url" varchar(2048),
	"content_hash" varchar(64),
	"verified_at" timestamp with time zone,
	"verified_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" "rejection_reason",
	"rejection_note" text,
	"entity_name" varchar(255) NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_role" varchar(500) NOT NULL,
	"allegation_description" text NOT NULL,
	"allegation_period" varchar(100),
	"allegation_location" varchar(200),
	"allegation_classification" varchar(100),
	"source_links" jsonb DEFAULT '[]' NOT NULL,
	"source_files" jsonb DEFAULT '[]',
	"submitter_email" varchar(255),
	"submitter_name" varchar(255),
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" integer,
	"second_reviewed_at" timestamp with time zone,
	"second_reviewed_by" integer,
	"published_at" timestamp with time zone,
	"published_by" integer,
	"triage_confirmed_actor" boolean,
	"triage_confirmed_conduct" boolean,
	"triage_category" varchar(100),
	"identity_resolution_confirmed" boolean,
	"source_verification" jsonb,
	"evidence_strength" varchar(20),
	"privacy_check_passed" boolean,
	"phrasing_approved" boolean,
	"privacy_rechecked" boolean,
	"is_deceased" boolean
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" "user_role" DEFAULT 'submitter' NOT NULL,
	"is_2fa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "allegation_sources" ADD CONSTRAINT "allegation_sources_allegation_id_allegations_id_fk" FOREIGN KEY ("allegation_id") REFERENCES "public"."allegations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegation_sources" ADD CONSTRAINT "allegation_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allegations" ADD CONSTRAINT "allegations_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allegation_entity_idx" ON "allegations" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_public_id_idx" ON "entities" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "entity_status_idx" ON "entities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "entity_evidence_idx" ON "entities" USING btree ("evidence_level");--> statement-breakpoint
CREATE INDEX "entity_type_idx" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "post_slug_locale_idx" ON "posts" USING btree ("slug","locale");--> statement-breakpoint
CREATE INDEX "post_status_locale_idx" ON "posts" USING btree ("status","locale");--> statement-breakpoint
CREATE INDEX "post_published_at_idx" ON "posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "reply_entity_idx" ON "replies" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "review_logs" USING btree ("target_table","target_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "review_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "review_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "source_tier_idx" ON "sources" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_created_idx" ON "submissions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");