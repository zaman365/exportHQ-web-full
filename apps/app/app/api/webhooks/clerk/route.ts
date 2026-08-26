import {
  executeIdempotently,
  hashClientAddress,
  hashRequestBody,
  isHandledWebhookEvent,
  consumeRateLimit,
  rateLimitHeaders,
  redactStructure,
  verifyWebhookSignature
} from "@exporthq/platform";
import { clientAddress, durableStoresActivated, getIdempotencyStore, getRateLimitStore } from "../../../_lib/platform-runtime";

/* Clerk delivers organization, membership, role, invitation and plan changes
   here. The handler is the security boundary for everything that follows, so
   it verifies the signature, refuses replays, deduplicates by delivery id and
   never persists a partially applied change.

   Gate 1 of docs/production-activation-todo.md replaces the process-local
   idempotency store with the PostgreSQL one and adds the transactional
   projection into tenant tables. Until then the endpoint verifies and
   acknowledges without claiming to have synchronised anything. */

export const dynamic = "force-dynamic";

type ClerkWebhookEvent = {
  type?: unknown;
  data?: { id?: unknown };
};

function json(body: Record<string, unknown>, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(init.headers ?? {}) }
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    // Failing closed keeps an unconfigured deployment from accepting forged
    // organization or plan changes.
    return json({ error: "Webhook processing is not configured." }, { status: 503 });
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

  const payload = await request.text();
  const verification = await verifyWebhookSignature({
    payload,
    headers: {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature")
    },
    secret
  });

  if (!verification.verified) {
    // The reason is logged, never returned: telling a caller *why* a signature
    // failed helps them iterate towards a valid one.
    console.warn("clerk.webhook.rejected", redactStructure({ reason: verification.reason }));
    return json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: ClerkWebhookEvent;
  try {
    event = JSON.parse(payload) as ClerkWebhookEvent;
  } catch {
    return json({ error: "Malformed payload." }, { status: 400 });
  }

  const eventType = typeof event.type === "string" ? event.type : "";
  if (!isHandledWebhookEvent(eventType)) {
    // Acknowledged so Clerk does not retry an event this deployment ignores
    // by design; enabling an event in the dashboard cannot change behaviour
    // without a matching code change.
    return json({ status: "ignored", eventType }, { status: 202 });
  }

  const outcome = await executeIdempotently({
    key: `clerk:${verification.eventId}`,
    requestHash: await hashRequestBody(payload),
    store: getIdempotencyStore(),
    execute: async () => {
      if (!durableStoresActivated()) {
        // Nothing is written while tenant persistence is unactivated. Recording
        // the delivery as "received" and stopping is the honest outcome: a
        // partial projection would be worse than none.
        console.info("clerk.webhook.received", redactStructure({ eventType, eventId: verification.eventId }));
        return { value: "received" as const, resultReference: verification.eventId };
      }
      throw new Error("Tenant projection is not implemented for this deployment.");
    }
  });

  if (outcome.status === "in-progress") {
    return json({ status: "in-progress" }, { status: 409 });
  }

  return json(
    {
      status: outcome.status === "replayed" ? "duplicate" : "accepted",
      eventType,
      persisted: durableStoresActivated()
    },
    { status: 202 }
  );
}

export async function GET(): Promise<Response> {
  return json({ error: "Method not allowed." }, { status: 405 });
}
