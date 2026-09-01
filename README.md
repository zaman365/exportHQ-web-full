# Export HQ

Export HQ is a managed export operating system: one shared workspace where exporters and Export HQ specialists prepare companies, products, documents, requirements, and actions for international growth.

The canonical system-wide business logic is maintained in [`docs/BUSINESS_LOGIC.md`](docs/BUSINESS_LOGIC.md). Read it before changing journeys, access rules, onboarding, monetization, or product behavior.

Resume production activation and phased delivery from
[`Next ToDo's.md`](Next%20ToDo%27s.md). It records the reconciled live state,
blockers, free-tier operating plan, execution order, and required R0–R6 evidence.

## Canonical repository and deployment source

- Canonical repository: `https://github.com/zaman365/exportHQ-web-full`
- Protected release branch: `main`
- Customer deployment: `https://export-hq.com/ExportPanel`
- Public website: `https://export-hq.com`
- Release authority and current baseline: [`docs/release/CURRENT_RELEASE.md`](docs/release/CURRENT_RELEASE.md)

The previously referenced `exportHQ-web-full1` name is not a deployment source and must not be used in CI, release evidence, or operational runbooks.

## Workspace

- `apps/web` — public cross-industry Export HQ website
- `apps/app` — customer command center and Phase 1 vertical slice
- `apps/ops` — internal operator view over the same domain model
- `packages/domain` — export domain types, health scoring, and application services
- `packages/authorization` — tenant and staff-access policy boundary
- `packages/db` — PostgreSQL/Drizzle schema and migrations
- `packages/ui` — shared visual system: brand tokens, base styles and components
- `packages/validation` — shared Zod contracts

## Brand and design system

The brand guidelines live in [`docs/brand/`](docs/brand/README.md), with the
ExportPanel product and tenant white-label rules in
[`docs/brand/exportpanel/`](docs/brand/exportpanel/README.md). Every visual
decision resolves to a token in `packages/ui/src/styles/tokens.css`.

## Local development

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Public website: `http://localhost:3000`. Customer app: `http://localhost:3001`. Operator app: `http://localhost:3002`.

Demo mode is intentionally limited to local development. Production must provide Clerk and PostgreSQL configuration. See `docs/implementation-status.md`.

Production activation work is tracked in
[`docs/production-activation-todo.md`](docs/production-activation-todo.md).

Release gates, rollback ownership, capability truth, and evidence locations live under [`docs/release/`](docs/release/). A date or deployed interface never overrides those gates.
