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
export const mailboxConnectionStatus = pgEnum("mailbox_connection_status", [
  "pending_authorization", "connected", "reauthorization_required", "paused", "disconnected"
]);
export const emailMessageDirection = pgEnum("email_message_direction", ["inbound", "outbound"]);
export const subscriptionTier = pgEnum("subscription_tier", ["preview", "explore", "launch", "scale", "managed"]);
export const entitlementSource = pgEnum("entitlement_source", ["platform_grant", "trial", "paid", "pilot"]);
export const idempotencyState = pgEnum("idempotency_state", ["in_progress", "succeeded", "failed"]);
export const webhookDeliveryState = pgEnum("webhook_delivery_state", [
  "received", "processed", "ignored", "failed", "dead_letter"
]);
export const outboxEventState = pgEnum("outbox_event_state", ["pending", "processing", "published", "dead_letter"]);
export const exportLaneStatus = pgEnum("export_lane_status", ["draft", "active", "on_hold", "completed", "cancelled", "archived"]);
export const exportLaneStage = pgEnum("export_lane_stage", [
  "opportunity", "readiness", "evidence", "buyer", "offer",
  "production", "shipment", "payment", "repeat"
]);
export const exportLaneHealth = pgEnum("export_lane_health", ["on_track", "needs_attention", "blocked"]);
export const exportLaneIncoterm = pgEnum("export_lane_incoterm", ["FOB", "CIF", "DDP"]);
export const exportLaneParticipantRole = pgEnum("export_lane_participant_role", ["owner", "contributor", "reviewer", "observer"]);
export const exportLaneDecisionStatus = pgEnum("export_lane_decision_status", ["proposed", "approved", "rejected", "superseded"]);
export const evidenceUploadIntentStatus = pgEnum("evidence_upload_intent_status", ["pending", "consumed", "expired", "cancelled"]);
export const evidenceStorageState = pgEnum("evidence_storage_state", ["quarantine", "clean", "rejected", "deleted"]);
export const evidenceScanState = pgEnum("evidence_scan_state", ["queued", "scanning", "clean", "rejected", "retryable_failure", "dead_letter"]);
export const evidenceShareStatus = pgEnum("evidence_share_status", ["active", "revoked", "expired"]);
export const verificationCaseStatus = pgEnum("verification_case_status", ["draft", "submitted", "under_review", "verified", "rejected", "withdrawn"]);
export const passportFactStatus = pgEnum("passport_fact_status", ["declared", "evidence_added", "under_review", "verified", "rejected", "expired"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrganizationId: text("clerk_organization_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name").notNull(),
  defaultLocale: text("default_locale").notNull().default("en"),
  defaultTimezone: text("default_timezone").notNull().default("UTC"),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
  caseReference: text("case_reference").notNull().default("unspecified"),
  reason: text("reason").notNull(),
  approvedBy: text("approved_by").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  breakGlass: boolean("break_glass").notNull().default(false),
  secondApprovedBy: text("second_approved_by"),
  alertedAt: timestamp("alerted_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("staff_access_org_idx").on(table.organizationId),
  index("staff_access_staff_window_idx").on(table.staffProfileId, table.startsAt, table.expiresAt),
  check("staff_access_window_check", sql`${table.expiresAt} > ${table.startsAt}`),
  check("staff_access_break_glass_check", sql`not ${table.breakGlass} or (${table.secondApprovedBy} is not null and ${table.alertedAt} is not null)`)
]);

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

export const emailConnections = pgTable("email_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  emailAddress: text("email_address").notNull(),
  displayName: text("display_name").notNull(),
  authStrategy: text("auth_strategy").notNull(),
  status: mailboxConnectionStatus("status").notNull().default("pending_authorization"),
  credentialSecretRef: text("credential_secret_ref"),
  grantedScopes: text("granted_scopes").array().notNull().default([]),
  syncCursor: text("sync_cursor"),
  subscriptionId: text("subscription_id"),
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
  lastSyncErrorCode: text("last_sync_error_code"),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("email_connections_org_provider_address_unique").on(table.organizationId, table.provider, table.emailAddress),
  index("email_connections_org_status_idx").on(table.organizationId, table.status)
]);

export const emailThreads = pgTable("email_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailConnectionId: uuid("email_connection_id").notNull().references(() => emailConnections.id, { onDelete: "cascade" }),
  providerThreadId: text("provider_thread_id").notNull(),
  subject: text("subject").notNull(),
  snippet: text("snippet").notNull().default(""),
  participants: text("participants").array().notNull().default([]),
  unread: boolean("unread").notNull().default(true),
  flagged: boolean("flagged").notNull().default(false),
  attachmentCount: integer("attachment_count").notNull().default(0),
  latestMessageAt: timestamp("latest_message_at", { withTimezone: true }).notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  relatedEntityLabel: text("related_entity_label"),
  ...timestamps
}, (table) => [
  uniqueIndex("email_threads_connection_provider_thread_unique").on(table.emailConnectionId, table.providerThreadId),
  index("email_threads_org_activity_idx").on(table.organizationId, table.latestMessageAt),
  index("email_threads_org_unread_idx").on(table.organizationId, table.unread)
]);

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailConnectionId: uuid("email_connection_id").notNull().references(() => emailConnections.id, { onDelete: "cascade" }),
  emailThreadId: uuid("email_thread_id").notNull().references(() => emailThreads.id, { onDelete: "cascade" }),
  providerMessageId: text("provider_message_id").notNull(),
  direction: emailMessageDirection("direction").notNull(),
  fromAddress: text("from_address").notNull(),
  toAddresses: text("to_addresses").array().notNull().default([]),
  ccAddresses: text("cc_addresses").array().notNull().default([]),
  replyToAddress: text("reply_to_address"),
  subject: text("subject").notNull(),
  textPreview: text("text_preview").notNull().default(""),
  bodyStorageRef: text("body_storage_ref"),
  internetMessageId: text("internet_message_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("email_messages_connection_provider_message_unique").on(table.emailConnectionId, table.providerMessageId),
  index("email_messages_thread_sent_idx").on(table.emailThreadId, table.sentAt),
  index("email_messages_org_sent_idx").on(table.organizationId, table.sentAt)
]);

export const emailAttachments = pgTable("email_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailMessageId: uuid("email_message_id").notNull().references(() => emailMessages.id, { onDelete: "cascade" }),
  providerAttachmentId: text("provider_attachment_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  objectKey: text("object_key"),
  scanStatus: text("scan_status").notNull().default("pending"),
  ...timestamps
}, (table) => [
  uniqueIndex("email_attachments_message_provider_unique").on(table.emailMessageId, table.providerAttachmentId),
  index("email_attachments_org_idx").on(table.organizationId)
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
  /* Replaces Clerk organization metadata as the store for onboarding and
     profile state. Metadata has no transaction, no audit trail, no row-level
     security and no restore path. */
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  onboardingVersion: integer("onboarding_version").notNull().default(0),
  activatedBy: text("activated_by"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  supportEmail: text("support_email"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  exportStage: text("export_stage"),
  primarySalesChannel: text("primary_sales_channel"),
  marketStrategy: jsonb("market_strategy").$type<Record<string, unknown>>().notNull().default({}),
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

export const documentUploadIntents = pgTable("document_upload_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  expectedMimeType: text("expected_mime_type").notNull(),
  expectedByteSize: integer("expected_byte_size").notNull(),
  expectedChecksumSha256: text("expected_checksum_sha256").notNull(),
  status: evidenceUploadIntentStatus("status").notNull().default("pending"),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("document_upload_intents_org_id_unique").on(table.organizationId, table.id),
  index("document_upload_intents_org_status_expiry_idx").on(table.organizationId, table.status, table.expiresAt),
  check("document_upload_intents_mime_check", sql`${table.expectedMimeType} in ('application/pdf', 'image/jpeg', 'image/png')`),
  check("document_upload_intents_size_check", sql`${table.expectedByteSize} between 1 and 26214400`),
  check("document_upload_intents_checksum_check", sql`${table.expectedChecksumSha256} ~ '^[a-f0-9]{64}$'`),
  check("document_upload_intents_consumption_check", sql`(${table.status} = 'consumed') = (${table.consumedAt} is not null)`)
]);

export const documentStorageObjects = pgTable("document_storage_objects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  state: evidenceStorageState("state").notNull().default("quarantine"),
  objectKey: text("object_key").notNull().unique(),
  providerVersion: text("provider_version").notNull(),
  etag: text("etag").notNull(),
  byteSize: integer("byte_size").notNull(),
  checksumSha256: text("checksum_sha256").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("document_storage_objects_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("document_storage_objects_document_version_unique").on(table.documentVersionId),
  index("document_storage_objects_org_state_idx").on(table.organizationId, table.state),
  check("document_storage_objects_size_check", sql`${table.byteSize} between 1 and 26214400`),
  check("document_storage_objects_checksum_check", sql`${table.checksumSha256} ~ '^[a-f0-9]{64}$'`),
  check("document_storage_objects_deletion_check", sql`(${table.state} = 'deleted') = (${table.deletedAt} is not null)`)
]);

export const documentScanEvents = pgTable("document_scan_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  state: evidenceScanState("state").notNull(),
  attempt: integer("attempt").notNull(),
  scannerReference: text("scanner_reference"),
  safeReasonCode: text("safe_reason_code"),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("document_scan_events_version_attempt_state_unique").on(table.documentVersionId, table.attempt, table.state),
  index("document_scan_events_org_version_idx").on(table.organizationId, table.documentVersionId),
  check("document_scan_events_attempt_check", sql`${table.attempt} between 1 and 5`)
]);

export const documentEvidenceLinks = pgTable("document_evidence_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  purpose: text("purpose").notNull(),
  linkedBy: text("linked_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("document_evidence_links_unique").on(table.documentVersionId, table.entityType, table.entityId, table.purpose),
  index("document_evidence_links_org_entity_idx").on(table.organizationId, table.entityType, table.entityId)
]);

export const documentExternalShares = pgTable("document_external_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  tokenHash: text("token_hash").notNull().unique(),
  status: evidenceShareStatus("status").notNull().default("active"),
  purpose: text("purpose").notNull(),
  recipientReference: text("recipient_reference").notNull(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  maximumDownloads: integer("maximum_downloads").notNull().default(1),
  downloadCount: integer("download_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedBy: text("revoked_by"),
  ...timestamps
}, (table) => [
  index("document_external_shares_org_status_idx").on(table.organizationId, table.status, table.expiresAt),
  check("document_external_shares_download_check", sql`${table.maximumDownloads} between 1 and 100 and ${table.downloadCount} between 0 and ${table.maximumDownloads}`),
  check("document_external_shares_revocation_check", sql`(${table.status} = 'revoked') = (${table.revokedAt} is not null and ${table.revokedBy} is not null)`)
]);

export const legalHolds = pgTable("legal_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  reason: text("reason").notNull(),
  authorityReference: text("authority_reference").notNull(),
  appliedBy: text("applied_by").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  releasedBy: text("released_by"),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("legal_holds_org_entity_idx").on(table.organizationId, table.entityType, table.entityId),
  check("legal_holds_release_check", sql`num_nonnulls(${table.releasedBy}, ${table.releasedAt}) in (0, 2)`)
]);

export const companyRegistrationFacts = pgTable("company_registration_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  jurisdictionCountryCode: text("jurisdiction_country_code").notNull(),
  registrationAuthority: text("registration_authority").notNull(),
  registrationNumber: text("registration_number").notNull(),
  registrationType: text("registration_type").notNull(),
  status: passportFactStatus("status").notNull().default("declared"),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("company_registration_facts_unique").on(table.organizationId, table.registrationAuthority, table.registrationNumber),
  index("company_registration_facts_org_status_idx").on(table.organizationId, table.status),
  check("company_registration_facts_country_check", sql`char_length(${table.jurisdictionCountryCode}) = 2`)
]);

export const companySignatoryFacts = pgTable("company_signatory_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").references(() => organizationMemberships.id, { onDelete: "set null" }),
  displayName: text("display_name").notNull(),
  positionTitle: text("position_title").notNull(),
  authorityScope: text("authority_scope").notNull(),
  status: passportFactStatus("status").notNull().default("declared"),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("company_signatory_facts_org_status_idx").on(table.organizationId, table.status),
  check("company_signatory_facts_window_check", sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`)
]);

export const companyContactFacts = pgTable("company_contact_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  contactType: text("contact_type").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  primary: boolean("primary").notNull().default(false),
  status: passportFactStatus("status").notNull().default("declared"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [index("company_contact_facts_org_type_idx").on(table.organizationId, table.contactType)]);

export const companyBankingRouteFacts = pgTable("company_banking_route_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  bankCountryCode: text("bank_country_code").notNull(),
  swiftBic: text("swift_bic"),
  beneficiaryName: text("beneficiary_name").notNull(),
  maskedAccountReference: text("masked_account_reference").notNull(),
  currencies: text("currencies").array().notNull().default([]),
  status: passportFactStatus("status").notNull().default("declared"),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("company_banking_route_facts_org_status_idx").on(table.organizationId, table.status),
  check("company_banking_route_facts_country_check", sql`char_length(${table.bankCountryCode}) = 2`),
  check("company_banking_route_facts_mask_check", sql`${table.maskedAccountReference} !~ '[0-9]{7,}'`)
]);

export const facilityCapacityFacts = pgTable("facility_capacity_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  facilityId: uuid("facility_id").notNull().references(() => facilities.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  capacityAmount: integer("capacity_amount").notNull(),
  capacityUnit: text("capacity_unit").notNull(),
  period: text("period").notNull(),
  leadTimeDays: integer("lead_time_days"),
  status: passportFactStatus("status").notNull().default("declared"),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("facility_capacity_facts_org_facility_idx").on(table.organizationId, table.facilityId),
  check("facility_capacity_facts_amount_check", sql`${table.capacityAmount} > 0`),
  check("facility_capacity_facts_lead_time_check", sql`${table.leadTimeDays} is null or ${table.leadTimeDays} >= 0`)
]);

export const businessVerificationCases = pgTable("business_verification_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  status: verificationCaseStatus("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  subjectLegalName: text("subject_legal_name").notNull(),
  subjectCountryCode: text("subject_country_code").notNull(),
  submittedBy: text("submitted_by"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  assignedReviewer: text("assigned_reviewer"),
  reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("business_verification_cases_org_id_unique").on(table.organizationId, table.id),
  index("business_verification_cases_org_status_idx").on(table.organizationId, table.status),
  check("business_verification_cases_country_check", sql`char_length(${table.subjectCountryCode}) = 2`),
  check("business_verification_cases_version_check", sql`${table.version} >= 1`)
]);

export const businessVerificationEvidence = pgTable("business_verification_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").notNull().references(() => businessVerificationCases.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  evidenceType: text("evidence_type").notNull(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("business_verification_evidence_unique").on(table.caseId, table.documentVersionId, table.evidenceType),
  index("business_verification_evidence_org_case_idx").on(table.organizationId, table.caseId)
]);

export const businessVerificationStatusHistory = pgTable("business_verification_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").notNull().references(() => businessVerificationCases.id, { onDelete: "cascade" }),
  fromStatus: verificationCaseStatus("from_status").notNull(),
  toStatus: verificationCaseStatus("to_status").notNull(),
  caseVersion: integer("case_version").notNull(),
  rationale: text("rationale").notNull(),
  changedBy: text("changed_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("business_verification_history_case_version_unique").on(table.caseId, table.caseVersion),
  index("business_verification_history_org_case_idx").on(table.organizationId, table.caseId),
  check("business_verification_history_version_check", sql`${table.caseVersion} >= 2`)
]);

/**
 * The Export Lane is the R1 aggregate root. Downstream readiness, evidence,
 * buyer, offer, shipment and payment records attach to this stable identifier
 * rather than reconstructing a lane from product/market fields.
 */
export const exportLanes = pgTable("export_lanes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  originCountryCode: text("origin_country_code").notNull(),
  destinationCountryCode: text("destination_country_code").notNull(),
  salesChannel: text("sales_channel").notNull(),
  buyerSegment: text("buyer_segment").notNull(),
  route: text("route").notNull(),
  incoterm: exportLaneIncoterm("incoterm").notNull(),
  status: exportLaneStatus("status").notNull().default("draft"),
  health: exportLaneHealth("health").notNull().default("on_track"),
  stage: exportLaneStage("stage").notNull().default("opportunity"),
  targetMarginBps: integer("target_margin_bps").notNull(),
  currency: text("currency").notNull(),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("export_lanes_org_id_unique").on(table.organizationId, table.id),
  index("export_lanes_org_updated_idx").on(table.organizationId, table.updatedAt),
  index("export_lanes_org_status_stage_idx").on(table.organizationId, table.status, table.stage),
  check("export_lanes_country_codes_check", sql`char_length(${table.originCountryCode}) = 2 and char_length(${table.destinationCountryCode}) = 2`),
  check("export_lanes_currency_check", sql`char_length(${table.currency}) = 3`),
  check("export_lanes_target_margin_check", sql`${table.targetMarginBps} between 0 and 10000`),
  check("export_lanes_version_check", sql`${table.version} >= 1`),
  check("export_lanes_archival_check", sql`(${table.status} = 'archived') = (${table.archivedAt} is not null)`)
]);

export const exportLaneStageEvents = pgTable("export_lane_stage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  fromStatus: exportLaneStatus("from_status").notNull(),
  toStatus: exportLaneStatus("to_status").notNull(),
  fromStage: exportLaneStage("from_stage").notNull(),
  toStage: exportLaneStage("to_stage").notNull(),
  aggregateVersion: integer("aggregate_version").notNull(),
  changedBy: text("changed_by").notNull(),
  rationale: text("rationale").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("export_lane_stage_events_lane_version_unique").on(table.exportLaneId, table.aggregateVersion),
  index("export_lane_stage_events_org_lane_idx").on(table.organizationId, table.exportLaneId),
  check("export_lane_stage_events_version_check", sql`${table.aggregateVersion} >= 2`),
  check("export_lane_stage_events_rationale_check", sql`char_length(trim(${table.rationale})) > 0`)
]);

export const exportLaneParticipants = pgTable("export_lane_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").references(() => organizationMemberships.id, { onDelete: "cascade" }),
  staffProfileId: uuid("staff_profile_id").references(() => staffProfiles.id, { onDelete: "cascade" }),
  externalReference: text("external_reference"),
  role: exportLaneParticipantRole("role").notNull(),
  active: boolean("active").notNull().default(true),
  addedBy: text("added_by").notNull(),
  ...timestamps
}, (table) => [
  index("export_lane_participants_org_lane_idx").on(table.organizationId, table.exportLaneId),
  uniqueIndex("export_lane_participants_membership_unique").on(table.exportLaneId, table.membershipId),
  uniqueIndex("export_lane_participants_staff_unique").on(table.exportLaneId, table.staffProfileId),
  check("export_lane_participants_identity_check", sql`num_nonnulls(${table.membershipId}, ${table.staffProfileId}, ${table.externalReference}) = 1`)
]);

export const exportLaneDecisions = pgTable("export_lane_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  decisionType: text("decision_type").notNull(),
  status: exportLaneDecisionStatus("status").notNull().default("proposed"),
  summary: text("summary").notNull(),
  rationale: text("rationale").notNull(),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  decidedBy: text("decided_by").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  supersedesDecisionId: uuid("supersedes_decision_id"),
  ...timestamps
}, (table) => [
  uniqueIndex("export_lane_decisions_org_id_unique").on(table.organizationId, table.id),
  index("export_lane_decisions_org_lane_idx").on(table.organizationId, table.exportLaneId),
  index("export_lane_decisions_lane_type_idx").on(table.exportLaneId, table.decisionType, table.decidedAt),
  check("export_lane_decisions_summary_check", sql`char_length(trim(${table.summary})) > 0`),
  check("export_lane_decisions_rationale_check", sql`char_length(trim(${table.rationale})) > 0`)
]);

export const readinessAssessments = pgTable("readiness_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
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
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "cascade" }),
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
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "cascade" }),
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

/**
 * Plan entitlements live here rather than in the identity provider's billing
 * product. Keeping them in the tenant database means a plan change is an
 * audited row in the same transaction as the decision that caused it, it can
 * be granted for a pilot without a payment processor, and the authorization
 * ceiling does not depend on a third party being reachable.
 */
export const organizationEntitlements = pgTable("organization_entitlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  tier: subscriptionTier("tier").notNull(),
  source: entitlementSource("source").notNull(),
  reason: text("reason").notNull(),
  grantedBy: text("granted_by").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("organization_entitlements_org_effective_idx").on(table.organizationId, table.effectiveFrom),
  check("organization_entitlements_window_check", sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`)
]);

/**
 * Durable idempotency for webhooks and retryable commands. `request_hash`
 * makes a reused key carrying a different body a conflict rather than a silent
 * overwrite.
 */
export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  requestHash: text("request_hash").notNull(),
  state: idempotencyState("state").notNull().default("in_progress"),
  resultReference: text("result_reference"),
  attempts: integer("attempts").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps
}, (table) => [index("idempotency_keys_expiry_idx").on(table.expiresAt)]);

/** Atomic, multi-isolate rate-limit counters. Values contain hashed/stable
 * subjects only; raw client addresses are never stored. */
export const rateLimitCounters = pgTable("rate_limit_counters", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("rate_limit_counters_expiry_idx").on(table.resetAt)]);

/**
 * Every inbound provider delivery, including the ones this deployment ignores
 * by design. Retained so a missing projection can be distinguished from a
 * delivery that never arrived.
 */
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  state: webhookDeliveryState("state").notNull().default("received"),
  attempts: integer("attempts").notNull().default(1),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  failureReason: text("failure_reason"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true })
}, (table) => [
  uniqueIndex("webhook_deliveries_provider_event_unique").on(table.provider, table.eventId),
  index("webhook_deliveries_state_idx").on(table.state, table.receivedAt)
]);

/** Durable work emitted in the same transaction as authoritative state. A
 * publisher may retry safely by `dedupe_key`; customer-confidential content
 * belongs in linked storage, never in this payload. */
export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  state: outboxEventState("state").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  ...timestamps
}, (table) => [
  index("outbox_events_dispatch_idx").on(table.state, table.availableAt),
  index("outbox_events_org_created_idx").on(table.organizationId, table.createdAt)
]);
