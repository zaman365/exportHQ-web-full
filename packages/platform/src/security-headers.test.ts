import { describe, expect, it } from "vitest";
import { activationGateIds } from "./activation";
import {
  buildContentSecurityPolicy,
  contentSecurityPolicyMode,
  createNonce,
  securityHeaders
} from "./security-headers";

const policy = buildContentSecurityPolicy({
  inlineScripts: { kind: "nonce", nonce: "n0nce" },
  clerkFrontendApiOrigin: "https://clerk.export-hq.com",
  evidenceOrigins: ["https://evidence.export-hq.com"],
  production: true
});

describe("content security policy", () => {
  it("allows the deployment's Clerk origin and nonce", () => {
    expect(policy).toContain("'nonce-n0nce'");
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("https://clerk.export-hq.com");
  });

  it("allows signed evidence origins for connect, frame and image", () => {
    for (const directive of ["connect-src", "frame-src", "img-src"]) {
      const rendered = policy.split("; ").find((entry) => entry.startsWith(directive));
      expect(rendered).toContain("https://evidence.export-hq.com");
    }
  });

  it("refuses framing, plugins and base tag hijacking", () => {
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
  });

  it("keeps every other directive strict when inline scripts are not nonced", () => {
    const interim = buildContentSecurityPolicy({ inlineScripts: { kind: "unsafe-inline" }, production: true });
    expect(interim).toContain("script-src 'self' 'unsafe-inline'");
    expect(interim).toContain("object-src 'none'");
    expect(interim).toContain("frame-ancestors 'none'");
    expect(interim).not.toContain("default-src *");
  });

  it("upgrades insecure requests only in production", () => {
    expect(policy).toContain("upgrade-insecure-requests");
    expect(
      buildContentSecurityPolicy({ inlineScripts: { kind: "unsafe-inline" }, production: false })
    ).not.toContain("upgrade-insecure-requests");
  });
});

describe("policy mode", () => {
  it("reports rather than enforces until the hardening gate records evidence", () => {
    expect(contentSecurityPolicyMode({ EXPORTHQ_ENVIRONMENT: "production" })).toBe("report-only");
  });

  it("enforces once every gate is recorded", () => {
    const passed = activationGateIds.map((gate, index) => `${gate}=REC-${index}`).join(",");
    expect(
      contentSecurityPolicyMode({ EXPORTHQ_ENVIRONMENT: "production", EXPORTHQ_ACTIVATION_GATES_PASSED: passed })
    ).toBe("enforce");
  });

  it("honours an explicit override in both directions", () => {
    expect(contentSecurityPolicyMode({ EXPORTHQ_CSP_MODE: "enforce" })).toBe("enforce");
    expect(
      contentSecurityPolicyMode({
        EXPORTHQ_CSP_MODE: "report-only",
        EXPORTHQ_ACTIVATION_GATES_PASSED: activationGateIds.map((gate) => `${gate}=REC`).join(",")
      })
    ).toBe("report-only");
  });
});

describe("security headers", () => {
  it("emits the report-only header before enforcement and HSTS in production", () => {
    const headers = securityHeaders({ env: { EXPORTHQ_ENVIRONMENT: "production" } });
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["Content-Security-Policy-Report-Only"]).toBeTruthy();
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
  });

  it("omits HSTS outside production", () => {
    expect(securityHeaders({ env: { EXPORTHQ_ENVIRONMENT: "development" } })["Strict-Transport-Security"]).toBeUndefined();
  });

  it("enforces with a nonce once configured to", () => {
    const headers = securityHeaders({ nonce: "abc", env: { EXPORTHQ_ENVIRONMENT: "production", EXPORTHQ_CSP_MODE: "enforce" } });
    expect(headers["Content-Security-Policy"]).toContain("'nonce-abc'");
  });
});

describe("nonce", () => {
  it("produces a distinct base64 value per response", () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]+$/);
  });
});
