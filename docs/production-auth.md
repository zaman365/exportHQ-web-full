# ExportPanel production authentication

ExportPanel uses Clerk for customer identity and organization membership. Export HQ's PostgreSQL ledger owns subscription plans and entitlements; Clerk Billing is not required. Route authorization is enforced on the server; hiding navigation is only a secondary usability layer.

## Access model

| State | Access |
| --- | --- |
| Signed out | Public ExportPanel preview, plans, sign-in, and sign-up |
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
3. Keep Clerk Billing disabled unless a later reviewed decision adopts it. Plan keys and entitlement transitions come from Export HQ's internal ledger and the reviewed BDT payment adapter.
4. Configure the Clerk dashboard URLs for:
   - sign-in: `https://export-hq.com/ExportPanel/sign-in`
   - sign-up: `https://export-hq.com/ExportPanel/sign-up`
   - after sign-out: `https://export-hq.com/ExportPanel/preview`
5. Allow `https://export-hq.com` as an authorized party/origin. Clerk authorized parties are origins, while the callback URLs above include the application path.

## Sign-up and sign-in methods

ExportPanel uses Clerk's prebuilt `SignIn` and `SignUp` components. They automatically show only the methods enabled for the active Clerk instance, so disabled providers are never advertised as working authentication buttons.

Enable these production methods in the Clerk Dashboard:

| Method | Clerk configuration | Production dependency |
| --- | --- | --- |
| Email + password | User & authentication → Email and Password | Require and verify the email address |
| Email OTP | User & authentication → Email verification code | Configure production email delivery and templates |
| Mobile number + SMS OTP | User & authentication → Phone | Paid production phone authentication and the intended country/SMS allowlist |
| Google / Gmail | SSO connections → Google → For all users | A production Google OAuth client, client ID, secret, and Clerk redirect URI |
| Microsoft | SSO connections → Microsoft → For all users | Production Microsoft OAuth credentials |
| LinkedIn | SSO connections → LinkedIn → For all users | Production LinkedIn OAuth credentials |
| Facebook | SSO connections → Facebook → For all users | Production Meta OAuth credentials |
| Apple | SSO connections → Apple → For all users | Production Apple Services ID and signing credentials |
| GitHub | SSO connections → GitHub → For all users | Production GitHub OAuth application credentials |
| Enterprise SSO | SSO connections → For specific domains and organizations | Customer domain verification and SAML or OIDC configuration |
| Passkeys and MFA | User & authentication → Passkeys; Multi-factor | An initial sign-up method plus an MFA policy, TOTP, SMS, and backup codes |

Keep account linking enabled for verified matching email addresses, block disposable addresses, and enable MFA with authenticator apps, SMS, and backup codes. The prebuilt components will also expose any other Clerk-supported social provider enabled later without another application release. Social providers require their own production credentials; development shared credentials must not be promoted to production.

## Export HQ platform administrator

Administrator access is an identity-verified override, never a hidden password. Add the administrator's verified Clerk email to the server-only `EXPORTHQ_PLATFORM_ADMIN_EMAILS` allowlist. The user must still complete Clerk authentication and create or join an organization. Inside that organization, ExportPanel then grants Managed features, verified-business test access, and owner-level permissions.

Store the allowlist as a Worker secret rather than committing a personal email address:

```sh
cd apps/app
pnpm exec wrangler secret put EXPORTHQ_PLATFORM_ADMIN_EMAILS --name exporthq-app
```

Multiple administrators are comma-separated. Removing an email from the secret revokes the override on the next request.

## Cloudflare configuration

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the build environment. Add private values with Wrangler; never commit them:

```sh
cd apps/app
pnpm exec wrangler secret put CLERK_SECRET_KEY
pnpm exec wrangler secret put NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
pnpm exec wrangler secret put CLERK_JWT_KEY
```

`CLERK_JWT_KEY` is optional. The committed Worker configuration keeps production demo mode disabled, restricts authorized parties to the Export HQ origin, and routes `/ExportPanel*` to the application Worker.

## Release verification

Before routing customers to the deployment, verify each state with a separate test account:

1. signed-out preview cannot expose organization data;
2. homepage sign-in opens ExportPanel authentication;
3. a new account creates an organization and completes onboarding;
4. a Basic organization cannot open Launch or Scale routes by direct URL;
5. internally entitled Launch, Scale, and Managed organizations receive only their entitled features;
6. the Home navigation opens the dashboard;
7. organization switching re-evaluates entitlements;
8. account controls provide a working sign-out and return to `/ExportPanel/preview`.

Do not treat Clerk activation as data-layer readiness. Real customer records still require the PostgreSQL/RLS and private-object-storage activation documented in `implementation-status.md`.
