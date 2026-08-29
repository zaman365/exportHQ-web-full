import { authorizeOrganization } from "@exporthq/authorization";
import { demoSnapshot } from "@exporthq/domain";
import { AlertTriangle, ArrowRight, Bell, Building2, CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck, FileSearch, LayoutDashboard, ListTodo, Menu, MessageSquare, Search, ShieldAlert, Users } from "lucide-react";
import { Avatar, Badge, Logo, Progress } from "@exporthq/ui";
import { auditOpsCaseAccess, getOpsAccessContext } from "./_lib/session";

const customers = [
  { name: "ABC Textiles", country: "Bangladesh", health: 82, state: "Healthy", tone: "success" as const, note: "Germany entry" },
  { name: "Delta Foods", country: "Bangladesh", health: 68, state: "Attention", tone: "warning" as const, note: "8 open tasks" },
  { name: "Sundar Leather", country: "India", health: 74, state: "Healthy", tone: "success" as const, note: "EU readiness" },
  { name: "Bay Jute Works", country: "Bangladesh", health: 57, state: "At risk", tone: "danger" as const, note: "Overdue evidence" }
];

export const dynamic = "force-dynamic";

async function ProductionOpsPage({ staff }: { staff: Awaited<ReturnType<typeof getOpsAccessContext>>["principal"] }) {
  const visibleGrants = staff.grants.flatMap((grant) => {
    const permission = [...grant.permissions].find((candidate) => candidate.endsWith(":view"));
    return permission ? [{ grant, permission }] : [];
  });
  await Promise.all(visibleGrants.map(({ grant, permission }) => auditOpsCaseAccess(staff, grant, permission)));

  return <div className="ops-shell">
    <aside className="ops-nav">
      <div className="ops-logo"><Logo /><Badge tone="info">OPS</Badge></div>
      <nav><a className="active" href="#cases"><LayoutDashboard size={17} />Active cases</a><a href="#access"><ShieldAlert size={17} />Access scope</a></nav>
      <div className="operator"><Avatar initials="OP" tone={1} /><span><strong>Authenticated operator</strong><small>Least-privileged workspace</small></span></div>
    </aside>
    <main>
      <header className="ops-topbar"><span>Export HQ Operations</span><div><ShieldAlert size={18} /><span>Every case view is grant-scoped and audited</span></div></header>
      <div className="ops-content" id="cases">
        <section className="ops-heading"><div><p>PRODUCTION ACCESS</p><h1>Assigned customer cases</h1><span>Only active, time-bounded grants appear here. Platform administration does not bypass a customer boundary.</span></div></section>
        <section className="ops-metrics"><div><span>ACTIVE CASE GRANTS</span><strong>{visibleGrants.length}</strong><small>Expired and revoked grants are excluded</small></div><div><span>BREAK-GLASS</span><strong>{visibleGrants.filter(({ grant }) => grant.breakGlass).length}</strong><small>Requires second approval and alert evidence</small></div></section>
        <section className="customer-workspace" id="access">
          <header><div><span><p>CASE ACCESS</p><h2>{visibleGrants.length ? "Authorized scopes" : "No active customer access"}</h2><small>{visibleGrants.length ? "Customer details load only inside the selected case transaction." : "Ask the operations owner for a reasoned, approved and expiring grant."}</small></span></div></header>
          {visibleGrants.length > 0 && <div className="workspace-bottom"><section><div className="ops-section-head"><div><p>ACTIVE GRANTS</p><h2>Case references</h2></div></div>{visibleGrants.map(({ grant, permission }) => <article className="ops-task" key={grant.grantId ?? `${grant.organizationId}:${permission}`}><span className="task-circle"><ShieldAlert size={15} /></span><div><strong>{grant.caseReference ?? "Scoped customer case"}</strong><p>{grant.reason ?? "Approved operations access"}</p><small>{permission} · expires {grant.expiresAt.toISOString()}</small></div>{grant.breakGlass && <Badge tone="danger">Break glass</Badge>}</article>)}</section></div>}
        </section>
      </div>
    </main>
  </div>;
}

export default async function OpsPage() {
  const access = await getOpsAccessContext();
  const staff = access.principal;
  if (!access.illustrative) return <ProductionOpsPage staff={staff} />;
  authorizeOrganization(staff, demoSnapshot.organization.id, "compliance:view");

  return <div className="ops-shell">
    <aside className="ops-nav">
      <div className="ops-logo"><Logo /><Badge tone="info">OPS</Badge></div>
      <nav><a className="active" href="#overview"><LayoutDashboard size={17} />Overview</a><a href="#customers"><Building2 size={17} />Customers</a><a href="#work"><ListTodo size={17} />My work <b>12</b></a><a href="#reviews"><ClipboardCheck size={17} />Reviews <b>6</b></a><a href="#risk"><ShieldAlert size={17} />Compliance risk</a><a href="#team"><Users size={17} />Team capacity</a></nav>
      <div className="operator"><Avatar initials="AM" tone={1} /><span><strong>Anna Müller</strong><small>EU Market Manager</small></span><ChevronDown size={14} /></div>
    </aside>
    <main>
      <header className="ops-topbar"><button className="ops-menu" aria-label="Open menu"><Menu size={18} /></button><button className="ops-search"><Search size={16} /><span>Search customers, tasks, documents…</span><kbd>⌘ K</kbd></button><div><button aria-label="Notifications"><Bell size={18} /><i /></button><span>Operator workspace</span></div></header>
      <div className="ops-content" id="overview">
        <section className="ops-heading"><div><p>OPERATIONS · THURSDAY, 13 AUGUST</p><h1>Good morning, Anna.</h1><span>Three customers need your attention today.</span></div><button className="primary">Create staff task</button></section>
        <section className="ops-metrics"><div><span>MY CUSTOMERS</span><strong>18</strong><small>2 onboarding this week</small></div><div><span>TASKS DUE TODAY</span><strong>12</strong><small className="warn">3 already overdue</small></div><div><span>OPEN REVIEWS</span><strong>6</strong><small>4 compliance · 2 documents</small></div><div><span>CLIENT HEALTH</span><strong>78</strong><small className="good">+3 this month</small></div><div><span>OPEN SERVICES</span><strong>9</strong><small>€18.4k approved value</small></div></section>

        <div className="ops-grid">
          <section id="customers"><div className="ops-section-head"><div><p>ACCOUNT PORTFOLIO</p><h2>My customers</h2></div><a href="#customers">All customers <ArrowRight size={14} /></a></div><div className="customer-list"><div className="customer-head"><span>Customer</span><span>Health</span><span>Status</span><span>Focus</span><span /></div>{customers.map((customer, index) => <div className={index === 0 ? "selected" : ""} key={customer.name}><span><span className="company-mark">{customer.name.split(" ").map((part) => part[0]).join("")}</span><span><strong>{customer.name}</strong><small>{customer.country}</small></span></span><span><Progress value={customer.health} label={`${customer.name} health`} /><b>{customer.health}</b></span><span><Badge tone={customer.tone}>{customer.state}</Badge></span><span>{customer.note}</span><button aria-label={`Open ${customer.name}`}><ArrowRight size={15} /></button></div>)}</div></section>
          <aside id="risk"><div className="ops-section-head"><div><p>NEEDS ATTENTION</p><h2>Risk queue</h2></div></div><div className="risk-list"><article><span className="risk-icon danger"><AlertTriangle size={17} /></span><div><Badge tone="danger">Overdue</Badge><h3>Delta Foods · test evidence</h3><p>Due 2 days ago · customer owned</p></div></article><article><span className="risk-icon warning"><CalendarClock size={17} /></span><div><Badge tone="warning">Expires soon</Badge><h3>ABC Textiles · REACH evidence</h3><p>28 days remaining · Lisa owns</p></div></article><article><span className="risk-icon info"><FileSearch size={17} /></span><div><Badge tone="info">Review</Badge><h3>Bay Jute · origin declaration</h3><p>Uploaded today · unassigned</p></div></article></div><button className="queue-button">Open full risk queue <ArrowRight size={14} /></button></aside>
        </div>

        <section className="customer-workspace" id="work">
          <header><div><span className="company-mark large">AT</span><span><p>CUSTOMER WORKSPACE</p><h2>{demoSnapshot.organization.legalName}</h2><small>Bangladesh · Apparel manufacturing · Managed Export</small></span></div><div><Badge tone="success">Health {demoSnapshot.health.overall}</Badge><button>Open full workspace <ArrowRight size={14} /></button></div></header>
          <div className="workspace-grid"><div><span>ONBOARDING</span><strong>{demoSnapshot.organization.onboardingPercent}%</strong><Progress value={demoSnapshot.organization.onboardingPercent} label="Onboarding" /><small>Facility profile incomplete</small></div><div><span>GERMANY READINESS</span><strong>74%</strong><Progress value={74} label="Germany readiness" /><small>3 requirements need work</small></div><div><span>WAITING FOR CLIENT</span><strong>1</strong><small>OEKO-TEX upload · due 15 Aug</small></div><div><span>EXPORT HQ OWNED</span><strong>2</strong><small>Packaging + labelling review</small></div></div>
          <div className="workspace-bottom" id="reviews"><section><div className="ops-section-head"><div><p>NEXT BEST ACTIONS</p><h2>Shared action plan</h2></div></div>{demoSnapshot.tasks.slice(0, 3).map((task) => <article className="ops-task" key={task.id}><span className="task-circle"><CheckCircle2 size={15} /></span><div><strong>{task.title}</strong><p>{task.description}</p><small>{task.ownerName} · due {task.dueAt}</small></div><Badge tone={task.responsibility === "customer" ? "danger" : "info"}>{task.responsibility.replace("_", " ")}</Badge></article>)}</section><aside><div className="ops-section-head"><div><p>ACCOUNT CONTEXT</p><h2>Team & access</h2></div></div><div className="account-team">{demoSnapshot.team.map((member, index) => <div key={member.name}><Avatar initials={member.initials} tone={index} /><span><strong>{member.name}</strong><small>{member.role}</small></span>{index === 0 && <Badge tone="success">Account lead</Badge>}</div>)}</div><div className="access-note"><ShieldAlert size={16} /><span><strong>Scoped operator access</strong><small>Your access to this customer is explicitly granted and audited.</small></span></div><button className="message-button"><MessageSquare size={15} />Message customer</button></aside></div>
        </section>
      </div>
    </main>
  </div>;
}
