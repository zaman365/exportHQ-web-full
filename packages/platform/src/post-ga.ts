import { readEnvironmentList, runtimeEnvironment, type EnvironmentSource, type RuntimeEnvironment } from "./environment";

export const postGaCapabilities = [
  "institution-programme-dashboards",
  "sector-market-expansion",
  "provider-network-partnerships",
  "buyer-data-partnerships",
  "api-ecosystem",
  "shipment-autopsy",
  "repeat-order-automation",
  "consented-aggregate-benchmarks",
  "native-mobile"
] as const;

export type PostGaCapability = (typeof postGaCapabilities)[number];

export interface RecordedPostGaCapability {
  readonly capability: PostGaCapability;
  readonly evidenceReference: string;
}

export interface PostGaCapabilityDecision {
  readonly capability: PostGaCapability;
  readonly enabled: boolean;
  readonly status: "planned" | "active";
  readonly environment: RuntimeEnvironment;
  readonly gaEvidenceReference: string | null;
  readonly capabilityEvidenceReference: string | null;
  readonly missingEvidence: readonly string[];
}

function isPostGaCapability(value: string): value is PostGaCapability {
  return (postGaCapabilities as readonly string[]).includes(value);
}

export function isImmutableGaEvidenceReference(value: string | undefined): boolean {
  return /^ga-release:\/\/v\d+\.\d+\.\d+\/[0-9a-f]{40}\/[0-9a-f]{64}$/i.test(value ?? "");
}

function isCapabilityEvidenceReference(capability: PostGaCapability, value: string | undefined): boolean {
  return new RegExp(`^post-ga://${capability}/[0-9a-f]{64}$`, "i").test(value ?? "");
}

export function parsePostGaCapabilityEvidence(value: string | undefined): RecordedPostGaCapability[] {
  const recorded: RecordedPostGaCapability[] = [];
  for (const entry of readEnvironmentList(value)) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    const capability = entry.slice(0, separator).trim();
    const evidenceReference = entry.slice(separator + 1).trim();
    if (!isPostGaCapability(capability) || !isCapabilityEvidenceReference(capability, evidenceReference)) continue;
    if (recorded.some((candidate) => candidate.capability === capability)) continue;
    recorded.push({ capability, evidenceReference });
  }
  return recorded;
}

export function resolvePostGaCapability(
  capability: PostGaCapability,
  env?: EnvironmentSource
): PostGaCapabilityDecision {
  const source = env ?? (globalThis as { process?: { env?: EnvironmentSource } }).process?.env ?? {};
  const environment = runtimeEnvironment(source);
  const gaEvidenceReference = isImmutableGaEvidenceReference(source.EXPORTHQ_GA_RELEASE_EVIDENCE)
    ? source.EXPORTHQ_GA_RELEASE_EVIDENCE ?? null
    : null;
  const capabilityEvidenceReference = parsePostGaCapabilityEvidence(source.EXPORTHQ_POST_GA_CAPABILITY_EVIDENCE)
    .find((entry) => entry.capability === capability)?.evidenceReference ?? null;
  const missingEvidence: string[] = [];
  if (!gaEvidenceReference) missingEvidence.push("ga-release-evidence");
  if (!capabilityEvidenceReference) missingEvidence.push("post-ga-capability-evidence");
  if (capability === "native-mobile" && !/^pwa-need:\/\/[0-9a-f]{64}$/i.test(source.EXPORTHQ_NATIVE_MOBILE_PWA_NEED_EVIDENCE ?? "")) {
    missingEvidence.push("pwa-need-evidence");
  }
  const enabled = environment === "production" && missingEvidence.length === 0;
  return {
    capability,
    enabled,
    status: enabled ? "active" : "planned",
    environment,
    gaEvidenceReference,
    capabilityEvidenceReference,
    missingEvidence
  };
}

export function postGaActivationReport(env?: EnvironmentSource): readonly PostGaCapabilityDecision[] {
  return postGaCapabilities.map((capability) => resolvePostGaCapability(capability, env));
}
