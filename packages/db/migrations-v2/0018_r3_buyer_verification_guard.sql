-- Human-review claims are authority-bearing data. The repository already
-- rejects customer promotion, and this database boundary prevents a direct
-- application-role query from bypassing that service check.
DROP POLICY tenant_buyer_accounts_write ON buyer_accounts;
--> statement-breakpoint
CREATE POLICY tenant_buyer_accounts_insert ON buyer_accounts FOR INSERT
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
      verification_status <> 'human_reviewed'
      OR current_setting('app.actor_type', true) IN ('staff', 'system')
    )
  );
--> statement-breakpoint
CREATE POLICY tenant_buyer_accounts_update ON buyer_accounts FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION guard_buyer_human_review_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.actor_type', true) = 'customer'
    AND (
      NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verification_evidence_level IS DISTINCT FROM OLD.verification_evidence_level
      OR NEW.verification_source_ref IS DISTINCT FROM OLD.verification_source_ref
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    )
  THEN
    RAISE EXCEPTION 'Buyer human-review fields require a reviewed operations actor.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER buyer_human_review_fields_guard
BEFORE UPDATE OF verification_status, verification_evidence_level,
  verification_source_ref, verified_at, verified_by
ON buyer_accounts
FOR EACH ROW
EXECUTE FUNCTION guard_buyer_human_review_fields();
