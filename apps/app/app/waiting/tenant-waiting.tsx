import type { WorkspaceDashboardTask, WorkspaceTaskStatus } from "@exporthq/db";
import { Badge, Card } from "@exporthq/ui";
import { ArrowRight, Clock3, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { transitionTenantTaskAction } from "./actions";

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

export function TenantWaiting({ tasks, canManage }: { tasks: readonly WorkspaceDashboardTask[]; canManage: boolean }) {
  return <>
    <section className="workspace-page-head waiting-head"><div><p>ExportPanel / WAITING</p><h1>Owned tenant work</h1><span>Every item below comes from the organization database. Status changes are authorized, version-checked, audited and written with an outbox event.</span></div></section>
    <section className="waiting-list"><header><span><p>CURRENT QUEUE</p><h2>Open actions</h2></span><small>{tasks.length} {tasks.length === 1 ? "item" : "items"}</small></header>
      {!tasks.length && <div className="waiting-empty"><strong>Nothing is waiting.</strong><span>Readiness responses and review workflows create owned tasks here.</span></div>}
      {tasks.map((task) => <article className="waiting-row" key={task.id}><span className="waiting-copy"><span><strong>{task.title}</strong><Badge tone={statusTone[task.status]}>{task.status.replaceAll("_", " ")}</Badge></span><p>{task.description}</p><footer><span><Clock3 size={13} />{task.dueAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(task.dueAt)) : "No deadline"}</span><span>Owner · {task.ownerLabel}</span><span>{task.responsibility.replaceAll("_", " ")}</span></footer></span><span className="waiting-row__actions">{canManage && task.responsibility === "customer" && task.status !== "completed" && task.status !== "cancelled" ? <form action={transitionTenantTaskAction}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="expectedVersion" value={task.version} /><input type="hidden" name="status" value={task.status === "in_progress" || task.status === "waiting_customer" ? "completed" : "in_progress"} /><input name="rationale" required minLength={3} maxLength={500} aria-label={`Rationale for ${task.title}`} placeholder="Reason for this change" /><button type="submit">{task.status === "in_progress" || task.status === "waiting_customer" ? "Complete" : "Start"}</button></form> : <small>View only</small>}{task.exportLaneId && <Link href={`/studio?lane=${task.exportLaneId}`}>Lane <ArrowRight size={13} /></Link>}</span></article>)}
    </section>
  </>;
}

export function TenantWaitingUnavailable() {
  return <Card className="managed-card"><div className="managed-card__head"><span className="icon-box"><ShieldAlert size={18} /></span><Badge tone="warning">Fail closed</Badge></div><h1>Protected task storage is unavailable</h1><p>No fixture or browser-local queue has been substituted for tenant work.</p><footer><Link href="/preview">Open labelled public preview <ArrowRight size={14} /></Link></footer></Card>;
}
