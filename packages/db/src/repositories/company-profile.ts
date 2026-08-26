import { eq } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { companyProfiles } from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

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
  readonly originCountryCode: string;
  readonly industry: string;
  readonly website: string | null;
  readonly onboardingComplete: boolean;
  readonly onboardingVersion: number;
  readonly onboardingPercent: number;
  readonly supportEmail: string | null;
  readonly defaultCurrency: string;
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
      originCountryCode: companyProfiles.originCountryCode,
      industry: companyProfiles.industry,
      website: companyProfiles.website,
      onboardingComplete: companyProfiles.onboardingComplete,
      onboardingVersion: companyProfiles.onboardingVersion,
      onboardingPercent: companyProfiles.onboardingPercent,
      supportEmail: companyProfiles.supportEmail,
      defaultCurrency: companyProfiles.defaultCurrency,
      exportStage: companyProfiles.exportStage,
      primarySalesChannel: companyProfiles.primarySalesChannel,
      marketStrategy: companyProfiles.marketStrategy,
      verificationStatus: companyProfiles.verificationStatus
    })
    .from(companyProfiles)
    .where(eq(companyProfiles.organizationId, context.organizationId))
    .limit(1);
  return row ?? null;
}

export interface CompanyProfileInput {
  readonly originCountryCode: string;
  readonly industry: string;
  readonly website?: string | null;
  readonly supportEmail?: string | null;
  readonly defaultCurrency?: string;
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
  const values = {
    organizationId: context.organizationId,
    originCountryCode: input.originCountryCode,
    industry: input.industry,
    website: input.website ?? null,
    supportEmail: input.supportEmail ?? null,
    defaultCurrency: input.defaultCurrency ?? "USD",
    exportStage: input.exportStage ?? null,
    primarySalesChannel: input.primarySalesChannel ?? null,
    marketStrategy: input.marketStrategy ?? {},
    updatedAt: now
  };

  await tx
    .insert(companyProfiles)
    .values(values)
    .onConflictDoUpdate({ target: companyProfiles.organizationId, set: values });

  await recordAuditEvent(tx, context, {
    action: "company_profile.updated",
    entityType: "company_profile",
    entityId: context.organizationId,
    metadata: { fields: Object.keys(input).sort() }
  });
}

/**
 * Marks the workspace activated. The version is recorded so a later onboarding
 * revision can tell who completed which flow without guessing from timestamps.
 */
export async function completeOnboarding(
  tx: ExportHqTransaction,
  context: TenantContext,
  onboardingVersion: number
): Promise<void> {
  const now = new Date();
  await tx
    .update(companyProfiles)
    .set({
      onboardingComplete: true,
      onboardingVersion,
      activatedBy: context.actorId,
      activatedAt: now,
      updatedAt: now
    })
    .where(eq(companyProfiles.organizationId, context.organizationId));

  await recordAuditEvent(tx, context, {
    action: "onboarding.completed",
    entityType: "company_profile",
    entityId: context.organizationId,
    metadata: { onboardingVersion }
  });
}
