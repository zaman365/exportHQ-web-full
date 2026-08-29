# Production resource inventory

- **Status:** Living document — Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)
- **Rule:** No production resource may exist without a row here. A row with an
  unnamed owner is treated as an open Gate 0 finding, not as an activated resource.

## Verified on 2026-08-29

These were read directly from the Cloudflare and Clerk consoles.

| Resource | Identifier | State | Owner |
| --- | --- | --- | --- |
| Cloudflare account | `48dd3aa43c937cea4bbb1840184461cc` (zaman.ase365@gmail.com) | Active | _unnamed_ |
| Public-site Worker | `exporthq-web-full` | Active; owns `export-hq.com`; GitHub build connected to the canonical repository | _unnamed_ |
| Worker | `exporthq-app` | Deployed | _unnamed_ |
| Worker route | `export-hq.com/ExportPanel*` (zone `export-hq.com`) | Active | _unnamed_ |
| Clerk application | `app_3IRaL4aCvvYhwQqcWobdU1UDeJj` ("Export HQ") | Active | _unnamed_ |
| Clerk production instance | `ins_3IRabAnEQBciVzmSDLT4Qhzb5go` for `export-hq.com` | Active, 10 sign-ups | _unnamed_ |
| Clerk Organizations | Enabled, membership required, admin/member roles | Active | _unnamed_ |
| Clerk Billing | **Not enabled** — plan keys `launch`/`scale`/`managed` do not exist | Blocked | _unnamed_ |
| Clerk webhooks | **None configured** | Blocked | _unnamed_ |
| Clerk custom roles | 2 of 2 used (`org:admin`, `org:member`) | At plan ceiling | _unnamed_ |
| Neon development project | `exporthq-development-eu` (`late-morning-49181333`) | Provisioned in AWS `eu-central-1`; migrations and separated roles pending | _unnamed_ |
| Neon staging project | `exporthq-staging-eu` (`young-wildflower-06976535`) | Provisioned in AWS `eu-central-1`; migrations and separated roles pending | _unnamed_ |
| Neon production project | `exporthq-production-eu` (`icy-mode-97605326`) | Provisioned in AWS `eu-central-1`; migrations, separated roles, Hyperdrive and recovery evidence pending | _unnamed_ |
| R2 evidence buckets | **Not provisioned**; account activation is waiting for billing completion by an account owner | Blocked | _unnamed_ |
| Sentry / PostHog | **Not provisioned** | Blocked | _unnamed_ |

## Secrets

Secrets are held only in the deployment secret store. They are never written to
source control, never printed into logs, and never handled by an automated
agent. Each is set with `wrangler secret put <NAME>` by a named human owner.

| Secret | Purpose | Required before |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Server-side Clerk verification | Any authenticated route |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client Clerk bootstrap | Any authenticated route |
| `CLERK_JWT_KEY` | Networkless session verification (optional) | — |
| `CLERK_WEBHOOK_SECRET` | Webhook signature verification | Gate 1 webhook sync |
| `DATABASE_URL` | Neon application role connection | Gate 1 persistence |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Evidence vault access | Gate 2 uploads |

## Non-secret deployment variables

| Variable | Meaning |
| --- | --- |
| `EXPORTHQ_ENVIRONMENT` | `production` / `preview` / `development` / `test`. Decides whether preview adapters may run at all. |
| `EXPORTHQ_ACTIVATION_GATES_PASSED` | `gate-id=evidence-reference` pairs. See [`activation-gates.md`](activation-gates.md). |
| `EXPORTHQ_AUTHORIZED_PARTIES` | Origins allowed to present a Clerk session. |
| `EXPORTHQ_PLATFORM_ADMIN_EMAILS` | Server-only allowlist; holders still authenticate and still need an organization. |
| `EXPORTHQ_CSP_MODE` | `enforce` or `report-only`. Defaults to report-only until Gate 5. |
| `EXPORTHQ_CSP_REPORT_URI` | Where CSP violation reports are collected. |
| `EXPORTHQ_EVIDENCE_ORIGINS` | Origins permitted to serve signed evidence. |
| `NEXT_PUBLIC_CLERK_FRONTEND_API_ORIGIN` | Clerk Frontend API origin allowed by the CSP. |

## Known blockers

1. **Clerk Billing is not enabled**, so the plan keys `launch`, `scale` and
   `managed` cannot exist yet. Every organization therefore resolves to the
   `explore` tier. Enabling Billing requires connecting a payment provider and
   accepting commercial terms — a decision for the business owner, not an
   automated change.
2. **Custom organization roles are at the plan ceiling** (2 of 2). The richer
   role templates — executive, department lead, manager, viewer, external —
   cannot be created in Clerk on the current plan. Authorization already
   normalises any unrecognised role to `member`, so this fails safe.
3. **No webhook endpoint is registered**, so Clerk changes are not projected
   anywhere. The receiving endpoint now exists and verifies signatures; see
   [`activation-gates.md`](activation-gates.md) for the registration steps.
