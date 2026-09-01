# Export HQ — Next ToDo's

> Start-here handoff for the next implementation session. This document records
> the verified state, unresolved blockers, free-tier operating plan, exact next
> actions, and the evidence required to close R0 and progress through R1–R6.

## 1. Document status

- **Last reconciled:** 2026-09-01 (Europe/Berlin)
- **Repository:** `zaman365/exportHQ-web-full`
- **Canonical branch:** protected `main`
- **Source revision inspected:** `e7cad671eb4c48fb3d7a3ac3cc03b18a8f615294`
- **Live application Worker:** `exporthq-app`
- **Live public hostname:** `https://export-hq.com`
- **ExportPanel route:** `https://export-hq.com/ExportPanel`
- **Current operating status:** R0 engineering baseline accepted and R1–R6
  development authorized; production activation and external Alpha are not yet
  approved.

This file is a planning and handoff record. It does not replace the gate rules in
[`docs/BUSINESS_LOGIC.md`](docs/BUSINESS_LOGIC.md), the implementation directive,
or retained release evidence. If this file conflicts with those sources, preserve
the stricter security, tenancy, evidence, and progressive-access rule until the
product decision and central policy are deliberately updated together.

## 2. Decisions already made

Do not reopen these decisions unless the founder changes them explicitly:

- [x] Mohammed Maniruzzaman is the named accountable owner for the product,
      technical, data, identity, security, and operations roles during the
      single-founder stage.
- [x] There will be no second GitHub reviewer for now. The protected repository
      has a documented solo-repository exception and requires zero approving reviews.
      Pull requests, required checks, protected `main`, resolved conversations, and
      retained evidence still apply.
- [x] Do not buy Clerk Pro solely to close R0. Use Clerk Hobby for customer
      identity and place privileged staff/admin routes behind Cloudflare Access with
      independent MFA and an explicit allowlist.
- [x] Synthetic test data is approved for engineering, automated tests, previews,
      and phase implementation before real partner data is permitted.
- [x] Founder authorization allows R1–R6 **development** to continue while
      external approvals are deferred.
- [x] Founder authorization does **not** fabricate or replace independent
      security, privacy/legal, incident-response, recovery, rollback, or business
      review evidence where a phase exit requires independence.
- [x] Historical dashboard sections and Inbox examples should remain available as
      editable, labelled starters. They must never be presented as tenant truth or
      silently substituted for missing production data.
- [x] The Inbox has a labelled public preview, while the tenant Inbox remains
      fail-closed until a real mailbox and the relevant controls are connected.

## 3. Truthful status at a glance

### What is implemented

- [x] Public website and ExportPanel routing on `export-hq.com`.
- [x] Clerk production application keys are bound to `exporthq-app`.
- [x] Clerk sign-in foundation, tenant/organization boundaries, route guards, and
      fail-closed production behavior.
- [x] PostgreSQL schema and immutable migrations `0000`–`0023` in the repository.
- [x] PostgreSQL-authoritative adapters and tested domain contracts for profile,
      primary product, paid dashboard, lane/readiness, tenant Studio, and tasks.
- [x] Provider-neutral evidence-vault lifecycle and negative-path tests.
- [x] Synthetic R1–R6 engineering contracts, release controls, and retained
      deployment evidence.
- [x] Editable dashboard starter modules restored without making browser-local
      examples authoritative tenant records.
- [x] Labelled Inbox preview restored while the production mailbox path remains
      gated.
- [x] Protected `main`, pull-request workflow, hosted CI, Worker artifact checks,
      browser tests, PostgreSQL tests, CodeQL, and dependency/security checks.
- [x] Six named accountable roles and the documented solo-reviewer exception.

### What is deployed

- [x] Cloudflare Worker `exporthq-app` version
      `09b13fbd-bd03-4d64-b14d-f6bf5ea23ca7` was created on
      2026-08-30T18:52:35.527Z.
- [x] Its deployment tag is `synthetic-dashboard-e7cad671` and its message names
      source revision `e7cad671eb4c48fb3d7a3ac3cc03b18a8f615294`.
- [x] The exact deployed revision previously passed the required hosted checks:
      `verify`, `postgres`, `codeql`, `worker-artifact`, `browser`,
      `dependencies-secrets-licenses`, and the connected Workers build.

### What is not production-active

- [ ] No Hyperdrive configuration exists in the Cloudflare account.
- [ ] `exporthq-app` has no production database/Hyperdrive binding.
- [ ] The production Neon application role still has `NOLOGIN`; no application
      password has been activated or transferred.
- [ ] Production contains only migrations `0000` and `0001`; migrations
      `0002`–`0023` remain unapplied.
- [ ] `CLERK_WEBHOOK_SECRET` is not bound to the Worker.
- [ ] Signed Clerk webhook delivery, replay, and reconciliation are unproved.
- [ ] R2 is not enabled and no private evidence buckets exist.
- [ ] No isolated production malware-scanning service exists.
- [ ] No real customer mailbox/provider application is connected.
- [ ] No approved live payment rail exists.
- [ ] External monitoring and release annotations are incomplete.
- [ ] Independent human approvals and production recovery evidence are incomplete.

### Tenant feature groups represented by the database-activation aggregate

The “Tenant features blocked by missing database activation: 5” indicator is
truthful. It represents these persistence-backed groups, not five deleted
features:

1. Company profile and onboarding state.
2. Primary product and related product records.
3. Paid workspace/dashboard state and entitlements.
4. Lane, readiness, and tenant Export Studio records.
5. Task-center/workflow state.

The code and UI contracts still exist. They intentionally fail closed because the
live Worker has no authoritative database connection. Do not replace that state
with fixtures or browser-local records.

## 4. New red alerts to fix first

These appeared after the earlier all-green release snapshot and must be handled
before the next release claim.

### 4.1 Scheduled production smoke is failing

- **Latest checked run:**
  <https://github.com/zaman365/exportHQ-web-full/actions/runs/33497493914>
- `/`, `/ExportPanel/preview`, and `/ExportPanel/plans` return `200`.
- `/ExportPanel/api/webhooks/clerk` returns `503`, so the scheduled job fails.
- The run does not populate `sourceSha`, `releaseTag`, `deploymentReference`, or
  `observationDay`.

The `503` is consistent with the intended fail-closed webhook path while the
webhook signing secret and durable database are absent. The monitoring contract,
however, currently treats that expected pre-activation state as generic downtime.

Next actions:

- [ ] Decide the monitor mode from explicit activation state, never by silently
      ignoring errors.
- [ ] Before Gate 1 activation, assert that the webhook returns the documented
      fail-closed response and record that as a healthy safety control.
- [ ] After database and webhook activation, require a signed positive webhook
      probe/replay plus reconciliation evidence; a plain unauthenticated `200` is not
      acceptable.
- [ ] Populate source SHA, release tag, deployment reference, and observation day
      for release-candidate/soak runs.
- [ ] Rerun the hosted workflow and retain the successful run URL and artifacts.

Acceptance evidence:

- Public pages respond successfully.
- The pre-activation webhook check proves fail-closed behavior, or the activated
  check proves valid signed processing and rejects invalid signatures.
- The workflow identifies the deployed artifact and observation window.

### 4.2 Scheduled secrets/license workflow is failing

- **Latest checked run:**
  <https://github.com/zaman365/exportHQ-web-full/actions/runs/33384304797>
- The scheduled full-history Gitleaks scan reported five findings.
- The reported locations appear to be test fixtures and high-entropy/non-secret
  storage-key strings, but every finding must be reviewed rather than dismissed:
  - `packages/platform/src/webhook-signature.test.ts` line 4 in historic commit
    `de1eec...` (`generic-api-key`).
  - `packages/platform/src/redaction.test.ts` line 70 in historic commit
    `de1eec...` (token-shaped query fixture).
  - `packages/platform/src/redaction.test.ts` line 31 in historic commit
    `de1eec...` (fake secret-shaped string / Stripe token rule).
  - `apps/app/app/waiting/waiting-client.tsx` lines 25–26 in historic commit
    `29ab9...` (`resolvedStorageKey` and `snoozedStorageKey`).

Next actions:

- [ ] Inspect each current file and referenced historic commit.
- [ ] If any finding contains real credential material, rotate/revoke it first and
      record the incident response. Do not begin with an allowlist.
- [ ] Replace current test values with clearly fake, deterministic, low-risk
      fixtures where test semantics permit.
- [ ] Because the scheduled scan includes Git history, add only narrow,
      fingerprint/path-specific entries to `.gitleaks.toml` for confirmed false
      positives. Do not add broad rule exclusions or rewrite shared history merely to
      remove fake test fixtures.
- [ ] Document a one-line justification beside every allowed fingerprint.
- [ ] Run a full-history scan locally and rerun the hosted
      `dependencies-secrets-licenses` workflow.
- [ ] Retain the green run URL and scanner artifact.

There are also GitHub Actions Node 20 deprecation warnings. They are not the cause
of this failure. Review and merge compatible Dependabot upgrades for
`actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, and Gitleaks after
the false positives are resolved and all required checks remain green.

## 5. R0 closure plan

R0 is not “closed” until its technical proofs and required approvals exist. It is
acceptable to continue engineering behind gates; it is not acceptable to label a
gate complete without evidence.

### R0-A. Ownership and repository controls

- [x] Product owner: Mohammed Maniruzzaman.
- [x] Technical owner: Mohammed Maniruzzaman.
- [x] Data owner: Mohammed Maniruzzaman.
- [x] Identity owner: Mohammed Maniruzzaman.
- [x] Security owner: Mohammed Maniruzzaman.
- [x] Operations owner: Mohammed Maniruzzaman.
- [x] Solo-repository exception recorded; no second reviewer required.
- [x] Protected `main`, required hosted checks, linear history, force-push
      prevention, deletion prevention, and resolved-conversation enforcement exist.
- [ ] Resolve the newly failing scheduled security workflow described above.
- [ ] Ensure each future release is merged through a pull request and tied to its
      exact tested SHA.

### R0-B. Activate Neon safely

Last verified Neon state on 2026-08-30:

- Project: `exporthq-production-eu`
- Project ID: `icy-mode-97605326`
- Production branch: `br-broad-water-b25k4lxl`
- Compute: `ep-calm-darkness-b2xguwix`
- Region/platform: AWS `eu-central-1`, PostgreSQL 17, Neon Free.
- Roles: `exporthq_migration`, `exporthq_app`, `exporthq_support`,
  `exporthq_backup`.
- All four roles had `rolcanlogin=false`.
- `exporthq_app` had `NOBYPASSRLS`.
- Only `exporthq_backup` had `BYPASSRLS`.
- Production had only migrations `0000` and `0001` of `0000`–`0023`.

A pre-activation recovery branch was created:

- Name: `pre-db-activation-2026-08-30`
- Branch ID: `br-rough-term-b24dr23o`
- Scheduled expiry: 2026-09-06 21:03 Europe/Berlin.

If work resumes after that expiry, create and verify a fresh recovery branch
before changing the production branch.

Why four roles do not mean four permanent passwords:

- `exporthq_app` needs a persistent, narrowly privileged login for runtime use.
- `exporthq_migration` should be enabled only for a controlled migration window,
  or migrations may run as the database owner and `SET ROLE` into it.
- `exporthq_support` should normally remain `NOLOGIN`; use time-bounded audited
  elevation only when a support procedure requires it.
- `exporthq_backup` should normally remain `NOLOGIN`; enable only for a bounded,
  audited backup/export operation if the provider workflow requires direct login.

Action sequence:

- [ ] Obtain action-time confirmation immediately before resetting or creating a
      production credential and transferring it to Cloudflare. Earlier general
      authorization is not a substitute for confirming the exact secret-changing
      operation at execution time.
- [ ] Verify the production branch, recovery branch, compute, current migration
      ledger, role grants, and RLS policies with read-only queries.
- [ ] Generate/reset a strong credential for `exporthq_app` without printing it in
      a transcript, shell history, file, issue, log, or commit.
- [ ] Set `exporthq_app LOGIN` with only the connection privileges and grants
      required by the runtime. Preserve `NOBYPASSRLS`.
- [ ] Leave migration, support, and backup roles `NOLOGIN` unless a bounded
      procedure needs one temporarily.
- [ ] Test the application-role connection directly without logging the URL.
- [ ] Apply migrations `0002`–`0023` through the controlled migration role/window.
- [ ] Verify the migration ledger contains every immutable migration exactly once.
- [ ] Revoke migration login again if it was temporarily enabled.
- [ ] Verify app-role cross-tenant reads/writes are denied by RLS.

Acceptance evidence:

- Redacted role/grant inventory.
- Complete migration ledger and checksums.
- Successful least-privilege application-role connection.
- RLS negative-path results proving tenant isolation.
- No secret values in logs, files, workflow output, or Git history.

### R0-C. Create Hyperdrive and use its binding correctly

Cloudflare currently reports zero Hyperdrive configurations and no Worker database
binding.

- [ ] Create one production Hyperdrive configuration in the same operational
      region strategy as the Neon database.
- [ ] Submit the Neon `exporthq_app` connection string securely to Hyperdrive.
- [ ] Add a named binding such as `HYPERDRIVE` to `exporthq-app`.
- [ ] Do not add a plaintext `DATABASE_URL` to `wrangler.jsonc`, source control, or
      ordinary Worker variables.
- [ ] Generate/update Cloudflare Worker types for the binding.
- [ ] Update runtime database construction to use
      `env.HYPERDRIVE.connectionString` via `cloudflare:workers`.
- [ ] Create the database client per request or through an approved Worker-safe
      lifecycle; do not rely on mutable request state in module globals.
- [ ] Update the `platform-runtime` adapter/environment detection so the binding
      is recognized as production persistence.
- [ ] Add automated tests for a present binding, an absent binding, connection
      failure, and fail-closed behavior.
- [ ] Deploy the exact tested SHA and exercise every persistence-backed group.

Free-tier constraint: Hyperdrive Free currently includes a daily query allowance
and hard-fails after its limit. Add usage alerts and avoid polling-heavy UI. Recheck
current limits before activation.

### R0-D. Complete Clerk webhook and privileged-user controls

Current Worker secrets include `CLERK_SECRET_KEY`,
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and
`EXPORTHQ_PLATFORM_ADMIN_EMAILS`. `CLERK_WEBHOOK_SECRET` is missing.

- [ ] Open the registered Clerk webhook for
      `https://export-hq.com/ExportPanel/api/webhooks/clerk`.
- [ ] Transfer its signing secret directly to the Cloudflare Worker secret named
      `CLERK_WEBHOOK_SECRET`; never paste it into this document, Git, or logs.
- [ ] Deploy the exact tested SHA after both database and secret activation.
- [ ] Prove a valid signed delivery is accepted and durably processed.
- [ ] Prove an invalid signature, stale timestamp, and altered payload are rejected.
- [ ] Replay the same event and prove idempotency/no duplicate tenant state.
- [ ] Run reconciliation from Clerk to PostgreSQL and record discrepancies or a
      clean result.
- [ ] Retain only redacted event IDs, timestamps, outcome, and evidence links.

Clerk Hobby does not provide every privileged-access control required by the
directive. The zero-subscription-cost solution is:

- [ ] Keep customer authentication on Clerk Hobby.
- [ ] Put staff/admin URLs behind Cloudflare Access.
- [ ] Configure an explicit staff email allowlist; deny everyone else.
- [ ] Require Cloudflare Access independent MFA (TOTP, WebAuthn, or biometric)
      before privileged routes.
- [ ] Require application-level authorization after Access; network identity alone
      must not grant tenant or platform privileges.
- [ ] Exercise enrollment, normal login, organization switching, sign-out,
      disabled-user denial, lost-factor recovery, and staff removal.
- [ ] Retain redacted screenshots/logs and an audited authorization matrix.

### R0-E. Backup, PITR, independent export, restore, and RLS proof

- [ ] Confirm the current Neon Free retention window before relying on it. The last
      verified Free plan provided six hours of time travel.
- [ ] Create a fresh pre-drill recovery branch/restore point.
- [ ] Insert uniquely identified synthetic tenant fixtures.
- [ ] Record the recovery objective, start time, target point, and expected rows.
- [ ] Restore into an isolated branch, never over the production branch.
- [ ] Compare schema/migration ledger, row counts, checksums, and selected records.
- [ ] Run RLS positive and cross-tenant negative tests against the restored branch.
- [ ] Produce an independent logical export using the bounded backup procedure.
- [ ] Encrypt the export, record a checksum, and keep it outside the primary Neon
      project/provider boundary.
- [ ] Restore that export into a separate disposable database and repeat integrity
      and RLS checks.
- [ ] Record actual RPO/RTO and deviations from the target.
- [ ] Disable temporary logins and securely remove local plaintext export material.

Neon branch restore/time travel alone is not an independent export. Both proofs
are required before claiming recovery readiness.

### R0-F. Human approvals

Development may continue, but do not mark these complete without an identifiable
reviewer, scope, date, decision, and retained evidence:

- [ ] Product/business approval.
- [ ] Independent security approval.
- [ ] Independent privacy/legal approval.
- [ ] Independent incident-response review.
- [ ] Independent recovery review.
- [ ] Independent rollback approval.

Founder sign-off may cover product/business ownership where policy permits. It
does not become “independent” merely by using a different role label for the same
person. A genuinely zero-vendor-cost route is a named qualified volunteer,
advisor, pro-bono reviewer, or partner reviewer. If none is available, the phase
remains engineering-complete but not approved for the affected live audience.

### R0-G. Protected release and operational evidence

- [ ] Fix both red alerts in section 4.
- [ ] Open a pull request from a release branch; all required checks must pass.
- [ ] Merge with zero required approvals under the documented solo exception.
- [ ] Record the merged SHA and verify the Cloudflare deployment identifies the
      same source revision.
- [ ] Generate and retain checksum, SBOM, provenance/attestation, test results, and
      artifact/deployment identifiers.
- [ ] Smoke-test the public site, authentication, organization/tenant journeys,
      database writes/reads, webhook validation, and fail-closed provider paths.
- [ ] Configure an external uptime monitor and a release annotation tied to the
      exact SHA/deployment.
- [ ] Exercise rollback using an immutable previous artifact and record the result.
- [ ] Update [`docs/release/CURRENT_RELEASE.md`](docs/release/CURRENT_RELEASE.md),
      which currently contains an older baseline SHA and must not remain the source of
      a stale release claim.

## 6. Free-tier systems and honest limitations

Provider allowances change. These were last researched on 2026-08-30/31; verify
official pricing and terms immediately before provisioning.

| Need                        | Free-tier route                       | Operating rule / limitation                                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application compute         | Cloudflare Workers Free               | Last verified: 100,000 requests/day and 10 ms CPU/request. Budget and alert; do not assume unlimited background work. <https://developers.cloudflare.com/workers/platform/pricing/>                                                                                     |
| Database                    | Neon Free                             | Last verified: 100 CU-hours/month/project, 0.5 GB/project, six-hour time travel, up to 2 CU. Use synthetic pilot data and monitor compute/storage. <https://neon.com/pricing>                                                                                           |
| Database connection pooling | Cloudflare Hyperdrive Free            | Last verified: 100,000 database queries/day and a hard daily limit. Avoid chatty polling and measure query count. <https://developers.cloudflare.com/hyperdrive/platform/pricing/>                                                                                      |
| Customer identity           | Clerk Hobby                           | Last verified: 50,000 monthly retained users and 100 monthly retained organizations; advanced MFA/custom-role capabilities are limited. <https://clerk.com/pricing>                                                                                                     |
| Staff MFA/allowlist         | Cloudflare Zero Trust/Access Free     | Suitable for a single-founder/small staff team; last verified Free plan covers fewer than 50 users and supports independent MFA. <https://www.cloudflare.com/plans/zero-trust-services/>                                                                                |
| CI                          | GitHub Free                           | Last verified for private repositories: 2,000 Actions minutes/month plus storage/cache limits. Keep scheduled jobs bounded and cancel superseded runs. <https://docs.github.com/en/billing/concepts/product-billing/github-actions>                                     |
| Evidence object storage     | Cloudflare R2 Standard free allowance | Last verified allowance: 10 GB-month, 1M Class A, 10M Class B, free egress. Account activation/checkout is still required and overage is billable. The account currently returns API error `10042` until R2 is enabled. <https://developers.cloudflare.com/r2/pricing/> |
| External uptime             | Better Stack Free or equivalent       | Last verified: 10 monitors/heartbeats, one status page, three-minute checks. Cloudflare Health Checks is not a Free-plan substitute. <https://betterstack.com/pricing>                                                                                                  |
| Mailbox pilot               | Gmail API standard quota              | API use has no separate standard-use fee, but quotas, OAuth consent, provider review, scanning, retention, and deletion controls still apply. <https://developers.google.com/workspace/gmail/api/reference/quota>                                                       |
| Queueing                    | Cloudflare Queues Free                | Last verified in 2026: 10,000 operations/day and 24-hour retention. Use only after checking current limits. <https://developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan/>                                                                             |

### Things a free-tier account does not solve by itself

- **Production malware scanning:** GitHub-hosted ClamAV is useful for synthetic CI
  fixtures, not an always-on isolated production scanner. A self-operated scanner
  can support a tightly bounded internal pilot, but it is not automatically a
  durable GA service. Until a real scanner exists, keep real document upload
  disabled and fail closed.
- **R2 cost certainty:** R2 has a free allowance, not a guaranteed hard-zero bill.
  Configure usage notification/budget controls and retain a kill switch.
- **Payments:** There is no honest “free production merchant account” substitute.
  Use provider sandboxes and audited manual entitlements/invoice recording during
  engineering. Do not accept live money or claim checkout readiness until legal,
  merchant, currency, refund, reconciliation, and webhook controls pass.
- **Independent approvals:** Software subscriptions cannot manufacture independent
  security, legal, recovery, or rollback review.
- **Provider approval:** Mailbox, logistics, payment, and other integrations may
  require OAuth verification, contracts, business verification, or provider
  acceptance even if their API has a free quota.

## 7. Evidence vault path (R2 / Gate 2)

Current state: R2 is not enabled; the Cloudflare API returns `10042` and asks the
account owner to enable R2 through the dashboard.

- [ ] Enable R2 only after reviewing the billing/overage implication.
- [ ] Use EU jurisdiction/data-location controls where supported and legally
      appropriate.
- [ ] Create separate private quarantine and clean buckets; do not expose either
      with a public development URL.
- [ ] Bind buckets directly to the Worker instead of creating static access keys
      where a native binding suffices.
- [ ] If external scanner credentials are unavoidable, use narrowly scoped,
      rotatable secrets and never store them in Git.
- [ ] Use short-lived signed upload intents with tenant, actor, MIME, size,
      checksum, and expiry constraints.
- [ ] Place every upload in quarantine first.
- [ ] Reject MIME/signature mismatch, oversize files, checksum mismatch, expired
      intents, invalid tenant access, and duplicate/replayed requests.
- [ ] Scan in an isolated service; promote only clean objects.
- [ ] Log every authorized download without exposing signed URLs or secret query
      material.
- [ ] Implement deletion, retention, lifecycle, orphan detection, and inventory
      reconciliation.
- [ ] Add tenant-isolation/object-enumeration tests and retained evidence.

Until every item above is exercised, keep real customer document uploads off.
Synthetic document fixtures may continue in CI and labelled previews.

## 8. Phase-by-phase backlog and exit evidence

Phase development can overlap behind gates. Phase **exit**, user exposure, and
claims cannot skip prerequisites.

### R1 — Trusted vertical slice

Goal: one complete synthetic journey from Passport/profile through lane readiness,
evidence review, and generated work.

- [x] Core PostgreSQL domain contracts, migrations, RLS tests, route guards, and
      fail-closed adapters exist.
- [x] Synthetic Passport/profile, product, lane/readiness, evidence, and task
      foundations exist.
- [x] Editable starter dashboard modules exist as labelled examples.
- [ ] Complete R0 database/Hyperdrive activation.
- [ ] Prove Clerk signed delivery, replay protection, and reconciliation.
- [ ] Exercise live sign-in, organization creation, switching, and sign-out.
- [ ] Complete privileged staff MFA, allowlist, authorization, and recovery proof.
- [ ] Activate the real evidence-vault path or keep evidence upload excluded from
      the externally exposed R1 scope.
- [ ] Prove the end-to-end synthetic lane flow against production-like persistent
      infrastructure.
- [ ] Prove staff tools are tenant-scoped, least-privilege, and audited.
- [ ] Complete money/entitlement negative-path tests without accepting live money.
- [ ] Retain legal/runbook review and independent security evidence with no open
      critical/high findings.

R1 exit evidence:

- Persistent Passport → product → lane → readiness → evidence review → task path.
- No fixture, browser-local value, or mock success response acts as tenant truth.
- Tenant/RLS isolation and audit records pass.
- Provider-dependent scope is either proven or visibly disabled.

### R2 — Internal Alpha

Goal: operate the bounded R1 flow with internal users and 5–10 design partners,
without public claims.

- [x] Internal Alpha contracts, bounded-pass rules, Bangla/low-data UX foundation,
      and minimized analytics tests exist locally.
- [ ] Complete R1 exit.
- [ ] Recruit 5–10 named design partners with consent, scope, and support owner.
- [ ] Establish a lawful, minimal data set and deletion/export process.
- [ ] Enable R2 evidence storage and an acceptable scanning path before any real
      document upload.
- [ ] Configure external monitoring, incident intake, support response, and
      rollback procedure.
- [ ] Enforce production CSP after Clerk/R2/provider exercises are complete.
- [ ] Record partner outcomes, failures, support burden, and remediation.
- [ ] Obtain the required Alpha security/privacy/business review.

R2 exit evidence:

- 5–10 actual partners complete the bounded journey.
- Outcome metrics meet the directive's threshold; screenshots alone do not count.
- No critical/high security or privacy issues remain open.
- Recovery and rollback drills are reproducible.

### R3 — Private Beta

Goal: prove real shipment/proceeds outcomes for an invited cohort.

- [x] PostgreSQL-authoritative R3 domain/operating contracts exist.
- [ ] Complete R2 exit and close material Alpha findings.
- [ ] Define invited cohort, markets, products, unsupported cases, and kill
      switches.
- [ ] Activate only reviewed logistics, mailbox, provider, and payment/manual
      operations needed for the cohort.
- [ ] Preserve consent, provenance, evidence, and manual-review boundaries for
      recommendations and generated content.
- [ ] Prove shipment and proceeds outcomes, refunds/adjustments, reconciliation,
      and exception handling.
- [ ] Measure tenant isolation, latency, error rate, support load, cost, and
      operator workload.
- [ ] Repeat recovery/rollback and incident exercises with Private Beta data.

R3 exit evidence:

- Actual invited customers achieve verified shipment/proceeds outcomes.
- Commercial, legal, support, and reconciliation controls match the operated
  markets; synthetic success is insufficient.
- Capacity and unit economics are measured, not guessed.

### R4 — Public Beta

Goal: controlled public access with reviewed providers, reliable operations, and
truthful billing/usage.

- [x] Public-Beta engineering contracts exist behind fail-closed activation gates.
- [ ] Complete R3 exit.
- [ ] Finish business/provider verification and select reviewed providers.
- [ ] Complete real mailbox, notification, logistics, and payment integrations
      required by published scope.
- [ ] Implement provider health, retries, idempotency, rate limits, circuit
      breakers, reconciliation, and manual fallback.
- [ ] Prove billing, entitlements, usage, invoices, refunds, webhooks, and customer
      export/deletion end to end.
- [ ] Publish accurate availability, supported-market, privacy, legal, and support
      statements.
- [ ] Run accessibility, localization, low-bandwidth, performance, penetration,
      abuse, and load assessments.
- [ ] Establish on-call/incident, status page, customer notification, and service
      review cadence.

R4 exit evidence:

- Public-Beta reliability and support objectives hold for the defined window.
- Billing and provider reconciliation balance.
- Security/privacy issues are within the approved risk threshold.
- Public claims are supported by measured evidence.

### R5 — General Availability

Goal: a signed, independently assured GA release with demonstrated outcomes.

- [x] Executable GA-control manifest and hosted release-candidate observation
      workflow exist.
- [ ] Complete R4 exit.
- [ ] Freeze a release candidate and identify exact source, lockfile, artifact,
      checksum, SBOM, provenance, configuration, and database migration set.
- [ ] Run the required seven-day production-like soak without resetting the clock
      after a material change.
- [ ] Prove SLOs, alerting, incident response, backup, restore, PITR, independent
      export, rollback, and disaster-recovery objectives.
- [ ] Obtain independent security, privacy/legal, recovery, rollback, and
      product/business assurance.
- [ ] Close all critical/high findings or reject the release.
- [ ] Meet the directive's GA outcome floor with real eligible users.
- [ ] Sign and retain the immutable GA release record.
- [ ] Update public claims, status, support, retention, and provider disclosures to
      match the proven release exactly.

R5 exit evidence:

- Seven-day soak artifacts tied to one immutable candidate.
- Independent assurance records and closed critical/high findings.
- Verified recovery and rollback objectives.
- Signed GA manifest plus measured customer outcome floor.

### R6 — Post-GA capabilities

Goal: add capabilities independently after GA without weakening the GA contract.

- [x] Post-GA capability contracts exist and default to Planned/fail-closed.
- [ ] Do not activate any R6 capability before the immutable R5 GA record exists.
- [ ] For each capability, define owner, scope, tenants, dependencies, threat/data
      review, observability, cost budget, outcome metric, rollback, and kill switch.
- [ ] Implement and test each capability behind its own evidence-bound activation
      record.
- [ ] Repeat provider, security, privacy, reliability, billing, and recovery review
      appropriate to that capability.
- [ ] Roll out progressively to an explicit cohort; never infer global activation
      from the existence of code.
- [ ] Measure outcomes and retire capabilities that fail value, safety, or cost
      thresholds.

R6 evidence rule:

Every capability needs both `ga-release://<tag>/<sha>/<manifest-hash>` and its own
`capability=post-ga://<capability>/<evidence-hash>` record. “Implemented” is not
the same as “activated.”

## 9. Recommended execution order

Use this order in the next session to minimize rework and preserve rollback:

1. [ ] Pull protected `main`; confirm the worktree is clean and record the SHA.
2. [ ] Fix and rerun the full-history secrets/license workflow.
3. [ ] Correct the scheduled production-smoke contract and retain a green
       pre-activation run.
4. [ ] Recheck Neon, Cloudflare, Clerk, GitHub, DNS/routes, and free-tier limits.
5. [ ] If the old Neon recovery branch expired, create and verify a fresh one.
6. [ ] Request action-time authorization for the exact production credential
       reset/transfer operation.
7. [ ] Activate only the Neon application login; run migrations under a bounded
       migration procedure; verify RLS.
8. [ ] Create Hyperdrive, bind it to `exporthq-app`, update the Worker runtime, and
       test fail-closed and connected paths.
9. [ ] Transfer `CLERK_WEBHOOK_SECRET`; prove signed delivery, rejection, replay,
       and reconciliation.
10. [ ] Configure Cloudflare Access staff allowlist/MFA and exercise recovery and
        authorization.
11. [ ] Perform Neon PITR/branch restore, independent encrypted export/restore,
        integrity, and RLS drills.
12. [ ] Enable and build R2/scanning only if billing/overage and the scanner
        operating model are accepted; otherwise keep real upload disabled.
13. [ ] Deploy the exact protected-main artifact; capture checksum, SBOM,
        provenance, smoke, monitoring, release annotation, and rollback evidence.
14. [ ] Update current-release and gate documentation with exact evidence links.
15. [ ] Obtain the still-required independent approvals before external Alpha or
        later phase exit.
16. [ ] Continue R1, then R2, R3, R4, R5, and R6 in order; never convert synthetic
        engineering evidence into a real-outcome claim.

## 10. Safe verification commands

Run commands from the repository root. These are examples; confirm provider CLI
syntax against current official documentation before mutation.

```bash
git status --short --branch
git rev-parse HEAD
git log -1 --show-signature --format=fuller
gh pr checks
pnpm verify
pnpm test:postgres
pnpm test:browser
pnpm test:worker-artifact
```

Cloudflare read-only inventory:

```bash
pnpm exec wrangler hyperdrive list
pnpm exec wrangler secret list --name exporthq-app
pnpm exec wrangler deployments status --name exporthq-app
pnpm exec wrangler r2 bucket list
```

Never print or echo a production database URL, password, Clerk signing secret,
access token, R2 credential, session cookie, or signed URL. Prefer provider secret
prompts/stdin and verify only secret **names**. Redact database hosts and role
credentials where they are not necessary evidence.

## 11. Evidence retention map

Keep durable, redacted evidence under the existing release structure rather than
in personal notes:

- Current release pointer: [`docs/release/CURRENT_RELEASE.md`](docs/release/CURRENT_RELEASE.md)
- R0 external blockers: [`docs/release/R0_EXTERNAL_BLOCKERS.md`](docs/release/R0_EXTERNAL_BLOCKERS.md)
- Founder development authorization:
  [`docs/release/R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md`](docs/release/R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md)
- Risk register: [`docs/release/RISK_REGISTER.md`](docs/release/RISK_REGISTER.md)
- Production inventory: [`docs/production-inventory.md`](docs/production-inventory.md)
- Gate implementation status: [`docs/implementation-status.md`](docs/implementation-status.md)
- Production activation checklist:
  [`docs/production-activation-todo.md`](docs/production-activation-todo.md)

For every material operation, retain:

- Timestamp and named actor/reviewer.
- Source SHA, pull request, workflow run, artifact, and deployment identifier.
- Environment and scoped resource IDs without secret values.
- Expected result, observed result, and pass/fail decision.
- Redacted logs/screenshots/checksums/SBOM/provenance as appropriate.
- Incident/finding link and remediation if the result failed.
- Rollback action and proof where relevant.

## 12. Definition of “done”

Do not close an item solely because code exists or a dashboard looks populated.
An item is done only when:

- the production or explicitly named test environment is configured;
- the exact protected-main artifact is deployed;
- positive and negative paths pass;
- tenant isolation and authorization are proven where applicable;
- secrets remain out of code, logs, issues, screenshots, and artifacts;
- rollback/recovery is proven in proportion to the risk;
- the required named owner/reviewer has signed;
- evidence is retained and linked; and
- public/product claims match the proven scope.

Until then, keep the capability visibly labelled Preview, Planned, or Blocked and
fail closed. Development may continue; unsupported activation may not.
