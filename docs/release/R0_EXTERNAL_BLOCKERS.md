# R0 external blockers

Repository-owned R0 controls are implemented and locally verified. The founder
authorized R1-R6 development on 2026-08-29 and accepted the risk of deferring
the independent decisions below. These items block affected production
activation, real customer data and external Alpha; they do not block continued
implementation in test, preview or fail-closed modes. See
[`R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md`](R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md).

## Founder and governance

- Mohammed Maniruzzaman is named as product, technical, data, identity,
  security and operations owner for the single-founder R0 period. The founder's
  2026-08-29 solo-repository decision waives only a second GitHub collaborator
  and pull-request approval. A separate founder decision authorizes continued
  development while external approval separation remains a production gate.
- Obtain approval for classification, retention/deletion, telemetry and
  incident policies before the affected production activation.
- Create the directive's issues and milestones and assign named accountable
  owners and required external reviewers. Protected `main` retains the PR,
  required-status, current-branch, conversation-resolution, linear-history and
  no-bypass controls. GitHub approval, CODEOWNERS approval and latest-push
  approval are disabled under the documented solo-repository exception. All
  eight successful hosted contexts remain required. Six phase milestones and
  all 22 directive R0/R1 issues exist; every issue is assigned to `@zaman365`
  with its accountable role. See
  [`evidence/r0-hosted-ci-2026-08-29/`](evidence/r0-hosted-ci-2026-08-29/).
- Pull request [#1](https://github.com/zaman365/exportHQ-web-full/pull/1) is the
  hosted R0 evidence candidate. It may merge without a second GitHub reviewer
  only after every protected status check succeeds.

## Provider configuration

- The three Frankfurt Neon projects, checked-in schema/RLS chain and locked
  least-privilege role shells are provisioned and verified. A named human must
  finalize LOGIN credentials through the protected bootstrap, then connect the
  application role to Cloudflare Hyperdrive without exposing the connection
  string. A non-expiring production snapshot and isolated PITR drill branch now
  prove restored schema and fail-closed application-role access. Scheduled
  backups and an independent encrypted export remain open. See
  [`evidence/r0-provider-recovery-2026-08-29/`](evidence/r0-provider-recovery-2026-08-29/).
- The Clerk domain, ExportPanel paths, invite-only access, email/password and
  email-code methods, and reviewed webhook endpoint are configured. A named human must transfer the
  webhook signing secret directly into Cloudflare and prove a live delivery.
  Phone/SMS, MFA, richer roles and Billing remain plan/payment-gated; staff
  allowlist and recovery-policy evidence also remain open. See
  [`evidence/r0-clerk-2026-08-29/`](evidence/r0-clerk-2026-08-29/).
- Provision private EU R2 quarantine/clean storage and scanning for R1.
- Configure Cloudflare production secrets, custom route, uptime checks and
  release annotations; run the attested artifact workflow from protected main.

## Deferred human review and release evidence

- Complete security, privacy/legal, backup/PITR and incident/rollback reviews.
  They are deferred for development, not waived or represented as independently
  approved.
- The PR CI gates are green and their URLs/exact SHA are indexed. An attested
  artifact promotion from protected `main`, artifact checksum/SBOM/provenance,
  production recovery output and named approvals remain required.
- R0 production activation remains open and external Alpha remains prohibited
  until those records exist. R1-R6 engineering may continue behind the ordered
  fail-closed gates. No local test result is presented as third-party
  configuration or approval evidence.
