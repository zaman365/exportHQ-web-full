import { eq, lt } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import { companyProfiles } from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";
import { recordPilotMilestoneEvent } from "./pilot";

/**
 * Company profile and onboarding state.
 *
 * This replaces Clerk organization metadata as the store for onboarding,
 * profile and market-strategy state. Metadata has no transaction, no audit
 * trail, no row-level security and no restore path; a profile save and its
 * audit event now commit or roll back together.
 */

export interface CompanyProfileRecord {
  readonly organizationId: string;
  readonly legalName: string | null;
  readonly tradingName: string | null;
  readonly originCountryCode: string;
  readonly industry: string;
  readonly website: string | null;
  readonly onboardingComplete: boolean;
  readonly onboardingVersion: number;
  readonly onboardingPercent: number;
  readonly supportEmail: string | null;
  readonly defaultCurrency: string;
  readonly defaultTimezone: string;
  readonly defaultLocale: "en" | "bn";
  readonly lowDataMode: boolean;
  readonly exportStage: string | null;
  readonly primarySalesChannel: string | null;
  readonly marketStrategy: Record<string, unknown>;
  readonly verificationStatus: "unverified" | "pending" | "verified" | "rejected";
}

export async function readCompanyProfile(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<CompanyProfileRecord | null> {
  const [row] = await tx
    .select({
      organizationId: companyProfiles.organizationId,
      legalName: companyProfiles.legalName,
      tradingName: companyProfiles.tradingName,
      originCountryCode: companyProfiles.originCountryCode,
      industry: companyProfiles.industry,
      website: companyProfiles.website,
      onboardingComplete: companyProfiles.onboardingComplete,
      onboardingVersion: companyProfiles.onboardingVersion,
      onboardingPercent: companyProfiles.onboardingPercent,
      supportEmail: companyProfiles.supportEmail,
      defaultCurrency: companyProfiles.defaultCurrency,
      defaultTimezone: companyProfiles.defaultTimezone,
      defaultLocale: companyProfiles.defaultLocale,
      lowDataMode: companyProfiles.lowDataMode,
      exportStage: companyProfiles.exportStage,
      primarySalesChannel: companyProfiles.primarySalesChannel,
      marketStrategy: companyProfiles.marketStrategy,
      verificationStatus: companyProfiles.verificationStatus
    })
    .from(companyProfiles)
    .where(eq(companyProfiles.organizationId, context.organizationId))
    .limit(1);
  if (!row) return null;
  return { ...row, defaultLocale: row.defaultLocale === "en" ? "en" : "bn" };
}

export interface CompanyProfileInput {
  readonly legalName?: string | null;
  readonly tradingName?: string | null;
  readonly originCountryCode: string;
  readonly industry: string;
  readonly website?: string | null;
  readonly supportEmail?: string | null;
  readonly defaultCurrency?: string;
  readonly defaultTimezone?: string;
  readonly defaultLocale?: "en" | "bn";
  readonly lowDataMode?: boolean;
  readonly exportStage?: string | null;
  readonly primarySalesChannel?: string | null;
  readonly marketStrategy?: Record<string, unknown>;
}

/**
 * Upserts the profile and records what changed. The audit metadata names the
 * fields that moved, never their values: a company's registration number and
 * market plans are `customer-business` data and do not belong in a table that
 * operations reads broadly.
 */
export async function saveCompanyProfile(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: CompanyProfileInput
): Promise<void> {
  const now = new Date();
  const [previous] = await tx.select({ id: companyProfiles.id }).from(companyProfiles)
    .where(eq(companyProfiles.organizationId, context.organizationId)).limit(1);
  const values = {
    organizationId: context.organizationId,
    legalName: normalizedOptionalText(input.legalName),
    tradingName: normalizedOptionalText(input.tradingName),
    originCountryCode: input.originCountryCode,
    industry: input.industry,
    website: input.website ?? null,
    supportEmail: input.supportEmail ?? null,
    defaultCurrency: input.defaultCurrency ?? "USD",
    defaultTimezone: input.defaultTimezone ?? "Asia/Dhaka",
    defaultLocale: input.defaultLocale ?? (input.originCountryCode === "BD" ? "bn" : "en"),
    lowDataMode: input.lowDataMode ?? false,
    exportStage: input.exportStage ?? null,
    primarySalesChannel: input.primarySalesChannel ?? null,
    marketStrategy: input.marketStrategy ?? {},
    updatedAt: now
  };
  const updateValues: Partial<typeof values> = { ...values };
  if (input.defaultLocale === undefined) delete updateValues.defaultLocale;
  if (input.lowDataMode === undefined) delete updateValues.lowDataMode;

  await tx
    .insert(companyProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: companyProfiles.organizationId,
      set: updateValues
    });

  await recordAuditEvent(tx, context, {
    action: "company_profile.updated",
    entityType: "company_profile",
    entityId: context.organizationId,
    metadata: { fields: Object.keys(input).sort() }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "company_profile.updated",
    aggregateType: "company_profile",
    aggregateId: context.organizationId,
    dedupeKey: `company-profile:${context.organizationId}:${now.toISOString()}`,
    payload: { fields: Object.keys(input).sort() }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "passport_started",
    quantity: Object.keys(input).length,
    success: true,
    outcomeCode: previous ? "updated" : "created",
    dedupeKey: `passport-started:${context.organizationId}`,
    occurredAt: now
  });
}

export async function updateCompanyPreferences(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly defaultLocale?: "en" | "bn"; readonly lowDataMode?: boolean }
): Promise<void> {
  if (input.defaultLocale === undefined && input.lowDataMode === undefined) {
    throw new Error("At least one company preference is required.");
  }
  const now = new Date();
  const [updated] = await tx.update(companyProfiles).set({
    ...(input.defaultLocale === undefined ? {} : { defaultLocale: input.defaultLocale }),
    ...(input.lowDataMode === undefined ? {} : { lowDataMode: input.lowDataMode }),
    updatedAt: now
  }).where(eq(companyProfiles.organizationId, context.organizationId)).returning({ id: companyProfiles.organizationId });
  if (!updated) throw new Error("Complete the company profile before changing workspace preferences.");
  await recordAuditEvent(tx, context, {
    action: "company_profile.updated",
    entityType: "company_profile",
    entityId: context.organizationId,
    metadata: { fields: Object.keys(input).filter((key) => input[key as keyof typeof input] !== undefined).sort() }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "company_profile.preferences_updated",
    aggregateType: "company_profile",
    aggregateId: context.organizationId,
    dedupeKey: `company-profile-preferences:${context.organizationId}:${now.toISOString()}`,
    payload: { fields: Object.keys(input).filter((key) => input[key as keyof typeof input] !== undefined).sort() }
  });
}

function normalizedOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

/**
 * Marks the workspace activated. The version is recorded so a later onboarding
 * revision can tell who completed which flow without guessing from timestamps.
 */
export async function completeOnboarding(
  tx: ExportHqTransaction,
  context: TenantContext,
  onboardingVersion: number
): Promise<{ readonly changed: boolean; readonly mirrorEventId: string | null }> {
  const now = new Date();
  const [changed] = await tx
    .insert(companyProfiles)
    .values({
      organizationId: context.organizationId,
      originCountryCode: "BD",
      industry: "Not specified",
      onboardingComplete: true,
      onboardingVersion,
      onboardingPercent: 10,
      defaultCurrency: "BDT",
      activatedBy: context.actorId,
      activatedAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: companyProfiles.organizationId,
      set: {
        onboardingComplete: true,
        onboardingVersion,
        activatedBy: context.actorId,
        activatedAt: now,
        updatedAt: now
      },
      setWhere: lt(companyProfiles.onboardingVersion, onboardingVersion)
    })
    .returning({ id: companyProfiles.id });

  if (!changed) return { changed: false, mirrorEventId: null };

  await recordAuditEvent(tx, context, {
    action: "onboarding.completed",
    entityType: "company_profile",
    entityId: context.organizationId,
    metadata: { onboardingVersion }
  });

  const mirrorEventId = await enqueueOutboxEvent(tx, context, {
    topic: "identity.organization_metadata_sync_requested",
    aggregateType: "company_profile",
    aggregateId: context.organizationId,
    dedupeKey: `onboarding-mirror:${context.organizationId}:${onboardingVersion}`,
    payload: { onboardingVersion }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "passport_completed",
    success: true,
    measureFromParticipationStart: true,
    dedupeKey: `passport-completed:${context.organizationId}:v${onboardingVersion}`,
    occurredAt: now
  });
  return { changed: true, mirrorEventId };
}
