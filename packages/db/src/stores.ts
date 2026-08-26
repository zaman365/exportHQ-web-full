import { and, eq, lt, sql } from "drizzle-orm";
import { idempotencyKeys, webhookDeliveries } from "./schema";
import type { IdempotencyRecord, IdempotencyState, IdempotencyStore } from "@exporthq/platform";
import type { ExportHqDatabase } from "./index";

/**
 * Durable idempotency.
 *
 * A Worker isolate is short-lived and there are many of them, so the in-memory
 * store is only a first line of defence. This one survives a redeploy, which is
 * what makes it safe against a provider redelivering a webhook hours later.
 */

const defaultRetentionHours = 72;

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
