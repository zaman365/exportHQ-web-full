# Implementation status

## Implemented

- Greenfield monorepo and deployment-ready customer/ops application split.
- Shared design system and responsive application shells.
- Phase 1 domain model, weighted Export Health calculation, and critical journey invariant.
- Customer membership and explicit staff-grant authorization policy.
- Production Clerk session verification, organization selection/creation, real sign-in/sign-up routes, account controls, and sign-out.
- Onboarding-gated workspaces with server-side organization metadata updates.
- Preview, Explore, Launch, Scale, and Managed subscription entitlements with route-level enforcement and filtered navigation.
- A public, read-only ExportPanel preview and plan selection surface; protected data is never rendered into the preview.
- A Home workspace that contains the dashboard, with feature-aware navigation across desktop and mobile.
- Drizzle PostgreSQL schema for Phase 0 and the vertical slice, plus tenant RLS policies.
- Zod contracts for company, product, task, and document upload intent.
- Customer command center with action ownership, product-market readiness, sourced requirements, documents, managed work, and accountable team.
- Guided company → product → market → evidence → readiness experience.
- A country-product market intelligence system with a limited public homepage preview, searchable member rankings, source-linked full research for verified or subscribed businesses, free business-verification requests, and tenant-scoped shortlists.
- A connected Export Studio built around one `ExportLane`: lifecycle progress, commercial economics, deal milestones, buyer cohorts, provider disclosures, finance readiness, SME clusters, shipment-to-proceeds checkpoints, lane-specific policy alerts, and a controlled Trust Passport projection.
- A public opportunity-to-payment acquisition story, a limited ExportPanel Export Studio preview, and plan language aligned to the Basic → verified/paid → Scale/Managed trust ladder.
- A dedicated Export operations Learning Center category with contextual hints for lanes, economics, deals, buyer trust, provider matching, finance, shipment, policy, and clusters.
- A versioned, transactional market catalog publisher and incremental PostgreSQL migration for country, product, opportunity, evidence, verification, and shortlist records.
- Internal customer portfolio and scoped operator workspace over the same domain projection.
- Unit, journey, and cross-tenant isolation tests; CI runs lint, typecheck, tests, and production builds.

## Local preview behavior

The UI uses an authorized, realistic domain projection when `EXPORTHQ_DEMO_MODE` is enabled outside production. Export Studio interactions use clearly labelled local browser persistence for draft economics, milestones, shortlists, and cluster interest. These are explicit preview adapters, not production persistence paths. Demo mode is impossible in `NODE_ENV=production`.

## Production authentication activation

The application code no longer permits demo access in production. If Clerk is not configured, protected routes fail closed and the sign-in surface reports that authentication is unavailable; `/preview` and `/plans` remain public.

Activation still requires an ExportHQ-owned Clerk production instance:

1. configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the application build environment;
2. add `CLERK_SECRET_KEY` as a Cloudflare Worker secret and optionally add `CLERK_JWT_KEY` for networkless verification;
3. enable Clerk Organizations and create Billing plan keys `launch`, `scale`, and `managed`;
4. deploy only after the production keys and plans exist, then verify sign-in, organization creation, onboarding, plan access, organization switching, and sign-out on `export-hq.com/ExportPanel`.

No Clerk secrets are currently present on the production Worker, so this new auth path has intentionally not replaced the existing live preview deployment yet.

## Remaining production data activation

Before accepting real customer data:

1. provision Frankfurt Neon and generate/apply the structural Drizzle migration before the checked-in RLS envelope;
2. create a non-owner, non-`BYPASSRLS` application database role and transaction-scoped tenant context;
3. configure Clerk webhook synchronization, invitations, role templates, and MFA policy;
4. implement PostgreSQL repositories and transactional audit writes for the modeled commands;
5. provision private EU R2, signed upload intents, quarantine, malware scanning, checksums, and authorized download logging;
6. add Playwright browser tests against ephemeral Postgres, including object enumeration and signed-file isolation;
7. add rate limits, production CSP tuned for Clerk/R2, Sentry scrubbing, PostHog metadata allowlists, backups, and restore drills.
8. apply the market intelligence migration, publish the reviewed starter catalog, and connect verification approval to the trusted operations workflow.
9. replace Export Studio preview persistence with tenant-scoped PostgreSQL repositories and audited commands;
10. activate reviewed adapters for buyer data, provider credentialing, banks, laboratories, freight, shipment events, policy sources, and proceeds reconciliation before representing any of them as live.

The data model and interfaces are ready for this activation, but claiming those external controls are live without provisioned services would be misleading.

## Recommended next product work

Activate the production Clerk instance and persistence layer, then run one complete Export Lane with a real pilot exporter from opportunity through payment follow-up. Use observed readiness, economics, buyer, provider, shipment, and proceeds work to refine applicability, ownership, controls, and service economics before enabling live referrals or finance applications.
