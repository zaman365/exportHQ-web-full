export type BuyerVerificationStatus =
  | "unverified"
  | "source_supported"
  | "provider_attested"
  | "human_reviewed"
  | "rejected";

export type BuyerRiskStatus = "not_assessed" | "low" | "medium" | "high" | "blocked";
export type OpportunityStatus = "identified" | "qualified" | "rfq_received" | "quoted" | "won" | "lost" | "archived";
export type RfqStatus = "draft" | "received" | "clarifying" | "ready_to_quote" | "quoted" | "closed" | "cancelled";
export type QuotationStatus = "draft" | "awaiting_approval" | "approved" | "sent" | "accepted" | "rejected" | "expired" | "superseded";

export interface BuyerVerificationPresentation {
  readonly label: "Not verified" | "Source supported" | "Provider attested" | "Human reviewed" | "Rejected";
  readonly mayUseVerifiedLanguage: boolean;
  readonly evidenceLevel: string | null;
  readonly verifiedAt: Date | null;
}
export function presentBuyerVerification(input: {
  readonly status: BuyerVerificationStatus;
  readonly evidenceLevel?: string | null;
  readonly verifiedAt?: Date | null;
}): BuyerVerificationPresentation {
  const evidenceLevel = input.evidenceLevel?.trim() || null;
  const verifiedAt = input.verifiedAt ?? null;
  const substantiated = Boolean(evidenceLevel && verifiedAt);
  if (input.status === "human_reviewed" && substantiated) {
    return { label: "Human reviewed", mayUseVerifiedLanguage: true, evidenceLevel, verifiedAt };
  }
  if (input.status === "provider_attested" && substantiated) {
    return { label: "Provider attested", mayUseVerifiedLanguage: false, evidenceLevel, verifiedAt };
  }
  if (input.status === "source_supported" && substantiated) {
    return { label: "Source supported", mayUseVerifiedLanguage: false, evidenceLevel, verifiedAt };
  }
  if (input.status === "rejected") {
    return { label: "Rejected", mayUseVerifiedLanguage: false, evidenceLevel, verifiedAt };
  }
  return { label: "Not verified", mayUseVerifiedLanguage: false, evidenceLevel: null, verifiedAt: null };
}

const opportunityTransitions: Readonly<Record<OpportunityStatus, readonly OpportunityStatus[]>> = {
  identified: ["qualified", "lost", "archived"],
  qualified: ["rfq_received", "lost", "archived"],
  rfq_received: ["quoted", "lost", "archived"],
  quoted: ["won", "lost", "archived"],
  won: ["archived"],
  lost: ["identified", "archived"],
  archived: []
};

const rfqTransitions: Readonly<Record<RfqStatus, readonly RfqStatus[]>> = {
  draft: ["received", "cancelled"],
  received: ["clarifying", "ready_to_quote", "cancelled"],
  clarifying: ["ready_to_quote", "cancelled"],
  ready_to_quote: ["quoted", "cancelled"],
  quoted: ["closed", "cancelled"],
  closed: [],
  cancelled: []
};

const quotationTransitions: Readonly<Record<QuotationStatus, readonly QuotationStatus[]>> = {
  draft: ["awaiting_approval", "superseded"],
  awaiting_approval: ["approved", "draft", "superseded"],
  approved: ["sent", "superseded"],
  sent: ["accepted", "rejected", "expired", "superseded"],
  accepted: ["superseded"],
  rejected: ["superseded"],
  expired: ["superseded"],
  superseded: []
};

export function assertOpportunityTransition(from: OpportunityStatus, to: OpportunityStatus): void {
  if (!opportunityTransitions[from].includes(to)) throw new Error(`Opportunity cannot move from ${from} to ${to}.`);
}

export function assertRfqTransition(from: RfqStatus, to: RfqStatus): void {
  if (!rfqTransitions[from].includes(to)) throw new Error(`RFQ cannot move from ${from} to ${to}.`);
}

export function assertQuotationTransition(from: QuotationStatus, to: QuotationStatus): void {
  if (!quotationTransitions[from].includes(to)) throw new Error(`Quotation cannot move from ${from} to ${to}.`);
}

export interface QuoteLineCalculation {
  readonly quantity: number;
  readonly unitPriceMinor: number;
  readonly lineTotalMinor: number;
}

export function calculateQuoteLine(quantity: number, unitPriceMinor: number): QuoteLineCalculation {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("Quote quantity must be a positive whole number.");
  if (!Number.isSafeInteger(unitPriceMinor) || unitPriceMinor < 0) throw new Error("Unit price must be a non-negative integer in minor units.");
  const lineTotalMinor = quantity * unitPriceMinor;
  if (!Number.isSafeInteger(lineTotalMinor)) throw new Error("Quote line total exceeds the supported money range.");
  return { quantity, unitPriceMinor, lineTotalMinor };
}

export function calculateQuoteTotal(input: {
  readonly lineTotalsMinor: readonly number[];
  readonly freightMinor: number;
  readonly testingMinor: number;
  readonly financeMinor: number;
  readonly commissionMinor: number;
  readonly fxBufferMinor: number;
}): number {
  const values = [...input.lineTotalsMinor, input.freightMinor, input.testingMinor, input.financeMinor, input.commissionMinor, input.fxBufferMinor];
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) throw new Error("Quote totals require non-negative integer minor units.");
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) throw new Error("Quote total exceeds the supported money range.");
  return total;
}
