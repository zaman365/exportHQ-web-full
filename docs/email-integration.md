# ExportPanel universal email integration

Status: architecture and product contract; live provider activation pending

Last reviewed: 26 August 2026

## Product behavior

Inbox opens on **Email Inbox**. **Actionable Inbox** remains a selectable tab and retains Quick Capture, Done, Snooze, filters, detail navigation, and linked operational records.

Email is valuable when it stays connected to export execution. A thread can reference a buyer, Export Lane, product, requirement, provider, shipment, finance path, or payment issue. When a conversation creates a commitment, ExportPanel creates a linked follow-up, task, or Decision rather than treating the email itself as completed work.

Access is progressive:

| Plan | Mailbox capacity | Experience |
| --- | ---: | --- |
| Public / Basic | 0 | Redacted illustrative preview; no private email and no mutations |
| Launch | 1 | Personal or role-approved work mailbox after adapter activation |
| Scale | 5 | Multiple personal/shared mailboxes and team workflows |
| Managed | 12 | Wider mailbox coverage plus accountable Export HQ coordination |

Owners and administrators manage connections. Eligible operational roles can read/send within the plan ceiling. Viewers remain read-only. The server re-authorizes every organization-scoped read, send, attachment download, connection change, and conversion into work.

## Reviewed provider matrix

| Provider | Read / organize | Send | Authorization | Change delivery |
| --- | --- | --- | --- | --- |
| Gmail / Google Workspace | Gmail API at `https://gmail.googleapis.com/gmail/v1` | Gmail API | OAuth 2.0 with the narrowest useful Gmail scopes | `users.watch` → Google Cloud Pub/Sub, then History API catch-up |
| Outlook / Hotmail / Microsoft 365 | Microsoft Graph at `https://graph.microsoft.com/v1.0` | Microsoft Graph | Delegated OAuth 2.0; `Mail.ReadWrite`, `Mail.Send`, and `offline_access` only when required | Renewable Graph subscriptions, lifecycle handling, and delta catch-up |
| Yahoo Mail / AOL | IMAP | SMTP | Approved Yahoo OAuth mail scopes where granted; eligible app-password fallback | IMAP IDLE plus scheduled catch-up |
| Apple iCloud Mail | `imap.mail.me.com:993` | `smtp.mail.me.com:587` | Supported Apple third-party authorization where available; otherwise app-specific password with 2FA | IMAP IDLE plus scheduled catch-up |
| Zoho Mail | Reviewed Zoho API or IMAP | Reviewed Zoho API or SMTP | OAuth where available; policy-controlled app-password fallback | Provider capability or IMAP IDLE plus catch-up |
| Custom domain | Customer-defined IMAP over TLS | Customer-defined SMTP over TLS/STARTTLS | App-specific or delegated mailbox credential supplied directly to the server vault | IMAP IDLE plus scheduled catch-up |

The pasted proposal was directionally correct about provider adapters, but the generic `microsoft.com`, `googleapis.com`, and `me.com` endpoint placeholders were not valid implementation endpoints. Yahoo should not be presented as a general REST mail API without approved restricted mail access and a documented endpoint. Apple now documents supported third-party authorization for compatible apps, with app-specific passwords as the fallback rather than the only possible path.

Primary references:

- [Gmail API reference](https://developers.google.com/workspace/gmail/api/reference/rest)
- [Gmail `users.watch`](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/watch)
- [Microsoft Graph permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft Graph change notifications](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)
- [Yahoo authorization](https://developer.yahoo.com/sign-in-with-yahoo/)
- [Yahoo IMAP guidance](https://help.yahoo.com/kb/new-yahoo-mail/download-email-yahoo-mail-third-party-sln28681.html)
- [Apple third-party account access](https://support.apple.com/en-us/121539)
- [Apple iCloud server settings](https://support.apple.com/en-nz/102525)

## Security and data flow

1. The browser submits only a non-secret connection intent.
2. The server creates OAuth state/PKCE or a short-lived secure credential ceremony.
3. Tokens or app passwords go directly to an encrypted secret vault. The database stores only `credential_secret_ref`, granted scopes, cursor/subscription state, and status.
4. A sync worker consumes provider notifications or IMAP changes and applies idempotent updates inside an organization transaction and RLS context.
5. MIME is parsed in a sandboxed worker. Remote images and unsafe HTML are not rendered directly.
6. Message bodies and attachments use private storage with retention limits, malware scanning, checksums, authorized access, and audit events.
7. Sending validates organization, role, plan, mailbox ownership, recipients, attachment state, and an idempotency key before calling the provider.
8. Disconnect revokes provider authorization where possible, stops subscriptions/workers, removes the vault secret, and follows the organization retention policy.

## Activation checklist

- Provider-owned production applications and verified redirect domains.
- OAuth consent review and least-privilege scope approval.
- Encrypted secret vault and rotation/revocation workflow.
- Frankfurt/EU organization-scoped PostgreSQL repositories and RLS tests.
- Queue/worker runtime, Gmail Pub/Sub, and Microsoft subscription renewal/lifecycle jobs.
- IMAP connection pool, IDLE recovery, bounded polling, retry/backoff, and provider rate limits.
- MIME parser, HTML sanitizer, phishing/remote-content protections, attachment quarantine, scanning, and private downloads.
- Send pipeline with idempotency, bounce/error feedback, sent-folder reconciliation, and audit.
- Retention/deletion policy, DPA/privacy review, threat model, monitoring, and incident runbook.
- Cross-tenant, object-enumeration, revoked-token, missed-webhook, malformed-MIME, and recovery tests.

Until these controls are active, the UI must say **Illustrative mailbox preview** and keep live Connect and Send disabled.
