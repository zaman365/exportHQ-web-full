# Market intelligence system

ExportPanel's market intelligence turns country-product trade signals into a ranked,
actionable starting point for exporters. It is a decision-support layer, not a
promise of buyer demand or a replacement for product-specific due diligence.

## Access ladder

The same catalog is projected into three server-selected views. Restricted
fields are removed before rendering; the interface does not rely on CSS to hide
paid or verification-gated information.

| Access | Eligibility | Included |
| --- | --- | --- |
| Public | Signed out | A few country-product examples, public summaries, trend and confidence labels |
| Member | Signed in with an unverified Basic business | Searchable ranked shortlist and exact fit scores |
| Full | Verified business, or Launch/Scale/Managed subscription | Evidence trail, buyers, entry routes, barriers, proof checklist, and next actions |

Business verification is deliberately free. A paid plan grants the same full
research access immediately, while verification gives a credible non-paying
business a useful reason to identify itself and enter the customer funnel.

The reusable entitlement decision lives in
`packages/authorization/src/index.ts`. New high-value features should use the
same server-side pattern: public teaser, useful member view, then a full view
unlocked by trust or subscription.

## Catalog and ranking

The canonical starter catalog is in
`packages/domain/src/market-opportunities.ts`. Each lane connects one target
country with one export product category and contains:

- product and HS-code scope;
- opportunity, demand and Bangladesh-origin-fit scores;
- confidence, trend and review dates;
- buyer profiles, entry routes and known barriers;
- evidence to prepare and a suggested validation sprint;
- source records with publisher, link, period and observed metric.

Scores are directional prioritization aids. They must be reviewed whenever a
source is refreshed, an import rule changes, or direct buyer evidence materially
changes the lane. Never infer an exact score from one trade value alone.

## Data publishing

`upsertMarketIntelligenceCatalog` in
`packages/db/src/market-intelligence.ts` publishes a versioned catalog in one
transaction. It upserts countries, products and opportunity lanes, then replaces
their evidence rows so stale citations are not retained.

The schema and RLS envelope are introduced by
`packages/db/migrations/0001_market_intelligence.sql`. Global research data is
readable to product surfaces but cannot be modified by the public application
role. Organization verification requests and saved shortlists are tenant scoped.

Recommended operating cycle:

1. Review source links and trade periods monthly; refresh high-traffic lanes first.
2. Confirm proposed scores with a market specialist before publishing.
3. Run the catalog upsert with a new method version.
4. Audit public and member projections for restricted-field leakage.
5. Record corrections and the next review date in the source evidence.

## Verification trust boundary

A customer may submit company identity, registration and evidence details, but
submission only creates a `pending` request. It never self-assigns `verified`.
Verification must be approved through a trusted operations workflow. Only the
status and review timestamp belong in public organization metadata; submitted
evidence remains private.

Before production activation, apply the migration, connect the catalog publisher
to the database, add the operations review command, and configure Clerk webhook
synchronization for approved verification state.
