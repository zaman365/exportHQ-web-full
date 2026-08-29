type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;

function validatedUrl(
  name: "NEXT_PUBLIC_SITE_URL" | "NEXT_PUBLIC_APP_URL",
  fallback: string,
  env: DeploymentEnvironment
): URL {
  const configured = env[name]?.trim();
  if (env.NODE_ENV === "production" && !configured) {
    throw new Error(`${name} is required for a production build.`);
  }
  const url = new URL(configured || fallback);
  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS in production.`);
  }
  return url;
}

export function publicSiteUrl(env: DeploymentEnvironment = process.env): URL {
  return validatedUrl("NEXT_PUBLIC_SITE_URL", "https://export-hq.com", env);
}

export function exportPanelUrl(env: DeploymentEnvironment = process.env): URL {
  return validatedUrl("NEXT_PUBLIC_APP_URL", "http://localhost:3001/ExportPanel", env);
}
