import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@exporthq/ui"],
  poweredByHeader: false
};

export default nextConfig;
