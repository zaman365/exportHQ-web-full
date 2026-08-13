import type { CustomerPrincipal, Permission, StaffPrincipal } from "@exporthq/authorization";

const ownerPermissions: Permission[] = [
  "company:view", "company:manage", "products:view", "products:manage",
  "compliance:view", "compliance:manage", "documents:view", "documents:manage",
  "tasks:view", "tasks:manage", "team:manage", "billing:manage"
];

function isDemoMode() {
  return process.env.NODE_ENV !== "production" && process.env.EXPORTHQ_DEMO_MODE !== "false";
}

export async function getCustomerPrincipal(): Promise<CustomerPrincipal> {
  if (isDemoMode()) {
    return {
      kind: "customer",
      userId: process.env.EXPORTHQ_DEMO_USER_ID ?? "user_demo_owner",
      organizationId: process.env.EXPORTHQ_DEMO_ORGANIZATION_ID ?? "org_abc_textiles",
      permissions: new Set(ownerPermissions)
    };
  }

  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required in production.");
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  if (!session.userId || !session.orgId) throw new Error("Authentication and an active organization are required.");

  // Membership permissions are resolved from the synchronized membership table by
  // the application service. This minimal boundary denies permissions until then.
  return { kind: "customer", userId: session.userId, organizationId: session.orgId, permissions: new Set() };
}

export async function getStaffPrincipal(): Promise<StaffPrincipal> {
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

  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required in production.");
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  if (!session.userId) throw new Error("Staff authentication is required.");
  return { kind: "staff", userId: session.userId, globalPermissions: new Set(), grants: [] };
}
