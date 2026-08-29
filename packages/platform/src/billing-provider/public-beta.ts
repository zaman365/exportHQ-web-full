export const sslCommerzCandidate = {
  provider: "sslcommerz",
  status: "candidate" as const,
  currency: "BDT" as const,
  checkoutMode: "hosted_redirect" as const,
  documentationUrl: "https://developer.sslcommerz.com/doc/v4/index.html",
  sandboxBaseUrl: "https://sandbox.sslcommerz.com",
  liveBaseUrl: "https://securepay.sslcommerz.com",
  notificationValidation: "hash_and_order_validation_api" as const
};

export interface SelfServiceBillingActivationEvidence {
  readonly provider: string;
  readonly commercialReviewReference: string;
  readonly legalReviewReference: string;
  readonly securityReviewReference: string;
  readonly taxReviewReference: string;
  readonly cancellationEvidenceReference: string;
  readonly invoiceEvidenceReference: string;
  readonly refundEvidenceReference: string;
  readonly dunningEvidenceReference: string;
  readonly entitlementRollbackEvidenceReference: string;
  readonly reconciliationEvidenceReference: string;
  readonly liveCredentialSecretRef: string;
  readonly providerStatus: "approved" | "active" | "suspended";
}

export function assertSelfServiceBillingActivation(evidence: SelfServiceBillingActivationEvidence): void {
  if (evidence.providerStatus !== "active") throw new Error("Self-service billing requires an active reviewed provider configuration.");
  for (const [key, value] of Object.entries(evidence)) {
    if (key === "providerStatus") continue;
    if (typeof value !== "string" || !value.trim()) throw new Error(`Self-service billing activation is missing ${key}.`);
    if (/pending|todo|tbd|placeholder/i.test(value)) throw new Error(`Self-service billing activation ${key} is not final evidence.`);
  }
  if (!evidence.liveCredentialSecretRef.startsWith("secret://")) throw new Error("Live billing credentials must be represented by a managed secret reference.");
}

export interface ValidatedPaymentNotification {
  readonly provider: string;
  readonly providerEventId: string;
  readonly providerTransactionId: string;
  readonly merchantTransactionId: string;
  readonly status: "VALID" | "VALIDATED";
  readonly amountMinor: number;
  readonly currency: "BDT";
  readonly riskLevel: "safe" | "risky";
  readonly providerValidationReference: string;
  readonly payloadHashSha256: string;
}

export function assertValidatedPaymentNotification(input: ValidatedPaymentNotification, expected: {
  readonly merchantTransactionId: string;
  readonly amountMinor: number;
  readonly currency: "BDT";
}): void {
  if (!input.providerEventId.trim() || !input.providerTransactionId.trim()) throw new Error("Payment notification requires provider identifiers.");
  if (!input.providerValidationReference.trim()) throw new Error("Payment notification requires provider validation evidence.");
  if (!/^[a-f0-9]{64}$/.test(input.payloadHashSha256)) throw new Error("Payment notification requires a payload SHA-256 hash.");
  if (input.merchantTransactionId !== expected.merchantTransactionId || input.amountMinor !== expected.amountMinor || input.currency !== expected.currency) {
    throw new Error("Payment notification does not match the authoritative checkout session.");
  }
}
