import {
  readinessRequirementViews,
  readinessSections,
  type ReadinessPriority,
  type ReadinessProfile,
  type ReadinessRequirementView,
  type ReadinessSectionId
} from "@exporthq/domain";

export type RequirementRegisterStatus =
  | "not_started"
  | "in_progress"
  | "evidence_added"
  | "under_review"
  | "compliant"
  | "action_required"
  | "blocked";

export interface RequirementRegisterRecord extends ReadinessRequirementView {
  sectionLabel: string;
  status: RequirementRegisterStatus;
  evidenceCount: number;
  owner: string;
  nextReview: string;
}

export const requirementRegisterProfile: ReadinessProfile = {
  businessModel: "manufacturer",
  productCategory: "apparel",
  productName: "Cotton apparel",
  hsCode: "6205.20",
  targetMarketCode: "DE",
  salesChannel: "wholesale"
};

const seededState: Readonly<Record<string, Pick<RequirementRegisterRecord, "status" | "evidenceCount" | "owner" | "nextReview">>> = {
  "bd-entity-registration": { status: "compliant", evidenceCount: 3, owner: "Nadia Rahman", nextReview: "12 May 2027" },
  "bd-trade-license": { status: "compliant", evidenceCount: 2, owner: "Nadia Rahman", nextReview: "15 Jun 2027" },
  "bd-tax-tin": { status: "compliant", evidenceCount: 2, owner: "Finance & Trade", nextReview: "31 Dec 2026" },
  "bd-bin": { status: "under_review", evidenceCount: 1, owner: "Finance & Trade", nextReview: "28 Aug 2026" },
  "bd-erc": { status: "evidence_added", evidenceCount: 2, owner: "Export Operations", nextReview: "27 Aug 2026" },
  "bd-chamber": { status: "compliant", evidenceCount: 1, owner: "Export Operations", nextReview: "5 Apr 2027" },
  "bd-ad-bank": { status: "in_progress", evidenceCount: 1, owner: "Finance & Trade", nextReview: "30 Aug 2026" },
  "bd-environment": { status: "blocked", evidenceCount: 0, owner: "Operations & Compliance", nextReview: "Today" },
  "bd-fire-license": { status: "action_required", evidenceCount: 1, owner: "Operations & Compliance", nextReview: "29 Aug 2026" },
  "bd-factory-license": { status: "under_review", evidenceCount: 2, owner: "Operations & Compliance", nextReview: "1 Sep 2026" },
  "product-hs": { status: "in_progress", evidenceCount: 1, owner: "Product & Quality", nextReview: "28 Aug 2026" },
  "product-specification": { status: "under_review", evidenceCount: 2, owner: "Product & Quality", nextReview: "31 Aug 2026" },
  "product-testing": { status: "blocked", evidenceCount: 1, owner: "Product & Quality", nextReview: "Today" },
  "market-eu": { status: "in_progress", evidenceCount: 1, owner: "Sales & Marketing", nextReview: "2 Sep 2026" },
  "commercial-costing": { status: "action_required", evidenceCount: 0, owner: "Finance & Trade", nextReview: "29 Aug 2026" }
};

const fallbackByPriority: Readonly<Record<ReadinessPriority, RequirementRegisterStatus>> = {
  blocker: "not_started",
  important: "not_started",
  growth: "not_started"
};

export const requirementRegisterRecords: readonly RequirementRegisterRecord[] = readinessRequirementViews("full", requirementRegisterProfile).map((requirement) => {
  const state = seededState[requirement.id] ?? {
    status: fallbackByPriority[requirement.priority],
    evidenceCount: 0,
    owner: "Unassigned",
    nextReview: "Not scheduled"
  };
  return {
    ...requirement,
    sectionLabel: readinessSections.find((section) => section.id === requirement.section)?.label ?? requirement.section,
    ...state
  };
});

export const requirementSectionOptions: ReadonlyArray<{ id: "all" | ReadinessSectionId; label: string }> = [
  { id: "all", label: "All areas" },
  ...readinessSections.map((section) => ({ id: section.id, label: section.label }))
];

export function requirementRegisterSummary(records: readonly RequirementRegisterRecord[]) {
  return {
    total: records.length,
    blockers: records.filter((record) => record.status === "blocked").length,
    actionRequired: records.filter((record) => record.status === "action_required").length,
    inReview: records.filter((record) => record.status === "under_review" || record.status === "evidence_added").length,
    compliant: records.filter((record) => record.status === "compliant").length
  };
}
