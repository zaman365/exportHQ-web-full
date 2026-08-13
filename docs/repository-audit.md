# Initial repository audit

Date: 13 August 2026

## Existing architecture

The repository contained only `.git` metadata. It had no source tree, package manifest, database schema, application, deployment configuration, or repository-local engineering instructions. The work therefore proceeds as a greenfield modular monolith.

## Existing dependencies and reusable components

None. There were no dependencies or reusable components to preserve. The foundation now pins Next.js 16.3.0, React 19.2.8, Tailwind CSS 4.3.3, Drizzle ORM 0.45.2, Clerk 7.7.4, Zod 4.4.3, and compatible patched tooling in `pnpm-lock.yaml`.

## Conflicts with the specification

There were no inherited implementation conflicts. The main scope conflict is inside the target vision itself: implementing all modules at once would violate its vertical-delivery constraint. This deliverable therefore implements Phase 0 structures and a focused readiness vertical slice while documenting integrations that still require provisioned external services.

## Security findings

No legacy vulnerabilities were present because no code existed. Greenfield risks identified before implementation:

- cross-tenant reads, writes, enumeration, or file access;
- Export HQ staff represented as hidden customer members;
- authorization enforced only by navigation/UI;
- public or unlinked document blobs;
- compliance guidance without provenance or review state;
- privileged changes without audit records;
- demo identity accidentally enabled in production.

The architecture addresses these with organization IDs on tenant aggregates, server policy checks, explicit staff grants, PostgreSQL RLS policies, private object-key metadata, sourced requirements, append-only audit design, and a demo identity adapter that is disabled whenever `NODE_ENV=production`.

## Migration requirements

There is no legacy data migration. Production activation requires:

1. generate the structural Drizzle migration from `packages/db/src/schema.ts`;
2. review it and apply it before `packages/db/migrations/0000_phase_zero.sql` (the RLS security envelope);
3. seed market/reference data and the first reviewed requirement sources;
4. synchronize Clerk users, organizations, memberships, roles, and invitations;
5. provision private EU R2 buckets and migrate only scanned file metadata/object keys;
6. use a non-owner Postgres application role and verify RLS with integration tests.
