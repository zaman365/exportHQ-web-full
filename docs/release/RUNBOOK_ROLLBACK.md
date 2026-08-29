# Rollback runbook

1. Preserve deployment version, request IDs, redacted logs and audit references.
2. Remove the affected evidence-backed capability gate to contain new consequential actions.
3. Promote the prior immutable Worker artifact and verify its checksum.
4. Prefer a forward database fix. Do not reverse a migration without data-owner approval and a verified backup.
5. Run synthetic identity, tenant authorization, database and critical-route checks.
6. Reconcile queued/outbox/provider events before reopening the capability.
7. Record incident, customer impact, decision owner and follow-up evidence.
