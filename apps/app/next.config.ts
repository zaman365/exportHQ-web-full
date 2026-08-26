import type { NextConfig } from "next";
import { securityHeaders } from "@exporthq/platform";

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
