import { authorizeOrganization, featuresForTier, permissionsForTier } from "@exporthq/authorization";
import { demoSnapshot, type TaskStatus } from "@exporthq/domain";
import { ArrowRight, Check, Clock3, FileText, MessageSquareText, Package, Plus, ShieldCheck, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card, Progress } from "@exporthq/ui";
import { HintButton } from "./_components/hint-button";
import { ExploreHome } from "./_components/explore-home";
import { WorkspaceShell } from "./_components/workspace-shell";
import { getWorkspaceFeatureSession } from "./_lib/session";

export const dynamic = "force-dynamic";

function Metric({ label, value, meta }: { label: string; value: string | number; meta: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>;
}

const statusTone: Record<TaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  todo: "neutral",
  waiting_customer: "danger",
  in_progress: "info",
  waiting_export_hq: "warning",
  waiting_third_party: "neutral",
  completed: "success",
  blocked: "danger"
};

const dashboardTaskRecords: Readonly<Record<string, string>> = {
  task_oekotex: "work-oekotex-upload",
  task_packaging: "work-packaging-model",
  task_labelling: "work-label-blocks",
  task_test_report: "work-supplier-declaration"
};

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
  const principal = session.principal;
  if (!principal) return null;
  authorizeOrganization(principal, principal.organizationId, "company:view");
  const customerTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "customer");
  const exportHqTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "export_hq");
  const thirdPartyTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "third_party");

  return (
    <WorkspaceShell active="dashboard" contentId="overview" session={session}>
          <section className="welcome">
            <div><p>HOME / DASHBOARD</p><h1>Good morning, {session.userName?.split(" ")[0] ?? "there"}. <HintButton topic="dashboard-overview" /></h1><span>Here&apos;s what needs attention across your export business.</span></div>
            <div className="welcome__actions"><Link href="/settings?section=organization#primary-offer" className="button button--secondary"><Plus size={16} /> Add product</Link><Link href="/team" className="button button--primary"><MessageSquareText size={16} /> Ask Export HQ</Link></div>
          </section>

          <section className="score-grid" aria-label="Export health summary">
            <Card className="health-card">
              <div className="card-kicker"><span>EXPORT HEALTH <HintButton topic="export-health" /></span><Badge tone="success">+4 this month</Badge></div>
              <div className="score-row"><strong>{demoSnapshot.health.overall}</strong><span>/ 100</span><div className="score-ring" style={{ "--score": `${demoSnapshot.health.overall * 3.6}deg` } as React.CSSProperties}><span /></div></div>
              <p>Your foundation is strong. Compliance and market readiness are the fastest paths to 88.</p>
              <Link href="/readiness">Run full readiness assessment <ArrowRight size={15} /></Link>
            </Card>
            <Card className="readiness-card" id="readiness">
              <div className="card-kicker"><span>READINESS BY AREA <HintButton topic="readiness-areas" /></span><Link href="/readiness">View action plan</Link></div>
              <div className="readiness-list">
                {demoSnapshot.health.dimensions.slice(0, 4).map((item) => <div key={item.area}><span>{item.label}</span><Progress value={item.score} label={item.label} /><strong>{item.score}%</strong></div>)}
              </div>
            </Card>
            <Card className="onboarding-card">
              <div className="card-kicker"><span>PROFILE PROGRESS <HintButton topic="setup-progress" /></span><Badge tone="warning">Optional</Badge></div>
              <strong>{demoSnapshot.organization.onboardingPercent}%</strong>
              <Progress value={demoSnapshot.organization.onboardingPercent} label="Organization setup" />
              <p>Add product, facility, and evidence details gradually as they become relevant.</p>
              <Link href="/settings?section=organization#primary-offer" className="button button--secondary">Open business profile <ArrowRight size={15} /></Link>
            </Card>
          </section>

          <section className="metric-strip" aria-label="Workspace totals">
            <Metric label="TARGET MARKETS" value={demoSnapshot.metrics.targetMarkets} meta="Germany is priority" />
            <Metric label="ACTIVE PRODUCTS" value={demoSnapshot.metrics.products} meta="2 under review" />
            <Metric label="OPEN ACTIONS" value={demoSnapshot.metrics.openActions} meta="1 urgent" />
            <Metric label="DOCUMENTS" value={demoSnapshot.metrics.documents} meta="3 under review" />
          </section>

          <div className="main-grid">
            <section id="actions">
              <div className="section-head"><div><p>ACTION CENTER</p><h2>What happens next <HintButton topic="waiting-overview" /></h2></div><Link href="/waiting">View all 7 actions <ArrowRight size={15} /></Link></div>
              <div className="ownership-tabs" aria-label="Action ownership">
                <span className="active">Waiting for you <b>{customerTasks.length}</b></span>
                <span>Export HQ <b>{exportHqTasks.length}</b></span>
                <span>Third party <b>{thirdPartyTasks.length}</b></span>
              </div>
              <div className="task-list">
                {demoSnapshot.tasks.map((task) => (
                  <article className="task" key={task.id}>
                    <span className="task-check" aria-hidden="true"><Check size={14} /></span>
                    <div><div className="task__title"><strong>{task.title}</strong><Badge tone={statusTone[task.status]}>{task.status.replaceAll("_", " ")}</Badge></div><p>{task.description}</p><footer><span><Clock3 size={14} /> Due {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(task.dueAt))}</span><span>Owner · {task.ownerName}</span><span>{task.relatedEntity}</span></footer></div>
                    <Link className="task-open" href={`/work?record=${dashboardTaskRecords[task.id] ?? ""}`} aria-label={`Open ${task.title}`}><ArrowRight size={17} /></Link>
                  </article>
                ))}
              </div>
            </section>

            <aside className="work-panel">
              <div className="section-head"><div><p>EXPORT HQ IS WORKING ON</p><h2>Managed work <HintButton topic="waiting-export-hq" /></h2></div></div>
              <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><ShieldCheck size={18} /></span><Badge tone="info">In progress</Badge></div><h3>Germany compliance review</h3><p>4 of 7 requirements completed</p><Progress value={57} label="Germany compliance review" /><footer><div className="avatar-stack"><Avatar initials="LW" /><Avatar initials="AM" tone={1} /></div><span>Next update · Friday</span></footer></Card>
              <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><Target size={18} /></span><Badge tone="success">On track</Badge></div><h3>Netherlands buyer research</h3><p>12 new buyers qualified this week</p><div className="mini-stat"><strong>34</strong><span>qualified buyers</span></div><footer><div className="avatar-stack"><Avatar initials="AM" tone={1} /></div><span>Updated 2h ago</span></footer></Card>
              <Link className="service-card" href="/team"><Sparkles size={18} /><span><strong>Need something else?</strong><small>Request an Export HQ service</small></span><ArrowRight size={17} /></Link>
            </aside>
          </div>

          <section className="module-section" id="products">
            <div className="section-head"><div><p>PRODUCT × MARKET</p><h2>Germany product readiness <HintButton topic="product-readiness" /></h2></div><Link href="/settings?section=organization#primary-offer" className="button button--secondary"><Plus size={15} /> Add product</Link></div>
            <div className="product-table" role="table" aria-label="Product readiness">
              <div className="table-head" role="row"><span>Product</span><span>HS code</span><span>Target market</span><span>Readiness</span><span>Status</span></div>
              {demoSnapshot.products.map((product) => <div className="table-row" role="row" key={product.id}><span><span className="product-thumb"><Package size={18} /></span><span><strong>{product.name}</strong><small>{product.sku} · {product.composition}</small></span></span><span>{product.hsCode}</span><span>🇩🇪 {product.market}</span><span><Progress value={product.readiness} label={`${product.name} readiness`} /><strong>{product.readiness}%</strong></span><span><Badge tone={product.status === "needs_work" ? "warning" : "info"}>{product.status.replaceAll("_", " ")}</Badge></span></div>)}
            </div>
          </section>

          <section className="module-section" id="requirements">
            <div className="section-head"><div><p>COMPLIANCE EVIDENCE</p><h2>Requirements needing attention <HintButton topic="requirements-evidence" /></h2></div><Link href="/readiness">Open requirement register <ArrowRight size={15} /></Link></div>
            <div className="requirement-grid">{demoSnapshot.requirements.map((requirement) => <Card key={requirement.id} className="requirement-card"><div><Badge tone={requirement.status === "action_required" ? "danger" : "info"}>{requirement.status.replaceAll("_", " ")}</Badge><span>{requirement.category} · {requirement.jurisdiction}</span></div><h3>{requirement.title}</h3><p><FileText size={15} /> {requirement.evidence}</p><footer><a href={requirement.sourceUrl} target="_blank" rel="noreferrer">{requirement.sourceLabel}</a><span>Verified {requirement.lastVerifiedAt}</span></footer></Card>)}</div>
          </section>

          <div className="bottom-grid">
            <section className="module-section" id="documents"><div className="section-head"><div><p>DOCUMENT VAULT</p><h2>Recent documents <HintButton topic="document-vault" /></h2></div><Link href="/readiness" className="button button--secondary">Upload document</Link></div><div className="document-list">{demoSnapshot.documents.map((document) => <div key={document.id}><span className="file-icon"><FileText size={17} /></span><span><strong>{document.name}</strong><small>{document.category} · {document.linkedTo}</small></span><Badge tone={document.status === "approved" ? "success" : document.status === "missing" ? "danger" : "info"}>{document.status.replaceAll("_", " ")}</Badge></div>)}</div></section>
            <section className="module-section" id="activity"><div className="section-head"><div><p>SHARED ACTIVITY</p><h2>Latest updates <HintButton topic="shared-activity" /></h2></div></div><div className="activity-list">{demoSnapshot.activity.map((item, index) => <div key={item.id}><Avatar initials={item.actor.split(" ").map((part) => part[0]).join("").slice(0, 2)} tone={index} /><span><strong>{item.actor}</strong><p>{item.action}</p><small>{item.at}</small></span></div>)}</div></section>
          </div>

          <section className="team-banner" id="team"><div><div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div><span><p>YOUR ACCOUNTABLE TEAM</p><strong>Anna, Rahim and Lisa are here to move your Germany launch forward. <HintButton topic="accountable-team" /></strong></span></div><Link href="/team" className="button button--primary">Message Export HQ <MessageSquareText size={16} /></Link></section>
    </WorkspaceShell>
  );
}
