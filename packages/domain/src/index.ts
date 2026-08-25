export type Responsibility = "customer" | "export_hq" | "third_party";
export * from "./market-opportunities";
export * from "./export-readiness";
export * from "./export-operating-system";
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "waiting_customer"
  | "waiting_export_hq"
  | "waiting_third_party"
  | "completed"
  | "blocked";

export type ReadinessArea =
  | "company"
  | "products"
  | "compliance"
  | "documents"
  | "market"
  | "buyer_pipeline"
  | "execution"
  | "logistics";

export interface ReadinessDimension {
  area: ReadinessArea;
  label: string;
  score: number;
  weight: number;
}

export interface ExportTask {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  responsibility: Responsibility;
  ownerName: string;
  dueAt: string;
  status: TaskStatus;
  priority: "urgent" | "high" | "normal";
  relatedEntity: string;
}

export interface ProductSummary {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  composition: string;
  hsCode: string;
  market: string;
  readiness: number;
  status: "ready" | "needs_work" | "under_review";
}

export interface RequirementSummary {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  jurisdiction: string;
  status: "required" | "in_progress" | "under_review" | "compliant" | "action_required";
  evidence: string;
  sourceLabel: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  reviewState: "platform_verified" | "human_reviewed" | "pending_review";
}

export interface DashboardSnapshot {
  organization: {
    id: string;
    legalName: string;
    tradingName: string;
    originCountry: string;
    industry: string;
    onboardingPercent: number;
    /** Optional tenant branding. Constrained to the four slots in
     *  docs/brand/exportpanel/05-tenant-branding.md. */
    brand?: { name: string; initials?: string; accent?: string; markUrl?: string };
  };
  health: { overall: number; dimensions: ReadinessDimension[] };
  metrics: {
    targetMarkets: number;
    products: number;
    openActions: number;
    documents: number;
  };
  tasks: ExportTask[];
  products: ProductSummary[];
  requirements: RequirementSummary[];
  documents: Array<{
    id: string;
    organizationId: string;
    name: string;
    category: string;
    status: "approved" | "under_review" | "missing";
    updatedAt: string;
    linkedTo: string;
  }>;
  team: Array<{ name: string; role: string; initials: string }>;
  activity: Array<{ id: string; actor: string; action: string; at: string }>;
}

export function calculateExportHealth(dimensions: ReadinessDimension[]): number {
  if (dimensions.length === 0) return 0;
  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  const weighted = dimensions.reduce((sum, item) => {
    const boundedScore = Math.min(100, Math.max(0, item.score));
    return sum + boundedScore * item.weight;
  }, 0);
  return Math.round(weighted / totalWeight);
}

export type JourneyStage =
  | "account_created"
  | "organization_created"
  | "onboarding_completed"
  | "product_created"
  | "market_selected"
  | "readiness_generated"
  | "action_created"
  | "document_uploaded"
  | "staff_reviewed"
  | "customer_notified";

const journeyOrder: JourneyStage[] = [
  "account_created", "organization_created", "onboarding_completed", "product_created",
  "market_selected", "readiness_generated", "action_created", "document_uploaded",
  "staff_reviewed", "customer_notified"
];

export class ExportReadinessJourney {
  readonly organizationId: string;
  private completed = new Set<JourneyStage>();

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  complete(stage: JourneyStage): void {
    const expected = journeyOrder[this.completed.size];
    if (stage !== expected) throw new Error(`Cannot complete ${stage}; expected ${expected}.`);
    this.completed.add(stage);
  }

  hasCompleted(stage: JourneyStage): boolean { return this.completed.has(stage); }
  get nextStage(): JourneyStage | undefined { return journeyOrder[this.completed.size]; }
  get isComplete(): boolean { return this.completed.size === journeyOrder.length; }
}

export const demoSnapshot: DashboardSnapshot = {
  organization: {
    id: "org_abc_textiles",
    legalName: "ABC Textiles Limited",
    tradingName: "ABC Textiles",
    originCountry: "Bangladesh",
    industry: "Apparel manufacturing",
    onboardingPercent: 78,
    brand: { name: "ABC Textiles", initials: "AT", accent: "#1e5aa8" }
  },
  health: {
    overall: 82,
    dimensions: [
      { area: "company", label: "Company", score: 96, weight: 14 },
      { area: "products", label: "Products", score: 91, weight: 16 },
      { area: "compliance", label: "Compliance", score: 74, weight: 20 },
      { area: "documents", label: "Documents", score: 88, weight: 14 },
      { area: "market", label: "Market readiness", score: 67, weight: 16 },
      { area: "buyer_pipeline", label: "Buyer pipeline", score: 66, weight: 8 },
      { area: "execution", label: "Execution", score: 94, weight: 7 },
      { area: "logistics", label: "Logistics", score: 86, weight: 5 }
    ]
  },
  metrics: { targetMarkets: 3, products: 12, openActions: 7, documents: 34 },
  tasks: [
    {
      id: "task_oekotex",
      organizationId: "org_abc_textiles",
      title: "Upload current OEKO-TEX certificate",
      description: "Evidence is needed before the Germany product review can be completed.",
      responsibility: "customer",
      ownerName: "Nadia Rahman",
      dueAt: "2026-08-15",
      status: "waiting_customer",
      priority: "urgent",
      relatedEntity: "Germany readiness"
    },
    {
      id: "task_packaging",
      organizationId: "org_abc_textiles",
      title: "Complete packaging compliance review",
      description: "Export HQ is validating the applicable producer-responsibility route.",
      responsibility: "export_hq",
      ownerName: "Lisa Weber",
      dueAt: "2026-08-18",
      status: "in_progress",
      priority: "high",
      relatedEntity: "Cotton Oxford Shirt"
    },
    {
      id: "task_labelling",
      organizationId: "org_abc_textiles",
      title: "Verify German textile labelling copy",
      description: "Translation and fibre composition order are under specialist review.",
      responsibility: "export_hq",
      ownerName: "Anna Müller",
      dueAt: "2026-08-20",
      status: "waiting_export_hq",
      priority: "normal",
      relatedEntity: "Germany readiness"
    },
    {
      id: "task_test_report",
      organizationId: "org_abc_textiles",
      title: "Confirm test-report scope with laboratory",
      description: "Waiting for the third-party lab to confirm whether the current report covers all colour variants.",
      responsibility: "third_party",
      ownerName: "Intertek Dhaka",
      dueAt: "2026-08-22",
      status: "waiting_third_party",
      priority: "normal",
      relatedEntity: "Cotton Oxford Shirt"
    }
  ],
  products: [
    {
      id: "prod_oxford",
      organizationId: "org_abc_textiles",
      sku: "ABC-MOS-014",
      name: "Men's Cotton Oxford Shirt",
      composition: "100% combed cotton",
      hsCode: "6205.20",
      market: "Germany",
      readiness: 74,
      status: "needs_work"
    },
    {
      id: "prod_polo",
      organizationId: "org_abc_textiles",
      sku: "ABC-MPL-008",
      name: "Premium Piqué Polo",
      composition: "95% cotton, 5% elastane",
      hsCode: "6105.10",
      market: "Germany",
      readiness: 89,
      status: "under_review"
    }
  ],
  requirements: [
    {
      id: "req_textile_label",
      organizationId: "org_abc_textiles",
      title: "EU textile fibre labelling",
      category: "Labelling",
      jurisdiction: "European Union",
      status: "under_review",
      evidence: "Label artwork v3",
      sourceLabel: "Regulation (EU) No 1007/2011",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2011/1007/oj",
      lastVerifiedAt: "2026-08-08",
      reviewState: "human_reviewed"
    },
    {
      id: "req_reach",
      organizationId: "org_abc_textiles",
      title: "REACH restricted substances evidence",
      category: "Chemicals",
      jurisdiction: "European Union",
      status: "action_required",
      evidence: "Current certificate expires in 28 days",
      sourceLabel: "ECHA REACH restrictions",
      sourceUrl: "https://echa.europa.eu/substances-restricted-under-reach",
      lastVerifiedAt: "2026-08-06",
      reviewState: "pending_review"
    }
  ],
  documents: [
    {
      id: "doc_trade_license",
      organizationId: "org_abc_textiles",
      name: "Trade License 2026.pdf",
      category: "Company",
      status: "approved",
      updatedAt: "2026-08-10",
      linkedTo: "ABC Textiles Limited"
    },
    {
      id: "doc_label_artwork",
      organizationId: "org_abc_textiles",
      name: "Germany label artwork v3.pdf",
      category: "Compliance",
      status: "under_review",
      updatedAt: "2026-08-12",
      linkedTo: "EU textile fibre labelling"
    },
    {
      id: "doc_oekotex",
      organizationId: "org_abc_textiles",
      name: "OEKO-TEX Standard 100",
      category: "Certification",
      status: "missing",
      updatedAt: "2026-08-13",
      linkedTo: "Cotton Oxford Shirt"
    }
  ],
  team: [
    { name: "Anna Müller", role: "EU Market Manager", initials: "AM" },
    { name: "Rahim Ahmed", role: "Export Operations", initials: "RA" },
    { name: "Lisa Weber", role: "Compliance Specialist", initials: "LW" }
  ],
  activity: [
    { id: "a1", actor: "Lisa Weber", action: "Started the packaging compliance review", at: "Today, 09:42" },
    { id: "a2", actor: "Nadia Rahman", action: "Uploaded Germany label artwork v3", at: "Yesterday, 16:18" },
    { id: "a3", actor: "Export HQ", action: "Generated 4 readiness actions for Germany", at: "11 Aug, 10:06" }
  ]
};
