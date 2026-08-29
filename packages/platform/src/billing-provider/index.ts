export interface BillingProviderWebhookEnvelope {
  readonly provider: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly payloadBytes: Uint8Array;
  readonly signature: string;
  readonly receivedAt: Date;
}
export interface BillingProviderAdapter {
  readonly provider: string;
  /** R3 adapters must return false. R4 may activate only after its gate. */
  readonly selfServiceEnabled: boolean;
  verifyWebhook(input: BillingProviderWebhookEnvelope): Promise<{ readonly verified: boolean; readonly payloadHashSha256: string }>;
  reconcile(input: { readonly periodStart: Date; readonly periodEnd: Date }): Promise<{
    readonly expectedMinor: number;
    readonly receivedMinor: number;
    readonly creditedMinor: number;
    readonly refundedMinor: number;
    readonly evidenceReference: string;
  }>;
}

export function assertR3BillingAdapter(adapter: BillingProviderAdapter): void {
  if (adapter.selfServiceEnabled) throw new Error("R3 billing adapters cannot enable self-service checkout.");
  if (!adapter.provider.trim()) throw new Error("Billing adapter requires a provider identifier.");
}

export function reconciliationVariance(input: {
  readonly expectedMinor: number;
  readonly receivedMinor: number;
  readonly creditedMinor: number;
  readonly refundedMinor: number;
}): number {
  const values = [input.expectedMinor, input.receivedMinor, input.creditedMinor, input.refundedMinor];
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) throw new Error("Billing reconciliation requires non-negative integer minor units.");
  return input.receivedMinor + input.creditedMinor - input.refundedMinor - input.expectedMinor;
}
