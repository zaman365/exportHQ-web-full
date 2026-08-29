import type { Metadata } from "next";
import Link from "next/link";
import { readPilotParticipation, readPrivateBetaCockpit } from "@exporthq/db";
import { Badge, Card } from "@exporthq/ui";
import { ArrowRight, CircleDollarSign, FileCheck2, PackageCheck, Ship, ShieldAlert, UsersRound } from "lucide-react";
import { WorkspaceShell } from "../_components/workspace-shell";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export const metadata: Metadata = {
  title: "Private Beta cockpit — Export HQ",
  description: "Controlled buyer-to-realized-proceeds cockpit for the Export HQ Private Beta."
};

export const dynamic = "force-dynamic";

function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(minor / 100);
}
export default async function PrivateBetaPage() {
  const session = await getWorkspaceFeatureSession("home");
  const result = session.isDemo ? { ran: false as const } : await runTenantCommand(session, async (tx, context) => ({
    participation: await readPilotParticipation(tx, context),
    cockpit: await readPrivateBetaCockpit(tx, context)
  }));
  if (!result.ran) return <WorkspaceShell active="other" session={session}><TenantSurfacePending phase="R3" title="Private Beta storage is unavailable" description="The operational cockpit fails closed until tenant PostgreSQL persistence is active." /></WorkspaceShell>;
  if (result.value.participation?.status !== "active") return <WorkspaceShell active="other" session={session}><TenantSurfacePending phase="R3 Private Beta" title="Active cohort participation required" description="Controlled real-shipment workflows activate only after exact agreement acceptance, operations activation and named support ownership." /></WorkspaceShell>;
  const cockpit = result.value.cockpit;
  return <WorkspaceShell active="other" session={session}>
    <section className="alpha-heading"><div><p>PRIVATE BETA / CONTROLLED SHIPMENTS</p><h1>Buyer-to-proceeds cockpit</h1><span>Tenant-authoritative commercial, document, shipment, exception and payment records.</span></div><Badge tone="warning">Provider activation gated</Badge></section>
    <section className="alpha-warning"><ShieldAlert size={20} /><div><strong>Workflow foundation active; real outcome gate still open.</strong><p>No shipment, proceeds, provider delivery or trade-operations sign-off is inferred. Counts below come only from this tenant’s database.</p></div></section>
    <section className="module-metrics">
      <article><span><UsersRound size={17} /></span><div><small>Buyers</small><strong>{cockpit.buyers}</strong><p>{cockpit.openOpportunities} open opportunities</p></div></article>
      <article><span><FileCheck2 size={17} /></span><div><small>Commercial</small><strong>{cockpit.approvedOrSentQuotes}</strong><p>approved, sent or accepted quotes</p></div></article>
      <article><span><Ship size={17} /></span><div><small>Shipments</small><strong>{cockpit.activeShipments}</strong><p>{cockpit.openExceptions} open exceptions</p></div></article>
      <article><span><CircleDollarSign size={17} /></span><div><small>Proceeds</small><strong>{cockpit.realizedProceeds.length}</strong><p>matched realized-proceeds records</p></div></article>
    </section>
    <div className="alpha-grid">
      <Card className="alpha-scope-card"><header><PackageCheck size={19} /><div><small>ORDER TO SHIPMENT</small><h2>{cockpit.confirmedOrders} controlled orders</h2></div></header><dl><div><dt>Active RFQs</dt><dd>{cockpit.activeRfqs}</dd></div><div><dt>Outstanding trade invoices</dt><dd>{cockpit.outstandingTradeInvoices}</dd></div><div><dt>Financial discrepancies</dt><dd>{cockpit.openFinancialDiscrepancies}</dd></div><div><dt>Customer billing invoices</dt><dd>{cockpit.billingInvoices}</dd></div></dl><Link href="/buyers">Open buyer register <ArrowRight size={13} /></Link></Card>
      <Card className="alpha-scope-card"><header><CircleDollarSign size={19} /><div><small>NORTH-STAR OUTCOME</small><h2>Realized proceeds</h2></div></header>{cockpit.realizedProceeds.length ? <ul>{cockpit.realizedProceeds.map((item, index) => <li key={`${item.currency}-${index}`}><strong>{money(item.realizedMinor, item.currency)}</strong> · {(item.actualMarginBps / 100).toFixed(1)}% margin · {Math.round(item.cycleTimeMinutes / 60)}h cycle</li>)}</ul> : <p>No matched proceeds have been confirmed. This remains an exit-gate outcome to earn with controlled real shipments.</p>}</Card>
    </div>
  </WorkspaceShell>;
}
