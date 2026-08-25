export type ExportOperatingAccess = "public" | "member" | "full";
export type ExportLifecycleStageId =
  | "opportunity"
  | "readiness"
  | "evidence"
  | "buyer"
  | "offer"
  | "production"
  | "shipment"
  | "payment"
  | "repeat";
export type ExportLaneHealth = "on-track" | "needs-attention" | "blocked";
export type ExportIncoterm = "FOB" | "CIF" | "DDP";

export interface ExportLifecycleStage {
  id: ExportLifecycleStageId;
  label: string;
  status: "complete" | "active" | "upcoming" | "blocked";
  owner: string;
}

export interface ExportLane {
  id: string;
  organizationId: string;
  organizationName: string;
  productName: string;
  sku: string;
  hsCode: string;
  destinationCode: string;
  destinationName: string;
  destinationFlag: string;
  buyerSegment: string;
  salesChannel: string;
  health: ExportLaneHealth;
  readinessScore: number;
  targetMarginPercent: number;
  blockers: readonly string[];
  nextGate: string;
  stages: readonly ExportLifecycleStage[];
}

export interface CommercialScenarioInput {
  incoterm: ExportIncoterm;
  units: number;
  unitExFactoryUsd: number;
  unitPackagingUsd: number;
  quoteUnitUsd: number;
  inlandUsd: number;
  documentationUsd: number;
  testingUsd: number;
  freightUsd: number;
  insurancePercent: number;
  commissionPercent: number;
  financePercent: number;
  fxBufferPercent: number;
  estimatedDutyPercent: number;
  destinationTaxPercent: number;
  targetMarginPercent: number;
}

export interface CommercialScenarioResult {
  sellValueUsd: number;
  costBaseUsd: number;
  sellerCostUsd: number;
  grossMarginUsd: number;
  grossMarginPercent: number;
  customsValueUsd: number;
  estimatedDutyUsd: number;
  estimatedDestinationTaxUsd: number;
  estimatedLandedValueUsd: number;
  breakEvenUnitUsd: number;
  warnings: readonly string[];
}

export interface BuyerProspect {
  id: string;
  laneId: string;
  organizationName: string;
  country: string;
  buyerType: string;
  fitScore: number;
  paymentConfidence: "high" | "medium" | "unverified";
  estimatedAnnualUnits: string;
  decisionMaker?: string;
  contactRoute?: string;
  evidence: readonly string[];
}

export interface DealMilestone {
  id: string;
  laneId: string;
  label: string;
  owner: string;
  dueAt: string;
  status: "complete" | "active" | "upcoming" | "blocked";
  evidence?: string;
}

export interface QualifiedProvider {
  id: string;
  laneId: string;
  category: string;
  name: string;
  location: string;
  credential: string;
  responseTime: string;
  feeGuide: string;
  commissionDisclosure: string;
  contactRoute?: string;
  verifiedAt: string;
}

export interface FinancePath {
  id: string;
  laneId: string;
  product: string;
  providerName: string;
  purpose: string;
  indicativeRange: string;
  readiness: number;
  missing: readonly string[];
  applicationRoute?: string;
  disclosure: string;
}

export interface ShipmentCheckpoint {
  id: string;
  laneId: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "at-risk";
  plannedAt: string;
  owner: string;
  detail: string;
}

export interface PolicySignal {
  id: string;
  laneId: string;
  title: string;
  applicability: "applies" | "monitor" | "not-applicable";
  summary: string;
  consequence: string;
  publisher: string;
  sourceUrl: string;
  reviewedAt: string;
}

export interface ExportCluster {
  id: string;
  laneId: string;
  title: string;
  location: string;
  targetMarket: string;
  sharedNeed: string;
  openCapacity: string;
  participantCount: number;
  coordinator?: string;
}

export interface TrustPassport {
  laneId: string;
  businessVerification: "verified" | "pending" | "unverified";
  identityChecks: number;
  evidenceChecks: number;
  capacityStatement: string;
  refreshedAt: string;
  shareId?: string;
}

const money = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const nonNegative = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const rate = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) / 100;

export function calculateCommercialScenario(input: CommercialScenarioInput): CommercialScenarioResult {
  const warnings: string[] = [];
  const units = nonNegative(input.units);
  const quoteUnit = nonNegative(input.quoteUnitUsd);
  if (!units) warnings.push("Add a positive sellable quantity.");
  if (!quoteUnit) warnings.push("Add a positive quoted unit price.");

  const goods = units * nonNegative(input.unitExFactoryUsd);
  const packaging = units * nonNegative(input.unitPackagingUsd);
  const base = goods + packaging + nonNegative(input.inlandUsd) + nonNegative(input.documentationUsd) + nonNegative(input.testingUsd);
  const freight = input.incoterm === "FOB" ? 0 : nonNegative(input.freightUsd);
  const insurance = input.incoterm === "FOB" ? 0 : (base + freight) * rate(input.insurancePercent);
  const sellValue = units * quoteUnit;
  const commission = sellValue * rate(input.commissionPercent);
  const finance = sellValue * rate(input.financePercent);
  const fxBuffer = (base + freight + insurance) * rate(input.fxBufferPercent);
  const sellerCost = base + freight + insurance + commission + finance + fxBuffer;
  const grossMargin = sellValue - sellerCost;
  const grossMarginPercent = sellValue > 0 ? grossMargin / sellValue * 100 : 0;
  const customsValue = input.incoterm === "FOB" ? sellValue + nonNegative(input.freightUsd) + (base + nonNegative(input.freightUsd)) * rate(input.insurancePercent) : sellValue;
  const estimatedDuty = customsValue * rate(input.estimatedDutyPercent);
  const destinationTax = (customsValue + estimatedDuty) * rate(input.destinationTaxPercent);
  const landed = customsValue + estimatedDuty + destinationTax;
  const breakEvenUnit = units > 0 ? sellerCost / units : 0;

  if (grossMarginPercent < 0) warnings.push("The current quote is below the estimated seller cost.");
  else if (grossMarginPercent < Math.max(0, input.targetMarginPercent)) warnings.push("The current margin is below the lane target.");
  if (input.incoterm !== "FOB" && nonNegative(input.freightUsd) === 0) warnings.push("Add a freight assumption for this Incoterm.");
  if (input.estimatedDutyPercent === 0) warnings.push("Confirm preferential duty and origin eligibility before relying on a zero-duty assumption.");
  warnings.push("Destination duty and tax are estimates; confirm the HS code, valuation, preference, importer and current tariff.");

  return {
    sellValueUsd: money(sellValue),
    costBaseUsd: money(base),
    sellerCostUsd: money(sellerCost),
    grossMarginUsd: money(grossMargin),
    grossMarginPercent: money(grossMarginPercent),
    customsValueUsd: money(customsValue),
    estimatedDutyUsd: money(estimatedDuty),
    estimatedDestinationTaxUsd: money(destinationTax),
    estimatedLandedValueUsd: money(landed),
    breakEvenUnitUsd: money(breakEvenUnit),
    warnings
  };
}

export function exportLaneProgress(lane: ExportLane): { completed: number; total: number; percent: number } {
  const completed = lane.stages.filter((stage) => stage.status === "complete").length;
  return { completed, total: lane.stages.length, percent: Math.round(completed / Math.max(1, lane.stages.length) * 100) };
}

export function commercialReadiness(input: {
  scenario: CommercialScenarioInput;
  hsCodeConfirmed: boolean;
  capacityConfirmed: boolean;
  paymentRouteConfirmed: boolean;
  buyerVerified: boolean;
}): { score: number; gaps: readonly string[] } {
  const gaps: string[] = [];
  let score = 100;
  const result = calculateCommercialScenario(input.scenario);
  if (!input.hsCodeConfirmed) { score -= 25; gaps.push("Confirm the HS classification."); }
  if (!input.capacityConfirmed) { score -= 20; gaps.push("Confirm sellable capacity and lead time."); }
  if (!input.paymentRouteConfirmed) { score -= 20; gaps.push("Confirm the payment and proceeds route with the AD bank."); }
  if (!input.buyerVerified) { score -= 15; gaps.push("Verify the buyer entity and signatory."); }
  if (result.grossMarginPercent < input.scenario.targetMarginPercent) { score -= 20; gaps.push("Approve an economics scenario that meets the target margin."); }
  return { score: Math.min(100, Math.max(0, score)), gaps };
}

export const exportLaneCatalog: readonly ExportLane[] = [{
  id: "lane-abc-de-oxford",
  organizationId: "org_abc_textiles",
  organizationName: "ABC Textiles",
  productName: "Men's Cotton Oxford Shirt",
  sku: "ABC-MOS-014",
  hsCode: "6205.20",
  destinationCode: "DE",
  destinationName: "Germany",
  destinationFlag: "🇩🇪",
  buyerSegment: "Private-label apparel importer",
  salesChannel: "Wholesale / distributor",
  health: "needs-attention",
  readinessScore: 74,
  targetMarginPercent: 18,
  blockers: ["Current product test evidence", "Importer packaging responsibility", "Approved payment route"],
  nextGate: "Approve buyer-ready quotation",
  stages: [
    { id: "opportunity", label: "Opportunity", status: "complete", owner: "Nadia Rahman" },
    { id: "readiness", label: "Readiness", status: "complete", owner: "Nadia Rahman" },
    { id: "evidence", label: "Evidence", status: "active", owner: "Lisa Weber" },
    { id: "buyer", label: "Buyer", status: "active", owner: "Anna Müller" },
    { id: "offer", label: "Offer", status: "blocked", owner: "Nadia Rahman" },
    { id: "production", label: "Production", status: "upcoming", owner: "Factory team" },
    { id: "shipment", label: "Shipment", status: "upcoming", owner: "Logistics" },
    { id: "payment", label: "Payment", status: "upcoming", owner: "Finance" },
    { id: "repeat", label: "Repeat", status: "upcoming", owner: "Commercial" }
  ]
}];

export const defaultCommercialScenario: CommercialScenarioInput = {
  incoterm: "FOB", units: 5000, unitExFactoryUsd: 4.85, unitPackagingUsd: .22,
  quoteUnitUsd: 7.65, inlandUsd: 920, documentationUsd: 480, testingUsd: 1250,
  freightUsd: 4300, insurancePercent: .65, commissionPercent: 2.5,
  financePercent: 1.4, fxBufferPercent: 1.5, estimatedDutyPercent: 0,
  destinationTaxPercent: 19, targetMarginPercent: 18
};

export const buyerProspects: readonly BuyerProspect[] = [
  { id:"buyer-nord", laneId:"lane-abc-de-oxford", organizationName:"NordWerk Handel", country:"Germany", buyerType:"Private-label importer", fitScore:88, paymentConfidence:"high", estimatedAnnualUnits:"45k–70k", decisionMaker:"Category director", contactRoute:"Verified corporate route", evidence:["Active German entity", "Relevant menswear assortment", "Supplier code published"] },
  { id:"buyer-hanse", laneId:"lane-abc-de-oxford", organizationName:"Hanse Apparel Group", country:"Germany", buyerType:"Multi-brand wholesaler", fitScore:81, paymentConfidence:"medium", estimatedAnnualUnits:"25k–40k", decisionMaker:"Sourcing lead", contactRoute:"Trade-fair introduction", evidence:["Import-led assortment", "Bangladesh sourcing signal"] },
  { id:"buyer-rhein", laneId:"lane-abc-de-oxford", organizationName:"Rhein Basics", country:"Germany", buyerType:"Digital basics retailer", fitScore:76, paymentConfidence:"unverified", estimatedAnnualUnits:"12k–24k", evidence:["Relevant price band", "Public sustainability claims require validation"] }
];

export const dealMilestones: readonly DealMilestone[] = [
  { id:"deal-spec", laneId:"lane-abc-de-oxford", label:"Controlled product specification", owner:"Nadia Rahman", dueAt:"2026-08-22", status:"complete", evidence:"Specification v4" },
  { id:"deal-test", laneId:"lane-abc-de-oxford", label:"Current test-report scope", owner:"Lisa Weber", dueAt:"2026-08-28", status:"blocked" },
  { id:"deal-price", laneId:"lane-abc-de-oxford", label:"Approve quotation economics", owner:"Nadia Rahman", dueAt:"2026-08-29", status:"active" },
  { id:"deal-buyer", laneId:"lane-abc-de-oxford", label:"Approve first buyer cohort", owner:"Anna Müller", dueAt:"2026-09-01", status:"upcoming" },
  { id:"deal-sample", laneId:"lane-abc-de-oxford", label:"Release sample instruction", owner:"Factory team", dueAt:"2026-09-05", status:"upcoming" }
];

export const qualifiedProviders: readonly QualifiedProvider[] = [
  { id:"provider-lab", laneId:"lane-abc-de-oxford", category:"Accredited testing laboratory", name:"Dhaka Textile Evidence Lab", location:"Dhaka", credential:"Illustrative ISO/IEC 17025 scope — verify before engagement", responseTime:"1 business day", feeGuide:"Quote required", commissionDisclosure:"Export HQ may receive a disclosed referral fee after engagement; ranking is not affected.", contactRoute:"Protected request", verifiedAt:"2026-08-20" },
  { id:"provider-bank", laneId:"lane-abc-de-oxford", category:"Authorized Dealer bank", name:"Bangladesh AD Trade Desk", location:"Dhaka", credential:"Illustrative trade-service profile — confirm branch authorization", responseTime:"4 business hours", feeGuide:"Bank tariff applies", commissionDisclosure:"No commission is assumed. Any commercial arrangement must be disclosed before referral.", contactRoute:"Protected request", verifiedAt:"2026-08-18" },
  { id:"provider-forwarder", laneId:"lane-abc-de-oxford", category:"Freight and customs", name:"Bay-to-Europe Logistics", location:"Chattogram", credential:"Illustrative forwarding profile — licence and insurance pending production review", responseTime:"2 business hours", feeGuide:"Lane quote required", commissionDisclosure:"Export HQ may receive a disclosed booking commission; quality ranking remains independent.", contactRoute:"Protected request", verifiedAt:"2026-08-19" }
];

export const financePaths: readonly FinancePath[] = [
  { id:"finance-preship", laneId:"lane-abc-de-oxford", product:"Pre-shipment working capital", providerName:"Partner AD bank comparison", purpose:"Raw material and production funding against an eligible export order", indicativeRange:"Subject to bank appraisal", readiness:68, missing:["Approved buyer order", "Current insurance position", "Final proceeds route"], applicationRoute:"Protected finance introduction", disclosure:"Illustrative readiness only; ExportPanel does not approve credit or set bank terms." },
  { id:"finance-receivable", laneId:"lane-abc-de-oxford", product:"Post-shipment / receivable finance", providerName:"Trade finance partner panel", purpose:"Bridge accepted receivables until buyer payment", indicativeRange:"Subject to buyer, documents and tenor", readiness:54, missing:["Verified buyer credit", "Final transport documents"], applicationRoute:"Protected finance introduction", disclosure:"Any referral compensation must be disclosed before an application is shared." }
];

export const shipmentCheckpoints: readonly ShipmentCheckpoint[] = [
  { id:"ship-booking", laneId:"lane-abc-de-oxford", label:"Indicative freight route", state:"complete", plannedAt:"2026-09-08", owner:"Freight partner", detail:"Chattogram → Hamburg planning lane; no booking confirmed." },
  { id:"ship-pack", laneId:"lane-abc-de-oxford", label:"Packaging and marks", state:"current", plannedAt:"2026-09-12", owner:"Factory team", detail:"Importer packaging responsibility remains open." },
  { id:"ship-docs", laneId:"lane-abc-de-oxford", label:"Shipment document reconciliation", state:"at-risk", plannedAt:"2026-09-18", owner:"Commercial operations", detail:"Origin and EXP routes need named owners before release." },
  { id:"ship-handover", laneId:"lane-abc-de-oxford", label:"Cargo handover", state:"upcoming", plannedAt:"2026-09-22", owner:"Freight partner", detail:"Depends on inspection and document release." },
  { id:"ship-proceeds", laneId:"lane-abc-de-oxford", label:"Export proceeds follow-up", state:"upcoming", plannedAt:"2026-10-22", owner:"Finance", detail:"Track invoice, bank reference, due date and realization." }
];

export const policySignals: readonly PolicySignal[] = [
  { id:"policy-bsw", laneId:"lane-abc-de-oxford", title:"Bangladesh Single Window certificate route", applicability:"applies", summary:"Relevant certificates, licences and permits from participating agencies must use the official BSW route.", consequence:"Prepare consistent BIN, licence and product data before starting an official submission.", publisher:"Bangladesh National Board of Revenue", sourceUrl:"https://nbr.gov.bd/uploads/public-notice/%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%87%E0%A6%B8_%E0%A6%B0%E0%A6%BF%E0%A6%B2%E0%A6%BF%E0%A6%9C-NSW_30062025.pdf", reviewedAt:"2026-08-25" },
  { id:"policy-ldc", laneId:"lane-abc-de-oxford", title:"Bangladesh LDC graduation scenario", applicability:"monitor", summary:"The graduation timetable and any extension decision can change preference-transition assumptions.", consequence:"Keep tariff and origin scenarios versioned by shipment date; do not hardcode a single outcome.", publisher:"United Nations LDC Portal", sourceUrl:"https://www.un.org/ldcportal/content/bangladesh-graduation-status", reviewedAt:"2026-08-25" },
  { id:"policy-eu-gsp", laneId:"lane-abc-de-oxford", title:"EU preference transition", applicability:"monitor", summary:"EBA transition and possible GSP+ eligibility affect future tariff and origin economics.", consequence:"Confirm the applicable preference and proof of origin for each quotation and shipment date.", publisher:"European Commission", sourceUrl:"https://policy.trade.ec.europa.eu/development-and-sustainability/generalised-scheme-preferences/questions-answers-new-eu-generalised-scheme-preferences_en", reviewedAt:"2026-08-25" },
  { id:"policy-cbam", laneId:"lane-abc-de-oxford", title:"EU CBAM sector screen", applicability:"not-applicable", summary:"The current shirt HS lane is not one of the listed CBAM sectors.", consequence:"No CBAM cost is added to this scenario; continue monitoring energy and buyer sustainability evidence separately.", publisher:"European Commission", sourceUrl:"https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en", reviewedAt:"2026-08-25" }
];

export const exportClusters: readonly ExportCluster[] = [{
  id:"cluster-de-shirts", laneId:"lane-abc-de-oxford", title:"Germany responsible-shirts evidence cohort", location:"Dhaka / Gazipur", targetMarket:"Germany", sharedNeed:"Shared training, packaging review and laboratory scheduling", openCapacity:"2 member places", participantCount:5, coordinator:"Export HQ cluster desk"
}];

export const trustPassports: readonly TrustPassport[] = [{
  laneId:"lane-abc-de-oxford", businessVerification:"verified", identityChecks:6, evidenceChecks:11,
  capacityStatement:"Illustrative capacity declaration: 22,000 shirts/month subject to order and line plan.", refreshedAt:"2026-08-24", shareId:"passport-abc-public-projection"
}];

export interface ExportOperatingSystemView {
  access: ExportOperatingAccess;
  lane: ExportLane;
  scenario?: CommercialScenarioInput;
  buyers: ReadonlyArray<Omit<BuyerProspect, "decisionMaker" | "contactRoute"> & { decisionMaker?: string; contactRoute?: string }>;
  milestones: readonly DealMilestone[];
  providers: ReadonlyArray<Pick<QualifiedProvider, "id" | "laneId" | "category" | "commissionDisclosure"> & Partial<QualifiedProvider>>;
  finance: ReadonlyArray<Pick<FinancePath, "id" | "laneId" | "product" | "purpose" | "readiness" | "missing" | "disclosure"> & Partial<FinancePath>>;
  shipment: readonly ShipmentCheckpoint[];
  policies: readonly PolicySignal[];
  clusters: readonly ExportCluster[];
  passport?: TrustPassport;
}

export function operatingSystemView(access: ExportOperatingAccess): ExportOperatingSystemView {
  const lane = exportLaneCatalog[0]!;
  if (access === "public") return {
    access,
    lane: { ...lane, organizationId:"public", organizationName:"Bangladesh exporter", sku:"Controlled product", blockers:[], stages:lane.stages.map(({ id,label,status,owner }) => ({ id,label,status,owner:owner ? "Assigned owner" : "Unassigned" })) },
    buyers: buyerProspects.map(({ decisionMaker: _decisionMaker, contactRoute: _contactRoute, evidence: _evidence, ...buyer }) => ({ ...buyer, evidence:[] })),
    milestones: dealMilestones.map(({ evidence: _evidence, ...milestone }) => milestone),
    providers: Array.from(new Map(qualifiedProviders.map((provider) => [provider.category, { id:provider.id, laneId:provider.laneId, category:provider.category, commissionDisclosure:provider.commissionDisclosure }])).values()),
    finance: financePaths.map(({ id,laneId,product,purpose,readiness,missing,disclosure }) => ({ id,laneId,product,purpose,readiness,missing,disclosure })),
    shipment: shipmentCheckpoints.map((checkpoint) => ({ ...checkpoint, owner:"Assigned after onboarding" })),
    policies: policySignals,
    clusters: exportClusters.map(({ coordinator: _coordinator, ...cluster }) => cluster)
  };
  if (access === "member") return {
    access, lane, scenario:defaultCommercialScenario,
    buyers:buyerProspects.map(({ decisionMaker:_decisionMaker, contactRoute:_contactRoute, ...buyer }) => buyer),
    milestones:dealMilestones,
    providers:qualifiedProviders.map(({ id,laneId,category,commissionDisclosure,location,responseTime,verifiedAt }) => ({ id,laneId,category,commissionDisclosure,location,responseTime,verifiedAt })),
    finance:financePaths.map(({ applicationRoute:_applicationRoute,providerName:_providerName,indicativeRange:_indicativeRange,...path }) => path),
    shipment:shipmentCheckpoints, policies:policySignals, clusters:exportClusters.map(({ coordinator:_coordinator,...cluster }) => cluster)
  };
  return { access, lane, scenario:defaultCommercialScenario, buyers:buyerProspects, milestones:dealMilestones, providers:qualifiedProviders, finance:financePaths, shipment:shipmentCheckpoints, policies:policySignals, clusters:exportClusters, passport:trustPassports[0]! };
}
