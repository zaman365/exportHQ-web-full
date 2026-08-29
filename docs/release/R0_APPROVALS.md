# R0 approval record

Assignments are recorded in [`../production-ownership.md`](../production-ownership.md).
This file separates accountable-owner decisions from reviews that require an
independent or qualified person. The person accepting each decision records
their own name, date, scope, decision and evidence link. An automated agent
must not manufacture or sign an approval.

The founder's 2026-08-29 solo-repository decision removes only the requirement
for a second GitHub collaborator to approve a pull request. It does not approve
any row below and does not waive qualified external review.

| Decision                                                   | Accountable owner     | Required decision maker          | Status                                          | Evidence                                                     |
| ---------------------------------------------------------- | --------------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Product scope and continued R1-R6 development              | Mohammed Maniruzzaman | Founder/product/business owner   | Approved for development — 2026-08-29           | `R0_FOUNDER_DEVELOPMENT_AUTHORIZATION.md` and PR #1          |
| Security baseline, threat model and residual risks         | Mohammed Maniruzzaman | Independent security reviewer    | Deferred; blocks affected production activation | `security.yml`, risk register and review report              |
| Data classification, retention, deletion and legal hold    | Mohammed Maniruzzaman | Qualified privacy/legal reviewer | Deferred; blocks affected production activation | `DATA_CLASSIFICATION.md` and `RETENTION_AND_DELETION.md`     |
| Privileged identity, MFA, allowlist and recovery           | Mohammed Maniruzzaman | Identity/security reviewer       | Deferred; privileged access stays disabled      | Clerk/Access production evidence and recovery exercise       |
| Incident response and credential compromise                | Mohammed Maniruzzaman | Security/operations reviewer     | Deferred; blocks pilot/launch                   | `RUNBOOK_INCIDENT.md` and exercise evidence                  |
| Deployment, database recovery, reconciliation and rollback | Mohammed Maniruzzaman | Technical/release reviewer       | Deferred; blocks affected production activation | restore drill, `RUNBOOK_DEPLOY.md` and `RUNBOOK_ROLLBACK.md` |

The founder authorization allows development to continue; it does not mark the
deferred rows Approved. Legal review must be performed by a person qualified
for the applicable jurisdictions; repository ownership alone is not legal
advice or legal approval.
