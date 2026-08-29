-- Composite tenant keys ensure that a guessed identifier cannot create a
-- cross-organization provenance or lane-impact relationship.
CREATE UNIQUE INDEX "ai_extraction_decisions_org_id_unique" ON "ai_extraction_field_decisions" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_decisions_org_id_field_unique" ON "ai_extraction_field_decisions" USING btree ("organization_id","id","extraction_field_id");--> statement-breakpoint
ALTER TABLE "regulatory_rule_lane_impacts" ADD CONSTRAINT "regulatory_impacts_lane_tenant_fk"
  FOREIGN KEY ("organization_id", "export_lane_id") REFERENCES "export_lanes" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_extraction_runs" ADD CONSTRAINT "ai_extraction_runs_version_tenant_fk"
  FOREIGN KEY ("organization_id", "document_version_id") REFERENCES "document_versions" ("organization_id", "id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ai_extraction_fields" ADD CONSTRAINT "ai_extraction_fields_run_tenant_fk"
  FOREIGN KEY ("organization_id", "extraction_run_id") REFERENCES "ai_extraction_runs" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_extraction_source_spans" ADD CONSTRAINT "ai_extraction_spans_field_tenant_fk"
  FOREIGN KEY ("organization_id", "extraction_field_id") REFERENCES "ai_extraction_fields" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_extraction_source_spans" ADD CONSTRAINT "ai_extraction_spans_version_tenant_fk"
  FOREIGN KEY ("organization_id", "document_version_id") REFERENCES "document_versions" ("organization_id", "id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ai_extraction_field_decisions" ADD CONSTRAINT "ai_extraction_decisions_field_tenant_fk"
  FOREIGN KEY ("organization_id", "extraction_field_id") REFERENCES "ai_extraction_fields" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_extraction_field_decisions" ADD CONSTRAINT "ai_extraction_decisions_supersedes_tenant_fk"
  FOREIGN KEY ("organization_id", "supersedes_decision_id", "extraction_field_id")
  REFERENCES "ai_extraction_field_decisions" ("organization_id", "id", "extraction_field_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ai_extraction_usages" ADD CONSTRAINT "ai_extraction_usages_field_tenant_fk"
  FOREIGN KEY ("organization_id", "extraction_field_id") REFERENCES "ai_extraction_fields" ("organization_id", "id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ai_extraction_usages" ADD CONSTRAINT "ai_extraction_usages_decision_field_tenant_fk"
  FOREIGN KEY ("organization_id", "decision_id", "extraction_field_id")
  REFERENCES "ai_extraction_field_decisions" ("organization_id", "id", "extraction_field_id") ON DELETE RESTRICT;
