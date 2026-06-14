ALTER TABLE "submissions" ADD COLUMN "report_category" varchar(50) NOT NULL DEFAULT 'commercial';--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "report_metadata" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "report_category" DROP DEFAULT;
