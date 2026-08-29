import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalLegalDocumentText, legalDocuments } from "./legal-documents";

describe("legal document catalog", () => {
  it("keeps every version tied to its exact canonical content", () => {
    for (const document of legalDocuments) {
      const hash = createHash("sha256").update(canonicalLegalDocumentText(document)).digest("hex");
      expect(hash, document.slug).toBe(document.contentHashSha256);
    }
  });

  it("does not represent the engineering drafts as independently approved", () => {
    expect(legalDocuments).not.toHaveLength(0);
    expect(legalDocuments.every((document) => document.status === "draft")).toBe(true);
  });
});
