import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import DecisionsClient from "./decisions-client";

export const metadata: Metadata = {
  title: "Decisions — Export HQ",
  description: "An explainable decision register for TREVV work."
};

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="decisions"><DecisionsClient canManage={canManage} /></WorkspaceShell>;
}
