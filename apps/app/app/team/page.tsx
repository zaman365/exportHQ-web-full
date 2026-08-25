import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import TeamClient from "./team-client";

export const metadata: Metadata = {
  title: "Team — Export HQ",
  description: "Ownership, capacity, specialists, and partners in TREVV."
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "company:view");
  const canManageAccess = canAccessOrganization(principal, principal.organizationId, "team:manage");
  return <WorkspaceShell active="team"><TeamClient canManageAccess={canManageAccess} /></WorkspaceShell>;
}
