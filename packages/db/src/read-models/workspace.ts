import { and, desc, eq, ne } from "drizzle-orm";
import {
  auditEvents,
  companyProfiles,
  documents,
  exportLanes,
  organizations,
  products,
  readinessAssessments,
  regulatoryPublishers,
  regulatoryRuleLaneImpacts,
  regulatoryRules,
  regulatorySources,
  tasks
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export type WorkspaceTaskStatus = typeof tasks.$inferSelect.status;

export interface WorkspaceDashboardTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: WorkspaceTaskStatus;
  readonly responsibility: typeof tasks.$inferSelect.responsibility;
  readonly priority: string;
  readonly dueAt: string | null;
  readonly ownerLabel: string;
  readonly exportLaneId: string | null;
  readonly relatedEntityType: string | null;
  readonly version: number;
}

export interface WorkspaceDashboardProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly composition: string | null;
  readonly hsCode: string | null;
  readonly destinationCountryCode: string | null;
  readonly readinessScore: number | null;
  readonly laneStatus: typeof exportLanes.$inferSelect.status | null;
}

export interface WorkspaceDashboardReadModel {
  readonly organization: {
    readonly legalName: string;
    readonly tradingName: string;
    readonly onboardingPercent: number;
  };
  readonly health: {
    readonly overall: number;
    readonly dimensions: readonly { readonly label: string; readonly score: number }[];
  };
  readonly metrics: {
    readonly targetMarkets: number;
    readonly products: number;
    readonly openActions: number;
    readonly documents: number;
  };
  readonly tasks: readonly WorkspaceDashboardTask[];
  readonly products: readonly WorkspaceDashboardProduct[];
  readonly documents: readonly {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly status: typeof documents.$inferSelect.status;
    readonly linkedEntityType: string;
    readonly updatedAt: string;
  }[];
  readonly activity: readonly {
    readonly id: string;
    readonly action: string;
    readonly actorLabel: string;
    readonly at: string;
  }[];
}

export interface TenantExportLaneReadModel {
  readonly id: string;
  readonly version: number;
  readonly productName: string;
  readonly sku: string;
  readonly hsCode: string | null;
  readonly originCountryCode: string;
  readonly destinationCountryCode: string;
  readonly salesChannel: string;
  readonly buyerSegment: string;
  readonly route: string;
  readonly incoterm: typeof exportLanes.$inferSelect.incoterm;
  readonly status: typeof exportLanes.$inferSelect.status;
  readonly health: typeof exportLanes.$inferSelect.health;
  readonly stage: typeof exportLanes.$inferSelect.stage;
  readonly targetMarginBps: number;
  readonly currency: string;
  readonly readinessScore: number | null;
  readonly tasks: readonly WorkspaceDashboardTask[];
  readonly regulatoryImpacts: readonly {
    readonly id: string;
    readonly state: typeof regulatoryRuleLaneImpacts.$inferSelect.state;
    readonly title: string;
    readonly summary: string;
    readonly publisher: string;
    readonly canonicalUrl: string;
    readonly reviewedAt: string;
    readonly nextReviewAt: string;
  }[];
  readonly updatedAt: string;
}

export async function readWorkspaceDashboard(
  tx: ExportHqTransaction,
  context: TenantContext,
  options: { readonly taskLimit?: number; readonly productLimit?: number; readonly documentLimit?: number; readonly activityLimit?: number } = {}
): Promise<WorkspaceDashboardReadModel> {
  const taskLimit = boundedLimit(options.taskLimit, 7);
  const productLimit = boundedLimit(options.productLimit, 8);
  const documentLimit = boundedLimit(options.documentLimit, 6);
  const activityLimit = boundedLimit(options.activityLimit, 6);
  const [[organization], taskRows, productRows, laneRows, assessmentRows, documentRows, activityRows] = await Promise.all([
    tx.select({
      legalName: organizations.legalName,
      tradingName: organizations.tradingName,
      profileLegalName: companyProfiles.legalName,
      profileTradingName: companyProfiles.tradingName,
      onboardingPercent: companyProfiles.onboardingPercent
    }).from(organizations)
      .leftJoin(companyProfiles, eq(companyProfiles.organizationId, organizations.id))
      .where(eq(organizations.id, context.organizationId))
      .limit(1),
    tx.select().from(tasks)
      .where(and(eq(tasks.organizationId, context.organizationId), ne(tasks.status, "completed")))
      .orderBy(desc(tasks.priority), tasks.dueAt, desc(tasks.id))
      .limit(taskLimit),
    tx.select().from(products)
      .where(eq(products.organizationId, context.organizationId))
      .orderBy(desc(products.updatedAt), desc(products.id))
      .limit(productLimit),
    tx.select().from(exportLanes)
      .where(and(eq(exportLanes.organizationId, context.organizationId), ne(exportLanes.status, "archived")))
      .orderBy(desc(exportLanes.updatedAt), desc(exportLanes.id))
      .limit(100),
    tx.select().from(readinessAssessments)
      .where(and(eq(readinessAssessments.organizationId, context.organizationId), ne(readinessAssessments.status, "archived")))
      .orderBy(desc(readinessAssessments.updatedAt), desc(readinessAssessments.id))
      .limit(100),
    tx.select().from(documents)
      .where(eq(documents.organizationId, context.organizationId))
      .orderBy(desc(documents.updatedAt), desc(documents.id))
      .limit(documentLimit),
    tx.select().from(auditEvents)
      .where(eq(auditEvents.organizationId, context.organizationId))
      .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
      .limit(activityLimit)
  ]);
  if (!organization) throw new Error("Organization workspace could not be read.");

  const latestLaneByProduct = new Map<string, typeof laneRows[number]>();
  for (const lane of laneRows) if (!latestLaneByProduct.has(lane.productId)) latestLaneByProduct.set(lane.productId, lane);
  const latestAssessmentByLane = new Map<string, typeof assessmentRows[number]>();
  for (const assessment of assessmentRows) {
    if (assessment.exportLaneId && !latestAssessmentByLane.has(assessment.exportLaneId)) {
      latestAssessmentByLane.set(assessment.exportLaneId, assessment);
    }
  }
  const assessmentScores = [...latestAssessmentByLane.values()].map((assessment) => assessment.score);
  const targetMarkets = new Set(laneRows.map((lane) => lane.destinationCountryCode));

  return {
    organization: {
      legalName: organization.profileLegalName ?? organization.legalName,
      tradingName: organization.profileTradingName ?? organization.tradingName,
      onboardingPercent: organization.onboardingPercent ?? 0
    },
    health: {
      overall: assessmentScores.length
        ? Math.round(assessmentScores.reduce((total, score) => total + score, 0) / assessmentScores.length)
        : 0,
      dimensions: [...latestAssessmentByLane.entries()].slice(0, 4).map(([laneId, assessment]) => ({
        label: `Lane ${laneId.slice(0, 8)} readiness`,
        score: assessment.score
      }))
    },
    metrics: {
      targetMarkets: targetMarkets.size,
      products: productRows.length,
      openActions: taskRows.length,
      documents: documentRows.length
    },
    tasks: taskRows.map((task) => dashboardTask(task, context)),
    products: productRows.map((product) => {
      const lane = latestLaneByProduct.get(product.id);
      const assessment = lane ? latestAssessmentByLane.get(lane.id) : undefined;
      return {
        id: product.id,
        sku: displaySku(product.sku),
        name: product.name,
        category: product.category,
        composition: product.composition,
        hsCode: product.hsCode,
        destinationCountryCode: lane?.destinationCountryCode ?? null,
        readinessScore: assessment?.score ?? null,
        laneStatus: lane?.status ?? null
      };
    }),
    documents: documentRows.map((document) => ({
      id: document.id,
      name: document.name,
      category: document.category,
      status: document.status,
      linkedEntityType: document.linkedEntityType,
      updatedAt: document.updatedAt.toISOString()
    })),
    activity: activityRows.map((event) => ({
      id: event.id,
      action: humanizeAction(event.action),
      actorLabel: event.actorId === context.actorId ? "You" : event.actorType === "customer" ? "Workspace member" : "Export HQ operations",
      at: event.createdAt.toISOString()
    }))
  };
}

export async function readTenantExportLane(
  tx: ExportHqTransaction,
  context: TenantContext,
  exportLaneId?: string
): Promise<TenantExportLaneReadModel | null> {
  const predicates = [eq(exportLanes.organizationId, context.organizationId), ne(exportLanes.status, "archived")];
  if (exportLaneId) predicates.push(eq(exportLanes.id, exportLaneId));
  const [lane] = await tx.select({ lane: exportLanes, product: products })
    .from(exportLanes)
    .innerJoin(products, and(eq(products.organizationId, context.organizationId), eq(products.id, exportLanes.productId)))
    .where(and(...predicates))
    .orderBy(desc(exportLanes.updatedAt), desc(exportLanes.id))
    .limit(1);
  if (!lane) return null;
  const [assessment, taskRows, impactRows] = await Promise.all([
    tx.select({ score: readinessAssessments.score }).from(readinessAssessments)
      .where(and(
        eq(readinessAssessments.organizationId, context.organizationId),
        eq(readinessAssessments.exportLaneId, lane.lane.id),
        ne(readinessAssessments.status, "archived")
      ))
      .orderBy(desc(readinessAssessments.updatedAt), desc(readinessAssessments.id))
      .limit(1)
      .then((rows) => rows[0]),
    tx.select().from(tasks)
      .where(and(eq(tasks.organizationId, context.organizationId), eq(tasks.exportLaneId, lane.lane.id)))
      .orderBy(desc(tasks.priority), tasks.dueAt, desc(tasks.id))
      .limit(25),
    tx.select({
      id: regulatoryRuleLaneImpacts.id,
      state: regulatoryRuleLaneImpacts.state,
      title: regulatoryRules.title,
      summary: regulatoryRules.summary,
      publisher: regulatoryPublishers.name,
      canonicalUrl: regulatorySources.canonicalUrl,
      reviewedAt: regulatorySources.reviewedAt,
      nextReviewAt: regulatorySources.nextReviewAt
    }).from(regulatoryRuleLaneImpacts)
      .innerJoin(regulatoryRules, eq(regulatoryRules.id, regulatoryRuleLaneImpacts.regulatoryRuleId))
      .innerJoin(regulatorySources, eq(regulatorySources.id, regulatoryRules.sourceId))
      .innerJoin(regulatoryPublishers, eq(regulatoryPublishers.id, regulatorySources.publisherId))
      .where(and(
        eq(regulatoryRuleLaneImpacts.organizationId, context.organizationId),
        eq(regulatoryRuleLaneImpacts.exportLaneId, lane.lane.id)
      ))
      .orderBy(desc(regulatoryRuleLaneImpacts.detectedAt), desc(regulatoryRuleLaneImpacts.id))
      .limit(25)
  ]);
  return {
    id: lane.lane.id,
    version: lane.lane.version,
    productName: lane.product.name,
    sku: displaySku(lane.product.sku),
    hsCode: lane.product.hsCode,
    originCountryCode: lane.lane.originCountryCode,
    destinationCountryCode: lane.lane.destinationCountryCode,
    salesChannel: lane.lane.salesChannel,
    buyerSegment: lane.lane.buyerSegment,
    route: lane.lane.route,
    incoterm: lane.lane.incoterm,
    status: lane.lane.status,
    health: lane.lane.health,
    stage: lane.lane.stage,
    targetMarginBps: lane.lane.targetMarginBps,
    currency: lane.lane.currency,
    readinessScore: assessment?.score ?? null,
    tasks: taskRows.map((task) => dashboardTask(task, context)),
    regulatoryImpacts: impactRows.map((impact) => ({
      ...impact,
      reviewedAt: impact.reviewedAt.toISOString(),
      nextReviewAt: impact.nextReviewAt.toISOString()
    })),
    updatedAt: lane.lane.updatedAt.toISOString()
  };
}

function dashboardTask(task: typeof tasks.$inferSelect, context: TenantContext): WorkspaceDashboardTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    responsibility: task.responsibility,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString() ?? null,
    ownerLabel: task.ownerId === context.actorId ? "You" : task.responsibility === "export_hq" ? "Export HQ" : "Workspace member",
    exportLaneId: task.exportLaneId,
    relatedEntityType: task.relatedEntityType,
    version: task.version
  };
}

function boundedLimit(value: number | undefined, fallback: number): number {
  return Math.min(100, Math.max(1, Math.floor(value ?? fallback)));
}

function displaySku(value: string): string {
  return value.startsWith("EXPORTHQ-PRIMARY-") ? "" : value;
}

function humanizeAction(value: string): string {
  const normalized = value.replaceAll("_", " ").replaceAll(".", " · ");
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}
