import type { Metadata } from "next";
import { requireOnboardingSession } from "../_lib/session";
import OnboardingClient from "./onboarding-client";

export const metadata: Metadata = {
  title: "Set up ExportPanel — Export HQ",
  description: "Create your organization and complete the secure ExportPanel export brief."
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const session = await requireOnboardingSession();
  const params = await searchParams;
  const demoBusinessName = session.isDemo ? params.business?.slice(0, 100) : undefined;
  return <OnboardingClient needsOrganization={session.status === "needs-organization"} authEnabled={!session.isDemo} organizationName={demoBusinessName || session.organizationName || ""} />;
}
