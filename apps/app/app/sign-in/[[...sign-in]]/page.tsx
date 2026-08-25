import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthConfigurationNotice, AuthScreen } from "../../_components/auth-screen";
import { exportPanelPath } from "../../_lib/export-panel-paths";

export const metadata: Metadata = {
  title: "Sign in to ExportPanel — Export HQ",
  description: "Securely access your organization's ExportPanel workspace."
};

export default function SignInPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <AuthScreen
      eyebrow="WELCOME BACK"
      title="Continue the work that moves export forward."
      description="Sign in to your private ExportPanel workspace. Your organization, role, onboarding status, and plan determine what is available."
    >
      {configured ? <SignIn routing="path" path={exportPanelPath("/sign-in")} signUpUrl={exportPanelPath("/sign-up")} /> : <AuthConfigurationNotice />}
    </AuthScreen>
  );
}
