export type Permission =
  | "company:view"
  | "company:manage"
  | "products:view"
  | "products:manage"
  | "compliance:view"
  | "compliance:manage"
  | "documents:view"
  | "documents:manage"
  | "readiness:view"
  | "readiness:manage"
  | "tasks:view"
  | "tasks:manage"
  | "email:view"
  | "email:send"
  | "email:manage"
  | "team:view"
  | "team:message"
  | "team:manage"
  | "billing:manage";

export type SubscriptionTier = "preview" | "explore" | "launch" | "scale" | "managed";
export type BusinessVerificationStatus = "unverified" | "pending" | "verified";
export type TrustGatedAccess = "public" | "member" | "full";
export type MarketIntelligenceAccess = TrustGatedAccess;
export type ReadinessAccess = TrustGatedAccess;
export type WorkspaceFeatureAccess = "full" | "preview" | "locked";
export type OrganizationAccessRole =
  | "owner"
  | "admin"
  | "executive"
  | "department_lead"
  | "manager"
  | "member"
  | "viewer"
  | "external";

export type WorkspaceFeature =
  | "home"
  | "learning"
  | "settings"
  | "onboarding"
  | "plans"
  | "inbox"
  | "my-work"
  | "waiting"
  | "decisions"
  | "ideas"
  | "create"
  | "products"
  | "documents"
  | "readiness"
  | "requirements"
  | "attention"
  | "blueprints"
  | "team"
  | "markets"
  | "opportunities"
  | "export-studio"
  | "buyers"
  | "integrations"
  | "audit"
  | "export"
  | "managed-services";

export interface SubscriptionDefinition {
  id: SubscriptionTier;
  name: string;
  summary: string;
  features: readonly WorkspaceFeature[];
}

const previewFeatures = [
  "home",
  "learning",
  "plans",
  "readiness",
  "markets",
  "opportunities",
  "export-studio"
] as const satisfies readonly WorkspaceFeature[];
const exploreFeatures = [
  ...previewFeatures,
  "settings",
  "onboarding"
] as const satisfies readonly WorkspaceFeature[];
const launchFeatures = [
  ...exploreFeatures,
  "inbox",
  "my-work",
  "waiting",
  "decisions",
  "ideas",
  "create",
  "products",
  "documents",
  "requirements"
] as const satisfies readonly WorkspaceFeature[];
const scaleFeatures = [
  ...launchFeatures,
  "attention",
  "blueprints",
  "team",
  "markets",
  "opportunities",
  "buyers",
  "integrations",
  "audit",
  "export"
] as const satisfies readonly WorkspaceFeature[];

const subscriptionTierOrder = ["preview", "explore", "launch", "scale", "managed"] as const satisfies readonly SubscriptionTier[];

/**
 * These modules can safely expose curated sample records without exposing
 * organization data or enabling mutations. Public visitors receive the
 * smallest useful operating-system tour; signed-in Basic members can explore
 * a few more workflows before choosing a plan.
 */
const publicFeaturePreviews = new Set<WorkspaceFeature>([
  "attention",
  "inbox",
  "my-work",
  "waiting",
  "blueprints",
  "decisions"
]);

const memberFeaturePreviews = new Set<WorkspaceFeature>([
  ...publicFeaturePreviews,
  "ideas",
  "create",
  "team"
]);

export const subscriptionCatalog: Readonly<Record<SubscriptionTier, SubscriptionDefinition>> = {
  preview: {
    id: "preview",
    name: "Preview",
    summary: "A safe, read-only tour of ExportPanel's operating model.",
    features: previewFeatures
  },
  explore: {
    id: "explore",
    name: "Basic",
    summary: "A signed-in starting point for one Export Lane, readiness, economics, and onboarding.",
    features: exploreFeatures
  },
  launch: {
    id: "launch",
    name: "Launch",
    summary: "Core readiness, evidence, decisions, and personal execution for a first market.",
    features: launchFeatures
  },
  scale: {
    id: "scale",
    name: "Scale",
    summary: "Cross-project attention, reusable workflows, team coordination, and portfolio controls.",
    features: scaleFeatures
  },
  managed: {
    id: "managed",
    name: "Managed",
    summary: "The complete workspace plus accountable Export HQ specialist execution.",
    features: [...scaleFeatures, "managed-services"]
  }
};

const permissionCatalog: Readonly<Record<SubscriptionTier, readonly Permission[]>> = {
  preview: [],
  explore: ["company:view", "readiness:view", "readiness:manage"],
  launch: [
    "company:view", "company:manage", "products:view", "products:manage",
    "compliance:view", "documents:view", "documents:manage", "readiness:view", "readiness:manage", "tasks:view", "tasks:manage",
    "email:view", "email:send", "email:manage"
  ],
  scale: [
    "company:view", "company:manage", "products:view", "products:manage",
    "compliance:view", "compliance:manage", "documents:view", "documents:manage",
    "readiness:view", "readiness:manage", "tasks:view", "tasks:manage", "email:view", "email:send", "email:manage",
    "team:view", "team:message", "team:manage", "billing:manage"
  ],
  managed: [
    "company:view", "company:manage", "products:view", "products:manage",
    "compliance:view", "compliance:manage", "documents:view", "documents:manage",
    "readiness:view", "readiness:manage", "tasks:view", "tasks:manage", "email:view", "email:send", "email:manage",
    "team:view", "team:message", "team:manage", "billing:manage"
  ]
};

export function featuresForTier(tier: SubscriptionTier): readonly WorkspaceFeature[] {
  return subscriptionCatalog[tier].features;
}

export function minimumTierForFeature(feature: WorkspaceFeature): SubscriptionTier {
  return subscriptionTierOrder.find((tier) => subscriptionCatalog[tier].features.includes(feature)) ?? "managed";
}

export function resolveWorkspaceFeatureAccess(input: {
  authenticated: boolean;
  feature: WorkspaceFeature;
  tier: SubscriptionTier;
}): WorkspaceFeatureAccess {
  if (subscriptionCatalog[input.tier].features.includes(input.feature)) return "full";
  if (input.authenticated && memberFeaturePreviews.has(input.feature)) return "preview";
  if (!input.authenticated && publicFeaturePreviews.has(input.feature)) return "preview";
  return "locked";
}

export function permissionsForTier(tier: SubscriptionTier): ReadonlySet<Permission> {
  return new Set(permissionCatalog[tier]);
}

/**
 * Mailbox limits are deliberately independent from route visibility. Everyone
 * can understand the Email Inbox from a redacted preview; paid organizations
 * can connect accounts, with wider team coverage at Scale and Managed.
 */
export function emailAccountLimitForTier(tier: SubscriptionTier): number {
  if (tier === "launch") return 1;
  if (tier === "scale") return 5;
  if (tier === "managed") return 12;
  return 0;
}

function normalizeOrganizationAccessRole(role: string | null | undefined): OrganizationAccessRole {
  const normalized = role?.replace(/^org:/, "") ?? "member";
  if (
    normalized === "owner" ||
    normalized === "admin" ||
    normalized === "executive" ||
    normalized === "department_lead" ||
    normalized === "manager" ||
    normalized === "viewer" ||
    normalized === "external"
  ) {
    return normalized;
  }
  return "member";
}

/**
 * Resolves a person's effective organization permissions without ever
 * exceeding the subscription ceiling. Owners/admins receive the plan ceiling;
 * every other role receives the smallest useful default set. Explicit Clerk
 * grants replace those defaults and are still intersected with the plan.
 */
export function permissionsForOrganizationRole(input: {
  tier: SubscriptionTier;
  role: string | null | undefined;
  explicitPermissions?: readonly string[] | null | undefined;
}): ReadonlySet<Permission> {
  const ceiling = permissionsForTier(input.tier);
  const role = normalizeOrganizationAccessRole(input.role);
  if (role === "owner" || role === "admin") return ceiling;

  const explicit = new Set(
    (input.explicitPermissions ?? [])
      .map((permission) => permission.replace(/^org:/, ""))
      .filter((permission): permission is Permission => ceiling.has(permission as Permission))
  );
  if (explicit.size) return explicit;
  if (role === "external") return new Set();

  const deniedByRole: Readonly<Record<Exclude<OrganizationAccessRole, "owner" | "admin" | "external">, ReadonlySet<Permission>>> = {
    executive: new Set(["billing:manage", "team:manage"]),
    department_lead: new Set(["billing:manage", "team:manage", "company:manage", "email:manage"]),
    manager: new Set(["billing:manage", "team:manage", "company:manage", "compliance:manage", "products:manage", "email:manage"]),
    member: new Set([
      "billing:manage", "team:manage", "company:manage", "compliance:manage",
      "products:manage", "documents:manage", "readiness:manage", "email:manage"
    ]),
    viewer: new Set([...ceiling].filter((permission) => !permission.endsWith(":view")))
  };

  return new Set([...ceiling].filter((permission) => !deniedByRole[role].has(permission)));
}

export function tierHasFeature(tier: SubscriptionTier, feature: WorkspaceFeature): boolean {
  return subscriptionCatalog[tier].features.includes(feature);
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === "launch" || tier === "scale" || tier === "managed";
}

/**
 * Market intelligence uses a value-led access ladder independent of the wider
 * workspace tier. Signing in reveals ranked detail; either a verified business
 * or any paid organization plan unlocks the evidence and action layer.
 */
export function resolveTrustGatedAccess(input: {
  authenticated: boolean;
  businessVerification: BusinessVerificationStatus;
  tier: SubscriptionTier;
}): TrustGatedAccess {
  if (!input.authenticated) return "public";
  if (input.businessVerification === "verified" || isPaidTier(input.tier)) return "full";
  return "member";
}

export function resolveMarketIntelligenceAccess(input: {
  authenticated: boolean;
  businessVerification: BusinessVerificationStatus;
  tier: SubscriptionTier;
}): MarketIntelligenceAccess {
  return resolveTrustGatedAccess(input);
}

export function resolveReadinessAccess(input: {
  authenticated: boolean;
  businessVerification: BusinessVerificationStatus;
  tier: SubscriptionTier;
}): ReadinessAccess {
  return resolveTrustGatedAccess(input);
}

export interface CustomerPrincipal {
  kind: "customer";
  userId: string;
  organizationId: string;
  permissions: ReadonlySet<Permission>;
}

export interface StaffPrincipal {
  kind: "staff";
  userId: string;
  globalPermissions: ReadonlySet<"customers:view" | "customers:manage" | "platform:admin">;
  grants: ReadonlyArray<{
    organizationId: string;
    permissions: ReadonlySet<Permission>;
    expiresAt: Date;
    revokedAt?: Date;
  }>;
}

export type Principal = CustomerPrincipal | StaffPrincipal;

export class AuthorizationError extends Error {
  constructor() {
    super("You do not have access to this organization resource.");
    this.name = "AuthorizationError";
  }
}

export function canAccessOrganization(
  principal: Principal,
  organizationId: string,
  permission: Permission,
  now = new Date()
): boolean {
  if (principal.kind === "customer") {
    return principal.organizationId === organizationId && principal.permissions.has(permission);
  }

  if (principal.globalPermissions.has("platform:admin")) return true;
  const grant = principal.grants.find(
    (candidate) =>
      candidate.organizationId === organizationId &&
      !candidate.revokedAt &&
      candidate.expiresAt.getTime() > now.getTime()
  );
  return Boolean(grant?.permissions.has(permission));
}

export function authorizeOrganization(
  principal: Principal,
  organizationId: string,
  permission: Permission,
  now?: Date
): void {
  if (!canAccessOrganization(principal, organizationId, permission, now)) {
    throw new AuthorizationError();
  }
}

export function scopeRows<T extends { organizationId: string }>(
  principal: Principal,
  rows: readonly T[],
  permission: Permission,
  now?: Date
): T[] {
  return rows.filter((row) => canAccessOrganization(principal, row.organizationId, permission, now));
}
