# Preview adapter inventory

- **Status:** Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)
- **Rule:** Every adapter below is a preview adapter. `previewAdaptersPermitted()`
  returns `false` whenever the runtime is production, so none of them may run
  against real exporter data. Gate 3 replaces each with a tenant-scoped
  PostgreSQL repository; the adapter is removed only after its replacement and
  the rollback window have both passed.

## Browser-local persistence

| Location | State held | Replaced by |
| --- | --- | --- |
| `apps/app/app/studio/studio-client.tsx` | Lane economics scenario, milestones, buyer cohorts, cluster interest | Export Lane repositories |
| `apps/app/app/readiness/readiness-client.tsx` | Readiness assessment draft, notes, evidence references | `readiness_assessments`, `readiness_responses` |
| `apps/app/app/_components/collaboration-data.ts` | Team profiles, departments, role changes, conversations | `organization_teams`, `organization_conversations`, `organization_messages` |
| `apps/app/app/_components/workflow-data.ts` | Workflow records | Task and blueprint repositories |
| `apps/app/app/settings/settings-client.tsx` | Workspace settings draft | `company_profiles` |
| `apps/app/app/waiting/waiting-client.tsx` | Snoozed and resolved waiting items | Task repository |
| `apps/app/app/blueprints/blueprints-client.tsx` | Favourites, custom blueprints, run history | Blueprint repositories |
| `apps/app/app/learn/learning-center-client.tsx` | Completed lessons | Learning progress repository |
| `apps/app/app/_components/account-controls.tsx` | Demo business switching | Removed at Gate 3 |

## Clerk organization metadata used as storage

Clerk metadata is an identity attribute store, not a tenant database: it has no
transactions, no audit trail, no row-level security and no restore path. Every
use below is replaced by PostgreSQL at Gate 1.

| Location | State held |
| --- | --- |
| `packages/auth/src/index.ts` | `onboardingComplete`, `businessVerification` on `publicMetadata` |
| `apps/app/app/onboarding/actions.ts` | Onboarding completion, company and first-product state |
| `apps/app/app/settings/actions.ts` | Profile settings, company, first product, market strategy |
| `apps/app/app/readiness/actions.ts` | Readiness profile and responses |
| `apps/app/app/verify-business/actions.ts` | Verification status and the submitted request |

## Fixture-backed projections

These render a curated, synthetic domain projection. They are labelled in the
interface and carry no organization data.

`packages/domain/src/index.ts` (`demoSnapshot`) and the `*-data.ts` modules
under `apps/app/app/_components/` — attention, inbox, email, my-work,
collaboration, workflow, learning catalog — plus `apps/app/app/buyers/buyers-data.ts`
and `apps/app/app/requirements/requirements-data.ts`.

## Labelling in production

`workspaceProjectionKind()` decides what is actually behind the workspace on
screen. It reports `illustrative` whenever `customer-postgres-persistence` is
not activated *in production mode* — synthetic mode counts as illustrative,
because the capability working is not the same as the data being real. The
workspace shell renders a non-dismissible notice for that case: a signed-in
person looking at fabricated readiness scores, documents and deadlines must not
be able to hide the only thing telling them so.

Found on 2026-08-26 by signing in to the production deployment: a platform
administrator resolves to the Managed tier and was shown the fixture dashboard —
Export Health 82, 34 documents, third-party owners — with no indication it was
not their business. Customers below that tier land on the Basic home instead.
The notice closes that gap; Gate 3 removes the fixtures.

## Demo identity

`EXPORTHQ_DEMO_MODE` selects a synthetic owner principal. `isDemoModeEnabled()`
returns `false` unconditionally in production, so the variable cannot enable
demo identity on a production deployment however it is set. This is asserted by
test, not only by configuration.
