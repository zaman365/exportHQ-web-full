ALTER TABLE "company_profiles" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD COLUMN "trading_name" text;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD COLUMN "default_timezone" text DEFAULT 'Asia/Dhaka' NOT NULL;
