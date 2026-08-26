-- Gate 1: authoritative tenant persistence.
--
-- Structural changes only. The row-level security envelope for these objects is
-- 0006; the database roles they assume are 0007. Apply in that order.

CREATE TYPE subscription_tier AS ENUM ('preview', 'explore', 'launch', 'scale', 'managed');
CREATE TYPE entitlement_source AS ENUM ('platform_grant', 'trial', 'paid', 'pilot');
CREATE TYPE idempotency_state AS ENUM ('in_progress', 'succeeded', 'failed');
CREATE TYPE webhook_delivery_state AS ENUM ('received', 'processed', 'ignored', 'failed', 'dead_letter');

-- Onboarding, profile and market-strategy state move out of identity-provider
-- metadata, which has no transaction, audit trail, row-level security or
-- restore path.
ALTER TABLE company_profiles
  ADD COLUMN onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN onboarding_version integer NOT NULL DEFAULT 0,
  ADD COLUMN activated_by text,
  ADD COLUMN activated_at timestamptz,
  ADD COLUMN support_email text,
  ADD COLUMN default_currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN export_stage text,
  ADD COLUMN primary_sales_channel text,
  ADD COLUMN market_strategy jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Plan entitlements are owned here rather than by a billing provider, so a
-- pilot grant needs no payment processor and every change is auditable.
CREATE TABLE organization_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  source entitlement_source NOT NULL,
  reason text NOT NULL,
  granted_by text NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_entitlements_window_check
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX organization_entitlements_org_effective_idx
  ON organization_entitlements (organization_id, effective_from);

CREATE TABLE idempotency_keys (
  key text PRIMARY KEY,
  scope text NOT NULL,
  request_hash text NOT NULL,
  state idempotency_state NOT NULL DEFAULT 'in_progress',
  result_reference text,
  attempts integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idempotency_keys_expiry_idx ON idempotency_keys (expires_at);

CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  state webhook_delivery_state NOT NULL DEFAULT 'received',
  attempts integer NOT NULL DEFAULT 1,
  payload_hash text NOT NULL,
  failure_reason text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE UNIQUE INDEX webhook_deliveries_provider_event_unique
  ON webhook_deliveries (provider, event_id);
CREATE INDEX webhook_deliveries_state_idx ON webhook_deliveries (state, received_at);

-- Identity bridge.
--
-- A request arriving with an identity-provider organization id has no tenant
-- context yet — by definition it is trying to establish one. These functions
-- are the only way across that boundary. They are SECURITY DEFINER because the
-- application role cannot read `organizations` without a context, and they
-- return identifiers only, so they cannot become a way to read tenant data.

CREATE OR REPLACE FUNCTION app_resolve_organization(p_clerk_organization_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT id FROM organizations WHERE clerk_organization_id = p_clerk_organization_id;
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
    INSERT INTO organizations (clerk_organization_id, slug, legal_name, trading_name)
    VALUES (p_clerk_organization_id, p_slug, p_legal_name, p_trading_name)
    RETURNING id INTO v_existing;
    RETURN QUERY SELECT v_existing, true;
  ELSE
    UPDATE organizations
       SET slug = p_slug,
           legal_name = p_legal_name,
           trading_name = p_trading_name,
           updated_at = now()
     WHERE id = v_existing;
    RETURN QUERY SELECT v_existing, false;
  END IF;
END;
$$;

-- Membership mirrors the identity provider. Permissions are deliberately not
-- mirrored: they are derived from the role and intersected with the plan
-- ceiling at request time, so a stale row cannot widen access.
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
  INSERT INTO organization_memberships (organization_id, clerk_user_id, role, active)
  VALUES (p_organization_id, p_clerk_user_id, p_role, p_active)
  ON CONFLICT (organization_id, clerk_user_id)
  DO UPDATE SET role = EXCLUDED.role, active = EXCLUDED.active, updated_at = now()
  RETURNING id INTO v_membership_id;
  RETURN v_membership_id;
END;
$$;
