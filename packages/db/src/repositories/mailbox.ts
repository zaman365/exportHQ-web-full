import { and, eq, sql } from "drizzle-orm";
import {
  assertApprovedMailboxSend,
  assertMailboxProviderReviewed,
  type MailboxProviderReviewEvidence
} from "@exporthq/platform";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  buyerOutreachConsents,
  emailConnectionDeletionRequests,
  emailConnections,
  emailMessages,
  emailThreadMappings,
  emailThreads,
  outboundEmailApprovals,
  outboundEmailDeliveries,
  outboundEmailDrafts
} from "../schema";
import { normalizeEmailAddress } from "./validation";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export async function registerReviewedMailboxConnection(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly provider: string;
    readonly requiredScopes: readonly string[];
    readonly reviewEvidence: MailboxProviderReviewEvidence;
    readonly emailAddress: string;
    readonly displayName: string;
    readonly authStrategy: string;
    readonly credentialSecretRef: string;
  },
  now = new Date()
): Promise<string> {
  assertMailboxProviderReviewed({ provider: input.provider, requiredScopes: input.requiredScopes }, input.reviewEvidence, now);
  const credentialSecretRef = requiredSecretReference(input.credentialSecretRef);
  const [connection] = await tx.insert(emailConnections).values({
    organizationId: context.organizationId,
    provider: requiredText(input.provider, "Mailbox provider"),
    emailAddress: email(input.emailAddress),
    displayName: requiredText(input.displayName, "Mailbox display name"),
    authStrategy: requiredText(input.authStrategy, "Mailbox authorization strategy"),
    status: "connected",
    credentialSecretRef,
    grantedScopes: [...input.requiredScopes],
    createdBy: context.actorId
  }).returning({ id: emailConnections.id });
  if (!connection) throw new Error("Mailbox connection did not return an identifier.");
  await recordAuditEvent(tx, context, {
    action: "mailbox.connected",
    entityType: "email_connection",
    entityId: connection.id,
    metadata: {
      provider: input.provider,
      scopeCount: input.requiredScopes.length,
      oauthScopeReviewReference: input.reviewEvidence.oauthScopeReviewReference,
      legalReviewReference: input.reviewEvidence.legalReviewReference,
      securityReviewReference: input.reviewEvidence.securityReviewReference
    }
  });
  return connection.id;
}

export async function ingestMailboxMessageMetadata(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly emailConnectionId: string;
    readonly providerThreadId: string;
    readonly providerMessageId: string;
    readonly direction: "inbound" | "outbound";
    readonly fromAddress: string;
    readonly toAddresses: readonly string[];
    readonly ccAddresses?: readonly string[];
    readonly subject: string;
    readonly textPreview: string;
    readonly bodyStorageRef: string;
    readonly internetMessageId?: string | null;
    readonly sentAt: Date;
    readonly classification: "rfq" | "buyer_reply" | "order" | "shipment" | "payment" | "other";
    readonly confidenceBps: number;
    readonly methodVersion: string;
  },
  now = new Date()
): Promise<{ readonly threadId: string; readonly messageId: string }> {
  if (context.actorType === "customer") throw new Error("Only a mailbox sync worker may ingest provider messages.");
  const [connection] = await tx.select({ id: emailConnections.id }).from(emailConnections).where(and(
    eq(emailConnections.organizationId, context.organizationId),
    eq(emailConnections.id, input.emailConnectionId),
    eq(emailConnections.status, "connected")
  )).limit(1);
  if (!connection) throw new Error("Connected mailbox was not found.");
  const [createdThread] = await tx.insert(emailThreads).values({
    organizationId: context.organizationId,
    emailConnectionId: input.emailConnectionId,
    providerThreadId: requiredText(input.providerThreadId, "Provider thread identifier"),
    subject: requiredText(input.subject, "Email subject"),
    snippet: safePreview(input.textPreview),
    participants: [...new Set([input.fromAddress, ...input.toAddresses, ...(input.ccAddresses ?? [])].map(email))],
    latestMessageAt: input.sentAt
  }).onConflictDoUpdate({
    target: [emailThreads.emailConnectionId, emailThreads.providerThreadId],
    set: { subject: requiredText(input.subject, "Email subject"), snippet: safePreview(input.textPreview), latestMessageAt: input.sentAt, updatedAt: now }
  }).returning({ id: emailThreads.id });
  if (!createdThread) throw new Error("Mailbox thread was not stored.");
  const [message] = await tx.insert(emailMessages).values({
    organizationId: context.organizationId,
    emailConnectionId: input.emailConnectionId,
    emailThreadId: createdThread.id,
    providerMessageId: requiredText(input.providerMessageId, "Provider message identifier"),
    direction: input.direction,
    fromAddress: email(input.fromAddress),
    toAddresses: input.toAddresses.map(email),
    ccAddresses: (input.ccAddresses ?? []).map(email),
    subject: requiredText(input.subject, "Email subject"),
    textPreview: safePreview(input.textPreview),
    bodyStorageRef: requiredStorageReference(input.bodyStorageRef),
    internetMessageId: optionalText(input.internetMessageId),
    sentAt: input.sentAt
  }).onConflictDoNothing({ target: [emailMessages.emailConnectionId, emailMessages.providerMessageId] }).returning({ id: emailMessages.id });
  const messageId = message?.id ?? (await tx.select({ id: emailMessages.id }).from(emailMessages).where(and(
    eq(emailMessages.emailConnectionId, input.emailConnectionId),
    eq(emailMessages.providerMessageId, input.providerMessageId)
  )).limit(1))[0]?.id;
  if (!messageId) throw new Error("Mailbox message was not stored.");
  const confidenceBps = boundedBps(input.confidenceBps);
  await tx.insert(emailThreadMappings).values({
    organizationId: context.organizationId,
    emailThreadId: createdThread.id,
    classification: input.classification,
    confidenceBps,
    methodVersion: requiredText(input.methodVersion, "Mailbox classification method")
  }).onConflictDoUpdate({
    target: emailThreadMappings.emailThreadId,
    set: { classification: input.classification, confidenceBps, methodVersion: input.methodVersion, updatedAt: now }
  });
  await tx.update(emailConnections).set({ lastSuccessfulSyncAt: now, lastSyncErrorCode: null, updatedAt: now })
    .where(and(eq(emailConnections.organizationId, context.organizationId), eq(emailConnections.id, input.emailConnectionId)));
  return { threadId: createdThread.id, messageId };
}

export async function confirmMailboxThreadMapping(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly emailThreadId: string;
    readonly buyerAccountId?: string | null;
    readonly opportunityId?: string | null;
    readonly rfqId?: string | null;
    readonly exportLaneId?: string | null;
  },
  now = new Date()
): Promise<void> {
  if (![input.buyerAccountId, input.opportunityId, input.rfqId, input.exportLaneId].some(Boolean)) throw new Error("Mailbox mapping requires at least one tenant entity.");
  const [updated] = await tx.update(emailThreadMappings).set({
    buyerAccountId: input.buyerAccountId ?? null,
    opportunityId: input.opportunityId ?? null,
    rfqId: input.rfqId ?? null,
    exportLaneId: input.exportLaneId ?? null,
    humanConfirmedBy: context.actorId,
    humanConfirmedAt: now,
    updatedAt: now
  }).where(and(eq(emailThreadMappings.organizationId, context.organizationId), eq(emailThreadMappings.emailThreadId, input.emailThreadId)))
    .returning({ id: emailThreadMappings.id });
  if (!updated) throw new Error("Mailbox thread classification was not found.");
  await recordAuditEvent(tx, context, { action: "mailbox.thread_mapped", entityType: "email_thread_mapping", entityId: updated.id, metadata: { emailThreadId: input.emailThreadId, buyerLinked: Boolean(input.buyerAccountId), opportunityLinked: Boolean(input.opportunityId), rfqLinked: Boolean(input.rfqId), laneLinked: Boolean(input.exportLaneId) } });
}

export async function createOutboundMailboxDraft(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly emailConnectionId: string;
    readonly emailThreadId?: string | null;
    readonly buyerAccountId: string;
    readonly opportunityId?: string | null;
    readonly exportLaneId?: string | null;
    readonly toAddresses: readonly string[];
    readonly ccAddresses?: readonly string[];
    readonly subject: string;
    readonly bodyStorageRef: string;
    readonly bodyHashSha256: string;
    readonly nextTaskId?: string | null;
  }
): Promise<string> {
  if (!input.toAddresses.length) throw new Error("Outbound draft requires a recipient.");
  const [draft] = await tx.insert(outboundEmailDrafts).values({
    organizationId: context.organizationId,
    emailConnectionId: input.emailConnectionId,
    emailThreadId: input.emailThreadId ?? null,
    buyerAccountId: input.buyerAccountId,
    opportunityId: input.opportunityId ?? null,
    exportLaneId: input.exportLaneId ?? null,
    toAddresses: input.toAddresses.map(email),
    ccAddresses: (input.ccAddresses ?? []).map(email),
    subject: requiredText(input.subject, "Outbound subject"),
    bodyStorageRef: requiredStorageReference(input.bodyStorageRef),
    bodyHashSha256: sha256(input.bodyHashSha256, "Outbound body"),
    status: "awaiting_approval",
    nextTaskId: input.nextTaskId ?? null,
    createdBy: context.actorId
  }).returning({ id: outboundEmailDrafts.id });
  if (!draft) throw new Error("Outbound draft did not return an identifier.");
  return draft.id;
}

export async function decideOutboundMailboxDraft(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly draftId: string; readonly expectedVersion: number; readonly bodyHashSha256: string; readonly decision: "approved" | "rejected" | "changes_requested"; readonly rationale: string },
  now = new Date()
): Promise<string> {
  const bodyHash = sha256(input.bodyHashSha256, "Outbound body");
  const [draft] = await tx.select({ hash: outboundEmailDrafts.bodyHashSha256, status: outboundEmailDrafts.status })
    .from(outboundEmailDrafts).where(and(
      eq(outboundEmailDrafts.organizationId, context.organizationId),
      eq(outboundEmailDrafts.id, input.draftId),
      eq(outboundEmailDrafts.version, input.expectedVersion)
    )).for("update").limit(1);
  if (!draft || draft.status !== "awaiting_approval" || draft.hash !== bodyHash) throw new Error("Exact outbound draft version is not awaiting approval.");
  const [approval] = await tx.insert(outboundEmailApprovals).values({
    organizationId: context.organizationId,
    draftId: input.draftId,
    draftVersion: input.expectedVersion,
    bodyHashSha256: bodyHash,
    decision: input.decision,
    decidedBy: context.actorId,
    rationale: requiredText(input.rationale, "Outbound approval rationale"),
    decidedAt: now
  }).returning({ id: outboundEmailApprovals.id });
  if (!approval) throw new Error("Outbound approval did not return an identifier.");
  await tx.update(outboundEmailDrafts).set({ status: input.decision === "approved" ? "approved" : "draft", updatedAt: now })
    .where(and(eq(outboundEmailDrafts.organizationId, context.organizationId), eq(outboundEmailDrafts.id, input.draftId), eq(outboundEmailDrafts.version, input.expectedVersion)));
  await recordAuditEvent(tx, context, { action: "mailbox.draft_approved", entityType: "outbound_email_approval", entityId: approval.id, metadata: { draftId: input.draftId, draftVersion: input.expectedVersion, decision: input.decision } });
  return approval.id;
}

export async function queueApprovedMailboxDraft(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly draftId: string; readonly approvalId: string; readonly consentRecordId: string; readonly idempotencyKey: string }
): Promise<string> {
  const [draft] = await tx.select({
    emailConnectionId: outboundEmailDrafts.emailConnectionId,
    bodyStorageRef: outboundEmailDrafts.bodyStorageRef,
    bodyHashSha256: outboundEmailDrafts.bodyHashSha256,
    toAddresses: outboundEmailDrafts.toAddresses,
    ccAddresses: outboundEmailDrafts.ccAddresses,
    subject: outboundEmailDrafts.subject,
    status: outboundEmailDrafts.status,
    version: outboundEmailDrafts.version,
    buyerAccountId: outboundEmailDrafts.buyerAccountId,
    approvalDecision: outboundEmailApprovals.decision,
    approvalVersion: outboundEmailApprovals.draftVersion,
    approvalHash: outboundEmailApprovals.bodyHashSha256,
    connectionStatus: emailConnections.status
  }).from(outboundEmailDrafts)
    .innerJoin(outboundEmailApprovals, and(eq(outboundEmailApprovals.organizationId, context.organizationId), eq(outboundEmailApprovals.id, input.approvalId), eq(outboundEmailApprovals.draftId, outboundEmailDrafts.id)))
    .innerJoin(emailConnections, and(eq(emailConnections.organizationId, context.organizationId), eq(emailConnections.id, outboundEmailDrafts.emailConnectionId)))
    .where(and(eq(outboundEmailDrafts.organizationId, context.organizationId), eq(outboundEmailDrafts.id, input.draftId)))
    .limit(1);
  if (!draft || draft.status !== "approved" || draft.approvalDecision !== "approved" || draft.approvalVersion !== draft.version || draft.approvalHash !== draft.bodyHashSha256) {
    throw new Error("Mailbox delivery requires approval of the exact current draft.");
  }
  if (draft.connectionStatus !== "connected") throw new Error("Mailbox connection is not active.");
  const [consent] = await tx.select({ id: buyerOutreachConsents.id }).from(buyerOutreachConsents).where(and(
    eq(buyerOutreachConsents.organizationId, context.organizationId),
    eq(buyerOutreachConsents.id, input.consentRecordId),
    eq(buyerOutreachConsents.buyerAccountId, draft.buyerAccountId),
    eq(buyerOutreachConsents.channel, "email"),
    eq(buyerOutreachConsents.state, "permitted")
  )).limit(1);
  if (!consent) throw new Error("Mailbox delivery requires documented email outreach permission.");
  assertApprovedMailboxSend({
    connectionReference: draft.emailConnectionId,
    draftReference: input.draftId,
    approvalReference: input.approvalId,
    bodyStorageRef: draft.bodyStorageRef,
    bodyHashSha256: draft.bodyHashSha256,
    toAddresses: draft.toAddresses,
    ccAddresses: draft.ccAddresses,
    subject: draft.subject,
    idempotencyKey: input.idempotencyKey
  });
  const [delivery] = await tx.insert(outboundEmailDeliveries).values({
    organizationId: context.organizationId,
    draftId: input.draftId,
    approvalId: input.approvalId,
    idempotencyKey: requiredText(input.idempotencyKey, "Mailbox delivery idempotency key"),
    status: "queued"
  }).onConflictDoNothing({ target: [outboundEmailDeliveries.organizationId, outboundEmailDeliveries.idempotencyKey] }).returning({ id: outboundEmailDeliveries.id });
  if (!delivery) {
    const [existing] = await tx.select({ id: outboundEmailDeliveries.id }).from(outboundEmailDeliveries).where(and(
      eq(outboundEmailDeliveries.organizationId, context.organizationId),
      eq(outboundEmailDeliveries.idempotencyKey, input.idempotencyKey)
    )).limit(1);
    if (!existing) throw new Error("Mailbox delivery was not queued.");
    return existing.id;
  }
  await tx.update(outboundEmailDrafts).set({ status: "queued", updatedAt: new Date() }).where(and(
    eq(outboundEmailDrafts.organizationId, context.organizationId), eq(outboundEmailDrafts.id, input.draftId), eq(outboundEmailDrafts.status, "approved")
  ));
  await enqueueOutboxEvent(tx, context, { topic: "mailbox.delivery_requested", aggregateType: "outbound_email_delivery", aggregateId: delivery.id, dedupeKey: `mailbox-delivery:${delivery.id}:requested`, payload: { draftId: input.draftId, approvalId: input.approvalId } });
  await recordAuditEvent(tx, context, { action: "mailbox.delivery_queued", entityType: "outbound_email_delivery", entityId: delivery.id, metadata: { draftId: input.draftId, approvalId: input.approvalId, consentRecordId: input.consentRecordId } });
  return delivery.id;
}

export async function requestMailboxDisconnectAndDeletion(
  tx: ExportHqTransaction,
  context: TenantContext,
  emailConnectionId: string,
  now = new Date()
): Promise<string> {
  const [connection] = await tx.update(emailConnections).set({ status: "disconnected", updatedAt: now }).where(and(
    eq(emailConnections.organizationId, context.organizationId),
    eq(emailConnections.id, emailConnectionId),
    sql`${emailConnections.status} <> 'disconnected'`
  )).returning({ id: emailConnections.id });
  if (!connection) throw new Error("Active mailbox connection was not found.");
  const [request] = await tx.insert(emailConnectionDeletionRequests).values({
    organizationId: context.organizationId,
    emailConnectionId,
    requestedBy: context.actorId,
    requestedAt: now,
    disconnectedAt: now
  }).returning({ id: emailConnectionDeletionRequests.id });
  if (!request) throw new Error("Mailbox deletion request did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "mailbox.disconnected", entityType: "email_connection", entityId: emailConnectionId, metadata: { deletionRequestId: request.id } });
  await recordAuditEvent(tx, context, { action: "mailbox.deletion_requested", entityType: "email_connection_deletion_request", entityId: request.id, metadata: { emailConnectionId } });
  return request.id;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function email(value: string): string {
  return normalizeEmailAddress(value, "A valid email address is required.");
}

function sha256(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error(`${label} requires a SHA-256 hash.`);
  return normalized;
}

function requiredSecretReference(value: string): string {
  const normalized = requiredText(value, "Credential secret reference");
  if (!/^(cloudflare-secrets|secrets-manager|vault):\/\/[A-Za-z0-9/_-]+$/.test(normalized)) {
    throw new Error("Credential must be represented by an approved server-side secret reference.");
  }
  return normalized;
}

function requiredStorageReference(value: string): string {
  const normalized = requiredText(value, "Private body storage reference");
  if (!/^(r2|private-storage):\/\/[A-Za-z0-9/_.-]+$/.test(normalized)) throw new Error("Message body requires a private storage reference.");
  return normalized;
}

function safePreview(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function boundedBps(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10000) throw new Error("Confidence requires integer basis points from 0 to 10000.");
  return value;
}
