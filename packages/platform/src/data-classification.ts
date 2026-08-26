/**
 * Data classification, retention and legal hold.
 *
 * Every table, object store and telemetry stream is expected to name a class
 * from this catalog. Retention and deletion behaviour is derived from the
 * class rather than decided per feature, so a new feature inherits the
 * approved policy instead of inventing one.
 */

export type DataClass =
  | "public"
  | "operational"
  | "customer-business"
  | "customer-confidential"
  | "credential"
  | "audit";

export interface DataClassPolicy {
  readonly dataClass: DataClass;
  readonly description: string;
  /** Retention floor in days; `null` means retained for the life of the tenant. */
  readonly retentionDays: number | null;
  /** May the value ever appear in logs, traces or product analytics? */
  readonly telemetryPermitted: boolean;
  /** Is the value included in a customer data export? */
  readonly customerExportable: boolean;
  /** Can a customer deletion request remove it before the retention floor? */
  readonly customerDeletable: boolean;
  readonly encryptionAtRest: "platform" | "application";
}

export const dataClassPolicies: Readonly<Record<DataClass, DataClassPolicy>> = {
  public: {
    dataClass: "public",
    description: "Reviewed market intelligence and marketing content published deliberately.",
    retentionDays: null,
    telemetryPermitted: true,
    customerExportable: false,
    customerDeletable: false,
    encryptionAtRest: "platform"
  },
  operational: {
    dataClass: "operational",
    description: "Workspace structure: lanes, tasks, requirement applicability, non-identifying state.",
    retentionDays: null,
    telemetryPermitted: false,
    customerExportable: true,
    customerDeletable: true,
    encryptionAtRest: "platform"
  },
  "customer-business": {
    dataClass: "customer-business",
    description: "Company profile, products, buyer and provider interactions, commercial economics.",
    retentionDays: null,
    telemetryPermitted: false,
    customerExportable: true,
    customerDeletable: true,
    encryptionAtRest: "platform"
  },
  "customer-confidential": {
    dataClass: "customer-confidential",
    description: "Evidence documents, extraction output, mailbox threads and message bodies.",
    retentionDays: null,
    telemetryPermitted: false,
    customerExportable: true,
    customerDeletable: true,
    encryptionAtRest: "application"
  },
  credential: {
    dataClass: "credential",
    description: "Mailbox tokens, provider credentials and signing material.",
    retentionDays: null,
    telemetryPermitted: false,
    customerExportable: false,
    customerDeletable: true,
    encryptionAtRest: "application"
  },
  audit: {
    dataClass: "audit",
    description: "Append-only record of privileged, membership, evidence and business decisions.",
    // Kept for seven years so an exporter can evidence a past shipment decision.
    retentionDays: 2557,
    telemetryPermitted: false,
    customerExportable: true,
    customerDeletable: false,
    encryptionAtRest: "platform"
  }
};

export interface RetentionDecisionInput {
  readonly dataClass: DataClass;
  readonly createdAt: Date;
  readonly now: Date;
  readonly legalHold: boolean;
  readonly customerRequestedDeletion: boolean;
}

export type RetentionAction = "retain" | "delete" | "hold";

export interface RetentionDecision {
  readonly action: RetentionAction;
  readonly reason: string;
}

/**
 * A legal hold always wins. Audit records are never deleted on request because
 * they are the evidence that a decision was authorised; everything else obeys
 * the customer once the retention floor has passed.
 */
export function decideRetention(input: RetentionDecisionInput): RetentionDecision {
  const policy = dataClassPolicies[input.dataClass];
  if (input.legalHold) return { action: "hold", reason: "A legal hold is active for this record." };

  const ageDays = Math.floor((input.now.getTime() - input.createdAt.getTime()) / 86_400_000);
  if (policy.retentionDays !== null && ageDays < policy.retentionDays) {
    return {
      action: input.customerRequestedDeletion ? "hold" : "retain",
      reason: `The ${input.dataClass} retention floor of ${policy.retentionDays} days has not passed.`
    };
  }

  if (input.customerRequestedDeletion) {
    return policy.customerDeletable
      ? { action: "delete", reason: "The customer requested deletion and the retention floor has passed." }
      : { action: "retain", reason: `${input.dataClass} records are not customer-deletable.` };
  }

  return policy.retentionDays === null
    ? { action: "retain", reason: "Retained for the life of the tenant." }
    : { action: "delete", reason: "The retention period has elapsed." };
}

export function assertTelemetryPermitted(dataClass: DataClass): void {
  if (!dataClassPolicies[dataClass].telemetryPermitted) {
    throw new Error(`${dataClass} data may not be written to telemetry.`);
  }
}
