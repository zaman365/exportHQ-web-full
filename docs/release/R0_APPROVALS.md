# R0 approval record

Assignments are recorded in [`../production-ownership.md`](../production-ownership.md).
This file is intentionally not a self-approval mechanism: the person accepting
each decision records their own name, date, scope, decision and evidence link.
An automated agent must not manufacture or sign an approval.

The founder's 2026-08-29 solo-repository decision removes only the requirement
for a second GitHub collaborator to approve a pull request. It does not approve
any row below and does not waive qualified external review.

| Decision                                                | Accountable owner     | Required independent reviewer    | Status  | Evidence                                                     |
| ------------------------------------------------------- | --------------------- | -------------------------------- | ------- | ------------------------------------------------------------ |
| Product scope, capability claims and R0 release         | Mohammed Maniruzzaman | Business/release reviewer        | Pending | PR #1 and protected-main artifact                            |
| Security baseline, threat model and residual risks      | Mohammed Maniruzzaman | Independent security reviewer    | Pending | `security.yml`, risk register and review report              |
| Data classification, retention, deletion and legal hold | Mohammed Maniruzzaman | Qualified privacy/legal reviewer | Pending | `DATA_CLASSIFICATION.md` and `RETENTION_AND_DELETION.md`     |
| Clerk identity, MFA, allowlist and recovery             | Mohammed Maniruzzaman | Identity/security reviewer       | Pending | Clerk production evidence and recovery exercise              |
| Incident response and credential compromise             | Mohammed Maniruzzaman | Security/operations reviewer     | Pending | `RUNBOOK_INCIDENT.md` and exercise evidence                  |
| Deployment, database recovery and rollback              | Mohammed Maniruzzaman | Technical/release reviewer       | Pending | restore drill, `RUNBOOK_DEPLOY.md` and `RUNBOOK_ROLLBACK.md` |

No row may move to Approved without an attributable human decision. Legal
review must be performed by a person qualified for the applicable jurisdictions;
repository ownership alone is not legal advice or legal approval.
