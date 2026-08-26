import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthConfigurationNotice, AuthMethodSummary, AuthScreen } from "../../_components/auth-screen";
import { exportPanelPath } from "../../_lib/export-panel-paths";
import { getWorkspaceSession } from "../../_lib/session";

export const metadata: Metadata = {
  title: "Sign in to ExportPanel — Export HQ",
  description: "Securely access your organization's ExportPanel workspace."
};

export default async function SignInPage() {
  const session = await getWorkspaceSession();
  if (session.status === "active") redirect("/");
  if (session.status === "needs-organization" || session.status === "needs-onboarding") redirect("/onboarding");

  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const localAdminPreview = process.env.NODE_ENV !== "production" && process.env.EXPORTHQ_DEMO_MODE !== "false";
  return (
    <AuthScreen
      eyebrow="WELCOME BACK"
      title="Pick up where your export work left off."
      description="Sign in to your private ExportPanel workspace. Your organization, role, onboarding status, and plan determine what is available."
    >
      <div className="auth-stack">
        <AuthMethodSummary />
        {configured
          ? <SignIn routing="path" path={exportPanelPath("/sign-in")} signUpUrl={exportPanelPath("/sign-up")} withSignUp />
          : <AuthConfigurationNotice localAdminPreview={localAdminPreview} />}
      </div>
    </AuthScreen>
  );
}
