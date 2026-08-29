import { describe, expect, it } from "vitest";
import { assertCustomerWebhookReplayWindow, assertReviewedApiScope, signCustomerWebhook } from "./index";

describe("customer webhook controls", () => {
  it("signs an exact delivery and rejects stale replay", async () => {
    const secretBytes = new Uint8Array(32).fill(7);
    const first = await signCustomerWebhook({ deliveryId: "delivery-1", timestampSeconds: 10, payloadBytes: new TextEncoder().encode("{}"), secretBytes });
    const replay = await signCustomerWebhook({ deliveryId: "delivery-1", timestampSeconds: 10, payloadBytes: new TextEncoder().encode("{}"), secretBytes });
    expect(first).toBe(replay);
    expect(first).toHaveLength(64);
    expect(() => assertCustomerWebhookReplayWindow({ timestampSeconds: 10, nowSeconds: 311 })).toThrow(/replay/);
  });

  it("does not allow a broad export scope", () => {
    expect(() => assertReviewedApiScope("shipment:read")).not.toThrow();
    expect(() => assertReviewedApiScope("data:export")).toThrow(/allowlist/);
  });
});
