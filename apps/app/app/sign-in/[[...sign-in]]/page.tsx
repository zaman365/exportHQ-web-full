import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthConfigurationNotice, AuthScreen } from "../../_components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in to TREVV — Export HQ",
  description: "Securely access your organization's TREVV workspace."
};

export default function SignInPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <AuthScreen
      eyebrow="WELCOME BACK"
      title="Continue the work that moves export forward."
      description="Sign in to your private TREVV workspace. Your organization, role, onboarding status, and plan determine what is available."
    >
      {configured ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" /> : <AuthConfigurationNotice />}
    </AuthScreen>
  );
}
