import type { Metadata } from "next";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import MyWorkClient from "./work-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "My Work — Export HQ",
  description: "A risk-aware personal work plan for ExportPanel.",
};

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const session = await requireWorkspaceFeature("my-work");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(
    principal,
    principal.organizationId,
    "tasks:manage",
  );
  return (
    <WorkspaceShell active="work" session={session}>
      <MyWorkClient canManage={canManage} />
    </WorkspaceShell>
  );
}
