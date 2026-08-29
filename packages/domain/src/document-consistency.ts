export const consistencyFieldKeys = [
  "seller_legal_name",
  "seller_address",
  "buyer_legal_name",
  "buyer_address",
  "hs_code",
  "quantity",
  "net_weight_grams",
  "gross_weight_grams",
  "package_count",
  "currency",
  "unit_price_minor",
  "incoterm",
  "origin_country_code",
  "invoice_date",
  "shipment_date",
  "total_minor"
] as const;

export type ConsistencyFieldKey = (typeof consistencyFieldKeys)[number];
export type GeneratedDocumentType =
  | "pro_forma_invoice"
  | "commercial_invoice"
  | "packing_list"
  | "shipping_instruction"
  | "certificate_origin_checklist"
  | "exp_ad_bank_checklist"
  | "market_evidence_pack";

export interface TraceableDocumentField {
  readonly documentId: string;
  readonly documentType: GeneratedDocumentType;
  readonly fieldKey: ConsistencyFieldKey;
  readonly normalizedValue: string;
  readonly sourceEntityType: string;
  readonly sourceEntityId: string;
  readonly sourceField: string;
  readonly approvedValueHashSha256: string;
}
export interface DocumentMismatch {
  readonly fieldKey: ConsistencyFieldKey;
  readonly severity: "blocking";
  readonly values: readonly { readonly documentId: string; readonly documentType: GeneratedDocumentType; readonly normalizedValue: string }[];
}

export function detectDocumentMismatches(fields: readonly TraceableDocumentField[]): DocumentMismatch[] {
  const byKey = new Map<ConsistencyFieldKey, TraceableDocumentField[]>();
  for (const field of fields) {
    if (!field.sourceEntityType.trim() || !field.sourceEntityId.trim() || !field.sourceField.trim()) {
      throw new Error(`Generated field ${field.fieldKey} is missing source traceability.`);
    }
    if (!/^[a-f0-9]{64}$/.test(field.approvedValueHashSha256)) {
      throw new Error(`Generated field ${field.fieldKey} is missing an approved SHA-256 value hash.`);
    }
    byKey.set(field.fieldKey, [...(byKey.get(field.fieldKey) ?? []), field]);
  }
  const mismatches: DocumentMismatch[] = [];
  for (const fieldKey of consistencyFieldKeys) {
    const comparable = byKey.get(fieldKey) ?? [];
    const values = new Set(comparable.map((field) => field.normalizedValue.trim().toLocaleLowerCase("en")));
    if (values.size <= 1) continue;
    mismatches.push({
      fieldKey,
      severity: "blocking",
      values: comparable.map(({ documentId, documentType, normalizedValue }) => ({ documentId, documentType, normalizedValue }))
    });
  }
  return mismatches;
}
