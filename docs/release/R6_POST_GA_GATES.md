# R6 post-GA product gates

R6 code defines safety and activation contracts only. Every R6 capability is
`Planned`; no post-GA customer surface, partner feed, identifiable programme
view or automatic external action has been activated.

Activation requires all of the following:

1. production runtime;
2. the immutable R5 GA release record in `EXPORTHQ_GA_RELEASE_EVIDENCE`; and
3. an exact capability-specific reviewed evidence hash in
   `EXPORTHQ_POST_GA_CAPABILITY_EVIDENCE`.

The platform-admin activation endpoint reports these decisions without
returning the evidence references themselves. A copied configuration in a
preview environment never activates the capability.

## Planned capability set

- institution and cluster programme dashboards;
- new sectors and markets through the governed publisher;
- rights-reviewed provider-network and buyer-data partnerships;
- API ecosystem;
- shipment autopsy and reviewable repeat-order drafts;
- consented aggregate benchmarks; and
- native mobile only after PWA usage demonstrates an unmet need.

Programme projections require an exact active grant, a cohort of at least five,
metric-specific contributor consent and aggregate-only output without direct
identifiers. Partnership data requires a named rights holder, licensed use,
current rights evidence, correction and opt-out controls. Shipment learning is
tenant-local and can prepare a draft but cannot send or place an order.

Native mobile has a third gate,
`EXPORTHQ_NATIVE_MOBILE_PWA_NEED_EVIDENCE`, backed by observed PWA workflow gaps
and product approval. It is not a roadmap default.

R6 must not turn Export HQ into a generic CRM, opaque broker, unmanaged
marketplace or custom agency. Those model identifiers are rejected by the
domain contract and remain repository invariants.
