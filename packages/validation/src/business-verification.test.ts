import { describe, expect, it } from "vitest";
import { businessVerificationSchema, documentIntentSchema } from "./index";

const verification = {
  legalName: "Synthetic Exporter Ltd",
  registrationNumber: "SYN-123",
  registrationAuthority: "Synthetic registry",
  originCountry: "BD",
  website: "https://synthetic.invalid",
  businessEmail: "verification@synthetic.invalid",
  declaration: "accepted"
} as const;

describe("R1 verification contracts", () => {
  it("rejects the legacy arbitrary evidence URL contract", () => {
    expect(businessVerificationSchema.safeParse({
      ...verification,
      evidenceUrl: "https://uncontrolled.invalid/file.pdf"
    }).success).toBe(false);
    expect(businessVerificationSchema.safeParse(verification).success).toBe(true);
  });

  it("requires a tenant, resource and checksum for evidence upload intent", () => {
    expect(documentIntentSchema.safeParse({
      organizationId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      fileName: "registration.pdf",
      mimeType: "application/pdf",
      byteSize: 120,
      checksumSha256: "a".repeat(64),
      category: "company",
      linkedEntityType: "business_verification_case",
      linkedEntityId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8"
    }).success).toBe(true);
  });
});
