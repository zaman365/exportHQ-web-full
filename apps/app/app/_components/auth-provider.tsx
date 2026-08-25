"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { exportPanelPath } from "../_lib/export-panel-paths";

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
      signInUrl={exportPanelPath("/sign-in")}
      signUpUrl={exportPanelPath("/sign-up")}
      signInFallbackRedirectUrl={exportPanelPath()}
      signUpFallbackRedirectUrl={exportPanelPath("/onboarding")}
      afterSignOutUrl={exportPanelPath("/preview")}
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
