# R0 Neon provisioning evidence — 2026-08-29

## Scope

The authenticated Neon console was used to provision and verify three isolated
PostgreSQL 17 projects in AWS Europe Central 1 (Frankfurt):

| Environment | Project | Neon project ID |
| --- | --- | --- |
| Development | `exporthq-development-eu` | `late-morning-49181333` |
| Staging | `exporthq-staging-eu` | `young-wildflower-06976535` |
| Production | `exporthq-production-eu` | `icy-mode-97605326` |

No database password, connection string or provider token was copied into the
repository, console query history, build logs or agent context.

## Applied chain

Each empty `neondb` database received the immutable checked-in migrations as
the locked `exporthq_migration` object owner:

| Migration | SHA-256 | Drizzle timestamp |
| --- | --- | --- |
| `0000_reproducible_baseline.sql` | `9c751bb100a4f20bab22a446438fc22a5e5ef724dad235c30200331eed784562` | `1788003129257` |
| `0001_security_envelope.sql` | `a0f9c6cf7cb82029914a075944e289ded92fca0f52b5a2c746e41253a860ce35` | `1788003129258` |

The transaction also created the normal Drizzle migration ledger. The
secretless [`provision-locked.sql`](../../../../packages/db/roles/provision-locked.sql)
then provisioned the application, support and backup role shells and their
least-privilege grants. All role shells remain `NOLOGIN` until a named human
secret owner finalizes them through `bootstrap.sql`.

## Verification results

The same post-migration verification query returned the following in
development, staging and production:

| Check | Result |
| --- | --- |
| Public tables | `39` |
| Tables not owned by `exporthq_migration` | `0` |
| RLS-enabled public tables | `29` |
| Drizzle migration ledger rows | `2` |
| Migration role can log in | `false` |
| Migration role has `BYPASSRLS` | `false` |

Production role verification additionally returned:

| Role | LOGIN | BYPASSRLS | Superuser | CREATEDB | CREATEROLE |
| --- | --- | --- | --- | --- | --- |
| `exporthq_app` | false | false | false | false | false |
| `exporthq_backup` | false | true | false | false | false |
| `exporthq_migration` | false | false | false | false | false |
| `exporthq_support` | false | false | false | false | false |

`exporthq_backup` is the only `BYPASSRLS` role because PostgreSQL `pg_dump`
sets `row_security=off`; it has only read grants and remains locked.

## Remaining gate items

- A named human secret owner must create strong provider-managed credentials
  and apply `bootstrap.sql` through a protected `psql` session.
- The application credential must be connected to Cloudflare Hyperdrive
  without exposing its connection string.
- Staging migration/restore, production PITR and independent encrypted-export
  evidence must be captured.
- Accountable owner names and the vendor/security approval are still required;
  this technical evidence does not imply those approvals.
