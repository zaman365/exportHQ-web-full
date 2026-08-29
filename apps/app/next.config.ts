import type { NextConfig } from "next";
import { securityHeaders } from "@exporthq/platform";

if (process.env.NODE_ENV === "production") {
  for (const name of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required for a production build.`);
    if (new URL(value).protocol !== "https:") throw new Error(`${name} must use HTTPS in production.`);
  }
}

/* Response headers are generated from the shared platform policy so the
   application and any future edge worker cannot drift apart. The Content
   Security Policy stays report-only until the hardening gate records evidence
   that it has been exercised against real Clerk sign-in and R2 downloads —
   see docs/production-activation-todo.md, Gate 5. */
const headerEntries = Object.entries(securityHeaders()).map(([key, value]) => ({ key, value }));

const nextConfig: NextConfig = {
  basePath: "/ExportPanel",
  transpilePackages: [
    "@exporthq/auth",
    "@exporthq/authorization",
    "@exporthq/db",
    "@exporthq/domain",
    "@exporthq/platform",
    "@exporthq/ui",
    "@exporthq/validation"
  ],
  poweredByHeader: false,
  typedRoutes: false,
  async headers() {
    return [{ source: "/(.*)", headers: headerEntries }];
  }
};

export default nextConfig;
