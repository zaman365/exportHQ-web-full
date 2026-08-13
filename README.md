# Export HQ

Export HQ is a managed export operating system: one shared workspace where exporters and Export HQ specialists prepare companies, products, documents, requirements, and actions for international growth.

## Workspace

- `apps/app` — customer command center and Phase 1 vertical slice
- `apps/ops` — internal operator view over the same domain model
- `packages/domain` — export domain types, health scoring, and application services
- `packages/authorization` — tenant and staff-access policy boundary
- `packages/db` — PostgreSQL/Drizzle schema and migrations
- `packages/ui` — shared visual system
- `packages/validation` — shared Zod contracts

## Local development

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Customer app: `http://localhost:3000`. Operator app: `http://localhost:3001`.

Demo mode is intentionally limited to local development. Production must provide Clerk and PostgreSQL configuration. See `docs/implementation-status.md`.
