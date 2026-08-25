export const EXPORT_READINESS_METHOD_VERSION = "Bangladesh Export Readiness v1.0";
export const EXPORT_READINESS_REVIEWED_AT = "2026-08-25";

export type ReadinessSectionId =
  | "business"
  | "registrations"
  | "facility"
  | "product"
  | "market"
  | "commercial"
  | "delivery"
  | "digital";

export type ReadinessStatus =
  | "not_started"
  | "in_progress"
  | "evidence_added"
  | "verified"
  | "blocked"
  | "not_applicable";

export type ReadinessPriority = "blocker" | "important" | "growth";
export type ReadinessBusinessModel = "manufacturer" | "trader" | "service";
export type ReadinessProductCategory =
  | "apparel"
  | "leather"
  | "jute"
  | "food"
  | "engineering"
  | "software"
  | "other";

export type ReadinessProviderCategory =
  | "corporate-legal"
  | "tax-vat"
  | "trade-registration"
  | "factory-licensing"
  | "environmental"
  | "fire-safety"
  | "standards-lab"
  | "customs-clearing"
  | "authorized-dealer-bank"
  | "freight-logistics"
  | "trade-insurance"
  | "packaging-labeling"
  | "market-entry"
  | "buying-house"
  | "digital-it"
  | "ip-trademark"
  | "translation-localization"
  | "quality-inspection";

export interface ReadinessProfile {
  businessModel: ReadinessBusinessModel;
  productCategory: ReadinessProductCategory;
  productName: string;
  hsCode: string;
  targetMarketCode: "DE" | "NL" | "GB" | "JP" | "SA" | "AE";
  salesChannel: "wholesale" | "retail" | "marketplace" | "services";
}

export interface ReadinessSource {
  label: string;
  publisher: string;
  url: string;
  reviewedAt: string;
}

export interface ReadinessRequirement {
  id: string;
  section: ReadinessSectionId;
  title: string;
  checkpoint: string;
  priority: ReadinessPriority;
  memberSummary: string;
  resolution: readonly string[];
  evidence: readonly string[];
  learnTopic: string;
  providerCategories: readonly ReadinessProviderCategory[];
  sources: readonly ReadinessSource[];
  weight: number;
  condition?: {
    businessModels?: readonly ReadinessBusinessModel[];
    productCategories?: readonly ReadinessProductCategory[];
    targetMarkets?: readonly ReadinessProfile["targetMarketCode"][];
    salesChannels?: readonly ReadinessProfile["salesChannel"][];
  };
}

export interface ReadinessRequirementView {
  id: string;
  section: ReadinessSectionId;
  title: string;
  checkpoint: string;
  priority: ReadinessPriority;
  memberSummary: string;
  learnTopic: string;
  sources: readonly ReadinessSource[];
  weight: number;
  hasProviderSupport: boolean;
  fullResolution?: {
    resolution: readonly string[];
    evidence: readonly string[];
    providerCategories: readonly ReadinessProviderCategory[];
  };
}

export const readinessSections = [
  { id: "business", label: "Business identity", shortLabel: "Identity", description: "Prove who the exporter is and who may sign." },
  { id: "registrations", label: "Export registrations", shortLabel: "Registrations", description: "Establish the legal right and banking path to export." },
  { id: "facility", label: "Facility & operations", shortLabel: "Operations", description: "Check site, safety, labour and environmental permissions." },
  { id: "product", label: "Product evidence", shortLabel: "Product", description: "Classify, test, label and prove the offer." },
  { id: "market", label: "Target market", shortLabel: "Market", description: "Map destination duties, controls and importer obligations." },
  { id: "commercial", label: "Commercial readiness", shortLabel: "Commercial", description: "Prove capacity, pricing and buyer-facing credibility." },
  { id: "delivery", label: "Trade delivery", shortLabel: "Delivery", description: "Prepare payment, shipment and customs execution." },
  { id: "digital", label: "Digital trust", shortLabel: "Digital", description: "Make the business credible, reachable and secure online." }
] as const satisfies ReadonlyArray<{ id: ReadinessSectionId; label: string; shortLabel: string; description: string }>;

export const readinessProviderCatalog: Readonly<Record<ReadinessProviderCategory, { label: string; description: string }>> = {
  "corporate-legal": { label: "Corporate lawyer", description: "Entity formation, agreements, board authority and legal filings." },
  "tax-vat": { label: "Tax & VAT practitioner", description: "e-TIN, BIN, returns and tax-record consistency." },
  "trade-registration": { label: "Trade registration specialist", description: "Trade licence, ERC, EPB and sector enrolment support." },
  "factory-licensing": { label: "Factory licensing adviser", description: "DIFE layout, factory licence and operational permits." },
  environmental: { label: "Environmental consultant", description: "Site classification, environmental clearance and remediation." },
  "fire-safety": { label: "Fire & safety engineer", description: "Fire NOC, licence, drawings and corrective work." },
  "standards-lab": { label: "Accredited lab / certification body", description: "Product testing, conformity and certification evidence." },
  "customs-clearing": { label: "C&F / customs specialist", description: "Classification, declarations and consignment clearance." },
  "authorized-dealer-bank": { label: "Authorized dealer bank", description: "EXP declarations, export proceeds and trade finance." },
  "freight-logistics": { label: "Freight forwarder", description: "Routing, booking, packing, freight and shipment documents." },
  "trade-insurance": { label: "Trade credit & cargo insurer", description: "Cargo cover, receivables risk and buyer-credit protection." },
  "packaging-labeling": { label: "Packaging & labelling specialist", description: "Destination-ready packs, marks, language and claims." },
  "market-entry": { label: "Market-entry adviser", description: "Importer structure, route to market and local representation." },
  "buying-house": { label: "Verified buying house", description: "Buyer expectations, samples, merchandising and inspection." },
  "digital-it": { label: "Digital / IT agency", description: "Website, catalogues, commerce, analytics and cybersecurity." },
  "ip-trademark": { label: "IP & trademark lawyer", description: "Brand clearance, filing strategy and contract protection." },
  "translation-localization": { label: "Technical translator", description: "Labels, manuals, contracts and local-language content." },
  "quality-inspection": { label: "Quality inspection partner", description: "Factory audits, pre-shipment inspection and CAP follow-up." }
};

const source = (label: string, publisher: string, url: string): ReadinessSource => ({
  label,
  publisher,
  url,
  reviewedAt: EXPORT_READINESS_REVIEWED_AT
});

const bdTradeLicence = source("Trade licence and factory additions", "Bangladesh Investment Development Authority", "https://bida.gov.bd/faq");
const bdCompany = source("Company registration process", "Registrar of Joint Stock Companies and Firms", "https://app.roc.gov.bd/help/rjsc_bus_pro_bri_registration.htm");
const bdVat = source("VAT registration and BIN guidance", "National Board of Revenue", "https://nbr.gov.bd/taxtypes/vat-compliance-guides/details/6/eng");
const bdErc = source("Industrial Export Registration Certificate", "Bangladesh Trade Portal / CCI&E", "https://bangladeshtradeportal.gov.bd/index.php?id=67&r=searchProcedure%2Fview1");
const bdCcie = source("CCI&E registration and annual renewal functions", "Office of the Chief Controller of Imports and Exports", "https://dhaka.ccie.gov.bd/pages/static-pages/695b98f3c4774958d7b704a7");
const bdExport = source("Procedures to become an exporter", "Bangladesh Trade Portal", "https://www.bangladeshtradeportal.gov.bd/kcfinder/upload/files/Procedures%20to%20be%20an%20Exporter.pdf");
const bdBank = source("Declaration of export value on EXP Form", "Bangladesh Bank", "https://www.bb.org.bd/mediaroom/circulars/fepd/jun182025fepdl21e.pdf");
const bdOss = source("One Stop Service agencies and permissions", "Bangladesh Investment Development Authority", "https://www.bida.gov.bd/oss-services");
const bdBsti = source("Mandatory product list", "Bangladesh Standards and Testing Institution", "https://bsti.gov.bd/site/page/741c4948-53e2-455e-bb38-f4281381f426/List-of-Mandatory-Products-");
const bdEpb = source("EPB non-textile exporter registration", "Bangladesh Trade Portal / Export Promotion Bureau", "https://www.bangladeshtradeportal.gov.bd/index.php?id=24&r=searchProcedure%2Fview1");
const euAccess = source("My Trade Assistant", "European Commission Access2Markets", "https://trade.ec.europa.eu/access-to-markets/en/home");
const ukTariff = source("Trade Tariff", "UK Government", "https://www.gov.uk/trade-tariff");
const ukStandards = source("UK standards and regulatory import requirements", "UK Department for Business and Trade", "https://www.gov.uk/guidance/uk-standards-and-regulatory-import-requirements");
const japanCustoms = source("Documents for import clearance", "Japan Customs", "https://www.customs.go.jp/english/c-answer_e/imtsukan/1107_e.htm");
const saSaber = source("Shipment certificate for imported commercial products", "Saudi Standards, Metrology and Quality Organization", "https://saso.gov.sa/en/eservices/pages/maineservicesdetails.aspx?serviceid=397");
const uaeConformity = source("UAE conformity certificates for regulated products", "UAE Ministry of Industry and Advanced Technology", "https://moiat.gov.ae/en/services/issue-conformity-certificates-for-regulated-products");

export const exportReadinessRequirements: readonly ReadinessRequirement[] = [
  {
    id: "bd-entity-registration", section: "business", title: "Legal entity and signing authority", checkpoint: "The exporter name, legal form and authorized signatory must be consistent across every record.", priority: "blocker", weight: 8,
    memberSummary: "Confirm the entity record and the person authorized to sign export, banking and commercial documents.",
    resolution: ["Match the legal name and registration number across RJSC or the applicable proprietorship/partnership record.", "Record directors, owners and the person authorized to sign contracts and bank declarations.", "Resolve spelling, address or ownership mismatches before submitting export registrations."],
    evidence: ["Certificate of incorporation or applicable entity record", "Memorandum and Articles / partnership deed", "Board resolution or power of attorney for the signatory"],
    learnTopic: "readiness-legal-identity", providerCategories: ["corporate-legal"], sources: [bdCompany]
  },
  {
    id: "bd-trade-license", section: "business", title: "Current trade licence", checkpoint: "A trade licence is location-specific and must be renewed; factories need additional site documents.", priority: "blocker", weight: 7,
    memberSummary: "Check that the activity, address and current validity cover the business that will export.",
    resolution: ["Obtain or renew the licence from the relevant city corporation, municipality or union council.", "If operations span locations, check whether each local authority requires its own licence.", "For a factory, prepare site, machinery, fire and environmental supporting records."],
    evidence: ["Current trade licence", "Renewal payment evidence", "Address evidence and factory annexes where applicable"],
    learnTopic: "readiness-trade-license", providerCategories: ["trade-registration", "corporate-legal"], sources: [bdTradeLicence]
  },
  {
    id: "bd-tax-tin", section: "business", title: "e-TIN and current tax filing", checkpoint: "Tax identity must match the exporter and remain current.", priority: "blocker", weight: 6,
    memberSummary: "Confirm the entity TIN and most recent filing or acknowledgement before banking and registration checks.",
    resolution: ["Confirm the TIN belongs to the exporting entity rather than an unrelated owner or sister company.", "Complete overdue returns and retain the latest acknowledgement.", "Align registered name, address and entity number across tax and corporate records."],
    evidence: ["e-TIN certificate", "Latest income-tax return acknowledgement", "Tax clearance where requested"],
    learnTopic: "readiness-tax-vat", providerCategories: ["tax-vat"], sources: [bdVat]
  },
  {
    id: "bd-bin", section: "business", title: "VAT registration / BIN applicability", checkpoint: "Export and banking activity commonly depend on a valid, correctly scoped BIN.", priority: "blocker", weight: 6,
    memberSummary: "Check whether the business is registered or enlisted correctly and whether branches are covered.",
    resolution: ["Review turnover and activity against NBR registration or enlistment rules.", "Apply through the NBR channel with matching TIN, entity and address information.", "Correct branch, activity or address gaps before using the BIN in export records."],
    evidence: ["BIN / VAT registration certificate", "Branch registration where relevant", "Recent VAT return or compliance acknowledgement"],
    learnTopic: "readiness-tax-vat", providerCategories: ["tax-vat"], sources: [bdVat]
  },
  {
    id: "bd-erc", section: "registrations", title: "Export Registration Certificate (ERC)", checkpoint: "The exporter must confirm the correct ERC type and renewal position with CCI&E.", priority: "blocker", weight: 10,
    memberSummary: "Check the correct exporter-registration route, supporting documents and current annual renewal.",
    resolution: ["Determine whether the business needs commercial, industrial or another ERC route.", "Prepare current trade licence, chamber membership, bank solvency, TIN and entity documents.", "Apply or renew through the current CCI&E process and reconcile any record mismatch before shipment."],
    evidence: ["Current ERC and renewal record", "Application / payment acknowledgement", "CCI&E correspondence for any exemption or special case"],
    learnTopic: "readiness-erc", providerCategories: ["trade-registration", "corporate-legal"], sources: [bdErc, bdCcie]
  },
  {
    id: "bd-chamber", section: "registrations", title: "Chamber or trade-association membership", checkpoint: "Membership is part of common ERC and sector-document paths.", priority: "important", weight: 4,
    memberSummary: "Confirm the appropriate local chamber or sector association and current membership validity.",
    resolution: ["Select a chamber or recognized trade association relevant to the entity and sector.", "Ensure the member name matches the ERC applicant.", "Retain renewal and attestation records needed for registration submissions."],
    evidence: ["Current chamber / association certificate", "Renewal receipt"],
    learnTopic: "readiness-erc", providerCategories: ["trade-registration"], sources: [bdErc, bdExport]
  },
  {
    id: "bd-ad-bank", section: "registrations", title: "Authorized Dealer bank setup", checkpoint: "An AD bank is central to EXP declarations, proceeds realization and trade finance.", priority: "blocker", weight: 9,
    memberSummary: "Confirm the export account, bank KYC, nominated AD branch and responsible trade desk.",
    resolution: ["Open or confirm the company account with an Authorized Dealer branch.", "Complete exporter KYC and link ERC, TIN, BIN and signatory records.", "Agree the process for EXP declarations, document submission and proceeds follow-up before accepting an order."],
    evidence: ["Account confirmation and AD branch details", "Bank KYC acknowledgement", "Trade-service contact and agreed EXP process"],
    learnTopic: "readiness-export-banking", providerCategories: ["authorized-dealer-bank"], sources: [bdBank]
  },
  {
    id: "bd-exp-process", section: "delivery", title: "EXP declaration and proceeds plan", checkpoint: "Export value must be declared correctly and proceeds tracked through the AD bank.", priority: "blocker", weight: 8,
    memberSummary: "Prepare the full-invoice-value declaration, proceeds route and internal owner before shipment.",
    resolution: ["Confirm the current EXP submission method with the AD bank.", "Declare full invoice value without netting disallowed commissions or trade charges.", "Track shipment documents and proceeds realization against the declaration until closed."],
    evidence: ["Draft or submitted EXP record", "Commercial invoice", "Proceeds tracking owner and reconciliation record"],
    learnTopic: "readiness-export-banking", providerCategories: ["authorized-dealer-bank", "customs-clearing"], sources: [bdBank]
  },
  {
    id: "bd-environment", section: "facility", title: "Environmental clearance", checkpoint: "Manufacturing sites must determine the applicable environmental category and clearance path.", priority: "blocker", weight: 8,
    memberSummary: "Confirm site classification, current clearance and whether expansion or process changes require an update.",
    resolution: ["Classify the facility and activity under the current Department of Environment route.", "Prepare site, process, waste and mitigation information for the applicable clearance.", "Close renewal or scope gaps before relying on the facility for export claims."],
    evidence: ["Environmental site / operational clearance", "Renewal and scope records", "Effluent, waste or mitigation evidence where applicable"],
    learnTopic: "readiness-factory-permits", providerCategories: ["environmental"], sources: [bdOss],
    condition: { businessModels: ["manufacturer"] }
  },
  {
    id: "bd-fire-license", section: "facility", title: "Fire NOC and licence", checkpoint: "Factory fire permission and safety evidence must reflect the actual premises and operation.", priority: "blocker", weight: 8,
    memberSummary: "Check current fire permission, approved layout and unresolved corrective actions.",
    resolution: ["Review the current Fire Service route for proposed or operating premises.", "Prepare drawings, equipment, occupancy and safety-plan evidence.", "Complete corrective works and renewal before buyer or certification audits."],
    evidence: ["Fire NOC / licence", "Approved safety plan and drawings", "Equipment inspection and drill records"],
    learnTopic: "readiness-factory-permits", providerCategories: ["fire-safety", "factory-licensing"], sources: [bdOss, bdTradeLicence],
    condition: { businessModels: ["manufacturer"] }
  },
  {
    id: "bd-factory-license", section: "facility", title: "Factory layout and DIFE licence", checkpoint: "Manufacturing operations should confirm layout approval, licence and labour-safety obligations.", priority: "blocker", weight: 8,
    memberSummary: "Check that the licensed facility, layout, workforce and actual production scope agree.",
    resolution: ["Confirm the DIFE permissions applicable to the facility and establishment.", "Reconcile approved layout, machinery and current operation.", "Document open inspection findings and a corrective-action owner."],
    evidence: ["Approved layout plan", "Factory / establishment licence", "Inspection and corrective-action records"],
    learnTopic: "readiness-factory-permits", providerCategories: ["factory-licensing", "quality-inspection"], sources: [bdOss],
    condition: { businessModels: ["manufacturer"] }
  },
  {
    id: "bd-bsti-screen", section: "product", title: "BSTI mandatory-standard screening", checkpoint: "Product scope must be checked against the current mandatory-product and standard lists.", priority: "blocker", weight: 7,
    memberSummary: "Classify the exact product and confirm whether a BSTI licence, test or packaging requirement applies.",
    resolution: ["Match product description and HS classification to the current BSTI mandatory list.", "Identify the applicable Bangladesh standard and approved testing route.", "Do not display a conformity mark until the correct licence or approval exists."],
    evidence: ["Applicability memo", "BSTI CM licence or test report where required", "Approved label / packaging evidence"],
    learnTopic: "readiness-product-standards", providerCategories: ["standards-lab", "packaging-labeling"], sources: [bdBsti],
    condition: { productCategories: ["food", "engineering", "other"] }
  },
  {
    id: "bd-sector-registration", section: "registrations", title: "Sector-specific exporter registration", checkpoint: "Some sectors need additional EPB, Department of Jute, fisheries, quarantine or association records.", priority: "blocker", weight: 7,
    memberSummary: "Screen the product and legal route for sector licences, enrolment and consignment certificates.",
    resolution: ["Check the Bangladesh Trade Portal and responsible sector authority for the exact HS/product scope.", "Confirm whether exporter registration, product licence, health certificate or per-consignment approval applies.", "Record the issuing authority, renewal cycle and evidence owner."],
    evidence: ["Sector registration / licence", "Authority applicability confirmation", "Current renewal or consignment certificate"],
    learnTopic: "readiness-sector-rules", providerCategories: ["trade-registration", "standards-lab"], sources: [bdEpb, bdExport],
    condition: { productCategories: ["jute", "food", "leather"] }
  },
  {
    id: "product-hs", section: "product", title: "Defensible HS classification", checkpoint: "Classification drives duties, controls, statistics and document consistency.", priority: "blocker", weight: 9,
    memberSummary: "Confirm an HS code supported by composition, function and product construction—not a guessed sales label.",
    resolution: ["Prepare a product specification with materials, function, construction and packaging.", "Validate the code with a qualified customs specialist and the destination tariff.", "Use the same supported code across invoice, packing, origin and customs records unless local extensions differ."],
    evidence: ["Classification memo", "Technical specification", "Binding or advance ruling where uncertainty is material"],
    learnTopic: "readiness-hs-classification", providerCategories: ["customs-clearing", "standards-lab"], sources: [bdExport, euAccess, ukTariff]
  },
  {
    id: "product-specification", section: "product", title: "Controlled product specification", checkpoint: "A buyer, laboratory and customs broker need the same unambiguous product definition.", priority: "important", weight: 6,
    memberSummary: "Create one controlled specification covering materials, performance, variants, packaging and revision.",
    resolution: ["Define composition, dimensions, performance and restricted-material assumptions.", "Add variant/SKU control and a change-approval owner.", "Connect the specification to test reports, samples, labels and quotations."],
    evidence: ["Controlled specification and revision history", "Bill of materials", "Approved sample / golden sample record"],
    learnTopic: "readiness-product-file", providerCategories: ["standards-lab", "quality-inspection", "buying-house"], sources: [bdExport]
  },
  {
    id: "product-testing", section: "product", title: "Product tests and buyer-standard evidence", checkpoint: "Testing must match the product, destination, claim and current production version.", priority: "blocker", weight: 8,
    memberSummary: "Map each legal or buyer requirement to a valid test, certificate or controlled declaration.",
    resolution: ["Build a requirement-to-evidence matrix for the selected destination and buyer channel.", "Use an appropriately accredited laboratory or certification body.", "Check sample identity, scope, issue date, validity and production changes before relying on a report."],
    evidence: ["Accredited test reports", "Certificates and scope annexes", "Requirement-to-evidence matrix"],
    learnTopic: "readiness-product-standards", providerCategories: ["standards-lab", "quality-inspection"], sources: [bdBsti, euAccess]
  },
  {
    id: "market-eu", section: "market", title: "EU tariff, origin and regulatory screen", checkpoint: "Germany and the Netherlands require an HS-specific EU import and product-rule check.", priority: "blocker", weight: 10,
    memberSummary: "Use Access2Markets for the exact product, Bangladesh origin and destination before quoting or shipping.",
    resolution: ["Run My Trade Assistant using the supported HS code, Bangladesh and the destination member state.", "Record duties, rules of origin, import formalities, taxes, product rules and any trade-defence measure.", "Confirm the EU importer and responsible-party obligations before labels and contracts are finalized."],
    evidence: ["Dated Access2Markets result", "Rules-of-origin assessment", "Importer/responsible-party confirmation", "Product-rule and label checklist"],
    learnTopic: "readiness-eu-market", providerCategories: ["market-entry", "customs-clearing", "standards-lab", "translation-localization"], sources: [euAccess],
    condition: { targetMarkets: ["DE", "NL"] }
  },
  {
    id: "market-uk", section: "market", title: "UK tariff, marking and import-control screen", checkpoint: "The commodity code must be checked with current UK duties, VAT, controls and product standards.", priority: "blocker", weight: 10,
    memberSummary: "Confirm the UK commodity code, importer route, marking, labelling and applicable controls.",
    resolution: ["Use the UK Trade Tariff with a defensible product description.", "Check duties, VAT, preferences, origin evidence and import controls.", "Map applicable product marking, labelling and marketing standards to the responsible UK party."],
    evidence: ["Dated UK tariff result", "Importer and customs route", "Product marking / label assessment", "Origin evidence plan"],
    learnTopic: "readiness-uk-market", providerCategories: ["market-entry", "customs-clearing", "standards-lab", "translation-localization"], sources: [ukTariff, ukStandards],
    condition: { targetMarkets: ["GB"] }
  },
  {
    id: "market-japan", section: "market", title: "Japan importer, permits and clearance file", checkpoint: "Japan Customs requires the importer declaration and core shipment documents; product-specific permits may also apply.", priority: "blocker", weight: 10,
    memberSummary: "Confirm the importer/broker, invoice data, origin path and any non-customs permit before shipment.",
    resolution: ["Appoint or confirm the Japanese importer and customs-broker process.", "Prepare invoice, transport document, insurance/freight evidence, packing list, contract and price support.", "Screen the exact product for permits or approvals under laws beyond the Customs Law."],
    evidence: ["Importer and broker confirmation", "Japan import-document checklist", "Permit applicability memo", "Origin document plan"],
    learnTopic: "readiness-japan-market", providerCategories: ["market-entry", "customs-clearing", "translation-localization"], sources: [japanCustoms],
    condition: { targetMarkets: ["JP"] }
  },
  {
    id: "market-saudi", section: "market", title: "Saudi Saber conformity route", checkpoint: "Commercial products may require product conformity and shipment certificates through Saber.", priority: "blocker", weight: 10,
    memberSummary: "Confirm the Saudi importer/supplier record, technical regulation and certificate path before dispatch.",
    resolution: ["Classify the product in Saber and determine whether a technical regulation applies.", "Coordinate product-conformity evidence with the importer and approved conformity body.", "Complete the shipment certificate using accurate invoice, quantity, value and country-of-shipment data before dispatch."],
    evidence: ["Saber product status", "Product conformity certificate / self-declaration as applicable", "Shipment certificate", "Arabic/required label file"],
    learnTopic: "readiness-saudi-market", providerCategories: ["market-entry", "standards-lab", "customs-clearing", "translation-localization"], sources: [saSaber],
    condition: { targetMarkets: ["SA"] }
  },
  {
    id: "market-uae", section: "market", title: "UAE regulated-product conformity screen", checkpoint: "Regulated products require the applicable MoIAT conformity route and supporting test evidence.", priority: "blocker", weight: 10,
    memberSummary: "Check the regulated-product list, UAE importer role, laboratory evidence and label requirements.",
    resolution: ["Screen the exact product against MoIAT technical requirements.", "Confirm the UAE trade-licence holder/importer and application owner.", "Prepare current accredited test evidence and the product label/declaration required for the conformity route."],
    evidence: ["MoIAT applicability result", "Accredited test report", "UAE importer / distributor authorization", "Conformity certificate and approved label where required"],
    learnTopic: "readiness-uae-market", providerCategories: ["market-entry", "standards-lab", "customs-clearing", "translation-localization"], sources: [uaeConformity],
    condition: { targetMarkets: ["AE"] }
  },
  {
    id: "commercial-capacity", section: "commercial", title: "Capacity and lead-time proof", checkpoint: "The sales promise must fit available capacity, materials, quality gates and shipment windows.", priority: "important", weight: 6,
    memberSummary: "Convert nominal capacity into a defendable order quantity and lead time for this product.",
    resolution: ["Calculate sellable capacity after current commitments, rejection assumptions and maintenance.", "Map raw-material lead times and bottleneck processes.", "Set sample, pilot and repeat-order lead times with named approval gates."],
    evidence: ["Capacity model", "Production / sourcing plan", "Lead-time and bottleneck assumptions"],
    learnTopic: "readiness-commercial-offer", providerCategories: ["buying-house", "quality-inspection"], sources: [bdExport]
  },
  {
    id: "commercial-costing", section: "commercial", title: "Export costing and Incoterm", checkpoint: "Price must include the selected delivery responsibility, finance cost, rejection risk and margin.", priority: "blocker", weight: 8,
    memberSummary: "Build an export cost sheet and quote one named Incoterm/place without hidden logistics or compliance gaps.",
    resolution: ["Build product, packaging, inland, customs, bank, inspection, freight, insurance and commission assumptions.", "Choose an Incoterm and named place that matches operational control.", "Stress-test currency, minimum order, delays, rework and buyer-payment terms."],
    evidence: ["Export cost sheet", "Approved pricing and margin", "Incoterm responsibility matrix"],
    learnTopic: "readiness-commercial-offer", providerCategories: ["freight-logistics", "authorized-dealer-bank", "trade-insurance"], sources: [bdExport]
  },
  {
    id: "commercial-contract", section: "commercial", title: "Buyer contract and payment protection", checkpoint: "Scope, quality, delivery, acceptance, payment and dispute terms must be explicit.", priority: "blocker", weight: 8,
    memberSummary: "Use a reviewed contract or order confirmation and a payment method proportionate to buyer risk.",
    resolution: ["Verify the buyer entity, signatory and commercial references.", "Define specification, inspection, acceptance, delivery, title/risk, payment, claims and governing law.", "Use bank and insurance advice before agreeing open-account exposure or unusual payment instructions."],
    evidence: ["Buyer due-diligence record", "Reviewed contract / purchase order", "Payment and credit-risk approval"],
    learnTopic: "readiness-buyer-contract", providerCategories: ["corporate-legal", "authorized-dealer-bank", "trade-insurance"], sources: [bdExport]
  },
  {
    id: "delivery-document-pack", section: "delivery", title: "Shipment document pack", checkpoint: "Commercial, transport, origin, insurance and regulatory records must agree.", priority: "blocker", weight: 9,
    memberSummary: "Create a document matrix with preparer, approver, deadline and consignee requirements.",
    resolution: ["Map required invoice, packing, transport, origin, inspection, insurance and regulatory documents.", "Reconcile names, addresses, HS codes, quantities, weights, values and Incoterm before release.", "Set a pre-shipment review and controlled handover to bank, broker, carrier and buyer."],
    evidence: ["Shipment document matrix", "Approved document templates", "Pre-shipment document review"],
    learnTopic: "readiness-shipping-documents", providerCategories: ["customs-clearing", "freight-logistics", "authorized-dealer-bank"], sources: [bdExport, japanCustoms]
  },
  {
    id: "delivery-logistics", section: "delivery", title: "Freight, packaging and cargo-risk plan", checkpoint: "The route and pack must protect the product and preserve required evidence.", priority: "important", weight: 6,
    memberSummary: "Validate route, cut-offs, packaging, dangerous-goods assumptions, insurance and contingency ownership.",
    resolution: ["Obtain a route-specific freight plan and confirm carrier/broker handoffs.", "Test export packaging, marks, dimensions and container loading assumptions.", "Set cargo insurance, delay and damage-claim procedures."],
    evidence: ["Freight quote and route plan", "Packaging specification", "Cargo insurance / risk decision", "Contingency contact tree"],
    learnTopic: "readiness-logistics", providerCategories: ["freight-logistics", "packaging-labeling", "trade-insurance"], sources: [bdExport]
  },
  {
    id: "digital-credibility", section: "digital", title: "Buyer-ready website and company identity", checkpoint: "Buyers should be able to verify the company, offer, capability and contact route online.", priority: "growth", weight: 4,
    memberSummary: "Use a company domain, credible profile, export-ready product pages and traceable contact information.",
    resolution: ["Publish the legal/trading identity, facility or sourcing model, capabilities and real contact details.", "Create product pages with controlled claims, specifications and enquiry path.", "Use company-domain email and measure qualified enquiries without exposing sensitive documents."],
    evidence: ["Live website and domain email", "Product / capability pages", "Privacy and enquiry handling notice"],
    learnTopic: "readiness-digital-trust", providerCategories: ["digital-it", "market-entry"], sources: [bdExport]
  },
  {
    id: "digital-assets", section: "digital", title: "Sales assets and localization", checkpoint: "Buyer materials must be consistent with the controlled product and destination audience.", priority: "growth", weight: 3,
    memberSummary: "Prepare a concise company deck, product sheet, sample brief and localized buyer communication.",
    resolution: ["Create a factual capability deck and product datasheet linked to controlled evidence.", "Localize labels, manuals and sales material where required.", "Build an enquiry-to-quotation workflow with response owner and service level."],
    evidence: ["Company capability deck", "Product datasheet / catalogue", "Localized label or manual", "Enquiry response workflow"],
    learnTopic: "readiness-digital-trust", providerCategories: ["digital-it", "translation-localization", "buying-house"], sources: [bdExport]
  },
  {
    id: "digital-ip", section: "digital", title: "Brand, trademark and content rights", checkpoint: "The chosen brand and commercial assets should not create avoidable destination-market conflicts.", priority: "important", weight: 4,
    memberSummary: "Screen the brand and clarify ownership of names, designs, images, software and buyer-supplied content.",
    resolution: ["Run a preliminary trademark and domain conflict check in the target market.", "Decide whether and where to file before public launch.", "Document ownership and permitted use of designs, photography, code and buyer marks."],
    evidence: ["Brand clearance note", "Trademark filing or risk decision", "IP ownership / licence records"],
    learnTopic: "readiness-digital-trust", providerCategories: ["ip-trademark", "corporate-legal"], sources: [bdExport]
  }
] as const;

function matches<T extends string>(allowed: readonly T[] | undefined, value: T): boolean {
  return !allowed?.length || allowed.includes(value);
}

export function applicableReadinessRequirements(profile: ReadinessProfile): readonly ReadinessRequirement[] {
  return exportReadinessRequirements.filter((requirement) => {
    const condition = requirement.condition;
    return !condition || (
      matches(condition.businessModels, profile.businessModel)
      && matches(condition.productCategories, profile.productCategory)
      && matches(condition.targetMarkets, profile.targetMarketCode)
      && matches(condition.salesChannels, profile.salesChannel)
    );
  });
}

export function readinessRequirementViews(
  access: "public" | "member" | "full",
  profile: ReadinessProfile
): readonly ReadinessRequirementView[] {
  const applicable = applicableReadinessRequirements(profile);
  const visible = access === "public"
    ? readinessSections.flatMap((section) => {
        const example = applicable.find((requirement) => requirement.section === section.id);
        return example ? [example] : [];
      })
    : applicable;

  return visible.map((requirement) => ({
    id: requirement.id,
    section: requirement.section,
    title: requirement.title,
    checkpoint: requirement.checkpoint,
    priority: requirement.priority,
    memberSummary: requirement.memberSummary,
    learnTopic: requirement.learnTopic,
    sources: access === "public" ? requirement.sources.slice(0, 1) : requirement.sources,
    weight: requirement.weight,
    hasProviderSupport: requirement.providerCategories.length > 0,
    ...(access === "full" ? {
      fullResolution: {
        resolution: requirement.resolution,
        evidence: requirement.evidence,
        providerCategories: requirement.providerCategories
      }
    } : {})
  }));
}

const readinessStatusCredit: Readonly<Record<ReadinessStatus, number | null>> = {
  not_started: 0,
  in_progress: 0.35,
  evidence_added: 0.65,
  verified: 1,
  blocked: 0,
  not_applicable: null
};

export function calculateReadinessScore(
  requirements: readonly ReadinessRequirementView[],
  responses: Readonly<Record<string, ReadinessStatus>>
) {
  const included = requirements.filter((requirement) => readinessStatusCredit[responses[requirement.id] ?? "not_started"] !== null);
  const totalWeight = included.reduce((sum, requirement) => sum + requirement.weight, 0);
  const earned = included.reduce((sum, requirement) => {
    const credit = readinessStatusCredit[responses[requirement.id] ?? "not_started"] ?? 0;
    return sum + requirement.weight * credit;
  }, 0);
  const overall = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
  const sections = readinessSections.map((section) => {
    const sectionRequirements = included.filter((requirement) => requirement.section === section.id);
    const sectionWeight = sectionRequirements.reduce((sum, requirement) => sum + requirement.weight, 0);
    const sectionEarned = sectionRequirements.reduce((sum, requirement) => {
      const credit = readinessStatusCredit[responses[requirement.id] ?? "not_started"] ?? 0;
      return sum + requirement.weight * credit;
    }, 0);
    return { id: section.id, score: sectionWeight ? Math.round((sectionEarned / sectionWeight) * 100) : 100 };
  });
  const blockers = requirements.filter((requirement) => {
    const status = responses[requirement.id] ?? "not_started";
    return requirement.priority === "blocker" && status !== "verified" && status !== "not_applicable";
  });
  return { overall, sections, blockers };
}
