/**
 * Clerk webhook verification.
 *
 * Clerk signs with the Svix scheme: an `svix-id`, an `svix-timestamp`, and a
 * space-separated `svix-signature` list of `v1,<base64 hmac>` entries. Every
 * property that keeps a webhook trustworthy is checked here — signature,
 * timestamp freshness, and a constant-time comparison — so a route handler
 * cannot accidentally skip one.
 */

export interface WebhookVerificationInput {
  readonly payload: string;
  readonly headers: {
    readonly id: string | null;
    readonly timestamp: string | null;
    readonly signature: string | null;
  };
  /** The `whsec_...` signing secret from the Clerk dashboard. */
  readonly secret: string;
  readonly now?: Date;
  readonly toleranceSeconds?: number;
}

export type WebhookVerificationFailure =
  | "missing-headers"
  | "missing-secret"
  | "malformed-timestamp"
  | "timestamp-outside-tolerance"
  | "no-matching-signature";

export type WebhookVerificationResult =
  | { readonly verified: true; readonly eventId: string }
  | { readonly verified: false; readonly reason: WebhookVerificationFailure };

const defaultToleranceSeconds = 300;

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Comparison that does not leak how much of the signature matched. */
export function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyWebhookSignature(input: WebhookVerificationInput): Promise<WebhookVerificationResult> {
  const { id, timestamp, signature } = input.headers;
  if (!input.secret) return { verified: false, reason: "missing-secret" };
  if (!id || !timestamp || !signature) return { verified: false, reason: "missing-headers" };

  const sentAtSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(sentAtSeconds)) return { verified: false, reason: "malformed-timestamp" };

  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const tolerance = input.toleranceSeconds ?? defaultToleranceSeconds;
  if (Math.abs(nowSeconds - sentAtSeconds) > tolerance) {
    return { verified: false, reason: "timestamp-outside-tolerance" };
  }

  const secretBytes = decodeBase64(input.secret.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${input.payload}`) as unknown as ArrayBuffer
  );
  const expected = encodeBase64(new Uint8Array(signed));

  // Svix sends every currently valid signature so that secret rotation does not
  // drop deliveries; any one match is sufficient.
  const candidates = signature
    .split(" ")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("v1,"))
    .map((entry) => entry.slice(3));

  for (const candidate of candidates) {
    if (constantTimeEquals(candidate, expected)) return { verified: true, eventId: id };
  }
  return { verified: false, reason: "no-matching-signature" };
}

/**
 * The webhook events Export HQ synchronises. Anything outside this list is
 * acknowledged and ignored, so enabling extra events in the dashboard cannot
 * change application behaviour without a code change.
 */
export const handledWebhookEventTypes = [
  "user.created",
  "user.updated",
  "user.deleted",
  "organization.created",
  "organization.updated",
  "organization.deleted",
  "organizationMembership.created",
  "organizationMembership.updated",
  "organizationMembership.deleted",
  "organizationInvitation.created",
  "organizationInvitation.accepted",
  "organizationInvitation.revoked",
  "organizationDomain.created",
  "role.created",
  "role.updated",
  "role.deleted",
  "subscription.created",
  "subscription.updated",
  "subscriptionItem.active",
  "subscriptionItem.canceled"
] as const;

export type HandledWebhookEventType = (typeof handledWebhookEventTypes)[number];

export function isHandledWebhookEvent(type: string): type is HandledWebhookEventType {
  return (handledWebhookEventTypes as readonly string[]).includes(type);
}
