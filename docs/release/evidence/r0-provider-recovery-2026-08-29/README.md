# R0 provider and recovery evidence — 2026-08-29

## Scope and provenance

- Observer/operator: automated implementation session authorized by the founder.
- Accountable owner: Mohammed Maniruzzaman.
- Data used: existing synthetic R0 database records only.
- Secrets: no password, connection string, webhook signing secret or API key was
  revealed, copied, stored or entered by the automated session.

## Clerk production access

The production instance `ins_3IRabAnEQBciVzmSDLT4Qhzb5go` was changed from
Open access to **Invite-only**. The instance contained one existing verified
user. Authenticator MFA, backup codes and enforced MFA remain unavailable on
the current Hobby plan, and the existing user has no two-step credential.

This change closes open public sign-up for R0. It does not prove privileged-user
MFA, recovery or the server-only administrator allowlist.

## Production uptime baseline

The repository now contains a 15-minute scheduled production monitor and a
manual `pnpm uptime:production` command. A live run at `2026-08-29 14:47:39 UTC`
returned HTTP 200 for the public site, ExportPanel preview and plans page. The
unsigned Clerk webhook probe returned HTTP 503, so the monitor correctly remains
red until `CLERK_WEBHOOK_SECRET` is transferred and invalid signatures are
rejected with HTTP 400 or 401.

## Neon recovery controls

Project `exporthq-production-eu` (`icy-mode-97605326`) is PostgreSQL 17 in AWS
`eu-central-1`. The console reported a six-hour history window.

Actions completed:

1. Created a manual production snapshot at `2026-08-29 14:34:54 UTC`. Neon
   reports that the snapshot does not expire.
2. Created isolated point-in-time branch `r0-pitr-drill-2026-08-29`
   (`br-solitary-shape-b2i7vy5f`) from production history. It is configured to
   auto-delete after one day, on 2026-08-30.
3. Verified restored database-role attributes: all four Export HQ roles remained
   `NOLOGIN`; only `exporthq_backup` retained `BYPASSRLS`; none was superuser,
   `CREATEDB` or `CREATEROLE`.
4. Verified the restored catalog:

   | Check                                           | Result |
   | ----------------------------------------------- | -----: |
   | Public base tables                              |     39 |
   | RLS-enabled public tables                       |     29 |
   | FORCE RLS public tables                         |     27 |
   | Public tables not owned by `exporthq_migration` |      0 |
   | Applied checked-in migrations                   |      2 |

5. Inside a transaction on the isolated branch, temporarily granted the console
   owner permission to `SET LOCAL ROLE exporthq_app`, queried without an
   organization scope, and rolled the transaction back. `current_user` was
   `exporthq_app`, tenant scope was empty, and visible organizations were `0`.
   The temporary membership grant was rolled back with the test transaction.

The console's direct historic-data preview first returned provider error ID
`d7d309f8f3ef4ec7af057d0945e68987` with `Error connecting to database: signal
is aborted without reason`. Creating the isolated point-in-time branch then
succeeded and supplied the recovery evidence above.

## Remaining recovery blockers

- A named human must enter the four protected Neon role passwords via
  `packages/db/roles/bootstrap.sql`; the locked roles intentionally remain
  `NOLOGIN` until then.
- Scheduled snapshots require a Neon plan upgrade. The current six-hour PITR
  window does not by itself prove the approved production RPO/RTO.
- The independent encrypted `pg_dump` export and separate restore remain blocked
  until the named human finalizes the backup/migration credentials.
- Recovery evidence still needs attributable technical, data and security
  approval in [`../../R0_APPROVALS.md`](../../R0_APPROVALS.md).
