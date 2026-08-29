import { and, eq, lt } from "drizzle-orm";
import { assertSafeOutboxPayload, type OutboxEventInput } from "@exporthq/platform";
import { outboxEvents } from "./schema";
import type { ExportHqTransaction, TenantContext } from "./tenant";

export async function enqueueOutboxEvent(
  tx: ExportHqTransaction,
  context: TenantContext | null,
  input: OutboxEventInput
): Promise<string> {
  const payload = { ...(input.payload ?? {}) };
  assertSafeOutboxPayload(payload);
  const organizationId = input.organizationId === undefined
    ? context?.organizationId ?? null
    : input.organizationId;

  if (context && organizationId !== context.organizationId) {
    throw new Error("A tenant command cannot enqueue work for another organization.");
  }

  const [row] = await tx
    .insert(outboxEvents)
    .values({
      organizationId,
      topic: input.topic,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      dedupeKey: input.dedupeKey,
      payload,
      availableAt: input.availableAt ?? new Date()
    })
    .onConflictDoNothing({ target: outboxEvents.dedupeKey })
    .returning({ id: outboxEvents.id });

  if (row) return row.id;
  const [existing] = await tx
    .select({ id: outboxEvents.id })
    .from(outboxEvents)
    .where(eq(outboxEvents.dedupeKey, input.dedupeKey))
    .limit(1);
  if (!existing) throw new Error("Outbox enqueue did not return an event.");
  return existing.id;
}

export async function markOutboxPublished(
  tx: ExportHqTransaction,
  eventId: string,
  now = new Date()
): Promise<void> {
  await tx.update(outboxEvents).set({ state: "published", publishedAt: now, updatedAt: now }).where(eq(outboxEvents.id, eventId));
}

export async function purgePublishedOutbox(
  tx: ExportHqTransaction,
  before: Date
): Promise<void> {
  await tx.delete(outboxEvents).where(and(eq(outboxEvents.state, "published"), lt(outboxEvents.publishedAt, before)));
}
