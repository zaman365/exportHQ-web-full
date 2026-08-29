import { and, eq, lt, sql } from "drizzle-orm";
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

  const eventId = await deterministicEventId(input.dedupeKey);
  const availableAt = input.availableAt ?? new Date();
  await tx.execute(sql`select app_enqueue_outbox_event(
    ${eventId}::uuid,
    ${organizationId}::uuid,
    ${input.topic},
    ${input.aggregateType},
    ${input.aggregateId},
    ${input.dedupeKey},
    ${JSON.stringify(payload)}::jsonb,
    ${availableAt.toISOString()}::timestamptz
  )`);
  /* Tenant actors intentionally have INSERT but no SELECT on the outbox. A
     narrow database function catches only the dedupe-key unique violation.
     This preserves retry safety without adding a read policy or RETURNING,
     either of which would expose internal delivery state. */
  return eventId;
}

async function deterministicEventId(dedupeKey: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey)));
  digest[6] = ((digest[6] ?? 0) & 0x0f) | 0x80;
  digest[8] = ((digest[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(digest.slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
