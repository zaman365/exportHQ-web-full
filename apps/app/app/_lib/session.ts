import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  resolveCustomerSession,
  type CustomerSession
} from "@exporthq/auth";
import {
  featuresForTier,
  resolveWorkspaceFeatureAccess,
  type WorkspaceFeature
} from "@exporthq/authorization";
import { applyOrganizationEntitlement, applyOrganizationState } from "./entitlements";
import { exportPanelPath } from "./export-panel-paths";

type WorkspaceFeatureOptions = {
  allowIncompleteOnboarding?: boolean;
  allowPublicPreview?: boolean;
  allowProgressivePreview?: boolean;
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
  const session = await resolveCustomerSession(new Request(requestUrl(requestHeaders), { headers: requestHeaders }));
  /* The identity provider says who the person is; Export HQ's own database says
     what their organization may do. Until tenant persistence is activated this
     returns the session unchanged. */
  return applyOrganizationState(await applyOrganizationEntitlement(session));
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
    if (
      options.allowProgressivePreview
      && resolveWorkspaceFeatureAccess({ authenticated: false, feature, tier: preview.tier }) === "preview"
    ) return preview;
  }

  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") {
    const returnTo = options.signedOutRedirectTo?.startsWith("/") ? options.signedOutRedirectTo : undefined;
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(exportPanelPath(returnTo))}` : "/sign-in");
  }
  if (session.status === "needs-organization") redirect("/onboarding");
  if (session.status === "needs-onboarding" && !options.allowIncompleteOnboarding) redirect("/onboarding");
  if (!session.features.includes(feature)) {
    const access = resolveWorkspaceFeatureAccess({ authenticated: true, feature, tier: session.tier });
    if (options.allowProgressivePreview && access === "preview") return session;
    redirect(`/plans?feature=${encodeURIComponent(feature)}`);
  }
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

/**
 * Render curated sample records for explicitly previewable capabilities while
 * keeping every mutation permission and organization authorization check
 * unchanged. Non-previewable capabilities still redirect to Plans.
 */
export async function getProgressiveWorkspaceFeatureSession(feature: WorkspaceFeature): Promise<CustomerSession> {
  return getWorkspaceFeatureSession(feature, {
    allowPublicPreview: true,
    allowProgressivePreview: true
  });
}

export async function requireOnboardingSession(): Promise<CustomerSession> {
  const session = await getWorkspaceSession();
  if (session.status === "misconfigured") redirect("/sign-in?reason=configuration");
  if (session.status === "signed-out") redirect("/sign-up");
  return session;
}
