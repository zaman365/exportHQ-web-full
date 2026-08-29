# Export HQ production activation TODO

- **Status:** Active backlog
- **Created:** 2026-08-26
- **Owner:** Export HQ product and engineering
- **Source of truth:** [`BUSINESS_LOGIC.md`](BUSINESS_LOGIC.md) and
  [`implementation-status.md`](implementation-status.md)
- **Goal:** Finish the production components that are currently modeled, previewed, or only
  partially activated before accepting real exporter evidence or representing external
  integrations as live.

## Completion rule

Export HQ is not “production activated” when the interface is deployed. It is complete only
when the real identity, tenant persistence, private files, audit, recovery and operating teams
work together for one verified pilot exporter from account creation through Export Lane payment
follow-up.

Until Gate 3 passes:

- do not accept real exporter documents or mailbox credentials;
- keep preview adapters clearly labelled and impossible to enable in production;
- do not describe government, bank, buyer, provider, laboratory, freight, shipment, insurance,
  proceeds or mail connections as live;
- use synthetic data in development, preview and automated tests.

## Priority order

```text
Gate 0: ownership and safety freeze
    ↓
Gate 1: Clerk + PostgreSQL/RLS + audit
    ↓
Gate 2: private R2 + scanning + recovery
    ↓
Gate 3: replace preview persistence and prove isolation
    ↓
Gate 4: operational trust workflows and reviewed integrations
    ↓
Gate 5: one real pilot Export Lane and controlled launch
```

## Gate 0 — programme ownership and safety freeze

> **Recorded 2026-08-26.** The safety freeze is implemented in code and
> documented: [`activation-gates.md`](activation-gates.md),
> [`production-inventory.md`](production-inventory.md),
> [`preview-adapter-inventory.md`](preview-adapter-inventory.md),
> [`data-classification.md`](data-classification.md),
> [`incident-response.md`](incident-response.md),
> [`production-ownership.md`](production-ownership.md). On 2026-08-29 Mohammed
> Maniruzzaman was assigned to all six roles for the single-founder R0 period.
> On 2026-08-29 he authorized R1-R6 development and accepted deferral risk. The
> production gate stays open because the policies and independent reviews
> remain unapproved; fail-closed development may continue.

- [x] Name the product owner, technical lead, data owner, identity owner, security owner and
      operations owner.
- [ ] Convert every section below into tracked work with one owner, target milestone and
      dependency list.
- [x] Inventory production domains, Workers, routes, Clerk instances, Neon projects, R2 buckets,
      secrets, webhooks and external provider applications.
- [x] Inventory every browser-local, fixture-backed and Clerk-metadata persistence adapter.
- [x] Confirm production cannot enable `EXPORTHQ_DEMO_MODE` or render protected fixture data.
      <br>Demo identity is impossible in production and asserted by test. Fixture-backed
      projections still render for signed-in users above the Basic tier, so they now carry a
      non-dismissible "Illustrative data" notice derived from the activation state; the notice
      clears itself when Gate 3 activates tenant records. Removing the fixtures is Gate 3.
- [x] Add a production feature flag that refuses document upload and mailbox connection until
      the relevant activation gates are recorded as passed.
- [ ] Approve data classification, retention, legal-hold and telemetry-redaction policies.
- [x] Write the incident response, credential compromise and production rollback runbook.

**Gate 0 exit evidence**

- Named owners and an approved backlog exist.
- The inventory has no unknown production resource or data store.
- Sensitive-data features fail closed independently of UI visibility.

## Gate 1 — production identity and authoritative PostgreSQL

### Clerk production activation

> **Verified 2026-08-26 from the Clerk console.** Production instance
> `ins_3IRabAnEQBciVzmSDLT4Qhzb5go` on `export-hq.com` is live with
> Organizations enabled. On 2026-08-29, the custom domain/DNS/SSL and
> ExportPanel paths were verified, email/password and email-code methods were
> inspected, the reviewed webhook endpoint was registered, and production
> access was restricted to invite-only. Blocked: Billing is not enabled,
> phone/SMS and MFA are plan-gated, custom roles remain
> at the 2-role ceiling, and the webhook signing secret/live delivery test
> still require a named human secret owner. See
> [`release/evidence/r0-clerk-2026-08-29/`](release/evidence/r0-clerk-2026-08-29/).

- [x] Create or verify the Export HQ-owned Clerk production instance for `export-hq.com`.
- [x] Configure production publishable and secret keys only through the deployment secret store.
- [x] Restrict authorized parties to the approved Export HQ origin.
- [x] Configure sign-in, sign-up, onboarding and sign-out callbacks under `/ExportPanel`.
- [ ] Activate and test the approved email/password, email OTP and phone/SMS methods.
- [ ] Configure production OAuth applications one at a time; advertise a method only after a
      successful real-account test.
- [ ] Enable Clerk Organizations and verify create, select, invite, switch and leave behavior.
- [ ] Create exact Billing plan keys `launch`, `scale` and `managed`, then test entitlement
      transitions and failure states.
- [ ] Configure webhook signature verification, replay protection, idempotency and dead-letter
      handling for users, organizations, memberships, roles, invitations and plan changes.
- [ ] Define role templates and verify their mapping to central authorization permissions.
- [ ] Require MFA for platform administrators and privileged operations roles; enable recovery
      controls and test account recovery.
- [ ] Verify the `EXPORTHQ_PLATFORM_ADMIN_EMAILS` allowlist remains server-only and still requires
      authentication plus an organization boundary.

### Neon PostgreSQL and RLS

> **Built and locally verified 2026-08-29 against isolated PostgreSQL 17.** Transaction-scoped
> tenant context (`set_config(..., true)`, discarded on commit), transactional
> append-only audit, database-held plan entitlements replacing the identity
> provider's billing product, the identity bridge as `SECURITY DEFINER`
> functions, durable idempotency, and the organization/company-profile
> repositories. Onboarding is PostgreSQL-authoritative when the capability is
> activated. The non-owner application-role suite passes 29 tests, including
> tenant isolation, durable-control concurrency and webhook projection; clean
> migrate, backup and separate-database restore also pass locally. Neon,
> Protected-branch CI and three Neon project/schema/role records are now
> captured. Human-held role credentials, Hyperdrive, recovery evidence and the
> remaining Clerk journeys still keep Gate 1 open.

- [x] Provision separate development, staging and production Neon projects.
- [ ] Place production in the approved Frankfurt/EU region and record the vendor/security review.
- [x] Generate and review the structural Drizzle migration before applying the checked-in RLS
      envelope.
      <br>`migrations-v2/0000_reproducible_baseline.sql` is the clean baseline,
      `0001_security_envelope.sql` is the RLS/identity bridge, the checksum
      manifest prevents mutation, and `roles/bootstrap.sql` applies separated roles.
- [x] Create separate migration, application and read-only support roles.
- [x] Ensure the application role is non-owner and does not have `BYPASSRLS`.
- [x] Set organization context transactionally for every tenant request and reset it safely.
      <br>The application role tests prove transaction-local context is discarded on commit.
- [ ] Implement PostgreSQL repositories for every currently modeled command and query.
- [ ] Replace Clerk organization metadata as storage for onboarding, readiness and profile state.
      <br>Onboarding, readiness and verification-case writes are now
      PostgreSQL-authoritative. Workspace Settings/profile drafts and remaining
      identity mirrors still need removal or bounded post-commit reconciliation.
- [ ] Make privileged changes, membership changes, evidence state changes and business decisions
      write append-only audit events in the same transaction.
- [x] Add idempotency for webhooks and retryable commands.
      <br>Durable `idempotency_keys` with a conditional-insert claim, plus `webhook_deliveries`
      recording every inbound delivery including ignored ones.
- [ ] Prove migrations on a production-shaped staging database with rollback/forward-fix steps.
- [ ] Configure automated backups, point-in-time recovery and an independent encrypted export.
      <br>A non-expiring manual production snapshot and isolated point-in-time
      drill branch were created on 2026-08-29. The restored catalog and
      fail-closed application-role RLS check passed. Scheduled snapshots,
      independent encrypted export and approved recovery targets remain open.
- [x] Perform and document a synthetic local restore drill.
      <br>R0 local evidence records restored row counts and RLS behavior; production
      PITR remains required; the protected hosted workflow now also proves
      migrate, RLS, backup and separate-database restore on PostgreSQL 17.

### Gate 1 isolation tests

- [ ] Test every organization-scoped read, mutation, export, enumeration and search as an owner,
      admin, member, viewer, external partner, Export HQ staff member and unrelated user.
- [ ] Test role, plan, verification and organization switching on the server—not only navigation.
- [ ] Test direct-object and guessed-identifier access across organizations.
- [ ] Test staff access grant creation, approval, expiry, revocation and audit.
- [ ] Test webhook replay, reordering, duplicate delivery and invalid signatures.

**Gate 1 exit evidence**

- Production Clerk journeys pass on the real domain.
- All real organization state is in PostgreSQL.
- Cross-tenant tests expose zero unauthorized records.
- A clean database can be migrated and a damaged database can be restored.

## Gate 2 — private EU R2 evidence vault

### Storage foundation

- [ ] Provision private production R2 buckets with the approved EU jurisdiction.
- [ ] Disable public `r2.dev` and public custom-domain access.
- [ ] Define object keys that do not expose customer names, emails or document contents.
- [ ] Store object metadata and ownership in PostgreSQL; never treat an object key as
      authorization.
- [ ] Configure least-privilege Worker bindings and separate scanner access.
- [ ] Add retention/lifecycle rules for abandoned uploads, rejected files and temporary exports.

### Upload and scan pipeline

- [ ] Create an authorized, one-use upload-intent command linked to organization, resource and
      expected evidence type.
- [ ] Issue short-lived, operation-specific signed upload access.
- [ ] Enforce the 25 MB limit and approved PDF/JPEG/PNG contract at the server boundary.
- [ ] Validate checksums, media type and file signature/magic bytes.
- [ ] Upload to quarantine only.
- [ ] Run malware scanning in an isolated service with bounded retries and a dead-letter path.
- [ ] Permit OCR or extraction only after a clean scan result.
- [ ] Move or promote clean evidence without losing the immutable document-version record.
- [ ] Give rejected files a safe user-facing reason and next action without exposing scanner
      internals.
- [ ] Audit stage, scan, accept, reject, view, download, share, revoke and delete actions.

### Download, sharing and deletion

- [ ] Re-authorize organization, resource, permission, plan and evidence state for every download.
- [ ] Issue narrowly scoped, short-lived signed download access only after authorization.
- [ ] Add explicit, scoped, expiring and revocable external shares.
- [ ] Prevent object enumeration and cross-tenant signed-file reuse.
- [ ] Keep signed URLs, document contents and confidential metadata out of logs and analytics.
- [ ] Implement retention-aware deletion, legal hold and customer export.
- [ ] Reconcile PostgreSQL document rows with R2 inventory and alert on orphaned rows/objects.

**Gate 2 exit evidence**

- Quarantine-to-clean and quarantine-to-rejected flows pass end to end.
- Cross-tenant and object-enumeration tests pass.
- Every access is authorized and audited.
- Backup, restore, retention and deletion have been rehearsed with synthetic documents.

## Gate 3 — replace every preview persistence adapter

### Core workspace

- [ ] Persist company profile, onboarding, products, markets, channels and readiness state in
      tenant-scoped PostgreSQL repositories.
      <br>Lane-scoped readiness responses now persist with optimistic versions,
      derived tasks, audit/outbox and non-owner isolation; the broader profile,
      product, market and channel settings path remains open.
- [ ] Persist tasks, ownership, waiting states, decisions, ideas, notifications and Attention
      Center state with audit events.
- [ ] Persist requirements, evidence feedback, document links and review decisions.
- [ ] Replace Export Studio local drafts with repositories for lanes, economics, milestones,
      buyer cohorts, provider requests, finance preparation, shipment checkpoints and proceeds.
- [ ] Ensure all commercial money values use integer minor units and ISO currency.
- [ ] Replace fictional standalone Buyer records before presenting buyer data as real.

### Team and operations

- [ ] Replace browser-local team profiles, departments, role changes and conversations with
      organization-scoped repositories.
- [ ] Add the reviewed real-time delivery mechanism and message authorization.
- [ ] Keep Export HQ staff outside customer membership; use explicit, expiring staff grants.
- [ ] Replace operations-console illustrative projections with authorized portfolio, risk,
      review, managed-work and provider-coordination repositories.
- [ ] Ensure every summary row/card navigates to an authorized detail/action path.

### Browser and regression verification

- [ ] Add Playwright tests against ephemeral PostgreSQL and isolated test object storage.
- [ ] Test public, Basic, Launch, Scale, Managed and verified-business projections.
- [ ] Test preview pages for server-side redaction and mutation denial.
- [ ] Test desktop, mobile, keyboard and critical accessibility journeys.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` in CI.
- [x] Run the Vinext/Cloudflare production build and deployment smoke tests.
      <br>Vinext build, Wrangler dry-run and local emitted-Worker smoke pass;
      protected-branch artifact attestation and deployment remain required.

**Gate 3 exit evidence**

- No customer workflow relies on browser-local state, fixtures or Clerk metadata in production.
- All plan/trust/role combinations pass server-side tests.
- A user can leave, return on another device and continue the same authorized Export Lane.

## Gate 4 — operational trust and reviewed integrations

### Business verification and market intelligence

- [ ] Implement the trusted operations queue for business-verification submissions.
- [ ] Require evidence, reviewer identity and auditable approval/rejection; self-submission stays
      `pending`.
- [ ] Apply the market-intelligence migration and publish only the reviewed starter catalog.
- [ ] Connect source freshness, effective/review dates, confidence and methodology version to the
      publishing workflow.
- [ ] Add correction, withdrawal and scheduled-review operations.

### Provider marketplace

- [ ] Define provider qualification, credential review, re-verification and suspension.
- [ ] Approve provider agreements, service scope, fee guide, conflicts and commission disclosure.
- [ ] Implement consented referral, matching, introduction, engagement, feedback and dispute
      workflows.
- [ ] Keep ranking independent of sponsorship and commission size.
- [ ] Implement settlement/reconciliation only after legal and finance approval.

### Connected email

- [ ] Approve provider applications and redirect domains for Google and Microsoft first.
- [ ] Implement encrypted server-side credential/token storage; PostgreSQL stores references and
      status, never raw tokens or app passwords.
- [ ] Implement tenant-scoped mailbox, thread and message repositories.
- [ ] Implement Gmail Pub/Sub and Microsoft Graph subscription renewal/catch-up processing.
- [ ] Add Yahoo/AOL, Apple/iCloud, Zoho and custom IMAP/SMTP only after provider-specific review.
- [ ] Add MIME parsing, sender-content sanitization, attachment quarantine/scanning and bounded
      retention.
- [ ] Add send, delivery, bounce, revocation, reconnect, rate-limit and provider-outage handling.
- [ ] Enforce mailbox plan ceilings independently from role permissions.
- [ ] Complete mailbox threat modelling and security review before accepting credentials.

### Other live adapters

- [ ] Prioritize adapters from observed pilot blockers, not from a desire to display many logos.
- [ ] For every government, bank, buyer-data, laboratory, freight, carrier, insurance, customs or
      proceeds adapter, record credentials, contract, data rights, security review, monitoring,
      operational owner and explicit connection state.
- [ ] Provide graceful disconnected/degraded behavior without fabricated data or certainty.
- [ ] Add reconciliation, expiry, revocation and incident procedures for each activated adapter.

**Gate 4 exit evidence**

- Verification and publishing require trusted human operations.
- Provider economics and conflicts are disclosed before data sharing.
- Every integration labelled live has real credentials, contracts, monitoring and an owner.
- Disconnected adapters remain truthful and do not block unrelated Export Lane work.

## Gate 5 — security hardening and controlled pilot

### Production protection

- [x] Add application rate limits and abuse controls for authentication, upload, search,
      invitations, exports and webhooks.
      <br>Production selects the atomic PostgreSQL store or fails closed; the
      shared ceiling passes a 40-way concurrency test. Cloudflare account-level
      edge rules remain an external configuration item.
- [ ] Deploy a restrictive production CSP tested with Clerk and R2 flows.
- [ ] Add CSRF-safe mutations, secure headers and dependency/secret scanning.
- [ ] Configure Sentry scrubbing and a PostHog metadata allowlist; prove confidential evidence,
      message bodies, tokens and signed URLs never enter telemetry.
- [ ] Configure alerts for authentication anomalies, authorization failures, database saturation,
      queue lag, scan failures, webhook failures and restore health.
- [ ] Complete threat modelling and an independent external security review.
- [ ] Remediate critical/high findings and record accepted lower-risk findings with owners.
- [ ] Rehearse incident response, credential rotation, document exposure and tenant-isolation
      scenarios.

### Pilot Export Lane

- [ ] Select one consenting pilot exporter, one product, one destination, one channel and one
      measurable commercial route.
- [ ] Complete account creation, organization activation and progressive profile setup.
- [ ] Produce reviewed opportunity/readiness results with sources and explicit uncertainty.
- [ ] Create owned blockers, actions and evidence requests.
- [ ] Upload, scan, review, share and revoke representative evidence safely.
- [ ] Create a commercially valid Export Lane and progress it through applicable stages.
- [ ] Record buyer/provider interactions truthfully, including consent and commission disclosure.
- [ ] Track shipment/payment follow-up where real integrations or verified manual operations
      support it.
- [ ] Export the customer data and test account/organization closure subject to retention.
- [ ] Interview the customer and operations team; turn observed failures into owned backlog.

### Launch decision

- [ ] Confirm all prior gate evidence and unresolved risks with product, engineering, security and
      operations.
- [ ] Confirm support coverage, escalation paths, status communication and provider contacts.
- [ ] Approve capacity, cost, backup, restore and rollback thresholds.
- [ ] Mark only proven components as production-active in `implementation-status.md` and
      `BUSINESS_LOGIC.md`.
- [ ] Remove preview adapters only after their production replacements and rollback window pass.

**Gate 5 exit evidence**

- One complete pilot Export Lane has an auditable evidence and action history.
- No component is presented as operational beyond its verified state.
- Production rollback, support and incident ownership are active.
- The implementation-status document matches deployed reality.

## Definition of done for every component

A checkbox above may be closed only when the component has:

- an accountable owner and approved user outcome;
- organization and Export Lane context where applicable;
- server-side authentication, authorization, entitlement and ownership checks;
- validated input and safe failure/degraded states;
- durable tenant-scoped persistence and transactional audit where required;
- migration, rollback and data-reconciliation procedures;
- tests for success, denial, duplication, retry, outage and cross-tenant access;
- redacted telemetry, alerts and an operational runbook;
- privacy, retention, contract and security review appropriate to the data;
- updated implementation-status and business-logic documentation;
- no fixture, browser-local or unprovisioned-provider behavior represented as live.

## Progress summary

| Gate                             | State       | Blocking outcome                                                                                      |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| Gate 0 — ownership and freeze    | In progress | Development authorized and owners named; deferred policy/reviewer approvals block activation          |
| Gate 1 — identity and PostgreSQL | In progress | Neon/Clerk foundation and CI evidenced; secrets, Hyperdrive, Billing/MFA/journeys and recovery remain |
| Gate 2 — private evidence vault  | Not started | Real evidence must not be accepted                                                                    |
| Gate 3 — production persistence  | In progress | Readiness/verification persistence is authoritative; other preview adapters remain                     |
| Gate 4 — trust and integrations  | Not started | External capabilities cannot be called live                                                           |
| Gate 5 — pilot and launch        | In progress | CSP, rate limits and redaction shipped; report-only                                                   |

Update this table only from recorded gate evidence. The checklist is intentionally conservative:
finishing Export HQ means making the operating promises true, not merely changing labels or
removing preview badges.
