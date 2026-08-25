import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import CreateClient from "./create-client";

export const metadata: Metadata = {
  title: "Create — Export HQ",
  description: "Create the right TREVV workflow record from one place."
};

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="create"><CreateClient canManage={canManage} /></WorkspaceShell>;
}
