# R0 local verification — 29 August 2026

This is local engineering evidence, not production-provider approval and not a
substitute for successful protected-branch workflow URLs.

| Gate | Result |
| --- | --- |
| Migration checksums | Pass |
| Lint | 10/10 workspaces pass |
| TypeScript | 10/10 workspaces pass |
| Unit tests | Pass; platform 75 and app 39 among the workspace suites |
| PostgreSQL 17 integration | 29/29 pass through non-owner `exporthq_app` |
| Clean migrate/seed | Pass from empty `public` and `drizzle` schemas |
| Backup/restore | Pass via read-only `BYPASSRLS` backup role into a separate database |
| Restored RLS | 0 organization-scoped tables without RLS; unscoped app role sees 0 organizations |
| Restored records | 3 organizations, 4 audit events, 3 webhook deliveries, 2 outbox events |
| Next.js production builds | Web, ExportPanel and Operations pass |
| Vinext compatibility | 94%; no unsupported issue, two documented partials |
| Cloudflare artifact | Vinext build, Wrangler 4.127.1 dry-run and local Worker smoke pass |
| Playwright | 8/8 desktop/mobile release-boundary checks pass |
| Dependency audit | No high/critical finding; one moderate development-only Drizzle/esbuild advisory is recorded as R0-R10 |
| Production license policy | Pass; no AGPL, GPL-3.0 or SSPL production dependency group |

The exact release SHA, workflow URLs, artifact checksum, SBOM, provenance and
approvals remain intentionally blank until a protected-branch run exists.
