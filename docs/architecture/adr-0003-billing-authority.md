# ADR 0003: Billing authority

- Status: Accepted foundation; provider selection pending
- PostgreSQL owns the plan catalog/version, subscription/pass history, invoices, credits/refunds, payment/provider evidence, usage and entitlement transition/reconciliation.
- Payment and identity providers supply signed evidence through adapters; they never directly widen permissions.
- Manual audited pilot grants are permitted before provider activation.
- Self-service checkout stays Planned until provider rights, signatures, idempotency, settlement/refund reconciliation, cancellation, invoices, tax and rollback pass.
