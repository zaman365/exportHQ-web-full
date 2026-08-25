# ExportPanel authentication activation checklist

This checklist separates code readiness from provider activation. ExportPanel fails closed when Clerk keys are missing; it does not create a production backdoor or accept unverified identities.

## 1. Activate the Clerk production instance

- Set `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on the `exporthq-app` Worker.
- Keep `https://export-hq.com` as the authorized origin.
- Set the sign-in, sign-up, onboarding, and sign-out URLs under `/ExportPanel` as documented in `production-auth.md`.
- Enable Organizations and organization Billing plan keys `launch`, `scale`, and `managed`.

## 2. Enable primary identifiers

- Require an email address and verify it at sign-up.
- Enable email password and email verification-code sign-in.
- Enable phone sign-up and sign-in with SMS verification codes.
- Review the SMS country allowlist and include only markets Export HQ intends to support.
- Turn on breached-password, disposable-email, and bot protections.

## 3. Enable social connections

Configure Google first, then Microsoft, LinkedIn, Facebook, Apple, and GitHub. Add enterprise SAML or OIDC connections only for verified customer domains. Each production connection needs its own provider application, consent-screen details, client credentials, and the redirect URI issued by Clerk. Enable each connection for both sign-up and sign-in only after a real-account test succeeds.

## 4. Protect privileged access

- Add the managing administrator email to `EXPORTHQ_PLATFORM_ADMIN_EMAILS` as a Worker secret.
- Require MFA for the administrator Clerk account.
- Create or join a dedicated Export HQ test organization before opening protected routes.
- Never hardcode an administrator email, password, OTP, or session token in the repository.
- Remove the email from the allowlist immediately when access is no longer required.

## 5. Verify every flow

Test in a fresh browser profile:

1. email/password sign-up and email verification;
2. email OTP sign-in and resend cooldown;
3. Bangladesh mobile number formatting, SMS delivery, wrong-code handling, and resend cooldown;
4. Google, Microsoft, LinkedIn, and Facebook sign-in;
5. matching-email account linking;
6. organization creation and switching;
7. Basic subscription restrictions;
8. administrator Managed access inside an organization;
9. sign-out and return to `/ExportPanel/preview`;
10. revoked administrator access after removing the allowlist entry.

## Local testing without Clerk keys

Outside production, when `EXPORTHQ_DEMO_MODE` is enabled, the sign-in and sign-up pages offer a full administrator preview backed only by sample data and browser-local state. It creates no account, sends no OTP, touches no customer data, and cannot run in production.
