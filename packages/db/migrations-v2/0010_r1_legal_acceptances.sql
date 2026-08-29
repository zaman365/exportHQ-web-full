CREATE TYPE "public"."legal_document_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"status" "legal_document_status" DEFAULT 'draft' NOT NULL,
	"effective_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"published_by" text,
	"review_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_documents_hash_check" CHECK ("legal_documents"."content_hash_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "legal_documents_publication_check" CHECK ("legal_documents"."status" <> 'published' or num_nonnulls("legal_documents"."effective_at", "legal_documents"."published_at", "legal_documents"."published_by", "legal_documents"."review_reference") = 4)
);
--> statement-breakpoint
CREATE TABLE "organization_legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legal_document_id" uuid NOT NULL,
	"accepted_by" text NOT NULL,
	"accepted_version" text NOT NULL,
	"accepted_hash_sha256" text NOT NULL,
	"acceptance_source" text DEFAULT 'workspace' NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_legal_acceptances_hash_check" CHECK ("organization_legal_acceptances"."accepted_hash_sha256" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
ALTER TABLE "organization_legal_acceptances" ADD CONSTRAINT "organization_legal_acceptances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_legal_acceptances" ADD CONSTRAINT "organization_legal_acceptances_legal_document_id_legal_documents_id_fk" FOREIGN KEY ("legal_document_id") REFERENCES "public"."legal_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_slug_version_unique" ON "legal_documents" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "legal_documents_slug_status_idx" ON "legal_documents" USING btree ("slug","status","effective_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_legal_acceptances_org_id_unique" ON "organization_legal_acceptances" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_legal_acceptances_actor_document_unique" ON "organization_legal_acceptances" USING btree ("organization_id","accepted_by","legal_document_id");--> statement-breakpoint
CREATE INDEX "organization_legal_acceptances_org_actor_idx" ON "organization_legal_acceptances" USING btree ("organization_id","accepted_by","accepted_at");--> statement-breakpoint
ALTER TABLE organization_legal_acceptances ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE organization_legal_acceptances FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_legal_acceptances_read ON organization_legal_acceptances FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_legal_acceptances_insert ON organization_legal_acceptances FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND accepted_by = current_setting('app.actor_id', true)
    AND acceptance_source IN ('workspace', 'signup', 'api')
    AND EXISTS (
      SELECT 1 FROM legal_documents legal
      WHERE legal.id = legal_document_id
        AND legal.status = 'published'
        AND legal.effective_at <= now()
        AND legal.version = accepted_version
        AND legal.content_hash_sha256 = accepted_hash_sha256
    )
  );--> statement-breakpoint
INSERT INTO legal_documents (id, slug, version, title, summary, content_hash_sha256, status) VALUES
  ('2be994a4-240a-48d0-ae9a-21d90c3dba6a', 'privacy', '2026-08-29-draft.1', 'Privacy notice', 'How Export HQ proposes to collect, use, protect and delete personal data.', '3df670e02f20feb0e760393773142dae4ebd069a82999481eb3136d089511d43', 'draft'),
  ('e40ee5d5-8014-4b0e-8f2b-6dba2b55c494', 'terms', '2026-08-29-draft.1', 'Terms of service', 'Proposed rules for accounts, subscriptions, managed work and responsible use.', '9c5f6a6fc144c3f5535311d17060fa07e86ed4f02f77eb71458199acfb96c034', 'draft'),
  ('6b5cdfa3-8523-45cf-9138-3944a79bfab0', 'dpa', '2026-08-29-draft.1', 'Data processing addendum', 'Proposed processor commitments for customer-controlled personal data.', 'fc786aab1c94a0e746dcd6aacba0ffb5643e3ca7c8383154a9423e7b3f692a0f', 'draft'),
  ('2f458b9c-c46f-451d-81ef-b5bb51b7e30a', 'security', '2026-08-29-draft.1', 'Security overview', 'Implemented controls, fail-closed production gates and reporting route.', '522825bdeb628a2582b4c5d3595920a3d7f2a5b0c16a02d7af4bca7268514a47', 'draft'),
  ('11fb8cb8-7018-44ac-86c5-da4f2d8e793c', 'subprocessors', '2026-08-29-draft.1', 'Subprocessors', 'Proposed infrastructure providers and their activation state.', 'cf101335e44138e035b7824582e1e952d33d6a2a42128bd5c96b2f5ed6194da4', 'draft'),
  ('6dd8b3cf-b411-42c2-bc23-17bb240705ac', 'acceptable-use', '2026-08-29-draft.1', 'Acceptable use policy', 'Proposed restrictions that protect customers, providers and the platform.', '828bd80aaa8d0359ef3caa54a0d09c6065eab4623aa4f5ac7f92d4419be8e8d5', 'draft'),
  ('253c1dfc-a98f-4eaf-801d-aee8773fe698', 'cookies', '2026-08-29-draft.1', 'Cookie policy', 'Proposed use of essential session storage and consent-gated analytics.', '7264b37b57fca6eb3342ba44ab5db880e377c1767a72f25623da69b8a83de246', 'draft'),
  ('fd9ca718-8d86-4850-a6e4-6fdddf16b1ed', 'imprint', '2026-08-29-draft.1', 'Company and imprint information', 'Operator details that must be completed before external contracting.', 'efbaff254ff69a774db522479eba89dd2cdce04866874768708c6a0a43c260df', 'draft'),
  ('8c4f2969-99dc-4bfa-8d6e-43292cbdb932', 'service-boundaries', '2026-08-29-draft.1', 'Service and referral boundaries', 'What Export HQ coordinates, what requires approval and what it does not guarantee.', 'b59381c81f6f94de2e6edd1b07336b2b57c7365556eecfc828e2d124a177bd1a', 'draft');
