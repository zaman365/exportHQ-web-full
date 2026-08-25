import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import DecisionsClient from "./decisions-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Decisions — Export HQ",
  description: "An explainable decision register for TREVV work."
};

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const session = await requireWorkspaceFeature("decisions");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="decisions" session={session}><DecisionsClient canManage={canManage} /></WorkspaceShell>;
}
