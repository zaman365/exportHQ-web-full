# Domain model

## Phase 1 aggregates

- **Organization** owns the customer tenancy boundary.
- **Membership** gives a user an organization role and explicit permissions.
- **Staff access grant** gives an internal principal a scoped, time-bounded reason to access a customer.
- **Company profile** captures the exporter identity and commercial/export capabilities.
- **Facility** captures factory-specific capability and evidence.
- **Product** describes the exportable item; **product market** binds it to a destination and readiness state.
- **Requirement** is sourced regulatory or operational knowledge; **applicability** binds it to organization, product, market, and status.
- **Document** is the authorized business object; immutable **document versions** reference private object keys.
- **Task** makes every identified gap actionable with customer, Export HQ, or third-party responsibility.
- **Activity/audit event** records chronological work and privileged changes.

## Important invariants

1. Tenant-owned rows always carry `organization_id`.
2. A product is never universally compliant; readiness is computed per product and market.
3. A requirement can be called compliant only with evidence and review state appropriate to its risk.
4. Friendly references are organization-scoped and generated transactionally; public identifiers are non-sequential UUIDs.
5. Documents are linked business objects, never isolated storage blobs.
6. Money always stores an integer minor-unit amount and ISO currency.

## Future aggregates

Buyer CRM, RFQs, quotations, samples, orders, production, quality, shipments, customs, invoices, payments, claims, services, and growth plans are intentionally deferred until the Phase 1 loop proves useful. They should be explicit aggregates rather than a universal entity table.
