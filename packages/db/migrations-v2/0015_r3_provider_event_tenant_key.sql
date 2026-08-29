ALTER TABLE "billing_provider_events" DROP CONSTRAINT "billing_provider_events_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "billing_provider_events" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_provider_events" ADD CONSTRAINT "billing_provider_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;