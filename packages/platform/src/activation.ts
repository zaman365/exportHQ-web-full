import {
  isProductionRuntime,
  readEnvironmentList,
  runtimeEnvironment,
  type EnvironmentSource,
  type RuntimeEnvironment
} from "./environment";

/**
 * The production activation gates from `docs/production-activation-todo.md`.
 * Gate order is meaningful: a later gate cannot be effective until every
 * earlier gate has recorded evidence, so a partially activated deployment
 * cannot accidentally unlock a capability that depends on missing controls.
 */
export const activationGateIds = [
  "gate-0-ownership-and-freeze",
  "gate-1-identity-and-postgres",
  "gate-2-evidence-vault",
  "gate-3-production-persistence",
  "gate-4-trust-and-integrations",
  "gate-5-pilot-and-launch"
] as const;

export type ActivationGateId = (typeof activationGateIds)[number];

export interface ActivationGateDefinition {
  readonly id: ActivationGateId;
  readonly title: string;
  readonly exitEvidence: string;
}

export const activationGates: readonly ActivationGateDefinition[] = [
  {
    id: "gate-0-ownership-and-freeze",
    title: "Programme ownership and safety freeze",
    exitEvidence: "Named owners, a complete production inventory, and sensitive features that fail closed."
  },
  {
    id: "gate-1-identity-and-postgres",
    title: "Production identity and authoritative PostgreSQL",
    exitEvidence: "Clerk production journeys pass, tenant state lives in PostgreSQL, isolation tests expose zero records."
  },
  {
    id: "gate-2-evidence-vault",
    title: "Private EU R2 evidence vault",
    exitEvidence: "Quarantine to clean and quarantine to rejected pass end to end with authorization and audit."
  },
  {
    id: "gate-3-production-persistence",
    title: "Production persistence replacing preview adapters",
    exitEvidence: "No customer workflow relies on browser-local state, fixtures, or Clerk metadata."
  },
  {
    id: "gate-4-trust-and-integrations",
    title: "Operational trust and reviewed integrations",
    exitEvidence: "Human operations own verification and publishing; every live adapter has credentials, contracts, and an owner."
  },
  {
    id: "gate-5-pilot-and-launch",
    title: "Security hardening and controlled pilot",
    exitEvidence: "One auditable pilot Export Lane, an independent security review, and active rollback ownership."
  }
];

/**
 * Capabilities that must fail closed until their gates record evidence.
 * These are deliberately about *data consequences*, not UI visibility: the
 * interface may describe a capability while the capability itself refuses.
 */
export const productionCapabilities = [
  "customer-postgres-persistence",
  "document-upload",
  "document-download",
  "document-external-share",
  "mailbox-connection",
  "mailbox-send",
  "provider-referral",
  "live-external-adapter",
  "real-exporter-onboarding",
  "broad-launch"
] as const;

export type ProductionCapability = (typeof productionCapabilities)[number];

const capabilityRequirements: Readonly<Record<ProductionCapability, ActivationGateId>> = {
  "customer-postgres-persistence": "gate-1-identity-and-postgres",
  "document-upload": "gate-2-evidence-vault",
  "document-download": "gate-2-evidence-vault",
  "document-external-share": "gate-2-evidence-vault",
  "mailbox-connection": "gate-4-trust-and-integrations",
  "mailbox-send": "gate-4-trust-and-integrations",
  "provider-referral": "gate-4-trust-and-integrations",
  "live-external-adapter": "gate-4-trust-and-integrations",
  "real-exporter-onboarding": "gate-3-production-persistence",
  "broad-launch": "gate-5-pilot-and-launch"
};

export interface RecordedGate {
  readonly gate: ActivationGateId;
  readonly evidenceReference: string;
}

export interface ActivationState {
  readonly environment: RuntimeEnvironment;
  readonly recorded: readonly RecordedGate[];
  /** Gates that are both recorded and preceded by recorded gates. */
  readonly effective: readonly ActivationGateId[];
  readonly highestEffectiveGate: ActivationGateId | null;
}

function gateIndex(gate: ActivationGateId): number {
  return activationGateIds.indexOf(gate);
}

function isActivationGateId(value: string): value is ActivationGateId {
  return (activationGateIds as readonly string[]).includes(value);
}

/**
 * Gates are recorded as `gate-id=evidence-reference` pairs in a server-only
 * variable. The evidence reference is mandatory: a gate cannot be flipped on
 * without pointing at the record that proves it, which keeps the deployment
 * configuration consistent with the written gate evidence.
 */
export function parseRecordedGates(value: string | undefined): RecordedGate[] {
  const recorded: RecordedGate[] = [];
  for (const entry of readEnvironmentList(value)) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    const gate = entry.slice(0, separator).trim();
    const evidenceReference = entry.slice(separator + 1).trim();
    if (!evidenceReference || !isActivationGateId(gate)) continue;
    if (recorded.some((candidate) => candidate.gate === gate)) continue;
    recorded.push({ gate, evidenceReference });
  }
  return recorded.sort((left, right) => gateIndex(left.gate) - gateIndex(right.gate));
}

export function resolveActivationState(env?: EnvironmentSource): ActivationState {
  const source = env ?? (globalThis as { process?: { env?: EnvironmentSource } }).process?.env ?? {};
  const recorded = parseRecordedGates(source.EXPORTHQ_ACTIVATION_GATES_PASSED);
  const effective: ActivationGateId[] = [];
  for (const gate of activationGateIds) {
    if (!recorded.some((candidate) => candidate.gate === gate)) break;
    effective.push(gate);
  }
  return {
    environment: runtimeEnvironment(source),
    recorded,
    effective,
    highestEffectiveGate: effective.length ? (effective[effective.length - 1] as ActivationGateId) : null
  };
}

export type CapabilityMode = "synthetic" | "production";

export interface CapabilityDecision {
  readonly capability: ProductionCapability;
  readonly enabled: boolean;
  readonly mode: CapabilityMode;
  readonly requiredGate: ActivationGateId;
  readonly missingGates: readonly ActivationGateId[];
  /** Safe to show a customer: never names infrastructure or internal state. */
  readonly userFacingReason: string | null;
}

const disabledReason = "This capability is not activated yet. Export HQ will enable it once the required production controls are recorded as complete.";

/**
 * Outside production every capability runs in `synthetic` mode: it works so
 * that journeys and tests are exercisable, but callers are told the data is
 * not real. In production a capability is enabled only when its gate — and
 * every gate before it — has recorded evidence.
 */
export function resolveCapability(
  capability: ProductionCapability,
  env?: EnvironmentSource
): CapabilityDecision {
  const source = env ?? (globalThis as { process?: { env?: EnvironmentSource } }).process?.env ?? {};
  const requiredGate = capabilityRequirements[capability];
  const state = resolveActivationState(source);
  const required = activationGateIds.slice(0, gateIndex(requiredGate) + 1);
  const missingGates = required.filter((gate) => !state.effective.includes(gate));

  if (!isProductionRuntime(source)) {
    return {
      capability,
      enabled: true,
      mode: "synthetic",
      requiredGate,
      missingGates,
      userFacingReason: null
    };
  }

  const enabled = missingGates.length === 0;
  return {
    capability,
    enabled,
    mode: "production",
    requiredGate,
    missingGates,
    userFacingReason: enabled ? null : disabledReason
  };
}

export class CapabilityNotActivatedError extends Error {
  readonly capability: ProductionCapability;
  readonly missingGates: readonly ActivationGateId[];
  readonly userFacingMessage: string;

  constructor(decision: CapabilityDecision) {
    super(`Capability "${decision.capability}" requires ${decision.missingGates.join(", ") || "activation"}.`);
    this.name = "CapabilityNotActivatedError";
    this.capability = decision.capability;
    this.missingGates = decision.missingGates;
    this.userFacingMessage = decision.userFacingReason ?? disabledReason;
  }
}

export function assertCapability(capability: ProductionCapability, env?: EnvironmentSource): CapabilityDecision {
  const decision = resolveCapability(capability, env);
  if (!decision.enabled) throw new CapabilityNotActivatedError(decision);
  return decision;
}

export function capabilityIsEnabled(capability: ProductionCapability, env?: EnvironmentSource): boolean {
  return resolveCapability(capability, env).enabled;
}

/**
 * Reports every capability at once so an operator surface, a deployment smoke
 * test, or the status document can be generated from deployed reality rather
 * than from a hand-maintained table.
 */
export function activationReport(env?: EnvironmentSource): {
  state: ActivationState;
  capabilities: readonly CapabilityDecision[];
} {
  return {
    state: resolveActivationState(env),
    capabilities: productionCapabilities.map((capability) => resolveCapability(capability, env))
  };
}
