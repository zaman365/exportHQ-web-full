# TREVV production authentication

TREVV uses Clerk for customer identity, organization membership, and subscription-plan claims. Route authorization is enforced on the server; hiding navigation is only a secondary usability layer.

## Access model

| State | Access |
| --- | --- |
| Signed out | Public TREVV preview, plans, sign-in, and sign-up |
| Signed in, no organization | Organization creation and public preview |
| Organization, onboarding incomplete | Guided company, product, and market onboarding |
| Basic (`explore`) | Home and Learning Center |
| Launch | Core work, inbox, waiting, decisions, ideas, products, documents, readiness, and requirements |
| Scale | Launch plus Attention Center, blueprints, team, markets, opportunities, buyers, integrations, audit, and export |
| Managed | Scale plus managed-service capabilities |

Organization owners and admins receive the permission ceiling of their plan. Members receive the member-safe subset. The centralized policy lives in `packages/authorization` and is reused by navigation and server route guards.

## Clerk setup

1. Create or promote a Clerk production application for `export-hq.com`.
2. Enable Organizations. Customers must operate inside an organization boundary.
3. Enable Clerk Billing for organizations and create plans with exact keys `launch`, `scale`, and `managed`.
4. Configure the Clerk dashboard URLs for:
   - sign-in: `https://trevv.export-hq.com/sign-in`
   - sign-up: `https://trevv.export-hq.com/sign-up`
   - after sign-out: `https://trevv.export-hq.com/preview`
5. Allow `https://trevv.export-hq.com` as an authorized party/origin.

## Cloudflare configuration

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the build environment. Add private values with Wrangler; never commit them:

```sh
cd apps/app
pnpm exec wrangler secret put CLERK_SECRET_KEY
pnpm exec wrangler secret put CLERK_JWT_KEY
```

`CLERK_JWT_KEY` is optional. The committed Worker configuration keeps production demo mode disabled and restricts authorized parties to the TREVV custom domain.

## Release verification

Before routing customers to the deployment, verify each state with a separate test account:

1. signed-out preview cannot expose organization data;
2. homepage sign-in opens TREVV authentication;
3. a new account creates an organization and completes onboarding;
4. a Basic organization cannot open Launch or Scale routes by direct URL;
5. Launch, Scale, and Managed organizations receive only their entitled features;
6. the Home navigation opens the dashboard;
7. organization switching re-evaluates entitlements;
8. account controls provide a working sign-out and return to `/preview`.

Do not treat Clerk activation as data-layer readiness. Real customer records still require the PostgreSQL/RLS and private-object-storage activation documented in `implementation-status.md`.
