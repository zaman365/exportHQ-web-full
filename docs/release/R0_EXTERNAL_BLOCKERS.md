# R0 external blockers

Repository-owned R0 controls are implemented and locally verified. R1 must not
start until the remaining R0 evidence is created in the systems that own it.

## Founder and governance

- Name the product, technical, data, identity, security and operations owners.
- Approve classification, retention/deletion, telemetry and incident policies.
- Create the directive's issues and milestones and assign named accountable
  owners/reviewers. The authenticated GitHub UI has protected `main` with PR,
  approval, CODEOWNERS, latest-push approval, conversation-resolution,
  linear-history and no-bypass controls. Required hosted check registration is
  still pending the corrected PR run.
- Pull request [#1](https://github.com/zaman365/exportHQ-web-full/pull/1) is the
  hosted R0 evidence candidate. It cannot merge until another write-capable
  reviewer approves it, as intended by the protection rule.

## Provider configuration

- The three Frankfurt Neon projects, checked-in schema/RLS chain and locked
  least-privilege role shells are provisioned and verified. A named human must
  finalize LOGIN credentials through the protected bootstrap, then connect the
  application role to Cloudflare Hyperdrive without exposing the connection
  string. See [`evidence/r0-neon-2026-08-29/`](evidence/r0-neon-2026-08-29/).
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
