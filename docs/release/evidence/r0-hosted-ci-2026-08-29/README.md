# R0 hosted CI and repository-governance evidence — 2026-08-29

## Evidence candidate

- Pull request: [#1](https://github.com/zaman365/exportHQ-web-full/pull/1)
- Latest fully green implementation SHA before this governance record:
  `f2f81e944515034474f26a3213d7c5e54d321b68`
- Result: 8 of 8 hosted checks successful
- Milestone: `R0 Recovery`

## Successful checks

| Context                                    | Hosted evidence                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `cloudflare-build / worker-artifact`       | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631701/job/99116614557) |
| `Code scanning results / CodeQL`           | [GitHub check](https://github.com/zaman365/exportHQ-web-full/runs/99116748881)                       |
| `db-integration / postgres`                | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631731/job/99116614642) |
| `e2e / browser`                            | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631727/job/99116614588) |
| `quality / verify`                         | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631710/job/99116614810) |
| `security / codeql`                        | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631698/job/99116614610) |
| `security / dependencies-secrets-licenses` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33258631698/job/99116614773) |
| `Workers Builds: exporthq-web-full`        | [GitHub check](https://github.com/zaman365/exportHQ-web-full/runs/99116916202)                       |

The database job includes checksum validation, clean migration, separated
roles, seed, 29 application-role/RLS tests, backup, restore, restored schema and
data checks, and a restored non-owner tenant-isolation check.

## Protected-main policy

Classic branch protection rule `82442735` applies to `main` and enforces:

- pull requests without a required GitHub approval under the founder-approved
  solo-repository exception;
- all eight contexts above, with the branch required to be up to date;
- conversation resolution and linear history;
- no bypass, including administrators; no force push and no deletion.

The exception is limited to GitHub collaboration. CODEOWNERS remains advisory,
and independent security, privacy/legal and release approvals remain R0 gates.

Dependency graph, Dependabot alerts/security updates, private vulnerability
reporting, secret protection/push protection and CodeQL are enabled.

## Backlog governance

The repository has milestones `R0 Recovery`, `R1 Trusted Slice`, `R2 Private
Alpha`, `R3 Private Beta`, `R4 Public Beta` and `R5 GA`. All directive issues
`R0-00` through `R0-10` and `R1-01` through `R1-11` exist with phase,
dependency, acceptance, evidence and rollout/rollback fields.

All directive issues are assigned to `@zaman365` with an accountable role.
Their GitHub-reviewer field records the founder-approved solo-repository
exception; issue-specific external security, legal or operational reviews stay
blocking where required.

## Remaining gate items

- R0 still needs provider-secret handoffs, production recovery/attestation and
  legal/privacy/security/business approvals before phase advancement.
