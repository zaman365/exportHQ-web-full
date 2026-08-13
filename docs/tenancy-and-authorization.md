# Tenancy and authorization

## Principals

Customer users authenticate through Clerk and receive organization memberships. Export HQ staff use a separate internal profile and explicit `staff_access_grants`; they are not silently inserted as customer members.

Authorization evaluates:

```text
authenticated principal
  + active organization membership or active staff grant
  + permission required by the operation
  + resource organization_id equality
  + entitlement where applicable
```

UI visibility is convenience only. Every read, write, download, enumeration, export, and aggregate query is scoped and authorized on the server.

## Roles

Customer role templates map to granular permissions such as `company:manage`, `products:manage`, `compliance:manage`, `documents:manage`, and `team:manage`. Templates are defaults, not security shortcuts; authorization checks the resolved permission set.

Staff grants record customer, staff user, scope, reason, approver, start, expiry, and revocation. Elevated access creates audit events.

## Database defence in depth

Migrations enable RLS on tenant tables and use transaction-local settings (`app.organization_id`, `app.staff_user_id`). The database role used by the application must not own tables or bypass RLS. Connection pooling must run transaction mode so scope cannot leak between requests.

Automated policy tests prove that a principal for Organization A cannot view, mutate, enumerate, download, or infer Organization B resources.
