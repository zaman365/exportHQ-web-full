# Retention, deletion, export and legal hold

1. Resolve tenant and authenticated authority for every request.
2. Classify every selected record and object using the central data policy.
3. Apply legal hold before deletion or lifecycle expiry.
4. Produce customer exports through authorized, auditable, expiring artifacts.
5. Delete customer-controlled data only after dependency, backup and external-adapter reconciliation.
6. Retain append-only audit evidence for the approved retention period.
7. Record request, approval, execution, exceptions and reconciliation in audit/outbox.

Repository defaults bound processed/ignored webhook payloads to 30 days,
dead-letter payloads to 90 days, and published outbox routing records to 30
days. Expired rate-limit and idempotency records are eligible immediately.
These schedules are executable in `packages/platform/src/jobs/retention.ts`;
the production scheduler, legal-hold exception path and counsel approval remain
activation evidence rather than assumed configuration.

The current implementation is a policy/runbook foundation, not an activated deletion service. Real-data onboarding remains prohibited until the workflow, counsel review and restore/deletion evidence pass.
