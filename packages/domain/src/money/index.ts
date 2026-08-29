export type CurrencyCode = string;
export type CostResponsibility = "seller" | "buyer";

export interface Money {
  readonly currency: CurrencyCode;
  readonly minor: bigint;
}

export interface FixedFxRate {
  readonly sourceCurrency: CurrencyCode;
  readonly targetCurrency: CurrencyCode;
  readonly numerator: bigint;
  readonly denominator: bigint;
  readonly source: string;
  readonly retrievedAt: string;
}

export type CommercialCostCategory =
  | "goods"
  | "packaging"
  | "inland"
  | "documentation"
  | "testing"
  | "freight"
  | "insurance"
  | "commission"
  | "finance"
  | "fx_buffer"
  | "duty"
  | "destination_tax"
  | "brokerage"
  | "last_mile"
  | "importer_of_record";

export interface CommercialCostLine {
  readonly category: CommercialCostCategory;
  readonly amount: Money;
  readonly responsibility: CostResponsibility;
  readonly recoverable: boolean;
  readonly includedInSellerCost: boolean;
  readonly explanation: string;
}

export interface ExactCommercialScenarioInput {
  readonly incoterm: "FOB" | "CIF" | "DDP";
  readonly units: bigint;
  readonly unitExFactory: Money;
  readonly unitPackaging: Money;
  readonly quoteUnit: Money;
  readonly inland: Money;
  readonly documentation: Money;
  readonly testing: Money;
  readonly freight: Money;
  readonly insuranceBps: number;
  readonly commissionBps: number;
  readonly financeBps: number;
  readonly fxBufferBps: number;
  readonly dutyBps: number;
  readonly dutyResponsibility: CostResponsibility;
  readonly destinationTaxBps: number;
  readonly destinationTaxResponsibility: CostResponsibility;
  readonly destinationTaxRecoverable: boolean;
  readonly brokerage: Money;
  readonly brokerageResponsibility: CostResponsibility;
  readonly lastMile: Money;
  readonly lastMileResponsibility: CostResponsibility;
  readonly importerOfRecord: Money;
  readonly importerOfRecordResponsibility: CostResponsibility;
  readonly targetMarginBps: number;
}

export interface ExactCommercialScenarioResult {
  readonly sellValue: Money;
  readonly costBase: Money;
  readonly sellerCost: Money;
  readonly grossMargin: Money;
  readonly grossMarginBps: number;
  readonly customsValue: Money;
  readonly estimatedDuty: Money;
  readonly estimatedDestinationTax: Money;
  readonly estimatedLandedValue: Money;
  readonly breakEvenUnit: Money;
  readonly ledger: readonly CommercialCostLine[];
  readonly warnings: readonly string[];
}

export function money(minor: bigint, currency: CurrencyCode): Money {
  if (!currency.trim()) throw new Error("Currency is required.");
  return { minor, currency: currency.toUpperCase() };
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return money(left.minor + right.minor, left.currency);
}

export function multiplyMoney(value: Money, quantity: bigint): Money {
  if (quantity < 0n) throw new Error("Quantity cannot be negative.");
  return money(value.minor * quantity, value.currency);
}

export function applyBasisPoints(value: Money, basisPoints: number): Money {
  const bps = boundedBasisPoints(basisPoints);
  return money(divideRounded(value.minor * BigInt(bps), 10_000n), value.currency);
}

export function convertMoney(value: Money, rate: FixedFxRate): Money {
  if (value.currency !== rate.sourceCurrency.toUpperCase()) throw new Error("FX source currency does not match the amount.");
  if (rate.numerator <= 0n || rate.denominator <= 0n) throw new Error("FX rate must be positive.");
  if (!rate.source.trim() || !rate.retrievedAt.trim()) throw new Error("FX provenance is required.");
  return money(divideRounded(value.minor * rate.numerator, rate.denominator), rate.targetCurrency);
}

export function calculateExactCommercialScenario(input: ExactCommercialScenarioInput): ExactCommercialScenarioResult {
  const currency = input.unitExFactory.currency;
  const monetaryInputs = [
    input.unitPackaging,
    input.quoteUnit,
    input.inland,
    input.documentation,
    input.testing,
    input.freight,
    input.brokerage,
    input.lastMile,
    input.importerOfRecord
  ];
  monetaryInputs.forEach((value) => assertSameCurrency(input.unitExFactory, value));
  if (input.units < 0n) throw new Error("Units cannot be negative.");
  [input.unitExFactory, ...monetaryInputs].forEach((value) => {
    if (value.minor < 0n) throw new Error("Commercial amounts cannot be negative.");
  });

  const goods = multiplyMoney(input.unitExFactory, input.units);
  const packaging = multiplyMoney(input.unitPackaging, input.units);
  const costBase = sumMoney(currency, [goods, packaging, input.inland, input.documentation, input.testing]);
  const freight = input.incoterm === "FOB" ? money(0n, currency) : input.freight;
  const insurance = input.incoterm === "FOB"
    ? money(0n, currency)
    : applyBasisPoints(addMoney(costBase, freight), input.insuranceBps);
  const sellValue = multiplyMoney(input.quoteUnit, input.units);
  const commission = applyBasisPoints(sellValue, input.commissionBps);
  const finance = applyBasisPoints(sellValue, input.financeBps);
  const fxBuffer = applyBasisPoints(sumMoney(currency, [costBase, freight, insurance]), input.fxBufferBps);

  const customsValue = input.incoterm === "FOB"
    ? sumMoney(currency, [sellValue, input.freight, applyBasisPoints(addMoney(costBase, input.freight), input.insuranceBps)])
    : sellValue;
  const estimatedDuty = applyBasisPoints(customsValue, input.dutyBps);
  const estimatedDestinationTax = applyBasisPoints(addMoney(customsValue, estimatedDuty), input.destinationTaxBps);

  const ledger: CommercialCostLine[] = [
    sellerLine("goods", goods, "Ex-factory goods cost"),
    sellerLine("packaging", packaging, "Export packaging cost"),
    sellerLine("inland", input.inland, "Origin inland transport"),
    sellerLine("documentation", input.documentation, "Export documentation"),
    sellerLine("testing", input.testing, "Testing and evidence"),
    sellerLine("freight", freight, input.incoterm === "FOB" ? "Freight excluded from FOB seller cost" : "Seller-contracted freight"),
    sellerLine("insurance", insurance, input.incoterm === "FOB" ? "Insurance excluded from FOB seller cost" : "Seller-contracted insurance"),
    sellerLine("commission", commission, "Sales commission"),
    sellerLine("finance", finance, "Finance cost"),
    sellerLine("fx_buffer", fxBuffer, "Currency risk buffer"),
    responsibilityLine("duty", estimatedDuty, input.dutyResponsibility, false, "Estimated destination duty"),
    responsibilityLine(
      "destination_tax",
      estimatedDestinationTax,
      input.destinationTaxResponsibility,
      input.destinationTaxRecoverable,
      input.destinationTaxRecoverable ? "Recoverable destination tax" : "Nonrecoverable destination tax"
    ),
    responsibilityLine("brokerage", input.brokerage, input.brokerageResponsibility, false, "Destination customs brokerage"),
    responsibilityLine("last_mile", input.lastMile, input.lastMileResponsibility, false, "Destination last-mile delivery"),
    responsibilityLine("importer_of_record", input.importerOfRecord, input.importerOfRecordResponsibility, false, "Importer-of-record service")
  ];

  const sellerCost = sumMoney(currency, ledger.filter((line) => line.includedInSellerCost).map((line) => line.amount));
  const grossMargin = money(sellValue.minor - sellerCost.minor, currency);
  const grossMarginBps = sellValue.minor > 0n
    ? Number(divideRounded(grossMargin.minor * 10_000n, sellValue.minor))
    : 0;
  const landed = sumMoney(currency, [customsValue, estimatedDuty, estimatedDestinationTax, input.brokerage, input.lastMile, input.importerOfRecord]);
  const breakEvenUnit = input.units > 0n ? money(divideRounded(sellerCost.minor, input.units), currency) : money(0n, currency);
  const warnings: string[] = [];

  if (input.units === 0n) warnings.push("Add a positive sellable quantity.");
  if (input.quoteUnit.minor === 0n) warnings.push("Add a positive quoted unit price.");
  if (grossMarginBps < 0) warnings.push("The current quote is below the estimated seller cost.");
  else if (grossMarginBps < boundedBasisPoints(input.targetMarginBps)) warnings.push("The current margin is below the lane target.");
  if (input.incoterm !== "FOB" && input.freight.minor === 0n) warnings.push("Add a freight assumption for this Incoterm.");
  if (input.dutyBps === 0) warnings.push("Confirm preferential duty and origin eligibility before relying on a zero-duty assumption.");
  if (input.incoterm === "DDP") {
    const unresolvedDdpLines = ledger.filter((line) =>
      ["duty", "brokerage", "last_mile", "importer_of_record"].includes(line.category)
      && line.responsibility !== "seller"
    );
    if (unresolvedDdpLines.length > 0) warnings.push("DDP responsibility is incomplete: duty, brokerage, last mile and importer-of-record costs normally require an explicit seller assumption.");
  }
  warnings.push("Destination duty and tax are estimates; confirm the HS code, valuation, preference, importer, tax recoverability and current tariff.");

  return {
    sellValue,
    costBase,
    sellerCost,
    grossMargin,
    grossMarginBps,
    customsValue,
    estimatedDuty,
    estimatedDestinationTax,
    estimatedLandedValue: landed,
    breakEvenUnit,
    ledger,
    warnings
  };
}

function sellerLine(category: CommercialCostCategory, amount: Money, explanation: string): CommercialCostLine {
  return responsibilityLine(category, amount, "seller", false, explanation);
}

function responsibilityLine(
  category: CommercialCostCategory,
  amount: Money,
  responsibility: CostResponsibility,
  recoverable: boolean,
  explanation: string
): CommercialCostLine {
  return {
    category,
    amount,
    responsibility,
    recoverable,
    includedInSellerCost: responsibility === "seller" && !recoverable,
    explanation
  };
}

function sumMoney(currency: CurrencyCode, values: readonly Money[]): Money {
  return values.reduce((total, value) => addMoney(total, value), money(0n, currency));
}

function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) throw new Error(`Currency mismatch: ${left.currency} and ${right.currency}.`);
}

function boundedBasisPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100_000, Math.max(0, Math.round(value)));
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("Divisor must be positive.");
  if (numerator >= 0n) return (numerator + denominator / 2n) / denominator;
  return -((-numerator + denominator / 2n) / denominator);
}
