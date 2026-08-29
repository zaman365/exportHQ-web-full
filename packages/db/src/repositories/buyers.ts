import { and, desc, eq, sql } from "drizzle-orm";
import {
  assertOpportunityTransition,
  assertRfqTransition,
  presentBuyerVerification,
  type BuyerRiskStatus,
  type BuyerVerificationStatus,
  type OpportunityStatus,
  type RfqStatus
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import {
  buyerAccounts,
  buyerContacts,
  buyerOutreachConsents,
  buyerProvenanceRecords,
  buyerRfqLines,
  buyerRfqRequirements,
  buyerRfqs,
  exportLanes,
  salesOpportunities
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface BuyerPipelineRecord {
  readonly id: string;
  readonly legalName: string;
  readonly tradingName: string | null;
  readonly countryCode: string;
  readonly verificationStatus: BuyerVerificationStatus;
  readonly verificationLabel: string;
  readonly mayUseVerifiedLanguage: boolean;
  readonly verificationEvidenceLevel: string | null;
  readonly verifiedAt: Date | null;
  readonly riskStatus: BuyerRiskStatus;
  readonly optedOutAt: Date | null;
  readonly openOpportunityCount: number;
}

export async function createBuyerAccount(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly legalName: string;
    readonly tradingName?: string | null;
    readonly countryCode: string;
    readonly websiteUrl?: string | null;
    readonly sourceType: "customer_supplied" | "buyer_supplied" | "official_registry" | "licensed_provider" | "public_business_site";
    readonly sourceReference: string;
    readonly rightsBasis: string;
  },
  now = new Date()
): Promise<string> {
  const legalName = requiredText(input.legalName, "Buyer legal name");
  const countryCode = country(input.countryCode);
  const rightsBasis = rights(input.rightsBasis);
  const [buyer] = await tx.insert(buyerAccounts).values({
    organizationId: context.organizationId,
    legalName,
    tradingName: optionalText(input.tradingName),
    countryCode,
    websiteUrl: optionalText(input.websiteUrl),
    createdBy: context.actorId
  }).returning({ id: buyerAccounts.id });
  if (!buyer) throw new Error("Buyer account did not return an identifier.");
  await tx.insert(buyerProvenanceRecords).values({
    organizationId: context.organizationId,
    buyerAccountId: buyer.id,
    buyerContactId: null,
    fieldKey: "legal_name",
    sourceType: input.sourceType,
    sourceReference: requiredText(input.sourceReference, "Buyer source reference"),
    rightsBasis,
    valueHashSha256: await digestSha256(legalName),
    capturedBy: context.actorId,
    capturedAt: now
  });
  await recordAuditEvent(tx, context, {
    action: "buyer.created",
    entityType: "buyer_account",
    entityId: buyer.id,
    metadata: { countryCode, sourceType: input.sourceType, rightsDocumented: true }
  });
  return buyer.id;
}

export async function addBuyerContact(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly buyerAccountId: string;
    readonly fullName: string;
    readonly roleTitle?: string | null;
    readonly emailAddress?: string | null;
    readonly phoneNumber?: string | null;
    readonly preferredChannel?: "email" | "phone" | "whatsapp" | "other" | null;
    readonly sourceType: "customer_supplied" | "buyer_supplied" | "official_registry" | "licensed_provider" | "public_business_site";
    readonly sourceReference: string;
    readonly rightsBasis: string;
  },
  now = new Date()
): Promise<string> {
  const emailAddress = optionalText(input.emailAddress)?.toLowerCase() ?? null;
  const phoneNumber = optionalText(input.phoneNumber);
  if (!emailAddress && !phoneNumber) throw new Error("Buyer contact requires an email address or phone number.");
  const [contact] = await tx.insert(buyerContacts).values({
    organizationId: context.organizationId,
    buyerAccountId: input.buyerAccountId,
    fullName: requiredText(input.fullName, "Buyer contact name"),
    roleTitle: optionalText(input.roleTitle),
    emailAddress,
    phoneNumber,
    preferredChannel: input.preferredChannel ?? null,
    createdBy: context.actorId
  }).returning({ id: buyerContacts.id });
  if (!contact) throw new Error("Buyer contact did not return an identifier.");
  await tx.insert(buyerProvenanceRecords).values({
    organizationId: context.organizationId,
    buyerAccountId: input.buyerAccountId,
    buyerContactId: contact.id,
    fieldKey: "contact_identity",
    sourceType: input.sourceType,
    sourceReference: requiredText(input.sourceReference, "Buyer contact source reference"),
    rightsBasis: rights(input.rightsBasis),
    valueHashSha256: await digestSha256([input.fullName, emailAddress ?? "", phoneNumber ?? ""].join("|")),
    capturedBy: context.actorId,
    capturedAt: now
  });
  return contact.id;
}

export async function updateBuyerVerification(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly buyerAccountId: string;
    readonly status: BuyerVerificationStatus;
    readonly evidenceLevel?: string | null;
    readonly sourceReference?: string | null;
    readonly riskStatus: BuyerRiskStatus;
    readonly riskRationale?: string | null;
  },
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer" && input.status === "human_reviewed") {
    throw new Error("Human-reviewed buyer status requires a reviewed operations actor.");
  }
  const evidenceLevel = optionalText(input.evidenceLevel);
  const sourceReference = optionalText(input.sourceReference);
  presentBuyerVerification({ status: input.status, evidenceLevel, verifiedAt: now });
  if (!["unverified", "rejected"].includes(input.status) && (!evidenceLevel || !sourceReference)) {
    throw new Error("Buyer verification requires an evidence level and source reference.");
  }
  if (input.riskStatus !== "not_assessed" && !optionalText(input.riskRationale)) {
    throw new Error("Assessed buyer risk requires a rationale.");
  }
  const [updated] = await tx.update(buyerAccounts).set({
    verificationStatus: input.status,
    verificationEvidenceLevel: ["unverified", "rejected"].includes(input.status) ? null : evidenceLevel,
    verificationSourceRef: ["unverified", "rejected"].includes(input.status) ? null : sourceReference,
    verifiedAt: ["unverified", "rejected"].includes(input.status) ? null : now,
    verifiedBy: ["unverified", "rejected"].includes(input.status) ? null : context.actorId,
    riskStatus: input.riskStatus,
    riskRationale: optionalText(input.riskRationale),
    version: sql`${buyerAccounts.version} + 1`,
    updatedAt: now
  }).where(and(
    eq(buyerAccounts.organizationId, context.organizationId),
    eq(buyerAccounts.id, input.buyerAccountId)
  )).returning({ id: buyerAccounts.id });
  if (!updated) throw new Error("Buyer account was not found in this organization.");
}

export async function correctBuyerAccount(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly buyerAccountId: string;
    readonly field: "legal_name" | "trading_name" | "website_url";
    readonly value: string;
    readonly reason: string;
    readonly supersedesProvenanceId: string;
    readonly sourceReference: string;
    readonly rightsBasis: string;
  },
  now = new Date()
): Promise<void> {
  const value = requiredText(input.value, "Corrected buyer value");
  const changes = input.field === "legal_name" ? { legalName: value }
    : input.field === "trading_name" ? { tradingName: value }
      : { websiteUrl: value };
  const [updated] = await tx.update(buyerAccounts).set({
    ...changes,
    correctionRequestedAt: now,
    version: sql`${buyerAccounts.version} + 1`,
    updatedAt: now
  }).where(and(eq(buyerAccounts.organizationId, context.organizationId), eq(buyerAccounts.id, input.buyerAccountId)))
    .returning({ id: buyerAccounts.id });
  if (!updated) throw new Error("Buyer account was not found in this organization.");
  await tx.insert(buyerProvenanceRecords).values({
    organizationId: context.organizationId,
    buyerAccountId: input.buyerAccountId,
    fieldKey: input.field,
    sourceType: "correction",
    sourceReference: requiredText(input.sourceReference, "Correction source reference"),
    rightsBasis: rights(input.rightsBasis),
    valueHashSha256: await digestSha256(value),
    capturedBy: context.actorId,
    capturedAt: now,
    correctionReason: requiredText(input.reason, "Correction reason"),
    supersedesId: input.supersedesProvenanceId
  });
  await recordAuditEvent(tx, context, {
    action: "buyer.corrected",
    entityType: "buyer_account",
    entityId: input.buyerAccountId,
    metadata: { field: input.field, correctionRecorded: true }
  });
}

export async function recordBuyerOutreachConsent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly buyerAccountId: string;
    readonly buyerContactId?: string | null;
    readonly channel: "email" | "phone" | "whatsapp" | "other";
    readonly state: "unknown" | "permitted" | "objected" | "opted_out";
    readonly lawfulBasis?: string | null;
    readonly evidenceReference?: string | null;
  },
  now = new Date()
): Promise<string> {
  const lawfulBasis = optionalText(input.lawfulBasis);
  const evidenceReference = optionalText(input.evidenceReference);
  if (input.state === "permitted" && (!lawfulBasis || !evidenceReference)) {
    throw new Error("Permitted outreach requires a lawful basis and evidence reference.");
  }
  const [row] = await tx.insert(buyerOutreachConsents).values({
    organizationId: context.organizationId,
    buyerAccountId: input.buyerAccountId,
    buyerContactId: input.buyerContactId ?? null,
    channel: input.channel,
    state: input.state,
    lawfulBasis,
    evidenceReference,
    effectiveAt: now,
    recordedBy: context.actorId
  }).returning({ id: buyerOutreachConsents.id });
  if (!row) throw new Error("Buyer outreach state did not return an identifier.");
  if (input.state === "opted_out") {
    await tx.update(buyerAccounts).set({ optedOutAt: now, updatedAt: now }).where(and(
      eq(buyerAccounts.organizationId, context.organizationId),
      eq(buyerAccounts.id, input.buyerAccountId)
    ));
  }
  await recordAuditEvent(tx, context, {
    action: "buyer.consent_recorded",
    entityType: "buyer_outreach_consent",
    entityId: row.id,
    metadata: { channel: input.channel, state: input.state }
  });
  return row.id;
}

export async function createSalesOpportunity(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly buyerAccountId: string;
    readonly exportLaneId: string;
    readonly title: string;
    readonly ownerMembershipId: string;
    readonly expectedValueMinor?: number | null;
    readonly currency?: string | null;
    readonly expectedCloseAt?: Date | null;
  }
): Promise<string> {
  const [row] = await tx.insert(salesOpportunities).values({
    organizationId: context.organizationId,
    buyerAccountId: input.buyerAccountId,
    exportLaneId: input.exportLaneId,
    title: requiredText(input.title, "Opportunity title"),
    ownerMembershipId: input.ownerMembershipId,
    expectedValueMinor: optionalMoney(input.expectedValueMinor),
    currency: input.expectedValueMinor == null ? null : currency(input.currency),
    expectedCloseAt: input.expectedCloseAt ?? null,
    createdBy: context.actorId
  }).returning({ id: salesOpportunities.id });
  if (!row) throw new Error("Sales opportunity did not return an identifier.");
  await recordAuditEvent(tx, context, { action: "opportunity.created", entityType: "sales_opportunity", entityId: row.id, metadata: { exportLaneId: input.exportLaneId } });
  return row.id;
}

export async function transitionSalesOpportunity(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly opportunityId: string; readonly toStatus: OpportunityStatus; readonly expectedVersion: number; readonly lossReason?: string | null },
  now = new Date()
): Promise<void> {
  const [current] = await tx.select({ status: salesOpportunities.status }).from(salesOpportunities).where(and(
    eq(salesOpportunities.organizationId, context.organizationId),
    eq(salesOpportunities.id, input.opportunityId),
    eq(salesOpportunities.version, input.expectedVersion)
  )).limit(1);
  if (!current) throw new Error("Opportunity was not found or changed concurrently.");
  assertOpportunityTransition(current.status, input.toStatus);
  if (input.toStatus === "lost" && !optionalText(input.lossReason)) throw new Error("A lost opportunity requires a reason.");
  const [updated] = await tx.update(salesOpportunities).set({
    status: input.toStatus,
    lossReason: input.toStatus === "lost" ? requiredText(input.lossReason ?? "", "Loss reason") : null,
    version: input.expectedVersion + 1,
    updatedAt: now
  }).where(and(
    eq(salesOpportunities.organizationId, context.organizationId),
    eq(salesOpportunities.id, input.opportunityId),
    eq(salesOpportunities.version, input.expectedVersion)
  )).returning({ id: salesOpportunities.id });
  if (!updated) throw new Error("Opportunity changed concurrently.");
  await recordAuditEvent(tx, context, { action: "opportunity.transitioned", entityType: "sales_opportunity", entityId: input.opportunityId, metadata: { fromStatus: current.status, toStatus: input.toStatus } });
}

export async function createBuyerRfq(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly opportunityId: string;
    readonly exportLaneId: string;
    readonly buyerReference?: string | null;
    readonly requestedCurrency: string;
    readonly requestedIncoterm?: "FOB" | "CIF" | "DDP" | null;
    readonly deliveryCountryCode: string;
    readonly receivedAt: Date;
    readonly responseDueAt?: Date | null;
    readonly notes?: string | null;
    readonly lines: readonly { readonly productId: string; readonly buyerSku?: string | null; readonly description: string; readonly quantity: number; readonly unit: string; readonly targetUnitPriceMinor?: number | null; readonly targetCurrency?: string | null; readonly requiredAt?: Date | null }[];
    readonly requirements?: readonly { readonly lineIndex?: number | null; readonly requirementType: string; readonly description: string; readonly mandatory?: boolean }[];
  }
): Promise<string> {
  if (!input.lines.length) throw new Error("RFQ requires at least one product line.");
  const [opportunity] = await tx.select({ exportLaneId: salesOpportunities.exportLaneId, status: salesOpportunities.status }).from(salesOpportunities).where(and(
    eq(salesOpportunities.organizationId, context.organizationId),
    eq(salesOpportunities.id, input.opportunityId)
  )).limit(1);
  if (!opportunity || opportunity.exportLaneId !== input.exportLaneId) throw new Error("RFQ opportunity and Export Lane must match.");
  if (!["qualified", "rfq_received"].includes(opportunity.status)) throw new Error("RFQ requires a qualified opportunity.");
  const [rfq] = await tx.insert(buyerRfqs).values({
    organizationId: context.organizationId,
    opportunityId: input.opportunityId,
    exportLaneId: input.exportLaneId,
    buyerReference: optionalText(input.buyerReference),
    status: "received",
    receivedAt: input.receivedAt,
    responseDueAt: input.responseDueAt ?? null,
    requestedCurrency: currency(input.requestedCurrency),
    requestedIncoterm: input.requestedIncoterm ?? null,
    deliveryCountryCode: country(input.deliveryCountryCode),
    notes: optionalText(input.notes),
    createdBy: context.actorId
  }).returning({ id: buyerRfqs.id });
  if (!rfq) throw new Error("RFQ did not return an identifier.");
  const lines = await tx.insert(buyerRfqLines).values(input.lines.map((line) => ({
    organizationId: context.organizationId,
    rfqId: rfq.id,
    productId: line.productId,
    buyerSku: optionalText(line.buyerSku),
    description: requiredText(line.description, "RFQ line description"),
    quantity: positiveInteger(line.quantity, "RFQ quantity"),
    unit: requiredText(line.unit, "RFQ unit"),
    targetUnitPriceMinor: optionalMoney(line.targetUnitPriceMinor),
    targetCurrency: line.targetUnitPriceMinor == null ? null : currency(line.targetCurrency),
    requiredAt: line.requiredAt ?? null
  }))).returning({ id: buyerRfqLines.id });
  if (lines.length !== input.lines.length) throw new Error("RFQ lines were not fully created.");
  if (input.requirements?.length) {
    await tx.insert(buyerRfqRequirements).values(input.requirements.map((requirement) => ({
      organizationId: context.organizationId,
      rfqId: rfq.id,
      rfqLineId: requirement.lineIndex == null ? null : lines[requirement.lineIndex]?.id ?? null,
      requirementType: requiredText(requirement.requirementType, "RFQ requirement type"),
      description: requiredText(requirement.description, "RFQ requirement description"),
      mandatory: requirement.mandatory ?? true
    })));
  }
  if (opportunity.status === "qualified") {
    await tx.update(salesOpportunities).set({ status: "rfq_received", version: sql`${salesOpportunities.version} + 1`, updatedAt: input.receivedAt })
      .where(and(eq(salesOpportunities.organizationId, context.organizationId), eq(salesOpportunities.id, input.opportunityId)));
  }
  await tx.update(exportLanes).set({ stage: "buyer", version: sql`${exportLanes.version} + 1`, updatedAt: input.receivedAt })
    .where(and(eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, input.exportLaneId)));
  await recordAuditEvent(tx, context, { action: "rfq.created", entityType: "buyer_rfq", entityId: rfq.id, metadata: { opportunityId: input.opportunityId, exportLaneId: input.exportLaneId, lineCount: lines.length } });
  return rfq.id;
}

export async function transitionBuyerRfq(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly rfqId: string; readonly toStatus: RfqStatus; readonly expectedVersion: number },
  now = new Date()
): Promise<void> {
  const [current] = await tx.select({ status: buyerRfqs.status }).from(buyerRfqs).where(and(
    eq(buyerRfqs.organizationId, context.organizationId),
    eq(buyerRfqs.id, input.rfqId),
    eq(buyerRfqs.version, input.expectedVersion)
  )).limit(1);
  if (!current) throw new Error("RFQ was not found or changed concurrently.");
  assertRfqTransition(current.status, input.toStatus);
  const [updated] = await tx.update(buyerRfqs).set({ status: input.toStatus, version: input.expectedVersion + 1, updatedAt: now }).where(and(
    eq(buyerRfqs.organizationId, context.organizationId),
    eq(buyerRfqs.id, input.rfqId),
    eq(buyerRfqs.version, input.expectedVersion)
  )).returning({ id: buyerRfqs.id });
  if (!updated) throw new Error("RFQ changed concurrently.");
  await recordAuditEvent(tx, context, { action: "rfq.transitioned", entityType: "buyer_rfq", entityId: input.rfqId, metadata: { fromStatus: current.status, toStatus: input.toStatus } });
}

export async function listBuyerPipeline(
  tx: ExportHqTransaction,
  context: TenantContext,
  options: { readonly limit?: number } = {}
): Promise<BuyerPipelineRecord[]> {
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));
  const buyers = await tx.select().from(buyerAccounts).where(eq(buyerAccounts.organizationId, context.organizationId))
    .orderBy(desc(buyerAccounts.updatedAt), desc(buyerAccounts.id)).limit(limit);
  const opportunities = await tx.select({ buyerAccountId: salesOpportunities.buyerAccountId, status: salesOpportunities.status })
    .from(salesOpportunities).where(eq(salesOpportunities.organizationId, context.organizationId));
  return buyers.map((buyer) => {
    const presentation = presentBuyerVerification({ status: buyer.verificationStatus, evidenceLevel: buyer.verificationEvidenceLevel, verifiedAt: buyer.verifiedAt });
    return {
      id: buyer.id,
      legalName: buyer.legalName,
      tradingName: buyer.tradingName,
      countryCode: buyer.countryCode,
      verificationStatus: buyer.verificationStatus,
      verificationLabel: presentation.label,
      mayUseVerifiedLanguage: presentation.mayUseVerifiedLanguage,
      verificationEvidenceLevel: presentation.evidenceLevel,
      verifiedAt: presentation.verifiedAt,
      riskStatus: buyer.riskStatus,
      optedOutAt: buyer.optedOutAt,
      openOpportunityCount: opportunities.filter((item) => item.buyerAccountId === buyer.id && !["lost", "archived"].includes(item.status)).length
    };
  });
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function rights(value: string): string {
  const normalized = requiredText(value, "Buyer data rights basis");
  if (normalized.toLowerCase() === "unknown") throw new Error("Buyer data rights basis cannot be unknown.");
  return normalized;
}

function country(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Country requires an ISO alpha-2 code.");
  return normalized;
}

function currency(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency requires an ISO alpha-3 code.");
  return normalized;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer.`);
  return value;
}

function optionalMoney(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Money requires a non-negative integer in minor units.");
  return value;
}

async function digestSha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
