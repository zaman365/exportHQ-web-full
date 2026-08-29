import "server-only";
import { createDatabase, type ExportHqDatabase } from "@exporthq/db";
import { capabilityIsEnabled } from "@exporthq/platform";

/**
 * Lazy database handle.
 *
 * The connection is created on first use rather than at module load so that a
 * deployment without `DATABASE_URL` — which is every deployment until Gate 1
 * records evidence — starts and serves the public surfaces normally.
 *
 * `createDatabase` sets `prepare: false`, which is what makes a pooled Neon
 * connection string safe to use; the pooler cannot carry prepared statements
 * across sessions.
 */
let handle: ExportHqDatabase | null = null;

export function tenantPersistenceActivated(): boolean {
  return capabilityIsEnabled("customer-postgres-persistence") && Boolean(process.env.DATABASE_URL);
}

/** Platform bookkeeping (webhook deliveries, rate limits and idempotency)
 * must be usable while Gate 1 evidence is still being collected. Customer
 * repositories remain gated separately by `getDatabase`. */
export function getPlatformDatabase(): ExportHqDatabase | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  handle ??= createDatabase(databaseUrl);
  return handle;
}

/**
 * Returns the database only when tenant persistence is activated. Callers get
 * `null` rather than a throwing handle so they can choose a truthful degraded
 * path instead of failing a page render.
 */
export function getDatabase(): ExportHqDatabase | null {
  if (!tenantPersistenceActivated()) return null;
  return getPlatformDatabase();
}

/** Throws where a command genuinely cannot proceed without durable storage. */
export function requireDatabase(): ExportHqDatabase {
  const database = getDatabase();
  if (!database) {
    throw new Error("Tenant persistence is not activated for this deployment.");
  }
  return database;
}
