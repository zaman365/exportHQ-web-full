import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { subscriptionCatalog } from "@exporthq/authorization";
import SettingsClient from "./settings-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Settings — Export HQ",
  description: "Manage your Export HQ workspace settings."
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireWorkspaceFeature("home");
  const principal = session.principal;
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
      features={session.features}
      authEnabled={!session.isDemo}
      userName={session.userName ?? "TREVV member"}
      organizationName={session.organizationName ?? "Your business"}
      tierName={subscriptionCatalog[session.tier].name}
    />
  );
}
