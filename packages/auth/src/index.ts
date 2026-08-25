import { createClerkClient } from "@clerk/backend";
import {
  featuresForTier,
  permissionsForTier,
  type CustomerPrincipal,
  type BusinessVerificationStatus,
  type Permission,
  type StaffPrincipal,
  type SubscriptionTier,
  type WorkspaceFeature
} from "@exporthq/authorization";

const ownerPermissions: Permission[] = [
  "company:view", "company:manage", "products:view", "products:manage",
  "compliance:view", "compliance:manage", "documents:view", "documents:manage",
  "tasks:view", "tasks:manage", "team:manage", "billing:manage"
];

function isDemoMode() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.EXPORTHQ_DEMO_MODE !== "false"
  );
}

export type CustomerSessionStatus =
  | "signed-out"
  | "needs-organization"
  | "needs-onboarding"
  | "active"
  | "misconfigured";

export interface CustomerSession {
  status: CustomerSessionStatus;
  userId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationRole: string | null;
  userName: string | null;
  userEmail: string | null;
  tier: SubscriptionTier;
  businessVerification: BusinessVerificationStatus;
  features: readonly WorkspaceFeature[];
  principal: CustomerPrincipal | null;
  isDemo: boolean;
  configurationMessage?: string;
}

type TrevvOrganizationMetadata = {
  trevv?: {
    onboardingComplete?: boolean;
    businessVerification?: BusinessVerificationStatus;
  };
};

function businessVerificationStatus(value: unknown): BusinessVerificationStatus {
  return value === "verified" || value === "pending" ? value : "unverified";
}

function configuredAuthorizedParties(): string[] {
  const configured = process.env.EXPORTHQ_AUTHORIZED_PARTIES
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured?.length
    ? configured
    : ["https://trevv.export-hq.com", "http://localhost:3001"];
}

function clerkConfiguration() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return null;
  const jwtKey = process.env.CLERK_JWT_KEY;
  return { secretKey, publishableKey, ...(jwtKey ? { jwtKey } : {}) };
}

export function isClerkConfigured(): boolean {
  return Boolean(clerkConfiguration());
}

export function getClerkClient() {
  const configuration = clerkConfiguration();
  if (!configuration) {
    throw new Error("Clerk is not configured. CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are required.");
  }
  return createClerkClient(configuration);
}

function resolveTier(has: (params: { plan: string }) => boolean): SubscriptionTier {
  if (has({ plan: "managed" })) return "managed";
  if (has({ plan: "scale" })) return "scale";
  if (has({ plan: "launch" })) return "launch";
  return "explore";
}

function roleScopedPermissions(
  tier: SubscriptionTier,
  role: string | null | undefined,
  clerkPermissions: readonly string[] | null | undefined
): ReadonlySet<Permission> {
  const ceiling = permissionsForTier(tier);
  const normalizedRole = role?.replace(/^org:/, "") ?? "member";
  if (normalizedRole === "admin" || normalizedRole === "owner") return ceiling;

  const explicit = new Set(
    (clerkPermissions ?? [])
      .map((permission) => permission.replace(/^org:/, ""))
      .filter((permission): permission is Permission => ceiling.has(permission as Permission))
  );
  if (explicit.size) return explicit;

  return new Set(
    [...ceiling].filter((permission) => {
      if (normalizedRole === "viewer") return permission.endsWith(":view");
      return permission !== "billing:manage" && permission !== "team:manage";
    })
  );
}

function demoCustomerSession(): CustomerSession {
  const principal: CustomerPrincipal = {
    kind: "customer",
    userId: process.env.EXPORTHQ_DEMO_USER_ID ?? "user_demo_owner",
    organizationId: process.env.EXPORTHQ_DEMO_ORGANIZATION_ID ?? "org_abc_textiles",
    permissions: new Set(ownerPermissions)
  };
  return {
    status: "active",
    userId: principal.userId,
    organizationId: principal.organizationId,
    organizationName: "ABC Textiles",
    organizationRole: "org:admin",
    userName: "Nadia Rahman",
    userEmail: "nadia@example.com",
    tier: "managed",
    businessVerification: "verified",
    features: featuresForTier("managed"),
    principal,
    isDemo: true
  };
}

export async function resolveCustomerSession(request: Request): Promise<CustomerSession> {
  if (isDemoMode()) return demoCustomerSession();

  const configuration = clerkConfiguration();
  if (!configuration) {
    return {
      status: "misconfigured",
      userId: null,
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      userName: null,
      userEmail: null,
      tier: "preview",
      businessVerification: "unverified",
      features: featuresForTier("preview"),
      principal: null,
      isDemo: false,
      configurationMessage: "Production sign-in is awaiting Clerk activation."
    };
  }

  const client = createClerkClient(configuration);
  const state = await client.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: configuredAuthorizedParties(),
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    afterSignInUrl: "/",
    afterSignUpUrl: "/onboarding"
  });
  if (!state.isAuthenticated) {
    return {
      status: "signed-out",
      userId: null,
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      userName: null,
      userEmail: null,
      tier: "preview",
      businessVerification: "unverified",
      features: featuresForTier("preview"),
      principal: null,
      isDemo: false
    };
  }

  const auth = state.toAuth();
  const userId = auth.userId;
  const organizationId = auth.orgId;
  const userPromise = client.users.getUser(userId);

  if (!organizationId) {
    const user = await userPromise;
    return {
      status: "needs-organization",
      userId,
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "TREVV member",
      userEmail: user.primaryEmailAddress?.emailAddress ?? null,
      tier: "explore",
      businessVerification: "unverified",
      features: featuresForTier("explore"),
      principal: null,
      isDemo: false
    };
  }

  const [user, organization] = await Promise.all([
    userPromise,
    client.organizations.getOrganization({ organizationId })
  ]);
  const metadata = organization.publicMetadata as TrevvOrganizationMetadata;
  const onboardingComplete = metadata.trevv?.onboardingComplete === true;
  const businessVerification = businessVerificationStatus(metadata.trevv?.businessVerification);
  const tier = resolveTier(auth.has);
  const principal: CustomerPrincipal = {
    kind: "customer",
    userId,
    organizationId,
    permissions: roleScopedPermissions(tier, auth.orgRole, auth.orgPermissions)
  };

  return {
    status: onboardingComplete ? "active" : "needs-onboarding",
    userId,
    organizationId,
    organizationName: organization.name,
    organizationRole: auth.orgRole ?? null,
    userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "TREVV member",
    userEmail: user.primaryEmailAddress?.emailAddress ?? null,
    tier,
    businessVerification,
    features: featuresForTier(tier),
    principal,
    isDemo: false
  };
}

export async function getCustomerPrincipal(request?: Request): Promise<CustomerPrincipal> {
  const session = request ? await resolveCustomerSession(request) : isDemoMode() ? demoCustomerSession() : null;
  if (!session?.principal) {
    throw new Error("getCustomerPrincipal requires an authenticated request in production.");
  }
  return session.principal;
}

export async function getStaffPrincipal(request?: Request): Promise<StaffPrincipal> {
  if (isDemoMode()) {
    return {
      kind: "staff",
      userId: "staff_demo_anna",
      globalPermissions: new Set(["customers:view"]),
      grants: [{
        organizationId: process.env.EXPORTHQ_DEMO_ORGANIZATION_ID ?? "org_abc_textiles",
        permissions: new Set(ownerPermissions),
        expiresAt: new Date("2099-01-01")
      }]
    };
  }

  if (!request) throw new Error("getStaffPrincipal requires an authenticated request in production.");
  const client = getClerkClient();
  const state = await client.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: configuredAuthorizedParties()
  });
  if (!state.isAuthenticated) throw new Error("Staff authentication is required.");
  const session = state.toAuth();
  return { kind: "staff", userId: session.userId, globalPermissions: new Set(), grants: [] };
}
