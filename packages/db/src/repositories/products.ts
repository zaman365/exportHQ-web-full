import { and, desc, eq } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import { products } from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface ProductRecord {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly composition: string | null;
  readonly hsCode: string | null;
  readonly countryOfOrigin: string;
  readonly currency: string;
}

export async function readPrimaryProduct(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<ProductRecord | null> {
  const [product] = await tx.select({
    id: products.id,
    sku: products.sku,
    name: products.name,
    category: products.category,
    composition: products.composition,
    hsCode: products.hsCode,
    countryOfOrigin: products.countryOfOrigin,
    currency: products.currency
  }).from(products)
    .where(eq(products.organizationId, context.organizationId))
    .orderBy(desc(products.updatedAt), desc(products.id))
    .limit(1);
  return product ?? null;
}

export async function savePrimaryProduct(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly id?: string;
    readonly name: string;
    readonly category: string;
    readonly internalReference?: string;
    readonly hsCode?: string;
    readonly specification?: string;
    readonly countryOfOrigin: string;
    readonly currency: string;
  }
): Promise<ProductRecord | null> {
  const name = input.name.trim();
  if (!name) return null;
  const category = requiredText(input.category, "Product category");
  const countryOfOrigin = countryCode(input.countryOfOrigin);
  const currency = currencyCode(input.currency);
  const hsCode = normalizedHsCode(input.hsCode);
  const now = new Date();
  const current = input.id
    ? (await tx.select().from(products).where(and(
        eq(products.organizationId, context.organizationId),
        eq(products.id, input.id)
      )).limit(1))[0]
    : await readPrimaryProduct(tx, context);
  if (input.id && !current) throw new Error("Primary product was not found in this organization.");
  const sku = input.internalReference?.trim()
    || current?.sku
    || `EXPORTHQ-PRIMARY-${context.organizationId.slice(0, 8).toUpperCase()}`;
  const values = {
    sku,
    name,
    category,
    composition: input.specification?.trim() || null,
    hsCode,
    countryOfOrigin,
    currency,
    updatedAt: now
  };
  const [saved] = current
    ? await tx.update(products).set(values).where(and(
        eq(products.organizationId, context.organizationId),
        eq(products.id, current.id)
      )).returning()
    : await tx.insert(products).values({ organizationId: context.organizationId, ...values }).returning();
  if (!saved) throw new Error("Primary product save did not return a row.");
  const action = current ? "product.updated" : "product.created";
  await recordAuditEvent(tx, context, {
    action,
    entityType: "product",
    entityId: saved.id,
    metadata: { fields: ["category", "composition", "countryOfOrigin", "currency", "hsCode", "name", "sku"] }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: action,
    aggregateType: "product",
    aggregateId: saved.id,
    dedupeKey: `product:${saved.id}:${saved.updatedAt.toISOString()}`,
    payload: { action }
  });
  return {
    id: saved.id,
    sku: saved.sku,
    name: saved.name,
    category: saved.category,
    composition: saved.composition,
    hsCode: saved.hsCode,
    countryOfOrigin: saved.countryOfOrigin,
    currency: saved.currency
  };
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function countryCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Country of origin must be an ISO alpha-2 code.");
  return normalized;
}

function currencyCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency must be an ISO 4217 code.");
  return normalized;
}

function normalizedHsCode(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;
  if (!/^\d{4}(?:\.\d{2,6})?$/.test(normalized)) throw new Error("HS code must contain 4 digits with an optional reviewed extension.");
  return normalized;
}
