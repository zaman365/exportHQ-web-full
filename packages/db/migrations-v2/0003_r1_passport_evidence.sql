-- R1 Business Passport, private-evidence metadata and versioned business
-- verification cases. Bytes remain disabled until the private EU R2 bindings,
-- isolated scanner and Gate 2 evidence are present.
-- Forward-only: rollback through a pre-migration snapshot once any evidence or
-- verification case is authoritative; never drop these tables in place.

CREATE TYPE evidence_scan_state AS ENUM ('queued', 'scanning', 'clean', 'rejected', 'retryable_failure', 'dead_letter');--> statement-breakpoint
CREATE TYPE evidence_share_status AS ENUM ('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE evidence_storage_state AS ENUM ('quarantine', 'clean', 'rejected', 'deleted');--> statement-breakpoint
CREATE TYPE evidence_upload_intent_status AS ENUM ('pending', 'consumed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE passport_fact_status AS ENUM ('declared', 'evidence_added', 'under_review', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE verification_case_status AS ENUM ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'withdrawn');--> statement-breakpoint

ALTER TABLE documents ADD CONSTRAINT documents_org_id_unique UNIQUE (organization_id, id);--> statement-breakpoint
ALTER TABLE facilities ADD CONSTRAINT facilities_org_id_unique UNIQUE (organization_id, id);--> statement-breakpoint

CREATE TABLE document_upload_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_id uuid NOT NULL,
  document_version_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE,
  expected_mime_type text NOT NULL,
  expected_byte_size integer NOT NULL,
  expected_checksum_sha256 text NOT NULL,
  status evidence_upload_intent_status NOT NULL DEFAULT 'pending',
  created_by text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_upload_intents_mime_check CHECK (expected_mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  CONSTRAINT document_upload_intents_size_check CHECK (expected_byte_size BETWEEN 1 AND 26214400),
  CONSTRAINT document_upload_intents_checksum_check CHECK (expected_checksum_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT document_upload_intents_consumption_check CHECK ((status = 'consumed') = (consumed_at IS NOT NULL)),
  CONSTRAINT document_upload_intents_document_tenant_fk FOREIGN KEY (organization_id, document_id) REFERENCES documents (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT document_upload_intents_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT document_upload_intents_org_id_unique UNIQUE (organization_id, id)
);--> statement-breakpoint

CREATE TABLE document_storage_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_version_id uuid NOT NULL UNIQUE,
  state evidence_storage_state NOT NULL DEFAULT 'quarantine',
  object_key text NOT NULL UNIQUE,
  provider_version text NOT NULL,
  etag text NOT NULL,
  byte_size integer NOT NULL,
  checksum_sha256 text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_storage_objects_size_check CHECK (byte_size BETWEEN 1 AND 26214400),
  CONSTRAINT document_storage_objects_checksum_check CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT document_storage_objects_deletion_check CHECK ((state = 'deleted') = (deleted_at IS NOT NULL)),
  CONSTRAINT document_storage_objects_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT document_storage_objects_org_id_unique UNIQUE (organization_id, id)
);--> statement-breakpoint

CREATE TABLE document_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_version_id uuid NOT NULL,
  state evidence_scan_state NOT NULL,
  attempt integer NOT NULL,
  scanner_reference text,
  safe_reason_code text,
  recorded_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_scan_events_attempt_check CHECK (attempt BETWEEN 1 AND 5),
  CONSTRAINT document_scan_events_version_state_unique UNIQUE (document_version_id, attempt, state),
  CONSTRAINT document_scan_events_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE document_evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  purpose text NOT NULL,
  linked_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_evidence_links_unique UNIQUE (document_version_id, entity_type, entity_id, purpose),
  CONSTRAINT document_evidence_links_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE document_external_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status evidence_share_status NOT NULL DEFAULT 'active',
  purpose text NOT NULL,
  recipient_reference text NOT NULL,
  created_by text NOT NULL,
  expires_at timestamptz NOT NULL,
  maximum_downloads integer NOT NULL DEFAULT 1,
  download_count integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  revoked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_external_shares_download_check CHECK (maximum_downloads BETWEEN 1 AND 100 AND download_count BETWEEN 0 AND maximum_downloads),
  CONSTRAINT document_external_shares_revocation_check CHECK ((status = 'revoked') = (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)),
  CONSTRAINT document_external_shares_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE legal_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  authority_reference text NOT NULL,
  applied_by text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  released_by text,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legal_holds_release_check CHECK (num_nonnulls(released_by, released_at) IN (0, 2))
);--> statement-breakpoint

CREATE TABLE company_registration_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction_country_code text NOT NULL CHECK (char_length(jurisdiction_country_code) = 2),
  registration_authority text NOT NULL,
  registration_number text NOT NULL,
  registration_type text NOT NULL,
  status passport_fact_status NOT NULL DEFAULT 'declared',
  evidence_document_version_id uuid,
  valid_from timestamptz,
  expires_at timestamptz,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_registration_facts_unique UNIQUE (organization_id, registration_authority, registration_number),
  CONSTRAINT company_registration_evidence_tenant_fk FOREIGN KEY (organization_id, evidence_document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE company_signatory_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  membership_id uuid,
  display_name text NOT NULL,
  position_title text NOT NULL,
  authority_scope text NOT NULL,
  status passport_fact_status NOT NULL DEFAULT 'declared',
  evidence_document_version_id uuid,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_signatory_window_check CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT company_signatory_membership_tenant_fk FOREIGN KEY (organization_id, membership_id) REFERENCES organization_memberships (organization_id, id) ON DELETE SET NULL (membership_id),
  CONSTRAINT company_signatory_evidence_tenant_fk FOREIGN KEY (organization_id, evidence_document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE company_contact_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_type text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  "primary" boolean NOT NULL DEFAULT false,
  status passport_fact_status NOT NULL DEFAULT 'declared',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE company_banking_route_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  bank_country_code text NOT NULL CHECK (char_length(bank_country_code) = 2),
  swift_bic text,
  beneficiary_name text NOT NULL,
  masked_account_reference text NOT NULL CHECK (masked_account_reference !~ '[0-9]{7,}'),
  currencies text[] NOT NULL DEFAULT '{}',
  status passport_fact_status NOT NULL DEFAULT 'declared',
  evidence_document_version_id uuid,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_banking_evidence_tenant_fk FOREIGN KEY (organization_id, evidence_document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE facility_capacity_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL,
  product_id uuid,
  capacity_amount integer NOT NULL CHECK (capacity_amount > 0),
  capacity_unit text NOT NULL,
  period text NOT NULL,
  lead_time_days integer CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  status passport_fact_status NOT NULL DEFAULT 'declared',
  evidence_document_version_id uuid,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facility_capacity_facility_tenant_fk FOREIGN KEY (organization_id, facility_id) REFERENCES facilities (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT facility_capacity_product_tenant_fk FOREIGN KEY (organization_id, product_id) REFERENCES products (organization_id, id) ON DELETE SET NULL (product_id),
  CONSTRAINT facility_capacity_evidence_tenant_fk FOREIGN KEY (organization_id, evidence_document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE business_verification_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status verification_case_status NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  subject_legal_name text NOT NULL,
  subject_country_code text NOT NULL CHECK (char_length(subject_country_code) = 2),
  submitted_by text,
  submitted_at timestamptz,
  assigned_reviewer text,
  review_due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_verification_cases_org_id_unique UNIQUE (organization_id, id)
);--> statement-breakpoint

CREATE TABLE business_verification_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id uuid NOT NULL,
  document_version_id uuid NOT NULL,
  evidence_type text NOT NULL,
  added_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_verification_evidence_unique UNIQUE (case_id, document_version_id, evidence_type),
  CONSTRAINT business_verification_evidence_case_tenant_fk FOREIGN KEY (organization_id, case_id) REFERENCES business_verification_cases (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT business_verification_evidence_version_tenant_fk FOREIGN KEY (organization_id, document_version_id) REFERENCES document_versions (organization_id, id) ON DELETE RESTRICT
);--> statement-breakpoint

CREATE TABLE business_verification_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id uuid NOT NULL,
  from_status verification_case_status NOT NULL,
  to_status verification_case_status NOT NULL,
  case_version integer NOT NULL CHECK (case_version >= 2),
  rationale text NOT NULL CHECK (char_length(trim(rationale)) > 0),
  changed_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_verification_history_case_version_unique UNIQUE (case_id, case_version),
  CONSTRAINT business_verification_history_case_tenant_fk FOREIGN KEY (organization_id, case_id) REFERENCES business_verification_cases (organization_id, id) ON DELETE CASCADE
);--> statement-breakpoint

ALTER TABLE readiness_assessments ADD COLUMN export_lane_id uuid;--> statement-breakpoint
ALTER TABLE readiness_assessments ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version >= 1);--> statement-breakpoint
ALTER TABLE readiness_provider_referrals ADD COLUMN export_lane_id uuid;--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN export_lane_id uuid;--> statement-breakpoint
ALTER TABLE readiness_assessments ADD CONSTRAINT readiness_assessments_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE readiness_provider_referrals ADD CONSTRAINT readiness_referrals_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE tasks ADD CONSTRAINT tasks_lane_tenant_fk FOREIGN KEY (organization_id, export_lane_id) REFERENCES export_lanes (organization_id, id) ON DELETE CASCADE;--> statement-breakpoint

CREATE INDEX document_upload_intents_org_status_expiry_idx ON document_upload_intents (organization_id, status, expires_at);--> statement-breakpoint
CREATE INDEX document_storage_objects_org_state_idx ON document_storage_objects (organization_id, state);--> statement-breakpoint
CREATE INDEX document_scan_events_org_version_idx ON document_scan_events (organization_id, document_version_id);--> statement-breakpoint
CREATE INDEX document_evidence_links_org_entity_idx ON document_evidence_links (organization_id, entity_type, entity_id);--> statement-breakpoint
CREATE INDEX document_external_shares_org_status_idx ON document_external_shares (organization_id, status, expires_at);--> statement-breakpoint
CREATE INDEX legal_holds_org_entity_idx ON legal_holds (organization_id, entity_type, entity_id);--> statement-breakpoint
CREATE INDEX company_registration_facts_org_status_idx ON company_registration_facts (organization_id, status);--> statement-breakpoint
CREATE INDEX company_signatory_facts_org_status_idx ON company_signatory_facts (organization_id, status);--> statement-breakpoint
CREATE INDEX company_contact_facts_org_type_idx ON company_contact_facts (organization_id, contact_type);--> statement-breakpoint
CREATE INDEX company_banking_route_facts_org_status_idx ON company_banking_route_facts (organization_id, status);--> statement-breakpoint
CREATE INDEX facility_capacity_facts_org_facility_idx ON facility_capacity_facts (organization_id, facility_id);--> statement-breakpoint
CREATE INDEX business_verification_cases_org_status_idx ON business_verification_cases (organization_id, status);--> statement-breakpoint
CREATE INDEX business_verification_evidence_org_case_idx ON business_verification_evidence (organization_id, case_id);--> statement-breakpoint
CREATE INDEX business_verification_history_org_case_idx ON business_verification_status_history (organization_id, case_id);--> statement-breakpoint

DO $rls$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'document_upload_intents', 'document_evidence_links', 'document_external_shares',
    'company_registration_facts', 'company_signatory_facts', 'company_contact_facts',
    'company_banking_route_facts', 'facility_capacity_facts',
    'business_verification_cases', 'business_verification_evidence'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid) WITH CHECK (organization_id = NULLIF(current_setting(''app.organization_id'', true), '''')::uuid)',
      'tenant_' || table_name, table_name
    );
  END LOOP;
END
$rls$;--> statement-breakpoint

ALTER TABLE document_storage_objects ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE document_storage_objects FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_document_storage_objects_read ON document_storage_objects FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_document_storage_objects_stage ON document_storage_objects FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND state = 'quarantine');--> statement-breakpoint
CREATE POLICY operations_document_storage_objects_write ON document_storage_objects FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'));--> statement-breakpoint

ALTER TABLE document_scan_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE document_scan_events FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_document_scan_events_read ON document_scan_events FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_document_scan_events_insert ON document_scan_events FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (state = 'queued' OR current_setting('app.actor_type', true) IN ('staff', 'system'))
  );--> statement-breakpoint

ALTER TABLE business_verification_status_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE business_verification_status_history FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_business_verification_history_read ON business_verification_status_history FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY tenant_business_verification_history_insert ON business_verification_status_history FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE legal_holds FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_legal_holds_read ON legal_holds FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY operations_legal_holds_write ON legal_holds FOR ALL
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid AND current_setting('app.actor_type', true) IN ('staff', 'system'));

-- INSERT ... ON CONFLICT requires SELECT visibility on the conflicting row.
-- The runtime role intentionally cannot read the outbox, so retry-safe enqueue
-- is implemented as an invoker-rights function that catches only the intended
-- dedupe constraint. RLS still validates every attempted insert.
CREATE OR REPLACE FUNCTION app_enqueue_outbox_event(
  p_event_id uuid,
  p_organization_id uuid,
  p_topic text,
  p_aggregate_type text,
  p_aggregate_id text,
  p_dedupe_key text,
  p_payload jsonb,
  p_available_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_constraint_name text;
BEGIN
  BEGIN
    INSERT INTO outbox_events (
      id, organization_id, topic, aggregate_type, aggregate_id,
      dedupe_key, payload, available_at
    ) VALUES (
      p_event_id, p_organization_id, p_topic, p_aggregate_type,
      p_aggregate_id, p_dedupe_key, p_payload, p_available_at
    );
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
    IF v_constraint_name <> 'outbox_events_dedupe_key_unique' THEN
      RAISE;
    END IF;
  END;
  RETURN p_event_id;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION app_enqueue_outbox_event(uuid, uuid, text, text, text, text, jsonb, timestamptz) FROM PUBLIC;

-- Legacy business_verification_requests.evidence_url remains readable only for
-- migration compatibility. New writes use business_verification_evidence and
-- immutable document_version identifiers; application validation rejects URLs.
