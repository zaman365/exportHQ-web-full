import { and, eq, inArray, sql } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import {
  buyerAccounts,
  buyerCommunicationAudit,
  exportLanes,
  financialDiscrepancies,
  invoicePaymentSchedules,
  laneOutcomeMetrics,
  paymentAllocations,
  paymentReceipts,
  productionBatches,
  productionInspections,
  realizedProceeds,
  salesOrders,
  shipmentExceptions,
  shipmentPackages,
  shipments,
  tradeInvoices
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export async function createProductionBatch(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly salesOrderId: string;
    readonly batchReference: string;
    readonly productId: string;
    readonly facilityId?: string | null;
    readonly plannedQuantity: number;
    readonly capacityReserved: number;
    readonly ownerMembershipId: string;
    readonly plannedStartAt: Date;
    readonly plannedReleaseAt: Date;
  }
): Promise<string> {
  const [order] = await tx.select({ exportLaneId: salesOrders.exportLaneId, status: salesOrders.status }).from(salesOrders).where(and(
    eq(salesOrders.organizationId, context.organizationId),
    eq(salesOrders.id, input.salesOrderId)
  )).limit(1);
  if (!order || order.exportLaneId !== input.exportLaneId || order.status !== "confirmed") throw new Error("Production batch requires a confirmed sales order in the same Export Lane.");
  const plannedQuantity = positiveInteger(input.plannedQuantity, "Planned quantity");
  const capacityReserved = positiveInteger(input.capacityReserved, "Reserved capacity");
  if (capacityReserved < plannedQuantity) throw new Error("Reserved production capacity must cover the planned quantity.");
  if (input.plannedReleaseAt.getTime() <= input.plannedStartAt.getTime()) throw new Error("Production release must follow production start.");
  const [batch] = await tx.insert(productionBatches).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    salesOrderId: input.salesOrderId,
    batchReference: requiredText(input.batchReference, "Production batch reference"),
    productId: input.productId,
    facilityId: input.facilityId ?? null,
    plannedQuantity,
    capacityReserved,
    ownerMembershipId: input.ownerMembershipId,
    plannedStartAt: input.plannedStartAt,
    plannedReleaseAt: input.plannedReleaseAt
  }).returning({ id: productionBatches.id });
  if (!batch) throw new Error("Production batch did not return an identifier.");
  await tx.update(salesOrders).set({ status: "in_production", updatedAt: new Date() }).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, input.salesOrderId), eq(salesOrders.status, "confirmed")
  ));
  await recordAuditEvent(tx, context, { action: "production.batch_created", entityType: "production_batch", entityId: batch.id, metadata: { exportLaneId: input.exportLaneId, salesOrderId: input.salesOrderId, plannedQuantity } });
  return batch.id;
}

export async function releaseProductionBatch(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly productionBatchId: string; readonly expectedVersion: number; readonly completedQuantity: number },
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer") throw new Error("A reviewed operations actor must release a production batch.");
  const [batch] = await tx.select({ salesOrderId: productionBatches.salesOrderId, plannedQuantity: productionBatches.plannedQuantity, status: productionBatches.status })
    .from(productionBatches).where(and(
      eq(productionBatches.organizationId, context.organizationId),
      eq(productionBatches.id, input.productionBatchId),
      eq(productionBatches.version, input.expectedVersion)
    )).for("update").limit(1);
  if (!batch || !["in_progress", "inspection"].includes(batch.status)) throw new Error("Reviewable production batch was not found.");
  if (input.completedQuantity < 0 || input.completedQuantity > batch.plannedQuantity || !Number.isSafeInteger(input.completedQuantity)) throw new Error("Completed quantity is outside the production plan.");
  const inspections = await tx.select({ result: productionInspections.result }).from(productionInspections).where(and(
    eq(productionInspections.organizationId, context.organizationId), eq(productionInspections.productionBatchId, input.productionBatchId)
  ));
  if (!inspections.length || inspections.some((inspection) => inspection.result !== "passed")) throw new Error("Production release requires completed passing inspections.");
  const [released] = await tx.update(productionBatches).set({
    status: "released",
    completedQuantity: input.completedQuantity,
    releasedAt: now,
    releasedBy: context.actorId,
    version: input.expectedVersion + 1,
    updatedAt: now
  }).where(and(
    eq(productionBatches.organizationId, context.organizationId),
    eq(productionBatches.id, input.productionBatchId),
    eq(productionBatches.version, input.expectedVersion),
    inArray(productionBatches.status, ["in_progress", "inspection"])
  )).returning({ id: productionBatches.id });
  if (!released) throw new Error("Production batch changed concurrently.");
  await tx.update(salesOrders).set({ status: "ready_to_ship", updatedAt: now }).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, batch.salesOrderId), eq(salesOrders.status, "in_production")
  ));
}

export async function createShipment(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly salesOrderId: string;
    readonly shipmentReference: string;
    readonly bookingReference: string;
    readonly carrierReference?: string | null;
    readonly forwarderReference?: string | null;
    readonly mode: "sea" | "air" | "road" | "rail" | "multimodal" | "courier";
    readonly originLocation: string;
    readonly destinationLocation: string;
    readonly plannedDepartureAt: Date;
    readonly plannedArrivalAt: Date;
    readonly ownerMembershipId: string;
    readonly packages: readonly { readonly packageReference: string; readonly packageType: string; readonly itemCount: number; readonly netWeightGrams: number; readonly grossWeightGrams: number; readonly lengthMm?: number | null; readonly widthMm?: number | null; readonly heightMm?: number | null; readonly marksAndNumbers?: string | null }[];
  },
  now = new Date()
): Promise<string> {
  if (!input.packages.length) throw new Error("Shipment requires at least one package.");
  if (input.plannedArrivalAt.getTime() <= input.plannedDepartureAt.getTime()) throw new Error("Planned arrival must follow departure.");
  const [order] = await tx.select({ exportLaneId: salesOrders.exportLaneId, status: salesOrders.status }).from(salesOrders).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, input.salesOrderId)
  )).limit(1);
  if (!order || order.exportLaneId !== input.exportLaneId || !["ready_to_ship", "shipped"].includes(order.status)) throw new Error("Shipment requires a release-ready sales order in the same Export Lane.");
  const [shipment] = await tx.insert(shipments).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    salesOrderId: input.salesOrderId,
    shipmentReference: requiredText(input.shipmentReference, "Shipment reference"),
    bookingReference: requiredText(input.bookingReference, "Booking reference"),
    carrierReference: optionalText(input.carrierReference),
    forwarderReference: optionalText(input.forwarderReference),
    status: "booked",
    mode: input.mode,
    originLocation: requiredText(input.originLocation, "Shipment origin"),
    destinationLocation: requiredText(input.destinationLocation, "Shipment destination"),
    plannedDepartureAt: input.plannedDepartureAt,
    plannedArrivalAt: input.plannedArrivalAt,
    ownerMembershipId: input.ownerMembershipId
  }).returning({ id: shipments.id });
  if (!shipment) throw new Error("Shipment did not return an identifier.");
  await tx.insert(shipmentPackages).values(input.packages.map((item) => {
    const dimensions = [item.lengthMm, item.widthMm, item.heightMm];
    if (dimensions.some((value) => value != null) && dimensions.some((value) => value == null)) throw new Error("Package dimensions must be supplied together.");
    const netWeightGrams = positiveInteger(item.netWeightGrams, "Package net weight");
    const grossWeightGrams = positiveInteger(item.grossWeightGrams, "Package gross weight");
    if (grossWeightGrams < netWeightGrams) throw new Error("Gross weight cannot be less than net weight.");
    return {
      organizationId: context.organizationId,
      shipmentId: shipment.id,
      packageReference: requiredText(item.packageReference, "Package reference"),
      packageType: requiredText(item.packageType, "Package type"),
      itemCount: positiveInteger(item.itemCount, "Package item count"),
      netWeightGrams,
      grossWeightGrams,
      lengthMm: item.lengthMm ?? null,
      widthMm: item.widthMm ?? null,
      heightMm: item.heightMm ?? null,
      marksAndNumbers: optionalText(item.marksAndNumbers)
    };
  }));
  await tx.update(salesOrders).set({ status: "shipped", updatedAt: now }).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, input.salesOrderId), eq(salesOrders.status, "ready_to_ship")
  ));
  await tx.update(exportLanes).set({ stage: "shipment", version: sql`${exportLanes.version} + 1`, updatedAt: now }).where(and(
    eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, input.exportLaneId)
  ));
  await recordAuditEvent(tx, context, { action: "shipment.created", entityType: "shipment", entityId: shipment.id, metadata: { exportLaneId: input.exportLaneId, salesOrderId: input.salesOrderId, packageCount: input.packages.length, mode: input.mode } });
  return shipment.id;
}

export async function transitionShipment(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly shipmentId: string; readonly expectedVersion: number; readonly toStatus: "in_transit" | "arrived" | "delivered" | "cancelled"; readonly actualAt?: Date },
  now = new Date()
): Promise<void> {
  const [current] = await tx.select({ status: shipments.status, exportLaneId: shipments.exportLaneId }).from(shipments).where(and(
    eq(shipments.organizationId, context.organizationId), eq(shipments.id, input.shipmentId), eq(shipments.version, input.expectedVersion)
  )).for("update").limit(1);
  if (!current) throw new Error("Shipment was not found or changed concurrently.");
  const allowed: Record<typeof current.status, readonly string[]> = {
    planning: ["cancelled"], booked: ["in_transit", "cancelled"], in_transit: ["arrived", "cancelled"], arrived: ["delivered"], delivered: [], cancelled: []
  };
  if (!allowed[current.status].includes(input.toStatus)) throw new Error(`Shipment cannot move from ${current.status} to ${input.toStatus}.`);
  const actualAt = input.actualAt ?? now;
  const timing = input.toStatus === "in_transit" ? { actualDepartureAt: actualAt }
    : input.toStatus === "arrived" ? { actualArrivalAt: actualAt }
      : input.toStatus === "delivered" ? { deliveredAt: actualAt } : {};
  const [updated] = await tx.update(shipments).set({ status: input.toStatus, ...timing, version: input.expectedVersion + 1, updatedAt: now }).where(and(
    eq(shipments.organizationId, context.organizationId), eq(shipments.id, input.shipmentId), eq(shipments.version, input.expectedVersion), eq(shipments.status, current.status)
  )).returning({ id: shipments.id });
  if (!updated) throw new Error("Shipment changed concurrently.");
  await recordAuditEvent(tx, context, { action: "shipment.transitioned", entityType: "shipment", entityId: input.shipmentId, metadata: { exportLaneId: current.exportLaneId, fromStatus: current.status, toStatus: input.toStatus } });
}

export async function recordShipmentException(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly shipmentId?: string | null;
    readonly productionBatchId?: string | null;
    readonly exceptionType: string;
    readonly summary: string;
    readonly costImpactMinor: number;
    readonly currency: string;
    readonly deadlineImpactMinutes: number;
    readonly documentImpact: boolean;
    readonly buyerCommunicationRequired: boolean;
    readonly ownerMembershipId: string;
  }
): Promise<string> {
  if (!input.shipmentId && !input.productionBatchId) throw new Error("Exception requires a shipment or production batch.");
  const [exception] = await tx.insert(shipmentExceptions).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    shipmentId: input.shipmentId ?? null,
    productionBatchId: input.productionBatchId ?? null,
    exceptionType: requiredText(input.exceptionType, "Exception type"),
    summary: requiredText(input.summary, "Exception summary"),
    costImpactMinor: checkedMoney(input.costImpactMinor),
    currency: currency(input.currency),
    deadlineImpactMinutes: nonNegativeInteger(input.deadlineImpactMinutes, "Deadline impact"),
    documentImpact: input.documentImpact,
    buyerCommunicationRequired: input.buyerCommunicationRequired,
    ownerMembershipId: input.ownerMembershipId
  }).returning({ id: shipmentExceptions.id });
  if (!exception) throw new Error("Shipment exception did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "shipment.exception_recorded", entityType: "shipment_exception", entityId: exception.id, metadata: { exportLaneId: input.exportLaneId, exceptionType: input.exceptionType, documentImpact: input.documentImpact, buyerCommunicationRequired: input.buyerCommunicationRequired } });
  return exception.id;
}

export async function resolveShipmentException(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly exceptionId: string; readonly expectedVersion: number; readonly resolution: string; readonly buyerCommunicationAuditId?: string | null },
  now = new Date()
): Promise<void> {
  const [current] = await tx.select({ exportLaneId: shipmentExceptions.exportLaneId, buyerCommunicationRequired: shipmentExceptions.buyerCommunicationRequired, createdAt: shipmentExceptions.createdAt })
    .from(shipmentExceptions).where(and(
      eq(shipmentExceptions.organizationId, context.organizationId), eq(shipmentExceptions.id, input.exceptionId), eq(shipmentExceptions.version, input.expectedVersion), inArray(shipmentExceptions.status, ["open", "investigating", "mitigating"])
    )).for("update").limit(1);
  if (!current) throw new Error("Open shipment exception was not found.");
  if (current.buyerCommunicationRequired && !input.buyerCommunicationAuditId) throw new Error("Exception resolution requires the buyer communication record.");
  if (input.buyerCommunicationAuditId) {
    const [communication] = await tx.select({ id: buyerCommunicationAudit.id }).from(buyerCommunicationAudit).where(and(
      eq(buyerCommunicationAudit.organizationId, context.organizationId), eq(buyerCommunicationAudit.id, input.buyerCommunicationAuditId), eq(buyerCommunicationAudit.exportLaneId, current.exportLaneId)
    )).limit(1);
    if (!communication) throw new Error("Buyer communication record does not match the exception lane.");
  }
  const [resolved] = await tx.update(shipmentExceptions).set({
    status: "resolved",
    resolution: requiredText(input.resolution, "Exception resolution"),
    buyerCommunicationAuditId: input.buyerCommunicationAuditId ?? null,
    resolvedBy: context.actorId,
    resolvedAt: now,
    version: input.expectedVersion + 1,
    updatedAt: now
  }).where(and(eq(shipmentExceptions.organizationId, context.organizationId), eq(shipmentExceptions.id, input.exceptionId), eq(shipmentExceptions.version, input.expectedVersion)))
    .returning({ id: shipmentExceptions.id });
  if (!resolved) throw new Error("Shipment exception changed concurrently.");
  await tx.insert(laneOutcomeMetrics).values({
    organizationId: context.organizationId,
    exportLaneId: current.exportLaneId,
    metricName: "exception_resolution_minutes",
    integerValue: Math.max(0, Math.floor((now.getTime() - current.createdAt.getTime()) / 60_000)),
    unit: "minutes",
    sourceEntityType: "shipment_exception",
    sourceEntityId: input.exceptionId,
    measuredAt: now,
    recordedBy: context.actorId
  });
  await recordAuditEvent(tx, context, { action: "shipment.exception_resolved", entityType: "shipment_exception", entityId: input.exceptionId, metadata: { exportLaneId: current.exportLaneId, buyerCommunicationRecorded: Boolean(input.buyerCommunicationAuditId) } });
}

export async function issueTradeInvoice(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly salesOrderId: string;
    readonly shipmentId?: string | null;
    readonly invoiceNumber: string;
    readonly currency: string;
    readonly invoiceTotalMinor: number;
    readonly paymentTerms: string;
    readonly dueAt: Date;
    readonly generatedDocumentId?: string | null;
    readonly schedule: readonly { readonly expectedAmountMinor: number; readonly dueAt: Date; readonly condition: string }[];
  },
  now = new Date()
): Promise<string> {
  if (!input.schedule.length) throw new Error("Trade invoice requires an expected payment schedule.");
  const invoiceTotalMinor = positiveInteger(input.invoiceTotalMinor, "Invoice total");
  const scheduleTotal = input.schedule.reduce((total, item) => total + positiveInteger(item.expectedAmountMinor, "Scheduled payment"), 0);
  if (scheduleTotal !== invoiceTotalMinor) throw new Error("Payment schedule must equal the invoice total.");
  const [order] = await tx.select({ exportLaneId: salesOrders.exportLaneId }).from(salesOrders).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, input.salesOrderId)
  )).limit(1);
  if (!order || order.exportLaneId !== input.exportLaneId) throw new Error("Invoice order and Export Lane must match.");
  const [invoice] = await tx.insert(tradeInvoices).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    salesOrderId: input.salesOrderId,
    shipmentId: input.shipmentId ?? null,
    invoiceNumber: requiredText(input.invoiceNumber, "Invoice number"),
    status: "issued",
    currency: currency(input.currency),
    invoiceTotalMinor,
    paymentTerms: requiredText(input.paymentTerms, "Payment terms"),
    issuedAt: now,
    dueAt: input.dueAt,
    generatedDocumentId: input.generatedDocumentId ?? null,
    createdBy: context.actorId
  }).returning({ id: tradeInvoices.id });
  if (!invoice) throw new Error("Trade invoice did not return an identifier.");
  await tx.insert(invoicePaymentSchedules).values(input.schedule.map((item, index) => ({
    organizationId: context.organizationId,
    tradeInvoiceId: invoice.id,
    sequence: index + 1,
    expectedAmountMinor: item.expectedAmountMinor,
    dueAt: item.dueAt,
    condition: requiredText(item.condition, "Payment schedule condition")
  })));
  await tx.update(exportLanes).set({ stage: "payment", version: sql`${exportLanes.version} + 1`, updatedAt: now }).where(and(
    eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, input.exportLaneId)
  ));
  await recordAuditEvent(tx, context, { action: "trade_invoice.issued", entityType: "trade_invoice", entityId: invoice.id, metadata: { exportLaneId: input.exportLaneId, salesOrderId: input.salesOrderId, currency: input.currency, invoiceTotalMinor, scheduleCount: input.schedule.length } });
  return invoice.id;
}

export async function recordPaymentReceipt(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly buyerAccountId: string;
    readonly currency: string;
    readonly grossAmountMinor: number;
    readonly bankFeeMinor: number;
    readonly otherFeeMinor: number;
    readonly valueDate: Date;
    readonly bankAdviceDocumentVersionId: string;
    readonly bankReference: string;
    readonly fxRateNumerator?: number | null;
    readonly fxRateDenominator?: number | null;
  }
): Promise<string> {
  const [buyer] = await tx.select({ id: buyerAccounts.id }).from(buyerAccounts).where(and(
    eq(buyerAccounts.organizationId, context.organizationId), eq(buyerAccounts.id, input.buyerAccountId)
  )).limit(1);
  if (!buyer) throw new Error("Buyer account was not found.");
  const gross = positiveInteger(input.grossAmountMinor, "Gross receipt");
  const bankFee = checkedMoney(input.bankFeeMinor);
  const otherFee = checkedMoney(input.otherFeeMinor);
  if (bankFee + otherFee > gross) throw new Error("Payment fees cannot exceed the gross receipt.");
  if ((input.fxRateNumerator == null) !== (input.fxRateDenominator == null)) throw new Error("FX numerator and denominator must be supplied together.");
  const [receipt] = await tx.insert(paymentReceipts).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    buyerAccountId: input.buyerAccountId,
    status: "bank_advice_received",
    currency: currency(input.currency),
    grossAmountMinor: gross,
    bankFeeMinor: bankFee,
    otherFeeMinor: otherFee,
    netAmountMinor: gross - bankFee - otherFee,
    fxRateNumerator: input.fxRateNumerator ?? null,
    fxRateDenominator: input.fxRateDenominator ?? null,
    valueDate: input.valueDate,
    bankAdviceDocumentVersionId: input.bankAdviceDocumentVersionId,
    bankReference: requiredText(input.bankReference, "Bank reference"),
    recordedBy: context.actorId
  }).returning({ id: paymentReceipts.id });
  if (!receipt) throw new Error("Payment receipt did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "payment.receipt_recorded", entityType: "payment_receipt", entityId: receipt.id, metadata: { exportLaneId: input.exportLaneId, currency: input.currency, grossAmountMinor: gross, netAmountMinor: gross - bankFee - otherFee, bankAdviceRecorded: true } });
  return receipt.id;
}

export async function allocatePaymentReceipt(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly paymentReceiptId: string; readonly tradeInvoiceId: string; readonly amountMinor: number },
  now = new Date()
): Promise<void> {
  const [receipt] = await tx.select({ exportLaneId: paymentReceipts.exportLaneId, netAmountMinor: paymentReceipts.netAmountMinor, currency: paymentReceipts.currency, status: paymentReceipts.status })
    .from(paymentReceipts).where(and(eq(paymentReceipts.organizationId, context.organizationId), eq(paymentReceipts.id, input.paymentReceiptId))).for("update").limit(1);
  const [invoice] = await tx.select({ exportLaneId: tradeInvoices.exportLaneId, salesOrderId: tradeInvoices.salesOrderId, invoiceTotalMinor: tradeInvoices.invoiceTotalMinor, allocatedMinor: tradeInvoices.allocatedMinor, currency: tradeInvoices.currency, status: tradeInvoices.status })
    .from(tradeInvoices).where(and(eq(tradeInvoices.organizationId, context.organizationId), eq(tradeInvoices.id, input.tradeInvoiceId))).for("update").limit(1);
  if (!receipt || !invoice || receipt.exportLaneId !== invoice.exportLaneId) throw new Error("Payment receipt and invoice must belong to the same Export Lane.");
  if (receipt.currency !== invoice.currency) throw new Error("Cross-currency allocation requires a separately reviewed FX conversion record.");
  if (!["bank_advice_received", "matched", "confirmed"].includes(receipt.status) || !["issued", "partially_paid", "overdue"].includes(invoice.status)) throw new Error("Payment receipt or invoice is not allocatable.");
  const amountMinor = positiveInteger(input.amountMinor, "Payment allocation");
  const existingAllocations = await tx.select({ amountMinor: paymentAllocations.amountMinor }).from(paymentAllocations).where(and(
    eq(paymentAllocations.organizationId, context.organizationId), eq(paymentAllocations.paymentReceiptId, input.paymentReceiptId)
  ));
  if (existingAllocations.reduce((sum, row) => sum + row.amountMinor, 0) + amountMinor > receipt.netAmountMinor) throw new Error("Payment allocation exceeds the net receipt.");
  if (invoice.allocatedMinor + amountMinor > invoice.invoiceTotalMinor) throw new Error("Payment allocation exceeds the outstanding invoice.");
  await tx.insert(paymentAllocations).values({
    organizationId: context.organizationId,
    paymentReceiptId: input.paymentReceiptId,
    tradeInvoiceId: input.tradeInvoiceId,
    salesOrderId: invoice.salesOrderId,
    exportLaneId: invoice.exportLaneId,
    amountMinor,
    allocatedBy: context.actorId,
    allocatedAt: now
  });
  const allocatedMinor = invoice.allocatedMinor + amountMinor;
  await tx.update(tradeInvoices).set({ allocatedMinor, status: allocatedMinor === invoice.invoiceTotalMinor ? "paid" : "partially_paid", updatedAt: now }).where(and(
    eq(tradeInvoices.organizationId, context.organizationId), eq(tradeInvoices.id, input.tradeInvoiceId), eq(tradeInvoices.allocatedMinor, invoice.allocatedMinor)
  ));
  await tx.update(paymentReceipts).set({ status: "matched", updatedAt: now }).where(and(
    eq(paymentReceipts.organizationId, context.organizationId), eq(paymentReceipts.id, input.paymentReceiptId), inArray(paymentReceipts.status, ["bank_advice_received", "matched"])
  ));
  await recordAuditEvent(tx, context, { action: "payment.allocated", entityType: "payment_allocation", entityId: input.paymentReceiptId, metadata: { tradeInvoiceId: input.tradeInvoiceId, exportLaneId: invoice.exportLaneId, amountMinor, currency: invoice.currency } });
}

export async function confirmRealizedProceeds(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly tradeInvoiceId: string; readonly contributionCostMinor: number },
  now = new Date()
): Promise<string> {
  if (context.actorType === "customer") throw new Error("A reviewed finance/operations actor must confirm realized proceeds.");
  const [invoice] = await tx.select({
    exportLaneId: tradeInvoices.exportLaneId,
    salesOrderId: tradeInvoices.salesOrderId,
    currency: tradeInvoices.currency,
    invoiceTotalMinor: tradeInvoices.invoiceTotalMinor,
    allocatedMinor: tradeInvoices.allocatedMinor,
    status: tradeInvoices.status,
    orderConfirmedAt: salesOrders.confirmedAt
  }).from(tradeInvoices).innerJoin(salesOrders, and(eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, tradeInvoices.salesOrderId)))
    .where(and(eq(tradeInvoices.organizationId, context.organizationId), eq(tradeInvoices.id, input.tradeInvoiceId))).for("update").limit(1);
  if (!invoice || invoice.status !== "paid" || invoice.allocatedMinor !== invoice.invoiceTotalMinor) throw new Error("Realized proceeds require a fully matched paid invoice.");
  const allocations = await tx.select({ amountMinor: paymentAllocations.amountMinor, receiptId: paymentAllocations.paymentReceiptId, gross: paymentReceipts.grossAmountMinor, bankFee: paymentReceipts.bankFeeMinor, otherFee: paymentReceipts.otherFeeMinor })
    .from(paymentAllocations).innerJoin(paymentReceipts, and(eq(paymentReceipts.organizationId, context.organizationId), eq(paymentReceipts.id, paymentAllocations.paymentReceiptId)))
    .where(and(eq(paymentAllocations.organizationId, context.organizationId), eq(paymentAllocations.tradeInvoiceId, input.tradeInvoiceId)));
  if (!allocations.length) throw new Error("Realized proceeds require matched payment allocations.");
  const receivedMinor = allocations.reduce((sum, item) => sum + item.amountMinor, 0);
  const uniqueReceipts = new Map(allocations.map((item) => [item.receiptId, item]));
  const feesMinor = [...uniqueReceipts.values()].reduce((sum, item) => sum + item.bankFee + item.otherFee, 0);
  const realizedMinor = Math.max(0, receivedMinor - feesMinor);
  const contributionCostMinor = checkedMoney(input.contributionCostMinor);
  const actualMarginBps = realizedMinor === 0 ? -100000 : Math.floor(((realizedMinor - contributionCostMinor) * 10000) / realizedMinor);
  const cycleTimeMinutes = Math.max(0, Math.floor((now.getTime() - invoice.orderConfirmedAt.getTime()) / 60_000));
  const [proceeds] = await tx.insert(realizedProceeds).values({
    organizationId: context.organizationId,
    exportLaneId: invoice.exportLaneId,
    salesOrderId: invoice.salesOrderId,
    tradeInvoiceId: input.tradeInvoiceId,
    currency: invoice.currency,
    invoicedMinor: invoice.invoiceTotalMinor,
    receivedMinor,
    feesMinor,
    realizedMinor,
    contributionCostMinor,
    actualMarginBps,
    cycleTimeMinutes,
    confirmedBy: context.actorId,
    confirmedAt: now
  }).returning({ id: realizedProceeds.id });
  if (!proceeds) throw new Error("Realized proceeds did not return an identifier.");
  await tx.insert(laneOutcomeMetrics).values([
    { organizationId: context.organizationId, exportLaneId: invoice.exportLaneId, metricName: "actual_margin_bps", integerValue: actualMarginBps, unit: "basis_points", sourceEntityType: "realized_proceeds", sourceEntityId: proceeds.id, measuredAt: now, recordedBy: context.actorId },
    { organizationId: context.organizationId, exportLaneId: invoice.exportLaneId, metricName: "order_to_proceeds_minutes", integerValue: cycleTimeMinutes, unit: "minutes", sourceEntityType: "realized_proceeds", sourceEntityId: proceeds.id, measuredAt: now, recordedBy: context.actorId },
    { organizationId: context.organizationId, exportLaneId: invoice.exportLaneId, metricName: "invoiced_minor", integerValue: invoice.invoiceTotalMinor, unit: invoice.currency, sourceEntityType: "realized_proceeds", sourceEntityId: proceeds.id, measuredAt: now, recordedBy: context.actorId },
    { organizationId: context.organizationId, exportLaneId: invoice.exportLaneId, metricName: "realized_minor", integerValue: realizedMinor, unit: invoice.currency, sourceEntityType: "realized_proceeds", sourceEntityId: proceeds.id, measuredAt: now, recordedBy: context.actorId }
  ]);
  await tx.update(exportLanes).set({ stage: "repeat", version: sql`${exportLanes.version} + 1`, updatedAt: now }).where(and(
    eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, invoice.exportLaneId), eq(exportLanes.stage, "payment")
  ));
  await tx.update(salesOrders).set({ status: "completed", updatedAt: now }).where(and(
    eq(salesOrders.organizationId, context.organizationId), eq(salesOrders.id, invoice.salesOrderId)
  ));
  await recordAuditEvent(tx, context, { action: "proceeds.confirmed", entityType: "realized_proceeds", entityId: proceeds.id, metadata: { tradeInvoiceId: input.tradeInvoiceId, exportLaneId: invoice.exportLaneId, currency: invoice.currency, invoicedMinor: invoice.invoiceTotalMinor, realizedMinor, actualMarginBps, cycleTimeMinutes } });
  return proceeds.id;
}

export async function createOverdueFinancialDiscrepancy(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly tradeInvoiceId: string; readonly ownerMembershipId: string },
  now = new Date()
): Promise<string | null> {
  const [invoice] = await tx.select({ exportLaneId: tradeInvoices.exportLaneId, invoiceTotalMinor: tradeInvoices.invoiceTotalMinor, allocatedMinor: tradeInvoices.allocatedMinor, currency: tradeInvoices.currency, dueAt: tradeInvoices.dueAt, status: tradeInvoices.status })
    .from(tradeInvoices).where(and(eq(tradeInvoices.organizationId, context.organizationId), eq(tradeInvoices.id, input.tradeInvoiceId))).limit(1);
  if (!invoice || invoice.dueAt.getTime() >= now.getTime() || ["paid", "void"].includes(invoice.status)) return null;
  await tx.update(tradeInvoices).set({ status: "overdue", updatedAt: now }).where(and(eq(tradeInvoices.organizationId, context.organizationId), eq(tradeInvoices.id, input.tradeInvoiceId)));
  const [caseRecord] = await tx.insert(financialDiscrepancies).values({
    organizationId: context.organizationId,
    exportLaneId: invoice.exportLaneId,
    tradeInvoiceId: input.tradeInvoiceId,
    discrepancyType: "overdue_payment",
    expectedMinor: invoice.invoiceTotalMinor,
    actualMinor: invoice.allocatedMinor,
    currency: invoice.currency,
    ownerMembershipId: input.ownerMembershipId,
    dueAt: now
  }).returning({ id: financialDiscrepancies.id });
  return caseRecord?.id ?? null;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function currency(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency requires an ISO alpha-3 code.");
  return normalized;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer.`);
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}

function checkedMoney(value: number): number {
  return nonNegativeInteger(value, "Money");
}
