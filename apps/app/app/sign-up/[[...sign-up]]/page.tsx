import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthConfigurationNotice, AuthMethodSummary, AuthScreen } from "../../_components/auth-screen";
import { exportPanelPath } from "../../_lib/export-panel-paths";

export const metadata: Metadata = {
  title: "Create your ExportPanel account — Export HQ",
  description: "Create a secure account and begin your Export HQ onboarding."
};

export default function SignUpPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const localAdminPreview = process.env.NODE_ENV !== "production" && process.env.EXPORTHQ_DEMO_MODE !== "false";
  return (
    <AuthScreen
      eyebrow="START WITH CONTEXT"
      title="Build a workspace around your real export objective."
      description="Create your account, add your organization, complete the guided brief, and choose the ExportPanel access level that fits the work."
    >
      <div className="auth-stack">
        <AuthMethodSummary />
        {configured
          ? <SignUp routing="path" path={exportPanelPath("/sign-up")} signInUrl={exportPanelPath("/sign-in")} />
          : <AuthConfigurationNotice localAdminPreview={localAdminPreview} />}
      </div>
    </AuthScreen>
  );
}
