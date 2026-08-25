import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import IdeasClient from "./ideas-client";

export const metadata: Metadata = {
  title: "Ideas — Export HQ",
  description: "Capture, triage, and promote TREVV opportunities."
};

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="ideas"><IdeasClient canManage={canManage} /></WorkspaceShell>;
}
