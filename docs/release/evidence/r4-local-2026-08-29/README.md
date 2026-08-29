# R4 Public Beta local checkpoint

- Date: 2026-08-29
- Environment: local application build and disposable PostgreSQL 17
- Data: synthetic organizations, `.invalid` endpoints and hashes only
- Database actor under test: non-owner `exporthq_app`, `NOBYPASSRLS`
- Production activation effect: none

## Scope proved

The clean migration chain through `0023_r4_provider_activation_evidence.sql`
adds:

- a global reviewed-provider state machine whose seeded SSLCOMMERZ record is a
  credentialless `candidate`, plus invoice-authoritative, idempotent tenant
  checkout sessions and validated safe/risky settlement handling;
- internal subscription, entitlement, transaction, refund, dunning,
  reconciliation, plan-change and drift records that cannot be replaced by
  identity-provider billing claims;
- explicit limits for active lanes, editors, storage bytes, automation units
  and managed work packs, including exact projected BDT charges and no
  `unlimited` sentinel;
- current verification evidence, expiry, category, SLA, disclosure, customer
  acceptance, exact document share, complaint/dispute and outcome contracts for
  governed provider cases;
- exact-resource expiring guest grants, a narrow customer API scope allowlist,
  hashed/rotatable client credentials, managed webhook secret references,
  HMAC-SHA256 delivery signatures, replay limits, idempotency and operations-only
  delivery outcomes; and
- a protected Billing & usage workspace, owner cancellation command, usage CSV,
  static transfer budgets and documented accessibility/reliability/SLO targets.

Clerk remains the identity and organization boundary. Clerk Billing is
deliberately not used; Export HQ's PostgreSQL ledger remains subscription and
entitlement authority.

## Verification result

The locked application-role R4 integration scenarios prove that the technical
payment candidate cannot activate or open checkout, global provider rows are
runtime read-only, all five limits are exact, projected overage charges come
from the internal ledger, guests cannot widen resource or tenant scope, broad
export API scope is denied, customer webhooks cannot activate themselves or
write deliveries, and unverified providers cannot receive cases.

Repository-wide lint and TypeScript checks pass for all ten packages. Unit and
journey suites pass; the locked application role passes all 45 database tests,
including 31 real-PostgreSQL scenarios, and the R4-specific file passes 5/5.
Domain passes 43 tests, platform 90 and the customer app 43. All three Next.js
production builds pass and include the dynamic `/billing` route.

The static build budget check measured 134,349 gzip bytes of shared/Billing
JavaScript and 53,961 gzip bytes of application CSS, below the 250,000 and
180,000 ceilings. ExportPanel currently carries no public application image in
that build. Route-data, device LCP/TTI and accessibility evidence remain
unmeasured deployment gates.

An isolated custom-format backup created by the read-only `exporthq_backup`
role restored successfully into a migration-owned database. The restore
retained data, the inactive provider candidate, RLS on every tenant/global
tenant-envelope table, and zero organization visibility for `exporthq_app`
without a tenant context. This is local recovery proof, not production
Neon PITR or independent approval.

## Boundary retained

This checkpoint does not approve SSLCOMMERZ, publish a self-service catalog,
create provider credentials, process real BDT, prove refund/dunning/settlement
operations, onboard a real provider, meet a deployed SLO, complete an
accessibility review or satisfy the R4 outcome thresholds. Production
Neon/Hyperdrive, R2 invoice delivery, monitoring/status page, provider
commercial/legal/security/tax approval and independent security, privacy/legal,
recovery and rollback signatures remain open. Founder authorization permits
continued R5-R6 development but is not an independent signature.
