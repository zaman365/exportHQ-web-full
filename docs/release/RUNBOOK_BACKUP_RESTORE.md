# Backup and restore runbook

1. Record database version, migration checksums, backup identifier, encryption and retention class.
2. Restore into a fresh isolated database with the migration/support/application roles separated.
3. Apply any forward migrations with checksum validation.
4. Run integrity, row counts, foreign-key, append-only audit, outbox and two-tenant RLS tests using the non-owner application role.
5. Reconcile object metadata against the approved object-store inventory when the vault exists.
6. Record elapsed time, recovery point, recovery time, failures and approving owner under release evidence.

The target before GA is RPO at most 15 minutes and RTO at most four hours. A documented target is not evidence of a completed drill.
