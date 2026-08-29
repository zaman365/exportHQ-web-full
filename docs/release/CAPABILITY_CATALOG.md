# Capability catalog

Status language is centrally constrained to `Live`, `Pilot`, `Preview` and `Planned`.

| Capability | Status | Truthful scope | Activation authority |
| --- | --- | --- | --- |
| Public website and safe product tour | Live | Public/synthetic content only | Deployed artifact and public-content review |
| Clerk identity boundary | Pilot | Production instance exists; complete method/MFA/reconciliation evidence is pending | Gate 1 |
| PostgreSQL customer persistence | Preview | Schema and partial repositories exist; no provisioned production database | Gate 1 |
| Export Lane, readiness and Studio | Preview | Domain logic and synthetic/local adapters; not production tenant authority | Gate 3 |
| Evidence vault | Planned | Upload/download fail closed; no R2 quarantine/scanner | Gate 2 |
| Business verification | Preview | Submission UX exists; trusted evidence review is not active | Gate 4 |
| Buyer/provider/mail/bank/freight/government adapters | Planned | Illustrative or disconnected only | Gate 4 plus adapter-specific evidence |
| Self-service billing | Planned | No approved Bangladesh payment path or reconciled ledger | Billing-specific evidence and R4 gate |
| Operations console | Preview | Illustrative projection only; real customer access prohibited until scoped grants pass | R0-07 / Gate 1 |
| Broad external launch | Planned | R0 baseline release verdict is No-Go | Gate 5 and later release gates |

Customer-facing plan and capability copy must derive from the shared catalogs in `packages/authorization` and `packages/platform`; this document records release evidence, not a second entitlement policy.
