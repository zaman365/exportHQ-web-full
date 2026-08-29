# R1 local PostgreSQL checkpoint

- Date: 2026-08-29
- Environment: disposable local PostgreSQL 17
- Data: synthetic tenants, documents and `.invalid` regulatory publishers only
- Database actor under test: non-owner `exporthq_app`, `NOBYPASSRLS`
- Production activation effect: none

## Scope proved

The clean migration chain through `0010_r1_legal_acceptances.sql` creates:

- the tenant-scoped Export Lane aggregate and exact commercial ledger;
- private evidence lifecycle metadata and versioned verification cases;
- lane-scoped readiness assessments, responses, tasks and support requests;
- a read-only-to-application regulatory publisher/source/rule registry with
  tenant-scoped lane impacts and freshness enforcement; and
- immutable AI extraction proposals, source spans, reviewer decisions and
  downstream usage provenance;
- an authoritative tenant profile and primary product read path for Settings,
  Dashboard and Export Studio; and
- versioned tenant tasks with explicit transition rationale and append-only
  status history; and
- a global draft/effective legal publication registry with tenant-isolated,
  actor-bound and append-only exact-version acceptances.

Composite tenant foreign keys, forced row-level security and locked role grants
were applied after a clean reset. The application role cannot write the global
regulatory registry, cannot read another organization's lane or extraction
records, and cannot use an AI-proposed value without a human accept/correct
decision.

## Verification result

The following guarded sequence completed successfully:

1. reset the disposable test database;
2. apply the immutable migration chain and validate its checksum manifest;
3. provision the synthetic migration/application/support/backup roles;
4. seed only synthetic tenant and source-registry fixtures; and
5. run the database suite through the application login.

Result: 5 test files passed; 36 tests passed. The tenant-isolation and webhook
files contain 22 real-PostgreSQL scenarios, including stale-source exclusion, global publisher-write
denial, cross-tenant regulatory isolation, retained AI source spans and required
human review before downstream usage, authoritative workspace reads, optimistic
task transitions, append-only task history, versioned legal acceptance and
replay-safe identity projection. The evidence scenario also proves quarantine,
clean review, unauthorized download/share denial, external-share revocation,
legal-hold deletion denial, released-hold deletion and customer-export routing.

The public web package separately exposes nine hash-locked Legal & Trust Center
drafts. They are deliberately labelled not effective and cannot be accepted in
the tenant application until a reviewed migration publishes an exact version.

This is local engineering evidence, not Neon, R2, AI-provider, regulatory,
security, legal or production-release approval.
