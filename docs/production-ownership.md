# Production programme ownership

- **Status:** Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)
- **Rule:** A gate cannot be recorded as passed while its owner row is unnamed.

## Accountable owners

On 2026-08-29 the founder instructed that the programme roles be named. The
authenticated Export HQ provider and repository accounts identify the founder
as Mohammed Maniruzzaman (`@zaman365`). During the single-founder R0 period he
temporarily occupies all six roles. On 2026-08-29 the founder also recorded a
solo-repository exception: GitHub pull requests do not require a second
collaborator's approval while the repository has only one contributor. Pull
requests and all required hosted checks remain mandatory. This exception does
not replace independent security, privacy/legal, incident-response or release
approval.

| Role             | Accountable for                                                | Owner                 |
| ---------------- | -------------------------------------------------------------- | --------------------- |
| Product owner    | Scope, sequencing, and what may be described as live           | Mohammed Maniruzzaman |
| Technical lead   | Architecture, migrations, rollback, deployment                 | Mohammed Maniruzzaman |
| Data owner       | Classification, retention, legal hold, customer export         | Mohammed Maniruzzaman |
| Identity owner   | Clerk instance, roles, MFA, session policy                     | Mohammed Maniruzzaman |
| Security owner   | Threat model, review findings, incident response               | Mohammed Maniruzzaman |
| Operations owner | Verification queue, publishing, provider coordination, support | Mohammed Maniruzzaman |

## Gate ownership

| Gate                             | Primary owner    | Supporting                     |
| -------------------------------- | ---------------- | ------------------------------ |
| Gate 0 — ownership and freeze    | Product owner    | All                            |
| Gate 1 — identity and PostgreSQL | Identity owner   | Technical lead, data owner     |
| Gate 2 — evidence vault          | Data owner       | Security owner, technical lead |
| Gate 3 — production persistence  | Technical lead   | Product owner                  |
| Gate 4 — trust and integrations  | Operations owner | Product owner, security owner  |
| Gate 5 — pilot and launch        | Product owner    | All                            |

## Standing decisions

- Export HQ staff never hold customer organization membership. Staff reach
  customer data only through an explicit, expiring, audited access grant.
- No component may be described as live in customer-facing copy,
  [`implementation-status.md`](implementation-status.md) or
  [`BUSINESS_LOGIC.md`](BUSINESS_LOGIC.md) before its gate records evidence.
- Automated agents do not handle secrets. Every `wrangler secret put`, every
  API key, and every provider credential is entered by a named human.
