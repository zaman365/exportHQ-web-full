/**
 * Durable outbox contract shared by commands and dispatchers.
 *
 * Payloads contain identifiers and safe routing metadata only. Evidence,
 * message bodies, credentials and signed access stay in their authoritative
 * stores and are loaded after the worker re-authorizes the job.
 */
export type OutboxEventState = "pending" | "processing" | "published" | "dead_letter";

export interface OutboxEventInput {
  readonly organizationId?: string | null;
  readonly topic: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly dedupeKey: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly availableAt?: Date;
}

const unsafeOutboxKey =
  /(password|secret|token|credential|authorization|cookie|api[-_]?key|signed[-_]?url|body|content|attachment|evidence)/i;

export function assertSafeOutboxPayload(payload: Readonly<Record<string, unknown>>): void {
  for (const key of Object.keys(payload)) {
    if (unsafeOutboxKey.test(key)) {
      throw new Error(`Outbox payload may not carry "${key}".`);
    }
  }
}
