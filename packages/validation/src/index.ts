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

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
