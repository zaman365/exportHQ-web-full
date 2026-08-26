# Data classification, retention and legal hold

- **Status:** Implemented — `packages/platform/src/data-classification.ts`
- **Gate:** Gate 0 of [`production-activation-todo.md`](production-activation-todo.md)

Every table, object store and telemetry stream names a class. Retention and
deletion follow from the class, so a new feature inherits the approved policy
instead of inventing one.

| Class | Contains | Retention | Telemetry | Customer export | Customer deletion | Encryption |
| --- | --- | --- | --- | --- | --- | --- |
| `public` | Reviewed market intelligence, marketing copy | Indefinite | Permitted | No | No | Platform |
| `operational` | Lanes, tasks, requirement applicability | Tenant lifetime | Never | Yes | Yes | Platform |
| `customer-business` | Company profile, products, buyer and provider interactions, economics | Tenant lifetime | Never | Yes | Yes | Platform |
| `customer-confidential` | Evidence documents, extraction output, mailbox threads and bodies | Tenant lifetime | Never | Yes | Yes | Application |
| `credential` | Mailbox tokens, provider credentials, signing material | Tenant lifetime | Never | No | Yes | Application |
| `audit` | Privileged, membership, evidence and business decisions | 7 years | Never | Yes | No | Platform |

## Decision order

1. **A legal hold always wins.** Nothing is deleted while a hold is active,
   including on a customer deletion request.
2. **The retention floor is checked next.** A deletion request inside the floor
   is held, not refused, so it resumes automatically once the floor passes.
3. **Audit records are never deleted on request.** They are the evidence that a
   decision was authorised. A customer receives them in an export instead.

## Telemetry

`assertTelemetryPermitted` refuses every class except `public`. Two mechanisms
enforce this in practice:

- **Sentry** — `scrubTelemetryEvent` removes signed URLs, tokens, JWTs, webhook
  secrets, bearer headers, email local parts, and any value under a
  confidential key, bounded against cyclic and oversized payloads.
- **PostHog** — `filterAnalyticsProperties` drops anything outside a fixed
  allowlist rather than redacting it, so a newly added upstream property cannot
  start flowing without a code change. An allowlisted property carrying an
  address or a URL is dropped too.

Both are covered by tests asserting that evidence content, message bodies,
tokens and signed URLs cannot appear in a telemetry payload.
