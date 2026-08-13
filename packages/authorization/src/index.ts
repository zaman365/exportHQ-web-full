export type Permission =
  | "company:view"
  | "company:manage"
  | "products:view"
  | "products:manage"
  | "compliance:view"
  | "compliance:manage"
  | "documents:view"
  | "documents:manage"
  | "tasks:view"
  | "tasks:manage"
  | "team:manage"
  | "billing:manage";

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
