import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization } from "@exporthq/authorization";
import { demoSnapshot, type TaskStatus } from "@exporthq/domain";
import { AlertTriangle, ArrowRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, FileText, FolderLock, Gauge, Globe2, LayoutDashboard, Menu, MessageSquareText, Package, Plus, Search, ShieldCheck, Sparkles, Target, Users, X } from "lucide-react";
import { Avatar, Badge, ButtonLink, Card, Logo, Progress } from "@exporthq/ui";

const groups = [
  { label: "COMMAND", items: [["Overview", LayoutDashboard, "#overview"], ["Tasks", Check, "#actions"], ["Calendar", CalendarDays, "#activity"]] },
  { label: "GROW", items: [["Markets", Globe2, "#readiness"], ["Opportunities", Target, "#readiness"], ["Buyers", Users, "#team"]] },
  { label: "TRADE", items: [["Products", Package, "#products"], ["Documents", FolderLock, "#documents"]] },
  { label: "COMPLY", items: [["Export readiness", Gauge, "#readiness"], ["Requirements", ShieldCheck, "#requirements"]] }
] as const;

export const dynamic = "force-dynamic";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__head"><Logo /><button aria-label="Collapse navigation"><Menu size={18} /></button></div>
      <button className="org-switcher">
        <span className="org-switcher__mark">AT</span>
        <span><strong>ABC Textiles</strong><small>Managed Export</small></span>
        <ChevronDown size={16} />
      </button>
      <nav aria-label="Primary navigation">
        {groups.map((group, groupIndex) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(([label, Icon, href], itemIndex) => (
              <a href={href} className={groupIndex === 0 && itemIndex === 0 ? "active" : ""} key={label}>
                <Icon size={17} strokeWidth={1.8} />{label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__team">
        <div><span className="status-dot" /><small>YOUR EXPORT HQ TEAM</small></div>
        <div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div>
        <strong>3 specialists assigned</strong>
        <span>Average response · 3h 24m</span>
        <a href="#team">Message your team <ArrowRight size={14} /></a>
      </div>
    </aside>
  );
}

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

export default async function CommandCenterPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, demoSnapshot.organization.id, "company:view");
  const customerTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "customer");
  const exportHqTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "export_hq");
  const thirdPartyTasks = demoSnapshot.tasks.filter((task) => task.responsibility === "third_party");

  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation"><Menu size={19} /></button>
          <button className="search"><Search size={17} /><span>Search Export HQ…</span><kbd>⌘ K</kbd></button>
          <div className="topbar__actions">
            <button aria-label="Help"><CircleHelp size={19} /></button>
            <button aria-label="Notifications" className="notification"><Bell size={19} /><span /></button>
            <button className="user-menu"><Avatar initials="NR" tone={2} /><span><strong>Nadia Rahman</strong><small>Owner</small></span><ChevronDown size={15} /></button>
          </div>
        </header>

        <div className="content" id="overview">
          <section className="welcome">
            <div><p>THURSDAY, 13 AUGUST</p><h1>Good morning, Nadia.</h1><span>Here&apos;s what needs attention across your export business.</span></div>
            <div className="welcome__actions"><ButtonLink href="/onboarding" variant="secondary"><Plus size={16} /> Add product</ButtonLink><ButtonLink href="#team"><MessageSquareText size={16} /> Ask Export HQ</ButtonLink></div>
          </section>

          <section className="score-grid" aria-label="Export health summary">
            <Card className="health-card">
              <div className="card-kicker"><span>EXPORT HEALTH</span><Badge tone="success">+4 this month</Badge></div>
              <div className="score-row"><strong>{demoSnapshot.health.overall}</strong><span>/ 100</span><div className="score-ring" style={{ "--score": `${demoSnapshot.health.overall * 3.6}deg` } as React.CSSProperties}><span /></div></div>
              <p>Your foundation is strong. Compliance and market readiness are the fastest paths to 88.</p>
              <a href="#readiness">View full health report <ArrowRight size={15} /></a>
            </Card>
            <Card className="readiness-card" id="readiness">
              <div className="card-kicker"><span>READINESS BY AREA</span><a href="#requirements">View action plan</a></div>
              <div className="readiness-list">
                {demoSnapshot.health.dimensions.slice(0, 4).map((item) => <div key={item.area}><span>{item.label}</span><Progress value={item.score} label={item.label} /><strong>{item.score}%</strong></div>)}
              </div>
            </Card>
            <Card className="onboarding-card">
              <div className="card-kicker"><span>SETUP PROGRESS</span><Badge tone="warning">2 steps left</Badge></div>
              <strong>{demoSnapshot.organization.onboardingPercent}%</strong>
              <Progress value={demoSnapshot.organization.onboardingPercent} label="Organization setup" />
              <p>Complete your facility profile and upload your current certification.</p>
              <ButtonLink href="/onboarding" variant="secondary">Continue setup <ArrowRight size={15} /></ButtonLink>
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
              <div className="section-head"><div><p>ACTION CENTER</p><h2>What happens next</h2></div><a href="#actions">View all 7 actions <ArrowRight size={15} /></a></div>
              <div className="ownership-tabs" aria-label="Action ownership">
                <span className="active">Waiting for you <b>{customerTasks.length}</b></span>
                <span>Export HQ <b>{exportHqTasks.length}</b></span>
                <span>Third party <b>{thirdPartyTasks.length}</b></span>
              </div>
              <div className="task-list">
                {demoSnapshot.tasks.map((task) => (
                  <article className="task" key={task.id}>
                    <button className="task-check" aria-label={`Mark ${task.title} complete`}><Check size={14} /></button>
                    <div><div className="task__title"><strong>{task.title}</strong><Badge tone={statusTone[task.status]}>{task.status.replaceAll("_", " ")}</Badge></div><p>{task.description}</p><footer><span><Clock3 size={14} /> Due {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(task.dueAt))}</span><span>Owner · {task.ownerName}</span><span>{task.relatedEntity}</span></footer></div>
                    <button aria-label={`Open ${task.title}`}><ArrowRight size={17} /></button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="work-panel">
              <div className="section-head"><div><p>EXPORT HQ IS WORKING ON</p><h2>Managed work</h2></div></div>
              <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><ShieldCheck size={18} /></span><Badge tone="info">In progress</Badge></div><h3>Germany compliance review</h3><p>4 of 7 requirements completed</p><Progress value={57} label="Germany compliance review" /><footer><div className="avatar-stack"><Avatar initials="LW" /><Avatar initials="AM" tone={1} /></div><span>Next update · Friday</span></footer></Card>
              <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><Target size={18} /></span><Badge tone="success">On track</Badge></div><h3>Netherlands buyer research</h3><p>12 new buyers qualified this week</p><div className="mini-stat"><strong>34</strong><span>qualified buyers</span></div><footer><div className="avatar-stack"><Avatar initials="AM" tone={1} /></div><span>Updated 2h ago</span></footer></Card>
              <button className="service-card"><Sparkles size={18} /><span><strong>Need something else?</strong><small>Request an Export HQ service</small></span><ArrowRight size={17} /></button>
            </aside>
          </div>

          <section className="module-section" id="products">
            <div className="section-head"><div><p>PRODUCT × MARKET</p><h2>Germany product readiness</h2></div><ButtonLink href="/onboarding" variant="secondary"><Plus size={15} /> Add product</ButtonLink></div>
            <div className="product-table" role="table" aria-label="Product readiness">
              <div className="table-head" role="row"><span>Product</span><span>HS code</span><span>Target market</span><span>Readiness</span><span>Status</span></div>
              {demoSnapshot.products.map((product) => <div className="table-row" role="row" key={product.id}><span><span className="product-thumb"><Package size={18} /></span><span><strong>{product.name}</strong><small>{product.sku} · {product.composition}</small></span></span><span>{product.hsCode}</span><span>🇩🇪 {product.market}</span><span><Progress value={product.readiness} label={`${product.name} readiness`} /><strong>{product.readiness}%</strong></span><span><Badge tone={product.status === "needs_work" ? "warning" : "info"}>{product.status.replaceAll("_", " ")}</Badge></span></div>)}
            </div>
          </section>

          <section className="module-section" id="requirements">
            <div className="section-head"><div><p>COMPLIANCE EVIDENCE</p><h2>Requirements needing attention</h2></div><a href="#requirements">Open requirement register <ArrowRight size={15} /></a></div>
            <div className="requirement-grid">{demoSnapshot.requirements.map((requirement) => <Card key={requirement.id} className="requirement-card"><div><Badge tone={requirement.status === "action_required" ? "danger" : "info"}>{requirement.status.replaceAll("_", " ")}</Badge><span>{requirement.category} · {requirement.jurisdiction}</span></div><h3>{requirement.title}</h3><p><FileText size={15} /> {requirement.evidence}</p><footer><a href={requirement.sourceUrl} target="_blank" rel="noreferrer">{requirement.sourceLabel}</a><span>Verified {requirement.lastVerifiedAt}</span></footer></Card>)}</div>
          </section>

          <div className="bottom-grid">
            <section className="module-section" id="documents"><div className="section-head"><div><p>DOCUMENT VAULT</p><h2>Recent documents</h2></div><ButtonLink href="/onboarding" variant="secondary">Upload document</ButtonLink></div><div className="document-list">{demoSnapshot.documents.map((document) => <div key={document.id}><span className="file-icon"><FileText size={17} /></span><span><strong>{document.name}</strong><small>{document.category} · {document.linkedTo}</small></span><Badge tone={document.status === "approved" ? "success" : document.status === "missing" ? "danger" : "info"}>{document.status.replaceAll("_", " ")}</Badge></div>)}</div></section>
            <section className="module-section" id="activity"><div className="section-head"><div><p>SHARED ACTIVITY</p><h2>Latest updates</h2></div></div><div className="activity-list">{demoSnapshot.activity.map((item, index) => <div key={item.id}><Avatar initials={item.actor.split(" ").map((part) => part[0]).join("").slice(0, 2)} tone={index} /><span><strong>{item.actor}</strong><p>{item.action}</p><small>{item.at}</small></span></div>)}</div></section>
          </div>

          <section className="team-banner" id="team"><div><div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div><span><p>YOUR ACCOUNTABLE TEAM</p><strong>Anna, Rahim and Lisa are here to move your Germany launch forward.</strong></span></div><ButtonLink href="#team">Message Export HQ <MessageSquareText size={16} /></ButtonLink></section>
        </div>
        <footer className="legal-footer"><span>Export HQ · Private workspace</span><span><ShieldCheck size={14} /> Evidence-aware compliance · Last data review 8 Aug 2026</span></footer>
      </main>
      <div className="demo-banner"><AlertTriangle size={15} /><span>Foundation preview · demo data, no production documents</span><button aria-label="Dismiss"><X size={14} /></button></div>
    </div>
  );
}
