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
export const regulatoryImpactState = pgEnum("regulatory_impact_state", ["pending", "acknowledged", "resolved", "superseded"]);
export const aiExtractionRunState = pgEnum("ai_extraction_run_state", ["proposed", "under_review", "accepted", "rejected", "failed"]);
export const aiExtractionDecision = pgEnum("ai_extraction_decision", ["accepted", "rejected", "corrected"]);
export const passportFactStatus = pgEnum("passport_fact_status", ["declared", "evidence_added", "under_review", "verified", "rejected", "expired"]);
export const legalDocumentStatus = pgEnum("legal_document_status", ["draft", "published", "retired"]);
export const pilotParticipationStatus = pgEnum("pilot_participation_status", ["invited", "accepted", "active", "paused", "completed", "withdrawn"]);
export const pilotPassStatus = pgEnum("pilot_pass_status", ["active", "extended", "converted", "expired", "revoked"]);
export const pilotSupportStatus = pgEnum("pilot_support_status", ["open", "in_progress", "waiting_customer", "resolved", "closed"]);
export const pilotMetricEventName = pgEnum("pilot_metric_event_name", [
  "invite_sent", "organization_created", "passport_started", "passport_completed",
  "lane_created", "action_plan_ready", "canonical_field_reused", "canonical_field_reentered",
  "upload_requested", "scan_completed", "scan_failed", "review_completed", "review_failed",
  "task_completed", "task_overdue", "support_intervention", "extraction_corrected",
  "trust_surveyed", "willingness_to_pay_recorded", "coordination_burden_replaced"
]);
export const buyerVerificationStatus = pgEnum("buyer_verification_status", ["unverified", "source_supported", "provider_attested", "human_reviewed", "rejected"]);
export const buyerRiskStatus = pgEnum("buyer_risk_status", ["not_assessed", "low", "medium", "high", "blocked"]);
export const outreachConsentState = pgEnum("outreach_consent_state", ["unknown", "permitted", "objected", "opted_out"]);
export const salesOpportunityStatus = pgEnum("sales_opportunity_status", ["identified", "qualified", "rfq_received", "quoted", "won", "lost", "archived"]);
export const buyerRfqStatus = pgEnum("buyer_rfq_status", ["draft", "received", "clarifying", "ready_to_quote", "quoted", "closed", "cancelled"]);
export const quotationStatus = pgEnum("quotation_status", ["draft", "awaiting_approval", "approved", "sent", "accepted", "rejected", "expired", "superseded"]);
export const approvalDecision = pgEnum("approval_decision", ["approved", "rejected", "changes_requested"]);
export const externalDeliveryStatus = pgEnum("external_delivery_status", ["pending", "queued", "delivered", "retryable_failure", "failed", "cancelled"]);
export const salesOrderStatus = pgEnum("sales_order_status", ["draft", "confirmed", "in_production", "ready_to_ship", "shipped", "completed", "cancelled"]);
export const generatedDocumentStatus = pgEnum("generated_document_status", ["draft", "under_review", "approved", "superseded"]);
export const consistencyIssueStatus = pgEnum("consistency_issue_status", ["open", "resolved", "waived"]);
export const outboundDraftStatus = pgEnum("outbound_draft_status", ["draft", "awaiting_approval", "approved", "queued", "sent", "failed", "cancelled"]);
export const productionBatchStatus = pgEnum("production_batch_status", ["planned", "in_progress", "inspection", "released", "blocked", "cancelled"]);
export const shipmentStatus = pgEnum("shipment_status", ["planning", "booked", "in_transit", "arrived", "delivered", "cancelled"]);
export const exceptionCaseStatus = pgEnum("exception_case_status", ["open", "investigating", "mitigating", "resolved", "closed"]);
export const tradeInvoiceStatus = pgEnum("trade_invoice_status", ["draft", "issued", "partially_paid", "paid", "overdue", "disputed", "void"]);
export const paymentReceiptStatus = pgEnum("payment_receipt_status", ["reported", "bank_advice_received", "matched", "confirmed", "rejected"]);
export const companionWorkflowStatus = pgEnum("companion_workflow_status", ["draft", "in_progress", "ready_for_submission", "submitted", "completed", "blocked", "cancelled"]);
export const billingSubscriptionStatus = pgEnum("billing_subscription_status", ["pending", "active", "past_due", "paused", "cancelled", "expired"]);
export const billingInvoiceStatus = pgEnum("billing_invoice_status", ["draft", "issued", "paid", "void", "refunded", "past_due"]);
export const billingTransactionStatus = pgEnum("billing_transaction_status", ["pending", "succeeded", "failed", "refunded", "cancelled"]);

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

/** Global, versioned publication registry. Application roles may read but may
 * never publish legal text; publishing requires a reviewed migration. */
export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  contentHashSha256: text("content_hash_sha256").notNull(),
  status: legalDocumentStatus("status").notNull().default("draft"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedBy: text("published_by"),
  reviewReference: text("review_reference"),
  ...timestamps
}, (table) => [
  uniqueIndex("legal_documents_slug_version_unique").on(table.slug, table.version),
  index("legal_documents_slug_status_idx").on(table.slug, table.status, table.effectiveAt),
  check("legal_documents_hash_check", sql`${table.contentHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("legal_documents_publication_check", sql`${table.status} <> 'published' or num_nonnulls(${table.effectiveAt}, ${table.publishedAt}, ${table.publishedBy}, ${table.reviewReference}) = 4`)
]);

export const organizationLegalAcceptances = pgTable("organization_legal_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  legalDocumentId: uuid("legal_document_id").notNull().references(() => legalDocuments.id, { onDelete: "restrict" }),
  acceptedBy: text("accepted_by").notNull(),
  acceptedVersion: text("accepted_version").notNull(),
  acceptedHashSha256: text("accepted_hash_sha256").notNull(),
  acceptanceSource: text("acceptance_source").notNull().default("workspace"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("organization_legal_acceptances_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("organization_legal_acceptances_actor_document_unique").on(table.organizationId, table.acceptedBy, table.legalDocumentId),
  index("organization_legal_acceptances_org_actor_idx").on(table.organizationId, table.acceptedBy, table.acceptedAt),
  check("organization_legal_acceptances_hash_check", sql`${table.acceptedHashSha256} ~ '^[a-f0-9]{64}$'`)
]);

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
  legalName: text("legal_name"),
  tradingName: text("trading_name"),
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
  defaultTimezone: text("default_timezone").notNull().default("Asia/Dhaka"),
  defaultLocale: text("default_locale").notNull().default("bn"),
  lowDataMode: boolean("low_data_mode").notNull().default(false),
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

/** Reviewed public/official content. The application role may read published
 * records but cannot publish or edit the registry. */
export const regulatoryPublishers = pgTable("regulatory_publishers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  publisherType: text("publisher_type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  canonicalBaseUrl: text("canonical_base_url").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [
  check("regulatory_publishers_type_check", sql`${table.publisherType} in ('official', 'intergovernmental', 'reviewed_commentary')`)
]);

/** Discovery queue for official sources that have not completed the reviewed
 * publication workflow. Candidate records must never drive customer-facing
 * regulatory guidance; promotion requires a separately hashed and reviewed
 * regulatory_sources record. */
export const regulatorySourceCandidates = pgTable("regulatory_source_candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  publisherId: uuid("publisher_id").notNull().references(() => regulatoryPublishers.id, { onDelete: "restrict" }),
  canonicalUrl: text("canonical_url").notNull().unique(),
  title: text("title").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  sourceType: text("source_type").notNull(),
  candidateFor: text("candidate_for").notNull(),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).notNull(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull(),
  candidateState: text("candidate_state").notNull().default("pending_review"),
  notes: text("notes").notNull().default(""),
  ...timestamps
}, (table) => [
  index("regulatory_source_candidates_review_idx").on(table.candidateState, table.jurisdiction, table.lastCheckedAt),
  check("regulatory_source_candidates_state_check", sql`${table.candidateState} in ('pending_review', 'promoted', 'rejected')`),
  check("regulatory_source_candidates_review_boundary_check", sql`${table.candidateState} <> 'promoted' or ${table.notes} <> ''`)
]);

export const regulatorySources = pgTable("regulatory_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  publisherId: uuid("publisher_id").notNull().references(() => regulatoryPublishers.id, { onDelete: "restrict" }),
  canonicalUrl: text("canonical_url").notNull().unique(),
  title: text("title").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  sourceType: text("source_type").notNull(),
  reference: text("reference").notNull(),
  contentHashSha256: text("content_hash_sha256").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
  reviewedBy: text("reviewed_by").notNull(),
  confidence: text("confidence").notNull(),
  methodVersion: text("method_version").notNull(),
  freshnessSlaDays: integer("freshness_sla_days").notNull(),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull(),
  reviewState: reviewState("review_state").notNull().default("pending_review"),
  ...timestamps
}, (table) => [
  index("regulatory_sources_publisher_review_idx").on(table.publisherId, table.reviewState, table.nextReviewAt),
  check("regulatory_sources_hash_check", sql`${table.contentHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("regulatory_sources_confidence_check", sql`${table.confidence} in ('high', 'medium', 'low')`),
  check("regulatory_sources_freshness_check", sql`${table.freshnessSlaDays} between 1 and 3650`),
  check("regulatory_sources_review_window_check", sql`${table.nextReviewAt} > ${table.reviewedAt}`)
]);

export const regulatoryRules = pgTable("regulatory_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => regulatorySources.id, { onDelete: "restrict" }),
  stableKey: text("stable_key").notNull(),
  version: integer("version").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  productCategories: text("product_categories").array().notNull().default([]),
  hsCodes: text("hs_codes").array().notNull().default([]),
  marketCountryCodes: text("market_country_codes").array().notNull().default([]),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  confidence: text("confidence").notNull(),
  methodVersion: text("method_version").notNull(),
  ruleVersion: text("rule_version").notNull(),
  reviewState: reviewState("review_state").notNull().default("pending_review"),
  reviewedBy: text("reviewed_by").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("regulatory_rules_key_version_unique").on(table.stableKey, table.version),
  uniqueIndex("regulatory_rules_current_key_unique").on(table.stableKey).where(sql`${table.supersededAt} is null`),
  index("regulatory_rules_source_review_idx").on(table.sourceId, table.reviewState),
  check("regulatory_rules_version_check", sql`${table.version} >= 1`),
  check("regulatory_rules_confidence_check", sql`${table.confidence} in ('high', 'medium', 'low')`)
]);

export const regulatoryRuleLaneImpacts = pgTable("regulatory_rule_lane_impacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  regulatoryRuleId: uuid("regulatory_rule_id").notNull().references(() => regulatoryRules.id, { onDelete: "restrict" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  state: regulatoryImpactState("state").notNull().default("pending"),
  impactType: text("impact_type").notNull().default("review_required"),
  assessmentMethodVersion: text("assessment_method_version").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("regulatory_lane_impacts_rule_lane_unique").on(table.organizationId, table.regulatoryRuleId, table.exportLaneId),
  index("regulatory_lane_impacts_org_state_idx").on(table.organizationId, table.state, table.detectedAt),
  check("regulatory_lane_impacts_ack_check", sql`(${table.state} <> 'acknowledged') or (${table.acknowledgedBy} is not null and ${table.acknowledgedAt} is not null)`),
  check("regulatory_lane_impacts_resolve_check", sql`(${table.state} <> 'resolved') or (${table.resolvedBy} is not null and ${table.resolvedAt} is not null)`)
]);

/** AI/extraction outputs are immutable proposals. Accepted business state is
 * linked only after an append-only human decision. */
export const aiExtractionRuns = pgTable("ai_extraction_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  state: aiExtractionRunState("state").notNull().default("proposed"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  modelVersion: text("model_version").notNull(),
  extractionSchema: text("extraction_schema").notNull(),
  extractionSchemaVersion: text("extraction_schema_version").notNull(),
  promptVersion: text("prompt_version").notNull(),
  ruleVersion: text("rule_version").notNull(),
  createdBy: text("created_by").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  ...timestamps
}, (table) => [
  uniqueIndex("ai_extraction_runs_org_id_unique").on(table.organizationId, table.id),
  index("ai_extraction_runs_org_document_idx").on(table.organizationId, table.documentVersionId, table.createdAt),
  check("ai_extraction_runs_failure_check", sql`(${table.state} = 'failed') = (${table.failureCode} is not null)`)
]);

export const aiExtractionFields = pgTable("ai_extraction_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  extractionRunId: uuid("extraction_run_id").notNull().references(() => aiExtractionRuns.id, { onDelete: "cascade" }),
  fieldPath: text("field_path").notNull(),
  proposedValue: jsonb("proposed_value").$type<unknown>().notNull(),
  confidenceBps: integer("confidence_bps").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("ai_extraction_fields_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("ai_extraction_fields_run_path_unique").on(table.extractionRunId, table.fieldPath),
  index("ai_extraction_fields_org_run_idx").on(table.organizationId, table.extractionRunId),
  check("ai_extraction_fields_confidence_check", sql`${table.confidenceBps} between 0 and 10000`)
]);

export const aiExtractionSourceSpans = pgTable("ai_extraction_source_spans", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  extractionFieldId: uuid("extraction_field_id").notNull().references(() => aiExtractionFields.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  pageNumber: integer("page_number"),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  locator: text("locator").notNull(),
  quoteHashSha256: text("quote_hash_sha256").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("ai_extraction_spans_org_field_idx").on(table.organizationId, table.extractionFieldId),
  check("ai_extraction_spans_page_check", sql`${table.pageNumber} is null or ${table.pageNumber} >= 1`),
  check("ai_extraction_spans_offset_check", sql`num_nonnulls(${table.startOffset}, ${table.endOffset}) in (0, 2) and (${table.startOffset} is null or (${table.startOffset} >= 0 and ${table.endOffset} > ${table.startOffset}))`),
  check("ai_extraction_spans_hash_check", sql`${table.quoteHashSha256} ~ '^[a-f0-9]{64}$'`)
]);

export const aiExtractionFieldDecisions = pgTable("ai_extraction_field_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  extractionFieldId: uuid("extraction_field_id").notNull().references(() => aiExtractionFields.id, { onDelete: "cascade" }),
  decision: aiExtractionDecision("decision").notNull(),
  acceptedValue: jsonb("accepted_value").$type<unknown>(),
  rationale: text("rationale").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  supersedesDecisionId: uuid("supersedes_decision_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("ai_extraction_decisions_org_id_unique").on(table.organizationId, table.id),
  index("ai_extraction_decisions_org_field_idx").on(table.organizationId, table.extractionFieldId, table.createdAt),
  check("ai_extraction_decisions_value_check", sql`(${table.decision} = 'rejected' and ${table.acceptedValue} is null) or (${table.decision} in ('accepted', 'corrected') and ${table.acceptedValue} is not null)`),
  check("ai_extraction_decisions_rationale_check", sql`char_length(trim(${table.rationale})) > 0`)
]);

export const aiExtractionUsages = pgTable("ai_extraction_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  extractionFieldId: uuid("extraction_field_id").notNull().references(() => aiExtractionFields.id, { onDelete: "restrict" }),
  decisionId: uuid("decision_id").notNull().references(() => aiExtractionFieldDecisions.id, { onDelete: "restrict" }),
  downstreamEntityType: text("downstream_entity_type").notNull(),
  downstreamEntityId: uuid("downstream_entity_id").notNull(),
  usedBy: text("used_by").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("ai_extraction_usages_field_entity_unique").on(table.extractionFieldId, table.downstreamEntityType, table.downstreamEntityId),
  index("ai_extraction_usages_org_entity_idx").on(table.organizationId, table.downstreamEntityType, table.downstreamEntityId)
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
  uniqueIndex("readiness_assessments_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("readiness_assessments_active_lane_unique")
    .on(table.organizationId, table.exportLaneId)
    .where(sql`${table.exportLaneId} is not null and ${table.status} <> 'archived'`),
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
  uniqueIndex("readiness_responses_org_id_unique").on(table.organizationId, table.id),
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
  requestKey: uuid("request_key").notNull().unique(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => readinessAssessments.id, { onDelete: "cascade" }),
  requirementKey: text("requirement_key").notNull(),
  providerCategory: text("provider_category").notNull(),
  requestMode: text("request_mode").notNull().default("support_request"),
  governanceEvidenceReference: text("governance_evidence_reference"),
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
  index("readiness_provider_referrals_provider_idx").on(table.matchedProviderId),
  index("readiness_provider_referrals_assessment_requirement_idx").on(table.organizationId, table.assessmentId, table.requirementKey),
  check("readiness_provider_referrals_mode_check", sql`
    (${table.requestMode} = 'support_request' and ${table.governanceEvidenceReference} is null and ${table.matchedProviderId} is null)
    or (${table.requestMode} = 'governed_referral' and ${table.governanceEvidenceReference} is not null)
  `)
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
  version: integer("version").notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex("tasks_org_id_unique").on(table.organizationId, table.id),
  index("tasks_org_status_idx").on(table.organizationId, table.status),
  uniqueIndex("tasks_readiness_response_unique")
    .on(table.organizationId, table.relatedEntityType, table.relatedEntityId)
    .where(sql`${table.relatedEntityType} = 'readiness_response'`)
]);

export const taskStatusHistory = pgTable("task_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fromStatus: taskStatus("from_status").notNull(),
  toStatus: taskStatus("to_status").notNull(),
  taskVersion: integer("task_version").notNull(),
  rationale: text("rationale").notNull(),
  changedBy: text("changed_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("task_status_history_task_version_unique").on(table.taskId, table.taskVersion),
  index("task_status_history_org_task_idx").on(table.organizationId, table.taskId, table.createdAt),
  check("task_status_history_version_check", sql`${table.taskVersion} >= 2`),
  check("task_status_history_rationale_check", sql`char_length(trim(${table.rationale})) > 0`)
]);

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

/** Invitation-only Alpha enrollment. The agreement fields are deliberately
 * explicit so a generic entitlement can never be mistaken for pilot consent. */
export const pilotParticipations = pgTable("pilot_participations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  cohortCode: text("cohort_code").notNull(),
  exporterStage: text("exporter_stage").notNull(),
  sectors: text("sectors").array().notNull(),
  destinationCountryCodes: text("destination_country_codes").array().notNull(),
  status: pilotParticipationStatus("status").notNull().default("invited"),
  agreementVersion: text("agreement_version"),
  agreementHashSha256: text("agreement_hash_sha256"),
  agreementAcceptedBy: text("agreement_accepted_by"),
  agreementAcceptedAt: timestamp("agreement_accepted_at", { withTimezone: true }),
  dataHandlingVersion: text("data_handling_version").notNull(),
  supportOwnerActorId: text("support_owner_actor_id"),
  supportHours: text("support_hours").notNull(),
  invitedBy: text("invited_by").notNull(),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("pilot_participations_org_unique").on(table.organizationId),
  index("pilot_participations_cohort_status_idx").on(table.cohortCode, table.status),
  check("pilot_participations_stage_check", sql`${table.exporterStage} in ('established', 'first_shipment', 'second_shipment')`),
  check("pilot_participations_sector_check", sql`cardinality(${table.sectors}) >= 1`),
  check("pilot_participations_destination_check", sql`cardinality(${table.destinationCountryCodes}) >= 1`),
  check("pilot_participations_agreement_hash_check", sql`${table.agreementHashSha256} is null or ${table.agreementHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("pilot_participations_acceptance_check", sql`${table.status} = 'invited' or num_nonnulls(${table.agreementVersion}, ${table.agreementHashSha256}, ${table.agreementAcceptedBy}, ${table.agreementAcceptedAt}) = 4`),
  check("pilot_participations_active_owner_check", sql`${table.status} not in ('active', 'paused', 'completed') or (${table.supportOwnerActorId} is not null and ${table.startedAt} is not null)`),
  check("pilot_participations_end_check", sql`${table.status} not in ('completed', 'withdrawn') or ${table.endedAt} is not null`)
]);

export const pilotPassGrants = pgTable("pilot_pass_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  participationId: uuid("participation_id").notNull().references(() => pilotParticipations.id, { onDelete: "cascade" }),
  entitlementId: uuid("entitlement_id").notNull().references(() => organizationEntitlements.id, { onDelete: "restrict" }),
  productKey: text("product_key").notNull().default("first_shipment_pass"),
  priceHypothesisMinor: integer("price_hypothesis_minor").notNull().default(750000),
  currency: text("currency").notNull().default("BDT"),
  laneLimit: integer("lane_limit").notNull().default(1),
  editorLimit: integer("editor_limit").notNull().default(3),
  launchCreditBps: integer("launch_credit_bps").notNull().default(10000),
  status: pilotPassStatus("status").notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  extensionCount: integer("extension_count").notNull().default(0),
  grantedBy: text("granted_by").notNull(),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  conversionReference: text("conversion_reference"),
  ...timestamps
}, (table) => [
  uniqueIndex("pilot_pass_grants_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("pilot_pass_grants_entitlement_unique").on(table.entitlementId),
  index("pilot_pass_grants_org_status_expiry_idx").on(table.organizationId, table.status, table.expiresAt),
  check("pilot_pass_grants_product_check", sql`${table.productKey} = 'first_shipment_pass'`),
  check("pilot_pass_grants_price_check", sql`${table.priceHypothesisMinor} = 750000 and ${table.currency} = 'BDT'`),
  check("pilot_pass_grants_limits_check", sql`${table.laneLimit} = 1 and ${table.editorLimit} = 3 and ${table.launchCreditBps} = 10000`),
  check("pilot_pass_grants_window_check", sql`${table.expiresAt} > ${table.startsAt}`),
  check("pilot_pass_grants_extension_check", sql`${table.extensionCount} between 0 and 10`),
  check("pilot_pass_grants_conversion_check", sql`(${table.status} = 'converted') = (${table.convertedAt} is not null and ${table.conversionReference} is not null)`)
]);

/** Pilot entitlements are organization records, but only explicitly assigned
 * editors receive the Launch authorization ceiling. This keeps the advertised
 * three-editor limit enforceable without treating identity-provider membership
 * as a billing decision. */
export const pilotPassEditors = pgTable("pilot_pass_editors", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  pilotPassGrantId: uuid("pilot_pass_grant_id").notNull().references(() => pilotPassGrants.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull(),
  assignedBy: text("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true })
}, (table) => [
  uniqueIndex("pilot_pass_editors_grant_actor_unique").on(table.pilotPassGrantId, table.actorId),
  index("pilot_pass_editors_org_actor_idx").on(table.organizationId, table.actorId),
  check("pilot_pass_editors_actor_check", sql`length(btrim(${table.actorId})) > 0`)
]);

export const pilotSupportCases = pgTable("pilot_support_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  participationId: uuid("participation_id").notNull().references(() => pilotParticipations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  scope: text("scope").notNull(),
  responsibility: responsibility("responsibility").notNull(),
  ownerActorId: text("owner_actor_id").notNull(),
  slaResponseMinutes: integer("sla_response_minutes").notNull(),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }).notNull(),
  resolutionDueAt: timestamp("resolution_due_at", { withTimezone: true }),
  status: pilotSupportStatus("status").notNull().default("open"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("pilot_support_cases_org_id_unique").on(table.organizationId, table.id),
  index("pilot_support_cases_org_status_due_idx").on(table.organizationId, table.status, table.responseDueAt),
  check("pilot_support_cases_sla_check", sql`${table.slaResponseMinutes} between 15 and 10080`),
  check("pilot_support_cases_version_check", sql`${table.version} >= 1`),
  check("pilot_support_cases_resolution_check", sql`${table.status} not in ('resolved', 'closed') or ${table.resolvedAt} is not null`)
]);

export const pilotWorkLogs = pgTable("pilot_work_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  supportCaseId: uuid("support_case_id").notNull().references(() => pilotSupportCases.id, { onDelete: "cascade" }),
  supportMinutes: integer("support_minutes").notNull(),
  specialistCostMinor: integer("specialist_cost_minor").notNull().default(0),
  currency: text("currency").notNull().default("BDT"),
  automationUnits: integer("automation_units").notNull().default(0),
  correctionCount: integer("correction_count").notNull().default(0),
  outcomeCode: text("outcome_code").notNull(),
  recordedBy: text("recorded_by").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("pilot_work_logs_org_case_time_idx").on(table.organizationId, table.supportCaseId, table.occurredAt),
  check("pilot_work_logs_minutes_check", sql`${table.supportMinutes} between 1 and 1440`),
  check("pilot_work_logs_cost_check", sql`${table.specialistCostMinor} >= 0 and ${table.currency} = 'BDT'`),
  check("pilot_work_logs_usage_check", sql`${table.automationUnits} >= 0 and ${table.correctionCount} >= 0`)
]);

export const pilotObservations = pgTable("pilot_observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  participationId: uuid("participation_id").notNull().references(() => pilotParticipations.id, { onDelete: "cascade" }),
  observationType: text("observation_type").notNull(),
  summary: text("summary").notNull(),
  workaround: text("workaround"),
  replacedBurden: text("replaced_burden").notNull().default("none"),
  trustScore: integer("trust_score"),
  willingnessToPayMinor: integer("willingness_to_pay_minor"),
  currency: text("currency").notNull().default("BDT"),
  observedBy: text("observed_by").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("pilot_observations_org_participation_time_idx").on(table.organizationId, table.participationId, table.observedAt),
  check("pilot_observations_type_check", sql`${table.observationType} in ('customer_observation', 'workaround', 'pricing', 'trust', 'burden_replacement', 'outcome')`),
  check("pilot_observations_burden_check", sql`${table.replacedBurden} in ('none', 'spreadsheet', 'email', 'whatsapp', 'multiple')`),
  check("pilot_observations_trust_check", sql`${table.trustScore} is null or ${table.trustScore} between 1 and 5`),
  check("pilot_observations_wtp_check", sql`${table.willingnessToPayMinor} is null or (${table.willingnessToPayMinor} >= 0 and ${table.currency} = 'BDT')`)
]);

export const pilotMetricEvents = pgTable("pilot_metric_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  participationId: uuid("participation_id").references(() => pilotParticipations.id, { onDelete: "set null" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "set null" }),
  eventName: pilotMetricEventName("event_name").notNull(),
  actorHashSha256: text("actor_hash_sha256").notNull(),
  durationSeconds: integer("duration_seconds"),
  quantity: integer("quantity"),
  success: boolean("success"),
  fieldType: text("field_type"),
  outcomeCode: text("outcome_code"),
  dedupeKey: text("dedupe_key").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("pilot_metric_events_org_dedupe_unique").on(table.organizationId, table.dedupeKey),
  index("pilot_metric_events_org_name_time_idx").on(table.organizationId, table.eventName, table.occurredAt),
  check("pilot_metric_events_actor_hash_check", sql`${table.actorHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("pilot_metric_events_duration_check", sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`),
  check("pilot_metric_events_quantity_check", sql`${table.quantity} is null or ${table.quantity} >= 0`)
]);

/** Tenant-owned commercial records. No buyer may be represented as verified
 * without both a bounded evidence level and a dated review. */
export const buyerAccounts = pgTable("buyer_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name"),
  countryCode: text("country_code").notNull(),
  websiteUrl: text("website_url"),
  verificationStatus: buyerVerificationStatus("verification_status").notNull().default("unverified"),
  verificationEvidenceLevel: text("verification_evidence_level"),
  verificationSourceRef: text("verification_source_ref"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
  riskStatus: buyerRiskStatus("risk_status").notNull().default("not_assessed"),
  riskRationale: text("risk_rationale"),
  correctionRequestedAt: timestamp("correction_requested_at", { withTimezone: true }),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex("buyer_accounts_org_id_unique").on(table.organizationId, table.id),
  index("buyer_accounts_org_name_idx").on(table.organizationId, table.legalName),
  index("buyer_accounts_org_status_idx").on(table.organizationId, table.verificationStatus, table.riskStatus),
  check("buyer_accounts_country_check", sql`${table.countryCode} ~ '^[A-Z]{2}$'`),
  check("buyer_accounts_version_check", sql`${table.version} >= 1`),
  check("buyer_accounts_verification_evidence_check", sql`${table.verificationStatus} in ('unverified', 'rejected') or num_nonnulls(${table.verificationEvidenceLevel}, ${table.verificationSourceRef}, ${table.verifiedAt}, ${table.verifiedBy}) = 4`),
  check("buyer_accounts_risk_rationale_check", sql`${table.riskStatus} = 'not_assessed' or ${table.riskRationale} is not null`)
]);

export const buyerContacts = pgTable("buyer_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  roleTitle: text("role_title"),
  emailAddress: text("email_address"),
  phoneNumber: text("phone_number"),
  preferredChannel: text("preferred_channel"),
  correctionRequestedAt: timestamp("correction_requested_at", { withTimezone: true }),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("buyer_contacts_org_id_unique").on(table.organizationId, table.id),
  index("buyer_contacts_org_buyer_idx").on(table.organizationId, table.buyerAccountId),
  check("buyer_contacts_channel_check", sql`${table.preferredChannel} is null or ${table.preferredChannel} in ('email', 'phone', 'whatsapp', 'other')`),
  check("buyer_contacts_reachability_check", sql`num_nonnulls(${table.emailAddress}, ${table.phoneNumber}) >= 1`)
]);

/** Append-only field-level provenance and correction record. `rights_basis`
 * records why the organization may hold/use the source; scraped/resold data
 * without documented rights cannot satisfy the database constraint. */
export const buyerProvenanceRecords = pgTable("buyer_provenance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "cascade" }),
  buyerContactId: uuid("buyer_contact_id").references(() => buyerContacts.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  sourceType: text("source_type").notNull(),
  sourceReference: text("source_reference").notNull(),
  rightsBasis: text("rights_basis").notNull(),
  valueHashSha256: text("value_hash_sha256").notNull(),
  capturedBy: text("captured_by").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
  correctionReason: text("correction_reason"),
  supersedesId: uuid("supersedes_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("buyer_provenance_org_id_unique").on(table.organizationId, table.id),
  index("buyer_provenance_org_buyer_field_idx").on(table.organizationId, table.buyerAccountId, table.fieldKey),
  check("buyer_provenance_source_type_check", sql`${table.sourceType} in ('customer_supplied', 'buyer_supplied', 'official_registry', 'licensed_provider', 'public_business_site', 'correction')`),
  check("buyer_provenance_rights_check", sql`char_length(btrim(${table.rightsBasis})) > 0 and lower(${table.rightsBasis}) <> 'unknown'`),
  check("buyer_provenance_hash_check", sql`${table.valueHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("buyer_provenance_correction_check", sql`(${table.sourceType} = 'correction') = (${table.correctionReason} is not null and ${table.supersedesId} is not null)`)
]);

export const buyerOutreachConsents = pgTable("buyer_outreach_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "cascade" }),
  buyerContactId: uuid("buyer_contact_id").references(() => buyerContacts.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  state: outreachConsentState("state").notNull().default("unknown"),
  lawfulBasis: text("lawful_basis"),
  evidenceReference: text("evidence_reference"),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("buyer_outreach_org_buyer_channel_idx").on(table.organizationId, table.buyerAccountId, table.channel, table.effectiveAt),
  check("buyer_outreach_channel_check", sql`${table.channel} in ('email', 'phone', 'whatsapp', 'other')`),
  check("buyer_outreach_permission_evidence_check", sql`${table.state} <> 'permitted' or num_nonnulls(${table.lawfulBasis}, ${table.evidenceReference}) = 2`)
]);

export const buyerCommunicationAudit = pgTable("buyer_communication_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "cascade" }),
  buyerContactId: uuid("buyer_contact_id").references(() => buyerContacts.id, { onDelete: "set null" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "set null" }),
  direction: text("direction").notNull(),
  channel: text("channel").notNull(),
  purpose: text("purpose").notNull(),
  consentRecordId: uuid("consent_record_id").references(() => buyerOutreachConsents.id, { onDelete: "restrict" }),
  externalReference: text("external_reference"),
  outcomeCode: text("outcome_code").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("buyer_communication_org_buyer_time_idx").on(table.organizationId, table.buyerAccountId, table.occurredAt),
  check("buyer_communication_direction_check", sql`${table.direction} in ('inbound', 'outbound')`),
  check("buyer_communication_consent_check", sql`${table.direction} = 'inbound' or ${table.consentRecordId} is not null`)
]);

export const salesOpportunities = pgTable("sales_opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "restrict" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: salesOpportunityStatus("status").notNull().default("identified"),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  expectedValueMinor: integer("expected_value_minor"),
  currency: text("currency"),
  expectedCloseAt: timestamp("expected_close_at", { withTimezone: true }),
  lossReason: text("loss_reason"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("sales_opportunities_org_id_unique").on(table.organizationId, table.id),
  index("sales_opportunities_org_status_idx").on(table.organizationId, table.status, table.expectedCloseAt),
  check("sales_opportunities_money_check", sql`${table.expectedValueMinor} is null or (${table.expectedValueMinor} >= 0 and char_length(${table.currency}) = 3)`),
  check("sales_opportunities_loss_check", sql`${table.status} <> 'lost' or ${table.lossReason} is not null`),
  check("sales_opportunities_version_check", sql`${table.version} >= 1`)
]);

export const buyerRfqs = pgTable("buyer_rfqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id").notNull().references(() => salesOpportunities.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  buyerReference: text("buyer_reference"),
  status: buyerRfqStatus("status").notNull().default("draft"),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }),
  requestedCurrency: text("requested_currency").notNull(),
  requestedIncoterm: exportLaneIncoterm("requested_incoterm"),
  deliveryCountryCode: text("delivery_country_code").notNull(),
  notes: text("notes"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("buyer_rfqs_org_id_unique").on(table.organizationId, table.id),
  index("buyer_rfqs_org_status_due_idx").on(table.organizationId, table.status, table.responseDueAt),
  check("buyer_rfqs_currency_check", sql`char_length(${table.requestedCurrency}) = 3`),
  check("buyer_rfqs_country_check", sql`${table.deliveryCountryCode} ~ '^[A-Z]{2}$'`),
  check("buyer_rfqs_received_check", sql`${table.status} = 'draft' or ${table.receivedAt} is not null`),
  check("buyer_rfqs_version_check", sql`${table.version} >= 1`)
]);

export const buyerRfqLines = pgTable("buyer_rfq_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").notNull().references(() => buyerRfqs.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  buyerSku: text("buyer_sku"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  targetUnitPriceMinor: integer("target_unit_price_minor"),
  targetCurrency: text("target_currency"),
  requiredAt: timestamp("required_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("buyer_rfq_lines_org_id_unique").on(table.organizationId, table.id),
  index("buyer_rfq_lines_org_rfq_idx").on(table.organizationId, table.rfqId),
  check("buyer_rfq_lines_quantity_check", sql`${table.quantity} > 0`),
  check("buyer_rfq_lines_price_check", sql`${table.targetUnitPriceMinor} is null or (${table.targetUnitPriceMinor} >= 0 and char_length(${table.targetCurrency}) = 3)`)
]);

export const buyerRfqRequirements = pgTable("buyer_rfq_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").notNull().references(() => buyerRfqs.id, { onDelete: "cascade" }),
  rfqLineId: uuid("rfq_line_id").references(() => buyerRfqLines.id, { onDelete: "cascade" }),
  requirementType: text("requirement_type").notNull(),
  description: text("description").notNull(),
  mandatory: boolean("mandatory").notNull().default(true),
  status: text("status").notNull().default("open"),
  response: text("response"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("buyer_rfq_requirements_org_rfq_idx").on(table.organizationId, table.rfqId),
  check("buyer_rfq_requirements_status_check", sql`${table.status} in ('open', 'met', 'not_met', 'not_applicable')`),
  check("buyer_rfq_requirements_review_check", sql`${table.status} = 'open' or num_nonnulls(${table.reviewedBy}, ${table.reviewedAt}) = 2`)
]);

export const buyerRfqAttachments = pgTable("buyer_rfq_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").notNull().references(() => buyerRfqs.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  purpose: text("purpose").notNull(),
  attachedBy: text("attached_by").notNull(),
  attachedAt: timestamp("attached_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("buyer_rfq_attachments_unique").on(table.rfqId, table.documentVersionId),
  index("buyer_rfq_attachments_org_rfq_idx").on(table.organizationId, table.rfqId)
]);

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  rfqId: uuid("rfq_id").notNull().references(() => buyerRfqs.id, { onDelete: "restrict" }),
  opportunityId: uuid("opportunity_id").notNull().references(() => salesOpportunities.id, { onDelete: "restrict" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  status: quotationStatus("status").notNull().default("draft"),
  currentVersion: integer("current_version").notNull().default(0),
  approvedVersion: integer("approved_version"),
  acceptedVersion: integer("accepted_version"),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("quotations_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("quotations_org_rfq_unique").on(table.organizationId, table.rfqId),
  index("quotations_org_status_idx").on(table.organizationId, table.status, table.updatedAt),
  check("quotations_current_version_check", sql`${table.currentVersion} >= 0 and ${table.version} >= 1`),
  check("quotations_approval_version_check", sql`${table.approvedVersion} is null or ${table.approvedVersion} between 1 and ${table.currentVersion}`),
  check("quotations_acceptance_version_check", sql`${table.acceptedVersion} is null or (${table.approvedVersion} = ${table.acceptedVersion} and ${table.acceptedVersion} = ${table.currentVersion})`)
]);

/** Immutable snapshot. All commercial amounts are minor-unit integers. */
export const quotationVersions = pgTable("quotation_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  currency: text("currency").notNull(),
  incoterm: exportLaneIncoterm("incoterm").notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  assumptions: text("assumptions").array().notNull().default([]),
  freightMinor: integer("freight_minor").notNull().default(0),
  testingMinor: integer("testing_minor").notNull().default(0),
  financeMinor: integer("finance_minor").notNull().default(0),
  commissionMinor: integer("commission_minor").notNull().default(0),
  fxBufferMinor: integer("fx_buffer_minor").notNull().default(0),
  subtotalMinor: integer("subtotal_minor").notNull(),
  totalMinor: integer("total_minor").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  deliveryTerms: text("delivery_terms").notNull(),
  approvalPolicyVersion: text("approval_policy_version").notNull(),
  contentHashSha256: text("content_hash_sha256").notNull(),
  generatedOutputRef: text("generated_output_ref"),
  generatedOutputHashSha256: text("generated_output_hash_sha256"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("quotation_versions_quotation_version_unique").on(table.quotationId, table.version),
  uniqueIndex("quotation_versions_org_id_unique").on(table.organizationId, table.id),
  index("quotation_versions_org_quotation_idx").on(table.organizationId, table.quotationId, table.version),
  check("quotation_versions_version_check", sql`${table.version} >= 1`),
  check("quotation_versions_currency_check", sql`char_length(${table.currency}) = 3`),
  check("quotation_versions_money_check", sql`${table.freightMinor} >= 0 and ${table.testingMinor} >= 0 and ${table.financeMinor} >= 0 and ${table.commissionMinor} >= 0 and ${table.fxBufferMinor} >= 0 and ${table.subtotalMinor} >= 0 and ${table.totalMinor} = ${table.subtotalMinor} + ${table.freightMinor} + ${table.testingMinor} + ${table.financeMinor} + ${table.commissionMinor} + ${table.fxBufferMinor}`),
  check("quotation_versions_hash_check", sql`${table.contentHashSha256} ~ '^[a-f0-9]{64}$' and (${table.generatedOutputHashSha256} is null or ${table.generatedOutputHashSha256} ~ '^[a-f0-9]{64}$')`),
  check("quotation_versions_output_check", sql`num_nonnulls(${table.generatedOutputRef}, ${table.generatedOutputHashSha256}) in (0, 2)`)
]);

export const quotationLines = pgTable("quotation_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  quotationVersionId: uuid("quotation_version_id").notNull().references(() => quotationVersions.id, { onDelete: "cascade" }),
  rfqLineId: uuid("rfq_line_id").references(() => buyerRfqLines.id, { onDelete: "restrict" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  unitPriceMinor: integer("unit_price_minor").notNull(),
  lineTotalMinor: integer("line_total_minor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("quotation_lines_org_version_idx").on(table.organizationId, table.quotationVersionId),
  check("quotation_lines_math_check", sql`${table.quantity} > 0 and ${table.unitPriceMinor} >= 0 and ${table.lineTotalMinor} = ${table.quantity} * ${table.unitPriceMinor}`)
]);

export const quotationApprovals = pgTable("quotation_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  quotationVersionId: uuid("quotation_version_id").notNull().references(() => quotationVersions.id, { onDelete: "restrict" }),
  decision: approvalDecision("decision").notNull(),
  signatoryActorId: text("signatory_actor_id").notNull(),
  signatoryRole: text("signatory_role").notNull(),
  policyVersion: text("policy_version").notNull(),
  rationale: text("rationale").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("quotation_approvals_version_signatory_unique").on(table.quotationVersionId, table.signatoryActorId),
  index("quotation_approvals_org_quote_idx").on(table.organizationId, table.quotationId, table.decidedAt)
]);

export const quotationDeliveries = pgTable("quotation_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  quotationVersionId: uuid("quotation_version_id").notNull().references(() => quotationVersions.id, { onDelete: "restrict" }),
  approvalId: uuid("approval_id").notNull().references(() => quotationApprovals.id, { onDelete: "restrict" }),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  status: externalDeliveryStatus("status").notNull().default("pending"),
  providerReference: text("provider_reference"),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("quotation_deliveries_org_idempotency_unique").on(table.organizationId, table.idempotencyKey),
  index("quotation_deliveries_org_status_idx").on(table.organizationId, table.status, table.createdAt),
  check("quotation_deliveries_attempts_check", sql`${table.attempts} >= 0`),
  check("quotation_deliveries_delivered_check", sql`${table.status} <> 'delivered' or ${table.deliveredAt} is not null`)
]);

export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "restrict" }),
  opportunityId: uuid("opportunity_id").notNull().references(() => salesOpportunities.id, { onDelete: "restrict" }),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "restrict" }),
  acceptedQuotationVersionId: uuid("accepted_quotation_version_id").notNull().references(() => quotationVersions.id, { onDelete: "restrict" }),
  orderNumber: text("order_number").notNull(),
  status: salesOrderStatus("status").notNull().default("draft"),
  currentVersion: integer("current_version").notNull().default(1),
  confirmedBy: text("confirmed_by").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("sales_orders_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("sales_orders_org_number_unique").on(table.organizationId, table.orderNumber),
  uniqueIndex("sales_orders_quote_unique").on(table.organizationId, table.quotationId),
  index("sales_orders_org_status_idx").on(table.organizationId, table.status, table.updatedAt),
  check("sales_orders_version_check", sql`${table.currentVersion} >= 1`)
]);

/** Immutable initial order and change-order versions. */
export const salesOrderVersions = pgTable("sales_order_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  changeType: text("change_type").notNull(),
  reason: text("reason").notNull(),
  currency: text("currency").notNull(),
  incoterm: exportLaneIncoterm("incoterm").notNull(),
  totalMinor: integer("total_minor").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  contentHashSha256: text("content_hash_sha256").notNull(),
  confirmedBy: text("confirmed_by").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("sales_order_versions_order_version_unique").on(table.salesOrderId, table.version),
  uniqueIndex("sales_order_versions_org_id_unique").on(table.organizationId, table.id),
  check("sales_order_versions_version_check", sql`${table.version} >= 1`),
  check("sales_order_versions_change_check", sql`${table.changeType} in ('initial', 'change_order') and (${table.version} = 1) = (${table.changeType} = 'initial')`),
  check("sales_order_versions_money_check", sql`char_length(${table.currency}) = 3 and ${table.totalMinor} >= 0`),
  check("sales_order_versions_hash_check", sql`${table.contentHashSha256} ~ '^[a-f0-9]{64}$'`)
]);

export const generatedDocumentSets = pgTable("generated_document_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  salesOrderVersionId: uuid("sales_order_version_id").notNull().references(() => salesOrderVersions.id, { onDelete: "restrict" }),
  version: integer("version").notNull(),
  status: generatedDocumentStatus("status").notNull().default("draft"),
  generationPolicyVersion: text("generation_policy_version").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("generated_document_sets_order_version_unique").on(table.salesOrderId, table.version),
  uniqueIndex("generated_document_sets_org_id_unique").on(table.organizationId, table.id),
  index("generated_document_sets_org_lane_idx").on(table.organizationId, table.exportLaneId, table.status),
  check("generated_document_sets_version_check", sql`${table.version} >= 1`),
  check("generated_document_sets_approval_check", sql`${table.status} <> 'approved' or num_nonnulls(${table.approvedBy}, ${table.approvedAt}) = 2`)
]);

export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentSetId: uuid("document_set_id").notNull().references(() => generatedDocumentSets.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  status: generatedDocumentStatus("status").notNull().default("draft"),
  outputStorageRef: text("output_storage_ref"),
  outputHashSha256: text("output_hash_sha256"),
  renderedAt: timestamp("rendered_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("generated_documents_set_type_unique").on(table.documentSetId, table.documentType),
  uniqueIndex("generated_documents_org_id_unique").on(table.organizationId, table.id),
  check("generated_documents_type_check", sql`${table.documentType} in ('pro_forma_invoice', 'commercial_invoice', 'packing_list', 'shipping_instruction', 'certificate_origin_checklist', 'exp_ad_bank_checklist', 'market_evidence_pack')`),
  check("generated_documents_output_check", sql`num_nonnulls(${table.outputStorageRef}, ${table.outputHashSha256}, ${table.renderedAt}) in (0, 3)`),
  check("generated_documents_hash_check", sql`${table.outputHashSha256} is null or ${table.outputHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("generated_documents_review_check", sql`${table.status} <> 'approved' or num_nonnulls(${table.reviewedBy}, ${table.reviewedAt}) = 2`)
]);

/** Every rendered field points to an approved source record and value hash. */
export const generatedDocumentFields = pgTable("generated_document_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  generatedDocumentId: uuid("generated_document_id").notNull().references(() => generatedDocuments.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  normalizedValue: text("normalized_value").notNull(),
  displayValue: text("display_value").notNull(),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: text("source_entity_id").notNull(),
  sourceField: text("source_field").notNull(),
  approvedValueHashSha256: text("approved_value_hash_sha256").notNull(),
  sourceApprovedBy: text("source_approved_by").notNull(),
  sourceApprovedAt: timestamp("source_approved_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("generated_document_fields_document_key_unique").on(table.generatedDocumentId, table.fieldKey),
  index("generated_document_fields_org_key_idx").on(table.organizationId, table.fieldKey),
  check("generated_document_fields_hash_check", sql`${table.approvedValueHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("generated_document_fields_source_check", sql`char_length(btrim(${table.sourceEntityType})) > 0 and char_length(btrim(${table.sourceEntityId})) > 0 and char_length(btrim(${table.sourceField})) > 0`)
]);

export const documentConsistencyIssues = pgTable("document_consistency_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentSetId: uuid("document_set_id").notNull().references(() => generatedDocumentSets.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  severity: text("severity").notNull().default("blocking"),
  mismatchSnapshot: jsonb("mismatch_snapshot").$type<readonly Record<string, unknown>[]>().notNull(),
  status: consistencyIssueStatus("status").notNull().default("open"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolution: text("resolution"),
  ...timestamps
}, (table) => [
  uniqueIndex("document_consistency_open_unique").on(table.documentSetId, table.fieldKey).where(sql`${table.status} = 'open'`),
  index("document_consistency_org_status_idx").on(table.organizationId, table.status, table.detectedAt),
  check("document_consistency_severity_check", sql`${table.severity} = 'blocking'`),
  check("document_consistency_resolution_check", sql`${table.status} = 'open' or num_nonnulls(${table.resolvedBy}, ${table.resolvedAt}, ${table.resolution}) = 3`)
]);

/** Mailbox classification/mapping remains separate from provider metadata so
 * disconnect and deletion can be proved without losing commercial audit. */
export const emailThreadMappings = pgTable("email_thread_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailThreadId: uuid("email_thread_id").notNull().references(() => emailThreads.id, { onDelete: "cascade" }),
  classification: text("classification").notNull(),
  buyerAccountId: uuid("buyer_account_id").references(() => buyerAccounts.id, { onDelete: "set null" }),
  opportunityId: uuid("opportunity_id").references(() => salesOpportunities.id, { onDelete: "set null" }),
  rfqId: uuid("rfq_id").references(() => buyerRfqs.id, { onDelete: "set null" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "set null" }),
  confidenceBps: integer("confidence_bps").notNull(),
  methodVersion: text("method_version").notNull(),
  humanConfirmedBy: text("human_confirmed_by"),
  humanConfirmedAt: timestamp("human_confirmed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("email_thread_mappings_thread_unique").on(table.emailThreadId),
  index("email_thread_mappings_org_class_idx").on(table.organizationId, table.classification),
  check("email_thread_mappings_class_check", sql`${table.classification} in ('rfq', 'buyer_reply', 'order', 'shipment', 'payment', 'other')`),
  check("email_thread_mappings_confidence_check", sql`${table.confidenceBps} between 0 and 10000`),
  check("email_thread_mappings_confirmation_check", sql`num_nonnulls(${table.humanConfirmedBy}, ${table.humanConfirmedAt}) in (0, 2)`)
]);

export const outboundEmailDrafts = pgTable("outbound_email_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailConnectionId: uuid("email_connection_id").notNull().references(() => emailConnections.id, { onDelete: "restrict" }),
  emailThreadId: uuid("email_thread_id").references(() => emailThreads.id, { onDelete: "set null" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "restrict" }),
  opportunityId: uuid("opportunity_id").references(() => salesOpportunities.id, { onDelete: "set null" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "set null" }),
  toAddresses: text("to_addresses").array().notNull(),
  ccAddresses: text("cc_addresses").array().notNull().default([]),
  subject: text("subject").notNull(),
  bodyStorageRef: text("body_storage_ref").notNull(),
  bodyHashSha256: text("body_hash_sha256").notNull(),
  status: outboundDraftStatus("status").notNull().default("draft"),
  nextTaskId: uuid("next_task_id").references(() => tasks.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("outbound_email_drafts_org_id_unique").on(table.organizationId, table.id),
  index("outbound_email_drafts_org_status_idx").on(table.organizationId, table.status, table.updatedAt),
  check("outbound_email_drafts_recipient_check", sql`cardinality(${table.toAddresses}) >= 1`),
  check("outbound_email_drafts_hash_check", sql`${table.bodyHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("outbound_email_drafts_version_check", sql`${table.version} >= 1`)
]);

export const outboundEmailApprovals = pgTable("outbound_email_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  draftId: uuid("draft_id").notNull().references(() => outboundEmailDrafts.id, { onDelete: "cascade" }),
  draftVersion: integer("draft_version").notNull(),
  bodyHashSha256: text("body_hash_sha256").notNull(),
  decision: approvalDecision("decision").notNull(),
  decidedBy: text("decided_by").notNull(),
  rationale: text("rationale").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("outbound_email_approvals_draft_version_unique").on(table.draftId, table.draftVersion),
  check("outbound_email_approvals_version_check", sql`${table.draftVersion} >= 1`),
  check("outbound_email_approvals_hash_check", sql`${table.bodyHashSha256} ~ '^[a-f0-9]{64}$'`)
]);

export const outboundEmailDeliveries = pgTable("outbound_email_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  draftId: uuid("draft_id").notNull().references(() => outboundEmailDrafts.id, { onDelete: "cascade" }),
  approvalId: uuid("approval_id").notNull().references(() => outboundEmailApprovals.id, { onDelete: "restrict" }),
  idempotencyKey: text("idempotency_key").notNull(),
  status: externalDeliveryStatus("status").notNull().default("pending"),
  providerMessageId: text("provider_message_id"),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  failureCode: text("failure_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("outbound_email_deliveries_org_key_unique").on(table.organizationId, table.idempotencyKey),
  index("outbound_email_deliveries_org_status_idx").on(table.organizationId, table.status, table.createdAt),
  check("outbound_email_deliveries_attempts_check", sql`${table.attempts} >= 0`),
  check("outbound_email_deliveries_delivered_check", sql`${table.status} <> 'delivered' or ${table.deliveredAt} is not null`)
]);

export const emailConnectionDeletionRequests = pgTable("email_connection_deletion_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  emailConnectionId: uuid("email_connection_id").notNull().references(() => emailConnections.id, { onDelete: "restrict" }),
  requestedBy: text("requested_by").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  disconnectedAt: timestamp("disconnected_at", { withTimezone: true }),
  providerDeletionConfirmedAt: timestamp("provider_deletion_confirmed_at", { withTimezone: true }),
  localDeletionConfirmedAt: timestamp("local_deletion_confirmed_at", { withTimezone: true }),
  confirmationReference: text("confirmation_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("email_connection_deletion_connection_unique").on(table.emailConnectionId),
  index("email_connection_deletion_org_requested_idx").on(table.organizationId, table.requestedAt),
  check("email_connection_deletion_complete_check", sql`num_nonnulls(${table.providerDeletionConfirmedAt}, ${table.localDeletionConfirmedAt}, ${table.confirmationReference}) in (0, 3)`)
]);

export const productionBatches = pgTable("production_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  batchReference: text("batch_reference").notNull(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  facilityId: uuid("facility_id").references(() => facilities.id, { onDelete: "set null" }),
  plannedQuantity: integer("planned_quantity").notNull(),
  completedQuantity: integer("completed_quantity").notNull().default(0),
  capacityReserved: integer("capacity_reserved").notNull(),
  status: productionBatchStatus("status").notNull().default("planned"),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  plannedStartAt: timestamp("planned_start_at", { withTimezone: true }).notNull(),
  plannedReleaseAt: timestamp("planned_release_at", { withTimezone: true }).notNull(),
  actualStartAt: timestamp("actual_start_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  releasedBy: text("released_by"),
  version: integer("version").notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex("production_batches_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("production_batches_org_ref_unique").on(table.organizationId, table.batchReference),
  index("production_batches_org_status_release_idx").on(table.organizationId, table.status, table.plannedReleaseAt),
  check("production_batches_quantity_check", sql`${table.plannedQuantity} > 0 and ${table.completedQuantity} between 0 and ${table.plannedQuantity} and ${table.capacityReserved} >= ${table.plannedQuantity}`),
  check("production_batches_window_check", sql`${table.plannedReleaseAt} > ${table.plannedStartAt}`),
  check("production_batches_release_check", sql`${table.status} <> 'released' or num_nonnulls(${table.releasedAt}, ${table.releasedBy}) = 2`),
  check("production_batches_version_check", sql`${table.version} >= 1`)
]);

export const productionMilestones = pgTable("production_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productionBatchId: uuid("production_batch_id").notNull().references(() => productionBatches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sequence: integer("sequence").notNull(),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  plannedAt: timestamp("planned_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedBy: text("completed_by"),
  notes: text("notes"),
  ...timestamps
}, (table) => [
  uniqueIndex("production_milestones_batch_sequence_unique").on(table.productionBatchId, table.sequence),
  index("production_milestones_org_plan_idx").on(table.organizationId, table.plannedAt),
  check("production_milestones_sequence_check", sql`${table.sequence} >= 1`),
  check("production_milestones_completion_check", sql`num_nonnulls(${table.completedAt}, ${table.completedBy}) in (0, 2)`)
]);

export const productionInspections = pgTable("production_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productionBatchId: uuid("production_batch_id").notNull().references(() => productionBatches.id, { onDelete: "cascade" }),
  inspectionType: text("inspection_type").notNull(),
  inspectorReference: text("inspector_reference").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  result: text("result").notNull().default("pending"),
  evidenceDocumentVersionId: uuid("evidence_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("production_inspections_org_batch_idx").on(table.organizationId, table.productionBatchId, table.scheduledAt),
  check("production_inspections_result_check", sql`${table.result} in ('pending', 'passed', 'conditional', 'failed')`),
  check("production_inspections_result_evidence_check", sql`${table.result} = 'pending' or num_nonnulls(${table.completedAt}, ${table.evidenceDocumentVersionId}, ${table.reviewedBy}, ${table.reviewedAt}) = 4`)
]);

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "restrict" }),
  shipmentReference: text("shipment_reference").notNull(),
  bookingReference: text("booking_reference"),
  carrierReference: text("carrier_reference"),
  forwarderReference: text("forwarder_reference"),
  status: shipmentStatus("status").notNull().default("planning"),
  mode: text("mode").notNull(),
  originLocation: text("origin_location").notNull(),
  destinationLocation: text("destination_location").notNull(),
  plannedDepartureAt: timestamp("planned_departure_at", { withTimezone: true }).notNull(),
  plannedArrivalAt: timestamp("planned_arrival_at", { withTimezone: true }).notNull(),
  actualDepartureAt: timestamp("actual_departure_at", { withTimezone: true }),
  actualArrivalAt: timestamp("actual_arrival_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex("shipments_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("shipments_org_ref_unique").on(table.organizationId, table.shipmentReference),
  index("shipments_org_status_departure_idx").on(table.organizationId, table.status, table.plannedDepartureAt),
  check("shipments_mode_check", sql`${table.mode} in ('sea', 'air', 'road', 'rail', 'multimodal', 'courier')`),
  check("shipments_plan_window_check", sql`${table.plannedArrivalAt} > ${table.plannedDepartureAt}`),
  check("shipments_booked_check", sql`${table.status} = 'planning' or ${table.bookingReference} is not null`),
  check("shipments_delivery_check", sql`${table.status} <> 'delivered' or ${table.deliveredAt} is not null`),
  check("shipments_version_check", sql`${table.version} >= 1`)
]);

export const shipmentPackages = pgTable("shipment_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipment_id").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  packageReference: text("package_reference").notNull(),
  packageType: text("package_type").notNull(),
  itemCount: integer("item_count").notNull(),
  netWeightGrams: integer("net_weight_grams").notNull(),
  grossWeightGrams: integer("gross_weight_grams").notNull(),
  lengthMm: integer("length_mm"),
  widthMm: integer("width_mm"),
  heightMm: integer("height_mm"),
  marksAndNumbers: text("marks_and_numbers"),
  ...timestamps
}, (table) => [
  uniqueIndex("shipment_packages_shipment_ref_unique").on(table.shipmentId, table.packageReference),
  index("shipment_packages_org_shipment_idx").on(table.organizationId, table.shipmentId),
  check("shipment_packages_count_weight_check", sql`${table.itemCount} > 0 and ${table.netWeightGrams} > 0 and ${table.grossWeightGrams} >= ${table.netWeightGrams}`),
  check("shipment_packages_dimensions_check", sql`num_nonnulls(${table.lengthMm}, ${table.widthMm}, ${table.heightMm}) in (0, 3)`)
]);

export const shipmentCheckpoints = pgTable("shipment_checkpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipment_id").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  checkpointType: text("checkpoint_type").notNull(),
  location: text("location").notNull(),
  plannedAt: timestamp("planned_at", { withTimezone: true }),
  actualAt: timestamp("actual_at", { withTimezone: true }),
  source: text("source").notNull(),
  externalReference: text("external_reference"),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("shipment_checkpoints_org_shipment_time_idx").on(table.organizationId, table.shipmentId, table.actualAt),
  check("shipment_checkpoints_time_check", sql`num_nonnulls(${table.plannedAt}, ${table.actualAt}) >= 1`)
]);

export const shipmentExceptions = pgTable("shipment_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "set null" }),
  productionBatchId: uuid("production_batch_id").references(() => productionBatches.id, { onDelete: "set null" }),
  exceptionType: text("exception_type").notNull(),
  summary: text("summary").notNull(),
  status: exceptionCaseStatus("status").notNull().default("open"),
  costImpactMinor: integer("cost_impact_minor").notNull().default(0),
  currency: text("currency").notNull(),
  deadlineImpactMinutes: integer("deadline_impact_minutes").notNull().default(0),
  documentImpact: boolean("document_impact").notNull().default(false),
  buyerCommunicationRequired: boolean("buyer_communication_required").notNull().default(false),
  buyerCommunicationAuditId: uuid("buyer_communication_audit_id").references(() => buyerCommunicationAudit.id, { onDelete: "restrict" }),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  ...timestamps
}, (table) => [
  uniqueIndex("shipment_exceptions_org_id_unique").on(table.organizationId, table.id),
  index("shipment_exceptions_org_status_idx").on(table.organizationId, table.status, table.updatedAt),
  check("shipment_exceptions_link_check", sql`num_nonnulls(${table.shipmentId}, ${table.productionBatchId}) >= 1`),
  check("shipment_exceptions_impact_check", sql`${table.costImpactMinor} >= 0 and char_length(${table.currency}) = 3 and ${table.deadlineImpactMinutes} >= 0`),
  check("shipment_exceptions_communication_check", sql`not ${table.buyerCommunicationRequired} or ${table.buyerCommunicationAuditId} is not null or ${table.status} not in ('resolved', 'closed')`),
  check("shipment_exceptions_resolution_check", sql`${table.status} not in ('resolved', 'closed') or num_nonnulls(${table.resolution}, ${table.resolvedBy}, ${table.resolvedAt}) = 3`),
  check("shipment_exceptions_version_check", sql`${table.version} >= 1`)
]);

export const tradeInvoices = pgTable("trade_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "restrict" }),
  shipmentId: uuid("shipment_id").references(() => shipments.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull(),
  status: tradeInvoiceStatus("status").notNull().default("draft"),
  currency: text("currency").notNull(),
  invoiceTotalMinor: integer("invoice_total_minor").notNull(),
  allocatedMinor: integer("allocated_minor").notNull().default(0),
  paymentTerms: text("payment_terms").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  generatedDocumentId: uuid("generated_document_id").references(() => generatedDocuments.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("trade_invoices_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("trade_invoices_org_number_unique").on(table.organizationId, table.invoiceNumber),
  index("trade_invoices_org_status_due_idx").on(table.organizationId, table.status, table.dueAt),
  check("trade_invoices_money_check", sql`char_length(${table.currency}) = 3 and ${table.invoiceTotalMinor} > 0 and ${table.allocatedMinor} between 0 and ${table.invoiceTotalMinor}`),
  check("trade_invoices_issue_check", sql`${table.status} = 'draft' or ${table.issuedAt} is not null`),
  check("trade_invoices_version_check", sql`${table.version} >= 1`)
]);

export const invoicePaymentSchedules = pgTable("invoice_payment_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  tradeInvoiceId: uuid("trade_invoice_id").notNull().references(() => tradeInvoices.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  expectedAmountMinor: integer("expected_amount_minor").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  condition: text("condition").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("invoice_payment_schedules_invoice_sequence_unique").on(table.tradeInvoiceId, table.sequence),
  index("invoice_payment_schedules_org_due_idx").on(table.organizationId, table.dueAt),
  check("invoice_payment_schedules_amount_check", sql`${table.sequence} >= 1 and ${table.expectedAmountMinor} > 0`)
]);

export const paymentReceipts = pgTable("payment_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => buyerAccounts.id, { onDelete: "restrict" }),
  status: paymentReceiptStatus("status").notNull().default("reported"),
  currency: text("currency").notNull(),
  grossAmountMinor: integer("gross_amount_minor").notNull(),
  bankFeeMinor: integer("bank_fee_minor").notNull().default(0),
  otherFeeMinor: integer("other_fee_minor").notNull().default(0),
  netAmountMinor: integer("net_amount_minor").notNull(),
  fxRateNumerator: integer("fx_rate_numerator"),
  fxRateDenominator: integer("fx_rate_denominator"),
  valueDate: timestamp("value_date", { withTimezone: true }).notNull(),
  bankAdviceDocumentVersionId: uuid("bank_advice_document_version_id").references(() => documentVersions.id, { onDelete: "restrict" }),
  bankReference: text("bank_reference"),
  recordedBy: text("recorded_by").notNull(),
  confirmedBy: text("confirmed_by"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("payment_receipts_org_id_unique").on(table.organizationId, table.id),
  index("payment_receipts_org_value_date_idx").on(table.organizationId, table.valueDate),
  check("payment_receipts_money_check", sql`char_length(${table.currency}) = 3 and ${table.grossAmountMinor} > 0 and ${table.bankFeeMinor} >= 0 and ${table.otherFeeMinor} >= 0 and ${table.netAmountMinor} = ${table.grossAmountMinor} - ${table.bankFeeMinor} - ${table.otherFeeMinor} and ${table.netAmountMinor} >= 0`),
  check("payment_receipts_fx_check", sql`num_nonnulls(${table.fxRateNumerator}, ${table.fxRateDenominator}) in (0, 2) and coalesce(${table.fxRateNumerator}, 1) > 0 and coalesce(${table.fxRateDenominator}, 1) > 0`),
  check("payment_receipts_advice_check", sql`${table.status} = 'reported' or ${table.bankAdviceDocumentVersionId} is not null`),
  check("payment_receipts_confirm_check", sql`${table.status} <> 'confirmed' or num_nonnulls(${table.confirmedBy}, ${table.confirmedAt}) = 2`)
]);

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  paymentReceiptId: uuid("payment_receipt_id").notNull().references(() => paymentReceipts.id, { onDelete: "restrict" }),
  tradeInvoiceId: uuid("trade_invoice_id").notNull().references(() => tradeInvoices.id, { onDelete: "restrict" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "restrict" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  allocatedBy: text("allocated_by").notNull(),
  allocatedAt: timestamp("allocated_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("payment_allocations_receipt_invoice_unique").on(table.paymentReceiptId, table.tradeInvoiceId),
  index("payment_allocations_org_lane_idx").on(table.organizationId, table.exportLaneId),
  check("payment_allocations_amount_check", sql`${table.amountMinor} > 0`)
]);

export const financialDiscrepancies = pgTable("financial_discrepancies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  tradeInvoiceId: uuid("trade_invoice_id").references(() => tradeInvoices.id, { onDelete: "set null" }),
  paymentReceiptId: uuid("payment_receipt_id").references(() => paymentReceipts.id, { onDelete: "set null" }),
  discrepancyType: text("discrepancy_type").notNull(),
  expectedMinor: integer("expected_minor"),
  actualMinor: integer("actual_minor"),
  currency: text("currency").notNull(),
  status: exceptionCaseStatus("status").notNull().default("open"),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  index("financial_discrepancies_org_status_due_idx").on(table.organizationId, table.status, table.dueAt),
  check("financial_discrepancies_link_check", sql`num_nonnulls(${table.tradeInvoiceId}, ${table.paymentReceiptId}) >= 1`),
  check("financial_discrepancies_money_check", sql`char_length(${table.currency}) = 3 and num_nonnulls(${table.expectedMinor}, ${table.actualMinor}) >= 1`),
  check("financial_discrepancies_resolution_check", sql`${table.status} not in ('resolved', 'closed') or num_nonnulls(${table.resolution}, ${table.resolvedBy}, ${table.resolvedAt}) = 3`)
]);

export const realizedProceeds = pgTable("realized_proceeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "restrict" }),
  tradeInvoiceId: uuid("trade_invoice_id").notNull().references(() => tradeInvoices.id, { onDelete: "restrict" }),
  currency: text("currency").notNull(),
  invoicedMinor: integer("invoiced_minor").notNull(),
  receivedMinor: integer("received_minor").notNull(),
  feesMinor: integer("fees_minor").notNull(),
  realizedMinor: integer("realized_minor").notNull(),
  contributionCostMinor: integer("contribution_cost_minor").notNull(),
  actualMarginBps: integer("actual_margin_bps").notNull(),
  cycleTimeMinutes: integer("cycle_time_minutes").notNull(),
  confirmedBy: text("confirmed_by").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("realized_proceeds_invoice_unique").on(table.organizationId, table.tradeInvoiceId),
  index("realized_proceeds_org_lane_idx").on(table.organizationId, table.exportLaneId, table.confirmedAt),
  check("realized_proceeds_money_check", sql`char_length(${table.currency}) = 3 and ${table.invoicedMinor} > 0 and ${table.receivedMinor} >= 0 and ${table.feesMinor} >= 0 and ${table.realizedMinor} = ${table.receivedMinor} - ${table.feesMinor} and ${table.realizedMinor} >= 0 and ${table.contributionCostMinor} >= 0`),
  check("realized_proceeds_margin_check", sql`${table.actualMarginBps} between -100000 and 10000 and ${table.cycleTimeMinutes} >= 0`)
]);

export const laneOutcomeMetrics = pgTable("lane_outcome_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").notNull().references(() => exportLanes.id, { onDelete: "cascade" }),
  metricName: text("metric_name").notNull(),
  integerValue: integer("integer_value").notNull(),
  unit: text("unit").notNull(),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: uuid("source_entity_id").notNull(),
  measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("lane_outcome_metrics_source_metric_unique").on(table.organizationId, table.sourceEntityType, table.sourceEntityId, table.metricName),
  index("lane_outcome_metrics_org_lane_time_idx").on(table.organizationId, table.exportLaneId, table.measuredAt),
  check("lane_outcome_metrics_name_check", sql`${table.metricName} in ('actual_margin_bps', 'order_to_proceeds_minutes', 'invoiced_minor', 'realized_minor', 'exception_resolution_minutes')`)
]);

/** Preparation and tracking only. These records never claim that Export HQ
 * submitted to or automated a government/bank/forwarder portal. */
export const companionWorkflowCases = pgTable("companion_workflow_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  exportLaneId: uuid("export_lane_id").references(() => exportLanes.id, { onDelete: "cascade" }),
  workflowType: text("workflow_type").notNull(),
  authorityName: text("authority_name").notNull(),
  externalPortalUrl: text("external_portal_url").notNull(),
  status: companionWorkflowStatus("status").notNull().default("draft"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  reminderAt: timestamp("reminder_at", { withTimezone: true }),
  ownerMembershipId: uuid("owner_membership_id").notNull().references(() => organizationMemberships.id, { onDelete: "restrict" }),
  submissionReference: text("submission_reference"),
  submittedByActorId: text("submitted_by_actor_id"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("companion_workflow_cases_org_id_unique").on(table.organizationId, table.id),
  index("companion_workflow_cases_org_status_due_idx").on(table.organizationId, table.status, table.dueAt),
  check("companion_workflow_cases_type_check", sql`${table.workflowType} in ('bsw_clp_preparation', 'erc_olm_renewal', 'epb_exporter_pack', 'gsp_origin_pack', 'cash_incentive_pack', 'ad_bank_exp_proceeds', 'forwarder_handoff', 'eu_tariff_origin_evidence')`),
  check("companion_workflow_cases_submission_check", sql`${table.status} not in ('submitted', 'completed') or num_nonnulls(${table.submissionReference}, ${table.submittedByActorId}, ${table.submittedAt}) = 3`),
  check("companion_workflow_cases_completion_check", sql`${table.status} <> 'completed' or ${table.completedAt} is not null`),
  check("companion_workflow_cases_version_check", sql`${table.version} >= 1`)
]);

export const companionWorkflowItems = pgTable("companion_workflow_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  workflowCaseId: uuid("workflow_case_id").notNull().references(() => companionWorkflowCases.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sourceRuleId: uuid("source_rule_id").references(() => regulatoryRules.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("open"),
  portalMaxBytes: integer("portal_max_bytes"),
  responsibility: responsibility("responsibility").notNull(),
  completedBy: text("completed_by"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps
}, (table) => [
  uniqueIndex("companion_workflow_items_case_sequence_unique").on(table.workflowCaseId, table.sequence),
  index("companion_workflow_items_org_case_idx").on(table.organizationId, table.workflowCaseId),
  check("companion_workflow_items_sequence_check", sql`${table.sequence} >= 1`),
  check("companion_workflow_items_status_check", sql`${table.status} in ('open', 'in_progress', 'ready', 'completed', 'not_applicable', 'blocked')`),
  check("companion_workflow_items_portal_size_check", sql`${table.portalMaxBytes} is null or ${table.portalMaxBytes} between 1024 and 104857600`),
  check("companion_workflow_items_completion_check", sql`${table.status} not in ('completed', 'not_applicable') or num_nonnulls(${table.completedBy}, ${table.completedAt}) = 2`)
]);

export const companionWorkflowEvidence = pgTable("companion_workflow_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  workflowCaseId: uuid("workflow_case_id").notNull().references(() => companionWorkflowCases.id, { onDelete: "cascade" }),
  workflowItemId: uuid("workflow_item_id").references(() => companionWorkflowItems.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").notNull().references(() => documentVersions.id, { onDelete: "restrict" }),
  byteSize: integer("byte_size").notNull(),
  purpose: text("purpose").notNull(),
  submittedToPortalByCustomer: boolean("submitted_to_portal_by_customer").notNull().default(false),
  recordedBy: text("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("companion_workflow_evidence_unique").on(table.workflowCaseId, table.documentVersionId, table.purpose),
  index("companion_workflow_evidence_org_case_idx").on(table.organizationId, table.workflowCaseId),
  check("companion_workflow_evidence_size_check", sql`${table.byteSize} > 0`)
]);

/** Global, migration-published billing catalog. Customer roles can read but
 * cannot mutate it, and `self_service_enabled=false` is the R3 hard gate. */
export const billingPlanCatalogVersions = pgTable("billing_plan_catalog_versions", {
  id: uuid("id").primaryKey(),
  version: text("version").notNull().unique(),
  currency: text("currency").notNull().default("BDT"),
  status: text("status").notNull().default("draft"),
  selfServiceEnabled: boolean("self_service_enabled").notNull().default(false),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  publishedBy: text("published_by"),
  reviewReference: text("review_reference"),
  contentHashSha256: text("content_hash_sha256").notNull(),
  ...timestamps
}, (table) => [
  check("billing_plan_catalog_versions_currency_check", sql`${table.currency} = 'BDT'`),
  check("billing_plan_catalog_versions_status_check", sql`${table.status} in ('draft', 'published', 'retired')`),
  check("billing_plan_catalog_versions_hash_check", sql`${table.contentHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("billing_plan_catalog_versions_publication_check", sql`${table.status} <> 'published' or num_nonnulls(${table.effectiveFrom}, ${table.publishedBy}, ${table.reviewReference}) = 3`),
  check("billing_plan_catalog_versions_r3_gate_check", sql`not ${table.selfServiceEnabled}`)
]);

export const billingPlanPrices = pgTable("billing_plan_prices", {
  id: uuid("id").primaryKey(),
  catalogVersionId: uuid("catalog_version_id").notNull().references(() => billingPlanCatalogVersions.id, { onDelete: "cascade" }),
  productKey: text("product_key").notNull(),
  displayName: text("display_name").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("BDT"),
  billingInterval: text("billing_interval").notNull(),
  billingCadenceMonths: integer("billing_cadence_months"),
  offerStatus: text("offer_status").notNull(),
  includedActiveLanes: integer("included_active_lanes"),
  includedEditors: integer("included_editors"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_plan_prices_catalog_name_unique").on(table.catalogVersionId, table.displayName),
  index("billing_plan_prices_catalog_product_idx").on(table.catalogVersionId, table.productKey),
  check("billing_plan_prices_product_check", sql`${table.productKey} in ('explore', 'first_shipment_pass', 'launch', 'scale', 'managed_ops')`),
  check("billing_plan_prices_amount_check", sql`${table.amountMinor} >= 0 and ${table.currency} = 'BDT'`),
  check("billing_plan_prices_interval_check", sql`${table.billingInterval} in ('one_time', 'quarterly', 'annual', 'monthly')`),
  check("billing_plan_prices_cadence_check", sql`(${table.billingInterval} = 'one_time' and ${table.billingCadenceMonths} is null) or (${table.billingInterval} <> 'one_time' and ${table.billingCadenceMonths} >= 1)`),
  check("billing_plan_prices_status_check", sql`${table.offerStatus} in ('preview', 'manual_pilot', 'planned')`)
]);

export const billingAccounts = pgTable("billing_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  legalName: text("legal_name").notNull(),
  billingEmail: text("billing_email").notNull(),
  billingAddress: jsonb("billing_address").$type<Record<string, string>>().notNull(),
  taxRegistrationReference: text("tax_registration_reference"),
  currency: text("currency").notNull().default("BDT"),
  providerCustomerReference: text("provider_customer_reference"),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("billing_accounts_org_id_unique").on(table.organizationId, table.id),
  check("billing_accounts_currency_check", sql`${table.currency} = 'BDT'`)
]);

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  billingAccountId: uuid("billing_account_id").notNull().references(() => billingAccounts.id, { onDelete: "cascade" }),
  planPriceId: uuid("plan_price_id").notNull().references(() => billingPlanPrices.id, { onDelete: "restrict" }),
  entitlementId: uuid("entitlement_id").references(() => organizationEntitlements.id, { onDelete: "restrict" }),
  status: billingSubscriptionStatus("status").notNull().default("pending"),
  source: text("source").notNull().default("manual"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  providerSubscriptionReference: text("provider_subscription_reference"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("billing_subscriptions_org_id_unique").on(table.organizationId, table.id),
  index("billing_subscriptions_org_status_idx").on(table.organizationId, table.status, table.currentPeriodEnd),
  check("billing_subscriptions_source_check", sql`${table.source} in ('manual', 'provider')`),
  check("billing_subscriptions_period_check", sql`${table.currentPeriodEnd} > ${table.currentPeriodStart}`),
  check("billing_subscriptions_cancellation_check", sql`${table.status} <> 'cancelled' or num_nonnulls(${table.cancelledAt}, ${table.cancellationReason}) = 2`),
  check("billing_subscriptions_version_check", sql`${table.version} >= 1`)
]);

export const billingSubscriptionHistory = pgTable("billing_subscription_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").notNull().references(() => billingSubscriptions.id, { onDelete: "cascade" }),
  fromStatus: billingSubscriptionStatus("from_status").notNull(),
  toStatus: billingSubscriptionStatus("to_status").notNull(),
  aggregateVersion: integer("aggregate_version").notNull(),
  reason: text("reason").notNull(),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_subscription_history_version_unique").on(table.subscriptionId, table.aggregateVersion),
  index("billing_subscription_history_org_subscription_idx").on(table.organizationId, table.subscriptionId, table.changedAt),
  check("billing_subscription_history_version_check", sql`${table.aggregateVersion} >= 2`),
  check("billing_subscription_history_change_check", sql`${table.fromStatus} <> ${table.toStatus}`)
]);

export const billingCancellationRequests = pgTable("billing_cancellation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").notNull().references(() => billingSubscriptions.id, { onDelete: "cascade" }),
  requestedBy: text("requested_by").notNull(),
  reason: text("reason").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("requested"),
  processedBy: text("processed_by"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  processingReference: text("processing_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_cancellation_open_subscription_unique").on(table.subscriptionId).where(sql`${table.status} = 'requested'`),
  uniqueIndex("billing_cancellation_org_id_unique").on(table.organizationId, table.id),
  index("billing_cancellation_org_status_idx").on(table.organizationId, table.status, table.requestedAt),
  check("billing_cancellation_status_check", sql`${table.status} in ('requested', 'processed', 'rejected')`),
  check("billing_cancellation_window_check", sql`${table.effectiveAt} >= ${table.requestedAt}`),
  check("billing_cancellation_processing_check", sql`${table.status} = 'requested' or num_nonnulls(${table.processedBy}, ${table.processedAt}, ${table.processingReference}) = 3`)
]);

export const customerBillingInvoices = pgTable("customer_billing_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  billingAccountId: uuid("billing_account_id").notNull().references(() => billingAccounts.id, { onDelete: "restrict" }),
  subscriptionId: uuid("subscription_id").references(() => billingSubscriptions.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull(),
  status: billingInvoiceStatus("status").notNull().default("draft"),
  currency: text("currency").notNull().default("BDT"),
  subtotalMinor: integer("subtotal_minor").notNull(),
  taxMinor: integer("tax_minor").notNull().default(0),
  creditAppliedMinor: integer("credit_applied_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  documentStorageRef: text("document_storage_ref"),
  createdBy: text("created_by").notNull(),
  ...timestamps
}, (table) => [
  uniqueIndex("customer_billing_invoices_org_id_unique").on(table.organizationId, table.id),
  uniqueIndex("customer_billing_invoices_org_number_unique").on(table.organizationId, table.invoiceNumber),
  index("customer_billing_invoices_org_status_due_idx").on(table.organizationId, table.status, table.dueAt),
  check("customer_billing_invoices_money_check", sql`${table.currency} = 'BDT' and ${table.subtotalMinor} >= 0 and ${table.taxMinor} >= 0 and ${table.creditAppliedMinor} >= 0 and ${table.totalMinor} = ${table.subtotalMinor} + ${table.taxMinor} - ${table.creditAppliedMinor} and ${table.totalMinor} >= 0`),
  check("customer_billing_invoices_issue_check", sql`${table.status} = 'draft' or num_nonnulls(${table.issuedAt}, ${table.dueAt}) = 2`),
  check("customer_billing_invoices_paid_check", sql`${table.status} <> 'paid' or ${table.paidAt} is not null`)
]);

export const customerBillingCredits = pgTable("customer_billing_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  billingAccountId: uuid("billing_account_id").notNull().references(() => billingAccounts.id, { onDelete: "restrict" }),
  invoiceId: uuid("invoice_id").references(() => customerBillingInvoices.id, { onDelete: "restrict" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("BDT"),
  reason: text("reason").notNull(),
  reference: text("reference").notNull(),
  grantedBy: text("granted_by").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("customer_billing_credits_org_reference_unique").on(table.organizationId, table.reference),
  check("customer_billing_credits_amount_check", sql`${table.amountMinor} > 0 and ${table.currency} = 'BDT'`)
]);

export const customerBillingRefunds = pgTable("customer_billing_refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => customerBillingInvoices.id, { onDelete: "restrict" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("BDT"),
  reason: text("reason").notNull(),
  status: billingTransactionStatus("status").notNull().default("pending"),
  providerReference: text("provider_reference"),
  approvedBy: text("approved_by").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("customer_billing_refunds_org_status_idx").on(table.organizationId, table.status, table.approvedAt),
  check("customer_billing_refunds_amount_check", sql`${table.amountMinor} > 0 and ${table.currency} = 'BDT'`),
  check("customer_billing_refunds_complete_check", sql`${table.status} <> 'refunded' or ${table.completedAt} is not null`)
]);

export const billingTransactions = pgTable("billing_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").references(() => customerBillingInvoices.id, { onDelete: "restrict" }),
  provider: text("provider").notNull(),
  providerTransactionId: text("provider_transaction_id"),
  transactionType: text("transaction_type").notNull(),
  status: billingTransactionStatus("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("BDT"),
  idempotencyKey: text("idempotency_key").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  failureCode: text("failure_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_transactions_org_key_unique").on(table.organizationId, table.idempotencyKey),
  uniqueIndex("billing_transactions_provider_id_unique").on(table.provider, table.providerTransactionId),
  index("billing_transactions_org_status_idx").on(table.organizationId, table.status, table.occurredAt),
  check("billing_transactions_type_check", sql`${table.transactionType} in ('charge', 'payment', 'refund', 'credit')`),
  check("billing_transactions_amount_check", sql`${table.amountMinor} > 0 and ${table.currency} = 'BDT'`)
]);

export const billingProviderEvents = pgTable("billing_provider_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHashSha256: text("payload_hash_sha256").notNull(),
  signatureVerified: boolean("signature_verified").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  processingResult: text("processing_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_provider_events_provider_event_unique").on(table.provider, table.providerEventId),
  index("billing_provider_events_org_received_idx").on(table.organizationId, table.receivedAt),
  check("billing_provider_events_hash_check", sql`${table.payloadHashSha256} ~ '^[a-f0-9]{64}$'`),
  check("billing_provider_events_process_check", sql`num_nonnulls(${table.processedAt}, ${table.processingResult}) in (0, 2)`)
]);

export const usageLedgerEntries = pgTable("usage_ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => billingSubscriptions.id, { onDelete: "set null" }),
  usageType: text("usage_type").notNull(),
  quantity: integer("quantity").notNull(),
  unitCostMinor: integer("unit_cost_minor").notNull().default(0),
  currency: text("currency").notNull().default("BDT"),
  sourceEntityType: text("source_entity_type").notNull(),
  sourceEntityId: text("source_entity_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("usage_ledger_entries_org_key_unique").on(table.organizationId, table.idempotencyKey),
  index("usage_ledger_entries_org_type_time_idx").on(table.organizationId, table.usageType, table.occurredAt),
  check("usage_ledger_entries_type_check", sql`${table.usageType} in ('automation_unit', 'work_pack', 'active_lane', 'editor', 'specialist_minute')`),
  check("usage_ledger_entries_quantity_check", sql`${table.quantity} > 0 and ${table.unitCostMinor} >= 0 and ${table.currency} = 'BDT'`)
]);

export const billingEntitlementTransitions = pgTable("billing_entitlement_transitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").notNull().references(() => billingSubscriptions.id, { onDelete: "cascade" }),
  entitlementId: uuid("entitlement_id").notNull().references(() => organizationEntitlements.id, { onDelete: "restrict" }),
  fromTier: subscriptionTier("from_tier").notNull(),
  toTier: subscriptionTier("to_tier").notNull(),
  reason: text("reason").notNull(),
  reconciliationReference: text("reconciliation_reference"),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("billing_entitlement_transitions_org_subscription_idx").on(table.organizationId, table.subscriptionId, table.changedAt),
  check("billing_entitlement_transitions_change_check", sql`${table.fromTier} <> ${table.toTier}`)
]);

export const billingReconciliationResults = pgTable("billing_reconciliation_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  billingAccountId: uuid("billing_account_id").notNull().references(() => billingAccounts.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  expectedMinor: integer("expected_minor").notNull(),
  receivedMinor: integer("received_minor").notNull(),
  creditedMinor: integer("credited_minor").notNull(),
  refundedMinor: integer("refunded_minor").notNull(),
  varianceMinor: integer("variance_minor").notNull(),
  currency: text("currency").notNull().default("BDT"),
  status: text("status").notNull(),
  evidenceReference: text("evidence_reference").notNull(),
  reconciledBy: text("reconciled_by").notNull(),
  reconciledAt: timestamp("reconciled_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("billing_reconciliation_account_period_unique").on(table.billingAccountId, table.periodStart, table.periodEnd),
  index("billing_reconciliation_org_status_idx").on(table.organizationId, table.status, table.reconciledAt),
  check("billing_reconciliation_period_check", sql`${table.periodEnd} > ${table.periodStart}`),
  check("billing_reconciliation_money_check", sql`${table.expectedMinor} >= 0 and ${table.receivedMinor} >= 0 and ${table.creditedMinor} >= 0 and ${table.refundedMinor} >= 0 and ${table.varianceMinor} = ${table.receivedMinor} + ${table.creditedMinor} - ${table.refundedMinor} - ${table.expectedMinor} and ${table.currency} = 'BDT'`),
  check("billing_reconciliation_status_check", sql`${table.status} in ('matched', 'variance', 'resolved')`)
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
