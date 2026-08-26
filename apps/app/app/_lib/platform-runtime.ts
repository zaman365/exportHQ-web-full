import {
  MemoryIdempotencyStore,
  MemoryRateLimitStore,
  capabilityIsEnabled,
  type IdempotencyStore,
  type RateLimitStore
} from "@exporthq/platform";

/**
 * Process-local stores.
 *
 * A Worker isolate is short-lived and there may be many of them, so these are
 * a best-effort first line of defence only. They become authoritative when
 * `customer-postgres-persistence` is activated and the PostgreSQL-backed
 * stores replace them — see Gate 1 in docs/production-activation-todo.md.
 */
const rateLimitStore: RateLimitStore = new MemoryRateLimitStore();
const idempotencyStore: IdempotencyStore = new MemoryIdempotencyStore();

export function getRateLimitStore(): RateLimitStore {
  return rateLimitStore;
}

export function getIdempotencyStore(): IdempotencyStore {
  return idempotencyStore;
}

/**
 * True only when the durable stores behind these interfaces are the activated
 * PostgreSQL ones. Call sites use this to describe their own guarantees
 * honestly rather than implying durability they do not have.
 */
export function durableStoresActivated(): boolean {
  return capabilityIsEnabled("customer-postgres-persistence") && Boolean(process.env.DATABASE_URL);
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
