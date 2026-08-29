import { eq } from "drizzle-orm";
import {
  buyerAccounts,
  buyerRfqs,
  customerBillingInvoices,
  financialDiscrepancies,
  quotations,
  realizedProceeds,
  salesOpportunities,
  salesOrders,
  shipmentExceptions,
  shipments,
  tradeInvoices
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface PrivateBetaCockpit {
  readonly buyers: number;
  readonly openOpportunities: number;
  readonly activeRfqs: number;
  readonly approvedOrSentQuotes: number;
  readonly confirmedOrders: number;
  readonly activeShipments: number;
  readonly openExceptions: number;
  readonly outstandingTradeInvoices: number;
  readonly openFinancialDiscrepancies: number;
  readonly realizedProceeds: readonly {
    readonly currency: string;
    readonly realizedMinor: number;
    readonly actualMarginBps: number;
    readonly cycleTimeMinutes: number;
  }[];
  readonly billingInvoices: number;
}
export async function readPrivateBetaCockpit(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<PrivateBetaCockpit> {
  const [buyers, opportunities, rfqs, quoteRows, orders, shipmentRows, exceptions, invoices, discrepancies, proceeds, billingInvoices] = await Promise.all([
    tx.select({ id: buyerAccounts.id }).from(buyerAccounts).where(eq(buyerAccounts.organizationId, context.organizationId)),
    tx.select({ status: salesOpportunities.status }).from(salesOpportunities).where(eq(salesOpportunities.organizationId, context.organizationId)),
    tx.select({ status: buyerRfqs.status }).from(buyerRfqs).where(eq(buyerRfqs.organizationId, context.organizationId)),
    tx.select({ status: quotations.status }).from(quotations).where(eq(quotations.organizationId, context.organizationId)),
    tx.select({ status: salesOrders.status }).from(salesOrders).where(eq(salesOrders.organizationId, context.organizationId)),
    tx.select({ status: shipments.status }).from(shipments).where(eq(shipments.organizationId, context.organizationId)),
    tx.select({ status: shipmentExceptions.status }).from(shipmentExceptions).where(eq(shipmentExceptions.organizationId, context.organizationId)),
    tx.select({ status: tradeInvoices.status }).from(tradeInvoices).where(eq(tradeInvoices.organizationId, context.organizationId)),
    tx.select({ status: financialDiscrepancies.status }).from(financialDiscrepancies).where(eq(financialDiscrepancies.organizationId, context.organizationId)),
    tx.select({ currency: realizedProceeds.currency, realizedMinor: realizedProceeds.realizedMinor, actualMarginBps: realizedProceeds.actualMarginBps, cycleTimeMinutes: realizedProceeds.cycleTimeMinutes }).from(realizedProceeds).where(eq(realizedProceeds.organizationId, context.organizationId)),
    tx.select({ status: customerBillingInvoices.status }).from(customerBillingInvoices).where(eq(customerBillingInvoices.organizationId, context.organizationId))
  ]);
  return {
    buyers: buyers.length,
    openOpportunities: opportunities.filter((item) => !["won", "lost", "archived"].includes(item.status)).length,
    activeRfqs: rfqs.filter((item) => !["closed", "cancelled"].includes(item.status)).length,
    approvedOrSentQuotes: quoteRows.filter((item) => ["approved", "sent", "accepted"].includes(item.status)).length,
    confirmedOrders: orders.filter((item) => !["draft", "cancelled"].includes(item.status)).length,
    activeShipments: shipmentRows.filter((item) => !["delivered", "cancelled"].includes(item.status)).length,
    openExceptions: exceptions.filter((item) => !["resolved", "closed"].includes(item.status)).length,
    outstandingTradeInvoices: invoices.filter((item) => !["paid", "void"].includes(item.status)).length,
    openFinancialDiscrepancies: discrepancies.filter((item) => !["resolved", "closed"].includes(item.status)).length,
    realizedProceeds: proceeds,
    billingInvoices: billingInvoices.length
  };
}
