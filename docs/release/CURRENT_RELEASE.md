# Current release authority

- Status: R0 engineering baseline accepted — R1-R6 development authorized;
  production activation and external Alpha prohibited
- Canonical repository: `https://github.com/zaman365/exportHQ-web-full`
- Canonical branch: `main`
- Audited baseline and current starting SHA: `2c3c1a38056e324444ace9ab6787097e66c2b6af`
- Baseline date: 26 August 2026
- Directive date: 29 August 2026
- Version policy: Semantic Versioning; immutable signed tags are required for release candidates and releases

## Deployment inventory

The authoritative resource inventory is [`../production-inventory.md`](../production-inventory.md). The expected sources are:

| Surface        | Source                                  | Deployment                               |
| -------------- | --------------------------------------- | ---------------------------------------- |
| Public website | `apps/web` on canonical `main` artifact | `https://export-hq.com`                  |
| ExportPanel    | `apps/app` on the same tested SHA       | `https://export-hq.com/ExportPanel`      |
| Operations     | `apps/ops` on the same tested SHA       | Internal; not approved for customer data |

`exportHQ-web-full1` is not a release or deployment source.

## Accountable roles

Mohammed Maniruzzaman occupies all six roles in
[`../production-ownership.md`](../production-ownership.md) for the single-founder
R0 period. A documented solo-repository exception removes the second GitHub
reviewer requirement while preserving pull requests and hosted checks. Role
assignment and that exception do not satisfy security-review, privacy/legal or
release-approval gates.

## Capability status

Generated product/runtime truth is defined by `packages/platform/src/activation.ts` and summarized in [`CAPABILITY_CATALOG.md`](CAPABILITY_CATALOG.md). No capability is Live merely because its UI or interface exists.

## Release evidence

Evidence belongs under `docs/release/evidence/<version-or-gate>/` and must include commit SHA, workflow run URLs, migration/restore results, RLS results, artifact checksum, SBOM/provenance, rollback reference, known risk decisions and approving owner.

Local repository evidence is recorded in
[`evidence/r0-local-2026-08-29/README.md`](evidence/r0-local-2026-08-29/README.md).
The current R1 local database checkpoint is recorded in
[`evidence/r1-local-2026-08-29/README.md`](evidence/r1-local-2026-08-29/README.md).
The current R2 internal Alpha engineering checkpoint is recorded in
[`evidence/r2-local-2026-08-29/README.md`](evidence/r2-local-2026-08-29/README.md).
The current R3 Private Beta engineering checkpoint is recorded in
[`evidence/r3-local-2026-08-29/README.md`](evidence/r3-local-2026-08-29/README.md).
The current R4 Public Beta engineering checkpoint is recorded in
[`evidence/r4-local-2026-08-29/README.md`](evidence/r4-local-2026-08-29/README.md).
The R5 GA-control and R6 post-GA contract checkpoint is recorded in
[`evidence/r5-r6-local-2026-08-29/README.md`](evidence/r5-r6-local-2026-08-29/README.md).
The founder authorization in
[`R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md`](R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md)
allows R1-R6 development to continue. Provider and deferred human-review items
in [`R0_EXTERNAL_BLOCKERS.md`](R0_EXTERNAL_BLOCKERS.md) still block the affected
production activation and any external Alpha claim.

The founder confirmation is the attributable business authorization for
continued development. It does not fill the independent-review fields in the
R5 manifest. The pending manifest fails closed, while R6 remains Planned.
