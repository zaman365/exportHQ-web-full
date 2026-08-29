# R0 external blockers

Repository-owned R0 controls are implemented and locally verified. R1 must not
start until the remaining R0 evidence is created in the systems that own it.

## Founder and governance

- Name the product, technical, data, identity, security and operations owners.
- Approve classification, retention/deletion, telemetry and incident policies.
- Authenticate GitHub CLI or use the GitHub UI to create the directive's issues
  and milestones, protect `main`, require CODEOWNERS review and make every new
  quality/database/Worker/E2E/security check required.
- Current local blocker: `gh auth status` reports an invalid credential, so this
  repository session cannot truthfully create or link those GitHub records.

## Provider configuration

- Provision Frankfurt/EU Neon environments and separated credentials; apply
  the checked-in migration and role bootstrap; select a real Cloudflare
  Hyperdrive binding or approve/document a Neon pooled-connection exception.
- Register the Clerk webhook endpoint/secret, production callbacks, methods,
  role mapping, staff allowlist and MFA; approve billing before recording the
  self-service billing activation evidence.
- Provision private EU R2 quarantine/clean storage and scanning for R1.
- Configure Cloudflare production secrets, custom route, uptime checks and
  release annotations; run the attested artifact workflow from protected main.

## Human review and release evidence

- Complete security, privacy/legal, backup/PITR and incident/rollback reviews.
- Run the CI gates and store their URLs, exact SHA, artifact checksum, SBOM,
  provenance, restore/RLS output and named approvals under the release evidence
  index.
- R0 remains open and external Alpha remains prohibited until those records
  exist. No local test result is presented as third-party configuration or
  approval evidence.
