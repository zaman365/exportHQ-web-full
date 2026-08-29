CREATE TABLE "billing_cancellation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"reason" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"processed_by" text,
	"processed_at" timestamp with time zone,
	"processing_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_cancellation_status_check" CHECK ("billing_cancellation_requests"."status" in ('requested', 'processed', 'rejected')),
	CONSTRAINT "billing_cancellation_window_check" CHECK ("billing_cancellation_requests"."effective_at" >= "billing_cancellation_requests"."requested_at"),
	CONSTRAINT "billing_cancellation_processing_check" CHECK ("billing_cancellation_requests"."status" = 'requested' or num_nonnulls("billing_cancellation_requests"."processed_by", "billing_cancellation_requests"."processed_at", "billing_cancellation_requests"."processing_reference") = 3)
);
--> statement-breakpoint
ALTER TABLE "billing_cancellation_requests" ADD CONSTRAINT "billing_cancellation_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_cancellation_requests" ADD CONSTRAINT "billing_cancellation_requests_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_cancellation_open_subscription_unique" ON "billing_cancellation_requests" USING btree ("subscription_id") WHERE "billing_cancellation_requests"."status" = 'requested';--> statement-breakpoint
CREATE UNIQUE INDEX "billing_cancellation_org_id_unique" ON "billing_cancellation_requests" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "billing_cancellation_org_status_idx" ON "billing_cancellation_requests" USING btree ("organization_id","status","requested_at");
--> statement-breakpoint
ALTER TABLE billing_cancellation_requests ADD CONSTRAINT billing_cancellation_subscription_tenant_fk
  FOREIGN KEY (organization_id, subscription_id) REFERENCES billing_subscriptions (organization_id, id);--> statement-breakpoint
ALTER TABLE billing_cancellation_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE billing_cancellation_requests FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_billing_cancellation_read ON billing_cancellation_requests FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_billing_cancellation_request ON billing_cancellation_requests FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND status = 'requested'
    AND requested_by = current_setting('app.actor_id', true)
  );--> statement-breakpoint
CREATE POLICY operations_billing_cancellation_process ON billing_cancellation_requests FOR UPDATE
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );
