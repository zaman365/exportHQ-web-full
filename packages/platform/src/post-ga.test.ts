import { describe, expect, it } from "vitest";
import {
  parsePostGaCapabilityEvidence,
  postGaActivationReport,
  resolvePostGaCapability
} from "./post-ga";

const gaReference = `ga-release://v1.0.0/${"a".repeat(40)}/${"b".repeat(64)}`;
const evidence = (capability: string) => `post-ga://${capability}/${"c".repeat(64)}`;

describe("post-GA activation", () => {
  it("keeps every R6 capability planned before GA", () => {
    const report = postGaActivationReport({ EXPORTHQ_ENVIRONMENT: "production" });
    expect(report).toHaveLength(9);
    expect(report.every((decision) => !decision.enabled && decision.status === "planned")).toBe(true);
  });

  it("requires both the immutable GA record and exact capability review", () => {
    const capability = "institution-programme-dashboards";
    expect(resolvePostGaCapability(capability, {
      EXPORTHQ_ENVIRONMENT: "production",
      EXPORTHQ_GA_RELEASE_EVIDENCE: gaReference
    }).missingEvidence).toContain("post-ga-capability-evidence");
    expect(resolvePostGaCapability(capability, {
      EXPORTHQ_ENVIRONMENT: "production",
      EXPORTHQ_GA_RELEASE_EVIDENCE: gaReference,
      EXPORTHQ_POST_GA_CAPABILITY_EVIDENCE: `${capability}=${evidence(capability)}`
    }).enabled).toBe(true);
  });

  it("does not activate post-GA work in preview even with copied evidence", () => {
    const capability = "shipment-autopsy";
    expect(resolvePostGaCapability(capability, {
      EXPORTHQ_ENVIRONMENT: "preview",
      EXPORTHQ_GA_RELEASE_EVIDENCE: gaReference,
      EXPORTHQ_POST_GA_CAPABILITY_EVIDENCE: `${capability}=${evidence(capability)}`
    }).enabled).toBe(false);
  });

  it("requires PWA usage evidence before native mobile", () => {
    const capability = "native-mobile";
    const env = {
      EXPORTHQ_ENVIRONMENT: "production",
      EXPORTHQ_GA_RELEASE_EVIDENCE: gaReference,
      EXPORTHQ_POST_GA_CAPABILITY_EVIDENCE: `${capability}=${evidence(capability)}`
    };
    expect(resolvePostGaCapability(capability, env).missingEvidence).toContain("pwa-need-evidence");
    expect(resolvePostGaCapability(capability, {
      ...env,
      EXPORTHQ_NATIVE_MOBILE_PWA_NEED_EVIDENCE: `pwa-need://${"d".repeat(64)}`
    }).enabled).toBe(true);
  });

  it("ignores malformed, unknown and duplicate capability evidence", () => {
    const capability = "api-ecosystem";
    expect(parsePostGaCapabilityEvidence([
      `unknown=${evidence("unknown")}`,
      `${capability}=pending`,
      `${capability}=${evidence(capability)}`,
      `${capability}=post-ga://${capability}/${"d".repeat(64)}`
    ].join(","))).toEqual([{ capability, evidenceReference: evidence(capability) }]);
  });
});
