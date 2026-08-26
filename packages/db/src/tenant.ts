import { sql } from "drizzle-orm";
import type { ExportHqDatabase } from "./index";

/**
 * Transaction-scoped tenant context.
 *
 * Row-level security reads `app.organization_id`. Setting it with
 * `set_config(..., true)` makes it *local to the transaction*, so it is
 * discarded on commit or rollback and cannot leak into the next request that
 * borrows the same pooled connection. Nothing in the application is permitted
 * to set it any other way.
 */

export type ExportHqTransaction = Parameters<Parameters<ExportHqDatabase["transaction"]>[0]>[0];

export type ActorType = "customer" | "staff" | "system";

export interface TenantContext {
  /** The `organizations.id` UUID, never the Clerk organization id. */
  readonly organizationId: string;
  readonly actorId: string;
  readonly actorType: ActorType;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenantContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantContextError";
  }
}

/**
 * The organization id reaches PostgreSQL as a setting rather than as part of a
 * predicate, so it is validated before it gets there. A Clerk id (`org_...`) is
 * rejected explicitly: passing one would silently produce a context that
 * matches no rows, which reads as "this tenant has no data" rather than as the
 * bug it is.
 */
export function assertOrganizationId(value: string): string {
  if (uuidPattern.test(value)) return value.toLowerCase();
  if (value.startsWith("org_")) {
    throw new TenantContextError(
      "Tenant context requires the organizations.id UUID, not the identity provider's organization id."
    );
  }
  throw new TenantContextError("Tenant context requires a valid organization UUID.");
}

function assertActor(context: TenantContext): void {
  if (!context.actorId.trim()) throw new TenantContextError("Tenant context requires an actor.");
}

/**
 * Runs `work` inside one transaction with the tenant context applied. Every
 * tenant read and write goes through here, so row-level security is always in
 * force and an audit event written by `work` commits atomically with the change
 * it describes.
 */
export async function withTenantTransaction<T>(
  database: ExportHqDatabase,
  context: TenantContext,
  work: (tx: ExportHqTransaction, context: TenantContext) => Promise<T>
): Promise<T> {
  const organizationId = assertOrganizationId(context.organizationId);
  assertActor(context);
  const scoped: TenantContext = { ...context, organizationId };

  return database.transaction(async (tx) => {
    await tx.execute(sql`select
      set_config('app.organization_id', ${organizationId}, true),
      set_config('app.actor_id', ${scoped.actorId}, true),
      set_config('app.actor_type', ${scoped.actorType}, true)`);
    return work(tx, scoped);
  });
}

/**
 * For work that is not tenant-scoped: the reviewed market catalog, staff
 * records, webhook bookkeeping. No organization context is set, so row-level
 * security denies every tenant table from inside this transaction. That is the
 * point — platform work cannot accidentally read a customer's rows.
 */
export async function withPlatformTransaction<T>(
  database: ExportHqDatabase,
  actor: { readonly actorId: string; readonly actorType: ActorType },
  work: (tx: ExportHqTransaction) => Promise<T>
): Promise<T> {
  if (!actor.actorId.trim()) throw new TenantContextError("Platform context requires an actor.");
  return database.transaction(async (tx) => {
    await tx.execute(sql`select
      set_config('app.organization_id', '', true),
      set_config('app.actor_id', ${actor.actorId}, true),
      set_config('app.actor_type', ${actor.actorType}, true)`);
    return work(tx);
  });
}

/**
 * Reads back the context PostgreSQL is actually enforcing. Used by the
 * isolation tests to prove the setting is applied and, more importantly, that
 * it does not survive the transaction.
 */
export async function readTenantContext(
  executor: Pick<ExportHqTransaction, "execute">
): Promise<{ organizationId: string; actorId: string; actorType: string }> {
  const rows = (await executor.execute(sql`select
    coalesce(nullif(current_setting('app.organization_id', true), ''), '') as organization_id,
    coalesce(nullif(current_setting('app.actor_id', true), ''), '') as actor_id,
    coalesce(nullif(current_setting('app.actor_type', true), ''), '') as actor_type`)) as unknown as Array<{
    organization_id: string;
    actor_id: string;
    actor_type: string;
  }>;
  const row = rows[0];
  return {
    organizationId: row?.organization_id ?? "",
    actorId: row?.actor_id ?? "",
    actorType: row?.actor_type ?? ""
  };
}
