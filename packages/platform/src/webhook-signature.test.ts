import { describe, expect, it } from "vitest";
import { constantTimeEquals, isHandledWebhookEvent, verifyWebhookSignature } from "./webhook-signature";

const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const payload = JSON.stringify({ type: "organization.created", data: { id: "org_1" } });
const id = "msg_2abc";

async function sign(timestamp: string, body = payload, messageId = id): Promise<string> {
  const raw = atob(secret.replace(/^whsec_/, ""));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  const key = await crypto.subtle.importKey(
    "raw",
    bytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${messageId}.${timestamp}.${body}`) as unknown as ArrayBuffer
  );
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return `v1,${btoa(binary)}`;
}

const now = new Date("2026-08-26T09:00:00.000Z");
const timestamp = String(Math.floor(now.getTime() / 1000));

describe("webhook signature verification", () => {
  it("accepts a correctly signed, fresh delivery", async () => {
    const result = await verifyWebhookSignature({
      payload,
      headers: { id, timestamp, signature: await sign(timestamp) },
      secret,
      now
    });
    expect(result).toEqual({ verified: true, eventId: id });
  });

  it("accepts a delivery when any offered signature matches, so rotation does not drop events", async () => {
    const signature = `v1,AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKK= ${await sign(timestamp)}`;
    const result = await verifyWebhookSignature({ payload, headers: { id, timestamp, signature }, secret, now });
    expect(result.verified).toBe(true);
  });

  it("refuses a tampered payload", async () => {
    const result = await verifyWebhookSignature({
      payload: JSON.stringify({ type: "organization.created", data: { id: "org_attacker" } }),
      headers: { id, timestamp, signature: await sign(timestamp) },
      secret,
      now
    });
    expect(result).toEqual({ verified: false, reason: "no-matching-signature" });
  });

  it("refuses a replayed delivery outside the timestamp tolerance", async () => {
    const stale = String(Math.floor(now.getTime() / 1000) - 3600);
    const result = await verifyWebhookSignature({
      payload,
      headers: { id, timestamp: stale, signature: await sign(stale) },
      secret,
      now
    });
    expect(result).toEqual({ verified: false, reason: "timestamp-outside-tolerance" });
  });

  it("refuses a delivery whose signature was made for a different message id", async () => {
    const result = await verifyWebhookSignature({
      payload,
      headers: { id: "msg_other", timestamp, signature: await sign(timestamp) },
      secret,
      now
    });
    expect(result.verified).toBe(false);
  });

  it("refuses when headers or the secret are absent", async () => {
    expect(
      await verifyWebhookSignature({ payload, headers: { id, timestamp, signature: null }, secret, now })
    ).toEqual({ verified: false, reason: "missing-headers" });
    expect(
      await verifyWebhookSignature({ payload, headers: { id, timestamp, signature: "v1,x" }, secret: "", now })
    ).toEqual({ verified: false, reason: "missing-secret" });
  });

  it("refuses a malformed timestamp", async () => {
    const result = await verifyWebhookSignature({
      payload,
      headers: { id, timestamp: "not-a-timestamp", signature: "v1,x" },
      secret,
      now
    });
    expect(result).toEqual({ verified: false, reason: "malformed-timestamp" });
  });
});

describe("handled events", () => {
  it("recognises the synchronised Clerk events", () => {
    expect(isHandledWebhookEvent("organizationMembership.updated")).toBe(true);
    expect(isHandledWebhookEvent("session.created")).toBe(false);
  });
});

describe("constant time comparison", () => {
  it("matches identical values and rejects different lengths", () => {
    expect(constantTimeEquals("abc", "abc")).toBe(true);
    expect(constantTimeEquals("abc", "abd")).toBe(false);
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
  });
});
