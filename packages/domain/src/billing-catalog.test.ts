import { describe, expect, it } from "vitest";
import { pricingHypotheses, validatePricingCatalog } from "./billing-catalog";

describe("billing catalog hypotheses", () => {
  it("keeps all proposed prices configurable and in BDT minor units", () => {
    expect(() => validatePricingCatalog(pricingHypotheses)).not.toThrow();
    expect(pricingHypotheses.find((item) => item.productKey === "first_shipment_pass")?.amountMinor).toBe(750000);
    expect(pricingHypotheses.filter((item) => item.productKey === "launch").map((item) => item.amountMinor)).toEqual([747000, 2490000]);
  });
});
