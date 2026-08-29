export interface CleanupJobSchedule {
  readonly idempotencyKeysBefore: Date;
  readonly rateLimitCountersBefore: Date;
  readonly publishedOutboxBefore: Date;
  readonly processedWebhookDeliveriesBefore: Date;
  readonly deadLetterWebhookDeliveriesBefore: Date;
}

/** One deterministic schedule for the platform cleanup worker. */
export function platformCleanupSchedule(now = new Date()): CleanupJobSchedule {
  return {
    idempotencyKeysBefore: now,
    rateLimitCountersBefore: now,
    publishedOutboxBefore: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    processedWebhookDeliveriesBefore: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    deadLetterWebhookDeliveriesBefore: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  };
}
