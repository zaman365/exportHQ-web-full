import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  resolveCustomerSession,
  type CustomerSession
} from "@exporthq/auth";
import { featuresForTier, type WorkspaceFeature } from "@exporthq/authorization";
import { exportPanelPath } from "./export-panel-paths";

type WorkspaceFeatureOptions = {
  allowIncompleteOnboarding?: boolean;
  allowPublicPreview?: boolean;
  forcePublicPreview?: boolean;
  signedOutRedirectTo?: string;
};

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

function publicPreviewSession(session: CustomerSession): CustomerSession {
  return {
    ...session,
    status: "signed-out",
    userId: null,
    organizationId: null,
    organizationName: null,
    organizationRole: null,
    userName: null,
    userEmail: null,
    tier: "preview",
    businessVerification: "unverified",
    features: featuresForTier("preview"),
    principal: null,
    isDemo: false,
    isPlatformAdmin: false
  };
}

/**
 * Resolve a route against the normal organization entitlements while allowing
 * selected value-led pages to render a deliberately redacted public sample.
 */
export async function getWorkspaceFeatureSession(
  feature: WorkspaceFeature,
  options: WorkspaceFeatureOptions = {}
): Promise<CustomerSession> {
  const session = await getWorkspaceSession();
  const shouldUsePublicPreview = options.allowPublicPreview && (
    options.forcePublicPreview
    || session.status === "signed-out"
    || session.status === "misconfigured"
  );
  if (shouldUsePublicPreview) {
    const preview = publicPreviewSession(session);
    if (preview.features.includes(feature)) return preview;
  }

  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") {
    const returnTo = options.signedOutRedirectTo?.startsWith("/") ? options.signedOutRedirectTo : undefined;
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(exportPanelPath(returnTo))}` : "/sign-in");
  }
  if (session.status === "needs-organization") redirect("/onboarding");
  if (session.status === "needs-onboarding" && !options.allowIncompleteOnboarding) redirect("/onboarding");
  if (!session.features.includes(feature)) redirect(`/plans?feature=${encodeURIComponent(feature)}`);
  return session;
}

export async function requireWorkspaceFeature(
  feature: WorkspaceFeature,
  options: WorkspaceFeatureOptions = {}
): Promise<CustomerSession & { principal: NonNullable<CustomerSession["principal"]> }> {
  const session = await getWorkspaceFeatureSession(feature, options);
  if (!session.principal) redirect("/onboarding");
  return session as CustomerSession & { principal: NonNullable<CustomerSession["principal"]> };
}

export async function requireOnboardingSession(): Promise<CustomerSession> {
  const session = await getWorkspaceSession();
  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") redirect("/sign-up");
  return session;
}
