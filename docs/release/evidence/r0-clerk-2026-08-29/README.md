# R0 Clerk configuration evidence — 2026-08-29

## Scope

The authenticated Clerk production console was inspected and configured for
application `app_3IRaL4aCvvYhwQqcWobdU1UDeJj`, instance
`ins_3IRabAnEQBciVzmSDLT4Qhzb5go`. No API key, session token, webhook signing
secret or user credential was read, copied into agent context or written to
the repository.

## Verified configuration

- `export-hq.com` reports application and email DNS records verified and SSL
  issued.
- The home URL is `https://export-hq.com/ExportPanel`; sign-in and sign-up use
  `/ExportPanel/sign-in` and `/ExportPanel/sign-up`; sign-out returns to
  `/ExportPanel/preview`.
- Email is required and verified at sign-up with an email verification code.
  Email-code sign-in is enabled.
- Password sign-up and adding a password are enabled. Minimum length is 15,
  compromised-password rejection is on, and device trust is enabled.
- Organizations are enabled with membership required. The current plan exposes
  only the existing `org:admin` and `org:member` roles.

## Registered webhook

The production endpoint is:

`https://export-hq.com/ExportPanel/api/webhooks/clerk`

It subscribes only to the reviewed events consumed by the projection boundary:

- invitation accepted, created and revoked;
- organization created, deleted and updated;
- organization membership created, deleted and updated;
- role created, deleted and updated;
- subscription created and updated;
- subscription item active and canceled.

The signing-secret screen was not inspected. The endpoint therefore remains
fail-closed until a named human secret owner copies the secret directly from
Clerk into Cloudflare as `CLERK_WEBHOOK_SECRET` and records a successful signed
delivery/replay test.

## Remaining gate items

- Upgrade/approve the Clerk plan needed for phone/SMS authentication, TOTP/SMS
  MFA, backup codes, richer organization roles and Billing.
- Require and exercise MFA for platform administrators and privileged
  operations identities, including account recovery.
- Create exact Billing plan keys `launch`, `scale` and `managed`, then prove
  entitlement transitions and failure states.
- Exercise email/password, email-code, organization invite/switch/leave and
  webhook reconciliation journeys on the real domain.
- Name the identity owner and record the privacy/security approval. This
  technical record does not imply either approval.
