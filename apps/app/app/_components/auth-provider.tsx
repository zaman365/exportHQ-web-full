"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export function AuthProvider({
  publishableKey,
  children
}: {
  publishableKey: string | undefined;
  children: ReactNode;
}) {
  if (!publishableKey) return children;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/preview"
      appearance={{
        variables: {
          colorPrimary: "#ff6a1a",
          borderRadius: "0.65rem"
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
