# Implementation status

The actionable completion backlog is maintained in
[`production-activation-todo.md`](production-activation-todo.md). This status document describes
what exists; the TODO defines the required sequence and acceptance evidence for finishing the
remaining production components.

## Implemented

- Greenfield monorepo and deployment-ready customer/ops application split.
- Shared design system and responsive application shells.
- Phase 1 domain model, weighted Export Health calculation, and critical journey invariant.
- Customer membership and explicit staff-grant authorization policy.
- Production Clerk session verification, organization selection/creation, real sign-in/sign-up routes, account controls, and sign-out.
- Onboarding-gated workspaces with PostgreSQL-authoritative completion,
  same-transaction audit/outbox state and a post-commit Clerk metadata mirror.
- Preview, Explore, Launch, Scale, and Managed subscription entitlements with route-level enforcement and filtered navigation.
- Persistent premium and verified-business entitlement signage across desktop/mobile navigation, page chrome, and premium Settings sections, including the active plan or trust state that supplies access.
- A public, read-only ExportPanel preview and plan selection surface; protected data is never rendered into the preview.
- A Home workspace that contains the dashboard, with feature-aware navigation across desktop and mobile.
- A reproducible Drizzle PostgreSQL 17 baseline with immutable checksums,
  exhaustive tenant RLS, identity bridge functions and separated migration,
  non-owner application, read-only support and read-only backup roles.
- Zod contracts for company, product, task, and document upload intent.
- Customer command center with action ownership, product-market readiness, sourced requirements, documents, managed work, and accountable team.
- Guided company → product → market → evidence → readiness experience.
- A country-product market intelligence system with a limited public homepage preview, searchable member rankings, source-linked full research for verified or subscribed businesses, free business-verification requests, and tenant-scoped shortlists.
- A connected Export Studio built around one `ExportLane`: lifecycle progress, commercial economics, deal milestones, buyer cohorts, provider disclosures, finance readiness, SME clusters, shipment-to-proceeds checkpoints, lane-specific policy alerts, and a controlled Trust Passport projection.
- Tenant-scoped Export Lane and readiness persistence with optimistic versions,
  customer/reviewer status separation, derived owned tasks, audit/outbox,
  idempotent support requests, safe debounced autosave that preserves
  expected-version conflicts, and explicit pre-governance referral wording.
- An invitation-only, internal/synthetic Private Alpha workspace with an exact
  hash-locked participation agreement, explicit data/support scope, named
  support ownership, printable action pack and a truthful no-enrollment state.
- A manually granted First Shipment Pass hypothesis (BDT 7,500/90 days) with
  one-active-lane enforcement, at most three explicitly assigned editors,
  editor-specific Launch authorization, audited extensions/reassignment and a
  recorded 100% annual Launch conversion-credit reference. Public checkout is
  not active.
- First-class Bangla/English catalogs and workspace switch, Bangladesh BDT and
  Asia/Dhaka defaults, a low-data presentation mode, smaller-image preparation
  and a Cloudflare-compatible resumable evidence contract with fixed multipart
  sizing, retryable parts and final magic-byte/SHA-256 verification.
- Privacy-minimized Alpha funnel/outcome events attached to authoritative
  Passport, lane, readiness, evidence, task, support and extraction transitions,
  plus an operations-only outcome read model. No real cohort outcomes have been
  recorded or inferred.
- PostgreSQL-authoritative tenant profile, primary product, paid-workspace and
  Export Studio read models; versioned task transitions with explicit rationale
  and append-only status history; and production-tenant fixture boundaries that
  keep illustrative browser state inside labelled preview adapters.
- A versioned regulatory source/rule registry and tenant-scoped lane-impact
  projection that excludes stale, inactive, unreviewed and superseded material;
  plus immutable AI extraction proposals with provider/model/prompt/rule
  provenance, confidence, source spans, append-only human decisions and
  downstream-usage links. The reviewed registry contains only synthetic
  fixtures; official Bangladesh/EU/UN URLs exist only in a runtime-read-only,
  explicitly pending discovery queue that cannot drive guidance.
- A PostgreSQL-authoritative R3 Private Beta operating model covering
  rights-documented buyer/contact provenance, correction and opt-out history;
  opportunities and RFQs; immutable quote versions with minor-unit arithmetic,
  exact-output approval, consent and idempotent delivery; explicitly confirmed
  sales-order conversion and change orders; source-traced trade-document sets;
  reviewed mailbox-provider boundaries; production, shipment, exception,
  invoicing, allocation, proceeds and lane-outcome ledgers; preparation-only
  companion workflows; and a migration-owned manual billing catalog with
  owner cancellation requests. External provider activation and real outcomes
  remain separate gates.
- An R4 Public Beta engineering foundation with a reviewed-provider activation
  envelope, SSLCOMMERZ as a non-active technical candidate, invoice-authoritative
  BDT checkout sessions, validated settlement/risk/refund/dunning/drift ledgers,
  exact five-capability limits and projected overage UX, governed provider cases,
  exact-resource guests, scoped expiring API clients, signed customer webhooks,
  static payload budgets and an authoritative Billing & usage route. Clerk
  Billing is deliberately not used. Provider credentials, commercial/legal/
  security/tax approval, production delivery and real outcome evidence remain
  gates rather than inferred implementation status.
- An R5 General Availability control plane with a seven-day release-candidate
  observation workflow, exact signed-tag/SHA/deployment binding, executable
  evidence manifest validation, independent-review separation, RPO/RTO limits,
  real-outcome floors and immutable-artifact promotion. The pending manifest
  fails by design; no GA, soak or independent-assurance outcome is claimed.
- R6 post-GA safety contracts for programme aggregates, partner data rights,
  tenant-local shipment learning, reviewable repeat-order drafts and evidenced
  native-mobile need, plus runtime decisions for nine Planned capabilities.
  Every R6 capability requires an immutable GA release and its own evidence;
  none is active.
- Dedicated Buyers and Requirements routes: a searchable, stage-aware illustrative buyer-development pipeline and a source-aware conditional control register linked back to opportunities, readiness, learning, evidence, and qualified-help paths.
- A public opportunity-to-payment acquisition story, a limited ExportPanel Export Studio preview, and plan language aligned to the Basic → verified/paid → Scale/Managed trust ladder.
- A dedicated Export operations Learning Center category with contextual hints for lanes, economics, deals, buyer trust, provider matching, finance, shipment, policy, and clusters.
- A primary Email Inbox beside the retained Actionable Inbox, with export-aware categories, related-record context, private drafts, email-to-follow-up conversion, provider setup guidance, plan/role gates, and tenant-scoped mail persistence contracts.
- A versioned, transactional market catalog publisher and incremental PostgreSQL migration for country, product, opportunity, evidence, verification, and shortlist records.
- Internal customer portfolio and scoped operator workspace over the same domain projection.
- Unit and journey tests; 45 database-package tests, including 31
  real-PostgreSQL integration scenarios covering cross-tenant isolation,
  direct projection-write denial, webhook projection,
  regulatory freshness and publisher-write denial, human-gated AI provenance,
  buyer human-review authority, exact quote delivery, customer billing-ledger
  denial, owner cancellation, R4 candidate-provider/usage/guest/API/webhook
  controls, dead-lettering and concurrent durable controls;
  desktop/mobile Playwright;
  and CI definitions for quality, database, Worker artifact, E2E, security and
  immutable release promotion.
- A production activation spine (`@exporthq/platform`): recorded activation gates that make document
  upload, mailbox connection, provider referral and live adapters fail closed until their evidence is
  recorded; a single authority for what "production" means; telemetry redaction and a PostHog metadata
  allowlist; a generated Content Security Policy and security headers; atomic durable
  per-capability rate limits; idempotency with bounded retries and a dead-letter threshold;
  Clerk webhook signature verification and payload-hash replay protection.
- A Clerk webhook endpoint that fails closed without its secret, durable store or
  database, then commits delivery, reviewed organization/membership projection,
  append-only audit and outbox state atomically. Subscription events only enqueue
  reconciliation and cannot directly grant a plan.
- A provider-neutral private evidence pipeline with one-use upload records,
  tenant/object/action-scoped signed capabilities, magic-byte/size/checksum
  validation, quarantine, clean/rejected promotion, review approval, audited
  downloads, expiring/revocable external shares, legal hold, retention deletion
  and customer-export requests. Production R2 and scanner bindings remain gated.
- A public Legal & Trust Center containing nine explicit engineering drafts,
  each tied to a canonical SHA-256 hash, plus a PostgreSQL publication registry
  and tenant-isolated append-only acceptance history that refuses draft or
  mismatched versions. Independent legal/privacy review remains deferred.
- A platform-admin-only activation report at `/ExportPanel/api/activation` so deployment state can be
  checked against this document rather than trusted.

## Production activation state

Activation is tracked in [`production-activation-todo.md`](production-activation-todo.md) and the
deployment's own gate state is readable at `/ExportPanel/api/activation`.

On 2026-08-29 the founder authorized R1-R6 development and accepted the risk of
deferring independent security, privacy/legal, recovery and rollback review.
The table below remains a production-activation view: deferred controls do not
stop implementation, but no affected capability becomes Live until its gate is
recorded.

| Gate                             | State       | What is blocking                                                                                                                                                                                                         |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gate 0 — ownership and freeze    | In progress | Development authorized; protected `main`, 8 required checks, 6 milestones and the 22-item R0/R1 backlog exist; all six roles are assigned; deferred external policy approvals still block affected production activation |
| Gate 1 — identity and PostgreSQL | In progress | Frankfurt Neon projects/migrations/locked roles, initial Clerk configuration and hosted CI are evidenced; live credentials/Hyperdrive, webhook secret/delivery, MFA/journeys and recovery approvals remain               |
| Gate 2 — evidence vault          | In progress | Provider-neutral lifecycle and negative-path tests pass; production private R2, isolated scanner, lifecycle rules and inventory reconciliation are not provisioned, so uploads fail closed                              |
| Gate 3 — production persistence  | In progress | Profile, primary product, paid dashboard, lane/readiness, tenant Studio and task center are PostgreSQL-authoritative; later-phase surfaces remain fail-closed behind preview adapters                                  |
| Gate 4 — trust and integrations  | Not started | No reviewed provider or mail applications                                                                                                                                                                                |
| Gate 5 — pilot and launch        | In progress | R2 internal Alpha contracts, bounded pass, Bangla/low-data UX and minimized metrics pass locally; CSP enforcement, external monitoring/review and evidence from 5–10 actual partners remain                            |
| Gate 6 — General Availability    | Not started | Executable manifest and hosted RC observation workflow exist; seven-day production-like soak, independent assurance, recovery targets, immutable release record and GA outcome floor remain unproved                |

No capability in this table may be described as live before its gate records evidence.

## Local preview behavior

The UI uses an authorized, realistic domain projection when `EXPORTHQ_DEMO_MODE` is enabled outside production. Export Studio interactions use clearly labelled local browser persistence for draft economics, milestones, shortlists, and cluster interest. Email Inbox displays explicitly labelled illustrative conversations and can save an unsent browser-local draft; it does not read or send provider mail. These are explicit preview adapters, not production persistence paths. Demo mode is impossible in `NODE_ENV=production`.

## Production authentication activation

The application code no longer permits demo access in production. If Clerk is not configured, protected routes fail closed and the sign-in surface reports that authentication is unavailable; `/preview` and `/plans` remain public.

Activation still requires an ExportHQ-owned Clerk production instance:

1. configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the application build environment;
2. add `CLERK_SECRET_KEY` as a Cloudflare Worker secret and optionally add `CLERK_JWT_KEY` for networkless verification;
3. enable Clerk Organizations; keep Clerk Billing disabled and verify the internal-ledger plan path;
4. deploy only after the production keys and plans exist, then verify sign-in, organization creation, onboarding, plan access, organization switching, and sign-out on `export-hq.com/ExportPanel`.

Clerk production credentials are provisioned separately as Cloudflare Worker secrets and must remain outside source control. Every deployment should verify their presence before testing organization selection, onboarding, plan access, switching, and sign-out.

## Remaining production data activation

Before accepting real customer data:

1. finalize the locked Frankfurt Neon role credentials through a protected human session and connect the application role to Hyperdrive;
2. record staging restore, production PITR and independent encrypted-export evidence;
3. transfer the registered Clerk webhook secret directly into Cloudflare and configure invitations, role templates, staff allowlists and MFA policy;
4. continue replacing the remaining preview-backed modeled commands; onboarding, profile/product settings, the reviewed identity projection, paid dashboard, tenant Studio and task center are already database-authoritative;
5. provision private EU R2, signed upload intents, quarantine, malware scanning, checksums, and authorized download logging;
6. retain the required green GitHub database, Playwright, security and Worker checks; add R2 object-enumeration and signed-file isolation once Gate 2 exists;
7. enforce the production CSP after Clerk/R2 exercise; connect external error monitoring if approved; retain the existing redaction/analytics allowlist and execute scheduled backup/restore drills.
8. apply the market intelligence migration, publish the reviewed starter catalog, and connect verification approval to the trusted operations workflow.
9. extend the PostgreSQL-authoritative tenant Studio from its R1 lane/task/regulatory summary into later-phase economics, buyer, provider, shipment and proceeds commands only as those gates are implemented;
10. activate reviewed adapters for buyer data, provider credentialing, banks, laboratories, freight, shipment events, policy sources, and proceeds reconciliation before representing any of them as live.
11. activate reviewed mail-provider applications, encrypted token storage, organization-scoped message repositories, Gmail Pub/Sub, Microsoft Graph subscriptions, Yahoo/Apple/Zoho/custom IMAP workers, MIME parsing, attachment scanning, delivery monitoring, revocation, and recovery before connecting customer mailboxes.

The data model and interfaces are ready for this activation, but claiming those external controls are live without provisioned services would be misleading.

## Recommended next product work

Activate the production Clerk instance and persistence layer, then run one complete Export Lane with a real pilot exporter from opportunity through payment follow-up. Use observed readiness, economics, buyer, provider, shipment, and proceeds work to refine applicability, ownership, controls, and service economics before enabling live referrals or finance applications.
