import { describe, expect, it } from "vitest";
import { assertR3BillingAdapter, reconciliationVariance } from "./index";

const adapter = {
  provider: "manual",
  selfServiceEnabled: false,
  verifyWebhook: async () => ({ verified: true, payloadHashSha256: "a".repeat(64) }),
  reconcile: async () => ({ expectedMinor: 100, receivedMinor: 100, creditedMinor: 0, refundedMinor: 0, evidenceReference: "manual" })
};

describe("R3 billing provider boundary", () => {
  it("keeps self-service disabled and reconciles in minor units", () => {
    expect(() => assertR3BillingAdapter(adapter)).not.toThrow();
    expect(() => assertR3BillingAdapter({ ...adapter, selfServiceEnabled: true })).toThrow(/cannot enable/);
    expect(reconciliationVariance({ expectedMinor: 100, receivedMinor: 90, creditedMinor: 10, refundedMinor: 0 })).toBe(0);
  });
});
