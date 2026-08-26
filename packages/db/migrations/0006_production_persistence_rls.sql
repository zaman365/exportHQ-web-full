-- Gate 1: row-level security envelope for the Gate 1 objects.
--
-- Apply after 0005 and with the migration role, not the application role.

-- Audit events were readable but not writable: the table had a SELECT policy
-- only, so with row-level security enabled every INSERT was denied. An audit
-- write must succeed in the same transaction as the change it records, or the
-- change must not commit.
CREATE POLICY tenant_audit_events_insert ON audit_events
  FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    OR organization_id IS NULL
  );

ALTER TABLE organization_entitlements ENABLE ROW LEVEL SECURITY;

-- An organization may see the plan it holds; it may never grant itself one.
-- There is no INSERT or UPDATE policy for a customer actor, so those commands
-- are denied outright rather than filtered.
CREATE POLICY tenant_organization_entitlements_read ON organization_entitlements
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

-- Entitlements are written only under a staff or system actor. The actor type
-- is set transaction-locally from the authenticated principal, so a customer
-- request cannot reach this policy however the query is shaped.
CREATE POLICY operations_organization_entitlements_write ON organization_entitlements
  FOR ALL
  USING (current_setting('app.actor_type', true) IN ('staff', 'system'))
  WITH CHECK (current_setting('app.actor_type', true) IN ('staff', 'system'));

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_organization_memberships ON organization_memberships
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

-- Idempotency keys and webhook deliveries are platform bookkeeping. They carry
-- no customer content and are never exposed to a tenant, so tenant policies do
-- not apply; access is controlled by grants in 0007 instead.
REVOKE ALL ON idempotency_keys FROM PUBLIC;
REVOKE ALL ON webhook_deliveries FROM PUBLIC;

-- The identity bridge is callable by the application role and by nobody else.
REVOKE ALL ON FUNCTION app_resolve_organization(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_upsert_organization(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_project_membership(uuid, text, text, boolean) FROM PUBLIC;
