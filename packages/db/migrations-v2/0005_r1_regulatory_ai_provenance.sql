-- R1 reviewed regulatory publishing, lane-impact notification and immutable
-- AI extraction provenance. No provider call or automatic fact mutation is
-- activated by this schema.
CREATE TYPE "public"."ai_extraction_decision" AS ENUM('accepted', 'rejected', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."ai_extraction_run_state" AS ENUM('proposed', 'under_review', 'accepted', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."regulatory_impact_state" AS ENUM('pending', 'acknowledged', 'resolved', 'superseded');--> statement-breakpoint
CREATE TABLE "ai_extraction_field_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extraction_field_id" uuid NOT NULL,
	"decision" "ai_extraction_decision" NOT NULL,
	"accepted_value" jsonb,
	"rationale" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"supersedes_decision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_extraction_decisions_value_check" CHECK (("ai_extraction_field_decisions"."decision" = 'rejected' and "ai_extraction_field_decisions"."accepted_value" is null) or ("ai_extraction_field_decisions"."decision" in ('accepted', 'corrected') and "ai_extraction_field_decisions"."accepted_value" is not null)),
	CONSTRAINT "ai_extraction_decisions_rationale_check" CHECK (char_length(trim("ai_extraction_field_decisions"."rationale")) > 0)
);
--> statement-breakpoint
CREATE TABLE "ai_extraction_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extraction_run_id" uuid NOT NULL,
	"field_path" text NOT NULL,
	"proposed_value" jsonb NOT NULL,
	"confidence_bps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_extraction_fields_confidence_check" CHECK ("ai_extraction_fields"."confidence_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "ai_extraction_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"state" "ai_extraction_run_state" DEFAULT 'proposed' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"model_version" text NOT NULL,
	"extraction_schema" text NOT NULL,
	"extraction_schema_version" text NOT NULL,
	"prompt_version" text NOT NULL,
	"rule_version" text NOT NULL,
	"created_by" text NOT NULL,
	"completed_at" timestamp with time zone,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_extraction_runs_failure_check" CHECK (("ai_extraction_runs"."state" = 'failed') = ("ai_extraction_runs"."failure_code" is not null))
);
--> statement-breakpoint
CREATE TABLE "ai_extraction_source_spans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extraction_field_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"page_number" integer,
	"start_offset" integer,
	"end_offset" integer,
	"locator" text NOT NULL,
	"quote_hash_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_extraction_spans_page_check" CHECK ("ai_extraction_source_spans"."page_number" is null or "ai_extraction_source_spans"."page_number" >= 1),
	CONSTRAINT "ai_extraction_spans_offset_check" CHECK (num_nonnulls("ai_extraction_source_spans"."start_offset", "ai_extraction_source_spans"."end_offset") in (0, 2) and ("ai_extraction_source_spans"."start_offset" is null or ("ai_extraction_source_spans"."start_offset" >= 0 and "ai_extraction_source_spans"."end_offset" > "ai_extraction_source_spans"."start_offset"))),
	CONSTRAINT "ai_extraction_spans_hash_check" CHECK ("ai_extraction_source_spans"."quote_hash_sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "ai_extraction_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extraction_field_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"downstream_entity_type" text NOT NULL,
	"downstream_entity_id" uuid NOT NULL,
	"used_by" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"publisher_type" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"canonical_base_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_publishers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "regulatory_publishers_type_check" CHECK ("regulatory_publishers"."publisher_type" in ('official', 'intergovernmental', 'reviewed_commentary'))
);
--> statement-breakpoint
CREATE TABLE "regulatory_rule_lane_impacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"regulatory_rule_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"state" "regulatory_impact_state" DEFAULT 'pending' NOT NULL,
	"impact_type" text DEFAULT 'review_required' NOT NULL,
	"assessment_method_version" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp with time zone,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_lane_impacts_ack_check" CHECK (("regulatory_rule_lane_impacts"."state" <> 'acknowledged') or ("regulatory_rule_lane_impacts"."acknowledged_by" is not null and "regulatory_rule_lane_impacts"."acknowledged_at" is not null)),
	CONSTRAINT "regulatory_lane_impacts_resolve_check" CHECK (("regulatory_rule_lane_impacts"."state" <> 'resolved') or ("regulatory_rule_lane_impacts"."resolved_by" is not null and "regulatory_rule_lane_impacts"."resolved_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "regulatory_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"stable_key" text NOT NULL,
	"version" integer NOT NULL,
	"jurisdiction" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"product_categories" text[] DEFAULT '{}' NOT NULL,
	"hs_codes" text[] DEFAULT '{}' NOT NULL,
	"market_country_codes" text[] DEFAULT '{}' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"superseded_at" timestamp with time zone,
	"confidence" text NOT NULL,
	"method_version" text NOT NULL,
	"rule_version" text NOT NULL,
	"review_state" "review_state" DEFAULT 'pending_review' NOT NULL,
	"reviewed_by" text NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_rules_version_check" CHECK ("regulatory_rules"."version" >= 1),
	CONSTRAINT "regulatory_rules_confidence_check" CHECK ("regulatory_rules"."confidence" in ('high', 'medium', 'low'))
);
--> statement-breakpoint
CREATE TABLE "regulatory_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"source_type" text NOT NULL,
	"reference" text NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"effective_from" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"reviewed_by" text NOT NULL,
	"confidence" text NOT NULL,
	"method_version" text NOT NULL,
	"freshness_sla_days" integer NOT NULL,
	"next_review_at" timestamp with time zone NOT NULL,
	"review_state" "review_state" DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_sources_canonical_url_unique" UNIQUE("canonical_url"),
	CONSTRAINT "regulatory_sources_hash_check" CHECK ("regulatory_sources"."content_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "regulatory_sources_confidence_check" CHECK ("regulatory_sources"."confidence" in ('high', 'medium', 'low')),
	CONSTRAINT "regulatory_sources_freshness_check" CHECK ("regulatory_sources"."freshness_sla_days" between 1 and 3650),
	CONSTRAINT "regulatory_sources_review_window_check" CHECK ("regulatory_sources"."next_review_at" > "regulatory_sources"."reviewed_at")
);
--> statement-breakpoint
ALTER TABLE "ai_extraction_field_decisions" ADD CONSTRAINT "ai_extraction_field_decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_field_decisions" ADD CONSTRAINT "ai_extraction_field_decisions_extraction_field_id_ai_extraction_fields_id_fk" FOREIGN KEY ("extraction_field_id") REFERENCES "public"."ai_extraction_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_fields" ADD CONSTRAINT "ai_extraction_fields_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_fields" ADD CONSTRAINT "ai_extraction_fields_extraction_run_id_ai_extraction_runs_id_fk" FOREIGN KEY ("extraction_run_id") REFERENCES "public"."ai_extraction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_runs" ADD CONSTRAINT "ai_extraction_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_runs" ADD CONSTRAINT "ai_extraction_runs_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_source_spans" ADD CONSTRAINT "ai_extraction_source_spans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_source_spans" ADD CONSTRAINT "ai_extraction_source_spans_extraction_field_id_ai_extraction_fields_id_fk" FOREIGN KEY ("extraction_field_id") REFERENCES "public"."ai_extraction_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_source_spans" ADD CONSTRAINT "ai_extraction_source_spans_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_usages" ADD CONSTRAINT "ai_extraction_usages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_usages" ADD CONSTRAINT "ai_extraction_usages_extraction_field_id_ai_extraction_fields_id_fk" FOREIGN KEY ("extraction_field_id") REFERENCES "public"."ai_extraction_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_usages" ADD CONSTRAINT "ai_extraction_usages_decision_id_ai_extraction_field_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."ai_extraction_field_decisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rule_lane_impacts" ADD CONSTRAINT "regulatory_rule_lane_impacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rule_lane_impacts" ADD CONSTRAINT "regulatory_rule_lane_impacts_regulatory_rule_id_regulatory_rules_id_fk" FOREIGN KEY ("regulatory_rule_id") REFERENCES "public"."regulatory_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rule_lane_impacts" ADD CONSTRAINT "regulatory_rule_lane_impacts_export_lane_id_export_lanes_id_fk" FOREIGN KEY ("export_lane_id") REFERENCES "public"."export_lanes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_source_id_regulatory_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."regulatory_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_sources" ADD CONSTRAINT "regulatory_sources_publisher_id_regulatory_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."regulatory_publishers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_extraction_decisions_org_field_idx" ON "ai_extraction_field_decisions" USING btree ("organization_id","extraction_field_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_fields_org_id_unique" ON "ai_extraction_fields" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_fields_run_path_unique" ON "ai_extraction_fields" USING btree ("extraction_run_id","field_path");--> statement-breakpoint
CREATE INDEX "ai_extraction_fields_org_run_idx" ON "ai_extraction_fields" USING btree ("organization_id","extraction_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_runs_org_id_unique" ON "ai_extraction_runs" USING btree ("organization_id","id");--> statement-breakpoint
CREATE INDEX "ai_extraction_runs_org_document_idx" ON "ai_extraction_runs" USING btree ("organization_id","document_version_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_extraction_spans_org_field_idx" ON "ai_extraction_source_spans" USING btree ("organization_id","extraction_field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_usages_field_entity_unique" ON "ai_extraction_usages" USING btree ("extraction_field_id","downstream_entity_type","downstream_entity_id");--> statement-breakpoint
CREATE INDEX "ai_extraction_usages_org_entity_idx" ON "ai_extraction_usages" USING btree ("organization_id","downstream_entity_type","downstream_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "regulatory_lane_impacts_rule_lane_unique" ON "regulatory_rule_lane_impacts" USING btree ("organization_id","regulatory_rule_id","export_lane_id");--> statement-breakpoint
CREATE INDEX "regulatory_lane_impacts_org_state_idx" ON "regulatory_rule_lane_impacts" USING btree ("organization_id","state","detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "regulatory_rules_key_version_unique" ON "regulatory_rules" USING btree ("stable_key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "regulatory_rules_current_key_unique" ON "regulatory_rules" USING btree ("stable_key") WHERE "regulatory_rules"."superseded_at" is null;--> statement-breakpoint
CREATE INDEX "regulatory_rules_source_review_idx" ON "regulatory_rules" USING btree ("source_id","review_state");--> statement-breakpoint
CREATE INDEX "regulatory_sources_publisher_review_idx" ON "regulatory_sources" USING btree ("publisher_id","review_state","next_review_at");--> statement-breakpoint

ALTER TABLE regulatory_rule_lane_impacts ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE regulatory_rule_lane_impacts FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_regulatory_impacts_read ON regulatory_rule_lane_impacts FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_regulatory_impacts_detect ON regulatory_rule_lane_impacts FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND state = 'pending'
  );--> statement-breakpoint
CREATE POLICY tenant_regulatory_impacts_acknowledge ON regulatory_rule_lane_impacts FOR UPDATE
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND state = 'pending'
  )
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND state = 'acknowledged'
    AND acknowledged_by = current_setting('app.actor_id', true)
  );--> statement-breakpoint
CREATE POLICY operations_regulatory_impacts_write ON regulatory_rule_lane_impacts FOR UPDATE
  USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  )
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint

ALTER TABLE ai_extraction_runs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE ai_extraction_runs FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_ai_extraction_runs_read ON ai_extraction_runs FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY pipeline_ai_extraction_runs_insert ON ai_extraction_runs FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND current_setting('app.actor_type', true) IN ('staff', 'system')
  );--> statement-breakpoint
CREATE POLICY tenant_ai_extraction_runs_update ON ai_extraction_runs FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_extraction_fields', 'ai_extraction_source_spans'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || table_name || '_read', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid AND current_setting(''app.actor_type'', true) IN (''staff'', ''system''))',
      'pipeline_' || table_name || '_insert', table_name
    );
  END LOOP;
END
$rls$;--> statement-breakpoint

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_extraction_field_decisions', 'ai_extraction_usages'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || table_name || '_read', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || table_name || '_insert', table_name
    );
  END LOOP;
END
$rls$;
