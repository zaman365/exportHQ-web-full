import { eq } from "drizzle-orm";
import type { ExportHqDatabase } from "./index";
import {
  marketCatalogProducts,
  marketOpportunities,
  marketOpportunityEvidence,
  markets
} from "./schema";

export interface MarketOpportunitySeed {
  originCountryCode: string;
  target: { code: string; iso3: string; name: string; region: string };
  product: { slug: string; name: string; category: string; hsCodes: readonly string[] };
  opportunityScore: number;
  demandScore: number;
  originFitScore: number;
  confidence: "high" | "medium";
  trend: "accelerating" | "established" | "emerging";
  publicSummary: string;
  memberInsight: string;
  whyItRanks: readonly string[];
  buyerProfiles: readonly string[];
  entryRoutes: readonly string[];
  barriers: readonly string[];
  proofToPrepare: readonly string[];
  nextActions: readonly string[];
  evidence: ReadonlyArray<{
    label: string;
    publisher: string;
    url: string;
    period: string;
    metric: string;
    checkedAt: string;
  }>;
}

/**
 * Idempotently publishes a reviewed catalog snapshot. Evidence rows are
 * replaced within the same transaction so a score can never point at a stale
 * source set.
 */
export async function upsertMarketIntelligenceCatalog(
  database: ExportHqDatabase,
  catalog: readonly MarketOpportunitySeed[],
  methodVersion: string
): Promise<{ markets: number; products: number; opportunities: number; evidence: number }> {
  const marketCodes = new Set<string>();
  const productSlugs = new Set<string>();
  let evidenceCount = 0;

  await database.transaction(async (tx) => {
    for (const item of catalog) {
      const [market] = await tx.insert(markets).values({
        countryCode: item.target.code,
        iso3Code: item.target.iso3,
        name: item.target.name,
        jurisdiction: item.target.name,
        region: item.target.region,
        active: true
      }).onConflictDoUpdate({
        target: markets.countryCode,
        set: { iso3Code: item.target.iso3, name: item.target.name, jurisdiction: item.target.name, region: item.target.region, active: true }
      }).returning({ id: markets.id });

      const [product] = await tx.insert(marketCatalogProducts).values({
        slug: item.product.slug,
        name: item.product.name,
        category: item.product.category,
        hsCodes: [...item.product.hsCodes],
        originCountryCode: item.originCountryCode,
        active: true
      }).onConflictDoUpdate({
        target: marketCatalogProducts.slug,
        set: { name: item.product.name, category: item.product.category, hsCodes: [...item.product.hsCodes], originCountryCode: item.originCountryCode, active: true, updatedAt: new Date() }
      }).returning({ id: marketCatalogProducts.id });

      if (!market || !product) throw new Error("Market intelligence upsert did not return a catalog identifier.");
      const latestCheckedAt = item.evidence.reduce((latest, candidate) => candidate.checkedAt > latest ? candidate.checkedAt : latest, "1970-01-01");
      const [opportunity] = await tx.insert(marketOpportunities).values({
        marketId: market.id,
        productId: product.id,
        originCountryCode: item.originCountryCode,
        status: "published",
        trend: item.trend,
        confidence: item.confidence,
        opportunityScore: item.opportunityScore,
        demandScore: item.demandScore,
        originFitScore: item.originFitScore,
        publicSummary: item.publicSummary,
        memberInsight: item.memberInsight,
        whyItRanks: [...item.whyItRanks],
        buyerProfiles: [...item.buyerProfiles],
        entryRoutes: [...item.entryRoutes],
        barriers: [...item.barriers],
        proofToPrepare: [...item.proofToPrepare],
        nextActions: [...item.nextActions],
        methodVersion,
        lastCalculatedAt: new Date(latestCheckedAt),
        publishedAt: new Date()
      }).onConflictDoUpdate({
        target: [marketOpportunities.originCountryCode, marketOpportunities.marketId, marketOpportunities.productId],
        set: {
          status: "published",
          trend: item.trend,
          confidence: item.confidence,
          opportunityScore: item.opportunityScore,
          demandScore: item.demandScore,
          originFitScore: item.originFitScore,
          publicSummary: item.publicSummary,
          memberInsight: item.memberInsight,
          whyItRanks: [...item.whyItRanks],
          buyerProfiles: [...item.buyerProfiles],
          entryRoutes: [...item.entryRoutes],
          barriers: [...item.barriers],
          proofToPrepare: [...item.proofToPrepare],
          nextActions: [...item.nextActions],
          methodVersion,
          lastCalculatedAt: new Date(latestCheckedAt),
          publishedAt: new Date(),
          updatedAt: new Date()
        }
      }).returning({ id: marketOpportunities.id });

      if (!opportunity) throw new Error("Market intelligence upsert did not return an opportunity identifier.");
      await tx.delete(marketOpportunityEvidence).where(eq(marketOpportunityEvidence.opportunityId, opportunity.id));
      if (item.evidence.length) {
        await tx.insert(marketOpportunityEvidence).values(item.evidence.map((source) => ({
          opportunityId: opportunity.id,
          sourceLabel: source.label,
          sourcePublisher: source.publisher,
          sourceUrl: source.url,
          dataPeriod: source.period,
          metric: source.metric,
          checkedAt: new Date(source.checkedAt),
          rawMetrics: {}
        })));
      }

      marketCodes.add(item.target.code);
      productSlugs.add(item.product.slug);
      evidenceCount += item.evidence.length;
    }
  });

  return { markets: marketCodes.size, products: productSlugs.size, opportunities: catalog.length, evidence: evidenceCount };
}
