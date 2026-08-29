import type { TenantExportLaneReadModel, WorkspaceTaskStatus } from "@exporthq/db";
import { Badge, Card } from "@exporthq/ui";
import { ArrowRight, Clock3, ExternalLink, FileCheck2, Route, ShieldAlert, Target } from "lucide-react";
import Link from "next/link";

const statusTone: Record<WorkspaceTaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  todo: "neutral",
  in_progress: "info",
  waiting_customer: "danger",
  waiting_export_hq: "warning",
  waiting_third_party: "neutral",
  completed: "success",
  cancelled: "neutral",
  blocked: "danger"
};

export function TenantExportStudio({ lane }: { lane: TenantExportLaneReadModel }) {
  return <div className="studio-page">
    <section className="studio-hero">
      <div className="studio-hero__copy"><p>TRADE / EXPORT STUDIO</p><div><h1>{lane.productName} → {lane.destinationCountryCode}</h1></div><span>Authoritative tenant lane summary. Later commercial, buyer, shipment and proceeds modules stay unavailable until their repositories exist.</span><footer><b>{lane.health.replaceAll("_", " ")}</b><small>{lane.sku || "No internal reference"} · HS {lane.hsCode ?? "needs review"} · version {lane.version}</small></footer></div>
      <div className="studio-hero__progress"><Target size={25} /><span><small>READINESS</small><strong>{lane.readinessScore ?? 0}%</strong><p>{lane.readinessScore === null ? "Assessment not started" : "Latest lane assessment"}</p></span></div>
    </section>

    <section className="studio-metrics" aria-label="Export Lane summary">
      <Card><small>STAGE</small><strong>{lane.stage.replaceAll("_", " ")}</strong><p>{lane.status.replaceAll("_", " ")}</p></Card>
      <Card><small>ROUTE</small><strong>{lane.incoterm}</strong><p>{lane.route}</p></Card>
      <Card><small>TARGET MARGIN</small><strong>{(lane.targetMarginBps / 100).toFixed(2)}%</strong><p>{lane.currency} commercial basis</p></Card>
      <Card><small>SALES PATH</small><strong>{lane.salesChannel}</strong><p>{lane.buyerSegment}</p></Card>
    </section>

    <section className="studio-panel">
      <header><div><p>ACTION PLAN</p><h2>Lane-scoped work</h2><span>These tasks come from tenant PostgreSQL, including readiness-derived ownership and deadlines.</span></div><Link href={`/readiness?lane=${lane.id}`}>Open readiness <ArrowRight size={14} /></Link></header>
      <div className="task-list">{lane.tasks.length ? lane.tasks.map((task) => <article className="task" key={task.id}><span className="task-check" /><div><div className="task__title"><strong>{task.title}</strong><Badge tone={statusTone[task.status]}>{task.status.replaceAll("_", " ")}</Badge></div><p>{task.description}</p><footer><span><Clock3 size={14} /> {task.dueAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(task.dueAt)) : "No deadline"}</span><span>{task.ownerLabel}</span></footer></div></article>) : <p>No task has been derived for this lane yet.</p>}</div>
    </section>

    <section className="studio-panel studio-policy">
      <header><div><p>REGULATORY IMPACTS</p><h2>Reviewed rules affecting this lane</h2><span>Only active, human-reviewed, in-review-window source records are projected.</span></div><FileCheck2 size={21} /></header>
      <div className="studio-policy__grid">{lane.regulatoryImpacts.length ? lane.regulatoryImpacts.map((impact) => <article className={`is-${impact.state}`} key={impact.id}><header><span><Route size={15} /></span><b>{impact.state}</b></header><h3>{impact.title}</h3><p>{impact.summary}</p><footer><span>{impact.publisher} · reviewed {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(impact.reviewedAt))}</span><a href={impact.canonicalUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${impact.title}`}><ExternalLink size={14} /></a></footer></article>) : <p>No reviewed regulatory impact is currently projected for this lane.</p>}</div>
    </section>

    <footer className="studio-method"><span><ShieldAlert size={14} /> Buyer, provider, shipment and proceeds projections are not shown as tenant records until their later-phase repositories pass activation.</span></footer>
  </div>;
}

export function TenantExportStudioEmpty({ persistenceAvailable }: { persistenceAvailable: boolean }) {
  return <div className="studio-page"><section className="studio-hero"><div className="studio-hero__copy"><p>TRADE / EXPORT STUDIO</p><h1>{persistenceAvailable ? "Create your first Export Lane" : "Protected lane storage is unavailable"}</h1><span>{persistenceAvailable ? "Add a product and lane before readiness can attach an action plan." : "No illustrative lane has been substituted. The page remains fail closed until tenant PostgreSQL is activated."}</span><footer><Link href={persistenceAvailable ? "/settings?section=organization#primary-offer" : "/preview"}>{persistenceAvailable ? "Open business profile" : "Open labelled public preview"} <ArrowRight size={14} /></Link></footer></div></section></div>;
}
