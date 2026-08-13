# Implementation status

## Implemented

- Greenfield monorepo and deployment-ready customer/ops application split.
- Shared design system and responsive application shells.
- Phase 1 domain model, weighted Export Health calculation, and critical journey invariant.
- Customer membership and explicit staff-grant authorization policy.
- Drizzle PostgreSQL schema for Phase 0 and the vertical slice, plus tenant RLS policies.
- Zod contracts for company, product, task, and document upload intent.
- Customer command center with action ownership, product-market readiness, sourced requirements, documents, managed work, and accountable team.
- Guided company → product → market → evidence → readiness experience.
- Internal customer portfolio and scoped operator workspace over the same domain projection.
- Unit, journey, and cross-tenant isolation tests; CI runs lint, typecheck, tests, and production builds.

## Local preview behavior

The UI uses an authorized, realistic domain projection when `EXPORTHQ_DEMO_MODE` is enabled outside production. This is an explicit preview adapter, not a production persistence path. Demo mode is impossible in `NODE_ENV=production`.

## Activation work intentionally deferred

Before accepting real customer data:

1. provision Frankfurt Neon and generate/apply the structural Drizzle migration before the checked-in RLS envelope;
2. create a non-owner, non-`BYPASSRLS` application database role and transaction-scoped tenant context;
3. configure Clerk, webhook synchronization, invitations, role templates, MFA, and protected route middleware;
4. implement PostgreSQL repositories and transactional audit writes for the modeled commands;
5. provision private EU R2, signed upload intents, quarantine, malware scanning, checksums, and authorized download logging;
6. add Playwright browser tests against ephemeral Postgres, including object enumeration and signed-file isolation;
7. add rate limits, production CSP tuned for Clerk/R2, Sentry scrubbing, PostHog metadata allowlists, backups, and restore drills.

The data model and interfaces are ready for this activation, but claiming those external controls are live without provisioned services would be misleading.

## Recommended next product work

Finish persistence and authentication activation, then run the first journey with a real pilot exporter. Use observed readiness work to refine requirement applicability, action ownership, and the Export Health weights before adding buyer CRM or trade operations.
