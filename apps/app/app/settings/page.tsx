import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Settings — Export HQ",
  description: "Manage your Export HQ workspace settings."
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "company:view");

  const canManageOrganization = canAccessOrganization(
    principal,
    principal.organizationId,
    "company:manage"
  );
  const canManageTeam = canAccessOrganization(
    principal,
    principal.organizationId,
    "team:manage"
  );

  return (
    <SettingsClient
      canManageOrganization={canManageOrganization}
      canManageTeam={canManageTeam}
    />
  );
}
