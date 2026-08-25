import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import BlueprintsClient from "./blueprints-client";

export const metadata: Metadata = {
  title: "Blueprints — Export HQ",
  description: "Reusable TREVV workflows for repeatable export operations."
};

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="blueprints"><BlueprintsClient canManage={canManage} /></WorkspaceShell>;
}
