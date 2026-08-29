# R0 solo-repository decision

- Decision date: 2026-08-29
- Decision authority: Mohammed Maniruzzaman, founder and product owner
- Scope: GitHub pull-request approval only
- Status: Accepted for the single-contributor R0 period

## Decision

Export HQ will not add a second GitHub collaborator solely to approve pull
requests during the single-contributor R0 period. A pull request may merge with
zero GitHub approving reviews after every protected required check succeeds.

The following repository controls remain mandatory:

- all changes reach `main` through a pull request;
- all eight protected hosted status contexts succeed on a current branch;
- conversations are resolved and linear history is enforced;
- administrators cannot bypass protection;
- force pushes and branch deletion remain prohibited;
- releases use immutable signed tags and retain checksum, SBOM and provenance.

CODEOWNERS remains an advisory ownership map. This exception does not waive or
satisfy security, privacy/legal, incident-response, rollback, business or
release approvals. Those decisions require attributable human evidence in
[`R0_APPROVALS.md`](R0_APPROVALS.md).

Revisit this exception before admitting another repository contributor or real
customer data, whichever occurs first.
