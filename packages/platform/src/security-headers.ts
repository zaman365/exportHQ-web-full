import { resolveActivationState } from "./activation";
import { isProductionRuntime, readEnvironmentList, type EnvironmentSource } from "./environment";

/**
 * Content Security Policy.
 *
 * The policy is generated rather than hand-written so that the Clerk and R2
 * origins a deployment actually uses are the only ones allowed, and so the
 * report-only rollout and the enforced policy cannot drift apart.
 */

export type InlineScriptStrategy =
  | { readonly kind: "nonce"; readonly nonce: string }
  /**
   * The framework's streaming bootstrap emits inline scripts without a nonce.
   * Until a request-scoped nonce is threaded through the render, this keeps the
   * rest of the policy strict instead of shipping no policy at all.
   */
  | { readonly kind: "unsafe-inline" };

export interface ContentSecurityPolicyInput {
  readonly inlineScripts: InlineScriptStrategy;
  /** Clerk Frontend API origin, e.g. https://clerk.export-hq.com. */
  readonly clerkFrontendApiOrigin?: string | undefined;
  /** Origins that serve signed evidence downloads. */
  readonly evidenceOrigins?: readonly string[];
  readonly reportUri?: string | undefined;
  readonly production: boolean;
}

const clerkStaticOrigins = ["https://*.clerk.accounts.dev", "https://clerk.com", "https://*.clerk.com"] as const;
const clerkImageOrigins = ["https://img.clerk.com"] as const;

function unique(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function scriptSources(strategy: InlineScriptStrategy, clerk: readonly string[]): string[] {
  return strategy.kind === "nonce"
    ? ["'self'", `'nonce-${strategy.nonce}'`, "'strict-dynamic'", ...clerk]
    : ["'self'", "'unsafe-inline'", ...clerk];
}

export function buildContentSecurityPolicy(input: ContentSecurityPolicyInput): string {
  const clerk = unique([input.clerkFrontendApiOrigin, ...clerkStaticOrigins]);
  const evidence = unique(input.evidenceOrigins ?? []);

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSources(input.inlineScripts, clerk)],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", ...clerkImageOrigins, ...evidence]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'", ...clerk, ...evidence]],
    // Signed evidence is rendered in an isolated object/frame; nothing else may
    // be framed, and Export HQ may never be framed by anyone.
    ["frame-src", ["'self'", ...clerk, ...evidence]],
    ["worker-src", ["'self'", "blob:"]],
    ["media-src", ["'self'", ...evidence]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'", ...clerk]],
    ["frame-ancestors", ["'none'"]],
    ["manifest-src", ["'self'"]]
  ];

  const rendered = directives.map(([name, values]) => `${name} ${unique(values).join(" ")}`);
  if (input.production) rendered.push("upgrade-insecure-requests");
  if (input.reportUri) rendered.push(`report-uri ${input.reportUri}`);
  return rendered.join("; ");
}

export type ContentSecurityPolicyMode = "enforce" | "report-only";

/**
 * A policy that has not been exercised against real Clerk sign-in and real R2
 * downloads is reported, not enforced: enforcing an untested policy would lock
 * customers out of authentication. Enforcement becomes the default once the
 * hardening gate records evidence, and `EXPORTHQ_CSP_MODE` overrides both.
 */
export function contentSecurityPolicyMode(env: EnvironmentSource): ContentSecurityPolicyMode {
  const configured = env.EXPORTHQ_CSP_MODE?.trim().toLowerCase();
  if (configured === "enforce" || configured === "report-only") return configured;
  return resolveActivationState(env).effective.includes("gate-5-pilot-and-launch") ? "enforce" : "report-only";
}

export interface SecurityHeaderInput {
  /** Pass a nonce once the render threads one through; null uses the interim strategy. */
  readonly nonce?: string | null;
  readonly env?: EnvironmentSource;
}

export function securityHeaders(input: SecurityHeaderInput = {}): Record<string, string> {
  const env = input.env ?? (globalThis as { process?: { env?: EnvironmentSource } }).process?.env ?? {};
  const production = isProductionRuntime(env);
  const policy = buildContentSecurityPolicy({
    inlineScripts: input.nonce ? { kind: "nonce", nonce: input.nonce } : { kind: "unsafe-inline" },
    clerkFrontendApiOrigin: env.NEXT_PUBLIC_CLERK_FRONTEND_API_ORIGIN,
    evidenceOrigins: readEnvironmentList(env.EXPORTHQ_EVIDENCE_ORIGINS),
    reportUri: env.EXPORTHQ_CSP_REPORT_URI,
    production
  });

  const mode = contentSecurityPolicyMode(env);
  const headers: Record<string, string> = {
    [mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only"]: policy,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1"
  };
  if (production) headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  return headers;
}

/** Headers for any response that carries or references confidential evidence. */
export const confidentialResponseHeaders: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
};

export function createNonce(randomValues: Uint8Array = crypto.getRandomValues(new Uint8Array(16))): string {
  let binary = "";
  for (const byte of randomValues) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=+$/, "");
}
