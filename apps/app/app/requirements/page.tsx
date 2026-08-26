import type { Metadata } from "next";
import { authorizeOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import RequirementsClient from "./requirements-client";
import { requirementRegisterRecords } from "./requirements-data";

export const metadata: Metadata = {
  title: "Requirements — Export HQ",
  description: "A source-aware requirement and evidence register for the active Export Lane."
};

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const session = await getWorkspaceFeatureSession("requirements");
  if (session.principal) authorizeOrganization(session.principal, session.principal.organizationId, "compliance:view");
  return <WorkspaceShell active="requirements" session={session}><RequirementsClient records={requirementRegisterRecords} /></WorkspaceShell>;
}
