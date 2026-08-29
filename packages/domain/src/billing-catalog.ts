export type BillingInterval = "one_time" | "quarterly" | "annual" | "monthly";

export interface PricingHypothesis {
  readonly productKey: "explore" | "first_shipment_pass" | "launch" | "scale" | "managed_ops";
  readonly displayName: string;
  readonly currency: "BDT";
  readonly amountMinor: number;
  readonly interval: BillingInterval;
  readonly billingCadenceMonths: number | null;
  readonly status: "preview" | "manual_pilot" | "planned";
  readonly includedActiveLanes: number | null;
  readonly includedEditors: number | null;
}
export const pricingCatalogVersion = "2026-08-29.r3-hypothesis-1";

/** Configurable catalog seed. These are research hypotheses, not an active checkout offer. */
export const pricingHypotheses: readonly PricingHypothesis[] = [
  { productKey: "explore", displayName: "Explore", currency: "BDT", amountMinor: 0, interval: "monthly", billingCadenceMonths: 1, status: "preview", includedActiveLanes: 1, includedEditors: 1 },
  { productKey: "first_shipment_pass", displayName: "First Shipment Pass", currency: "BDT", amountMinor: 750000, interval: "one_time", billingCadenceMonths: null, status: "manual_pilot", includedActiveLanes: 1, includedEditors: 3 },
  { productKey: "launch", displayName: "Launch quarterly", currency: "BDT", amountMinor: 747000, interval: "quarterly", billingCadenceMonths: 3, status: "planned", includedActiveLanes: null, includedEditors: null },
  { productKey: "launch", displayName: "Launch annual", currency: "BDT", amountMinor: 2490000, interval: "annual", billingCadenceMonths: 12, status: "planned", includedActiveLanes: null, includedEditors: null },
  { productKey: "scale", displayName: "Scale monthly", currency: "BDT", amountMinor: 799000, interval: "monthly", billingCadenceMonths: 1, status: "planned", includedActiveLanes: null, includedEditors: null },
  { productKey: "scale", displayName: "Scale annual", currency: "BDT", amountMinor: 7990000, interval: "annual", billingCadenceMonths: 12, status: "planned", includedActiveLanes: null, includedEditors: null },
  { productKey: "managed_ops", displayName: "Managed Ops base", currency: "BDT", amountMinor: 1990000, interval: "monthly", billingCadenceMonths: 1, status: "planned", includedActiveLanes: null, includedEditors: null }
] as const;

export function validatePricingCatalog(catalog: readonly PricingHypothesis[]): void {
  if (!catalog.length) throw new Error("Pricing catalog must not be empty.");
  for (const item of catalog) {
    if (!Number.isSafeInteger(item.amountMinor) || item.amountMinor < 0) throw new Error(`${item.displayName} has an invalid minor-unit price.`);
    if (item.currency !== "BDT") throw new Error(`${item.displayName} must use the reviewed BDT hypothesis.`);
    if (item.interval === "one_time" && item.billingCadenceMonths !== null) throw new Error(`${item.displayName} one-time pricing cannot have a billing cadence.`);
    if (item.interval !== "one_time" && (!item.billingCadenceMonths || item.billingCadenceMonths < 1)) throw new Error(`${item.displayName} requires a billing cadence.`);
  }
}
