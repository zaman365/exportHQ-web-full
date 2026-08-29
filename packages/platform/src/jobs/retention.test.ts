import { describe, expect, it } from "vitest";
import { platformCleanupSchedule } from "./retention";

describe("platformCleanupSchedule", () => {
  it("bounds durable control and webhook payload retention", () => {
    const now = new Date("2026-08-29T12:00:00.000Z");
    expect(platformCleanupSchedule(now)).toEqual({
      idempotencyKeysBefore: now,
      rateLimitCountersBefore: now,
      publishedOutboxBefore: new Date("2026-07-30T12:00:00.000Z"),
      processedWebhookDeliveriesBefore: new Date("2026-07-30T12:00:00.000Z"),
      deadLetterWebhookDeliveriesBefore: new Date("2026-05-31T12:00:00.000Z")
    });
  });
});
