import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { projectPlanUsage, type MeteredCapability, type UsageProjection } from "@exporthq/domain";
import { assertValidatedPaymentNotification, type ValidatedPaymentNotification } from "@exporthq/platform";
import { recordAuditEvent } from "../audit";
import { grantOrganizationEntitlement, type EntitlementTier } from "../entitlements";
import {
  billingAccounts,
  billingCheckoutSessions,
  billingDunningCases,
  billingEntitlementDriftIncidents,
  billingEntitlementTransitions,
  billingPlanCatalogVersions,
  billingPlanChangeNotices,
  billingPlanPrices,
  billingProviderConfigurations,
  billingSettlementRecords,
  billingSubscriptions,
  billingTransactions,
  customerBillingInvoices,
  customerBillingRefunds,
  documentStorageObjects,
  exportLanes,
  organizationEntitlements,
  organizationMemberships,
  usageLedgerEntries
} from "../schema";
import { recordVerifiedBillingProviderEvent } from "./billing";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface PublicBetaUsageReadModel {
  readonly subscriptionId: string;
  readonly planName: string;
  readonly productKey: string;
  readonly catalogVersion: string;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly selfServiceEnabled: boolean;
  readonly usage: readonly UsageProjection[];
  readonly projectedChargeMinor: number;
  readonly currency: "BDT";
}

export async function readPublicBetaUsage(
  tx: ExportHqTransaction,
  context: TenantContext,
  projectedUsage: Readonly<Partial<Record<MeteredCapability, number>>> = {}
): Promise<PublicBetaUsageReadModel | null> {
  const [subscription] = await tx.select({
    id: billingSubscriptions.id,
    currentPeriodStart: billingSubscriptions.currentPeriodStart,
    currentPeriodEnd: billingSubscriptions.currentPeriodEnd,
    productKey: billingPlanPrices.productKey,
    planName: billingPlanPrices.displayName,
    includedActiveLanes: billingPlanPrices.includedActiveLanes,
    includedEditors: billingPlanPrices.includedEditors,
    includedStorageBytes: billingPlanPrices.includedStorageBytes,
    includedAutomationUnits: billingPlanPrices.includedAutomationUnits,
    includedWorkPacks: billingPlanPrices.includedWorkPacks,
    activeLaneOverageMinor: billingPlanPrices.activeLaneOverageMinor,
    editorOverageMinor: billingPlanPrices.editorOverageMinor,
    storageGibOverageMinor: billingPlanPrices.storageGibOverageMinor,
    automationHundredOverageMinor: billingPlanPrices.automationHundredOverageMinor,
    workPackOverageMinor: billingPlanPrices.workPackOverageMinor,
    catalogVersion: billingPlanCatalogVersions.version,
    selfServiceEnabled: billingPlanCatalogVersions.selfServiceEnabled
  }).from(billingSubscriptions)
    .innerJoin(billingPlanPrices, eq(billingPlanPrices.id, billingSubscriptions.planPriceId))
    .innerJoin(billingPlanCatalogVersions, eq(billingPlanCatalogVersions.id, billingPlanPrices.catalogVersionId))
    .where(and(
      eq(billingSubscriptions.organizationId, context.organizationId),
      inArray(billingSubscriptions.status, ["active", "past_due", "paused"])
    )).orderBy(desc(billingSubscriptions.createdAt)).limit(1);
  if (!subscription) return null;
  const countRows = (await tx.execute(sql`select
    (select count(*)::int from ${exportLanes} where ${exportLanes.organizationId} = ${context.organizationId}::uuid and ${exportLanes.status} = 'active') as active_lanes,
    (select count(*)::int from ${organizationMemberships} where ${organizationMemberships.organizationId} = ${context.organizationId}::uuid and ${organizationMemberships.active}) as editors,
    (select coalesce(sum(${documentStorageObjects.byteSize}), 0)::bigint from ${documentStorageObjects} where ${documentStorageObjects.organizationId} = ${context.organizationId}::uuid and ${documentStorageObjects.state} = 'clean') as storage_bytes,
    (select coalesce(sum(${usageLedgerEntries.quantity}), 0)::int from ${usageLedgerEntries} where ${usageLedgerEntries.organizationId} = ${context.organizationId}::uuid and ${usageLedgerEntries.usageType} = 'automation_unit' and ${usageLedgerEntries.occurredAt} >= ${subscription.currentPeriodStart.toISOString()}::timestamptz) as automation_units,
    (select coalesce(sum(${usageLedgerEntries.quantity}), 0)::int from ${usageLedgerEntries} where ${usageLedgerEntries.organizationId} = ${context.organizationId}::uuid and ${usageLedgerEntries.usageType} = 'work_pack' and ${usageLedgerEntries.occurredAt} >= ${subscription.currentPeriodStart.toISOString()}::timestamptz) as work_packs
  `)) as unknown as Array<{ active_lanes: number; editors: number; storage_bytes: string | number; automation_units: number; work_packs: number }>;
  const counts = countRows[0];
  const actual = {
    active_lane: Number(counts?.active_lanes ?? 0),
    editor: Number(counts?.editors ?? 0),
    storage_byte: Number(counts?.storage_bytes ?? 0),
    automation_unit: Number(counts?.automation_units ?? 0),
    work_pack: Number(counts?.work_packs ?? 0)
  };
  const usage = projectPlanUsage([
    { capability: "active_lane", included: subscription.includedActiveLanes ?? 0, overageUnitSize: 1, overageUnitPriceMinor: subscription.activeLaneOverageMinor },
    { capability: "editor", included: subscription.includedEditors ?? 0, overageUnitSize: 1, overageUnitPriceMinor: subscription.editorOverageMinor },
    { capability: "storage_byte", included: subscription.includedStorageBytes, overageUnitSize: 1_073_741_824, overageUnitPriceMinor: subscription.storageGibOverageMinor },
    { capability: "automation_unit", included: subscription.includedAutomationUnits, overageUnitSize: 100, overageUnitPriceMinor: subscription.automationHundredOverageMinor },
    { capability: "work_pack", included: subscription.includedWorkPacks, overageUnitSize: 1, overageUnitPriceMinor: subscription.workPackOverageMinor }
  ], actual, projectedUsage);
  return {
    subscriptionId: subscription.id,
    planName: subscription.planName,
    productKey: subscription.productKey,
    catalogVersion: subscription.catalogVersion,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    selfServiceEnabled: subscription.selfServiceEnabled,
    usage,
    projectedChargeMinor: usage.reduce((total, item) => total + item.projectedChargeMinor, 0),
    currency: "BDT"
  };
}

export async function createSelfServiceCheckout(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly billingAccountId: string;
    readonly invoiceId: string;
    readonly planPriceId: string;
    readonly providerKey: string;
    readonly merchantTransactionId: string;
    readonly idempotencyKey: string;
    readonly returnStateHashSha256: string;
    readonly expiresAt: Date;
  },
  now = new Date()
): Promise<string> {
  if (input.expiresAt.getTime() <= now.getTime()) throw new Error("Checkout expiry must be in the future.");
  const [authority] = await tx.select({
    providerConfigurationId: billingProviderConfigurations.id,
    providerStatus: billingProviderConfigurations.status,
    priceAmountMinor: billingPlanPrices.amountMinor,
    offerStatus: billingPlanPrices.offerStatus,
    catalogStatus: billingPlanCatalogVersions.status,
    selfServiceEnabled: billingPlanCatalogVersions.selfServiceEnabled,
    invoiceAmountMinor: customerBillingInvoices.totalMinor,
    invoiceStatus: customerBillingInvoices.status
  }).from(billingPlanPrices)
    .innerJoin(billingPlanCatalogVersions, eq(billingPlanCatalogVersions.id, billingPlanPrices.catalogVersionId))
    .innerJoin(billingProviderConfigurations, eq(billingProviderConfigurations.providerKey, input.providerKey))
    .innerJoin(billingAccounts, and(eq(billingAccounts.organizationId, context.organizationId), eq(billingAccounts.id, input.billingAccountId)))
    .innerJoin(customerBillingInvoices, and(
      eq(customerBillingInvoices.organizationId, context.organizationId),
      eq(customerBillingInvoices.billingAccountId, billingAccounts.id),
      eq(customerBillingInvoices.id, input.invoiceId)
    ))
    .where(eq(billingPlanPrices.id, input.planPriceId)).limit(1);
  if (!authority) throw new Error("Checkout authority records were not found.");
  if (authority.providerStatus !== "active" || authority.catalogStatus !== "published" || !authority.selfServiceEnabled || authority.offerStatus !== "public_beta") {
    throw new Error("Self-service checkout is not activated for this provider and catalog.");
  }
  if (authority.invoiceStatus !== "issued" || authority.invoiceAmountMinor < authority.priceAmountMinor) throw new Error("Checkout requires an issued invoice matching the selected price and tax treatment.");
  const [session] = await tx.insert(billingCheckoutSessions).values({
    organizationId: context.organizationId,
    billingAccountId: input.billingAccountId,
    invoiceId: input.invoiceId,
    planPriceId: input.planPriceId,
    providerConfigurationId: authority.providerConfigurationId,
    merchantTransactionId: requiredText(input.merchantTransactionId, "Merchant transaction identifier"),
    amountMinor: authority.invoiceAmountMinor,
    currency: "BDT",
    idempotencyKey: requiredText(input.idempotencyKey, "Checkout idempotency key"),
    returnStateHashSha256: sha256(input.returnStateHashSha256),
    expiresAt: input.expiresAt,
    createdBy: context.actorId
  }).onConflictDoNothing({ target: [billingCheckoutSessions.organizationId, billingCheckoutSessions.idempotencyKey] }).returning({ id: billingCheckoutSessions.id });
  if (session) return session.id;
  const [existing] = await tx.select({ id: billingCheckoutSessions.id }).from(billingCheckoutSessions).where(and(
    eq(billingCheckoutSessions.organizationId, context.organizationId),
    eq(billingCheckoutSessions.idempotencyKey, input.idempotencyKey)
  )).limit(1);
  if (!existing) throw new Error("Checkout session was not created.");
  return existing.id;
}

export async function recordCheckoutProviderSession(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly checkoutSessionId: string; readonly providerSessionReference: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "record a provider checkout session");
  const [updated] = await tx.update(billingCheckoutSessions).set({
    status: "pending",
    providerSessionReference: requiredText(input.providerSessionReference, "Provider session reference"),
    updatedAt: now
  }).where(and(
    eq(billingCheckoutSessions.organizationId, context.organizationId),
    eq(billingCheckoutSessions.id, input.checkoutSessionId),
    eq(billingCheckoutSessions.status, "created"),
    gte(billingCheckoutSessions.expiresAt, now)
  )).returning({ id: billingCheckoutSessions.id });
  if (!updated) throw new Error("Active created checkout session was not found.");
}

export async function settleValidatedCheckout(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly checkoutSessionId: string;
    readonly notification: ValidatedPaymentNotification;
    readonly providerFeeMinor: number;
  },
  now = new Date()
): Promise<{ readonly settlementId: string; readonly subscriptionId: string | null }> {
  requireOperations(context, "settle a provider checkout");
  const [checkout] = await tx.select({
    merchantTransactionId: billingCheckoutSessions.merchantTransactionId,
    amountMinor: billingCheckoutSessions.amountMinor,
    status: billingCheckoutSessions.status,
    invoiceId: billingCheckoutSessions.invoiceId,
    billingAccountId: billingCheckoutSessions.billingAccountId,
    planPriceId: billingCheckoutSessions.planPriceId,
    productKey: billingPlanPrices.productKey,
    interval: billingPlanPrices.billingInterval,
    cadenceMonths: billingPlanPrices.billingCadenceMonths,
    providerKey: billingProviderConfigurations.providerKey
  }).from(billingCheckoutSessions)
    .innerJoin(billingPlanPrices, eq(billingPlanPrices.id, billingCheckoutSessions.planPriceId))
    .innerJoin(billingProviderConfigurations, eq(billingProviderConfigurations.id, billingCheckoutSessions.providerConfigurationId))
    .where(and(eq(billingCheckoutSessions.organizationId, context.organizationId), eq(billingCheckoutSessions.id, input.checkoutSessionId)))
    .for("update", { of: billingCheckoutSessions }).limit(1);
  if (!checkout || !["created", "pending"].includes(checkout.status)) throw new Error("Settleable checkout session was not found.");
  if (checkout.providerKey !== input.notification.provider) throw new Error("Payment provider does not match checkout provider.");
  assertValidatedPaymentNotification(input.notification, { merchantTransactionId: checkout.merchantTransactionId, amountMinor: checkout.amountMinor, currency: "BDT" });
  const providerEventId = await recordVerifiedBillingProviderEvent(tx, context, {
    provider: input.notification.provider,
    providerEventId: input.notification.providerEventId,
    eventType: "payment.validated",
    payloadHashSha256: input.notification.payloadHashSha256,
    signatureVerified: true,
    receivedAt: now
  });
  const providerFeeMinor = money(input.providerFeeMinor);
  if (providerFeeMinor > checkout.amountMinor) throw new Error("Provider fee cannot exceed checkout amount.");
  const settlementStatus = input.notification.riskLevel === "safe" ? "settled" : "pending";
  const [settlement] = await tx.insert(billingSettlementRecords).values({
    organizationId: context.organizationId,
    checkoutSessionId: input.checkoutSessionId,
    providerEventId,
    providerTransactionId: input.notification.providerTransactionId,
    amountMinor: checkout.amountMinor,
    providerFeeMinor,
    netSettlementMinor: checkout.amountMinor - providerFeeMinor,
    status: settlementStatus,
    riskLevel: input.notification.riskLevel,
    providerValidationReference: input.notification.providerValidationReference,
    payloadHashSha256: input.notification.payloadHashSha256,
    occurredAt: now,
    recordedBy: context.actorId
  }).returning({ id: billingSettlementRecords.id });
  if (!settlement) throw new Error("Billing settlement was not recorded.");
  if (input.notification.riskLevel === "risky") {
    await tx.update(billingCheckoutSessions).set({ status: "risky", updatedAt: now }).where(eq(billingCheckoutSessions.id, input.checkoutSessionId));
    return { settlementId: settlement.id, subscriptionId: null };
  }
  await tx.insert(billingTransactions).values({
    organizationId: context.organizationId,
    invoiceId: checkout.invoiceId,
    provider: input.notification.provider,
    providerTransactionId: input.notification.providerTransactionId,
    transactionType: "payment",
    status: "succeeded",
    amountMinor: checkout.amountMinor,
    idempotencyKey: `checkout:${input.checkoutSessionId}:settled`,
    occurredAt: now
  });
  await tx.update(customerBillingInvoices).set({ status: "paid", paidAt: now, updatedAt: now }).where(and(
    eq(customerBillingInvoices.organizationId, context.organizationId), eq(customerBillingInvoices.id, checkout.invoiceId), eq(customerBillingInvoices.status, "issued")
  ));
  const periodEnd = subscriptionPeriodEnd(now, checkout.interval, checkout.cadenceMonths);
  const tier = tierForProduct(checkout.productKey);
  const [current] = await tx.select({ tier: organizationEntitlements.tier }).from(organizationEntitlements).where(and(
    eq(organizationEntitlements.organizationId, context.organizationId), sql`${organizationEntitlements.revokedAt} is null`
  )).orderBy(desc(organizationEntitlements.effectiveFrom)).limit(1);
  const fromTier = current?.tier ?? "explore";
  const entitlementId = await grantOrganizationEntitlement(tx, context, {
    tier,
    source: "paid",
    reason: `Validated ${input.notification.provider} checkout ${input.notification.providerTransactionId}`,
    effectiveFrom: now,
    effectiveTo: periodEnd
  });
  const [subscription] = await tx.insert(billingSubscriptions).values({
    organizationId: context.organizationId,
    billingAccountId: checkout.billingAccountId,
    planPriceId: checkout.planPriceId,
    entitlementId,
    status: "active",
    source: "provider",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    providerSubscriptionReference: input.notification.providerTransactionId,
    createdBy: context.actorId
  }).returning({ id: billingSubscriptions.id });
  if (!subscription) throw new Error("Provider subscription was not created.");
  if (fromTier !== tier) await tx.insert(billingEntitlementTransitions).values({
    organizationId: context.organizationId,
    subscriptionId: subscription.id,
    entitlementId,
    fromTier,
    toTier: tier,
    reason: "validated_provider_checkout",
    reconciliationReference: input.notification.providerValidationReference,
    changedBy: context.actorId,
    changedAt: now
  });
  await tx.update(billingCheckoutSessions).set({ status: "settled", settledAt: now, updatedAt: now }).where(eq(billingCheckoutSessions.id, input.checkoutSessionId));
  await recordAuditEvent(tx, context, { action: "billing.checkout_settled", entityType: "billing_checkout_session", entityId: input.checkoutSessionId, metadata: { provider: input.notification.provider, planPriceId: checkout.planPriceId, invoiceId: checkout.invoiceId, riskLevel: input.notification.riskLevel, entitlementTier: tier } });
  return { settlementId: settlement.id, subscriptionId: subscription.id };
}

export async function approveCustomerBillingRefund(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly invoiceId: string; readonly amountMinor: number; readonly reason: string },
  now = new Date()
): Promise<string> {
  requireOperations(context, "approve a billing refund");
  const [invoice] = await tx.select({ totalMinor: customerBillingInvoices.totalMinor, status: customerBillingInvoices.status }).from(customerBillingInvoices).where(and(
    eq(customerBillingInvoices.organizationId, context.organizationId), eq(customerBillingInvoices.id, input.invoiceId)
  )).limit(1);
  const amountMinor = money(input.amountMinor);
  if (!invoice || !["paid", "refunded"].includes(invoice.status) || amountMinor <= 0 || amountMinor > invoice.totalMinor) throw new Error("Refund requires a paid invoice and an amount within the invoice total.");
  const [refund] = await tx.insert(customerBillingRefunds).values({
    organizationId: context.organizationId,
    invoiceId: input.invoiceId,
    amountMinor,
    reason: requiredText(input.reason, "Refund reason"),
    status: "pending",
    approvedBy: context.actorId,
    approvedAt: now
  }).returning({ id: customerBillingRefunds.id });
  if (!refund) throw new Error("Refund approval was not recorded.");
  return refund.id;
}

export async function completeCustomerBillingRefund(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly refundId: string; readonly provider: string; readonly providerReference: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "complete a billing refund");
  const [refund] = await tx.update(customerBillingRefunds).set({
    status: "refunded",
    providerReference: requiredText(input.providerReference, "Refund provider reference"),
    completedAt: now
  }).where(and(
    eq(customerBillingRefunds.organizationId, context.organizationId), eq(customerBillingRefunds.id, input.refundId), eq(customerBillingRefunds.status, "pending")
  )).returning({ invoiceId: customerBillingRefunds.invoiceId, amountMinor: customerBillingRefunds.amountMinor });
  if (!refund) throw new Error("Pending refund was not found.");
  await tx.insert(billingTransactions).values({
    organizationId: context.organizationId,
    invoiceId: refund.invoiceId,
    provider: requiredText(input.provider, "Refund provider"),
    providerTransactionId: input.providerReference,
    transactionType: "refund",
    status: "refunded",
    amountMinor: refund.amountMinor,
    idempotencyKey: `refund:${input.refundId}:completed`,
    occurredAt: now
  });
}

export async function recordEntitlementDrift(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId?: string | null; readonly severity: "low" | "medium" | "high" | "critical"; readonly expectedTier: EntitlementTier; readonly actualTier: EntitlementTier; readonly evidenceReference: string },
  now = new Date()
): Promise<string> {
  requireOperations(context, "record entitlement drift");
  const [incident] = await tx.insert(billingEntitlementDriftIncidents).values({
    organizationId: context.organizationId,
    subscriptionId: input.subscriptionId ?? null,
    severity: input.severity,
    expectedTier: input.expectedTier,
    actualTier: input.actualTier,
    detectedAt: now,
    evidenceReference: requiredText(input.evidenceReference, "Entitlement drift evidence")
  }).returning({ id: billingEntitlementDriftIncidents.id });
  if (!incident) throw new Error("Entitlement drift was not recorded.");
  return incident.id;
}

export async function openDunningCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly invoiceId: string; readonly nextAttemptAt: Date }
): Promise<string> {
  requireOperations(context, "open a dunning case");
  const [row] = await tx.insert(billingDunningCases).values({ organizationId: context.organizationId, subscriptionId: input.subscriptionId, invoiceId: input.invoiceId, nextAttemptAt: input.nextAttemptAt })
    .returning({ id: billingDunningCases.id });
  if (!row) throw new Error("Dunning case was not created.");
  return row.id;
}

export async function recordPlanChangeTreatment(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly subscriptionId: string; readonly fromPlanPriceId: string; readonly toPlanPriceId: string; readonly treatment: "grandfathered" | "notified"; readonly noticeReference?: string | null; readonly effectiveAt: Date }
): Promise<string> {
  requireOperations(context, "record a plan change treatment");
  if (input.treatment === "notified" && !input.noticeReference?.trim()) throw new Error("A notified plan change requires a notice reference.");
  const [row] = await tx.insert(billingPlanChangeNotices).values({ organizationId: context.organizationId, ...input, noticeReference: input.noticeReference?.trim() || null })
    .returning({ id: billingPlanChangeNotices.id });
  if (!row) throw new Error("Plan change treatment was not recorded.");
  return row.id;
}

function requireOperations(context: TenantContext, action: string): void {
  if (context.actorType === "customer") throw new Error(`Only reviewed operations may ${action}.`);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function sha256(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error("Checkout return state requires a SHA-256 hash.");
  return normalized;
}

function money(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Billing money must be a non-negative integer in minor units.");
  return value;
}

function tierForProduct(productKey: string): EntitlementTier {
  if (productKey === "explore") return "explore";
  if (productKey === "first_shipment_pass" || productKey === "launch") return "launch";
  if (productKey === "scale") return "scale";
  if (productKey === "managed_ops") return "managed";
  throw new Error("Unsupported billing catalog product.");
}

function subscriptionPeriodEnd(start: Date, interval: string, cadenceMonths: number | null): Date {
  if (interval === "one_time") return new Date(start.getTime() + 90 * 24 * 60 * 60_000);
  const months = cadenceMonths ?? (interval === "annual" ? 12 : interval === "quarterly" ? 3 : 1);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}
