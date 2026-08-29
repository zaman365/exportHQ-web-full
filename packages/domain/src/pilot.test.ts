import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalPrivateAlphaAgreement, firstShipmentPassHypothesis, privateAlphaAgreement } from "./pilot";

describe("Private Alpha contract", () => {
  it("keeps the offered agreement tied to exact text", () => {
    expect(createHash("sha256").update(canonicalPrivateAlphaAgreement()).digest("hex")).toBe(privateAlphaAgreement.contentHashSha256);
  });

  it("keeps First Shipment Pass manual, bounded and fully credited only as a hypothesis", () => {
    expect(firstShipmentPassHypothesis).toMatchObject({
      priceMinor: 750000,
      currency: "BDT",
      durationDays: 90,
      activeLaneLimit: 1,
      editorLimit: 3,
      annualLaunchCreditBps: 10000,
      checkoutStatus: "manual_alpha_only"
    });
  });
});
