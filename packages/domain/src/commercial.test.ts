import { describe, expect, it } from "vitest";
import {
  assertOpportunityTransition,
  assertQuotationTransition,
  assertRfqTransition,
  calculateQuoteLine,
  calculateQuoteTotal,
  presentBuyerVerification
} from "./commercial";

describe("R3 commercial invariants", () => {
  it("never represents a buyer as verified without level and date", () => {
    expect(presentBuyerVerification({ status: "human_reviewed" }).mayUseVerifiedLanguage).toBe(false);
    expect(presentBuyerVerification({ status: "human_reviewed", evidenceLevel: "registry+call", verifiedAt: new Date("2026-08-29") })).toMatchObject({
      label: "Human reviewed",
      mayUseVerifiedLanguage: true
    });
    expect(presentBuyerVerification({ status: "provider_attested", evidenceLevel: "provider-basic", verifiedAt: new Date("2026-08-29") }).mayUseVerifiedLanguage).toBe(false);
  });

  it("enforces opportunity, RFQ and quote state machines", () => {
    expect(() => assertOpportunityTransition("identified", "qualified")).not.toThrow();
    expect(() => assertOpportunityTransition("identified", "won")).toThrow();
    expect(() => assertRfqTransition("received", "ready_to_quote")).not.toThrow();
    expect(() => assertRfqTransition("received", "quoted")).toThrow();
    expect(() => assertQuotationTransition("approved", "sent")).not.toThrow();
    expect(() => assertQuotationTransition("draft", "sent")).toThrow();
  });

  it("uses checked integer minor units for quote totals", () => {
    expect(calculateQuoteLine(12, 2500).lineTotalMinor).toBe(30000);
    expect(calculateQuoteTotal({ lineTotalsMinor: [30000], freightMinor: 5000, testingMinor: 1000, financeMinor: 500, commissionMinor: 2000, fxBufferMinor: 1500 })).toBe(40000);
    expect(() => calculateQuoteLine(0, 10)).toThrow();
  });
});
