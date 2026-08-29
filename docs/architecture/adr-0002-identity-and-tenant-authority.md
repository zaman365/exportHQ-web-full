# ADR 0002: Identity and tenant authority

- Status: Accepted
- Clerk owns identity, authentication and session assertions.
- PostgreSQL owns organization UUIDs, membership projection, onboarding, verification, entitlements and audit.
- A verified Clerk organization ID crosses into tenant state only through reviewed identity-bridge commands.
- Every tenant read/write runs inside a transaction-local PostgreSQL tenant context under a non-owner, non-`BYPASSRLS` application role.
- Identity metadata is a retryable mirror, never customer-state authority.
