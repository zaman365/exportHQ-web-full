export interface CustomerWebhookSigningInput {
  readonly deliveryId: string;
  readonly timestampSeconds: number;
  readonly payloadBytes: Uint8Array;
  readonly secretBytes: Uint8Array;
}

export async function signCustomerWebhook(input: CustomerWebhookSigningInput): Promise<string> {
  if (!input.deliveryId.trim()) throw new Error("Customer webhook delivery requires an identifier.");
  if (!Number.isSafeInteger(input.timestampSeconds) || input.timestampSeconds <= 0) throw new Error("Customer webhook timestamp is invalid.");
  if (input.secretBytes.byteLength < 32) throw new Error("Customer webhook secret must contain at least 256 bits.");
  const secret = Uint8Array.from(input.secretBytes);
  const key = await crypto.subtle.importKey("raw", secret.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prefix = new TextEncoder().encode(`${input.timestampSeconds}.${input.deliveryId}.`);
  const message = new Uint8Array(prefix.byteLength + input.payloadBytes.byteLength);
  message.set(prefix);
  message.set(input.payloadBytes, prefix.byteLength);
  const signature = await crypto.subtle.sign("HMAC", key, message);
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertCustomerWebhookReplayWindow(input: {
  readonly timestampSeconds: number;
  readonly nowSeconds: number;
  readonly maximumAgeSeconds?: number;
}): void {
  const maximumAgeSeconds = input.maximumAgeSeconds ?? 300;
  if (!Number.isSafeInteger(input.timestampSeconds) || !Number.isSafeInteger(input.nowSeconds) || maximumAgeSeconds <= 0) throw new Error("Customer webhook replay window is invalid.");
  if (Math.abs(input.nowSeconds - input.timestampSeconds) > maximumAgeSeconds) throw new Error("Customer webhook is outside the replay window.");
}

export function assertReviewedApiScope(scope: string): void {
  const allowed = new Set(["shipment:read", "shipment:event:read", "invoice:read", "payment:read", "document:approved:read"]);
  if (!allowed.has(scope)) throw new Error("Customer API scope is not in the reviewed allowlist.");
}
