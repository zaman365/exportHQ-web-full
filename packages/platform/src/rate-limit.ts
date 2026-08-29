/**
 * Abuse controls.
 *
 * Limits are expressed per capability so that authentication, upload, search,
 * invitation, export and webhook traffic each fail independently: a burst of
 * document uploads must not lock a customer out of signing in.
 */

export type RateLimitedAction =
  | "authentication"
  | "organization-invitation"
  | "document-upload-intent"
  | "document-download"
  | "document-share"
  | "market-search"
  | "customer-export"
  | "mailbox-connect"
  | "mailbox-send"
  | "webhook-delivery"
  | "verification-submission";

export interface RateLimitRule {
  readonly limit: number;
  readonly windowSeconds: number;
  /** Extra allowance for a short burst, consumed before the steady rate. */
  readonly burst: number;
}

export const rateLimitRules: Readonly<Record<RateLimitedAction, RateLimitRule>> = {
  authentication: { limit: 10, windowSeconds: 300, burst: 5 },
  "organization-invitation": { limit: 20, windowSeconds: 3600, burst: 5 },
  "document-upload-intent": { limit: 30, windowSeconds: 3600, burst: 10 },
  "document-download": { limit: 120, windowSeconds: 3600, burst: 30 },
  "document-share": { limit: 20, windowSeconds: 3600, burst: 5 },
  "market-search": { limit: 120, windowSeconds: 300, burst: 30 },
  "customer-export": { limit: 3, windowSeconds: 86_400, burst: 1 },
  "mailbox-connect": { limit: 5, windowSeconds: 3600, burst: 2 },
  "mailbox-send": { limit: 60, windowSeconds: 3600, burst: 15 },
  "webhook-delivery": { limit: 600, windowSeconds: 60, burst: 200 },
  "verification-submission": { limit: 5, windowSeconds: 86_400, burst: 1 }
};

export interface RateLimitCounter {
  count: number;
  resetAt: number;
}

export interface RateLimitConsumeRequest {
  readonly now: number;
  readonly resetAt: number;
  readonly ceiling: number;
}

export interface RateLimitStoreDecision extends RateLimitCounter {
  readonly allowed: boolean;
}

/**
 * Consumption is one atomic store operation. A read-then-write interface is
 * unsafe across Worker isolates: two requests can observe the same counter and
 * both increment it. Durable adapters must perform the conditional increment
 * in their storage engine.
 */
export interface RateLimitStore {
  consume(
    key: string,
    request: RateLimitConsumeRequest
  ): Promise<RateLimitStoreDecision> | RateLimitStoreDecision;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, RateLimitCounter>();

  consume(key: string, request: RateLimitConsumeRequest): RateLimitStoreDecision {
    const existing = this.counters.get(key);
    const counter = existing && existing.resetAt > request.now
      ? { ...existing }
      : { count: 0, resetAt: request.resetAt };

    if (counter.count >= request.ceiling) {
      return { ...counter, allowed: false };
    }

    counter.count += 1;
    this.counters.set(key, counter);
    return { ...counter, allowed: true };
  }

  clear(): void {
    this.counters.clear();
  }
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly limit: number;
  readonly resetAt: Date;
  readonly retryAfterSeconds: number;
}

export interface RateLimitInput {
  readonly action: RateLimitedAction;
  /** Stable subject: organization id, user id, or a hashed client address. */
  readonly subject: string;
  readonly store: RateLimitStore;
  readonly now?: Date;
  readonly rules?: Readonly<Record<RateLimitedAction, RateLimitRule>>;
}

export function rateLimitKey(action: RateLimitedAction, subject: string): string {
  return `ratelimit:${action}:${subject}`;
}

export async function consumeRateLimit(input: RateLimitInput): Promise<RateLimitDecision> {
  const rules = input.rules ?? rateLimitRules;
  const rule = rules[input.action];
  const now = (input.now ?? new Date()).getTime();
  const key = rateLimitKey(input.action, input.subject);
  const ceiling = rule.limit + rule.burst;

  const counter = await input.store.consume(key, {
    now,
    resetAt: now + rule.windowSeconds * 1000,
    ceiling
  });

  if (!counter.allowed) {
    return {
      allowed: false,
      remaining: 0,
      limit: ceiling,
      resetAt: new Date(counter.resetAt),
      retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - now) / 1000))
    };
  }

  return {
    allowed: true,
    remaining: ceiling - counter.count,
    limit: ceiling,
    resetAt: new Date(counter.resetAt),
    retryAfterSeconds: 0
  };
}

export class RateLimitedError extends Error {
  readonly retryAfterSeconds: number;
  readonly userFacingMessage =
    "Too many requests. Wait a moment and try again — nothing was changed.";

  constructor(decision: RateLimitDecision) {
    super(`Rate limit reached; retry in ${decision.retryAfterSeconds}s.`);
    this.name = "RateLimitedError";
    this.retryAfterSeconds = decision.retryAfterSeconds;
  }
}

export async function enforceRateLimit(input: RateLimitInput): Promise<RateLimitDecision> {
  const decision = await consumeRateLimit(input);
  if (!decision.allowed) throw new RateLimitedError(decision);
  return decision;
}

export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(Math.max(0, Math.ceil((decision.resetAt.getTime() - Date.now()) / 1000)))
  };
  if (!decision.allowed) headers["Retry-After"] = String(decision.retryAfterSeconds);
  return headers;
}

/**
 * Client addresses are only ever used as a rate-limit subject, so they are
 * hashed rather than stored. The salt keeps the hash unusable as a cross-
 * deployment identifier.
 */
export async function hashClientAddress(address: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
