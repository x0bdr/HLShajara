CREATE TYPE "public"."conduct_type" AS ENUM('detention', 'torture', 'disappearance', 'killing', 'sexualViolence', 'financing', 'arms', 'laundering', 'propaganda', 'informing', 'seizure', 'detentionSite', 'command', 'other');--> statement-breakpoint
CREATE TYPE "public"."role_in_conduct" AS ENUM('perpetrator', 'commander', 'financier', 'supplier', 'informant', 'owner', 'other');--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "is_anonymous" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "conduct_type" "conduct_type";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "role_in_conduct" "role_in_conduct";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "lead_note" text;