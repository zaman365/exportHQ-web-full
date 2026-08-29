export interface MailboxProviderReviewEvidence {
  readonly provider: string;
  readonly reviewedScopes: readonly string[];
  readonly oauthScopeReviewReference: string;
  readonly legalReviewReference: string;
  readonly securityReviewReference: string;
  readonly reviewedAt: Date;
  readonly expiresAt: Date;
}
export interface MailboxProviderMessage {
  readonly providerMessageId: string;
  readonly providerThreadId: string;
  readonly fromAddress: string;
  readonly toAddresses: readonly string[];
  readonly ccAddresses: readonly string[];
  readonly subject: string;
  /** Encrypted/object storage reference; adapters do not expose a body to logs. */
  readonly bodyStorageRef: string;
  readonly sentAt: Date;
}

export interface ApprovedMailboxSend {
  readonly connectionReference: string;
  readonly draftReference: string;
  readonly approvalReference: string;
  readonly bodyStorageRef: string;
  readonly bodyHashSha256: string;
  readonly toAddresses: readonly string[];
  readonly ccAddresses: readonly string[];
  readonly subject: string;
  readonly idempotencyKey: string;
}

export interface MailboxProviderAdapter {
  readonly provider: string;
  readonly requiredScopes: readonly string[];
  syncMetadata(input: { readonly credentialSecretRef: string; readonly cursor?: string | null }): Promise<{
    readonly messages: readonly MailboxProviderMessage[];
    readonly nextCursor: string;
  }>;
  sendApproved(input: ApprovedMailboxSend): Promise<{ readonly providerMessageId: string; readonly deliveredAt: Date }>;
  disconnect(input: { readonly credentialSecretRef: string }): Promise<void>;
  deleteProviderData(input: { readonly connectionReference: string }): Promise<{ readonly confirmationReference: string; readonly confirmedAt: Date }>;
}

export function assertMailboxProviderReviewed(
  adapter: Pick<MailboxProviderAdapter, "provider" | "requiredScopes">,
  evidence: MailboxProviderReviewEvidence,
  now = new Date()
): void {
  if (evidence.provider !== adapter.provider) throw new Error("Mailbox provider review does not match the selected adapter.");
  if (evidence.reviewedAt.getTime() > now.getTime() || evidence.expiresAt.getTime() <= now.getTime()) {
    throw new Error("Mailbox provider review is not currently effective.");
  }
  const reviewed = new Set(evidence.reviewedScopes);
  const missing = adapter.requiredScopes.filter((scope) => !reviewed.has(scope));
  if (missing.length) throw new Error(`Mailbox provider scopes are not fully reviewed: ${missing.join(", ")}.`);
  for (const [label, reference] of [
    ["OAuth scope", evidence.oauthScopeReviewReference],
    ["legal", evidence.legalReviewReference],
    ["security", evidence.securityReviewReference]
  ] as const) {
    if (!reference.trim()) throw new Error(`${label} review reference is required.`);
  }
}

export function assertApprovedMailboxSend(input: ApprovedMailboxSend): void {
  if (!input.approvalReference.trim()) throw new Error("Mailbox send requires a human approval reference.");
  if (!input.toAddresses.length) throw new Error("Mailbox send requires a recipient.");
  if (!/^[a-f0-9]{64}$/.test(input.bodyHashSha256)) throw new Error("Mailbox send requires an approved body SHA-256 hash.");
  if (!input.idempotencyKey.trim()) throw new Error("Mailbox send requires an idempotency key.");
}
