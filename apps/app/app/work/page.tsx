import type { Metadata } from "next";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
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
  if (session.userId && !session.isDemo) return <WorkspaceShell active="work" session={session}><TenantSurfacePending phase="R1 migration" title="Use the authoritative Waiting queue" description="Personal work remains preview-only until it reads the same versioned tenant tasks and approved blueprint runs without local records." /></WorkspaceShell>;
  const { default: MyWorkClient } = await import("./work-client");
  return (
    <WorkspaceShell active="work" session={session}>
      <MyWorkClient canManage={canManage} />
    </WorkspaceShell>
  );
}
