# Bangladesh source registry

Status: versioned registry, pending-review discovery queue and lane-impact projection implemented; reviewed production records are not yet active.

Each source record requires publisher, canonical URL, jurisdiction, product/HS/market applicability, effective and superseded dates, retrieval/review dates, reviewer, confidence, method/rule version, source excerpt/reference, freshness SLA and impacted-lane notification policy.

The R1 PostgreSQL implementation separates the global reviewed registry from
tenant state:

- `regulatory_publishers`, `regulatory_sources` and `regulatory_rules` hold
  reviewed, versioned public-source records. The application and support roles
  can read these records but cannot publish, update or delete them.
- `regulatory_source_candidates` is a migration-owned discovery queue. It
  records official canonical URLs and the regulatory question each page may
  answer, but it deliberately contains no content hash, reviewer or approval.
  Runtime roles can read but cannot mutate this queue, and candidates never
  drive lane impacts or customer guidance.
- `regulatory_rule_lane_impacts` records which current rule affects which
  tenant-owned Export Lane, with pending, acknowledged, resolved and
  superseded states, append-only audit events and outbox notifications.
- Projection accepts only human-reviewed current rules from active publishers,
  excludes superseded or stale sources, and applies jurisdiction, product
  category, HS-prefix and destination-market criteria.
- Composite tenant foreign keys and forced RLS prevent a guessed lane or
  evidence identifier from creating a cross-organization relationship.

The reviewed source/rule seed contains synthetic `.invalid` fixtures only. R3
adds pending candidates for official Bangladesh, EU and UN pages, all marked
`pending_review` with an explicit discovery-only notice. No government or
intergovernmental page is represented as reviewed or live until a named
reviewer captures the exact content, records its SHA-256 hash, resolves
effective and superseded dates, and publishes a separate source/rule version.

Initial publishers to review: Bangladesh Single Window/NBR, CCI&E OLM/ERC, EPB, Bangladesh Bank, Bangladesh Trade Portal, EU Access2Markets/ROSA, relevant destination authorities and authoritative LDC/GSP transition sources.

The initial candidate queue was last checked on 29 August 2026 and includes:

- Bangladesh Single Window registration, CCI&E OLM, EPB and the EPB exporter
  database;
- the Bangladesh Bank circular index and its 30 July 2026 consolidated export
  trade circular;
- Bangladesh Trade Portal;
- EU Access2Markets, the Commission GSP overview and the new-GSP Q&A; and
- the UN Bangladesh LDC graduation-status page.

The EU and UN transition pages must be reviewed as a scenario, not flattened
into a guaranteed date. The product continues to fail closed while graduation
or transition details are unsettled or stale.
