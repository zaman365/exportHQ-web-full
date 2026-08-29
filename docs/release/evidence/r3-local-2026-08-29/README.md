# R3 Private Beta local checkpoint

- Date: 2026-08-29
- Environment: local application tests and disposable PostgreSQL 17
- Data: synthetic organizations, buyers, documents and provider references only
- Database actor under test: non-owner `exporthq_app`, `NOBYPASSRLS`
- Production activation effect: none

## Scope proved

The clean migration chain through `0018_r3_buyer_verification_guard.sql`
implements a tenant-owned buyer-to-proceeds model with:

- source and rights provenance, corrections, consent/opt-out history and a
  database guard preventing customer actors from claiming human review;
- opportunity, RFQ, quote and order aggregates, immutable versions, integer
  minor-unit calculations, exact artifact hashes, explicit signatory approval,
  consent-gated idempotent delivery and explicit acceptance/conversion;
- source-traced trade-document consistency, reviewed outbound-mail contracts,
  preparation-only government/bank companion cases, production, shipment,
  exception, invoice, receipt, allocation, discrepancy, proceeds and outcome
  ledgers;
- a versioned BDT pricing hypothesis whose database invariant keeps public
  self-service disabled, reviewed-operations-only subscription and ledger
  writes, and immutable customer cancellation requests; and
- a runtime-read-only discovery queue for current official Bangladesh, EU and
  UN pages. Every entry remains `pending_review`; no official page is promoted
  to a reviewed rule or exposed as regulatory certainty.

The customer application adds an authoritative tenant buyer register and an
active-cohort Private Beta cockpit. Illustrative buyer data remains visibly
separate when no eligible tenant context exists.

## Verification result

Strict lint and TypeScript checks pass for the database and customer app. Unit
tests pass for the domain, provider boundaries and app. The locked application
role exercises 40 database tests, including 26 real-PostgreSQL integration
scenarios. The R3 scenarios prove candidate-source immutability, provenance and
rights rejection, human-review authority, cross-tenant invisibility, quote
policy/hash/consent/idempotency boundaries, worker-only delivery confirmation,
explicit order conversion, manual-only subscription grant, customer ledger
denial, owner cancellation and operations processing.

During verification, the suite found and fixed two runtime defects: joined
quote approval attempted to lock an immutable snapshot, and quote acceptance
passed an unencoded JavaScript date into raw SQL. The final implementation
locks only the mutable aggregate and casts an ISO timestamp explicitly.

## Boundary retained

This is local engineering evidence. It is not evidence that five customer
lanes completed buyer-to-proceeds work, that three real proceeds records were
reconciled, that a real mailbox/provider delivered a message, or that a real
shipment exception was resolved. Production Neon/Hyperdrive, R2/scanning,
mail-provider review, payment-provider review, independent security/privacy/
legal review, recovery and rollback approval remain activation requirements.
Founder authorization permits continued R4-R6 development but is not recorded
as an independent signature.
