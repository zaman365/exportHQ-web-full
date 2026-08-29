-- Secretless role provisioning for provider consoles and infrastructure setup.
-- New roles are created NOLOGIN so credentials never pass through an editor,
-- build log or automated agent. Run this as the database owner after applying
-- migrations as exporthq_migration. Finalize LOGIN credentials only through
-- bootstrap.sql and a named human-controlled secret channel.

DO $$ BEGIN
  CREATE ROLE exporthq_migration NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE exporthq_app NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE exporthq_support NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  -- pg_dump sets row_security=off and therefore needs BYPASSRLS to read FORCE
  -- RLS tables. This account remains read-only and is used only by backup CI.
  CREATE ROLE exporthq_backup NOLOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO exporthq_migration, exporthq_app, exporthq_support, exporthq_backup',
    current_database()
  );
  EXECUTE format('GRANT CREATE ON DATABASE %I TO exporthq_migration', current_database());
END $$;

GRANT USAGE, CREATE ON SCHEMA public TO exporthq_migration;
GRANT USAGE ON SCHEMA public TO exporthq_app, exporthq_support, exporthq_backup;
GRANT USAGE ON SCHEMA drizzle TO exporthq_backup;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO exporthq_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO exporthq_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO exporthq_support;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO exporthq_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO exporthq_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA drizzle TO exporthq_backup;

REVOKE UPDATE, DELETE ON audit_events FROM exporthq_app, exporthq_support;
REVOKE ALL ON idempotency_keys, rate_limit_counters, webhook_deliveries FROM exporthq_support;
REVOKE INSERT, UPDATE, DELETE ON regulatory_publishers, regulatory_sources, regulatory_rules FROM exporthq_app, exporthq_support;
REVOKE DELETE ON regulatory_rule_lane_impacts, ai_extraction_runs FROM exporthq_app, exporthq_support;
REVOKE UPDATE, DELETE ON ai_extraction_fields, ai_extraction_source_spans,
  ai_extraction_field_decisions, ai_extraction_usages FROM exporthq_app, exporthq_support;
REVOKE UPDATE, DELETE ON task_status_history FROM exporthq_app, exporthq_support;
REVOKE INSERT, UPDATE, DELETE ON legal_documents FROM exporthq_app, exporthq_support;
REVOKE UPDATE, DELETE ON organization_legal_acceptances FROM exporthq_app, exporthq_support;
REVOKE DELETE ON pilot_participations, pilot_pass_grants, pilot_pass_editors, pilot_support_cases FROM exporthq_app, exporthq_support;
REVOKE UPDATE, DELETE ON pilot_work_logs, pilot_observations, pilot_metric_events FROM exporthq_app, exporthq_support;
REVOKE UPDATE ON pilot_participations FROM exporthq_app;
GRANT UPDATE (status, agreement_accepted_by, agreement_accepted_at,
  support_owner_actor_id, started_at, ended_at, updated_at)
  ON pilot_participations TO exporthq_app;

GRANT EXECUTE ON FUNCTION app_resolve_organization(text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_upsert_organization(text, text, text, text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_deactivate_organization(text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_project_membership(uuid, text, text, boolean) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_enqueue_outbox_event(uuid, uuid, text, text, text, text, jsonb, timestamptz) TO exporthq_app;

ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO exporthq_app;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO exporthq_app;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT ON TABLES TO exporthq_support;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT ON TABLES TO exporthq_backup;
