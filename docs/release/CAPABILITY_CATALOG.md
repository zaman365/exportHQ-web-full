# Capability catalog

Status language is centrally constrained to `Live`, `Pilot`, `Preview` and `Planned`.

| Capability | Status | Truthful scope | Activation authority |
| --- | --- | --- | --- |
| Public website and safe product tour | Live | Public/synthetic content only | Deployed artifact and public-content review |
| Clerk identity boundary | Pilot | Production instance exists; complete method/MFA/reconciliation evidence is pending | Gate 1 |
| PostgreSQL customer persistence | Preview | Frankfurt Neon projects and tenant repositories exist; live application credentials, Hyperdrive and remaining Gate 1 evidence are not active | Gate 1 |
| Export Lane and readiness records | Preview | Tenant-scoped repositories, optimistic versions, audit/outbox, derived tasks and non-owner RLS tests exist; production activation and one complete synthetic journey remain | Gate 3 |
| Private Alpha and First Shipment Pass | Preview | Internal/synthetic invitation, exact agreement, bounded manual entitlement, named support and minimized measurement are implemented; no external participant, public checkout or exit-gate outcome is claimed | R2 engineering checkpoint plus Gate 5 |
| Regulatory source and lane-impact records | Preview | Versioned registry, freshness/review enforcement and tenant lane impacts exist with synthetic fixtures only; no real publisher record is active | Gate 3 plus reviewed source publication |
| AI-assisted evidence extraction | Preview | Immutable proposal, model/prompt/rule provenance, source spans and human decision/usage controls exist; no production AI provider or automatic authoritative mutation is active | Gate 2 and Gate 4 |
| Export Studio projections | Preview | Commercial and operating projections still use labelled synthetic/local adapters | Gate 3 |
| Evidence vault | Planned | Provider-neutral quarantine plus resumable multipart/integrity contracts exist; production R2 and scanner remain unbound, so upload/download fail closed | Gate 2 |
| Business verification | Preview | Submission UX exists; trusted evidence review is not active | Gate 4 |
| Buyer/provider/mail/bank/freight/government adapters | Planned | Illustrative or disconnected only | Gate 4 plus adapter-specific evidence |
| Self-service billing | Planned | No approved Bangladesh payment path or reconciled ledger | Billing-specific evidence and R4 gate |
| Operations console | Preview | Illustrative projection only; real customer access prohibited until scoped grants pass | R0-07 / Gate 1 |
| Broad external launch | Planned | R0 baseline release verdict is No-Go | Gate 5 and later release gates |

Customer-facing plan and capability copy must derive from the shared catalogs in `packages/authorization` and `packages/platform`; this document records release evidence, not a second entitlement policy.
