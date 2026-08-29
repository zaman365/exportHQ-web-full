# Release risk register

| ID | Risk | Severity | Current control | Exit evidence / owner |
| --- | --- | --- | --- | --- |
| R0-R01 | Empty database cannot replay the legacy migration chain | P0 | Checksum-protected replacement baseline plus hosted PostgreSQL 17 clean migrate/seed/backup/restore pass | Named technical owner approval / technical lead |
| R0-R02 | Cross-tenant access is unproved on a real application role | P0 | 29 PostgreSQL tests pass in hosted CI through the non-owner `NOBYPASSRLS` role | Named security owner approval / security owner |
| R0-R03 | Webhooks can be accepted without durable projection | P0 | Endpoint fails closed and atomic delivery/projection/audit/outbox plus duplicate/conflict/dead-letter tests pass locally | Registered Clerk endpoint plus reconciliation run evidence / identity owner |
| R0-R04 | Memory stores can be mistaken for durable multi-isolate controls | P0 | Explicit adapter selection, health check and production fail-closed behavior; concurrency proof passes locally | Production database health and multi-isolate evidence / technical lead |
| R0-R05 | Ops customer-data access lacks a production request/grant boundary | P0 | Staff allowlist/MFA boundary, active case grant and access audit implemented; production renders no fixture data | Grant lifecycle and denial evidence with named operations owner / operations owner |
| R0-R06 | Evidence bytes have no private quarantine/scan pipeline | P0 | Upload/download capabilities disabled | R1 vault exit evidence / data owner |
| R0-R07 | Billing and public claims could exceed live capability | P0 | Checkout is server-gated by recorded activation evidence; central Live/Pilot/Preview/Planned status is visible | Approved billing/provider reconciliation evidence / product owner |
| R0-R08 | Cloudflare artifact differs from the standard Next build | P0 | Worker artifact CI and Cloudflare preview build pass on the exact PR SHA | Successful attested promotion from protected `main` / technical lead |
| R0-R09 | Named owners, legal review and external provider rights are absent | P0 | Capabilities stay Preview/Planned | Written approvals and named roles / founder |
| R0-R10 | Drizzle Kit's development-only loader pins esbuild 0.18.20 with a moderate dev-server advisory | P2 | No Drizzle/esbuild development server is exposed; production audit has no high/critical finding | Upgrade upstream dependency or approve documented dev-only exception / security owner |

Risks are closed only by linked evidence. A feature flag, TODO, mock success response or target date is not closure.
