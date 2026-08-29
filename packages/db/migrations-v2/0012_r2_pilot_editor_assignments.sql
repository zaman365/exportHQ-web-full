CREATE TABLE "pilot_pass_editors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pilot_pass_grant_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "pilot_pass_editors_actor_check" CHECK (length(btrim("pilot_pass_editors"."actor_id")) > 0)
);
--> statement-breakpoint
ALTER TABLE "pilot_pass_editors" ADD CONSTRAINT "pilot_pass_editors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_pass_editors" ADD CONSTRAINT "pilot_pass_editors_pilot_pass_grant_id_pilot_pass_grants_id_fk" FOREIGN KEY ("pilot_pass_grant_id") REFERENCES "public"."pilot_pass_grants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_pass_editors_grant_actor_unique" ON "pilot_pass_editors" USING btree ("pilot_pass_grant_id","actor_id");--> statement-breakpoint
CREATE INDEX "pilot_pass_editors_org_actor_idx" ON "pilot_pass_editors" USING btree ("organization_id","actor_id");--> statement-breakpoint
ALTER TABLE pilot_pass_editors ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_pass_editors FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_pass_editors_read ON pilot_pass_editors FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_pass_editors_write ON pilot_pass_editors FOR ALL
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );
