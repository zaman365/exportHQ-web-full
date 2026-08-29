# Activation gates in the deployment

- **Status:** Implemented — `packages/platform/src/activation.ts`
- **Backlog:** [`production-activation-todo.md`](production-activation-todo.md)

Export HQ does not become production-active because the interface is deployed.
Capabilities with real data consequences fail closed until the gate that
protects them records evidence.

## How a gate is recorded

Set `EXPORTHQ_ACTIVATION_GATES_PASSED` to a comma-separated list of
`gate-id=evidence-reference` pairs:

```
EXPORTHQ_ACTIVATION_GATES_PASSED=gate-0-ownership-and-freeze=REC-2026-08-26,gate-1-identity-and-postgres=REC-2026-09-14
```

Three properties make this safe to operate:

1. **Evidence is mandatory.** A gate id without `=reference` is ignored, so a
   gate cannot be switched on without pointing at the record that proves it.
2. **Gates are monotonic.** Recording gate 2 without gate 1 has no effect —
   `effective` stops at the first missing gate. A partially activated
   deployment cannot unlock a capability whose prerequisites are absent.
3. **Unknown environments fail closed.** A build with `NODE_ENV=production` and
   no `EXPORTHQ_ENVIRONMENT` is treated as production.

## Gate identifiers

| Gate id | Title |
| --- | --- |
| `gate-0-ownership-and-freeze` | Programme ownership and safety freeze |
| `gate-1-identity-and-postgres` | Production identity and authoritative PostgreSQL |
| `gate-2-evidence-vault` | Private EU R2 evidence vault |
| `gate-3-production-persistence` | Production persistence replacing preview adapters |
| `gate-4-trust-and-integrations` | Operational trust and reviewed integrations |
| `gate-5-pilot-and-launch` | Security hardening and controlled pilot |
| `gate-6-general-availability` | Independently assured General Availability |

## Capabilities and their gates

| Capability | Requires | Refuses when unactivated |
| --- | --- | --- |
| `customer-postgres-persistence` | Gate 1 | Tenant writes |
| `document-upload` | Gate 2 | Upload intents and staging |
| `document-download` | Gate 2 | Signed download issuance |
| `document-external-share` | Gate 2 | External share creation |
| `mailbox-connection` | Gate 4 | Accepting mailbox credentials |
| `mailbox-send` | Gate 4 | Sending on a customer's behalf |
| `provider-referral` | Gate 4 | Sharing customer data with a provider |
| `live-external-adapter` | Gate 4 | Calling a government, bank or carrier adapter |
| `real-exporter-onboarding` | Gate 3 | Onboarding a real exporter's data |
| `broad-launch` | Gate 6 plus an immutable `EXPORTHQ_GA_RELEASE_EVIDENCE` reference | Removing the controlled-pilot constraint |

Outside production every capability resolves to `synthetic` mode: journeys and
automated tests run, and callers are told the data is not real.

Gate 6 is additionally protected by the executable contract in
[`release/R5_GENERAL_AVAILABILITY.md`](release/R5_GENERAL_AVAILABILITY.md). A
gate entry by itself cannot make `broad-launch` effective without a
`ga-release://<tag>/<sha>/<manifest-hash>` reference.

## Checking a deployment

`GET /ExportPanel/api/activation` returns the live gate and capability state. It
is restricted to `EXPORTHQ_PLATFORM_ADMIN_EMAILS` holders and returns 404 to
everyone else. It names gates and capabilities only — never secrets, origins or
customer data — so it is safe to use in a deployment smoke test.

## Registering the Clerk webhook (Gate 1)

The receiving endpoint is `POST https://export-hq.com/ExportPanel/api/webhooks/clerk`.
It verifies the Svix signature, refuses deliveries outside a five-minute
timestamp tolerance, deduplicates by delivery id, and ignores event types the
code does not handle. It writes nothing while `customer-postgres-persistence`
is unactivated, and says so in its response rather than implying a sync.

1. In the Clerk dashboard, add an endpoint at the URL above.
2. Subscribe to the user, organization, organizationMembership,
   organizationInvitation, role and subscription events.
3. Copy the signing secret and set it as a Worker secret — by hand, by a named
   owner:

```bash
pnpm --filter @exporthq/app exec wrangler secret put CLERK_WEBHOOK_SECRET
```

Until that secret exists the endpoint answers `503` and accepts nothing, which
is the correct behaviour for an unconfigured deployment.

## Plan entitlements without a billing provider

Plan tiers are held in `organization_entitlements` in Export HQ's own database,
not in the identity provider's billing product. That means:

- a pilot exporter can be granted Scale without a payment processor existing;
- a plan change is an audited row committed in the same transaction as the
  decision that caused it;
- authorization does not fail open or closed because a third party is
  unreachable;
- the highest active tier wins, so an expiring trial cannot silently downgrade
  a paying customer.

An organization may read the tier it holds and may never grant itself one:
there is no INSERT policy for a customer actor, and the write policy requires
`app.actor_type` to be `staff` or `system`.

Until `customer-postgres-persistence` is activated, the session keeps whatever
tier the identity provider reports — today, Basic for every organization.

## Running the isolation tests

They are skipped without a database, deliberately: a mocked row-level security
test proves nothing, because the behaviour under test lives in PostgreSQL.

```bash
EXPORTHQ_TEST_DATABASE_URL=postgres://... pnpm --filter @exporthq/db test
```

Point it at a throwaway database with `0000`–`0007` applied and connect as the
non-owner `exporthq_app` role. Connecting as the owner would pass every test
while proving nothing, because a table owner bypasses row-level security.
