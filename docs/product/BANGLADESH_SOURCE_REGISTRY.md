# Bangladesh source registry

Status: versioned registry and lane-impact projection implemented; reviewed production records are not yet active.

Each source record requires publisher, canonical URL, jurisdiction, product/HS/market applicability, effective and superseded dates, retrieval/review dates, reviewer, confidence, method/rule version, source excerpt/reference, freshness SLA and impacted-lane notification policy.

The R1 PostgreSQL implementation separates the global reviewed registry from
tenant state:

- `regulatory_publishers`, `regulatory_sources` and `regulatory_rules` hold
  reviewed, versioned public-source records. The application and support roles
  can read these records but cannot publish, update or delete them.
- `regulatory_rule_lane_impacts` records which current rule affects which
  tenant-owned Export Lane, with pending, acknowledged, resolved and
  superseded states, append-only audit events and outbox notifications.
- Projection accepts only human-reviewed current rules from active publishers,
  excludes superseded or stale sources, and applies jurisdiction, product
  category, HS-prefix and destination-market criteria.
- Composite tenant foreign keys and forced RLS prevent a guessed lane or
  evidence identifier from creating a cross-organization relationship.

The automated seed contains synthetic `.invalid` fixtures only. No government
or other publisher is represented as reviewed or live until a named reviewer
publishes the real source record and production activation evidence exists.

Initial publishers to review: Bangladesh Single Window/NBR, CCI&E OLM/ERC, EPB, Bangladesh Bank, Bangladesh Trade Portal, EU Access2Markets/ROSA, relevant destination authorities and authoritative LDC/GSP transition sources.
