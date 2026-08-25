import type { Responsibility, TaskStatus } from "@exporthq/domain";

export interface BlueprintDefinition {
  id: string;
  title: string;
  description: string;
  category: "Market entry" | "Compliance" | "Product" | "Sales" | "Trade operations";
  steps: string[];
  estimate: string;
  owner: string;
  uses: number;
  updatedAt: string;
  builtIn: boolean;
}

export interface BlueprintRun {
  id: string;
  blueprintId: string;
  title: string;
  description: string;
  createdAt: string;
  dueAt: string;
  responsibility: Responsibility;
  ownerName: string;
  relatedEntity: string;
  status: TaskStatus;
  totalSteps: number;
  completedSteps: number;
}

export const blueprintRunsStorageKey = "trevv.blueprint-runs.v1";
export const customBlueprintsStorageKey = "trevv.custom-blueprints.v1";
export const favoriteBlueprintsStorageKey = "trevv.favorite-blueprints.v1";

export const blueprintCatalog: readonly BlueprintDefinition[] = [
  {
    id: "bp-germany-launch",
    title: "Germany market launch",
    description: "Prepare one product for a structured wholesale launch in Germany.",
    category: "Market entry",
    steps: ["Confirm the product-market objective", "Verify HS classification", "Map applicable requirements", "Review labels and packaging", "Complete landed-cost assumptions", "Build the buyer shortlist", "Approve the launch checkpoint"],
    estimate: "4–6 weeks",
    owner: "Export HQ + customer",
    uses: 18,
    updatedAt: "18 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-product-readiness",
    title: "New product readiness",
    description: "Create the minimum verified product record before selecting a market.",
    category: "Product",
    steps: ["Capture composition and specifications", "Add HS code candidate", "Upload technical evidence", "Review production capacity", "Confirm commercial assumptions"],
    estimate: "3–5 days",
    owner: "Customer",
    uses: 27,
    updatedAt: "21 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-compliance-review",
    title: "Market compliance review",
    description: "Turn sourced requirements into an owned evidence and remediation plan.",
    category: "Compliance",
    steps: ["Define scope and jurisdiction", "Collect authoritative sources", "Assess applicability", "Link current evidence", "Identify gaps", "Assign remediation", "Record human review"],
    estimate: "1–2 weeks",
    owner: "Export HQ",
    uses: 31,
    updatedAt: "23 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-evidence-renewal",
    title: "Evidence renewal",
    description: "Replace expiring certificates without losing document history or requirement links.",
    category: "Compliance",
    steps: ["Confirm expiry and coverage", "Request renewal evidence", "Upload the new version", "Complete specialist review", "Relink affected requirements", "Archive the superseded version"],
    estimate: "2–4 weeks",
    owner: "Customer + third party",
    uses: 12,
    updatedAt: "16 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-buyer-qualification",
    title: "Buyer qualification sprint",
    description: "Research and prioritize a defensible shortlist for one market and offer.",
    category: "Sales",
    steps: ["Define the ideal buyer profile", "Build the longlist", "Verify relevance and fit", "Score commercial potential", "Identify decision makers", "Approve the outreach shortlist"],
    estimate: "5–8 days",
    owner: "Export HQ",
    uses: 22,
    updatedAt: "19 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-sample-request",
    title: "Buyer sample request",
    description: "Coordinate specification, production, approvals, dispatch, and buyer follow-up.",
    category: "Sales",
    steps: ["Confirm buyer specification", "Approve sample cost", "Schedule production", "Complete internal quality check", "Prepare courier documents", "Dispatch and track", "Record buyer feedback"],
    estimate: "7–14 days",
    owner: "Customer",
    uses: 9,
    updatedAt: "12 Aug 2026",
    builtIn: true
  },
  {
    id: "bp-shipment-readiness",
    title: "Shipment readiness checkpoint",
    description: "Confirm commercial, document, quality, and logistics readiness before dispatch.",
    category: "Trade operations",
    steps: ["Confirm order and Incoterm", "Verify production completion", "Approve inspection evidence", "Complete shipping documents", "Confirm freight booking", "Review customs data", "Authorize dispatch"],
    estimate: "3–7 days",
    owner: "Customer + partners",
    uses: 15,
    updatedAt: "24 Aug 2026",
    builtIn: true
  }
];

export function readStoredArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}
