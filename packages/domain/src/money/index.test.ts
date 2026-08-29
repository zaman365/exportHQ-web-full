import { describe, expect, it } from "vitest";
import { calculateExactCommercialScenario, convertMoney, money } from "./index";

const usd = (minor: bigint) => money(minor, "USD");

const baseInput = {
  incoterm: "DDP" as const,
  units: 100n,
  unitExFactory: usd(1_000n),
  unitPackaging: usd(100n),
  quoteUnit: usd(2_000n),
  inland: usd(5_000n),
  documentation: usd(2_000n),
  testing: usd(3_000n),
  freight: usd(10_000n),
  insuranceBps: 100,
  commissionBps: 200,
  financeBps: 100,
  fxBufferBps: 100,
  dutyBps: 1_000,
  dutyResponsibility: "seller" as const,
  destinationTaxBps: 2_000,
  destinationTaxResponsibility: "seller" as const,
  destinationTaxRecoverable: false,
  brokerage: usd(2_500n),
  brokerageResponsibility: "seller" as const,
  lastMile: usd(4_000n),
  lastMileResponsibility: "seller" as const,
  importerOfRecord: usd(1_500n),
  importerOfRecordResponsibility: "seller" as const,
  targetMarginBps: 1_000
};

describe("exact commercial money", () => {
  it("includes every seller-borne DDP cost in the transparent ledger", () => {
    const result = calculateExactCommercialScenario(baseInput);
    const included = result.ledger.filter((line) => line.includedInSellerCost);
    expect(included.map((line) => line.category)).toEqual(expect.arrayContaining([
      "duty",
      "destination_tax",
      "brokerage",
      "last_mile",
      "importer_of_record"
    ]));
    expect(result.sellerCost.minor).toBe(included.reduce((total, line) => total + line.amount.minor, 0n));
  });

  it("does not treat recoverable or buyer-borne destination tax as seller cost", () => {
    const recoverable = calculateExactCommercialScenario({ ...baseInput, destinationTaxRecoverable: true });
    const buyerBorne = calculateExactCommercialScenario({
      ...baseInput,
      destinationTaxResponsibility: "buyer",
      destinationTaxRecoverable: false
    });
    const recoverableTax = recoverable.ledger.find((line) => line.category === "destination_tax");
    const buyerTax = buyerBorne.ledger.find((line) => line.category === "destination_tax");
    expect(recoverableTax?.includedInSellerCost).toBe(false);
    expect(buyerTax?.includedInSellerCost).toBe(false);
  });

  it("uses fixed integer arithmetic and retains FX provenance", () => {
    const result = convertMoney(usd(10_001n), {
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      numerator: 9_250n,
      denominator: 10_000n,
      source: "ECB reference feed",
      retrievedAt: "2026-08-29T10:00:00.000Z"
    });
    expect(result).toEqual({ currency: "EUR", minor: 9_251n });
  });

  it("warns when DDP responsibilities are not explicitly seller-borne", () => {
    const result = calculateExactCommercialScenario({ ...baseInput, brokerageResponsibility: "buyer" });
    expect(result.warnings).toContain("DDP responsibility is incomplete: duty, brokerage, last mile and importer-of-record costs normally require an explicit seller assumption.");
  });
});
