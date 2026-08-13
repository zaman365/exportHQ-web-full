# Architecture

## Repository audit

The repository was greenfield on 13 August 2026: it contained only Git metadata. There were no dependencies, reusable components, migrations, application code, or repository-local instructions. Consequently there was nothing to preserve or migrate and no inherited security defect to remediate.

The main greenfield risks are tenant leakage, privileged-staff overreach, compliance claims without provenance, and document access that bypasses authorization. These are handled as architectural boundaries rather than UI conventions.

## Shape

Export HQ is a TypeScript-first modular monolith in a pnpm/Turborepo workspace. Customer and operator applications are separate Next.js deployments but share domain, authorization, validation, database, and UI packages.

```text
Next.js UI / Server Actions
          ↓
Application services
          ↓
Domain and authorization policies
          ↓
Repositories and provider ports
          ↓
PostgreSQL / R2 / Clerk / external providers
```

React Server Components are the default. Client components are limited to interaction. Server actions parse Zod contracts, resolve an authenticated principal, authorize at the service boundary, and then invoke repositories.

## Runtime boundaries

- Clerk authenticates users and organization membership. Local demo identity is forbidden in production.
- The database schema carries `organization_id` on every tenant-owned aggregate.
- Application policies require a tenant membership or an explicit, unexpired staff access grant.
- PostgreSQL row-level security is a second boundary; application authorization remains mandatory.
- R2 objects are private. Browsers receive only short-lived, entity-authorized upload/download URLs.
- Audit events are append-only through application roles; business mutation and its audit event share a transaction.

## Deployment

The customer and ops applications are independently deployable to Vercel. PostgreSQL should be provisioned in Neon's Frankfurt region and private R2 storage in an EU jurisdiction. Background work will use Trigger.dev once document processing and scheduled reminders enter the product.

## Provider abstractions

Storage, email, analytics, billing, and AI are ports. The AI port will expose `generate`, `extract`, `classify`, `embed`, and `answerWithEvidence`; domain services do not reference provider model names.
