import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  exportLanes,
  products,
  regulatoryPublishers,
  regulatoryRuleLaneImpacts,
  regulatoryRules,
  regulatorySources
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface RegulatoryLaneImpactRecord {
  readonly id: string;
  readonly regulatoryRuleId: string;
  readonly exportLaneId: string;
  readonly state: "pending" | "acknowledged" | "resolved" | "superseded";
  readonly title: string;
  readonly summary: string;
  readonly confidence: string;
  readonly ruleVersion: string;
  readonly methodVersion: string;
  readonly effectiveFrom: Date;
  readonly publisher: string;
  readonly canonicalUrl: string;
  readonly sourceReviewedAt: Date;
  readonly sourceNextReviewAt: Date;
  readonly detectedAt: Date;
}

export async function syncLaneRegulatoryImpacts(
  tx: ExportHqTransaction,
  context: TenantContext,
  exportLaneId: string,
  now = new Date()
): Promise<number> {
  const [lane] = await tx.select({
    id: exportLanes.id,
    originCountryCode: exportLanes.originCountryCode,
    destinationCountryCode: exportLanes.destinationCountryCode,
    productCategory: products.category,
    hsCode: products.hsCode
  }).from(exportLanes)
    .innerJoin(products, and(
      eq(products.organizationId, context.organizationId),
      eq(products.id, exportLanes.productId)
    ))
    .where(and(
      eq(exportLanes.organizationId, context.organizationId),
      eq(exportLanes.id, exportLaneId)
    )).limit(1);
  if (!lane) throw new Error("Export Lane was not found in this organization.");

  const candidates = await tx.select({ rule: regulatoryRules })
    .from(regulatoryRules)
    .innerJoin(regulatorySources, eq(regulatorySources.id, regulatoryRules.sourceId))
    .innerJoin(regulatoryPublishers, eq(regulatoryPublishers.id, regulatorySources.publisherId))
    .where(and(
      eq(regulatoryPublishers.active, true),
      eq(regulatoryRules.reviewState, "human_reviewed"),
      eq(regulatorySources.reviewState, "human_reviewed"),
      isNull(regulatoryRules.supersededAt),
      isNull(regulatorySources.supersededAt),
      lte(regulatoryRules.effectiveFrom, now),
      or(isNull(regulatorySources.effectiveFrom), lte(regulatorySources.effectiveFrom, now)),
      gte(regulatorySources.nextReviewAt, now)
    ));
  let createdCount = 0;
  for (const { rule } of candidates) {
    if (!ruleApplies(rule, lane)) continue;
    const [created] = await tx.insert(regulatoryRuleLaneImpacts).values({
      organizationId: context.organizationId,
      regulatoryRuleId: rule.id,
      exportLaneId: lane.id,
      state: "pending",
      impactType: "review_required",
      assessmentMethodVersion: rule.methodVersion,
      detectedAt: now
    }).onConflictDoNothing({
      target: [
        regulatoryRuleLaneImpacts.organizationId,
        regulatoryRuleLaneImpacts.regulatoryRuleId,
        regulatoryRuleLaneImpacts.exportLaneId
      ]
    }).returning({ id: regulatoryRuleLaneImpacts.id });
    if (!created) continue;
    createdCount += 1;
    await recordAuditEvent(tx, context, {
      action: "regulatory.impact_detected",
      entityType: "regulatory_lane_impact",
      entityId: created.id,
      metadata: { exportLaneId: lane.id, regulatoryRuleId: rule.id, ruleVersion: rule.ruleVersion }
    });
    await enqueueOutboxEvent(tx, context, {
      topic: "regulatory.impact_detected",
      aggregateType: "export_lane",
      aggregateId: lane.id,
      dedupeKey: `regulatory-impact:${created.id}:detected`,
      payload: { impactId: created.id, regulatoryRuleId: rule.id, ruleVersion: rule.ruleVersion }
    });
  }
  return createdCount;
}

export async function listLaneRegulatoryImpacts(
  tx: ExportHqTransaction,
  context: TenantContext,
  exportLaneId: string,
  options: { readonly offset?: number; readonly limit?: number } = {}
): Promise<{ readonly items: readonly RegulatoryLaneImpactRecord[]; readonly offset: number; readonly limit: number; readonly hasMore: boolean }> {
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));
  const rows = await tx.select({
    id: regulatoryRuleLaneImpacts.id,
    regulatoryRuleId: regulatoryRuleLaneImpacts.regulatoryRuleId,
    exportLaneId: regulatoryRuleLaneImpacts.exportLaneId,
    state: regulatoryRuleLaneImpacts.state,
    title: regulatoryRules.title,
    summary: regulatoryRules.summary,
    confidence: regulatoryRules.confidence,
    ruleVersion: regulatoryRules.ruleVersion,
    methodVersion: regulatoryRules.methodVersion,
    effectiveFrom: regulatoryRules.effectiveFrom,
    publisher: regulatoryPublishers.name,
    canonicalUrl: regulatorySources.canonicalUrl,
    sourceReviewedAt: regulatorySources.reviewedAt,
    sourceNextReviewAt: regulatorySources.nextReviewAt,
    detectedAt: regulatoryRuleLaneImpacts.detectedAt
  }).from(regulatoryRuleLaneImpacts)
    .innerJoin(regulatoryRules, eq(regulatoryRules.id, regulatoryRuleLaneImpacts.regulatoryRuleId))
    .innerJoin(regulatorySources, eq(regulatorySources.id, regulatoryRules.sourceId))
    .innerJoin(regulatoryPublishers, eq(regulatoryPublishers.id, regulatorySources.publisherId))
    .where(and(
      eq(regulatoryRuleLaneImpacts.organizationId, context.organizationId),
      eq(regulatoryRuleLaneImpacts.exportLaneId, exportLaneId)
    ))
    .orderBy(desc(regulatoryRuleLaneImpacts.detectedAt), desc(regulatoryRuleLaneImpacts.id))
    .offset(offset)
    .limit(limit + 1);
  return { items: rows.slice(0, limit), offset, limit, hasMore: rows.length > limit };
}

export async function transitionRegulatoryLaneImpact(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly impactId: string;
    readonly state: "acknowledged" | "resolved";
  },
  now = new Date()
): Promise<void> {
  if (input.state === "resolved" && context.actorType === "customer") {
    throw new Error("Only the reviewed operations workflow may resolve a regulatory impact.");
  }
  const [current] = await tx.select().from(regulatoryRuleLaneImpacts).where(and(
    eq(regulatoryRuleLaneImpacts.organizationId, context.organizationId),
    eq(regulatoryRuleLaneImpacts.id, input.impactId)
  )).limit(1);
  if (!current) throw new Error("Regulatory impact was not found in this organization.");
  const allowed = input.state === "acknowledged"
    ? current.state === "pending"
    : current.state === "pending" || current.state === "acknowledged";
  if (!allowed) throw new Error(`Regulatory impact cannot move from ${current.state} to ${input.state}.`);
  const [updated] = await tx.update(regulatoryRuleLaneImpacts).set(input.state === "acknowledged" ? {
    state: "acknowledged",
    acknowledgedBy: context.actorId,
    acknowledgedAt: now,
    updatedAt: now
  } : {
    state: "resolved",
    resolvedBy: context.actorId,
    resolvedAt: now,
    updatedAt: now
  }).where(and(
    eq(regulatoryRuleLaneImpacts.organizationId, context.organizationId),
    eq(regulatoryRuleLaneImpacts.id, input.impactId),
    eq(regulatoryRuleLaneImpacts.state, current.state)
  )).returning({ id: regulatoryRuleLaneImpacts.id });
  if (!updated) throw new Error("Regulatory impact changed concurrently.");
  await recordAuditEvent(tx, context, {
    action: input.state === "acknowledged" ? "regulatory.impact_acknowledged" : "regulatory.impact_resolved",
    entityType: "regulatory_lane_impact",
    entityId: input.impactId,
    metadata: { exportLaneId: current.exportLaneId, regulatoryRuleId: current.regulatoryRuleId, fromState: current.state, toState: input.state }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: `regulatory.impact_${input.state}`,
    aggregateType: "export_lane",
    aggregateId: current.exportLaneId,
    dedupeKey: `regulatory-impact:${input.impactId}:${input.state}`,
    payload: { impactId: input.impactId, regulatoryRuleId: current.regulatoryRuleId, state: input.state }
  });
}

function ruleApplies(
  rule: typeof regulatoryRules.$inferSelect,
  lane: {
    readonly originCountryCode: string;
    readonly destinationCountryCode: string;
    readonly productCategory: string;
    readonly hsCode: string | null;
  }
): boolean {
  const jurisdictions = new Set([
    "GLOBAL",
    lane.originCountryCode.toUpperCase(),
    lane.destinationCountryCode.toUpperCase(),
    ...(["DE", "NL"].includes(lane.destinationCountryCode.toUpperCase()) ? ["EU"] : [])
  ]);
  if (!jurisdictions.has(rule.jurisdiction.toUpperCase())) return false;
  if (rule.productCategories.length && !rule.productCategories.some(
    (category) => category.toLowerCase() === lane.productCategory.toLowerCase()
  )) return false;
  if (rule.marketCountryCodes.length && !rule.marketCountryCodes.includes(lane.destinationCountryCode.toUpperCase())) return false;
  if (rule.hsCodes.length) {
    const hsCode = lane.hsCode?.replace(/\D/g, "") ?? "";
    if (!hsCode || !rule.hsCodes.some((prefix) => hsCode.startsWith(prefix.replace(/\D/g, "")))) return false;
  }
  return true;
}
