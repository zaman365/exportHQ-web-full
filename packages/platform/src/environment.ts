/**
 * Central runtime-environment facts. Every production safety decision reads
 * from here so that a single, testable function decides what "production"
 * means, rather than each module re-deriving it from `process.env`.
 */

export type RuntimeEnvironment = "development" | "test" | "preview" | "production";

export interface EnvironmentSource {
  readonly [key: string]: string | undefined;
}

function processEnvironment(): EnvironmentSource {
  return (globalThis as { process?: { env?: EnvironmentSource } }).process?.env ?? {};
}

/**
 * `EXPORTHQ_ENVIRONMENT` is the authoritative signal because Cloudflare Workers
 * and Vinext builds do not always set `NODE_ENV` the way a Node process does.
 * `NODE_ENV=production` is still honoured so that an unlabelled production
 * build fails closed rather than open.
 */
export function runtimeEnvironment(env: EnvironmentSource = processEnvironment()): RuntimeEnvironment {
  const declared = env.EXPORTHQ_ENVIRONMENT?.trim().toLowerCase();
  if (declared === "production" || declared === "preview" || declared === "development" || declared === "test") {
    return declared;
  }
  if (env.NODE_ENV === "production") return "production";
  if (env.NODE_ENV === "test") return "test";
  return "development";
}

export function isProductionRuntime(env: EnvironmentSource = processEnvironment()): boolean {
  return runtimeEnvironment(env) === "production";
}

/**
 * Preview adapters (browser-local drafts, fixtures, Clerk-metadata storage)
 * may only ever run where the data is synthetic.
 */
export function previewAdaptersPermitted(env: EnvironmentSource = processEnvironment()): boolean {
  return !isProductionRuntime(env);
}

/**
 * Demo identity is a preview adapter. It must be impossible to enable in
 * production regardless of how `EXPORTHQ_DEMO_MODE` is configured.
 */
export function isDemoModeEnabled(env: EnvironmentSource = processEnvironment()): boolean {
  if (isProductionRuntime(env)) return false;
  return env.EXPORTHQ_DEMO_MODE !== "false";
}

export function readEnvironmentList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
