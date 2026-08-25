import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  resolveCustomerSession,
  type CustomerSession
} from "@exporthq/auth";
import type { WorkspaceFeature } from "@exporthq/authorization";

function requestUrl(requestHeaders: Headers): string {
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "trevv.export-hq.com";
  return `${protocol}://${host}/`;
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
  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") {
    const returnTo = options.signedOutRedirectTo?.startsWith("/") ? options.signedOutRedirectTo : undefined;
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  if (session.status === "needs-organization") redirect("/onboarding");
  if (session.status === "needs-onboarding" && !options.allowIncompleteOnboarding) redirect("/onboarding");
  if (!session.features.includes(feature)) redirect(`/plans?feature=${encodeURIComponent(feature)}`);
  if (!session.principal) redirect("/onboarding");
  return session as CustomerSession & { principal: NonNullable<CustomerSession["principal"]> };
}

export async function requireOnboardingSession(): Promise<CustomerSession> {
  const session = await getWorkspaceSession();
  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") redirect("/sign-up");
  return session;
}
