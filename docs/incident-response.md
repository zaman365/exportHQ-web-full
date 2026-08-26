# Incident response, credential compromise and rollback

- **Status:** Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)
- **Owner:** Security owner (see [`production-ownership.md`](production-ownership.md))

## Severity

| Severity | Definition | First response |
| --- | --- | --- |
| S1 | Cross-tenant data exposure, evidence disclosure, or credential compromise | Immediate; page the security owner |
| S2 | Authentication or authorization failure affecting a tenant; failed evidence scan pipeline | Within 1 hour |
| S3 | Degraded adapter, queue lag, elevated error rate without data exposure | Within 1 business day |
| S4 | Cosmetic or single-user issue | Next planning cycle |

## Standing rules

1. **Preserve evidence before remediating.** Capture the audit events, the
   request identifiers and the deployment version first. Audit records are
   append-only and must not be edited during an incident.
2. **Never paste a secret, a signed URL, or document content into an incident
   channel.** Reference them by identifier.
3. **Assume tenant isolation is broken until proven otherwise** for any S1. Run
   the cross-tenant test suite before declaring containment.
4. **Automated agents do not rotate credentials.** Rotation is performed by a
   named human owner.

## Credential compromise

Applies to a leaked `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `DATABASE_URL`,
R2 access key, or mailbox token.

1. Revoke the credential at the provider first — rotating before revoking
   leaves the old value valid.
2. Issue the replacement and set it with `wrangler secret put <NAME>`.
3. Redeploy and confirm the old credential is refused.
4. For Clerk: revoke active sessions. For R2: rotate the access key and
   invalidate outstanding signed URLs by changing the signing key.
5. For a mailbox token: mark the connection `reauthorization_required`, delete
   the stored reference, and require the customer to reconnect. Never reuse it.
6. Record an audit event and, where a tenant's data was reachable, notify that
   tenant with what was exposed and for how long.

## Document exposure

1. Revoke every outstanding external share for the affected documents.
2. Rotate the object-store signing key so issued URLs stop resolving.
3. Reconcile PostgreSQL document rows against the R2 inventory and quarantine
   anything unaccounted for.
4. Notify the data owner and the affected tenant with the specific documents,
   the window, and the parties who could have retrieved them.

## Production rollback

The Worker is the deployment unit. Rollback order matters: configuration first,
code second, data last.

1. **Set the capability flag back.** Removing a gate from
   `EXPORTHQ_ACTIVATION_GATES_PASSED` disables its capabilities immediately
   without a code deploy. This is the fastest containment for a bad activation.
2. **Roll the Worker back** to the previous version:

```bash
pnpm --filter @exporthq/app exec wrangler rollback
```

3. **Do not roll a migration back automatically.** Forward-fix is the default.
   A destructive rollback runs only with the data owner's explicit approval and
   after a verified backup.
4. Confirm sign-in, organization selection, and one authorized read after any
   rollback.

## Post-incident

Within five business days: a written timeline, the contributing causes, what
detection missed, and owned backlog items. An incident that produced no backlog
item has not been understood.
