import type { Metadata } from "next";
import { authorizeOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Requirements — Export HQ",
  description: "A source-aware requirement and evidence register for the active Export Lane."
};

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const session = await getWorkspaceFeatureSession("requirements");
  if (session.principal) authorizeOrganization(session.principal, session.principal.organizationId, "compliance:view");
  if (session.userId && !session.isDemo) return <WorkspaceShell active="requirements" session={session}><TenantSurfacePending phase="R1 migration" title="Use lane readiness and reviewed impacts" description="The standalone register remains hidden until every row comes from the reviewed publisher model or tenant evidence state. Current tenant requirements are available through Readiness and Export Studio." /></WorkspaceShell>;
  const [{ default: RequirementsClient }, { requirementRegisterRecords }] = await Promise.all([
    import("./requirements-client"),
    import("./requirements-data")
  ]);
  return <WorkspaceShell active="requirements" session={session}><RequirementsClient records={requirementRegisterRecords} /></WorkspaceShell>;
}
