import { describe, expect, it } from "vitest";
import { assertSelfServiceBillingActivation, assertValidatedPaymentNotification, sslCommerzCandidate } from "./public-beta";

describe("R4 payment provider boundary", () => {
  it("keeps SSLCOMMERZ a candidate until every activation review exists", () => {
    expect(sslCommerzCandidate.status).toBe("candidate");
    expect(() => assertSelfServiceBillingActivation({
      provider: "sslcommerz",
      commercialReviewReference: "review://commercial/1",
      legalReviewReference: "review://legal/1",
      securityReviewReference: "review://security/1",
      taxReviewReference: "review://tax/1",
      cancellationEvidenceReference: "evidence://cancel/1",
      invoiceEvidenceReference: "evidence://invoice/1",
      refundEvidenceReference: "evidence://refund/1",
      dunningEvidenceReference: "evidence://dunning/1",
      entitlementRollbackEvidenceReference: "evidence://rollback/1",
      reconciliationEvidenceReference: "evidence://reconcile/1",
      liveCredentialSecretRef: "secret://cloudflare/sslcommerz",
      providerStatus: "approved"
    })).toThrow(/active/);
  });

  it("rejects a provider-validated payment when amount identity drifts", () => {
    expect(() => assertValidatedPaymentNotification({
      provider: "sslcommerz",
      providerEventId: "event-1",
      providerTransactionId: "bank-1",
      merchantTransactionId: "checkout-1",
      status: "VALID",
      amountMinor: 100,
      currency: "BDT",
      riskLevel: "safe",
      providerValidationReference: "validation://1",
      payloadHashSha256: "a".repeat(64)
    }, { merchantTransactionId: "checkout-1", amountMinor: 200, currency: "BDT" })).toThrow(/does not match/);
  });
});
