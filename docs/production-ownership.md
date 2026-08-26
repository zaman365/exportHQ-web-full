# Production programme ownership

- **Status:** Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)
- **Rule:** A gate cannot be recorded as passed while its owner row is unnamed.

## Accountable owners

Names are deliberately left blank. Filling them is a business decision, and an
invented owner is worse than a visibly missing one: it makes an unaccountable
programme look accountable.

| Role | Accountable for | Owner |
| --- | --- | --- |
| Product owner | Scope, sequencing, and what may be described as live | _unnamed_ |
| Technical lead | Architecture, migrations, rollback, deployment | _unnamed_ |
| Data owner | Classification, retention, legal hold, customer export | _unnamed_ |
| Identity owner | Clerk instance, roles, MFA, session policy | _unnamed_ |
| Security owner | Threat model, review findings, incident response | _unnamed_ |
| Operations owner | Verification queue, publishing, provider coordination, support | _unnamed_ |

## Gate ownership

| Gate | Primary owner | Supporting |
| --- | --- | --- |
| Gate 0 — ownership and freeze | Product owner | All |
| Gate 1 — identity and PostgreSQL | Identity owner | Technical lead, data owner |
| Gate 2 — evidence vault | Data owner | Security owner, technical lead |
| Gate 3 — production persistence | Technical lead | Product owner |
| Gate 4 — trust and integrations | Operations owner | Product owner, security owner |
| Gate 5 — pilot and launch | Product owner | All |

## Standing decisions

- Export HQ staff never hold customer organization membership. Staff reach
  customer data only through an explicit, expiring, audited access grant.
- No component may be described as live in customer-facing copy,
  [`implementation-status.md`](implementation-status.md) or
  [`BUSINESS_LOGIC.md`](BUSINESS_LOGIC.md) before its gate records evidence.
- Automated agents do not handle secrets. Every `wrangler secret put`, every
  API key, and every provider credential is entered by a named human.
