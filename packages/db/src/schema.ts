import {
  boolean,
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
  permissions: text("permissions").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => [
  uniqueIndex("organization_membership_user_unique").on(table.organizationId, table.clerkUserId),
  index("organization_membership_user_idx").on(table.clerkUserId)
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
  ...timestamps
});

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
  name: text("name").notNull(),
  jurisdiction: text("jurisdiction").notNull()
});

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
