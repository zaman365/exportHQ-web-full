export type MeteredCapability = "active_lane" | "editor" | "storage_byte" | "automation_unit" | "work_pack";

export interface PlanLimit {
  readonly capability: MeteredCapability;
  readonly included: number;
  readonly overageUnitSize: number;
  readonly overageUnitPriceMinor: number;
}

export interface UsageProjection extends PlanLimit {
  readonly used: number;
  readonly projected: number;
  readonly remaining: number;
  readonly projectedOverage: number;
  readonly projectedChargeMinor: number;
}

export function projectPlanUsage(
  limits: readonly PlanLimit[],
  actual: Readonly<Partial<Record<MeteredCapability, number>>>,
  projected: Readonly<Partial<Record<MeteredCapability, number>>> = {}
): UsageProjection[] {
  const required = new Set<MeteredCapability>(["active_lane", "editor", "storage_byte", "automation_unit", "work_pack"]);
  if (limits.length !== required.size || limits.some((limit) => !required.delete(limit.capability)) || required.size) {
    throw new Error("Every plan must define each metered capability exactly once.");
  }
  return limits.map((limit) => {
    for (const [label, value] of [["included", limit.included], ["overage unit size", limit.overageUnitSize], ["overage price", limit.overageUnitPriceMinor]] as const) {
      if (!Number.isSafeInteger(value) || value < 0 || (label === "overage unit size" && value === 0)) throw new Error(`Plan ${label} must be an explicit non-negative integer.`);
    }
    const used = count(actual[limit.capability] ?? 0, "Usage");
    const forecast = Math.max(used, count(projected[limit.capability] ?? used, "Projected usage"));
    const projectedOverage = Math.max(0, forecast - limit.included);
    return {
      ...limit,
      used,
      projected: forecast,
      remaining: Math.max(0, limit.included - used),
      projectedOverage,
      projectedChargeMinor: Math.ceil(projectedOverage / limit.overageUnitSize) * limit.overageUnitPriceMinor
    };
  });
}

export type ProviderCaseStatus = "draft" | "awaiting_acceptance" | "accepted" | "introduced" | "in_progress" | "completed" | "disputed" | "cancelled";

const providerCaseTransitions: Readonly<Record<ProviderCaseStatus, readonly ProviderCaseStatus[]>> = {
  draft: ["awaiting_acceptance", "cancelled"],
  awaiting_acceptance: ["accepted", "cancelled"],
  accepted: ["introduced", "cancelled"],
  introduced: ["in_progress", "disputed", "cancelled"],
  in_progress: ["completed", "disputed", "cancelled"],
  completed: ["disputed"],
  disputed: ["in_progress", "completed", "cancelled"],
  cancelled: []
};

export function assertProviderCaseTransition(from: ProviderCaseStatus, to: ProviderCaseStatus): void {
  if (!providerCaseTransitions[from].includes(to)) throw new Error(`Provider case cannot move from ${from} to ${to}.`);
}

export function assertProviderDisclosure(input: {
  readonly feeDisclosure: string;
  readonly commissionDisclosure: string;
  readonly commercialRelationship: string;
  readonly rankingBasis: string;
}): void {
  for (const [label, value] of Object.entries(input)) {
    if (!value.trim()) throw new Error(`Provider ${label.replaceAll(/([A-Z])/g, " $1").toLowerCase()} is required.`);
    if (/hidden|undisclosed/i.test(value)) throw new Error("Provider commercial terms and ranking basis must be explicit.");
  }
}

export type GuestPurpose = "buyer_review" | "forwarder_handoff" | "cf_clearance" | "inspection_review";

export function authorizeGuestResource(input: {
  readonly grantStatus: "pending" | "active" | "revoked" | "expired";
  readonly expiresAt: Date;
  readonly grantedResourceType: string;
  readonly grantedResourceId: string;
  readonly requestedResourceType: string;
  readonly requestedResourceId: string;
  readonly now?: Date;
}): void {
  const now = input.now ?? new Date();
  if (input.grantStatus !== "active" || input.expiresAt.getTime() <= now.getTime()) throw new Error("Guest grant is not active.");
  if (input.grantedResourceType !== input.requestedResourceType || input.grantedResourceId !== input.requestedResourceId) {
    throw new Error("Guest grant does not cover the requested resource.");
  }
}

export const publicBetaPerformanceBudgets = {
  initialJavaScriptGzip: 250_000,
  initialCssGzip: 180_000,
  routeData: 100_000,
  largestImage: 300_000,
  lowEndAndroidLcp: 3_500,
  constrainedNetworkTti: 5_000
} as const;

export function assessPerformanceBudget(measurements: Partial<Record<keyof typeof publicBetaPerformanceBudgets, number>>): string[] {
  return Object.entries(publicBetaPerformanceBudgets).flatMap(([key, ceiling]) => {
    const value = measurements[key as keyof typeof publicBetaPerformanceBudgets];
    if (value == null) return [`${key}:missing`];
    if (!Number.isFinite(value) || value < 0) return [`${key}:invalid`];
    return value > ceiling ? [`${key}:exceeded`] : [];
  });
}

function count(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}
