import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthConfigurationNotice, AuthScreen } from "../../_components/auth-screen";

export const metadata: Metadata = {
  title: "Create your TREVV account — Export HQ",
  description: "Create a secure account and begin your Export HQ onboarding."
};

export default function SignUpPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <AuthScreen
      eyebrow="START WITH CONTEXT"
      title="Build a workspace around your real export objective."
      description="Create your account, add your organization, complete the guided brief, and choose the TREVV access level that fits the work."
    >
      {configured ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" /> : <AuthConfigurationNotice />}
    </AuthScreen>
  );
}
