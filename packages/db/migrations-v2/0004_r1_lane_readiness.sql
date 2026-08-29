-- Persist lane readiness and replace Clerk/browser authority. Existing referral
-- rows receive stable request keys. A previously matched provider is preserved
-- as a governed legacy record rather than being mislabeled as an ungoverned
-- support request.
ALTER TABLE "readiness_provider_referrals" ADD COLUMN "request_key" uuid;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD COLUMN "request_mode" text;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD COLUMN "governance_evidence_reference" text;--> statement-breakpoint
UPDATE "readiness_provider_referrals"
SET "request_key" = gen_random_uuid(),
    "request_mode" = CASE WHEN "matched_provider_id" IS NULL THEN 'support_request' ELSE 'governed_referral' END,
    "governance_evidence_reference" = CASE WHEN "matched_provider_id" IS NULL THEN NULL ELSE 'legacy-migration:0004' END;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ALTER COLUMN "request_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ALTER COLUMN "request_mode" SET DEFAULT 'support_request';--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ALTER COLUMN "request_mode" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_assessments_org_id_unique" ON "readiness_assessments" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_assessments_active_lane_unique" ON "readiness_assessments" USING btree ("organization_id","export_lane_id") WHERE "readiness_assessments"."export_lane_id" is not null and "readiness_assessments"."status" <> 'archived';--> statement-breakpoint
CREATE INDEX "readiness_provider_referrals_assessment_requirement_idx" ON "readiness_provider_referrals" USING btree ("organization_id","assessment_id","requirement_key");--> statement-breakpoint
CREATE UNIQUE INDEX "readiness_responses_org_id_unique" ON "readiness_responses" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_readiness_response_unique" ON "tasks" USING btree ("organization_id","related_entity_type","related_entity_id") WHERE "tasks"."related_entity_type" = 'readiness_response';--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_provider_referrals_request_key_unique" UNIQUE("request_key");--> statement-breakpoint
ALTER TABLE "readiness_responses" ADD CONSTRAINT "readiness_responses_assessment_tenant_fk"
  FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "readiness_assessments" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_assessment_tenant_fk"
  FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "readiness_assessments" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_response_tenant_fk"
  FOREIGN KEY ("organization_id", "readiness_response_id") REFERENCES "readiness_responses" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "readiness_evidence_reviews" ADD CONSTRAINT "readiness_evidence_version_tenant_fk"
  FOREIGN KEY ("organization_id", "document_version_id") REFERENCES "document_versions" ("organization_id", "id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_referrals_assessment_tenant_fk"
  FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "readiness_assessments" ("organization_id", "id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "readiness_provider_referrals" ADD CONSTRAINT "readiness_provider_referrals_mode_check" CHECK (
    ("readiness_provider_referrals"."request_mode" = 'support_request' and "readiness_provider_referrals"."governance_evidence_reference" is null and "readiness_provider_referrals"."matched_provider_id" is null)
    or ("readiness_provider_referrals"."request_mode" = 'governed_referral' and "readiness_provider_referrals"."governance_evidence_reference" is not null)
  );
