import type { Metadata } from "next";
import { authorizeOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import LearningCenterClient from "./learning-center-client";
import { getWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "ExportPanel Learning Center — Export HQ",
  description: "Hints, tutorials, references, and practical tips for the ExportPanel workspace."
};

export const dynamic = "force-dynamic";

export default async function LearningCenterPage({
  searchParams
}: {
  searchParams: Promise<{ topic?: string | string[]; access?: string }>;
}) {
  const params = await searchParams;
  const session = await getWorkspaceFeatureSession("learning", {
    allowPublicPreview: true,
    forcePublicPreview: params.access === "public"
  });
  const principal = session.principal;
  if (principal) authorizeOrganization(principal, principal.organizationId, "company:view");
  const topicValue = params.topic;
  const topic = Array.isArray(topicValue) ? topicValue[0] : topicValue;

  return <WorkspaceShell active="learning" session={session}><LearningCenterClient initialTopic={topic} /></WorkspaceShell>;
}
