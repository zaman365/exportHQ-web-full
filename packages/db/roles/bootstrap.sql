-- Run with the database owner after migrations. Passwords are supplied through
-- psql variables by the deployment/CI secret store and never committed.
-- Required variables: migration_password, application_password,
-- support_password, backup_password

\ir provision-locked.sql

-- Roles may be pre-created NOLOGIN so a console owner can apply migrations
-- without moving credentials through an interactive editor. Secret
-- finalization always makes the intended connection roles explicit.
ALTER ROLE exporthq_migration LOGIN PASSWORD :'migration_password';
ALTER ROLE exporthq_app LOGIN PASSWORD :'application_password';
ALTER ROLE exporthq_support LOGIN PASSWORD :'support_password';
ALTER ROLE exporthq_backup LOGIN PASSWORD :'backup_password';
