import { describe, expect, it } from "vitest";
import {
  activationGateIds,
  activationReport,
  assertCapability,
  CapabilityNotActivatedError,
  parseRecordedGates,
  resolveActivationState,
  resolveCapability
} from "./activation";

const production = { EXPORTHQ_ENVIRONMENT: "production" } as const;

describe("recorded activation gates", () => {
  it("requires an evidence reference for every recorded gate", () => {
    const recorded = parseRecordedGates("gate-0-ownership-and-freeze=REC-1,gate-1-identity-and-postgres");
    expect(recorded).toEqual([{ gate: "gate-0-ownership-and-freeze", evidenceReference: "REC-1" }]);
  });

  it("ignores unknown and duplicated gate identifiers", () => {
    const recorded = parseRecordedGates("gate-9-nonsense=REC-1,gate-0-ownership-and-freeze=REC-1,gate-0-ownership-and-freeze=REC-2");
    expect(recorded).toHaveLength(1);
  });

  it("only makes a gate effective when every earlier gate is recorded", () => {
    const state = resolveActivationState({
      ...production,
      EXPORTHQ_ACTIVATION_GATES_PASSED: "gate-2-evidence-vault=REC-3,gate-0-ownership-and-freeze=REC-1"
    });
    expect(state.effective).toEqual(["gate-0-ownership-and-freeze"]);
    expect(state.highestEffectiveGate).toBe("gate-0-ownership-and-freeze");
  });
});

describe("capability activation", () => {
  it("refuses document upload in production until the evidence vault gate is recorded", () => {
    const decision = resolveCapability("document-upload", production);
    expect(decision.enabled).toBe(false);
    expect(decision.missingGates).toContain("gate-2-evidence-vault");
    expect(decision.userFacingReason).toBeTruthy();
    expect(decision.userFacingReason).not.toMatch(/gate-/);
  });

  it("refuses mailbox connection in production until the integrations gate is recorded", () => {
    expect(resolveCapability("mailbox-connection", production).enabled).toBe(false);
  });

  it("enables a capability once its gate chain records evidence", () => {
    const env = {
      ...production,
      EXPORTHQ_ACTIVATION_GATES_PASSED: activationGateIds
        .slice(0, 3)
        .map((gate, index) => `${gate}=REC-${index}`)
        .join(",")
    };
    expect(resolveCapability("document-upload", env).enabled).toBe(true);
    expect(resolveCapability("mailbox-connection", env).enabled).toBe(false);
  });

  it("runs in synthetic mode outside production so journeys stay testable", () => {
    const decision = resolveCapability("document-upload", { EXPORTHQ_ENVIRONMENT: "development" });
    expect(decision.enabled).toBe(true);
    expect(decision.mode).toBe("synthetic");
  });

  it("treats an unlabelled NODE_ENV=production build as production", () => {
    expect(resolveCapability("document-upload", { NODE_ENV: "production" }).enabled).toBe(false);
  });

  it("throws a capability error carrying a safe customer message", () => {
    try {
      assertCapability("mailbox-connection", production);
      expect.unreachable("assertCapability should refuse an unactivated capability");
    } catch (error) {
      expect(error).toBeInstanceOf(CapabilityNotActivatedError);
      expect((error as CapabilityNotActivatedError).userFacingMessage).toMatch(/not activated yet/);
    }
  });
});

describe("activation report", () => {
  it("describes every capability for deployment smoke tests", () => {
    const report = activationReport(production);
    expect(report.capabilities).toHaveLength(10);
    expect(report.capabilities.every((capability) => capability.enabled === false)).toBe(true);
    expect(report.state.environment).toBe("production");
  });
});
