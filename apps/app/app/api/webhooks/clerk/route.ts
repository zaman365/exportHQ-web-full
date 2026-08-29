import {
  hashClientAddress,
  hashRequestBody,
  consumeRateLimit,
  rateLimitHeaders,
  structuredLogLine,
  verifyWebhookSignature
} from "@exporthq/platform";
import { processClerkWebhookDelivery, WebhookPayloadConflictError } from "@exporthq/db";
import { getPlatformDatabase } from "../../../_lib/database";
import {
  assertPlatformStoresHealthy,
  clientAddress,
  DurablePlatformStoreUnavailableError,
  getRateLimitStore
} from "../../../_lib/platform-runtime";

/**
 * Clerk delivery boundary.
 *
 * Signature and timestamp are verified before business parsing. Every valid
 * delivery—including an unreviewed event—is then durably recorded. Projection,
 * audit, outbox and processed state commit as one database transaction.
 */

export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(init.headers ?? {}) }
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook processing is not configured." }, { status: 503 });

  try {
    await assertPlatformStoresHealthy();
  } catch (error) {
    if (error instanceof DurablePlatformStoreUnavailableError) {
      return json({ error: error.userFacingMessage }, { status: 503 });
    }
    console.error(structuredLogLine("clerk.webhook.store_unhealthy", { error }));
    return json({ error: "Webhook processing is temporarily unavailable." }, { status: 503 });
  }

  const addressHash = await hashClientAddress(clientAddress(request), secret);
  const limit = await consumeRateLimit({
    action: "webhook-delivery",
    subject: addressHash,
    store: getRateLimitStore()
  });
  if (!limit.allowed) {
    return json({ error: "Too many deliveries." }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const payloadText = await request.text();
  const verification = await verifyWebhookSignature({
    payload: payloadText,
    headers: {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature")
    },
    secret
  });
  if (!verification.verified) {
    console.warn(structuredLogLine("clerk.webhook.rejected", { reason: verification.reason }));
    return json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(payloadText);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Malformed payload." }, { status: 400 });
  }

  const eventType = typeof payload.type === "string" ? payload.type : "unknown";
  const database = getPlatformDatabase();
  if (!database) return json({ error: "Webhook processing is temporarily unavailable." }, { status: 503 });

  try {
    const result = await processClerkWebhookDelivery(database, {
      eventId: verification.eventId,
      eventType,
      payloadHash: await hashRequestBody(payloadText),
      payload
    });

    if (result.status === "failed") {
      return json({ status: "retry", eventType }, { status: 503 });
    }
    if (result.status === "dead_letter") {
      return json({ status: "dead-letter", eventType }, { status: 202 });
    }
    return json({
      status: result.duplicate ? "duplicate" : result.status,
      eventType,
      persisted: true
    }, { status: result.duplicate ? 200 : 202 });
  } catch (error) {
    if (error instanceof WebhookPayloadConflictError) {
      return json({ error: "Delivery identifier conflict." }, { status: 409 });
    }
    console.error(structuredLogLine("clerk.webhook.failed", { error, eventType }));
    return json({ error: "Webhook processing failed." }, { status: 503 });
  }
}

export async function GET(): Promise<Response> {
  return json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
