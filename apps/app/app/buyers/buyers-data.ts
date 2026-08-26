export type BuyerStage = "identified" | "qualified" | "sample" | "negotiation" | "order_ready";
export type BuyerRisk = "low" | "medium" | "high";

export interface BuyerPipelineRecord {
  id: string;
  company: string;
  city: string;
  country: string;
  segment: string;
  stage: BuyerStage;
  fitScore: number;
  confidence: "high" | "medium";
  owner: string;
  lane: string;
  product: string;
  nextAction: string;
  dueLabel: string;
  lastSignal: string;
  source: string;
  contactRole: string;
  estimatedAnnualValue: string;
  trustSignals: readonly string[];
  risks: readonly { level: BuyerRisk; label: string }[];
  notes: string;
}

export const buyerStageCatalog: ReadonlyArray<{ id: BuyerStage; label: string; shortLabel: string }> = [
  { id: "identified", label: "Identified", shortLabel: "New" },
  { id: "qualified", label: "Qualified", shortLabel: "Qualified" },
  { id: "sample", label: "Sample & validation", shortLabel: "Sample" },
  { id: "negotiation", label: "Commercial negotiation", shortLabel: "Negotiation" },
  { id: "order_ready", label: "Order ready", shortLabel: "Order ready" }
];

/**
 * Fictional buyer records used to exercise the pipeline safely until a
 * reviewed buyer-data source and tenant repository are connected.
 */
export const illustrativeBuyerPipeline: readonly BuyerPipelineRecord[] = [
  {
    id: "buyer_nordhavn",
    company: "Nordhavn Basics GmbH",
    city: "Hamburg",
    country: "Germany",
    segment: "Sustainable apparel distributor",
    stage: "negotiation",
    fitScore: 91,
    confidence: "high",
    owner: "Nadia Rahman",
    lane: "Cotton apparel · Germany",
    product: "Premium piqué polo",
    nextAction: "Confirm pilot MOQ, Incoterm and payment security",
    dueLabel: "Today · 16:00",
    lastSignal: "Requested a revised pilot quotation and lab-report scope.",
    source: "Export HQ managed research · illustrative",
    contactRole: "Sourcing director",
    estimatedAnnualValue: "€180k–€260k",
    trustSignals: ["Legal entity reviewed", "Product range aligned", "Pilot brief received"],
    risks: [{ level: "medium", label: "Open-account request needs bank review" }],
    notes: "Strong fit for the controlled polo range. Keep the pilot narrow until payment protection and colour-variant testing are agreed."
  },
  {
    id: "buyer_lowland",
    company: "Lowland Workwear B.V.",
    city: "Rotterdam",
    country: "Netherlands",
    segment: "Workwear importer",
    stage: "sample",
    fitScore: 87,
    confidence: "high",
    owner: "Rahim Ahmed",
    lane: "Workwear · Netherlands",
    product: "Cotton Oxford shirt",
    nextAction: "Dispatch labelled sample set after artwork approval",
    dueLabel: "28 Aug",
    lastSignal: "Approved fabric hand-feel; requested wash and colourfastness evidence.",
    source: "Trade-fair follow-up · illustrative",
    contactRole: "Product development manager",
    estimatedAnnualValue: "€140k–€210k",
    trustSignals: ["Importer route confirmed", "Sample brief received", "References recorded"],
    risks: [{ level: "low", label: "Label artwork awaiting final review" }],
    notes: "Sample scope is controlled. Link every submitted colour to the applicable test report before dispatch."
  },
  {
    id: "buyer_kansai",
    company: "Kansai Select Trading",
    city: "Osaka",
    country: "Japan",
    segment: "Specialty textile trading house",
    stage: "qualified",
    fitScore: 84,
    confidence: "medium",
    owner: "Anna Müller",
    lane: "Premium shirts · Japan",
    product: "Fine cotton Oxford shirt",
    nextAction: "Validate importer specifications and Japanese care-label needs",
    dueLabel: "29 Aug",
    lastSignal: "Shared a construction sheet and requested a capability call.",
    source: "Market-entry adviser referral · illustrative",
    contactRole: "Merchandising lead",
    estimatedAnnualValue: "¥18m–¥28m",
    trustSignals: ["Business identity reviewed", "Product brief received"],
    risks: [{ level: "medium", label: "Localization and tolerance review incomplete" }],
    notes: "Promising premium route, but qualification depends on exact construction tolerances, labels and importer responsibilities."
  },
  {
    id: "buyer_dune",
    company: "Dune Retail Supply LLC",
    city: "Dubai",
    country: "United Arab Emirates",
    segment: "Multi-brand retail supplier",
    stage: "identified",
    fitScore: 78,
    confidence: "medium",
    owner: "Lisa Weber",
    lane: "Casual apparel · UAE",
    product: "Cotton polo range",
    nextAction: "Verify licensed importer and product conformity scope",
    dueLabel: "1 Sep",
    lastSignal: "Matched to the category through the UAE opportunity shortlist.",
    source: "ExportPanel opportunity shortlist · illustrative",
    contactRole: "Category sourcing manager",
    estimatedAnnualValue: "US$120k–US$190k",
    trustSignals: ["Category fit scored", "Route-to-market hypothesis recorded"],
    risks: [{ level: "high", label: "Importer and conformity route not yet verified" }],
    notes: "Do not begin outbound contact until the licensed importer, regulated-product screen and commercial route are confirmed."
  },
  {
    id: "buyer_atlas",
    company: "Atlas Uniform Projects",
    city: "Riyadh",
    country: "Saudi Arabia",
    segment: "Corporate uniform contractor",
    stage: "qualified",
    fitScore: 82,
    confidence: "medium",
    owner: "Rahim Ahmed",
    lane: "Uniforms · Saudi Arabia",
    product: "Corporate shirt programme",
    nextAction: "Confirm tender calendar and Saber responsibility matrix",
    dueLabel: "2 Sep",
    lastSignal: "Confirmed interest in a small pre-tender sample programme.",
    source: "Qualified partner introduction · illustrative",
    contactRole: "Tender manager",
    estimatedAnnualValue: "SAR 520k–SAR 760k",
    trustSignals: ["Company identity reviewed", "Use case qualified", "Sample interest confirmed"],
    risks: [{ level: "medium", label: "Tender dates and certificate owner unresolved" }],
    notes: "Treat this as a validation programme, not a forecast. Confirm the tender authority and conformity ownership before costing."
  },
  {
    id: "buyer_cedar",
    company: "Cedar & Loom Ltd",
    city: "Manchester",
    country: "United Kingdom",
    segment: "Independent apparel wholesaler",
    stage: "order_ready",
    fitScore: 89,
    confidence: "high",
    owner: "Nadia Rahman",
    lane: "Cotton shirts · United Kingdom",
    product: "Oxford shirt capsule",
    nextAction: "Approve contract, documentary collection and production slot",
    dueLabel: "Today · 12:00",
    lastSignal: "Accepted the revised quality schedule and requested final contract.",
    source: "Managed buyer development · illustrative",
    contactRole: "Managing buyer",
    estimatedAnnualValue: "£135k–£190k",
    trustSignals: ["Entity and references reviewed", "Sample accepted", "Costing approved", "Quality schedule agreed"],
    risks: [{ level: "low", label: "Final payment instrument approval pending" }],
    notes: "Commercially advanced. No production commitment should be made until the signed contract and bank-approved payment route are recorded."
  }
];

export function buyerPipelineSummary(records: readonly BuyerPipelineRecord[]) {
  return {
    total: records.length,
    qualified: records.filter((record) => record.stage !== "identified").length,
    activeSamples: records.filter((record) => record.stage === "sample").length,
    commercial: records.filter((record) => record.stage === "negotiation" || record.stage === "order_ready").length,
    needsRiskReview: records.filter((record) => record.risks.some((risk) => risk.level === "high")).length
  };
}
