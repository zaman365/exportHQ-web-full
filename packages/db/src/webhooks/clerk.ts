import { and, eq, sql } from "drizzle-orm";
import {
  maximumDeliveryAttempts,
  parseClerkEvent,
  retryDelaySeconds
} from "@exporthq/platform";
import { recordPlatformAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import { webhookDeliveries } from "../schema";
import { withPlatformTransaction, type ExportHqTransaction } from "../tenant";
import type { ExportHqDatabase } from "../index";
import {
  deactivateOrganization,
  projectMembership,
  provisionOrganization,
  resolveOrganizationId
} from "../repositories/organizations";

export type ClerkWebhookProcessResult =
  | { readonly status: "processed" | "ignored"; readonly duplicate: boolean; readonly organizationId: string | null }
  | { readonly status: "failed" | "dead_letter"; readonly duplicate: false; readonly organizationId: null };

export class WebhookPayloadConflictError extends Error {
  constructor() {
    super("A provider delivery id was reused with a different payload hash.");
    this.name = "WebhookPayloadConflictError";
  }
}

const systemActor = { actorId: "clerk-webhook", actorType: "system" as const };

async function resolveOptionalOrganization(
  tx: ExportHqTransaction,
  clerkOrganizationId: string | null
): Promise<string | null> {
  return clerkOrganizationId ? resolveOrganizationId(tx, clerkOrganizationId) : null;
}

export async function processClerkWebhookDelivery(
  database: ExportHqDatabase,
  input: {
    readonly eventId: string;
    readonly eventType: string;
    readonly payloadHash: string;
    readonly payload: Record<string, unknown>;
  }
): Promise<ClerkWebhookProcessResult> {
  try {
    return await withPlatformTransaction(database, systemActor, async (tx) => {
      const now = new Date();
      const [claimed] = await tx
        .insert(webhookDeliveries)
        .values({
          provider: "clerk",
          eventId: input.eventId,
          eventType: input.eventType,
          state: "received",
          attempts: 1,
          payloadHash: input.payloadHash,
          payload: input.payload,
          receivedAt: now,
          lastAttemptAt: now
        })
        .onConflictDoNothing({ target: [webhookDeliveries.provider, webhookDeliveries.eventId] })
        .returning({ id: webhookDeliveries.id });

      const [existing] = claimed ? [] : await tx
        .select()
        .from(webhookDeliveries)
        .where(and(
          eq(webhookDeliveries.provider, "clerk"),
          eq(webhookDeliveries.eventId, input.eventId)
        ))
        .limit(1);

      if (existing?.payloadHash !== undefined && existing.payloadHash !== input.payloadHash) {
        throw new WebhookPayloadConflictError();
      }
      if (existing?.state === "processed" || existing?.state === "ignored") {
        return { status: existing.state, duplicate: true, organizationId: null };
      }

      if (existing) {
        await tx.update(webhookDeliveries).set({
          state: "received",
          attempts: sql`${webhookDeliveries.attempts} + 1`,
          lastAttemptAt: now,
          nextAttemptAt: null,
          failureReason: null
        }).where(eq(webhookDeliveries.id, existing.id));
      }

      const parsed = parseClerkEvent(input.payload);
      let organizationId: string | null = null;

      switch (parsed.command.kind) {
        case "organization-upsert": {
          const projected = await provisionOrganization(tx, {
            clerkOrganizationId: parsed.command.clerkOrganizationId,
            slug: parsed.command.slug,
            legalName: parsed.command.legalName,
            tradingName: parsed.command.tradingName
          }, systemActor);
          organizationId = projected.organizationId;
          break;
        }
        case "organization-deactivate":
          organizationId = await deactivateOrganization(tx, parsed.command.clerkOrganizationId, systemActor);
          break;
        case "membership-upsert": {
          organizationId = await resolveOrganizationId(tx, parsed.command.clerkOrganizationId);
          if (!organizationId) throw new Error("Membership arrived before its organization projection.");
          await projectMembership(tx, organizationId, {
            clerkUserId: parsed.command.clerkUserId,
            role: parsed.command.role,
            active: parsed.command.active
          }, systemActor);
          break;
        }
        case "reconciliation-request": {
          organizationId = await resolveOptionalOrganization(tx, parsed.command.clerkOrganizationId);
          await recordPlatformAuditEvent(tx, systemActor, {
            action: "identity.reconciliation_requested",
            entityType: "identity_projection",
            entityId: organizationId ?? parsed.command.clerkOrganizationId ?? parsed.command.scope,
            metadata: { scope: parsed.command.scope, eventType: parsed.type }
          });
          await enqueueOutboxEvent(tx, null, {
            organizationId,
            topic: "identity.reconciliation.requested",
            aggregateType: "identity_projection",
            aggregateId: organizationId ?? parsed.command.scope,
            dedupeKey: `clerk-reconcile:${input.eventId}`,
            payload: { scope: parsed.command.scope, eventType: parsed.type }
          });
          break;
        }
        case "ignored":
          break;
      }

      const state = parsed.handled ? "processed" as const : "ignored" as const;
      await tx.update(webhookDeliveries).set({
        state,
        processedAt: now,
        lastAttemptAt: now,
        nextAttemptAt: null,
        failureReason: null
      }).where(and(
        eq(webhookDeliveries.provider, "clerk"),
        eq(webhookDeliveries.eventId, input.eventId)
      ));

      if (parsed.handled) {
        await enqueueOutboxEvent(tx, null, {
          organizationId,
          topic: "identity.projection.completed",
          aggregateType: "webhook_delivery",
          aggregateId: input.eventId,
          dedupeKey: `clerk-projected:${input.eventId}`,
          payload: { eventType: parsed.type }
        });
      }

      return { status: state, duplicate: false, organizationId };
    });
  } catch (error) {
    if (error instanceof WebhookPayloadConflictError) throw error;
    return withPlatformTransaction(database, systemActor, async (tx) => {
      const now = new Date();
      const [previous] = await tx.select({ attempts: webhookDeliveries.attempts })
        .from(webhookDeliveries)
        .where(and(
          eq(webhookDeliveries.provider, "clerk"),
          eq(webhookDeliveries.eventId, input.eventId)
        ))
        .limit(1);
      const attempts = (previous?.attempts ?? 0) + 1;
      const deadLetter = attempts >= maximumDeliveryAttempts;
      const delay = retryDelaySeconds(attempts);
      const state = deadLetter ? "dead_letter" as const : "failed" as const;
      await tx.insert(webhookDeliveries).values({
        provider: "clerk",
        eventId: input.eventId,
        eventType: input.eventType,
        state,
        attempts,
        payloadHash: input.payloadHash,
        payload: input.payload,
        failureReason: error instanceof Error ? error.name : "ProjectionError",
        receivedAt: now,
        lastAttemptAt: now,
        nextAttemptAt: deadLetter || delay < 0 ? null : new Date(now.getTime() + delay * 1000)
      }).onConflictDoUpdate({
        target: [webhookDeliveries.provider, webhookDeliveries.eventId],
        set: {
          state,
          attempts,
          failureReason: error instanceof Error ? error.name : "ProjectionError",
          lastAttemptAt: now,
          nextAttemptAt: deadLetter || delay < 0 ? null : new Date(now.getTime() + delay * 1000)
        }
      });
      return { status: state, duplicate: false, organizationId: null };
    });
  }
}

export async function requestClerkWebhookReplay(
  database: ExportHqDatabase,
  input: { readonly eventId: string; readonly actorId: string }
): Promise<boolean> {
  if (!input.actorId.trim()) throw new Error("A platform operator is required to request replay.");
  return withPlatformTransaction(database, { actorId: input.actorId, actorType: "staff" }, async (tx) => {
    const now = new Date();
    const rows = await tx.update(webhookDeliveries).set({
      state: "received",
      nextAttemptAt: now,
      failureReason: null
    }).where(and(
      eq(webhookDeliveries.provider, "clerk"),
      eq(webhookDeliveries.eventId, input.eventId)
    )).returning({ id: webhookDeliveries.id });
    if (!rows[0]) return false;
    await enqueueOutboxEvent(tx, null, {
      topic: "identity.webhook.replay_requested",
      aggregateType: "webhook_delivery",
      aggregateId: input.eventId,
      dedupeKey: `clerk-replay:${input.eventId}:${now.toISOString()}`,
      payload: { requestedBy: input.actorId }
    });
    return true;
  });
}
