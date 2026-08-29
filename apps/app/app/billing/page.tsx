import type { Metadata } from "next";
import Link from "next/link";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { listCustomerBillingInvoices, readPublicBetaUsage } from "@exporthq/db";
import { Badge, Card } from "@exporthq/ui";
import { ArrowRight, CalendarClock, CreditCard, Download, Gauge, ReceiptText, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "../_components/workspace-shell";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { requireWorkspaceFeature } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { requestCurrentSubscriptionCancellation } from "./actions";

export const metadata: Metadata = {
  title: "Billing & usage — Export HQ",
  description: "Review exact Export HQ plan limits, metered usage, invoices, and subscription controls."
};

export const dynamic = "force-dynamic";

const capabilityCopy = {
  active_lane: { label: "Active Export Lanes", unit: "lanes", divisor: 1 },
  editor: { label: "Editors", unit: "people", divisor: 1 },
  storage_byte: { label: "Evidence storage", unit: "GiB", divisor: 1_073_741_824 },
  automation_unit: { label: "Automation units", unit: "units", divisor: 1 },
  work_pack: { label: "Managed work packs", unit: "packs", divisor: 1 }
} as const;

function amount(minor: number): string {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(minor / 100);
}

function date(value: Date | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

function units(value: number, divisor: number): string {
  const normalized = value / divisor;
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: divisor === 1 ? 0 : 2 }).format(normalized);
}

export default async function BillingPage() {
  const session = await requireWorkspaceFeature("billing");
  authorizeOrganization(session.principal, session.principal.organizationId, "billing:view");
  const canAdminister = canAccessOrganization(session.principal, session.principal.organizationId, "billing:admin");
  const canSelfServe = canAccessOrganization(session.principal, session.principal.organizationId, "subscription:self_service");
  const result = await runTenantCommand(session, async (tx, context) => ({
    usage: await readPublicBetaUsage(tx, context),
    invoices: await listCustomerBillingInvoices(tx, context)
  }));
  if (!result.ran) return <WorkspaceShell active="billing" session={session}><TenantSurfacePending phase="R4" title="Billing ledger is unavailable" description="Plan and invoice data fail closed until tenant PostgreSQL persistence is active." /></WorkspaceShell>;
  if (!result.value.usage) return <WorkspaceShell active="billing" session={session}>
    <section className="billing-heading"><div><p>ACCOUNT / BILLING</p><h1>Billing & usage</h1><span>No active internal subscription is recorded for this organization.</span></div><Badge tone="warning">No active plan</Badge></section>
    <Card className="billing-empty"><CreditCard size={24} /><h2>Choose access with the real limits in view.</h2><p>Checkout remains closed until a reviewed BDT provider, cancellation, invoice, refund, dunning, reconciliation and rollback evidence are active.</p><Link href="/plans">Review plans <ArrowRight size={14} /></Link></Card>
  </WorkspaceShell>;
  const { usage, invoices } = result.value;
  const usageCsv = [
    "capability,used,included,projected,projected_overage,projected_charge_minor,currency",
    ...usage.usage.map((item) => [item.capability, item.used, item.included, item.projected, item.projectedOverage, item.projectedChargeMinor, usage.currency].join(","))
  ].join("\n");
  const usageDownload = `data:text/csv;charset=utf-8,${encodeURIComponent(usageCsv)}`;
  return <WorkspaceShell active="billing" session={session}>
    <section className="billing-heading"><div><p>ACCOUNT / BILLING</p><h1>Billing & usage</h1><span>Internal ledger limits and period usage for {session.organizationName ?? "your organization"}.</span></div><Badge tone={usage.selfServiceEnabled ? "success" : "warning"}>{usage.selfServiceEnabled ? "Self-service active" : "Managed billing"}</Badge></section>
    <section className="billing-summary" aria-label="Plan summary">
      <Card><span><CreditCard size={18} /></span><div><small>Current plan</small><strong>{usage.planName}</strong><p>Catalog {usage.catalogVersion}</p></div></Card>
      <Card><span><CalendarClock size={18} /></span><div><small>Current period</small><strong>{date(usage.currentPeriodStart)} – {date(usage.currentPeriodEnd)}</strong><p>Usage resets at the next billing period.</p></div></Card>
      <Card><span><Gauge size={18} /></span><div><small>Projected metered charge</small><strong>{amount(usage.projectedChargeMinor)}</strong><p>Projection, not an issued invoice.</p></div></Card>
    </section>
    <section className="billing-section" aria-labelledby="usage-heading"><header><div><p>EXACT PLAN LIMITS</p><h2 id="usage-heading">Current and projected usage</h2></div><span><a download={`exporthq-usage-${usage.currentPeriodStart.toISOString().slice(0, 10)}.csv`} href={usageDownload}><Download size={13} /> Export usage CSV</a>No capability is represented as unlimited.</span></header><div className="billing-usage-grid">{usage.usage.map((item) => {
      const copy = capabilityCopy[item.capability];
      const used = units(item.used, copy.divisor);
      const included = units(item.included, copy.divisor);
      const projected = units(item.projected, copy.divisor);
      const overage = units(item.projectedOverage, copy.divisor);
      const width = item.included === 0 ? item.used > 0 ? 100 : 0 : Math.min(100, Math.round((item.used / item.included) * 100));
      return <Card key={item.capability} className="billing-usage-card"><header><span><strong>{copy.label}</strong><small>{used} of {included} {copy.unit} used</small></span><b>{item.remaining > 0 ? `${units(item.remaining, copy.divisor)} left` : "Limit reached"}</b></header><div className="billing-meter" role="progressbar" aria-label={`${copy.label} usage`} aria-valuemin={0} aria-valuemax={item.included} aria-valuenow={Math.min(item.used, item.included)}><span style={{ width: `${width}%` }} /></div><dl><div><dt>Projected</dt><dd>{projected} {copy.unit}</dd></div><div><dt>Projected overage</dt><dd>{overage} {copy.unit}</dd></div><div><dt>Projected charge</dt><dd>{amount(item.projectedChargeMinor)}</dd></div></dl></Card>;
    })}</div></section>
    <div className="billing-columns">
      <section className="billing-section" aria-labelledby="invoice-heading"><header><div><p>DOCUMENTS</p><h2 id="invoice-heading">Invoices</h2></div></header>{invoices.length ? <div className="billing-invoices">{invoices.map((invoice) => <article key={invoice.id}><span><ReceiptText size={17} /><span><strong>{invoice.invoiceNumber}</strong><small>{date(invoice.issuedAt)} · Due {date(invoice.dueAt)}</small></span></span><b>{amount(invoice.totalMinor)}</b><Badge tone={invoice.status === "paid" ? "success" : "warning"}>{invoice.status.replaceAll("_", " ")}</Badge><span className="billing-download-pending" title="Private invoice download activates with the production R2 delivery binding"><Download size={14} /> R2 binding pending</span></article>)}</div> : <Card className="billing-empty"><ReceiptText size={22} /><h3>No invoices recorded</h3><p>Issued invoice documents will appear here from the internal billing ledger.</p></Card>}</section>
      <aside className="billing-section billing-controls" aria-labelledby="controls-heading"><header><div><p>OWNER CONTROLS</p><h2 id="controls-heading">Plan & payment</h2></div></header><Card><ShieldCheck size={20} /><strong>{canAdminister ? "Billing administrator access" : canSelfServe ? "Subscription-owner access" : "View-only billing access"}</strong><p>Plan changes, cancellation and payment methods require explicit organization authority.</p></Card><button type="button" disabled={!canAdminister || !canSelfServe || !usage.selfServiceEnabled}>Change plan</button><button type="button" disabled={!canAdminister || !usage.selfServiceEnabled}>Update payment method</button><form action={requestCurrentSubscriptionCancellation}><input type="hidden" name="subscriptionId" value={usage.subscriptionId} /><input type="hidden" name="reason" value="Customer requested cancellation from the billing workspace" /><button type="submit" className="billing-cancel" disabled={!canSelfServe}>Request cancellation</button></form>{!usage.selfServiceEnabled && <p className="billing-control-note">Self-service payment changes are unavailable while the reviewed BDT provider gate is closed. Cancellation requests remain recorded in Export HQ&apos;s internal ledger.</p>}</aside>
    </div>
  </WorkspaceShell>;
}
