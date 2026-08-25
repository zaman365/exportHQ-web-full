import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  resolveCustomerSession,
  type CustomerSession
} from "@exporthq/auth";
import type { WorkspaceFeature } from "@exporthq/authorization";
import { exportPanelPath } from "./export-panel-paths";

function requestUrl(requestHeaders: Headers): string {
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "export-hq.com";
  return `${protocol}://${host}${exportPanelPath()}`;
}
export async function getWorkspaceSession(): Promise<CustomerSession> {
  const incoming = await headers();
  const requestHeaders = new Headers(incoming);
  return resolveCustomerSession(new Request(requestUrl(requestHeaders), { headers: requestHeaders }));
}

export async function requireWorkspaceFeature(
  feature: WorkspaceFeature,
  options: { allowIncompleteOnboarding?: boolean; signedOutRedirectTo?: string } = {}
): Promise<CustomerSession & { principal: NonNullable<CustomerSession["principal"]> }> {
  const session = await getWorkspaceSession();
  if (session.status === "misconfigured") redirect(exportPanelPath("/sign-in?reason=configuration"));
  if (session.status === "signed-out") {
    const returnTo = options.signedOutRedirectTo?.startsWith("/") ? options.signedOutRedirectTo : undefined;
    redirect(returnTo ? exportPanelPath(`/sign-in?redirect_url=${encodeURIComponent(exportPanelPath(returnTo))}`) : exportPanelPath("/sign-in"));
  }
  if (session.status === "needs-organization") redirect(exportPanelPath("/onboarding"));
  if (session.status === "needs-onboarding" && !options.allowIncompleteOnboarding) redirect(exportPanelPath("/onboarding"));
  if (!session.features.includes(feature)) redirect(exportPanelPath(`/plans?feature=${encodeURIComponent(feature)}`));
  if (!session.principal) redirect(exportPanelPath("/onboarding"));
  return session as CustomerSession & { principal: NonNullable<CustomerSession["principal"]> };
}

export async function requireOnboardingSession(): Promise<CustomerSession> {
  const session = await getWorkspaceSession();
  if (session.status === "misconfigured") redirect(exportPanelPath("/sign-in?reason=configuration"));
  if (session.status === "signed-out") redirect(exportPanelPath("/sign-up"));
  return session;
}
