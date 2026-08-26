import { describe, expect, it } from "vitest";
import {
  filterAnalyticsProperties,
  redactStructure,
  redactText,
  redactUrl,
  scrubTelemetryEvent
} from "./redaction";

describe("URL redaction", () => {
  it("strips signed access parameters from an R2 download URL", () => {
    const signed =
      "https://evidence.example.com/o/abc?X-Amz-Signature=deadbeef&X-Amz-Credential=key&response-content-type=application/pdf";
    const output = redactUrl(signed);
    expect(output).not.toContain("deadbeef");
    expect(output).toContain("X-Amz-Signature=%5Bredacted%5D");
    expect(output).toContain("response-content-type=application");
  });

  it("refuses to pass through an unparseable URL", () => {
    expect(redactUrl("not a url ?X-Amz-Signature=deadbeef")).toBe("[redacted]");
  });

  it("removes embedded basic-auth credentials", () => {
    expect(redactUrl("https://user:hunter2@example.com/path")).not.toContain("hunter2");
  });
});

describe("text redaction", () => {
  it("removes Clerk secret keys, webhook secrets and bearer tokens", () => {
    const text = "sk_live_abcdefghijklmnop whsec_ABCDEFGHIJKL Authorization: Bearer abcdefghijklmnop";
    const output = redactText(text);
    expect(output).not.toMatch(/sk_live_/);
    expect(output).not.toMatch(/whsec_/);
    expect(output).not.toMatch(/Bearer abcdef/);
  });

  it("removes JWTs", () => {
    expect(redactText("token eyJhbGciOi.eyJzdWIiOiA.c2lnbmF0dXJl")).not.toContain("eyJhbGciOi");
  });

  it("keeps the domain but not the local part of an email address", () => {
    expect(redactText("write to nadia@abctextiles.com")).toBe("write to [redacted]@abctextiles.com");
  });
});

describe("structure redaction", () => {
  it("drops confidential keys wholesale", () => {
    const output = redactStructure({
      organizationId: "org_1",
      documentBody: "confidential certificate contents",
      extraction: { certificateNumber: "1234" },
      credentialSecretRef: "vault://tokens/1"
    }) as Record<string, unknown>;
    expect(output.organizationId).toBe("org_1");
    expect(output.documentBody).toBe("[redacted]");
    expect(output.extraction).toBe("[redacted]");
    expect(output.credentialSecretRef).toBe("[redacted]");
  });

  it("survives cyclic structures", () => {
    const cyclic: Record<string, unknown> = { name: "lane" };
    cyclic.self = cyclic;
    expect(() => redactStructure(cyclic)).not.toThrow();
  });

  it("scrubs a Sentry event end to end", () => {
    const event = scrubTelemetryEvent({
      message: "upload failed for nadia@abctextiles.com",
      request: { url: "https://export-hq.com/ExportPanel/api/x?token=abc123456789" },
      extra: { messageBody: "buyer contract text" }
    });
    expect(JSON.stringify(event)).not.toContain("nadia@abctextiles.com");
    expect(JSON.stringify(event)).not.toContain("abc123456789");
    expect(JSON.stringify(event)).not.toContain("buyer contract text");
  });
});

describe("analytics allowlist", () => {
  it("keeps allowlisted enumeration properties", () => {
    expect(filterAnalyticsProperties({ capability: "document-upload", duration_ms: 42, outcome: "denied" })).toEqual({
      capability: "document-upload",
      duration_ms: 42,
      outcome: "denied"
    });
  });

  it("drops properties that are not on the allowlist", () => {
    expect(filterAnalyticsProperties({ email: "nadia@abctextiles.com", documentName: "invoice.pdf" })).toEqual({});
  });

  it("drops an allowlisted property carrying an address or URL", () => {
    expect(filterAnalyticsProperties({ outcome: "nadia@abctextiles.com", adapter: "https://example.com" })).toEqual({});
  });
});
