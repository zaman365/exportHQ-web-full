import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
};

export const taskStatus = pgEnum("task_status", [
  "todo", "in_progress", "waiting_customer", "waiting_export_hq",
  "waiting_third_party", "completed", "blocked", "cancelled"
]);
export const responsibility = pgEnum("responsibility", ["customer", "export_hq", "third_party"]);
export const reviewState = pgEnum("review_state", ["pending_review", "platform_verified", "human_reviewed"]);
export const requirementStatus = pgEnum("requirement_status", [
  "not_assessed", "required", "not_applicable", "in_progress", "evidence_submitted",
  "under_review", "compliant", "expired", "action_required"
]);
export const documentStatus = pgEnum("document_status", ["quarantine", "under_review", "approved", "rejected", "expired"]);
export const businessVerificationStatus = pgEnum("business_verification_status", ["unverified", "pending", "verified", "rejected"]);
export const marketOpportunityStatus = pgEnum("market_opportunity_status", ["draft", "published", "retired"]);
export const marketOpportunityTrend = pgEnum("market_opportunity_trend", ["accelerating", "established", "emerging"]);
export const readinessAssessmentStatus = pgEnum("readiness_assessment_status", ["draft", "submitted", "under_review", "complete", "archived"]);
export const readinessResponseStatus = pgEnum("readiness_response_status", ["not_started", "in_progress", "evidence_added", "verified", "blocked", "not_applicable"]);
export const readinessEvidenceReviewStatus = pgEnum("readiness_evidence_review_status", ["staged", "under_review", "needs_action", "accepted", "rejected"]);
export const providerVerificationStatus = pgEnum("provider_verification_status", ["applicant", "screening", "verified", "suspended", "retired"]);
export const providerReferralStatus = pgEnum("provider_referral_status", ["requested", "matching", "introduced", "engaged", "closed", "declined"]);
export const teamAccessRole = pgEnum("team_access_role", ["owner", "executive", "department_lead", "manager", "member", "viewer", "external"]);
export const conversationKind = pgEnum("conversation_kind", ["department", "direct", "export_hq"]);
export const messageDeliveryStatus = pgEnum("message_delivery_status", ["sent", "read"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrganizationId: text("clerk_organization_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name").notNull(),
  defaultLocale: text("default_locale").notNull().default("en"),
  defaultTimezone: text("default_timezone").notNull().default("UTC"),
  ...timestamps
});

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: text("role").notNull(),
  positionTitle: text("position_title").notNull().default("Member"),
  accessRole: teamAccessRole("access_role").notNull().default("member"),
  hierarchyRank: integer("hierarchy_rank").notNull().default(30),
  permissions: text("permissions").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [
  uniqueIndex("organization_membership_user_unique").on(table.organizationId, table.clerkUserId),
  index("organization_membership_user_idx").on(table.clerkUserId),
  check("organization_membership_hierarchy_rank_check", sql`${table.hierarchyRank} between 0 and 100`)
]);

export const staffProfiles = pgTable("staff_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  globalPermissions: text("global_permissions").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  ...timestamps
});

export const staffAccessGrants = pgTable("staff_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  staffProfileId: uuid("staff_profile_id").notNull().references(() => staffProfiles.id, { onDelete: "cascade" }),
  permissions: text("permissions").array().notNull().default([]),
  reason: text("reason").notNull(),
  approvedBy: text("approved_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps
}, (table) => [index("staff_access_org_idx").on(table.organizationId)]);

export const organizationTeams = pgTable("organization_teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  purpose: text("purpose").notNull(),
  leadMembershipId: uuid("lead_membership_id").references(() => organizationMemberships.id, { onDelete: "set null" }),
  createdBy: text("created_by").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [
  uniqueIndex("organization_teams_org_slug_unique").on(table.organizationId, table.slug),
  index("organization_teams_org_active_idx").on(table.organizationId, table.active)
]);

export const organizationTeamMembers = pgTable("organization_team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").notNull().references(() => organizationTeams.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "cascade" }),
  teamPositionTitle: text("team_position_title"),
  isTeamLead: boolean("is_team_lead").notNull().default(false),
  addedBy: text("added_by").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [
  uniqueIndex("organization_team_members_unique").on(table.teamId, table.membershipId),
  index("organization_team_members_org_idx").on(table.organizationId),
  index("organization_team_members_membership_idx").on(table.membershipId)
]);

export const organizationConversations = pgTable("organization_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => organizationTeams.id, { onDelete: "set null" }),
  kind: conversationKind("kind").notNull(),
  title: text("title").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  createdBy: text("created_by").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("organization_conversations_org_activity_idx").on(table.organizationId, table.updatedAt),
  index("organization_conversations_team_idx").on(table.teamId)
]);

export const organizationConversationParticipants = pgTable("organization_conversation_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => organizationConversations.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").references(() => organizationMemberships.id, { onDelete: "cascade" }),
  staffProfileId: uuid("staff_profile_id").references(() => staffProfiles.id, { onDelete: "cascade" }),
  addedBy: text("added_by").notNull(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("conversation_participant_member_unique").on(table.conversationId, table.membershipId),
  uniqueIndex("conversation_participant_staff_unique").on(table.conversationId, table.staffProfileId),
  index("conversation_participants_org_idx").on(table.organizationId),
  check("conversation_participant_identity_check", sql`num_nonnulls(${table.membershipId}, ${table.staffProfileId}) = 1`)
]);

export const organizationMessages = pgTable("organization_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => organizationConversations.id, { onDelete: "cascade" }),
  senderMembershipId: uuid("sender_membership_id").references(() => organizationMemberships.id, { onDelete: "set null" }),
  senderStaffProfileId: uuid("sender_staff_profile_id").references(() => staffProfiles.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  deliveryStatus: messageDeliveryStatus("delivery_status").notNull().default("sent"),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("organization_messages_conversation_created_idx").on(table.conversationId, table.createdAt),
  index("organization_messages_org_created_idx").on(table.organizationId, table.createdAt),
  check("organization_message_sender_check", sql`num_nonnulls(${table.senderMembershipId}, ${table.senderStaffProfileId}) = 1`),
  check("organization_message_body_check", sql`char_length(${table.body}) between 1 and 4000`)
]);

export const companyProfiles = pgTable("company_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  registrationNumber: text("registration_number"),
  originCountryCode: text("origin_country_code").notNull(),
  industry: text("industry").notNull(),
  website: text("website"),
  employeeCount: integer("employee_count"),
  exportMarkets: text("export_markets").array().notNull().default([]),
  onboardingPercent: integer("onboarding_percent").notNull().default(0),
  verificationStatus: businessVerificationStatus("verification_status").notNull().default("unverified"),
  verificationSubmittedAt: timestamp("verification_submitted_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  ...timestamps
});

export const businessVerificationRequests = pgTable("business_verification_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  status: businessVerificationStatus("status").notNull().default("pending"),
  legalName: text("legal_name").notNull(),
  registrationNumber: text("registration_number").notNull(),
  registrationAuthority: text("registration_authority").notNull(),
  originCountryCode: text("origin_country_code").notNull(),
  website: text("website").notNull(),
  businessEmail: text("business_email").notNull(),
  evidenceUrl: text("evidence_url").notNull(),
  submittedBy: text("submitted_by").notNull(),
  reviewedBy: text("reviewed_by"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("business_verification_requests_org_status_idx").on(table.organizationId, table.status),
  index("business_verification_requests_status_created_idx").on(table.status, table.createdAt)
]);

export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  countryCode: text("country_code").notNull(),
  address: text("address").notNull(),
  productionCapacity: text("production_capacity"),
  capabilities: text("capabilities").array().notNull().default([]),
  ...timestamps
}, (table) => [index("facilities_org_idx").on(table.organizationId)]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  composition: text("composition"),
  hsCode: text("hs_code"),
  countryOfOrigin: text("country_of_origin").notNull(),
  currency: text("currency").notNull(),
  fobPriceMinor: integer("fob_price_minor"),
  ...timestamps
}, (table) => [
  uniqueIndex("products_org_sku_unique").on(table.organizationId, table.sku),
  index("products_org_idx").on(table.organizationId)
]);

export const markets = pgTable("markets", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull().unique(),
  iso3Code: text("iso3_code").unique(),
  name: text("name").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  region: text("region").notNull().default("Global"),
  active: boolean("active").notNull().default(true)
});

export const marketCatalogProducts = pgTable("market_catalog_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  hsCodes: text("hs_codes").array().notNull().default([]),
  originCountryCode: text("origin_country_code").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [index("market_catalog_products_origin_category_idx").on(table.originCountryCode, table.category)]);

export const marketOpportunities = pgTable("market_opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => marketCatalogProducts.id, { onDelete: "cascade" }),
  originCountryCode: text("origin_country_code").notNull(),
  status: marketOpportunityStatus("status").notNull().default("draft"),
  trend: marketOpportunityTrend("trend").notNull(),
  confidence: text("confidence").notNull(),
  opportunityScore: integer("opportunity_score").notNull(),
  demandScore: integer("demand_score").notNull(),
  originFitScore: integer("origin_fit_score").notNull(),
  publicSummary: text("public_summary").notNull(),
  memberInsight: text("member_insight").notNull(),
  whyItRanks: text("why_it_ranks").array().notNull().default([]),
  buyerProfiles: text("buyer_profiles").array().notNull().default([]),
  entryRoutes: text("entry_routes").array().notNull().default([]),
  barriers: text("barriers").array().notNull().default([]),
  proofToPrepare: text("proof_to_prepare").array().notNull().default([]),
  nextActions: text("next_actions").array().notNull().default([]),
  methodVersion: text("method_version").notNull(),
  lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("market_opportunities_origin_market_product_unique").on(table.originCountryCode, table.marketId, table.productId),
  index("market_opportunities_market_status_idx").on(table.marketId, table.status),
  index("market_opportunities_product_status_idx").on(table.productId, table.status),
  check("market_opportunities_confidence_check", sql`${table.confidence} in ('high', 'medium')`),
  check("market_opportunities_score_check", sql`${table.opportunityScore} between 0 and 100`),
  check("market_opportunities_demand_score_check", sql`${table.demandScore} between 0 and 100`),
  check("market_opportunities_origin_fit_score_check", sql`${table.originFitScore} between 0 and 100`)
]);

export const marketOpportunityEvidence = pgTable("market_opportunity_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id").notNull().references(() => marketOpportunities.id, { onDelete: "cascade" }),
  sourceLabel: text("source_label").notNull(),
  sourcePublisher: text("source_publisher").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull().default("trade_data"),
  dataPeriod: text("data_period").notNull(),
  metric: text("metric").notNull(),
  rawMetrics: jsonb("raw_metrics").$type<Record<string, string | number | null>>().notNull().default({}),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  ...timestamps
}, (table) => [index("market_opportunity_evidence_opportunity_idx").on(table.opportunityId)]);

export const organizationMarketShortlists = pgTable("organization_market_shortlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id").notNull().references(() => marketOpportunities.id, { onDelete: "cascade" }),
  savedBy: text("saved_by").notNull(),
  notes: text("notes"),
  ...timestamps
}, (table) => [
  uniqueIndex("organization_market_shortlists_unique").on(table.organizationId, table.opportunityId),
  index("organization_market_shortlists_org_idx").on(table.organizationId)
]);

export const productMarkets = pgTable("product_markets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  marketId: uuid("market_id").notNull().references(() => markets.id),
  readinessScore: integer("readiness_score").notNull().default(0),
  status: text("status").notNull().default("not_assessed"),
  ...timestamps
}, (table) => [
  uniqueIndex("product_markets_unique").on(table.productId, table.marketId),
  index("product_markets_org_idx").on(table.organizationId)
]);

export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  description: text("description").notNull(),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull(),
  reviewedBy: text("reviewed_by"),
  reviewState: reviewState("review_state").notNull().default("pending_review"),
  ...timestamps
});

export const requirementApplicabilities = pgTable("requirement_applicabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  requirementId: uuid("requirement_id").notNull().references(() => requirements.id),
  productMarketId: uuid("product_market_id").notNull().references(() => productMarkets.id, { onDelete: "cascade" }),
  status: requirementStatus("status").notNull().default("not_assessed"),
  ownerId: text("owner_id"),
  deadline: timestamp("deadline", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps
}, (table) => [index("requirement_applicabilities_org_idx").on(table.organizationId)]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: documentStatus("status").notNull().default("quarantine"),
  ownerId: text("owner_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  linkedEntityType: text("linked_entity_type").notNull(),
  linkedEntityId: uuid("linked_entity_id").notNull(),
  ...timestamps
}, (table) => [index("documents_org_idx").on(table.organizationId)]);

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  checksumSha256: text("checksum_sha256"),
  uploadedBy: text("uploaded_by").notNull(),
  scanStatus: text("scan_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [uniqueIndex("document_version_unique").on(table.documentId, table.version)]);

export const readinessAssessments = pgTable("readiness_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull(),
  methodVersion: text("method_version").notNull(),
  status: readinessAssessmentStatus("status").notNull().default("draft"),
  originCountryCode: text("origin_country_code").notNull().default("BD"),
  businessModel: text("business_model").notNull(),
  productCategory: text("product_category").notNull(),
  productName: text("product_name").notNull(),
  hsCode: text("hs_code"),
  targetMarketCode: text("target_market_code").notNull(),
  salesChannel: text("sales_channel").notNull(),
  currentSection: text("current_section").notNull().default("business"),
  score: integer("score").notNull().default(0),
  lastSavedAt: timestamp("last_saved_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("readiness_assessments_org_updated_idx").on(table.organizationId, table.updatedAt),
  check("readiness_assessments_score_check", sql`${table.score} between 0 and 100`)
]);

export const readinessResponses = pgTable("readiness_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => readinessAssessments.id, { onDelete: "cascade" }),
  requirementKey: text("requirement_key").notNull(),
  status: readinessResponseStatus("status").notNull().default("not_started"),
  note: text("note"),
  ownerId: text("owner_id"),
  targetDate: timestamp("target_date", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("readiness_responses_assessment_requirement_unique").on(table.assessmentId, table.requirementKey),
  index("readiness_responses_org_status_idx").on(table.organizationId, table.status)
]);

export const readinessEvidenceReviews = pgTable("readiness_evidence_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => readinessAssessments.id, { onDelete: "cascade" }),
  readinessResponseId: uuid("readiness_response_id").notNull().references(() => readinessResponses.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "cascade" }),
  status: readinessEvidenceReviewStatus("status").notNull().default("staged"),
  extraction: jsonb("extraction").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  feedback: text("feedback"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("readiness_evidence_reviews_org_status_idx").on(table.organizationId, table.status),
  index("readiness_evidence_reviews_response_idx").on(table.readinessResponseId)
]);

export const serviceProviderProfiles = pgTable("service_provider_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name").notNull(),
  categories: text("categories").array().notNull().default([]),
  countries: text("countries").array().notNull().default([]),
  productCategories: text("product_categories").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  verificationStatus: providerVerificationStatus("verification_status").notNull().default("applicant"),
  verificationEvidence: jsonb("verification_evidence").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  commissionDisclosure: text("commission_disclosure").notNull(),
  active: boolean("active").notNull().default(false),
  ...timestamps
}, (table) => [
  index("service_provider_profiles_status_idx").on(table.verificationStatus, table.active)
]);

export const readinessProviderReferrals = pgTable("readiness_provider_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => readinessAssessments.id, { onDelete: "cascade" }),
  requirementKey: text("requirement_key").notNull(),
  providerCategory: text("provider_category").notNull(),
  matchedProviderId: uuid("matched_provider_id").references(() => serviceProviderProfiles.id, { onDelete: "set null" }),
  status: providerReferralStatus("status").notNull().default("requested"),
  requestedBy: text("requested_by").notNull(),
  requestNote: text("request_note"),
  commissionDisclosure: text("commission_disclosure").notNull(),
  disclosureAcceptedAt: timestamp("disclosure_accepted_at", { withTimezone: true }).notNull(),
  introducedAt: timestamp("introduced_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("readiness_provider_referrals_org_status_idx").on(table.organizationId, table.status),
  index("readiness_provider_referrals_provider_idx").on(table.matchedProviderId)
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ownerId: text("owner_id").notNull(),
  responsibility: responsibility("responsibility").notNull(),
  priority: text("priority").notNull().default("normal"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  status: taskStatus("status").notNull().default("todo"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: uuid("related_entity_id"),
  ...timestamps
}, (table) => [index("tasks_org_status_idx").on(table.organizationId, table.status)]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  actorId: text("actor_id").notNull(),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("audit_events_org_time_idx").on(table.organizationId, table.createdAt)]);
