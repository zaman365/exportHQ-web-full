import { and, desc, eq, sql } from "drizzle-orm";
import { reconciliationVariance } from "@exporthq/platform";
import { recordAuditEvent } from "../audit";
import { grantOrganizationEntitlement, revokeOrganizationEntitlement, type EntitlementTier } from "../entitlements";
import {
  billingAccounts,
  billingCancellationRequests,
  billingEntitlementTransitions,
  billingPlanCatalogVersions,
  billingPlanPrices,
  billingProviderEvents,
  billingReconciliationResults,
  billingSubscriptionHistory,
  billingSubscriptions,
  customerBillingInvoices,
  organizationEntitlements
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface BillingCatalogPriceRecord {
  readonly id: string;
  readonly productKey: string;
  readonly displayName: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly billingInterval: string;
  readonly billingCadenceMonths: number | null;
  readonly offerStatus: string;
  readonly selfServiceEnabled: false;
}

export async function readBillingCatalog(tx: ExportHqTransaction): Promise<BillingCatalogPriceRecord[]> {
  const rows = await tx.select({
    id: billingPlanPrices.id,
    productKey: billingPlanPrices.productKey,
    displayName: billingPlanPrices.displayName,
    amountMinor: billingPlanPrices.amountMinor,
    currency: billingPlanPrices.currency,
    billingInterval: billingPlanPrices.billingInterval,
    billingCadenceMonths: billingPlanPrices.billingCadenceMonths,
    offerStatus: billingPlanPrices.offerStatus,
    selfServiceEnabled: billingPlanCatalogVersions.selfServiceEnabled
  }).from(billingPlanPrices).innerJoin(billingPlanCatalogVersions, eq(billingPlanCatalogVersions.id, billingPlanPrices.catalogVersionId));
  return rows.map((row) => ({ ...row, selfServiceEnabled: false as const }));
}

export async function createBillingAccount(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly legalName: string; readonly billingEmail: string; readonly billingAddress: Record<string, string>; readonly taxRegistrationReference?: string | null }
): Promise<string> {
  if (!Object.keys(input.billingAddress).length) throw new Error("Billing address is required.");
  const [account] = await tx.insert(billingAccounts).values({
    organizationId: context.organizationId,
    legalName: requiredText(input.legalName, "Billing legal name"),
    billingEmail: email(input.billingEmail),
    billingAddress: input.billingAddress,
    taxRegistrationReference: optionalText(input.taxRegistrationReference),
    currency: "BDT",
    createdBy: context.actorId
  }).returning({ id: billingAccounts.id });
  if (!account) throw new Error("Billing account did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "billing.account_created", entityType: "billing_account", entityId: account.id, metadata: { currency: "BDT" } });
  return account.id;
}

export async function createManualSubscriptionGrant(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly billingAccountId: string;
    readonly planPriceId: string;
    readonly currentPeriodStart: Date;
    readonly currentPeriodEnd: Date;
    readonly manualGrantReference: string;
  }
): Promise<string> {
  requireOperations(context, "create a manual subscription grant");
  if (input.currentPeriodEnd.getTime() <= input.currentPeriodStart.getTime()) throw new Error("Subscription period end must follow its start.");
  const [price] = await tx.select({ productKey: billingPlanPrices.productKey, displayName: billingPlanPrices.displayName, selfServiceEnabled: billingPlanCatalogVersions.selfServiceEnabled })
    .from(billingPlanPrices).innerJoin(billingPlanCatalogVersions, eq(billingPlanCatalogVersions.id, billingPlanPrices.catalogVersionId))
    .where(eq(billingPlanPrices.id, input.planPriceId)).limit(1);
  if (!price) throw new Error("Billing catalog price was not found.");
  if (price.selfServiceEnabled) throw new Error("R3 manual grant cannot use a self-service catalog.");
  const tier = tierForProduct(price.productKey);
  const [current] = await tx.select({ tier: organizationEntitlements.tier }).from(organizationEntitlements).where(and(
    eq(organizationEntitlements.organizationId, context.organizationId),
    sql`${organizationEntitlements.revokedAt} is null`
  )).orderBy(desc(organizationEntitlements.effectiveFrom)).limit(1);
  const fromTier = current?.tier ?? "explore";
  const entitlementId = await grantOrganizationEntitlement(tx, context, {
    tier,
    source: "paid",
    reason: `Manual R3 grant: ${requiredText(input.manualGrantReference, "Manual grant reference")}`,
    effectiveFrom: input.currentPeriodStart,
    effectiveTo: input.currentPeriodEnd
  });
  const [subscription] = await tx.insert(billingSubscriptions).values({
    organizationId: context.organizationId,
    billingAccountId: input.billingAccountId,
    planPriceId: input.planPriceId,
    entitlementId,
    status: "active",
    source: "manual",
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
    createdBy: context.actorId
  }).returning({ id: billingSubscriptions.id });
  if (!subscription) throw new Error("Billing subscription did not return an identifier.");
  if (fromTier !== tier) {
    await tx.insert(billingEntitlementTransitions).values({
      organizationId: context.organizationId,
      subscriptionId: subscription.id,
      entitlementId,
      fromTier,
      toTier: tier,
      reason: "manual_r3_grant",
      reconciliationReference: input.manualGrantReference,
      changedBy: context.actorId,
      changedAt: input.currentPeriodStart
    });
  }
  await recordAuditEvent(tx, context, { action: "billing.subscription_created", entityType: "billing_subscription", entityId: subscription.id, metadata: { productKey: price.productKey, tier, source: "manual", manualGrantReference: input.manualGrantReference, selfService: false } });
  return subscription.id;
}

export async function issueCustomerBillingInvoice(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly billingAccountId: string;
    readonly subscriptionId?: string | null;
    readonly invoiceNumber: string;
    readonly subtotalMinor: number;
    readonly taxMinor: number;
    readonly creditAppliedMinor: number;
    readonly dueAt: Date;
    readonly documentStorageRef: string;
  },
  now = new Date()
): Promise<string> {
  requireOperations(context, "issue a customer billing invoice");
  const subtotalMinor = money(input.subtotalMinor);
  const taxMinor = money(input.taxMinor);
  const creditAppliedMinor = money(input.creditAppliedMinor);
  const totalMinor = subtotalMinor + taxMinor - creditAppliedMinor;
  if (totalMinor < 0) throw new Error("Billing credit cannot exceed subtotal and tax.");
  const [invoice] = await tx.insert(customerBillingInvoices).values({
    organizationId: context.organizationId,
    billingAccountId: input.billingAccountId,
    subscriptionId: input.subscriptionId ?? null,
    invoiceNumber: requiredText(input.invoiceNumber, "Billing invoice number"),
    status: "issued",
    currency: "BDT",
    subtotalMinor,
    taxMinor,
    creditAppliedMinor,
    totalMinor,
    issuedAt: now,
    dueAt: input.dueAt,
    documentStorageRef: requiredStorageReference(input.documentStorageRef),
    createdBy: context.actorId
  }).returning({ id: customerBillingInvoices.id });
  if (!invoice) throw new Error("Customer billing invoice did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "billing.invoice_issued", entityType: "customer_billing_invoice", entityId: invoice.id, metadata: { subscriptionId: input.subscriptionId ?? null, currency: "BDT", subtotalMinor, taxMinor, creditAppliedMinor, totalMinor } });
  return invoice.id;
}

/** Called only after the owner/admin permission check in the application. The
 * customer can create an immutable request; operations cannot silently erase it. */
export async function requestSubscriptionCancellation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly reason: string },
  now = new Date()
): Promise<string> {
  const [subscription] = await tx.select({ status: billingSubscriptions.status, currentPeriodEnd: billingSubscriptions.currentPeriodEnd }).from(billingSubscriptions).where(and(
    eq(billingSubscriptions.organizationId, context.organizationId),
    eq(billingSubscriptions.id, input.subscriptionId),
    eq(billingSubscriptions.status, "active")
  )).limit(1);
  if (!subscription) throw new Error("Active subscription was not found.");
  const [request] = await tx.insert(billingCancellationRequests).values({
    organizationId: context.organizationId,
    subscriptionId: input.subscriptionId,
    requestedBy: context.actorId,
    reason: requiredText(input.reason, "Cancellation reason"),
    requestedAt: now,
    effectiveAt: subscription.currentPeriodEnd,
    status: "requested"
  }).returning({ id: billingCancellationRequests.id });
  if (!request) throw new Error("Cancellation request did not return an identifier.");
  return request.id;
}

export async function processSubscriptionCancellation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly cancellationRequestId: string; readonly processingReference: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "process a subscription cancellation");
  const [request] = await tx.update(billingCancellationRequests).set({
    status: "processed",
    processedBy: context.actorId,
    processedAt: now,
    processingReference: requiredText(input.processingReference, "Cancellation processing reference")
  }).where(and(
    eq(billingCancellationRequests.organizationId, context.organizationId),
    eq(billingCancellationRequests.id, input.cancellationRequestId),
    eq(billingCancellationRequests.status, "requested")
  )).returning({ subscriptionId: billingCancellationRequests.subscriptionId, reason: billingCancellationRequests.reason });
  if (!request) throw new Error("Open cancellation request was not found.");
  await tx.update(billingSubscriptions).set({
    cancelAtPeriodEnd: true,
    cancellationReason: request.reason,
    version: sql`${billingSubscriptions.version} + 1`,
    updatedAt: now
  }).where(and(eq(billingSubscriptions.organizationId, context.organizationId), eq(billingSubscriptions.id, request.subscriptionId), eq(billingSubscriptions.status, "active")));
}

export async function transitionManualSubscription(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly expectedVersion: number; readonly toStatus: "past_due" | "paused" | "cancelled" | "expired"; readonly reason: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "transition a manual subscription");
  const [current] = await tx.select({ status: billingSubscriptions.status, entitlementId: billingSubscriptions.entitlementId }).from(billingSubscriptions).where(and(
    eq(billingSubscriptions.organizationId, context.organizationId), eq(billingSubscriptions.id, input.subscriptionId), eq(billingSubscriptions.version, input.expectedVersion)
  )).for("update").limit(1);
  if (!current) throw new Error("Billing subscription was not found or changed concurrently.");
  const allowed: Record<typeof current.status, readonly string[]> = {
    pending: ["cancelled"], active: ["past_due", "paused", "cancelled", "expired"], past_due: ["paused", "cancelled"], paused: ["cancelled", "expired"], cancelled: [], expired: []
  };
  if (!allowed[current.status].includes(input.toStatus)) throw new Error(`Subscription cannot move from ${current.status} to ${input.toStatus}.`);
  const reason = requiredText(input.reason, "Subscription transition reason");
  const version = input.expectedVersion + 1;
  const [updated] = await tx.update(billingSubscriptions).set({
    status: input.toStatus,
    cancelledAt: input.toStatus === "cancelled" ? now : null,
    cancellationReason: input.toStatus === "cancelled" ? reason : null,
    version,
    updatedAt: now
  }).where(and(eq(billingSubscriptions.organizationId, context.organizationId), eq(billingSubscriptions.id, input.subscriptionId), eq(billingSubscriptions.version, input.expectedVersion)))
    .returning({ id: billingSubscriptions.id });
  if (!updated) throw new Error("Billing subscription changed concurrently.");
  await tx.insert(billingSubscriptionHistory).values({
    organizationId: context.organizationId,
    subscriptionId: input.subscriptionId,
    fromStatus: current.status,
    toStatus: input.toStatus,
    aggregateVersion: version,
    reason,
    changedBy: context.actorId,
    changedAt: now
  });
  if (["cancelled", "expired"].includes(input.toStatus) && current.entitlementId) {
    await revokeOrganizationEntitlement(tx, context, current.entitlementId, reason, now);
  }
  await recordAuditEvent(tx, context, { action: "billing.subscription_transitioned", entityType: "billing_subscription", entityId: input.subscriptionId, metadata: { fromStatus: current.status, toStatus: input.toStatus, version } });
}

export async function recordVerifiedBillingProviderEvent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly provider: string; readonly providerEventId: string; readonly eventType: string; readonly payloadHashSha256: string; readonly signatureVerified: boolean; readonly receivedAt: Date }
): Promise<string> {
  requireOperations(context, "record a billing provider event");
  if (!input.signatureVerified) throw new Error("Unverified billing provider events cannot enter the ledger.");
  const [event] = await tx.insert(billingProviderEvents).values({
    organizationId: context.organizationId,
    provider: requiredText(input.provider, "Billing provider"),
    providerEventId: requiredText(input.providerEventId, "Billing provider event identifier"),
    eventType: requiredText(input.eventType, "Billing provider event type"),
    payloadHashSha256: sha256(input.payloadHashSha256, "Billing provider payload"),
    signatureVerified: true,
    receivedAt: input.receivedAt
  }).onConflictDoNothing({ target: [billingProviderEvents.provider, billingProviderEvents.providerEventId] }).returning({ id: billingProviderEvents.id });
  if (!event) {
    const [existing] = await tx.select({ id: billingProviderEvents.id }).from(billingProviderEvents).where(and(eq(billingProviderEvents.provider, input.provider), eq(billingProviderEvents.providerEventId, input.providerEventId))).limit(1);
    if (!existing) throw new Error("Billing provider event was not recorded.");
    return existing.id;
  }
  return event.id;
}

export async function recordBillingReconciliation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly billingAccountId: string; readonly periodStart: Date; readonly periodEnd: Date; readonly expectedMinor: number; readonly receivedMinor: number; readonly creditedMinor: number; readonly refundedMinor: number; readonly evidenceReference: string },
  now = new Date()
): Promise<string> {
  requireOperations(context, "record billing reconciliation");
  if (input.periodEnd.getTime() <= input.periodStart.getTime()) throw new Error("Reconciliation period end must follow its start.");
  const varianceMinor = reconciliationVariance(input);
  const [result] = await tx.insert(billingReconciliationResults).values({
    organizationId: context.organizationId,
    billingAccountId: input.billingAccountId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    expectedMinor: input.expectedMinor,
    receivedMinor: input.receivedMinor,
    creditedMinor: input.creditedMinor,
    refundedMinor: input.refundedMinor,
    varianceMinor,
    currency: "BDT",
    status: varianceMinor === 0 ? "matched" : "variance",
    evidenceReference: requiredText(input.evidenceReference, "Billing reconciliation evidence"),
    reconciledBy: context.actorId,
    reconciledAt: now
  }).returning({ id: billingReconciliationResults.id });
  if (!result) throw new Error("Billing reconciliation did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "billing.reconciled", entityType: "billing_reconciliation_result", entityId: result.id, metadata: { periodStart: input.periodStart.toISOString(), periodEnd: input.periodEnd.toISOString(), currency: "BDT", expectedMinor: input.expectedMinor, receivedMinor: input.receivedMinor, creditedMinor: input.creditedMinor, refundedMinor: input.refundedMinor, varianceMinor } });
  return result.id;
}

export async function listCustomerBillingInvoices(
  tx: ExportHqTransaction,
  context: TenantContext,
  limit = 50
) {
  return tx.select({ id: customerBillingInvoices.id, invoiceNumber: customerBillingInvoices.invoiceNumber, status: customerBillingInvoices.status, currency: customerBillingInvoices.currency, totalMinor: customerBillingInvoices.totalMinor, issuedAt: customerBillingInvoices.issuedAt, dueAt: customerBillingInvoices.dueAt, paidAt: customerBillingInvoices.paidAt, documentStorageRef: customerBillingInvoices.documentStorageRef })
    .from(customerBillingInvoices).where(eq(customerBillingInvoices.organizationId, context.organizationId))
    .orderBy(desc(customerBillingInvoices.issuedAt), desc(customerBillingInvoices.id)).limit(Math.min(100, Math.max(1, Math.floor(limit))));
}

function tierForProduct(productKey: string): EntitlementTier {
  if (productKey === "explore") return "explore";
  if (productKey === "first_shipment_pass" || productKey === "launch") return "launch";
  if (productKey === "scale") return "scale";
  if (productKey === "managed_ops") return "managed";
  throw new Error("Unsupported billing catalog product.");
}

function requireOperations(context: TenantContext, action: string): void {
  if (context.actorType === "customer") throw new Error(`Only reviewed operations may ${action}.`);
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
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("A valid billing email is required.");
  return normalized;
}

function money(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Billing money requires non-negative BDT minor units.");
  return value;
}

function sha256(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error(`${label} requires a SHA-256 hash.`);
  return normalized;
}

function requiredStorageReference(value: string): string {
  const normalized = requiredText(value, "Private billing document reference");
  if (!/^(r2|private-storage):\/\/[A-Za-z0-9/_.-]+$/.test(normalized)) throw new Error("Billing invoice requires a private storage reference.");
  return normalized;
}
