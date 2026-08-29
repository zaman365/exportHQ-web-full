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
| Self-service billing | Preview | PostgreSQL-authoritative BDT checkout, settlement/refund/dunning/drift controls and exact usage UX exist; SSLCOMMERZ is a technical candidate only and checkout remains closed | Active reviewed provider plus billing-specific R4 evidence |
| Governed provider cases | Preview | Verification expiry, disclosure, acceptance, exact evidence sharing, complaint/dispute and outcome contracts exist; no production provider is active | Gate 4 provider approval and R4 outcomes |
| External guests, API and customer webhooks | Preview | Exact-resource expiring guests, narrow read scopes, managed secret references, signing/replay and operations-only delivery controls pass locally | Deployed endpoints, rotation/recovery and R4 reliability evidence |
| Operations console | Preview | Illustrative projection only; real customer access prohibited until scoped grants pass | R0-07 / Gate 1 |
| Broad external launch | Planned | R0 baseline release verdict is No-Go | Gate 5 and later release gates |

Customer-facing plan and capability copy must derive from the shared catalogs in `packages/authorization` and `packages/platform`; this document records release evidence, not a second entitlement policy.
