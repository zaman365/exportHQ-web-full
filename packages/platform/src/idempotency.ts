/**
 * Idempotency for webhooks and retryable commands.
 *
 * External systems retry. Clerk redelivers. A customer double-submits. Every
 * such path records a key so the effect happens once, and a replayed request
 * returns the original outcome instead of repeating the work.
 */

export type IdempotencyState = "in-progress" | "succeeded" | "failed";

export interface IdempotencyRecord {
  readonly key: string;
  readonly state: IdempotencyState;
  /** Hash of the request payload; a different body under the same key is a conflict. */
  readonly requestHash: string;
  readonly resultReference: string | null;
  readonly attempts: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IdempotencyStore {
  read(key: string): Promise<IdempotencyRecord | null>;
  /** Must be atomic: returns null when the key was claimed by someone else. */
  claim(key: string, requestHash: string, now: Date): Promise<IdempotencyRecord | null>;
  settle(key: string, state: Exclude<IdempotencyState, "in-progress">, resultReference: string | null, now: Date): Promise<void>;
}

export class IdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`Idempotency key ${key} was already used with a different request body.`);
    this.name = "IdempotencyConflictError";
  }
}

export type IdempotentOutcome<T> =
  | { readonly status: "executed"; readonly value: T }
  | { readonly status: "replayed"; readonly resultReference: string | null }
  | { readonly status: "in-progress" };

export interface IdempotentExecutionInput<T> {
  readonly key: string;
  readonly requestHash: string;
  readonly store: IdempotencyStore;
  readonly now?: Date;
  /** Returns a stable reference (an id, a URL) recorded against the key. */
  readonly execute: () => Promise<{ value: T; resultReference: string | null }>;
}

/**
 * A concurrent duplicate returns `in-progress` rather than blocking: the caller
 * answers 409/202 and the sender retries, which is safer than holding a Worker
 * request open while another attempt finishes.
 */
export async function executeIdempotently<T>(input: IdempotentExecutionInput<T>): Promise<IdempotentOutcome<T>> {
  const now = input.now ?? new Date();
  const existing = await input.store.read(input.key);

  if (existing) {
    if (existing.requestHash !== input.requestHash) throw new IdempotencyConflictError(input.key);
    if (existing.state === "succeeded") return { status: "replayed", resultReference: existing.resultReference };
    if (existing.state === "in-progress") return { status: "in-progress" };
  }

  const claimed = await input.store.claim(input.key, input.requestHash, now);
  if (!claimed) return { status: "in-progress" };

  try {
    const { value, resultReference } = await input.execute();
    await input.store.settle(input.key, "succeeded", resultReference, new Date());
    return { status: "executed", value };
  } catch (error) {
    await input.store.settle(input.key, "failed", null, new Date());
    throw error;
  }
}

export async function hashRequestBody(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  async read(key: string): Promise<IdempotencyRecord | null> {
    return this.records.get(key) ?? null;
  }

  async claim(key: string, requestHash: string, now: Date): Promise<IdempotencyRecord | null> {
    const existing = this.records.get(key);
    if (existing && existing.state !== "failed") return null;
    const record: IdempotencyRecord = {
      key,
      state: "in-progress",
      requestHash,
      resultReference: null,
      attempts: (existing?.attempts ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.records.set(key, record);
    return record;
  }

  async settle(
    key: string,
    state: Exclude<IdempotencyState, "in-progress">,
    resultReference: string | null,
    now: Date
  ): Promise<void> {
    const existing = this.records.get(key);
    if (!existing) return;
    this.records.set(key, { ...existing, state, resultReference, updatedAt: now });
  }
}

/**
 * Retry schedule for deliveries the platform performs itself (scan requests,
 * provider callbacks). Bounded so a permanently failing message reaches the
 * dead-letter path instead of retrying forever.
 */
export const maximumDeliveryAttempts = 6;

export function retryDelaySeconds(attempt: number): number {
  if (attempt >= maximumDeliveryAttempts) return -1;
  // 30s, 60s, 2m, 4m, 8m, 16m — capped so a queue drains within an hour.
  return Math.min(960, 30 * 2 ** Math.max(0, attempt - 1));
}

export function shouldDeadLetter(attempt: number): boolean {
  return attempt >= maximumDeliveryAttempts;
}
