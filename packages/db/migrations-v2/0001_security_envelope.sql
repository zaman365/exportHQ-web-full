-- Reproducible R0 security envelope.
-- Apply after 0000_reproducible_baseline.sql with the migration role. Runtime
-- connections use the separately-created non-owner exporthq_app role.

-- Tenant tables all enforce the transaction-local organization UUID. FORCE is
-- defense in depth for accidental owner-like sessions; migrations still run as
-- the migration owner with row_security disabled where explicitly required.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_organizations ON organizations
  FOR SELECT USING (id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_memberships ON organization_memberships
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_teams FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_teams ON organization_teams
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_team_members FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_team_members ON organization_team_members
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_conversations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_conversations ON organization_conversations
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_conversation_participants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_conversation_participants ON organization_conversation_participants
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_messages ON organization_messages
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_company_profiles ON company_profiles
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_facilities ON facilities
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_products ON products
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE product_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_markets FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_product_markets ON product_markets
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE organization_market_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_market_shortlists FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_market_shortlists ON organization_market_shortlists
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE requirement_applicabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_applicabilities FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_requirement_applicabilities ON requirement_applicabilities
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_documents ON documents
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_versions ON document_versions
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_assessments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_readiness_assessments ON readiness_assessments
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE readiness_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_responses FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_readiness_responses ON readiness_responses
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE readiness_evidence_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_evidence_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_readiness_evidence_reviews ON readiness_evidence_reviews
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE readiness_provider_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_provider_referrals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_readiness_provider_referrals ON readiness_provider_referrals
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE business_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_verification_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_business_verification_requests ON business_verification_requests
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_tasks ON tasks
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_connections ON email_connections
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_threads ON email_threads
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_messages ON email_messages
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_email_attachments ON email_attachments
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

-- Audit is append-only. Tenant actors may insert and read their own events;
-- platform events have no organization and remain invisible to tenants.
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_audit_events_read ON audit_events
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY tenant_audit_events_insert ON audit_events
  FOR INSERT WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    OR (organization_id IS NULL AND current_setting('app.actor_type', true) IN ('staff', 'system'))
  );

-- Entitlements are readable by the tenant and writable only under a trusted
-- staff/system actor. A customer cannot grant itself a plan.
ALTER TABLE organization_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_entitlements FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_entitlements_read ON organization_entitlements
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY operations_organization_entitlements_write ON organization_entitlements
  FOR ALL
  USING (current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (current_setting('app.actor_type', true) IN ('staff', 'system'));

-- Staff grants are never visible to customer actors. Operations may read/write
-- them only after staff authentication has established actor_type=staff.
ALTER TABLE staff_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_access_grants FORCE ROW LEVEL SECURITY;
CREATE POLICY operations_staff_access_grants ON staff_access_grants
  FOR ALL
  USING (current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (current_setting('app.actor_type', true) IN ('staff', 'system'));

-- Outbox records are emitted by tenant commands, then owned by the system
-- dispatcher. Tenants cannot enumerate, modify or delete them.
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_outbox_events_insert ON outbox_events
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY platform_outbox_events ON outbox_events
  FOR ALL
  USING (current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (current_setting('app.actor_type', true) IN ('staff', 'system'));

-- Platform stores contain no customer content and are not tenant-readable.
REVOKE ALL ON idempotency_keys, rate_limit_counters, webhook_deliveries FROM PUBLIC;

-- Reviewed catalogs are publisher-controlled, never mutated by customers.
REVOKE INSERT, UPDATE, DELETE ON markets, market_catalog_products, market_opportunities,
  market_opportunity_evidence, requirements, service_provider_profiles FROM PUBLIC;

-- Identity bridge. These SECURITY DEFINER functions return identifiers/status
-- only and are executable solely by the application role after role bootstrap.
CREATE OR REPLACE FUNCTION app_resolve_organization(p_clerk_organization_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT id FROM organizations
   WHERE clerk_organization_id = p_clerk_organization_id
     AND active = true;
$$;

CREATE OR REPLACE FUNCTION app_upsert_organization(
  p_clerk_organization_id text,
  p_slug text,
  p_legal_name text,
  p_trading_name text
)
RETURNS TABLE (organization_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM organizations WHERE clerk_organization_id = p_clerk_organization_id;
  IF v_existing IS NULL THEN
    INSERT INTO organizations (
      clerk_organization_id, slug, legal_name, trading_name,
      default_locale, default_timezone, active
    ) VALUES (
      p_clerk_organization_id, p_slug, p_legal_name, p_trading_name,
      'en', 'Asia/Dhaka', true
    ) RETURNING id INTO v_existing;
    RETURN QUERY SELECT v_existing, true;
  ELSE
    UPDATE organizations SET
      slug = p_slug,
      legal_name = p_legal_name,
      trading_name = p_trading_name,
      active = true,
      deleted_at = null,
      updated_at = now()
    WHERE id = v_existing;
    RETURN QUERY SELECT v_existing, false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION app_deactivate_organization(p_clerk_organization_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE organizations SET active = false, deleted_at = now(), updated_at = now()
   WHERE clerk_organization_id = p_clerk_organization_id
   RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION app_project_membership(
  p_organization_id uuid,
  p_clerk_user_id text,
  p_role text,
  p_active boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_membership_id uuid;
BEGIN
  INSERT INTO organization_memberships (
    organization_id, clerk_user_id, role, position_title,
    access_role, hierarchy_rank, permissions, active
  ) VALUES (
    p_organization_id, p_clerk_user_id, p_role, 'Member',
    CASE WHEN replace(p_role, 'org:', '') = 'admin' THEN 'owner'::team_access_role ELSE 'member'::team_access_role END,
    CASE WHEN replace(p_role, 'org:', '') = 'admin' THEN 100 ELSE 30 END,
    '{}'::text[], p_active
  )
  ON CONFLICT (organization_id, clerk_user_id)
  DO UPDATE SET role = EXCLUDED.role, active = EXCLUDED.active, updated_at = now()
  RETURNING id INTO v_membership_id;
  RETURN v_membership_id;
END;
$$;

REVOKE ALL ON FUNCTION app_resolve_organization(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_upsert_organization(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_deactivate_organization(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_project_membership(uuid, text, text, boolean) FROM PUBLIC;
