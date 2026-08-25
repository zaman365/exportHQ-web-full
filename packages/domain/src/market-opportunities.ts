export type MarketRegion =
  | "East Asia"
  | "Gulf"
  | "European Union"
  | "United Kingdom";

export type OpportunityTrend = "accelerating" | "established" | "emerging";
export type EvidenceConfidence = "high" | "medium";
export type MarketIntelligenceAccess = "public" | "member" | "full";

export interface MarketCountry {
  code: string;
  iso3: string;
  name: string;
  flag: string;
  region: MarketRegion;
}

export interface OpportunityProduct {
  slug: string;
  name: string;
  category: string;
  hsCodes: readonly string[];
}

export interface TradeEvidence {
  label: string;
  publisher: string;
  url: string;
  period: string;
  metric: string;
  checkedAt: string;
}

export interface MarketOpportunity {
  id: string;
  originCountryCode: "BD";
  originCountryName: "Bangladesh";
  target: MarketCountry;
  product: OpportunityProduct;
  opportunityScore: number;
  demandScore: number;
  originFitScore: number;
  confidence: EvidenceConfidence;
  trend: OpportunityTrend;
  publicSummary: string;
  memberInsight: string;
  whyItRanks: readonly string[];
  buyerProfiles: readonly string[];
  entryRoutes: readonly string[];
  barriers: readonly string[];
  proofToPrepare: readonly string[];
  nextActions: readonly string[];
  evidence: readonly TradeEvidence[];
}

export interface MarketOpportunityView {
  id: string;
  access: MarketIntelligenceAccess;
  target: MarketCountry;
  product: OpportunityProduct;
  trend: OpportunityTrend;
  confidence: EvidenceConfidence;
  scoreBand: "Priority" | "Promising" | "Watch";
  publicSummary: string;
  opportunityScore?: number;
  demandScore?: number;
  originFitScore?: number;
  memberInsight?: string;
  evidenceCount?: number;
  fullAnalysis?: {
    whyItRanks: readonly string[];
    buyerProfiles: readonly string[];
    entryRoutes: readonly string[];
    barriers: readonly string[];
    proofToPrepare: readonly string[];
    nextActions: readonly string[];
    evidence: readonly TradeEvidence[];
  };
}

const checkedAt = "2026-08-25";

const countries = {
  japan: { code: "JP", iso3: "JPN", name: "Japan", flag: "🇯🇵", region: "East Asia" },
  saudiArabia: { code: "SA", iso3: "SAU", name: "Saudi Arabia", flag: "🇸🇦", region: "Gulf" },
  unitedArabEmirates: { code: "AE", iso3: "ARE", name: "United Arab Emirates", flag: "🇦🇪", region: "Gulf" },
  germany: { code: "DE", iso3: "DEU", name: "Germany", flag: "🇩🇪", region: "European Union" },
  netherlands: { code: "NL", iso3: "NLD", name: "Netherlands", flag: "🇳🇱", region: "European Union" },
  unitedKingdom: { code: "GB", iso3: "GBR", name: "United Kingdom", flag: "🇬🇧", region: "United Kingdom" }
} as const satisfies Record<string, MarketCountry>;

const products = {
  knitwear: { slug: "knitwear", name: "Knitwear & jersey apparel", category: "Apparel", hsCodes: ["61"] },
  homeTextiles: { slug: "home-textiles", name: "Home & made-up textiles", category: "Home textiles", hsCodes: ["63"] },
  leatherComponents: { slug: "leather-components", name: "Finished leather components", category: "Leather", hsCodes: ["4205"] },
  leatherApparel: { slug: "leather-apparel", name: "Leather apparel & accessories", category: "Leather", hsCodes: ["4203"] },
  technicalOuterwear: { slug: "technical-outerwear", name: "Technical & weather outerwear", category: "Apparel", hsCodes: ["6210"] },
  juteFabric: { slug: "jute-fabric", name: "Jute fabric & eco packaging", category: "Jute", hsCodes: ["5310"] },
  juteYarn: { slug: "jute-yarn", name: "Jute yarn & industrial fibre", category: "Jute", hsCodes: ["5307"] },
  syntheticApparel: { slug: "synthetic-apparel", name: "Man-made fibre garments", category: "Apparel", hsCodes: ["6114", "6211"] }
} as const satisfies Record<string, OpportunityProduct>;

function evidence(
  label: string,
  url: string,
  metric: string,
  period = "2023"
): TradeEvidence {
  return { label, publisher: "World Bank WITS / UN Comtrade", url, period, metric, checkedAt };
}

export const MARKET_INTELLIGENCE_METHOD_VERSION = "ExportPanel Opportunity Fit v1.0";
export const MARKET_INTELLIGENCE_UPDATED_AT = checkedAt;

/**
 * A versioned starter catalog for the Bangladesh-origin demo. Scores are ExportPanel
 * decision-support signals, not trade forecasts. Each score combines observed
 * destination demand, an existing Bangladesh supply signal, route practicality,
 * and evidence confidence. Production ingestion can replace these seed rows
 * without changing the access or presentation model.
 */
export const marketOpportunityCatalog: readonly MarketOpportunity[] = [
  {
    id: "bd-jp-knitwear",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.japan,
    product: products.knitwear,
    opportunityScore: 91,
    demandScore: 94,
    originFitScore: 93,
    confidence: "high",
    trend: "established",
    publicSummary: "A proven Bangladesh supply lane with room for quality-led, smaller-batch offers.",
    memberInsight: "Japan already sources Bangladesh knitwear at meaningful scale; consistency, finish and delivery discipline are the differentiators.",
    whyItRanks: ["Bangladesh is among Japan's leading textile and clothing partners.", "Existing volume lowers market-education risk.", "Premium basics and dependable replenishment create a clearer wedge than price alone."],
    buyerProfiles: ["Private-label apparel groups", "Specialty basics retailers", "Trading houses with apparel programs"],
    entryRoutes: ["Japanese trading house", "Private-label sourcing office", "Distributor-led retail program"],
    barriers: ["Strict quality tolerances", "Detailed packaging and labelling expectations", "Long supplier qualification cycles"],
    proofToPrepare: ["Quality-control record", "Social and environmental certifications", "Japanese-ready specification and packaging sheet"],
    nextActions: ["Select two hero knitwear SKUs.", "Build a Japan-specific quality dossier.", "Shortlist trading houses and specialty retailers."],
    evidence: [evidence("Japan knitwear imports from Bangladesh", "https://wits.worldbank.org/trade/comtrade/en/country/JPN/year/2023/tradeflow/Imports/partner/ALL/product/61", "Bangladesh supplied about US$665.6m of HS 61 imports")]
  },
  {
    id: "bd-jp-home-textiles",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.japan,
    product: products.homeTextiles,
    opportunityScore: 84,
    demandScore: 85,
    originFitScore: 87,
    confidence: "high",
    trend: "established",
    publicSummary: "Existing demand supports a focused offer in traceable, well-finished home textiles.",
    memberInsight: "Bangladesh is already a visible supplier of made-up textiles; a narrow, quality-controlled collection is more credible than a broad catalogue.",
    whyItRanks: ["A demonstrated destination import lane exists.", "Bangladesh has relevant textile production depth.", "Traceable natural fibres support differentiated positioning."],
    buyerProfiles: ["Homeware importers", "Hotel and hospitality suppliers", "Lifestyle retailers"],
    entryRoutes: ["Importer-distributor", "Hospitality procurement partner", "Private-label homeware buyer"],
    barriers: ["Colourfastness and shrinkage specifications", "Packaging presentation", "Small initial order economics"],
    proofToPrepare: ["Fabric test reports", "Care and fibre labels", "Retail-ready packaging mock-up"],
    nextActions: ["Define a six-SKU capsule.", "Price a smaller trial order.", "Prepare traceability and testing evidence."],
    evidence: [evidence("Japan made-up textile imports from Bangladesh", "https://wits.worldbank.org/trade/comtrade/en/country/JPN/year/2023/tradeflow/Imports/partner/ALL/product/63", "Bangladesh supplied about US$41.4m of HS 63 imports")]
  },
  {
    id: "bd-jp-leather-components",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.japan,
    product: products.leatherComponents,
    opportunityScore: 82,
    demandScore: 78,
    originFitScore: 91,
    confidence: "high",
    trend: "emerging",
    publicSummary: "A smaller but unusually strong Bangladesh-origin lane for finished leather components.",
    memberInsight: "Bangladesh was close to the leading supplier group for Japan's HS 4205 imports, making this a credible specialist lane rather than a speculative one.",
    whyItRanks: ["Japan imported a material HS 4205 value from Bangladesh.", "The lane rewards technical finishing and repeatability.", "Specialist components can avoid direct fashion-brand competition."],
    buyerProfiles: ["Leather-goods manufacturers", "Industrial component importers", "Specialist trading companies"],
    entryRoutes: ["Component sample program", "Trading-company representation", "OEM supply agreement"],
    barriers: ["Chemical and tannery traceability", "Tight dimensional tolerances", "Sample approval lead time"],
    proofToPrepare: ["Restricted-substance evidence", "Tannery traceability", "Dimensional and finish tolerances"],
    nextActions: ["Choose one component family.", "Create a technical sample pack.", "Map Japanese component buyers."],
    evidence: [evidence("Japan HS 4205 imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/JPN/year/2023/tradeflow/Imports/partner/ALL/product/420500", "Bangladesh supplied about US$841k and 16.4t")]
  },
  {
    id: "bd-sa-knitwear",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.saudiArabia,
    product: products.knitwear,
    opportunityScore: 89,
    demandScore: 92,
    originFitScore: 92,
    confidence: "high",
    trend: "accelerating",
    publicSummary: "Large established demand and a strong Bangladesh supply position create a practical Gulf growth lane.",
    memberInsight: "Bangladesh was one of Saudi Arabia's largest HS 61 suppliers; modest-wear basics and warm-weather assortments offer clear starting points.",
    whyItRanks: ["Bangladesh already holds a meaningful supplier position.", "Large category demand supports segmentation.", "Regional distribution can extend reach beyond one country."],
    buyerProfiles: ["Fashion distributors", "Value and mid-market retail groups", "Uniform and corporate-wear buyers"],
    entryRoutes: ["Saudi distributor", "Regional retail buying office", "Private-label program"],
    barriers: ["Arabic labelling", "Distributor economics", "Seasonal and modest-wear assortment fit"],
    proofToPrepare: ["Arabic-ready label layout", "Heat-appropriate fabric specifications", "Distributor margin and MOQ sheet"],
    nextActions: ["Build a Gulf-ready assortment.", "Confirm Arabic labelling route.", "Shortlist distributors with apparel coverage."],
    evidence: [evidence("Saudi Arabia knitwear imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/SAU/year/2023/tradeflow/Imports/partner/ALL/product/61", "Bangladesh supplied about US$209.9m of HS 61 imports")]
  },
  {
    id: "bd-sa-synthetic-apparel",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.saudiArabia,
    product: products.syntheticApparel,
    opportunityScore: 79,
    demandScore: 82,
    originFitScore: 81,
    confidence: "high",
    trend: "emerging",
    publicSummary: "Performance, uniform and modest-wear products can build on an existing garment lane.",
    memberInsight: "Saudi imports show a visible Bangladesh position in other knitted garments, supporting focused workwear and modest-wear propositions.",
    whyItRanks: ["Existing Bangladesh trade reduces route uncertainty.", "Institutional and retail demand create two buyer paths.", "Technical fabric capability can improve margins."],
    buyerProfiles: ["Uniform suppliers", "Modest-fashion distributors", "Sports and leisure retailers"],
    entryRoutes: ["Institutional tender partner", "Distributor catalogue", "Retail private label"],
    barriers: ["Performance testing", "Tender qualification", "Local sizing and design preferences"],
    proofToPrepare: ["Performance test results", "Size-set samples", "Institutional delivery capacity"],
    nextActions: ["Choose retail or institutional route.", "Adapt the size and colour range.", "Validate performance claims."],
    evidence: [evidence("Saudi Arabia other knitted garment imports", "https://wits.worldbank.org/trade/comtrade/en/country/SAU/year/2023/tradeflow/Imports/partner/ALL/product/611490", "Bangladesh supplied about US$6.4m")]
  },
  {
    id: "bd-ae-leather-apparel",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.unitedArabEmirates,
    product: products.leatherApparel,
    opportunityScore: 75,
    demandScore: 76,
    originFitScore: 78,
    confidence: "medium",
    trend: "emerging",
    publicSummary: "A Gulf gateway opportunity for focused leather accessories and private-label programs.",
    memberInsight: "Direct Bangladesh-origin trade exists, while the UAE's re-export role can create a wider regional route for a tightly positioned collection.",
    whyItRanks: ["Direct imports from Bangladesh are present.", "Dubai can function as a regional distribution hub.", "Small branded or private-label collections are testable."],
    buyerProfiles: ["Regional fashion distributors", "Travel retail buyers", "Leather-accessory private labels"],
    entryRoutes: ["UAE distributor", "Private-label capsule", "Trade-fair sampling"],
    barriers: ["Brand and finish expectations", "Distributor mark-up", "Product and origin documentation"],
    proofToPrepare: ["Material traceability", "Finish and durability tests", "Regional wholesale pricing"],
    nextActions: ["Create a 10-piece capsule.", "Validate regional price points.", "Identify UAE distributors with GCC reach."],
    evidence: [evidence("Leather apparel imports from Bangladesh", "https://wits.worldbank.org/trade/comtrade/en/country/All/year/2023/tradeflow/Imports/partner/BGD/product/420310", "UAE reported Bangladesh-origin imports in this product lane")]
  },
  {
    id: "bd-de-home-textiles",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.germany,
    product: products.homeTextiles,
    opportunityScore: 88,
    demandScore: 90,
    originFitScore: 91,
    confidence: "high",
    trend: "established",
    publicSummary: "A sizeable established lane where compliance, traceability and design discipline unlock value.",
    memberInsight: "Germany imports substantial made-up textiles from Bangladesh; evidence quality and retailer-specific compliance are the key gating factors.",
    whyItRanks: ["Material observed import demand exists.", "Bangladesh has proven production depth.", "Sustainability and traceability can support stronger buyer fit."],
    buyerProfiles: ["Home and lifestyle retailers", "Import wholesalers", "Hospitality textile suppliers"],
    entryRoutes: ["Retail private label", "Importer-wholesaler", "Hospitality supplier"],
    barriers: ["EU chemical and product rules", "Supply-chain due diligence", "Retailer audit requirements"],
    proofToPrepare: ["Product test reports", "Fibre and chemical compliance", "Factory social-compliance evidence"],
    nextActions: ["Map the requirement set.", "Select compliant hero products.", "Build a German buyer shortlist."],
    evidence: [evidence("Germany made-up textile imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/DEU/year/2023/tradeflow/Imports/partner/ALL/product/63", "Bangladesh supplied about US$126.3m of HS 63 imports")]
  },
  {
    id: "bd-de-leather-apparel",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.germany,
    product: products.leatherApparel,
    opportunityScore: 76,
    demandScore: 80,
    originFitScore: 75,
    confidence: "high",
    trend: "emerging",
    publicSummary: "Existing trade supports a specialist leather offer, but evidence readiness is decisive.",
    memberInsight: "Germany imported Bangladesh leather apparel in 2023; the opportunity is credible for compliant manufacturers with strong tannery traceability.",
    whyItRanks: ["A direct trade lane is documented.", "Germany has substantial total category demand.", "Specialist positioning can avoid commodity competition."],
    buyerProfiles: ["Leather-fashion importers", "Workwear specialists", "Private-label accessory brands"],
    entryRoutes: ["Specialist importer", "OEM/private label", "Workwear distributor"],
    barriers: ["REACH and restricted substances", "Tannery environmental evidence", "Buyer due diligence"],
    proofToPrepare: ["Chemical test reports", "Tannery environmental record", "Chain-of-custody documentation"],
    nextActions: ["Audit the tannery evidence chain.", "Prepare a compliant sample pack.", "Target specialist importers."],
    evidence: [evidence("Germany leather apparel imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/DEU/year/2023/tradeflow/Imports/partner/ALL/product/420310", "Bangladesh supplied about US$551k")]
  },
  {
    id: "bd-nl-jute-fabric",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.netherlands,
    product: products.juteFabric,
    opportunityScore: 93,
    demandScore: 89,
    originFitScore: 97,
    confidence: "high",
    trend: "accelerating",
    publicSummary: "A high-fit jute lane with visible demand and a strong Bangladesh supply position.",
    memberInsight: "Bangladesh supplies a large share of Netherlands jute-fabric imports, making value-added eco packaging and interiors a priority lane.",
    whyItRanks: ["Bangladesh is a leading observed supplier.", "The Netherlands is a distribution gateway for Europe.", "Circular-material positioning supports value-added applications."],
    buyerProfiles: ["Sustainable packaging converters", "Interior-material wholesalers", "Horticulture and geotextile suppliers"],
    entryRoutes: ["Dutch importer-distributor", "Converter partnership", "Benelux private label"],
    barriers: ["Consistent weave and moisture control", "EU product and chemical requirements", "Buyer sustainability substantiation"],
    proofToPrepare: ["Fibre and treatment specification", "Moisture and tensile tests", "Traceability and sustainability claims file"],
    nextActions: ["Choose packaging, interiors or technical use.", "Build application-specific samples.", "Map Dutch converters and wholesalers."],
    evidence: [evidence("Netherlands jute fabric imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/NLD/year/2023/tradeflow/Imports/partner/ALL/product/531090", "Bangladesh supplied about US$489k and 227.6t")]
  },
  {
    id: "bd-nl-jute-yarn",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.netherlands,
    product: products.juteYarn,
    opportunityScore: 90,
    demandScore: 86,
    originFitScore: 96,
    confidence: "high",
    trend: "accelerating",
    publicSummary: "Bangladesh holds a leading supply position in a focused industrial-fibre lane.",
    memberInsight: "Bangladesh was the leading supplier in observed Dutch jute-yarn imports, supporting direct work with converters and industrial users.",
    whyItRanks: ["Strong observed origin-market fit.", "Dutch buyers connect to wider European demand.", "Technical specification can create repeat business."],
    buyerProfiles: ["Carpet and textile converters", "Industrial fibre distributors", "Eco-material developers"],
    entryRoutes: ["Direct converter supply", "Distributor stocking agreement", "Co-development sample program"],
    barriers: ["Batch consistency", "Technical specification discipline", "Warehouse and replenishment expectations"],
    proofToPrepare: ["Yarn count and strength data", "Batch quality record", "Replenishment and lead-time plan"],
    nextActions: ["Standardize the technical data sheet.", "Price a distributor stocking model.", "Shortlist Dutch converters."],
    evidence: [evidence("Netherlands cabled jute yarn imports", "https://wits.worldbank.org/trade/comtrade/en/country/NLD/year/2023/tradeflow/Imports/partner/ALL/product/530720", "Bangladesh supplied about US$603k and 356.2t")]
  },
  {
    id: "bd-gb-home-textiles",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.unitedKingdom,
    product: products.homeTextiles,
    opportunityScore: 86,
    demandScore: 89,
    originFitScore: 89,
    confidence: "high",
    trend: "established",
    publicSummary: "A sizeable established lane for retail-ready and hospitality home textiles.",
    memberInsight: "The UK imported substantial HS 63 value from Bangladesh; a focused traceable collection can build on familiar buyer sourcing patterns.",
    whyItRanks: ["A meaningful existing trade lane is visible.", "Buyer familiarity reduces supplier-country education.", "Retail and hospitality create different order profiles."],
    buyerProfiles: ["Homeware retail groups", "Hospitality suppliers", "Online lifestyle brands"],
    entryRoutes: ["Retail private label", "UK importer", "Hospitality wholesaler"],
    barriers: ["Retailer technical manuals", "Packaging and labelling", "Sustainability claims scrutiny"],
    proofToPrepare: ["Retail test pack", "UK label and packaging layout", "Traceability evidence"],
    nextActions: ["Choose retail or hospitality route.", "Prepare a buyer-ready line sheet.", "Map 20 qualified accounts."],
    evidence: [evidence("UK made-up textile imports by partner", "https://wits.worldbank.org/trade/comtrade/en/country/GBR/year/2023/tradeflow/Imports/partner/ALL/product/63", "Bangladesh supplied about US$76.0m of HS 63 imports")]
  },
  {
    id: "bd-gb-technical-outerwear",
    originCountryCode: "BD",
    originCountryName: "Bangladesh",
    target: countries.unitedKingdom,
    product: products.technicalOuterwear,
    opportunityScore: 85,
    demandScore: 88,
    originFitScore: 87,
    confidence: "high",
    trend: "established",
    publicSummary: "Bangladesh already serves a material UK outerwear lane with room for technical specialization.",
    memberInsight: "Observed UK imports confirm Bangladesh capability; weather protection, workwear and responsible-material evidence can sharpen the offer.",
    whyItRanks: ["A material Bangladesh-origin trade lane exists.", "UK climate sustains category demand.", "Technical proof can support differentiation beyond price."],
    buyerProfiles: ["Outdoor and workwear brands", "Uniform suppliers", "Multi-brand retailers"],
    entryRoutes: ["OEM brand supply", "Workwear distributor", "Retail private label"],
    barriers: ["Performance-claim testing", "Complex material bills", "Seasonal development calendars"],
    proofToPrepare: ["Water and durability test results", "Material traceability", "Development calendar and capacity plan"],
    nextActions: ["Select one technical product family.", "Validate performance claims.", "Approach buyers before development-calendar cut-offs."],
    evidence: [evidence("Outerwear imports from Bangladesh", "https://wits.worldbank.org/trade/comtrade/en/country/All/year/2023/tradeflow/Imports/partner/BGD/product/621020", "UK is part of a broader established Bangladesh outerwear lane")]
  }
] as const;

export function opportunityScoreBand(score: number): MarketOpportunityView["scoreBand"] {
  if (score >= 88) return "Priority";
  if (score >= 78) return "Promising";
  return "Watch";
}

export function marketOpportunityViews(
  access: MarketIntelligenceAccess,
  opportunities: readonly MarketOpportunity[] = marketOpportunityCatalog
): MarketOpportunityView[] {
  return opportunities.map((opportunity) => ({
    id: opportunity.id,
    access,
    target: opportunity.target,
    product: opportunity.product,
    trend: opportunity.trend,
    confidence: opportunity.confidence,
    scoreBand: opportunityScoreBand(opportunity.opportunityScore),
    publicSummary: opportunity.publicSummary,
    ...(access === "public"
      ? {}
      : {
          opportunityScore: opportunity.opportunityScore,
          demandScore: opportunity.demandScore,
          originFitScore: opportunity.originFitScore,
          memberInsight: opportunity.memberInsight,
          evidenceCount: opportunity.evidence.length
        }),
    ...(access === "full"
      ? {
          fullAnalysis: {
            whyItRanks: opportunity.whyItRanks,
            buyerProfiles: opportunity.buyerProfiles,
            entryRoutes: opportunity.entryRoutes,
            barriers: opportunity.barriers,
            proofToPrepare: opportunity.proofToPrepare,
            nextActions: opportunity.nextActions,
            evidence: opportunity.evidence
          }
        }
      : {})
  }));
}

export function marketCountries(
  opportunities: readonly MarketOpportunity[] = marketOpportunityCatalog
): MarketCountry[] {
  return Array.from(new Map(opportunities.map((item) => [item.target.code, item.target])).values());
}

export function marketCategories(
  opportunities: readonly MarketOpportunity[] = marketOpportunityCatalog
): string[] {
  return Array.from(new Set(opportunities.map((item) => item.product.category))).sort();
}
