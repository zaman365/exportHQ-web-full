/**
 * Telemetry redaction.
 *
 * Confidential evidence, message bodies, credentials and signed URLs must
 * never reach Sentry, PostHog, structured logs or an analytics warehouse.
 * Redaction is centralised here so that the rule is enforced by one tested
 * function instead of being re-applied by every call site.
 */

const redacted = "[redacted]";

/** Query parameters that carry signed access or credentials. */
const signedParameterPattern =
  /^(x-amz-[a-z0-9-]+|signature|sig|token|access_token|id_token|refresh_token|code|state|key|apikey|api_key|password|secret|__clerk_[a-z_]+)$/i;

/** Object keys whose *values* are confidential regardless of type. */
const confidentialKeyPattern =
  /(password|secret|token|credential|authorization|cookie|api[-_]?key|signed[-_]?url|private[-_]?key|checksum|otp|mfa|body|content|message[-_]?body|attachment|extraction|raw[-_]?metrics|evidence)/i;

/** Values that look like credentials even when the key is innocuous. */
const credentialValuePatterns: readonly RegExp[] = [
  /\bsk_(live|test)_[A-Za-z0-9]{8,}\b/g,
  /\bpk_(live|test)_[A-Za-z0-9]{8,}\b/g,
  /\bwhsec_[A-Za-z0-9+/=]{8,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi,
  /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g,
  /\bxox[abposr]-[A-Za-z0-9-]{8,}\b/g
];

const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function redactEmailAddress(value: string): string {
  return value.replace(emailPattern, (match) => {
    const [, domain = ""] = match.split("@");
    return `${redacted}@${domain}`;
  });
}

/**
 * Strips signed access from a URL while keeping enough shape to debug a
 * request. Returns `[redacted]` for anything that is not a parseable URL, so a
 * malformed signed URL cannot leak through the error path.
 */
export function redactUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return redacted;
  }
  for (const parameter of [...url.searchParams.keys()]) {
    if (signedParameterPattern.test(parameter)) url.searchParams.set(parameter, redacted);
  }
  url.username = "";
  url.password = "";
  url.hash = "";
  return url.toString();
}

export function redactText(value: string): string {
  let output = value;
  for (const pattern of credentialValuePatterns) output = output.replace(pattern, redacted);
  output = output.replace(/https?:\/\/\S+/g, (match) => redactUrl(match));
  return redactEmailAddress(output);
}

type Redactable = unknown;

/**
 * Recursively redacts a structure. Depth and breadth are bounded so a hostile
 * or cyclic payload cannot turn redaction into a denial of service, and any
 * value under a confidential key is dropped wholesale rather than sampled.
 */
export function redactStructure(value: Redactable, depth = 0, seen = new WeakSet<object>()): Redactable {
  if (depth > 6) return redacted;
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: redactText(value.message) };
  }
  if (typeof value === "object") {
    if (seen.has(value)) return redacted;
    seen.add(value);
    if (Array.isArray(value)) {
      return value.slice(0, 50).map((entry) => redactStructure(entry, depth + 1, seen));
    }
    const output: Record<string, Redactable> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      output[key] = confidentialKeyPattern.test(key) ? redacted : redactStructure(entry, depth + 1, seen);
    }
    return output;
  }
  return redacted;
}

export interface TelemetryEvent {
  message?: string;
  request?: { url?: string; headers?: Record<string, string>; data?: unknown };
  extra?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  breadcrumbs?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Sentry `beforeSend`. Returning the scrubbed event rather than dropping it
 * keeps error visibility while guaranteeing the payload carries no evidence,
 * message bodies, tokens or signed URLs.
 */
export function scrubTelemetryEvent(event: TelemetryEvent): TelemetryEvent {
  return redactStructure(event) as TelemetryEvent;
}

/**
 * PostHog metadata allowlist. Product analytics answers "which capability was
 * used, by which plan, with what outcome" — never "what was in the document".
 * Anything outside the allowlist is dropped instead of redacted, so a new
 * property cannot start flowing simply because someone added it upstream.
 */
export const analyticsPropertyAllowlist = [
  "capability",
  "feature",
  "workspace_feature",
  "plan_tier",
  "business_verification",
  "organization_role",
  "activation_gate",
  "outcome",
  "denial_reason",
  "duration_ms",
  "result_count",
  "lane_stage",
  "evidence_state",
  "scan_result",
  "adapter",
  "adapter_state",
  "http_status",
  "environment",
  "app_version"
] as const;

export type AnalyticsProperty = (typeof analyticsPropertyAllowlist)[number];

const allowlist = new Set<string>(analyticsPropertyAllowlist);

export function filterAnalyticsProperties(
  properties: Record<string, unknown>
): Record<AnalyticsProperty, string | number | boolean> {
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!allowlist.has(key)) continue;
    if (typeof value === "string") {
      // Allowlisted keys are enumerations, so a long or structured value is a
      // sign that something confidential was routed into the wrong property.
      if (value.length > 64 || value.includes("@") || value.includes("://")) continue;
      output[key] = value;
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) output[key] = value;
    if (typeof value === "boolean") output[key] = value;
  }
  return output as Record<AnalyticsProperty, string | number | boolean>;
}
