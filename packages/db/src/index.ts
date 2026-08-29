import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

export type ExportHqDatabase = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false, max: 8 });
  return drizzle(client, { schema });
}

export async function checkDatabaseHealth(database: ExportHqDatabase): Promise<void> {
  await database.execute(sql`select 1 as healthy`);
}

export { schema };
export { upsertMarketIntelligenceCatalog, type MarketOpportunitySeed } from "./market-intelligence";

export {
  assertOrganizationId,
  readTenantContext,
  TenantContextError,
  withPlatformTransaction,
  withTenantTransaction,
  type ActorType,
  type ExportHqTransaction,
  type TenantContext
} from "./tenant";

export {
  assertSafeAuditMetadata,
  auditableActions,
  recordAuditEvent,
  recordPlatformAuditEvent,
  type AuditEventInput,
  type AuditableAction
} from "./audit";

export {
  grantOrganizationEntitlement,
  isEntitlementActive,
  readOrganizationEntitlements,
  readOrganizationTier,
  resolveEntitlementTier,
  revokeOrganizationEntitlement,
  type EntitlementRecord,
  type EntitlementSource,
  type EntitlementTier,
  type GrantEntitlementInput
} from "./entitlements";

export {
  countDeadLetteredDeliveries,
  PostgresIdempotencyStore,
  PostgresRateLimitStore,
  purgeRetainedWebhookDeliveries,
  recordWebhookDelivery,
  type WebhookDeliveryOutcome
} from "./stores";

export {
  enqueueOutboxEvent,
  markOutboxPublished,
  purgePublishedOutbox
} from "./outbox";

export {
  deactivateOrganization,
  projectMembership,
  provisionOrganization,
  resolveOrganizationId,
  type MembershipIdentity,
  type OrganizationIdentity
} from "./repositories/organizations";

export {
  processClerkWebhookDelivery,
  requestClerkWebhookReplay,
  WebhookPayloadConflictError,
  type ClerkWebhookProcessResult
} from "./webhooks/clerk";

export {
  completeOnboarding,
  readCompanyProfile,
  saveCompanyProfile,
  type CompanyProfileInput,
  type CompanyProfileRecord
} from "./repositories/company-profile";

export { readStaffAccess } from "./repositories/staff-access";

export {
  addExportLaneParticipant,
  createExportLane,
  ExportLaneNotFoundError,
  listExportLanes,
  readExportLane,
  recordExportLaneDecision,
  transitionStoredExportLane,
  type CreateExportLaneInput,
  type ExportLanePage,
  type ExportLaneRecord
} from "./repositories/export-lanes";

export {
  applyEvidenceLegalHold,
  authorizeEvidenceDownload,
  consumeEvidenceUploadIntent,
  createEvidenceExternalShare,
  createEvidenceUploadIntent,
  deleteEvidenceVersion,
  linkCleanEvidence,
  recordEvidenceReviewDecision,
  recordEvidenceScanResult,
  releaseEvidenceLegalHold,
  requestCustomerDataExport,
  revokeEvidenceExternalShare,
  type EvidenceUploadIntentRecord
} from "./repositories/evidence-vault";

export {
  addBusinessVerificationEvidence,
  createBusinessVerificationCase,
  readBusinessVerificationCase,
  transitionBusinessVerificationCase,
  type BusinessVerificationCaseRecord,
  type BusinessVerificationCaseStatus
} from "./repositories/business-verification";

export {
  listReadinessLaneOptions,
  readLatestReadinessAssessment,
  readReadinessAssessment,
  requestReadinessProviderSupport,
  ReadinessVersionConflictError,
  saveReadinessAssessment,
  type ReadinessAssessmentRecord,
  type ReadinessEvidenceRecord,
  type ReadinessLaneOption
} from "./repositories/readiness";

export {
  listLaneRegulatoryImpacts,
  syncLaneRegulatoryImpacts,
  transitionRegulatoryLaneImpact,
  type RegulatoryLaneImpactRecord
} from "./repositories/regulatory";

export {
  createExtractionProposal,
  recordAcceptedExtractionUsage,
  reviewExtractionField,
  type ExtractionFieldProposalInput,
  type ExtractionSourceSpanInput
} from "./repositories/ai-extraction";

export {
  readPrimaryProduct,
  savePrimaryProduct,
  type ProductRecord
} from "./repositories/products";

export {
  TaskVersionConflictError,
  transitionTaskStatus
} from "./repositories/tasks";

export {
  acceptLegalDocument,
  listActorLegalAcceptances,
  listEffectiveLegalDocuments,
  type EffectiveLegalDocumentRecord,
  type LegalAcceptanceRecord
} from "./repositories/legal";

export {
  readTenantExportLane,
  readWorkspaceDashboard,
  type TenantExportLaneReadModel,
  type WorkspaceDashboardProduct,
  type WorkspaceDashboardReadModel,
  type WorkspaceDashboardTask,
  type WorkspaceTaskStatus
} from "./read-models/workspace";
