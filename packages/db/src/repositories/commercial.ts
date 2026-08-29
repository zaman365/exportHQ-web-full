import { and, eq, sql } from "drizzle-orm";
import {
  assertQuotationTransition,
  calculateQuoteLine,
  calculateQuoteTotal,
  type QuotationStatus
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  buyerOutreachConsents,
  buyerRfqs,
  exportLanes,
  quotationApprovals,
  quotationDeliveries,
  quotationLines,
  quotations,
  quotationVersions,
  salesOpportunities,
  salesOrders,
  salesOrderVersions
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface QuoteVersionInput {
  readonly currency: string;
  readonly incoterm: "FOB" | "CIF" | "DDP";
  readonly validUntil: Date;
  readonly assumptions: readonly string[];
  readonly freightMinor: number;
  readonly testingMinor: number;
  readonly financeMinor: number;
  readonly commissionMinor: number;
  readonly fxBufferMinor: number;
  readonly paymentTerms: string;
  readonly deliveryTerms: string;
  readonly approvalPolicyVersion: string;
  readonly generatedOutputRef: string;
  readonly generatedOutputHashSha256: string;
  readonly lines: readonly {
    readonly rfqLineId?: string | null;
    readonly productId: string;
    readonly description: string;
    readonly quantity: number;
    readonly unit: string;
    readonly unitPriceMinor: number;
  }[];
}

export async function createQuotation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly rfqId: string; readonly ownerMembershipId: string }
): Promise<string> {
  const [rfq] = await tx.select({
    opportunityId: buyerRfqs.opportunityId,
    exportLaneId: buyerRfqs.exportLaneId,
    status: buyerRfqs.status
  }).from(buyerRfqs).where(and(
    eq(buyerRfqs.organizationId, context.organizationId),
    eq(buyerRfqs.id, input.rfqId)
  )).limit(1);
  if (!rfq) throw new Error("RFQ was not found in this organization.");
  if (rfq.status !== "ready_to_quote") throw new Error("Quotation requires an RFQ that is ready to quote.");
  const [quote] = await tx.insert(quotations).values({
    organizationId: context.organizationId,
    rfqId: input.rfqId,
    opportunityId: rfq.opportunityId,
    exportLaneId: rfq.exportLaneId,
    ownerMembershipId: input.ownerMembershipId,
    createdBy: context.actorId
  }).returning({ id: quotations.id });
  if (!quote) throw new Error("Quotation did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "quotation.created", entityType: "quotation", entityId: quote.id, metadata: { rfqId: input.rfqId, exportLaneId: rfq.exportLaneId } });
  return quote.id;
}

export async function createQuotationVersion(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly quotationId: string; readonly expectedCurrentVersion: number; readonly quote: QuoteVersionInput },
  now = new Date()
): Promise<string> {
  if (!input.quote.lines.length) throw new Error("Quotation requires at least one line.");
  if (input.quote.validUntil.getTime() <= now.getTime()) throw new Error("Quotation validity must end in the future.");
  const [current] = await tx.select({ id: quotations.id, status: quotations.status, currentVersion: quotations.currentVersion })
    .from(quotations).where(and(
      eq(quotations.organizationId, context.organizationId),
      eq(quotations.id, input.quotationId),
      eq(quotations.currentVersion, input.expectedCurrentVersion)
    )).for("update", { of: quotations }).limit(1);
  if (!current) throw new Error("Quotation was not found or changed concurrently.");
  if (current.status !== "draft") throw new Error("Only a draft quotation can receive a new immutable version.");
  const calculatedLines = input.quote.lines.map((line) => ({ ...line, ...calculateQuoteLine(line.quantity, line.unitPriceMinor) }));
  const subtotalMinor = calculatedLines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const totalMinor = calculateQuoteTotal({
    lineTotalsMinor: calculatedLines.map((line) => line.lineTotalMinor),
    freightMinor: input.quote.freightMinor,
    testingMinor: input.quote.testingMinor,
    financeMinor: input.quote.financeMinor,
    commissionMinor: input.quote.commissionMinor,
    fxBufferMinor: input.quote.fxBufferMinor
  });
  const version = input.expectedCurrentVersion + 1;
  const canonical = {
    version,
    currency: currency(input.quote.currency),
    incoterm: input.quote.incoterm,
    validUntil: input.quote.validUntil.toISOString(),
    assumptions: input.quote.assumptions.map((item) => requiredText(item, "Quote assumption")),
    costs: {
      freightMinor: checkedMoney(input.quote.freightMinor),
      testingMinor: checkedMoney(input.quote.testingMinor),
      financeMinor: checkedMoney(input.quote.financeMinor),
      commissionMinor: checkedMoney(input.quote.commissionMinor),
      fxBufferMinor: checkedMoney(input.quote.fxBufferMinor)
    },
    subtotalMinor,
    totalMinor,
    paymentTerms: requiredText(input.quote.paymentTerms, "Payment terms"),
    deliveryTerms: requiredText(input.quote.deliveryTerms, "Delivery terms"),
    approvalPolicyVersion: requiredText(input.quote.approvalPolicyVersion, "Approval policy version"),
    lines: calculatedLines.map((line) => ({
      rfqLineId: line.rfqLineId ?? null,
      productId: line.productId,
      description: requiredText(line.description, "Quote line description"),
      quantity: line.quantity,
      unit: requiredText(line.unit, "Quote line unit"),
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor
    }))
  };
  const [snapshot] = await tx.insert(quotationVersions).values({
    organizationId: context.organizationId,
    quotationId: input.quotationId,
    version,
    currency: canonical.currency,
    incoterm: canonical.incoterm,
    validUntil: input.quote.validUntil,
    assumptions: canonical.assumptions,
    freightMinor: canonical.costs.freightMinor,
    testingMinor: canonical.costs.testingMinor,
    financeMinor: canonical.costs.financeMinor,
    commissionMinor: canonical.costs.commissionMinor,
    fxBufferMinor: canonical.costs.fxBufferMinor,
    subtotalMinor,
    totalMinor,
    paymentTerms: canonical.paymentTerms,
    deliveryTerms: canonical.deliveryTerms,
    approvalPolicyVersion: canonical.approvalPolicyVersion,
    contentHashSha256: await digestSha256(JSON.stringify(canonical)),
    generatedOutputRef: requiredText(input.quote.generatedOutputRef, "Generated quote output reference"),
    generatedOutputHashSha256: sha256(input.quote.generatedOutputHashSha256, "Generated quote output"),
    createdBy: context.actorId
  }).returning({ id: quotationVersions.id });
  if (!snapshot) throw new Error("Quotation version did not return an identifier.");
  await tx.insert(quotationLines).values(canonical.lines.map((line) => ({
    organizationId: context.organizationId,
    quotationVersionId: snapshot.id,
    ...line
  })));
  const [updated] = await tx.update(quotations).set({
    status: "awaiting_approval",
    currentVersion: version,
    approvedVersion: null,
    acceptedVersion: null,
    version: sql`${quotations.version} + 1`,
    updatedAt: now
  }).where(and(
    eq(quotations.organizationId, context.organizationId),
    eq(quotations.id, input.quotationId),
    eq(quotations.currentVersion, input.expectedCurrentVersion),
    eq(quotations.status, "draft")
  )).returning({ id: quotations.id });
  if (!updated) throw new Error("Quotation changed concurrently.");
  await recordAuditEvent(tx, context, { action: "quotation.version_created", entityType: "quotation_version", entityId: snapshot.id, metadata: { quotationId: input.quotationId, version, currency: canonical.currency, totalMinor } });
  return snapshot.id;
}

export async function decideQuotationApproval(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly quotationId: string;
    readonly quotationVersionId: string;
    readonly decision: "approved" | "rejected" | "changes_requested";
    readonly signatoryRole: string;
    readonly policyVersion: string;
    readonly rationale: string;
  },
  now = new Date()
): Promise<string> {
  const [current] = await tx.select({ status: quotations.status, currentVersion: quotations.currentVersion, versionId: quotationVersions.id, policyVersion: quotationVersions.approvalPolicyVersion })
    .from(quotations).innerJoin(quotationVersions, and(
      eq(quotationVersions.organizationId, context.organizationId),
      eq(quotationVersions.quotationId, quotations.id),
      eq(quotationVersions.id, input.quotationVersionId),
      eq(quotationVersions.version, quotations.currentVersion)
    )).where(and(
      eq(quotations.organizationId, context.organizationId),
      eq(quotations.id, input.quotationId)
    )).for("update", { of: quotations }).limit(1);
  if (!current) throw new Error("Current quotation version was not found.");
  if (current.status !== "awaiting_approval") throw new Error("Quotation is not awaiting approval.");
  if (current.policyVersion !== input.policyVersion) throw new Error("Quotation approval policy version does not match.");
  const [approval] = await tx.insert(quotationApprovals).values({
    organizationId: context.organizationId,
    quotationId: input.quotationId,
    quotationVersionId: input.quotationVersionId,
    decision: input.decision,
    signatoryActorId: context.actorId,
    signatoryRole: requiredText(input.signatoryRole, "Signatory role"),
    policyVersion: requiredText(input.policyVersion, "Approval policy version"),
    rationale: requiredText(input.rationale, "Approval rationale"),
    decidedAt: now
  }).returning({ id: quotationApprovals.id });
  if (!approval) throw new Error("Quotation approval did not return an identifier.");
  const nextStatus: QuotationStatus = input.decision === "approved" ? "approved" : "draft";
  assertQuotationTransition("awaiting_approval", nextStatus);
  await tx.update(quotations).set({
    status: nextStatus,
    approvedVersion: input.decision === "approved" ? current.currentVersion : null,
    version: sql`${quotations.version} + 1`,
    updatedAt: now
  }).where(and(eq(quotations.organizationId, context.organizationId), eq(quotations.id, input.quotationId), eq(quotations.status, "awaiting_approval")));
  await recordAuditEvent(tx, context, { action: "quotation.approved", entityType: "quotation_approval", entityId: approval.id, metadata: { quotationId: input.quotationId, version: current.currentVersion, decision: input.decision, signatoryRole: input.signatoryRole } });
  return approval.id;
}

export async function queueQuotationDelivery(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly quotationId: string;
    readonly approvalId: string;
    readonly consentRecordId: string;
    readonly channel: "email" | "other";
    readonly recipient: string;
    readonly idempotencyKey: string;
  },
  now = new Date()
): Promise<string> {
  const [current] = await tx.select({
    quotationVersionId: quotationVersions.id,
    version: quotationVersions.version,
    validUntil: quotationVersions.validUntil,
    outputRef: quotationVersions.generatedOutputRef,
    outputHash: quotationVersions.generatedOutputHashSha256,
    approvalDecision: quotationApprovals.decision,
    approvalVersionId: quotationApprovals.quotationVersionId,
    buyerAccountId: salesOpportunities.buyerAccountId
  }).from(quotations)
    .innerJoin(quotationVersions, and(eq(quotationVersions.organizationId, context.organizationId), eq(quotationVersions.quotationId, quotations.id), eq(quotationVersions.version, quotations.currentVersion)))
    .innerJoin(quotationApprovals, and(eq(quotationApprovals.organizationId, context.organizationId), eq(quotationApprovals.id, input.approvalId), eq(quotationApprovals.quotationId, quotations.id)))
    .innerJoin(salesOpportunities, and(eq(salesOpportunities.organizationId, context.organizationId), eq(salesOpportunities.id, quotations.opportunityId)))
    .where(and(eq(quotations.organizationId, context.organizationId), eq(quotations.id, input.quotationId), eq(quotations.status, "approved")))
    .limit(1);
  if (!current || current.approvalDecision !== "approved" || current.approvalVersionId !== current.quotationVersionId) {
    throw new Error("External quote delivery requires approval of the exact current version.");
  }
  if (!current.outputRef || !current.outputHash) throw new Error("External quote delivery requires a generated output with a checksum.");
  if (current.validUntil.getTime() <= now.getTime()) throw new Error("Expired quotation cannot be delivered.");
  const [consent] = await tx.select({ id: buyerOutreachConsents.id }).from(buyerOutreachConsents).where(and(
    eq(buyerOutreachConsents.organizationId, context.organizationId),
    eq(buyerOutreachConsents.id, input.consentRecordId),
    eq(buyerOutreachConsents.buyerAccountId, current.buyerAccountId),
    eq(buyerOutreachConsents.state, "permitted"),
    eq(buyerOutreachConsents.channel, input.channel === "email" ? "email" : "other")
  )).limit(1);
  if (!consent) throw new Error("Quote delivery requires current documented outreach permission.");
  const [delivery] = await tx.insert(quotationDeliveries).values({
    organizationId: context.organizationId,
    quotationId: input.quotationId,
    quotationVersionId: current.quotationVersionId,
    approvalId: input.approvalId,
    channel: input.channel,
    recipient: requiredText(input.recipient, "Quote recipient"),
    idempotencyKey: requiredText(input.idempotencyKey, "Quote delivery idempotency key"),
    status: "queued",
    attempts: 0,
    createdBy: context.actorId
  }).onConflictDoNothing({ target: [quotationDeliveries.organizationId, quotationDeliveries.idempotencyKey] }).returning({ id: quotationDeliveries.id });
  if (!delivery) {
    const [existing] = await tx.select({ id: quotationDeliveries.id }).from(quotationDeliveries).where(and(
      eq(quotationDeliveries.organizationId, context.organizationId),
      eq(quotationDeliveries.idempotencyKey, input.idempotencyKey)
    )).limit(1);
    if (!existing) throw new Error("Quote delivery was not queued.");
    return existing.id;
  }
  await enqueueOutboxEvent(tx, context, {
    topic: "quotation.delivery_requested",
    aggregateType: "quotation_delivery",
    aggregateId: delivery.id,
    dedupeKey: `quotation-delivery:${delivery.id}:requested`,
    payload: { quotationId: input.quotationId, quotationVersionId: current.quotationVersionId, channel: input.channel }
  });
  await recordAuditEvent(tx, context, { action: "quotation.delivery_queued", entityType: "quotation_delivery", entityId: delivery.id, metadata: { quotationId: input.quotationId, version: current.version, channel: input.channel, consentRecordId: input.consentRecordId } });
  return delivery.id;
}

export async function recordQuotationDelivered(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly deliveryId: string; readonly providerReference: string },
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer") throw new Error("Only a delivery worker may confirm external quote delivery.");
  const [delivery] = await tx.update(quotationDeliveries).set({
    status: "delivered",
    providerReference: requiredText(input.providerReference, "Quote provider reference"),
    attempts: sql`${quotationDeliveries.attempts} + 1`,
    lastAttemptAt: now,
    deliveredAt: now
  }).where(and(
    eq(quotationDeliveries.organizationId, context.organizationId),
    eq(quotationDeliveries.id, input.deliveryId),
    eq(quotationDeliveries.status, "queued")
  )).returning({ quotationId: quotationDeliveries.quotationId });
  if (!delivery) throw new Error("Queued quotation delivery was not found.");
  const [quote] = await tx.update(quotations).set({ status: "sent", version: sql`${quotations.version} + 1`, updatedAt: now })
    .where(and(eq(quotations.organizationId, context.organizationId), eq(quotations.id, delivery.quotationId), eq(quotations.status, "approved")))
    .returning({ opportunityId: quotations.opportunityId, rfqId: quotations.rfqId, exportLaneId: quotations.exportLaneId });
  if (!quote) throw new Error("Approved quotation changed before delivery confirmation.");
  await tx.update(salesOpportunities).set({ status: "quoted", version: sql`${salesOpportunities.version} + 1`, updatedAt: now })
    .where(and(eq(salesOpportunities.organizationId, context.organizationId), eq(salesOpportunities.id, quote.opportunityId), eq(salesOpportunities.status, "rfq_received")));
  await tx.update(buyerRfqs).set({ status: "quoted", version: sql`${buyerRfqs.version} + 1`, updatedAt: now })
    .where(and(eq(buyerRfqs.organizationId, context.organizationId), eq(buyerRfqs.id, quote.rfqId), eq(buyerRfqs.status, "ready_to_quote")));
  await tx.update(exportLanes).set({ stage: "offer", version: sql`${exportLanes.version} + 1`, updatedAt: now })
    .where(and(eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, quote.exportLaneId)));
}

export async function acceptQuotation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly quotationId: string; readonly quotationVersionId: string; readonly explicitlyConfirmed: boolean },
  now = new Date()
): Promise<void> {
  if (!input.explicitlyConfirmed) throw new Error("Quote acceptance requires explicit human confirmation.");
  const [accepted] = await tx.update(quotations).set({
    status: "accepted",
    acceptedVersion: quotations.currentVersion,
    version: sql`${quotations.version} + 1`,
    updatedAt: now
  }).where(and(
    eq(quotations.organizationId, context.organizationId),
    eq(quotations.id, input.quotationId),
    eq(quotations.status, "sent"),
    eq(quotations.approvedVersion, quotations.currentVersion),
    sql`exists (select 1 from ${quotationVersions} qv where qv.organization_id = ${context.organizationId}::uuid and qv.id = ${input.quotationVersionId}::uuid and qv.quotation_id = ${input.quotationId}::uuid and qv.version = ${quotations.currentVersion} and qv.valid_until > ${now.toISOString()}::timestamptz)`
  )).returning({ version: quotations.currentVersion });
  if (!accepted) throw new Error("Current approved quotation could not be accepted.");
  await recordAuditEvent(tx, context, { action: "quotation.accepted", entityType: "quotation", entityId: input.quotationId, metadata: { version: accepted.version, explicitlyConfirmed: true } });
}

export async function convertAcceptedQuotationToSalesOrder(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly quotationId: string; readonly orderNumber: string; readonly explicitlyConfirmed: boolean },
  now = new Date()
): Promise<string> {
  if (!input.explicitlyConfirmed) throw new Error("Sales order conversion requires explicit human confirmation.");
  const [quote] = await tx.select({
    quotationVersionId: quotationVersions.id,
    opportunityId: quotations.opportunityId,
    exportLaneId: quotations.exportLaneId,
    buyerAccountId: salesOpportunities.buyerAccountId,
    currency: quotationVersions.currency,
    incoterm: quotationVersions.incoterm,
    totalMinor: quotationVersions.totalMinor,
    version: quotationVersions.version,
    contentHashSha256: quotationVersions.contentHashSha256
  }).from(quotations)
    .innerJoin(quotationVersions, and(eq(quotationVersions.organizationId, context.organizationId), eq(quotationVersions.quotationId, quotations.id), eq(quotationVersions.version, quotations.acceptedVersion)))
    .innerJoin(salesOpportunities, and(eq(salesOpportunities.organizationId, context.organizationId), eq(salesOpportunities.id, quotations.opportunityId)))
    .where(and(eq(quotations.organizationId, context.organizationId), eq(quotations.id, input.quotationId), eq(quotations.status, "accepted")))
    .for("update", { of: quotations }).limit(1);
  if (!quote) throw new Error("Accepted quotation was not found.");
  const orderNumber = requiredText(input.orderNumber, "Sales order number");
  const [order] = await tx.insert(salesOrders).values({
    organizationId: context.organizationId,
    exportLaneId: quote.exportLaneId,
    buyerAccountId: quote.buyerAccountId,
    opportunityId: quote.opportunityId,
    quotationId: input.quotationId,
    acceptedQuotationVersionId: quote.quotationVersionId,
    orderNumber,
    status: "confirmed",
    currentVersion: 1,
    confirmedBy: context.actorId,
    confirmedAt: now
  }).returning({ id: salesOrders.id });
  if (!order) throw new Error("Sales order did not return an identifier.");
  const snapshot = { sourceQuotationVersion: quote.version, sourceQuotationHashSha256: quote.contentHashSha256, orderNumber, explicitlyConfirmed: true };
  await tx.insert(salesOrderVersions).values({
    organizationId: context.organizationId,
    salesOrderId: order.id,
    version: 1,
    changeType: "initial",
    reason: "Accepted quotation converted with explicit confirmation",
    currency: quote.currency,
    incoterm: quote.incoterm,
    totalMinor: quote.totalMinor,
    snapshot,
    contentHashSha256: await digestSha256(JSON.stringify(snapshot)),
    confirmedBy: context.actorId,
    confirmedAt: now
  });
  await tx.update(salesOpportunities).set({ status: "won", version: sql`${salesOpportunities.version} + 1`, updatedAt: now })
    .where(and(eq(salesOpportunities.organizationId, context.organizationId), eq(salesOpportunities.id, quote.opportunityId), eq(salesOpportunities.status, "quoted")));
  await tx.update(buyerRfqs).set({ status: "closed", version: sql`${buyerRfqs.version} + 1`, updatedAt: now })
    .where(and(eq(buyerRfqs.organizationId, context.organizationId), eq(buyerRfqs.opportunityId, quote.opportunityId), eq(buyerRfqs.status, "quoted")));
  await tx.update(exportLanes).set({ stage: "production", version: sql`${exportLanes.version} + 1`, updatedAt: now })
    .where(and(eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, quote.exportLaneId)));
  await recordAuditEvent(tx, context, { action: "sales_order.created", entityType: "sales_order", entityId: order.id, metadata: { quotationId: input.quotationId, quotationVersion: quote.version, exportLaneId: quote.exportLaneId, explicitlyConfirmed: true } });
  return order.id;
}

export async function createSalesOrderChange(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly salesOrderId: string;
    readonly expectedVersion: number;
    readonly reason: string;
    readonly currency: string;
    readonly incoterm: "FOB" | "CIF" | "DDP";
    readonly totalMinor: number;
    readonly snapshot: Record<string, unknown>;
    readonly explicitlyConfirmed: boolean;
  },
  now = new Date()
): Promise<string> {
  if (!input.explicitlyConfirmed) throw new Error("Change order requires explicit human confirmation.");
  const [order] = await tx.select({ id: salesOrders.id }).from(salesOrders).where(and(
    eq(salesOrders.organizationId, context.organizationId),
    eq(salesOrders.id, input.salesOrderId),
    eq(salesOrders.currentVersion, input.expectedVersion)
  )).for("update").limit(1);
  if (!order) throw new Error("Sales order was not found or changed concurrently.");
  const version = input.expectedVersion + 1;
  const canonical = { ...input.snapshot, version, reason: requiredText(input.reason, "Change order reason"), currency: currency(input.currency), incoterm: input.incoterm, totalMinor: checkedMoney(input.totalMinor) };
  const [snapshot] = await tx.insert(salesOrderVersions).values({
    organizationId: context.organizationId,
    salesOrderId: input.salesOrderId,
    version,
    changeType: "change_order",
    reason: canonical.reason,
    currency: canonical.currency,
    incoterm: canonical.incoterm,
    totalMinor: canonical.totalMinor,
    snapshot: canonical,
    contentHashSha256: await digestSha256(JSON.stringify(canonical)),
    confirmedBy: context.actorId,
    confirmedAt: now
  }).returning({ id: salesOrderVersions.id });
  if (!snapshot) throw new Error("Sales order version did not return an identifier.");
  const [updated] = await tx.update(salesOrders).set({ currentVersion: version, updatedAt: now }).where(and(
    eq(salesOrders.organizationId, context.organizationId),
    eq(salesOrders.id, input.salesOrderId),
    eq(salesOrders.currentVersion, input.expectedVersion)
  )).returning({ id: salesOrders.id });
  if (!updated) throw new Error("Sales order changed concurrently.");
  await recordAuditEvent(tx, context, { action: "sales_order.change_confirmed", entityType: "sales_order_version", entityId: snapshot.id, metadata: { salesOrderId: input.salesOrderId, version, explicitlyConfirmed: true } });
  return snapshot.id;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function currency(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency requires an ISO alpha-3 code.");
  return normalized;
}

function checkedMoney(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Money requires a non-negative integer in minor units.");
  return value;
}

function sha256(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error(`${label} requires a SHA-256 hash.`);
  return normalized;
}

async function digestSha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
