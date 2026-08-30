import { authorizeOrganization, featuresForTier, permissionsForTier } from "@exporthq/authorization";
import { readPilotWorkspace, readWorkspaceDashboard, type WorkspaceTaskStatus } from "@exporthq/db";
import { ArrowRight, Clock3, FileText, Package, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge, Card, Progress } from "@exporthq/ui";
import { ExploreHome } from "./_components/explore-home";
import { DashboardStarterWorkspace } from "./_components/dashboard-starter-workspace";
import { HintButton } from "./_components/hint-button";
import { WorkspaceShell } from "./_components/workspace-shell";
import { getWorkspaceFeatureSession } from "./_lib/session";
import { runTenantCommand } from "./_lib/tenant";

export const dynamic = "force-dynamic";

const statusTone: Record<WorkspaceTaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  todo: "neutral",
  waiting_customer: "danger",
  in_progress: "info",
  waiting_export_hq: "warning",
  waiting_third_party: "neutral",
  completed: "success",
  cancelled: "neutral",
  blocked: "danger"
};

function Metric({ label, value, meta }: { label: string; value: string | number; meta: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>;
}

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" }).format(new Date(value))
    : "No deadline";
}

export default async function CommandCenterPage({ searchParams }: { searchParams: Promise<{ business?: string; access?: string }> }) {
  const params = await searchParams;
  const baseSession = await getWorkspaceFeatureSession("home", {
    allowPublicPreview: true,
    forcePublicPreview: params.access === "public"
  });
  const demoBasicBusiness = baseSession.isDemo && baseSession.principal && params.access === "basic" ? params.business?.slice(0, 100) : undefined;
  const session = demoBasicBusiness ? {
    ...baseSession,
    organizationName: demoBasicBusiness,
    tier: "explore" as const,
    businessVerification: "unverified" as const,
    isPlatformAdmin: false,
    features: featuresForTier("explore"),
    principal: baseSession.principal
      ? { ...baseSession.principal, permissions: permissionsForTier("explore") }
      : null
  } : baseSession;
  if (!session.userId || session.tier === "explore") {
    return <WorkspaceShell active="dashboard" session={session}><ExploreHome session={session} /></WorkspaceShell>;
  }
  if (!session.principal) return null;
  authorizeOrganization(session.principal, session.principal.organizationId, "company:view");
  const persisted = session.isDemo
    ? { ran: false as const }
    : await runTenantCommand(session, async (tx, context) => ({
      dashboard: await readWorkspaceDashboard(tx, context),
      pilot: await readPilotWorkspace(tx, context)
    }));

  if (!persisted.ran) {
    return <WorkspaceShell active="dashboard" session={session}>
      <section className="welcome"><div><p>HOME / DASHBOARD</p><h1>Your protected workspace</h1><span>Customer records are unavailable until tenant PostgreSQL activation is complete.</span></div></section>
      <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><ShieldAlert size={18} /></span><Badge tone="warning">Fail closed</Badge></div><h2>No illustrative company data is shown as your tenant record</h2><p>Nothing has been loaded into your protected record from browser storage, Clerk metadata, or the public sample. The editable starter sandbox below stays visibly separate until protected persistence is available.</p><footer><Link href="/preview/dashboard">Open the complete labelled sample <ArrowRight size={14} /></Link></footer></Card>
      <DashboardStarterWorkspace mode="workspace" storageScope={session.organizationId ?? session.userId ?? "workspace"} />
    </WorkspaceShell>;
  }

  const { dashboard, pilot } = persisted.value;
  const customerTasks = dashboard.tasks.filter((task) => task.responsibility === "customer");
  const exportHqTasks = dashboard.tasks.filter((task) => task.responsibility === "export_hq");
  const thirdPartyTasks = dashboard.tasks.filter((task) => task.responsibility === "third_party");

  return <WorkspaceShell active="dashboard" contentId="overview" session={session}>
    <section className="welcome">
      <div><p>HOME / DASHBOARD</p><h1>Good morning, {session.userName?.split(" ")[0] ?? "there"}. <HintButton topic="dashboard-overview" /></h1><span>Current tenant records for {dashboard.organization.tradingName}.</span></div>
      <div className="welcome__actions"><Link href="/settings?section=organization#primary-offer" className="button button--secondary"><Plus size={16} /> Add product</Link><Link href="/readiness" className="button button--primary">Open action plan <ArrowRight size={16} /></Link></div>
    </section>

    {pilot && <section className="alpha-dashboard-callout"><div><small>INVITATION-ONLY PRIVATE ALPHA</small><strong>{pilot.participation.status === "invited" ? "Review the exact participation agreement" : pilot.participation.status === "accepted" ? "Participation accepted; activation is pending" : "Your bounded Alpha record is active"}</strong><p>View First Shipment Pass limits, named support scope and the printable action pack.</p></div><Link href="/alpha">Open Private Alpha <ArrowRight size={15} /></Link></section>}

    <section className="score-grid" aria-label="Export health summary">
      <Card className="health-card">
        <div className="card-kicker"><span>EXPORT HEALTH <HintButton topic="export-health" /></span><Badge tone={dashboard.health.overall ? "info" : "neutral"}>{dashboard.health.overall ? "Measured" : "Not assessed"}</Badge></div>
        <div className="score-row"><strong>{dashboard.health.overall}</strong><span>/ 100</span><div className="score-ring" style={{ "--score": `${dashboard.health.overall * 3.6}deg` } as React.CSSProperties}><span /></div></div>
        <p>{dashboard.health.overall ? "Calculated from the latest lane-scoped readiness assessments." : "Complete a lane readiness assessment to establish a measured baseline."}</p>
        <Link href="/readiness">Open readiness assessment <ArrowRight size={15} /></Link>
      </Card>
      <Card className="readiness-card" id="readiness">
        <div className="card-kicker"><span>READINESS BY LANE <HintButton topic="readiness-areas" /></span><Link href="/readiness">View action plan</Link></div>
        <div className="readiness-list">
          {dashboard.health.dimensions.length ? dashboard.health.dimensions.map((item) => <div key={item.label}><span>{item.label}</span><Progress value={item.score} label={item.label} /><strong>{item.score}%</strong></div>) : <p>No lane assessment has been saved yet.</p>}
        </div>
      </Card>
      <Card className="onboarding-card">
        <div className="card-kicker"><span>PROFILE PROGRESS <HintButton topic="setup-progress" /></span><Badge tone="neutral">Contextual</Badge></div>
        <strong>{dashboard.organization.onboardingPercent}%</strong>
        <Progress value={dashboard.organization.onboardingPercent} label="Organization setup" />
        <p>Add product, facility, and evidence details as they become relevant.</p>
        <Link href="/settings?section=organization#primary-offer" className="button button--secondary">Open business profile <ArrowRight size={15} /></Link>
      </Card>
    </section>

    <section className="metric-strip" aria-label="Workspace totals">
      <Metric label="TARGET MARKETS" value={dashboard.metrics.targetMarkets} meta="Active Export Lanes" />
      <Metric label="ACTIVE PRODUCTS" value={dashboard.metrics.products} meta="Tenant catalogue" />
      <Metric label="OPEN ACTIONS" value={dashboard.metrics.openActions} meta="Current page" />
      <Metric label="DOCUMENTS" value={dashboard.metrics.documents} meta="Protected metadata" />
    </section>

    <section id="actions">
      <div className="section-head"><div><p>ACTION CENTER</p><h2>What happens next <HintButton topic="waiting-overview" /></h2></div><Link href="/waiting">Open task view <ArrowRight size={15} /></Link></div>
      <div className="ownership-tabs" aria-label="Action ownership"><span className="active">Waiting for you <b>{customerTasks.length}</b></span><span>Export HQ <b>{exportHqTasks.length}</b></span><span>Third party <b>{thirdPartyTasks.length}</b></span></div>
      <div className="task-list">
        {dashboard.tasks.length ? dashboard.tasks.map((task) => <article className="task" key={task.id}><span className="task-check" aria-hidden="true" /><div><div className="task__title"><strong>{task.title}</strong><Badge tone={statusTone[task.status]}>{task.status.replaceAll("_", " ")}</Badge></div><p>{task.description}</p><footer><span><Clock3 size={14} /> {formatDate(task.dueAt)}</span><span>Owner · {task.ownerLabel}</span><span>{task.relatedEntityType ?? "Workspace"}</span></footer></div><Link className="task-open" href={task.exportLaneId ? `/studio?lane=${task.exportLaneId}` : "/readiness"} aria-label={`Open ${task.title}`}><ArrowRight size={17} /></Link></article>) : <Card><h3>No open action</h3><p>New readiness responses and reviewed evidence will create owned tasks here.</p></Card>}
      </div>
    </section>

    <section className="module-section" id="products">
      <div className="section-head"><div><p>PRODUCT × MARKET</p><h2>Active product lanes <HintButton topic="product-readiness" /></h2></div><Link href="/settings?section=organization#primary-offer" className="button button--secondary"><Plus size={15} /> Add product</Link></div>
      <div className="product-table" role="table" aria-label="Product readiness">
        <div className="table-head" role="row"><span>Product</span><span>HS code</span><span>Target market</span><span>Readiness</span><span>Status</span></div>
        {dashboard.products.length ? dashboard.products.map((product) => <div className="table-row" role="row" key={product.id}><span><span className="product-thumb"><Package size={18} /></span><span><strong>{product.name}</strong><small>{product.sku || "No internal reference"} · {product.composition || product.category}</small></span></span><span>{product.hsCode ?? "Needs review"}</span><span>{product.destinationCountryCode ?? "No lane"}</span><span><Progress value={product.readinessScore ?? 0} label={`${product.name} readiness`} /><strong>{product.readinessScore ?? 0}%</strong></span><span><Badge tone={product.laneStatus === "active" ? "success" : "neutral"}>{product.laneStatus?.replaceAll("_", " ") ?? "No lane"}</Badge></span></div>) : <div className="table-row" role="row"><span><strong>No product saved</strong></span><span>—</span><span>—</span><span>—</span><span><Badge tone="neutral">Empty</Badge></span></div>}
      </div>
    </section>

    <div className="bottom-grid">
      <section className="module-section" id="documents"><div className="section-head"><div><p>DOCUMENT VAULT</p><h2>Recent document records <HintButton topic="document-vault" /></h2></div><Link href="/readiness" className="button button--secondary">Open evidence workflow</Link></div><div className="document-list">{dashboard.documents.length ? dashboard.documents.map((document) => <div key={document.id}><span className="file-icon"><FileText size={17} /></span><span><strong>{document.name}</strong><small>{document.category} · {document.linkedEntityType}</small></span><Badge tone={document.status === "approved" ? "success" : document.status === "rejected" ? "danger" : "info"}>{document.status.replaceAll("_", " ")}</Badge></div>) : <p>No document metadata exists for this organization.</p>}</div></section>
      <section className="module-section" id="activity"><div className="section-head"><div><p>SHARED ACTIVITY</p><h2>Latest auditable updates <HintButton topic="shared-activity" /></h2></div></div><div className="activity-list">{dashboard.activity.length ? dashboard.activity.map((item) => <div key={item.id}><span><strong>{item.actorLabel}</strong><p>{item.action}</p><small>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(item.at))}</small></span></div>) : <p>No audited activity yet.</p>}</div></section>
    </div>
    <DashboardStarterWorkspace mode="workspace" storageScope={session.organizationId ?? session.userId ?? "workspace"} />
  </WorkspaceShell>;
}
