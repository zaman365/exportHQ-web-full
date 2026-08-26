import { z } from "zod";

export const companyOnboardingSchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  tradingName: z.string().trim().min(2).max(180),
  originCountry: z.string().trim().length(2),
  industry: z.string().trim().min(2).max(120),
  website: z.url().optional().or(z.literal(""))
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  sku: z.string().trim().min(1).max(64),
  category: z.string().trim().min(2).max(120),
  composition: z.string().trim().min(2).max(500),
  hsCode: z.string().trim().regex(/^\d{4}(?:\.\d{2,6})?$/),
  targetMarketCode: z.string().trim().length(2),
  currency: z.string().trim().length(3),
  fobPriceMinor: z.coerce.number().int().nonnegative()
});

export const organizationProfileSchema = z.object({
  organization: z.object({
    legalName: z.string().trim().min(2).max(180),
    tradingName: z.string().trim().min(2).max(180),
    website: z.url().optional().or(z.literal("")),
    country: z.enum(["Bangladesh", "Germany", "India", "Netherlands", "United Kingdom"]),
    timezone: z.enum(["Asia/Dhaka", "Europe/Berlin", "Europe/London", "Asia/Kolkata"]),
    defaultCurrency: z.enum(["USD", "EUR", "GBP", "BDT"]),
    supportEmail: z.email()
  }),
  primaryOffer: z.object({
    name: z.string().trim().max(180),
    category: z.string().trim().max(120),
    internalReference: z.string().trim().max(64),
    hsCode: z.string().trim().regex(/^$|^\d{4}(?:\.\d{2,6})?$/),
    specification: z.string().trim().max(500)
  }),
  marketStrategy: z.object({
    primaryMarket: z.enum(["DE", "NL", "GB", "JP", "SA", "AE"]).or(z.literal("")),
    secondaryMarkets: z.array(z.enum(["DE", "NL", "GB", "JP", "SA", "AE"])).max(5),
    primarySalesChannel: z.enum(["wholesale", "retail", "marketplace", "services"]).or(z.literal("")),
    secondarySalesChannels: z.array(z.enum(["wholesale", "retail", "marketplace", "services"])).max(3),
    currentExportStage: z.enum(["exploring", "preparing", "exporting", "scaling"]).or(z.literal(""))
  })
}).superRefine(({ marketStrategy }, context) => {
  if (!marketStrategy.primaryMarket && marketStrategy.secondaryMarkets.length > 0) {
    context.addIssue({ code: "custom", path: ["marketStrategy", "primaryMarket"], message: "Choose a primary market before adding secondary markets." });
  }
  if (marketStrategy.primaryMarket && marketStrategy.secondaryMarkets.includes(marketStrategy.primaryMarket)) {
    context.addIssue({ code: "custom", path: ["marketStrategy", "secondaryMarkets"], message: "The primary market cannot also be secondary." });
  }
  if (!marketStrategy.primarySalesChannel && marketStrategy.secondarySalesChannels.length > 0) {
    context.addIssue({ code: "custom", path: ["marketStrategy", "primarySalesChannel"], message: "Choose a primary sales channel before adding secondary channels." });
  }
  if (marketStrategy.primarySalesChannel && marketStrategy.secondarySalesChannels.includes(marketStrategy.primarySalesChannel)) {
    context.addIssue({ code: "custom", path: ["marketStrategy", "secondarySalesChannels"], message: "The primary sales channel cannot also be secondary." });
  }
});

export const businessVerificationSchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  registrationNumber: z.string().trim().min(3).max(100),
  registrationAuthority: z.string().trim().min(2).max(180),
  originCountry: z.string().trim().length(2),
  website: z.url(),
  businessEmail: z.email(),
  evidenceUrl: z.url(),
  declaration: z.literal("accepted")
});

export const taskUpdateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  status: z.enum([
    "todo",
    "in_progress",
    "waiting_customer",
    "waiting_export_hq",
    "waiting_third_party",
    "completed",
    "blocked"
  ])
});

export const documentIntentSchema = z.object({
  organizationId: z.string().min(1),
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  byteSize: z.number().int().positive().max(25 * 1024 * 1024),
  category: z.enum(["company", "product", "compliance", "certification", "other"]),
  linkedEntityId: z.string().min(1)
});

export const readinessProgressSchema = z.object({
  version: z.literal(1),
  currentSection: z.enum(["business", "registrations", "facility", "product", "market", "commercial", "delivery", "digital"]),
  profile: z.object({
    businessModel: z.enum(["manufacturer", "trader", "service"]),
    productCategory: z.enum(["apparel", "leather", "jute", "food", "engineering", "software", "other"]),
    productName: z.string().trim().max(180),
    hsCode: z.string().trim().max(16),
    targetMarketCode: z.enum(["DE", "NL", "GB", "JP", "SA", "AE"]),
    salesChannel: z.enum(["wholesale", "retail", "marketplace", "services"])
  }),
  responses: z.record(z.string().min(1).max(100), z.enum(["not_started", "in_progress", "evidence_added", "verified", "blocked", "not_applicable"])),
  notes: z.record(z.string().min(1).max(100), z.string().trim().max(1000)),
  evidence: z.array(z.object({
    id: z.string().min(1).max(100),
    requirementId: z.string().min(1).max(100),
    fileName: z.string().trim().min(1).max(240),
    mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
    byteSize: z.number().int().positive().max(25 * 1024 * 1024),
    status: z.enum(["staged", "under_review", "needs_action", "accepted"]),
    feedback: z.string().trim().max(1000),
    addedAt: z.string().datetime()
  })).max(100)
});

export const readinessReferralRequestSchema = z.object({
  requirementId: z.string().min(1).max(100),
  providerCategory: z.enum([
    "corporate-legal", "tax-vat", "trade-registration", "factory-licensing", "environmental", "fire-safety",
    "standards-lab", "customs-clearing", "authorized-dealer-bank", "freight-logistics", "trade-insurance",
    "packaging-labeling", "market-entry", "buying-house", "digital-it", "ip-trademark",
    "translation-localization", "quality-inspection"
  ]),
  consentToReferralDisclosure: z.literal(true)
});

export const teamAccessRoleSchema = z.enum(["owner", "executive", "department_lead", "manager", "member", "viewer", "external"]);

export const organizationTeamSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  purpose: z.string().trim().min(10).max(240),
  leadMembershipId: z.uuid(),
  memberIds: z.array(z.uuid()).min(1).max(100)
}).superRefine(({ leadMembershipId, memberIds }, context) => {
  if (!memberIds.includes(leadMembershipId)) {
    context.addIssue({ code: "custom", path: ["memberIds"], message: "The team lead must be included as a team member." });
  }
});

export const organizationMemberAccessSchema = z.object({
  organizationId: z.uuid(),
  membershipId: z.uuid(),
  positionTitle: z.string().trim().min(2).max(100),
  accessRole: teamAccessRoleSchema,
  hierarchyRank: z.number().int().min(0).max(100)
});

export const organizationConversationSchema = z.object({
  organizationId: z.uuid(),
  kind: z.enum(["department", "direct", "export_hq"]),
  title: z.string().trim().min(2).max(120),
  teamId: z.uuid().optional(),
  participantMembershipIds: z.array(z.uuid()).max(100),
  participantStaffProfileIds: z.array(z.uuid()).max(25),
  relatedEntityType: z.string().trim().max(80).optional(),
  relatedEntityId: z.string().trim().max(120).optional()
}).superRefine((conversation, context) => {
  if (conversation.participantMembershipIds.length + conversation.participantStaffProfileIds.length < 2) {
    context.addIssue({ code: "custom", path: ["participantMembershipIds"], message: "A conversation needs at least two participants." });
  }
  if (conversation.kind === "department" && !conversation.teamId) {
    context.addIssue({ code: "custom", path: ["teamId"], message: "Department conversations must belong to a team." });
  }
});

export const organizationMessageSchema = z.object({
  organizationId: z.uuid(),
  conversationId: z.uuid(),
  body: z.string().trim().min(1).max(4000)
});

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type BusinessVerificationInput = z.infer<typeof businessVerificationSchema>;
export type ReadinessProgressInput = z.infer<typeof readinessProgressSchema>;
export type ReadinessReferralRequestInput = z.infer<typeof readinessReferralRequestSchema>;
export type OrganizationTeamInput = z.infer<typeof organizationTeamSchema>;
export type OrganizationMemberAccessInput = z.infer<typeof organizationMemberAccessSchema>;
export type OrganizationConversationInput = z.infer<typeof organizationConversationSchema>;
export type OrganizationMessageInput = z.infer<typeof organizationMessageSchema>;
