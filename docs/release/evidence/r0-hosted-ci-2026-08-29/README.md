# R0 hosted CI and repository-governance evidence — 2026-08-29

## Evidence candidate

- Pull request: [#1](https://github.com/zaman365/exportHQ-web-full/pull/1)
- Exact head SHA: `073029a0350501229029225befa9eccace16ce65`
- Result: 8 of 8 hosted checks successful
- Milestone: `R0 Recovery`

## Successful checks

| Context | Hosted evidence |
| --- | --- |
| `cloudflare-build / worker-artifact` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510999/job/99108376514?pr=1) |
| `Code scanning results / CodeQL` | [GitHub check](https://github.com/zaman365/exportHQ-web-full/pull/1/checks?check_run_id=99108507240) |
| `db-integration / postgres` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510977/job/99108376564?pr=1) |
| `e2e / browser` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510990/job/99108376678?pr=1) |
| `quality / verify` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510968/job/99108376586?pr=1) |
| `security / codeql` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510992/job/99108376590?pr=1) |
| `security / dependencies-secrets-licenses` | [GitHub job](https://github.com/zaman365/exportHQ-web-full/actions/runs/33255510992/job/99108376477?pr=1) |
| `Workers Builds: exporthq-web-full` | [GitHub check](https://github.com/zaman365/exportHQ-web-full/pull/1/checks?check_run_id=99108743229) / Cloudflare build `cf7e10d4-62ef-40a8-97ef-2b40c46031f8`, version `4dc71ec7-8116-4f82-8faf-02485a052b62` |

The database job includes checksum validation, clean migration, separated
roles, seed, 29 application-role/RLS tests, backup, restore, restored schema and
data checks, and a restored non-owner tenant-isolation check.

## Protected-main policy

Classic branch protection rule `82442735` applies to `main` and enforces:

- pull requests, one approval, stale-review dismissal, CODEOWNERS review and
  approval of the most recent push;
- all eight contexts above, with the branch required to be up to date;
- conversation resolution and linear history;
- no bypass, including administrators; no force push and no deletion.

Dependency graph, Dependabot alerts/security updates, private vulnerability
reporting, secret protection/push protection and CodeQL are enabled.

## Backlog governance

The repository has milestones `R0 Recovery`, `R1 Trusted Slice`, `R2 Private
Alpha`, `R3 Private Beta`, `R4 Public Beta` and `R5 GA`. All directive issues
`R0-00` through `R0-10` and `R1-01` through `R1-11` exist with phase,
dependency, acceptance, evidence and rollout/rollback fields.

Owner and reviewer fields remain explicitly unassigned. This is an honest
blocking state, not an inferred assignment.

## Remaining gate items

- A second write-capable person must independently approve PR #1; the author
  cannot approve their own pull request.
- Named product, technical, data, identity, security and operations owners must
  be assigned to the backlog and evidence.
- R0 still needs provider-secret handoffs, production recovery/attestation and
  legal/privacy/security/business approvals before merge/phase advancement.
