import {
  MemoryIdempotencyStore,
  MemoryRateLimitStore,
  isProductionRuntime,
  runtimeEnvironment,
  type IdempotencyStore,
  type RateLimitStore
} from "@exporthq/platform";
import {
  checkDatabaseHealth,
  PostgresIdempotencyStore,
  PostgresRateLimitStore
} from "@exporthq/db";
import { getPlatformDatabase } from "./database";

/**
 * Process-local stores.
 *
 * A Worker isolate is short-lived and there may be many of them, so these are
 * a best-effort first line of defence only. They become authoritative when
 * `customer-postgres-persistence` is activated and the PostgreSQL-backed
 * stores replace them — see Gate 1 in docs/production-activation-todo.md.
 */
const memoryRateLimitStore: RateLimitStore = new MemoryRateLimitStore();
const memoryIdempotencyStore: IdempotencyStore = new MemoryIdempotencyStore();
let postgresRateLimitStore: RateLimitStore | null = null;
let postgresIdempotencyStore: IdempotencyStore | null = null;

export type PlatformStoreAdapter = "memory" | "postgres" | "unavailable";

export class DurablePlatformStoreUnavailableError extends Error {
  readonly userFacingMessage = "This operation is temporarily unavailable because its durable safety controls are not active.";

  constructor() {
    super("Production requires PostgreSQL-backed rate-limit and idempotency stores.");
    this.name = "DurablePlatformStoreUnavailableError";
  }
}

export function selectedPlatformStoreAdapter(
  env: Readonly<Record<string, string | undefined>> = process.env
): PlatformStoreAdapter {
  if (isProductionRuntime(env)) return env.DATABASE_URL ? "postgres" : "unavailable";
  if (env.EXPORTHQ_PLATFORM_STORE === "postgres") return env.DATABASE_URL ? "postgres" : "unavailable";
  return "memory";
}

function postgresStores(): { rateLimit: RateLimitStore; idempotency: IdempotencyStore } {
  const database = getPlatformDatabase();
  if (!database) throw new DurablePlatformStoreUnavailableError();
  postgresRateLimitStore ??= new PostgresRateLimitStore(database);
  postgresIdempotencyStore ??= new PostgresIdempotencyStore(database, "exportpanel");
  return { rateLimit: postgresRateLimitStore, idempotency: postgresIdempotencyStore };
}

export function getRateLimitStore(): RateLimitStore {
  const adapter = selectedPlatformStoreAdapter();
  if (adapter === "memory") return memoryRateLimitStore;
  if (adapter === "postgres") return postgresStores().rateLimit;
  throw new DurablePlatformStoreUnavailableError();
}

export function getIdempotencyStore(): IdempotencyStore {
  const adapter = selectedPlatformStoreAdapter();
  if (adapter === "memory") return memoryIdempotencyStore;
  if (adapter === "postgres") return postgresStores().idempotency;
  throw new DurablePlatformStoreUnavailableError();
}

/**
 * True only when the durable stores behind these interfaces are the activated
 * PostgreSQL ones. Call sites use this to describe their own guarantees
 * honestly rather than implying durability they do not have.
 */
export function durableStoresActivated(): boolean {
  return selectedPlatformStoreAdapter() === "postgres";
}

export async function assertPlatformStoresHealthy(): Promise<void> {
  if (selectedPlatformStoreAdapter() !== "postgres") throw new DurablePlatformStoreUnavailableError();
  const database = getPlatformDatabase();
  if (!database) throw new DurablePlatformStoreUnavailableError();
  await checkDatabaseHealth(database);
}

export function platformStoreStatus(): {
  readonly environment: ReturnType<typeof runtimeEnvironment>;
  readonly adapter: PlatformStoreAdapter;
  readonly durable: boolean;
} {
  const adapter = selectedPlatformStoreAdapter();
  return { environment: runtimeEnvironment(), adapter, durable: adapter === "postgres" };
}

/**
 * A stable rate-limit subject for an unauthenticated caller. Cloudflare
 * supplies the connecting address; it is hashed before use and never stored.
 */
export function clientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
