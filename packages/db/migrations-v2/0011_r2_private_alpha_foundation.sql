CREATE TYPE "public"."pilot_metric_event_name" AS ENUM('invite_sent', 'organization_created', 'passport_started', 'passport_completed', 'lane_created', 'action_plan_ready', 'canonical_field_reused', 'canonical_field_reentered', 'upload_requested', 'scan_completed', 'scan_failed', 'review_completed', 'review_failed', 'task_completed', 'task_overdue', 'support_intervention', 'extraction_corrected', 'trust_surveyed', 'willingness_to_pay_recorded', 'coordination_burden_replaced');--> statement-breakpoint
CREATE TYPE "public"."pilot_participation_status" AS ENUM('invited', 'accepted', 'active', 'paused', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."pilot_pass_status" AS ENUM('active', 'extended', 'converted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."pilot_support_status" AS ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "pilot_metric_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"participation_id" uuid,
	"export_lane_id" uuid,
	"event_name" "pilot_metric_event_name" NOT NULL,
	"actor_hash_sha256" text NOT NULL,
	"duration_seconds" integer,
	"quantity" integer,
	"success" boolean,
	"field_type" text,
	"outcome_code" text,
	"dedupe_key" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_metric_events_actor_hash_check" CHECK ("pilot_metric_events"."actor_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "pilot_metric_events_duration_check" CHECK ("pilot_metric_events"."duration_seconds" is null or "pilot_metric_events"."duration_seconds" >= 0),
	CONSTRAINT "pilot_metric_events_quantity_check" CHECK ("pilot_metric_events"."quantity" is null or "pilot_metric_events"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pilot_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"participation_id" uuid NOT NULL,
	"observation_type" text NOT NULL,
	"summary" text NOT NULL,
	"workaround" text,
	"replaced_burden" text DEFAULT 'none' NOT NULL,
	"trust_score" integer,
	"willingness_to_pay_minor" integer,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"observed_by" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_observations_type_check" CHECK ("pilot_observations"."observation_type" in ('customer_observation', 'workaround', 'pricing', 'trust', 'burden_replacement', 'outcome')),
	CONSTRAINT "pilot_observations_burden_check" CHECK ("pilot_observations"."replaced_burden" in ('none', 'spreadsheet', 'email', 'whatsapp', 'multiple')),
	CONSTRAINT "pilot_observations_trust_check" CHECK ("pilot_observations"."trust_score" is null or "pilot_observations"."trust_score" between 1 and 5),
	CONSTRAINT "pilot_observations_wtp_check" CHECK ("pilot_observations"."willingness_to_pay_minor" is null or ("pilot_observations"."willingness_to_pay_minor" >= 0 and "pilot_observations"."currency" = 'BDT'))
);
--> statement-breakpoint
CREATE TABLE "pilot_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cohort_code" text NOT NULL,
	"exporter_stage" text NOT NULL,
	"sectors" text[] NOT NULL,
	"destination_country_codes" text[] NOT NULL,
	"status" "pilot_participation_status" DEFAULT 'invited' NOT NULL,
	"agreement_version" text,
	"agreement_hash_sha256" text,
	"agreement_accepted_by" text,
	"agreement_accepted_at" timestamp with time zone,
	"data_handling_version" text NOT NULL,
	"support_owner_actor_id" text,
	"support_hours" text NOT NULL,
	"invited_by" text NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_participations_stage_check" CHECK ("pilot_participations"."exporter_stage" in ('established', 'first_shipment', 'second_shipment')),
	CONSTRAINT "pilot_participations_sector_check" CHECK (cardinality("pilot_participations"."sectors") >= 1),
	CONSTRAINT "pilot_participations_destination_check" CHECK (cardinality("pilot_participations"."destination_country_codes") >= 1),
	CONSTRAINT "pilot_participations_agreement_hash_check" CHECK ("pilot_participations"."agreement_hash_sha256" is null or "pilot_participations"."agreement_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "pilot_participations_acceptance_check" CHECK ("pilot_participations"."status" = 'invited' or num_nonnulls("pilot_participations"."agreement_version", "pilot_participations"."agreement_hash_sha256", "pilot_participations"."agreement_accepted_by", "pilot_participations"."agreement_accepted_at") = 4),
	CONSTRAINT "pilot_participations_active_owner_check" CHECK ("pilot_participations"."status" not in ('active', 'paused', 'completed') or ("pilot_participations"."support_owner_actor_id" is not null and "pilot_participations"."started_at" is not null)),
	CONSTRAINT "pilot_participations_end_check" CHECK ("pilot_participations"."status" not in ('completed', 'withdrawn') or "pilot_participations"."ended_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "pilot_pass_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"participation_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"product_key" text DEFAULT 'first_shipment_pass' NOT NULL,
	"price_hypothesis_minor" integer DEFAULT 750000 NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"lane_limit" integer DEFAULT 1 NOT NULL,
	"editor_limit" integer DEFAULT 3 NOT NULL,
	"launch_credit_bps" integer DEFAULT 10000 NOT NULL,
	"status" "pilot_pass_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL,
	"granted_by" text NOT NULL,
	"converted_at" timestamp with time zone,
	"conversion_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_pass_grants_product_check" CHECK ("pilot_pass_grants"."product_key" = 'first_shipment_pass'),
	CONSTRAINT "pilot_pass_grants_price_check" CHECK ("pilot_pass_grants"."price_hypothesis_minor" = 750000 and "pilot_pass_grants"."currency" = 'BDT'),
	CONSTRAINT "pilot_pass_grants_limits_check" CHECK ("pilot_pass_grants"."lane_limit" = 1 and "pilot_pass_grants"."editor_limit" = 3 and "pilot_pass_grants"."launch_credit_bps" = 10000),
	CONSTRAINT "pilot_pass_grants_window_check" CHECK ("pilot_pass_grants"."expires_at" > "pilot_pass_grants"."starts_at"),
	CONSTRAINT "pilot_pass_grants_extension_check" CHECK ("pilot_pass_grants"."extension_count" between 0 and 10),
	CONSTRAINT "pilot_pass_grants_conversion_check" CHECK (("pilot_pass_grants"."status" = 'converted') = ("pilot_pass_grants"."converted_at" is not null and "pilot_pass_grants"."conversion_reference" is not null))
);
--> statement-breakpoint
CREATE TABLE "pilot_support_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"participation_id" uuid NOT NULL,
	"export_lane_id" uuid,
	"title" text NOT NULL,
	"scope" text NOT NULL,
	"responsibility" "responsibility" NOT NULL,
	"owner_actor_id" text NOT NULL,
	"sla_response_minutes" integer NOT NULL,
	"response_due_at" timestamp with time zone NOT NULL,
	"resolution_due_at" timestamp with time zone,
	"status" "pilot_support_status" DEFAULT 'open' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_support_cases_sla_check" CHECK ("pilot_support_cases"."sla_response_minutes" between 15 and 10080),
	CONSTRAINT "pilot_support_cases_version_check" CHECK ("pilot_support_cases"."version" >= 1),
	CONSTRAINT "pilot_support_cases_resolution_check" CHECK ("pilot_support_cases"."status" not in ('resolved', 'closed') or "pilot_support_cases"."resolved_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "pilot_work_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"support_case_id" uuid NOT NULL,
	"support_minutes" integer NOT NULL,
	"specialist_cost_minor" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"automation_units" integer DEFAULT 0 NOT NULL,
	"correction_count" integer DEFAULT 0 NOT NULL,
	"outcome_code" text NOT NULL,
	"recorded_by" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_work_logs_minutes_check" CHECK ("pilot_work_logs"."support_minutes" between 1 and 1440),
	CONSTRAINT "pilot_work_logs_cost_check" CHECK ("pilot_work_logs"."specialist_cost_minor" >= 0 and "pilot_work_logs"."currency" = 'BDT'),
	CONSTRAINT "pilot_work_logs_usage_check" CHECK ("pilot_work_logs"."automation_units" >= 0 and "pilot_work_logs"."correction_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "company_profiles" ADD COLUMN "default_locale" text DEFAULT 'bn' NOT NULL;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD COLUMN "low_data_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pilot_metric_events" ADD CONSTRAINT "pilot_metric_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_metric_events" ADD CONSTRAINT "pilot_metric_events_participation_id_pilot_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."pilot_participations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_metric_events" ADD CONSTRAINT "pilot_metric_events_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_observations" ADD CONSTRAINT "pilot_observations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_observations" ADD CONSTRAINT "pilot_observations_participation_id_pilot_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."pilot_participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_participations" ADD CONSTRAINT "pilot_participations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_pass_grants" ADD CONSTRAINT "pilot_pass_grants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_pass_grants" ADD CONSTRAINT "pilot_pass_grants_participation_id_pilot_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."pilot_participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_pass_grants" ADD CONSTRAINT "pilot_pass_grants_entitlement_id_organization_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."organization_entitlements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_support_cases" ADD CONSTRAINT "pilot_support_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_support_cases" ADD CONSTRAINT "pilot_support_cases_participation_id_pilot_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."pilot_participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_support_cases" ADD CONSTRAINT "pilot_support_cases_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_work_logs" ADD CONSTRAINT "pilot_work_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_work_logs" ADD CONSTRAINT "pilot_work_logs_support_case_id_pilot_support_cases_id_fk" FOREIGN KEY ("support_case_id") REFERENCES "public"."pilot_support_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_metric_events_org_dedupe_unique" ON "pilot_metric_events" USING btree ("organization_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "pilot_metric_events_org_name_time_idx" ON "pilot_metric_events" USING btree ("organization_id","event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "pilot_observations_org_participation_time_idx" ON "pilot_observations" USING btree ("organization_id","participation_id","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_participations_org_unique" ON "pilot_participations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pilot_participations_cohort_status_idx" ON "pilot_participations" USING btree ("cohort_code","status");--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_pass_grants_entitlement_unique" ON "pilot_pass_grants" USING btree ("entitlement_id");--> statement-breakpoint
CREATE INDEX "pilot_pass_grants_org_status_expiry_idx" ON "pilot_pass_grants" USING btree ("organization_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_support_cases_org_id_unique" ON "pilot_support_cases" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "pilot_support_cases_org_status_due_idx" ON "pilot_support_cases" USING btree ("organization_id","status","response_due_at");--> statement-breakpoint
CREATE INDEX "pilot_work_logs_org_case_time_idx" ON "pilot_work_logs" USING btree ("organization_id","support_case_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_participations_org_id_unique" ON "pilot_participations" ("organization_id", "id");--> statement-breakpoint
ALTER TABLE "pilot_pass_grants" ADD CONSTRAINT "pilot_pass_grants_participation_tenant_fk"
  FOREIGN KEY ("organization_id", "participation_id") REFERENCES "pilot_participations" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pilot_support_cases" ADD CONSTRAINT "pilot_support_cases_participation_tenant_fk"
  FOREIGN KEY ("organization_id", "participation_id") REFERENCES "pilot_participations" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pilot_support_cases" ADD CONSTRAINT "pilot_support_cases_lane_tenant_fk"
  FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "export_lanes" ("organization_id", "id");--> statement-breakpoint
ALTER TABLE "pilot_work_logs" ADD CONSTRAINT "pilot_work_logs_case_tenant_fk"
  FOREIGN KEY ("organization_id", "support_case_id") REFERENCES "pilot_support_cases" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pilot_observations" ADD CONSTRAINT "pilot_observations_participation_tenant_fk"
  FOREIGN KEY ("organization_id", "participation_id") REFERENCES "pilot_participations" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pilot_metric_events" ADD CONSTRAINT "pilot_metric_events_participation_tenant_fk"
  FOREIGN KEY ("organization_id", "participation_id") REFERENCES "pilot_participations" ("organization_id", "id");--> statement-breakpoint
ALTER TABLE "pilot_metric_events" ADD CONSTRAINT "pilot_metric_events_lane_tenant_fk"
  FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "export_lanes" ("organization_id", "id");--> statement-breakpoint
ALTER TABLE pilot_participations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_participations FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_participations_read ON pilot_participations FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_participations_insert ON pilot_participations FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
CREATE POLICY operations_pilot_participations_update ON pilot_participations FOR UPDATE
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
CREATE POLICY customer_pilot_agreement_acceptance ON pilot_participations FOR UPDATE
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) = 'customer'
    AND status = 'invited'
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) = 'customer'
    AND status = 'accepted'
    AND agreement_accepted_by = current_setting('app.actor_id', true)
    AND agreement_accepted_at IS NOT NULL
    AND support_owner_actor_id IS NULL
    AND started_at IS NULL
    AND ended_at IS NULL
  );--> statement-breakpoint
ALTER TABLE pilot_pass_grants ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_pass_grants FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_pass_grants_read ON pilot_pass_grants FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_pass_grants_write ON pilot_pass_grants FOR ALL
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
ALTER TABLE pilot_support_cases ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_support_cases FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_support_cases_read ON pilot_support_cases FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_support_cases_write ON pilot_support_cases FOR ALL
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  ) WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
ALTER TABLE pilot_work_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_work_logs FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_work_logs_read ON pilot_work_logs FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_work_logs_insert ON pilot_work_logs FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
ALTER TABLE pilot_observations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_observations FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_observations_read ON pilot_observations FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_pilot_observations_insert ON pilot_observations FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
ALTER TABLE pilot_metric_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE pilot_metric_events FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_pilot_metric_events_read ON pilot_metric_events FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_pilot_metric_events_insert ON pilot_metric_events FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
