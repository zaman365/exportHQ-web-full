import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { idempotencyKeys, rateLimitCounters, webhookDeliveries } from "./schema";
import type {
  IdempotencyRecord,
  IdempotencyState,
  IdempotencyStore,
  RateLimitConsumeRequest,
  RateLimitStore,
  RateLimitStoreDecision
} from "@exporthq/platform";
import type { ExportHqDatabase } from "./index";

/**
 * Durable idempotency.
 *
 * A Worker isolate is short-lived and there are many of them, so the in-memory
 * store is only a first line of defence. This one survives a redeploy, which is
 * what makes it safe against a provider redelivering a webhook hours later.
 */

const defaultRetentionHours = 72;

export class PostgresRateLimitStore implements RateLimitStore {
  constructor(private readonly database: ExportHqDatabase) {}

  async consume(key: string, request: RateLimitConsumeRequest): Promise<RateLimitStoreDecision> {
    const now = new Date(request.now);
    const resetAt = new Date(request.resetAt);
    // Raw `sql` fragments do not inherit Drizzle's timestamp column encoder,
    // so pass ISO text with an explicit PostgreSQL cast rather than a Date
    // object. This keeps the single-statement atomic upsert portable across
    // the postgres-js and Worker adapters.
    const nowIso = now.toISOString();
    const resetAtIso = resetAt.toISOString();
    const rows = (await this.database.execute(sql`
      insert into rate_limit_counters (key, count, reset_at, updated_at)
      values (${key}, 1, ${resetAtIso}::timestamptz, ${nowIso}::timestamptz)
      on conflict (key) do update set
        count = case
          when rate_limit_counters.reset_at <= ${nowIso}::timestamptz then 1
          else rate_limit_counters.count + 1
        end,
        reset_at = case
          when rate_limit_counters.reset_at <= ${nowIso}::timestamptz then ${resetAtIso}::timestamptz
          else rate_limit_counters.reset_at
        end,
        updated_at = ${nowIso}::timestamptz
      where rate_limit_counters.reset_at <= ${nowIso}::timestamptz
         or rate_limit_counters.count < ${request.ceiling}
      returning count, reset_at
    `)) as unknown as Array<{ count: number; reset_at: Date }>;

    const consumed = rows[0];
    if (consumed) {
      return { allowed: true, count: consumed.count, resetAt: new Date(consumed.reset_at).getTime() };
    }

    const [current] = await this.database
      .select({ count: rateLimitCounters.count, resetAt: rateLimitCounters.resetAt })
      .from(rateLimitCounters)
      .where(eq(rateLimitCounters.key, key))
      .limit(1);
    return {
      allowed: false,
      count: current?.count ?? request.ceiling,
      resetAt: current?.resetAt.getTime() ?? request.resetAt
    };
  }

  async purgeExpired(now = new Date()): Promise<void> {
    await this.database.delete(rateLimitCounters).where(lt(rateLimitCounters.resetAt, now));
  }
}

function toRecord(row: {
  key: string;
  state: "in_progress" | "succeeded" | "failed";
  requestHash: string;
  resultReference: string | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}): IdempotencyRecord {
  const state: IdempotencyState = row.state === "in_progress" ? "in-progress" : row.state;
  return {
    key: row.key,
    state,
    requestHash: row.requestHash,
    resultReference: row.resultReference,
    attempts: row.attempts,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export class PostgresIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly database: ExportHqDatabase,
    private readonly scope: string,
    private readonly retentionHours: number = defaultRetentionHours
  ) {}

  async read(key: string): Promise<IdempotencyRecord | null> {
    const [row] = await this.database
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, this.scopedKey(key)))
      .limit(1);
    return row ? toRecord({ ...row, key }) : null;
  }

  /**
   * The claim is a single conditional insert. `on conflict ... where` means
   * only one concurrent caller can take the key, and a previously failed
   * attempt may be retried; an in-progress or succeeded key returns nothing, so
   * the caller answers "in progress" rather than repeating the work.
   */
  async claim(key: string, requestHash: string, now: Date): Promise<IdempotencyRecord | null> {
    const scoped = this.scopedKey(key);
    const expiresAt = new Date(now.getTime() + this.retentionHours * 3_600_000);
    const rows = await this.database
      .insert(idempotencyKeys)
      .values({
        key: scoped,
        scope: this.scope,
        requestHash,
        state: "in_progress",
        attempts: 1,
        expiresAt,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: idempotencyKeys.key,
        set: {
          state: "in_progress",
          requestHash,
          attempts: sql`${idempotencyKeys.attempts} + 1`,
          updatedAt: now,
          expiresAt
        },
        setWhere: eq(idempotencyKeys.state, "failed")
      })
      .returning();

    const row = rows[0];
    return row ? toRecord({ ...row, key }) : null;
  }

  async settle(
    key: string,
    state: Exclude<IdempotencyState, "in-progress">,
    resultReference: string | null,
    now: Date
  ): Promise<void> {
    await this.database
      .update(idempotencyKeys)
      .set({ state, resultReference, updatedAt: now })
      .where(eq(idempotencyKeys.key, this.scopedKey(key)));
  }

  /** Expired keys are removed on a schedule; retention is bounded, not forever. */
  async purgeExpired(now = new Date()): Promise<void> {
    await this.database.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, now));
  }

  private scopedKey(key: string): string {
    return `${this.scope}:${key}`;
  }
}

export type WebhookDeliveryOutcome = "processed" | "ignored" | "failed" | "dead_letter";

/**
 * Records every inbound delivery, including ones this deployment ignores by
 * design, so that "no projection happened" can be distinguished from "the
 * delivery never arrived" during an incident.
 */
export async function recordWebhookDelivery(
  database: ExportHqDatabase,
  input: {
    readonly provider: string;
    readonly eventId: string;
    readonly eventType: string;
    readonly payloadHash: string;
    readonly payload: Record<string, unknown>;
    readonly outcome: WebhookDeliveryOutcome;
    readonly failureReason?: string | undefined;
  }
): Promise<void> {
  const now = new Date();
  await database
    .insert(webhookDeliveries)
    .values({
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      payloadHash: input.payloadHash,
      payload: input.payload,
      state: input.outcome,
      failureReason: input.failureReason ?? null,
      receivedAt: now,
      processedAt: input.outcome === "processed" || input.outcome === "ignored" ? now : null
    })
    .onConflictDoUpdate({
      target: [webhookDeliveries.provider, webhookDeliveries.eventId],
      set: {
        state: input.outcome,
        attempts: sql`${webhookDeliveries.attempts} + 1`,
        failureReason: input.failureReason ?? null,
        lastAttemptAt: now,
        processedAt: input.outcome === "processed" || input.outcome === "ignored" ? now : null
      }
    });
}

export async function countDeadLetteredDeliveries(database: ExportHqDatabase, provider: string): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(webhookDeliveries)
    .where(and(eq(webhookDeliveries.provider, provider), eq(webhookDeliveries.state, "dead_letter")));
  return row?.total ?? 0;
}

/**
 * Provider payloads are retry evidence, not permanent customer storage.
 * Processed/ignored deliveries expire after the short operational window;
 * dead letters remain longer for incident analysis, then expire as well.
 */
export async function purgeRetainedWebhookDeliveries(
  database: ExportHqDatabase,
  input: {
    readonly processedBefore: Date;
    readonly deadLetterBefore: Date;
  }
): Promise<void> {
  await database.delete(webhookDeliveries).where(or(
    and(
      inArray(webhookDeliveries.state, ["processed", "ignored"]),
      lt(webhookDeliveries.lastAttemptAt, input.processedBefore)
    ),
    and(
      eq(webhookDeliveries.state, "dead_letter"),
      lt(webhookDeliveries.lastAttemptAt, input.deadLetterBefore)
    )
  ));
}
