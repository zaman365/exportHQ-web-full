# Reproducible migration baseline

The `migrations-v2` chain supersedes the incomplete pre-production chain in `../migrations/` for new environments. The legacy SQL remains immutable evidence; no production database using it was verified at the audited baseline.

Baseline strategy:

1. create the locked migration role with `../roles/provision-locked.sql`;
2. apply `migrations-v2` from an empty database as that role;
3. have a named human secret owner apply `roles/bootstrap.sql` through a
   protected `psql` session to finalize LOGIN credentials;
4. validate the committed SHA-256 manifest;
5. seed synthetic data only in test environments;
6. prove backup/restore and RLS through the application role.

Never edit an applied file. Add a migration with forward-fix, backfill, tenant/RLS, backup-impact and rollback notes.
