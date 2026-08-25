import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import IdeasClient from "./ideas-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Ideas — Export HQ",
  description: "Capture, triage, and promote TREVV opportunities."
};

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const session = await requireWorkspaceFeature("ideas");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="ideas" session={session}><IdeasClient canManage={canManage} /></WorkspaceShell>;
}
