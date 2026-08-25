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

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type BusinessVerificationInput = z.infer<typeof businessVerificationSchema>;
export type ReadinessProgressInput = z.infer<typeof readinessProgressSchema>;
export type ReadinessReferralRequestInput = z.infer<typeof readinessReferralRequestSchema>;
