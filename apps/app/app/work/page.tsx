import type { Metadata } from "next";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import MyWorkClient from "./work-client";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "My Work — Export HQ",
  description: "A risk-aware personal work plan for ExportPanel.",
};

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const session = await getProgressiveWorkspaceFeatureSession("my-work");
  const principal = session.principal;
  const fullAccess = session.features.includes("my-work");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  return (
    <WorkspaceShell active="work" session={session}>
      <MyWorkClient canManage={canManage} />
    </WorkspaceShell>
  );
}
