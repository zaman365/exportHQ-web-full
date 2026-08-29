-- Run with the database owner after migrations. Passwords are supplied through
-- psql variables by the deployment/CI secret store and never committed.
-- Required variables: migration_password, application_password,
-- support_password, backup_password

DO $$ BEGIN
  CREATE ROLE exporthq_migration LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE exporthq_app LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE exporthq_support LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  -- pg_dump sets row_security=off and therefore needs BYPASSRLS to read FORCE
  -- RLS tables. This account remains read-only and is used only by backup CI.
  CREATE ROLE exporthq_backup LOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER ROLE exporthq_migration PASSWORD :'migration_password';
ALTER ROLE exporthq_app PASSWORD :'application_password';
ALTER ROLE exporthq_support PASSWORD :'support_password';
ALTER ROLE exporthq_backup PASSWORD :'backup_password';

GRANT CONNECT ON DATABASE :"DBNAME" TO exporthq_migration, exporthq_app, exporthq_support, exporthq_backup;
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

GRANT EXECUTE ON FUNCTION app_resolve_organization(text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_upsert_organization(text, text, text, text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_deactivate_organization(text) TO exporthq_app;
GRANT EXECUTE ON FUNCTION app_project_membership(uuid, text, text, boolean) TO exporthq_app;

ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO exporthq_app;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO exporthq_app;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT ON TABLES TO exporthq_support;
ALTER DEFAULT PRIVILEGES FOR ROLE exporthq_migration IN SCHEMA public
  GRANT SELECT ON TABLES TO exporthq_backup;
