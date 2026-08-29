import { describe, expect, it } from "vitest";
import { detectDocumentMismatches, type TraceableDocumentField } from "./document-consistency";

const hash = "a".repeat(64);

function field(documentId: string, documentType: TraceableDocumentField["documentType"], fieldKey: TraceableDocumentField["fieldKey"], normalizedValue: string): TraceableDocumentField {
  return { documentId, documentType, fieldKey, normalizedValue, sourceEntityType: "sales_order_version", sourceEntityId: "order-v1", sourceField: fieldKey, approvedValueHashSha256: hash };
}

describe("document consistency", () => {
  it("finds cross-document mismatches in traced approved values", () => {
    expect(detectDocumentMismatches([
      field("invoice", "commercial_invoice", "currency", "USD"),
      field("packing", "packing_list", "currency", "EUR")
    ])).toEqual([{ fieldKey: "currency", severity: "blocking", values: [
      { documentId: "invoice", documentType: "commercial_invoice", normalizedValue: "USD" },
      { documentId: "packing", documentType: "packing_list", normalizedValue: "EUR" }
    ] }]);
  });

  it("rejects generated values without source traceability", () => {
    expect(() => detectDocumentMismatches([{ ...field("invoice", "commercial_invoice", "currency", "USD"), sourceField: "" }])).toThrow(/traceability/);
  });
});
