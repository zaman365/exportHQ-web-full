-- R1 trusted-slice foundation: the tenant-scoped Export Lane aggregate.
-- Forward-only migration. A rollback must first prove that no lane has become
-- authoritative; otherwise restore the pre-migration snapshot rather than
-- dropping customer decisions or stage history.

CREATE TYPE "public"."export_lane_status" AS ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."export_lane_stage" AS ENUM('opportunity', 'readiness', 'evidence', 'buyer', 'offer', 'production', 'shipment', 'payment', 'repeat');--> statement-breakpoint
CREATE TYPE "public"."export_lane_health" AS ENUM('on_track', 'needs_attention', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."export_lane_incoterm" AS ENUM('FOB', 'CIF', 'DDP');--> statement-breakpoint
CREATE TYPE "public"."export_lane_participant_role" AS ENUM('owner', 'contributor', 'reviewer', 'observer');--> statement-breakpoint
CREATE TYPE "public"."export_lane_decision_status" AS ENUM('proposed', 'approved', 'rejected', 'superseded');--> statement-breakpoint

ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_org_id_unique" UNIQUE("organization_id", "id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_unique" UNIQUE("organization_id", "id");--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_org_id_unique" UNIQUE("organization_id", "id");--> statement-breakpoint

CREATE TABLE "export_lanes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"origin_country_code" text NOT NULL,
	"destination_country_code" text NOT NULL,
	"sales_channel" text NOT NULL,
	"buyer_segment" text NOT NULL,
	"route" text NOT NULL,
	"incoterm" "export_lane_incoterm" NOT NULL,
	"status" "export_lane_status" DEFAULT 'draft' NOT NULL,
	"health" "export_lane_health" DEFAULT 'on_track' NOT NULL,
	"stage" "export_lane_stage" DEFAULT 'opportunity' NOT NULL,
	"target_margin_bps" integer NOT NULL,
	"currency" text NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_lanes_country_codes_check" CHECK (char_length("origin_country_code") = 2 AND char_length("destination_country_code") = 2),
	CONSTRAINT "export_lanes_currency_check" CHECK (char_length("currency") = 3),
	CONSTRAINT "export_lanes_target_margin_check" CHECK ("target_margin_bps" BETWEEN 0 AND 10000),
	CONSTRAINT "export_lanes_version_check" CHECK ("version" >= 1),
	CONSTRAINT "export_lanes_archival_check" CHECK (("status" = 'archived') = ("archived_at" IS NOT NULL)),
	CONSTRAINT "export_lanes_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
	CONSTRAINT "export_lanes_product_tenant_fk" FOREIGN KEY ("organization_id", "product_id") REFERENCES "public"."products"("organization_id", "id") ON DELETE RESTRICT,
	CONSTRAINT "export_lanes_owner_tenant_fk" FOREIGN KEY ("organization_id", "owner_membership_id") REFERENCES "public"."organization_memberships"("organization_id", "id") ON DELETE RESTRICT,
	CONSTRAINT "export_lanes_org_id_unique" UNIQUE("organization_id", "id")
);--> statement-breakpoint

CREATE TABLE "export_lane_stage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"from_status" "export_lane_status" NOT NULL,
	"to_status" "export_lane_status" NOT NULL,
	"from_stage" "export_lane_stage" NOT NULL,
	"to_stage" "export_lane_stage" NOT NULL,
	"aggregate_version" integer NOT NULL,
	"changed_by" text NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_lane_stage_events_lane_version_unique" UNIQUE("export_lane_id", "aggregate_version"),
	CONSTRAINT "export_lane_stage_events_version_check" CHECK ("aggregate_version" >= 2),
	CONSTRAINT "export_lane_stage_events_rationale_check" CHECK (char_length(trim("rationale")) > 0),
	CONSTRAINT "export_lane_stage_events_lane_tenant_fk" FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "public"."export_lanes"("organization_id", "id") ON DELETE CASCADE
);--> statement-breakpoint

CREATE TABLE "export_lane_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"membership_id" uuid,
	"staff_profile_id" uuid,
	"external_reference" text,
	"role" "export_lane_participant_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_lane_participants_identity_check" CHECK (num_nonnulls("membership_id", "staff_profile_id", "external_reference") = 1),
	CONSTRAINT "export_lane_participants_lane_tenant_fk" FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "public"."export_lanes"("organization_id", "id") ON DELETE CASCADE,
	CONSTRAINT "export_lane_participants_membership_tenant_fk" FOREIGN KEY ("organization_id", "membership_id") REFERENCES "public"."organization_memberships"("organization_id", "id") ON DELETE CASCADE,
	CONSTRAINT "export_lane_participants_staff_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."staff_profiles"("id") ON DELETE CASCADE
);--> statement-breakpoint

CREATE TABLE "export_lane_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"export_lane_id" uuid NOT NULL,
	"decision_type" text NOT NULL,
	"status" "export_lane_decision_status" DEFAULT 'proposed' NOT NULL,
	"summary" text NOT NULL,
	"rationale" text NOT NULL,
	"evidence_document_version_id" uuid,
	"decided_by" text NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"supersedes_decision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_lane_decisions_summary_check" CHECK (char_length(trim("summary")) > 0),
	CONSTRAINT "export_lane_decisions_rationale_check" CHECK (char_length(trim("rationale")) > 0),
	CONSTRAINT "export_lane_decisions_lane_tenant_fk" FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "public"."export_lanes"("organization_id", "id") ON DELETE CASCADE,
	CONSTRAINT "export_lane_decisions_evidence_tenant_fk" FOREIGN KEY ("organization_id", "evidence_document_version_id") REFERENCES "public"."document_versions"("organization_id", "id") ON DELETE RESTRICT,
	CONSTRAINT "export_lane_decisions_org_id_unique" UNIQUE("organization_id", "id"),
	CONSTRAINT "export_lane_decisions_supersedes_tenant_fk" FOREIGN KEY ("organization_id", "supersedes_decision_id") REFERENCES "public"."export_lane_decisions"("organization_id", "id") ON DELETE RESTRICT
);--> statement-breakpoint

CREATE INDEX "export_lanes_org_updated_idx" ON "export_lanes" USING btree ("organization_id", "updated_at");--> statement-breakpoint
CREATE INDEX "export_lanes_org_status_stage_idx" ON "export_lanes" USING btree ("organization_id", "status", "stage");--> statement-breakpoint
CREATE INDEX "export_lane_stage_events_org_lane_idx" ON "export_lane_stage_events" USING btree ("organization_id", "export_lane_id");--> statement-breakpoint
CREATE INDEX "export_lane_participants_org_lane_idx" ON "export_lane_participants" USING btree ("organization_id", "export_lane_id");--> statement-breakpoint
CREATE UNIQUE INDEX "export_lane_participants_membership_unique" ON "export_lane_participants" USING btree ("export_lane_id", "membership_id") WHERE "membership_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "export_lane_participants_staff_unique" ON "export_lane_participants" USING btree ("export_lane_id", "staff_profile_id") WHERE "staff_profile_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "export_lane_decisions_org_lane_idx" ON "export_lane_decisions" USING btree ("organization_id", "export_lane_id");--> statement-breakpoint
CREATE INDEX "export_lane_decisions_lane_type_idx" ON "export_lane_decisions" USING btree ("export_lane_id", "decision_type", "decided_at");--> statement-breakpoint

ALTER TABLE "export_lanes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "export_lanes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_export_lanes" ON "export_lanes"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "export_lane_stage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "export_lane_stage_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_export_lane_stage_events_read" ON "export_lane_stage_events"
  FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_export_lane_stage_events_insert" ON "export_lane_stage_events"
  FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "export_lane_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "export_lane_participants" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_export_lane_participants" ON "export_lane_participants"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "export_lane_decisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "export_lane_decisions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_export_lane_decisions" ON "export_lane_decisions"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
