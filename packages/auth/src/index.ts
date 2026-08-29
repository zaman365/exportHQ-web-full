import { createClerkClient } from "@clerk/backend";
import { isDemoModeEnabled, isProductionRuntime } from "@exporthq/platform";
import {
  featuresForTier,
  permissionsForOrganizationRole,
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
  "readiness:view", "readiness:manage",
  "tasks:view", "tasks:manage", "email:view", "email:send", "email:manage",
  "team:view", "team:message", "team:manage", "billing:manage"
];

/* Demo identity is a preview adapter. `isDemoModeEnabled` is the single place
   that decides what production means, so this can never be true on a
   production deployment regardless of how the variable is set. */
function isDemoMode() {
  return isDemoModeEnabled();
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
  isPlatformAdmin: boolean;
  /** PostgreSQL-authoritative organization defaults. A browser may override
   * locale/low-data presentation for one signed-in person. */
  locale?: "bn" | "en";
  defaultCurrency?: string;
  defaultTimezone?: string;
  lowDataMode?: boolean;
  configurationMessage?: string;
}

type ExportPanelOrganizationMetadata = {
  exportPanel?: {
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
    : ["https://export-hq.com", "http://localhost:3001"];
}

function normalizedEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function isPlatformAdministratorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const administrators = process.env.EXPORTHQ_PLATFORM_ADMIN_EMAILS
    ?.split(",")
    .map(normalizedEmail)
    .filter(Boolean) ?? [];
  return administrators.includes(normalizedEmail(email));
}

export function isApprovedStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isPlatformAdministratorEmail(email)) return true;
  const staff = process.env.EXPORTHQ_STAFF_EMAILS
    ?.split(",")
    .map(normalizedEmail)
    .filter(Boolean) ?? [];
  return staff.includes(normalizedEmail(email));
}

function hasStrongStaffAuthentication(claims: unknown): boolean {
  if (typeof claims !== "object" || claims === null) return false;
  const record = claims as Record<string, unknown>;
  if (record.mfa_verified === true || record.acr === "aal2") return true;
  return Array.isArray(record.amr) && record.amr.some((method) => method === "mfa" || method === "otp");
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
    isDemo: true,
    isPlatformAdmin: true,
    locale: "en",
    defaultCurrency: "USD",
    defaultTimezone: "Asia/Dhaka",
    lowDataMode: false
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
      isPlatformAdmin: false,
      configurationMessage: "Production sign-in is awaiting Clerk activation."
    };
  }

  const client = createClerkClient(configuration);
  const state = await client.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: configuredAuthorizedParties(),
    signInUrl: "/ExportPanel/sign-in",
    signUpUrl: "/ExportPanel/sign-up",
    afterSignInUrl: "/ExportPanel",
    afterSignUpUrl: "/ExportPanel/onboarding"
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
      isDemo: false,
      isPlatformAdmin: false
    };
  }

  const auth = state.toAuth();
  const userId = auth.userId;
  const organizationId = auth.orgId;
  const userPromise = client.users.getUser(userId);

  if (!organizationId) {
    const user = await userPromise;
    const userEmail = user.primaryEmailAddress?.emailAddress ?? null;
    const isPlatformAdmin = isPlatformAdministratorEmail(userEmail);
    return {
      status: "needs-organization",
      userId,
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "ExportPanel member",
      userEmail,
      tier: isPlatformAdmin ? "managed" : "explore",
      businessVerification: isPlatformAdmin ? "verified" : "unverified",
      features: featuresForTier(isPlatformAdmin ? "managed" : "explore"),
      principal: null,
      isDemo: false,
      isPlatformAdmin
    };
  }

  const [user, organization] = await Promise.all([
    userPromise,
    client.organizations.getOrganization({ organizationId })
  ]);
  const metadata = organization.publicMetadata as ExportPanelOrganizationMetadata;
  const onboardingComplete = metadata.exportPanel?.onboardingComplete === true;
  const userEmail = user.primaryEmailAddress?.emailAddress ?? null;
  const isPlatformAdmin = isPlatformAdministratorEmail(userEmail);
  const businessVerification = isPlatformAdmin
    ? "verified"
    : businessVerificationStatus(metadata.exportPanel?.businessVerification);
  const tier = isPlatformAdmin ? "managed" : resolveTier(auth.has);
  const principal: CustomerPrincipal = {
    kind: "customer",
    userId,
    organizationId,
    permissions: isPlatformAdmin
      ? permissionsForTier("managed")
      : permissionsForOrganizationRole({
          tier,
          role: auth.orgRole,
          explicitPermissions: auth.orgPermissions
        })
  };

  return {
    status: onboardingComplete || isPlatformAdmin ? "active" : "needs-onboarding",
    userId,
    organizationId,
    organizationName: organization.name,
    organizationRole: isPlatformAdmin ? "org:admin" : auth.orgRole ?? null,
    userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "ExportPanel member",
    userEmail,
    tier,
    businessVerification,
    features: featuresForTier(tier),
    principal,
    isDemo: false,
    isPlatformAdmin
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
  const user = await client.users.getUser(session.userId);
  const email = user.primaryEmailAddress?.emailAddress;
  const isPlatformAdmin = isPlatformAdministratorEmail(email);
  if (!isApprovedStaffEmail(email)) throw new Error("Staff authentication is required.");
  if (
    isProductionRuntime()
    && process.env.EXPORTHQ_OPS_REQUIRE_MFA !== "false"
    && !hasStrongStaffAuthentication(session.sessionClaims)
  ) {
    throw new Error("Strong authentication is required for operations access.");
  }
  return {
    kind: "staff",
    userId: session.userId,
    globalPermissions: isPlatformAdmin
      ? new Set(["customers:view", "customers:manage", "platform:admin"] as const)
      : new Set(),
    grants: []
  };
}
