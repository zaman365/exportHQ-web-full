import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/ExportPanel",
  transpilePackages: ["@exporthq/auth", "@exporthq/authorization", "@exporthq/domain", "@exporthq/ui", "@exporthq/validation"],
  poweredByHeader: false,
  typedRoutes: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Frame-Options", value: "DENY" }
      ]
    }];
  }
};

export default nextConfig;
