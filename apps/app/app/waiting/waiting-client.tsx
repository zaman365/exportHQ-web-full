"use client";

import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Hourglass,
  Search,
  Undo2,
  UserRound,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ExportTask, Responsibility, TaskStatus } from "@exporthq/domain";
import { Badge, Progress } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import { blueprintRunsStorageKey, readStoredArray, type BlueprintRun } from "../_components/workflow-data";

type QueueId = "customer" | "export_hq" | "third_party" | "all";
type WaitingItem = ExportTask & { source?: "blueprint" | "manual"; totalSteps?: number; completedSteps?: number };

const resolvedStorageKey = "trevv.waiting.resolved.v1";
const snoozedStorageKey = "trevv.waiting.snoozed.v1";

const queueMeta: Record<Exclude<QueueId, "all">, { label: string; hint: string }> = {
  customer: { label: "Waiting for you", hint: "waiting-you" },
  export_hq: { label: "Export HQ", hint: "waiting-export-hq" },
  third_party: { label: "Third party", hint: "waiting-third-party" }
};

const statusTone: Record<TaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  todo: "neutral",
  waiting_customer: "danger",
  in_progress: "info",
  waiting_export_hq: "warning",
  waiting_third_party: "neutral",
  completed: "success",
  blocked: "danger"
};

function formatDue(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function responsibilityForRun(run: BlueprintRun): WaitingItem {
  return {
    id: run.id,
    organizationId: "org_abc_textiles",
    title: run.title,
    description: run.description,
    responsibility: run.responsibility,
    ownerName: run.ownerName,
    status: run.status,
    priority: "normal",
    dueAt: run.dueAt,
    relatedEntity: run.relatedEntity,
    source: run.blueprintId === "manual-handoff" ? "manual" : "blueprint",
    totalSteps: run.totalSteps,
    completedSteps: run.completedSteps
  };
}

export default function WaitingClient({ initialTasks, canManage }: { initialTasks: ExportTask[]; canManage: boolean }) {
  const [blueprintRuns, setBlueprintRuns] = useState<BlueprintRun[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<QueueId>("customer");
  const [query, setQuery] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const storedRuns = readStoredArray<BlueprintRun>(blueprintRunsStorageKey);
    setBlueprintRuns(storedRuns);
    setResolved(readStoredArray<string>(resolvedStorageKey));
    const requestedRecord = new URLSearchParams(window.location.search).get("record");
    if (requestedRecord && [...storedRuns.map(responsibilityForRun), ...initialTasks].some((item) => item.id === requestedRecord)) {
      setQueue("all");
      setSelectedId(requestedRecord);
    }
    const requestedOwner = new URLSearchParams(window.location.search).get("owner");
    if (requestedOwner) {
      setQueue("all");
      setQuery(requestedOwner);
    }
    try {
      const stored = localStorage.getItem(snoozedStorageKey);
      if (stored) setSnoozed(JSON.parse(stored) as Record<string, string>);
    } catch {
      localStorage.removeItem(snoozedStorageKey);
    }
  }, []);

  const items = useMemo<WaitingItem[]>(() => [...blueprintRuns.map(responsibilityForRun), ...initialTasks].map((item) => ({ ...item, dueAt: snoozed[item.id] ?? item.dueAt })), [blueprintRuns, initialTasks, snoozed]);
  const unresolvedItems = items.filter((item) => !resolved.includes(item.id) && item.status !== "completed");

  const counts = useMemo(() => ({
    customer: unresolvedItems.filter((item) => item.responsibility === "customer").length,
    export_hq: unresolvedItems.filter((item) => item.responsibility === "export_hq").length,
    third_party: unresolvedItems.filter((item) => item.responsibility === "third_party").length,
    all: unresolvedItems.length
  }), [unresolvedItems]);

  const visible = useMemo(() => items.filter((item) => {
    const isResolved = resolved.includes(item.id) || item.status === "completed";
    const matchesState = showResolved ? isResolved : !isResolved;
    const matchesQueue = queue === "all" || item.responsibility === queue;
    const haystack = `${item.title} ${item.description} ${item.ownerName} ${item.relatedEntity}`.toLowerCase();
    return matchesState && matchesQueue && haystack.includes(query.toLowerCase());
  }).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()), [items, resolved, showResolved, queue, query]);

  const selected = items.find((item) => item.id === selectedId);
  const overdue = unresolvedItems.filter((item) => new Date(item.dueAt).getTime() < Date.now()).length;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function resolveItem(item: WaitingItem) {
    const next = [...resolved, item.id];
    setResolved(next);
    localStorage.setItem(resolvedStorageKey, JSON.stringify(next));
    setSelectedId(null);
    notify("Item resolved. You can restore it from resolved items.");
  }

  function restoreItem(item: WaitingItem) {
    const next = resolved.filter((id) => id !== item.id);
    setResolved(next);
    localStorage.setItem(resolvedStorageKey, JSON.stringify(next));
    notify("Item restored to Waiting.");
  }

  function snoozeItem(item: WaitingItem) {
    const currentDue = new Date(item.dueAt);
    const due = currentDue.getTime() > Date.now() ? currentDue : new Date();
    due.setDate(due.getDate() + 7);
    const next = { ...snoozed, [item.id]: due.toISOString() };
    setSnoozed(next);
    localStorage.setItem(snoozedStorageKey, JSON.stringify(next));
    notify(`Follow-up moved to ${formatDue(due.toISOString())}.`);
  }

  return <>
    <section className="workspace-page-head waiting-head"><div><p>TREVV / WAITING</p><h1>Make every handoff visible. <HintButton topic="waiting-overview" /></h1><span>See who can move work now, what is expected next, and which handoffs need a follow-up.</span></div><button type="button" className={`button button--secondary${showResolved ? " active" : ""}`} onClick={() => setShowResolved((current) => !current)}>{showResolved ? <Hourglass size={16} /> : <CheckCircle2 size={16} />}{showResolved ? "Show open items" : `Resolved (${resolved.length})`}</button></section>

    <section className="waiting-summary" aria-label="Waiting summary"><div className="urgent"><Clock3 size={18} /><span><strong>{overdue}</strong><small>overdue follow-ups</small></span></div><div><UserRound size={18} /><span><strong>{counts.customer}</strong><small>waiting for you</small></span></div><div><Users size={18} /><span><strong>{counts.export_hq}</strong><small>owned by Export HQ</small></span></div><div><CalendarClock size={18} /><span><strong>{counts.third_party}</strong><small>external dependencies</small></span></div></section>

    <div className="waiting-toolbar"><div className="waiting-tabs" role="tablist" aria-label="Waiting ownership">{(["customer", "export_hq", "third_party"] as const).map((id) => <button type="button" role="tab" aria-selected={queue === id} className={queue === id ? "active" : ""} key={id} onClick={() => setQueue(id)}><span>{queueMeta[id].label}</span><b>{counts[id]}</b></button>)}<button type="button" role="tab" aria-selected={queue === "all"} className={queue === "all" ? "active" : ""} onClick={() => setQueue("all")}><span>All</span><b>{counts.all}</b></button></div><label><Search size={16} /><input aria-label="Search waiting items" placeholder="Search Waiting…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>

    <div className={`waiting-layout${selected ? " has-detail" : ""}`}><section className="waiting-list" aria-live="polite"><header><span><p>{showResolved ? "RESOLVED" : "CURRENT QUEUE"}</p><h2>{queue === "all" ? "All ownership" : queueMeta[queue].label} {queue !== "all" && <HintButton topic={queueMeta[queue].hint} />}</h2></span><small>{visible.length} {visible.length === 1 ? "item" : "items"}</small></header>{visible.length === 0 && <div className="waiting-empty"><CheckCircle2 size={25} /><strong>{showResolved ? "No resolved items in this view." : "Nothing is waiting in this queue."}</strong><span>{query ? "Clear the search to see more." : "New handoffs will appear here automatically."}</span></div>}{visible.map((item) => {
      const isResolved = resolved.includes(item.id) || item.status === "completed";
      const isOverdue = !isResolved && new Date(item.dueAt).getTime() < Date.now();
      return <article className={`waiting-row${selectedId === item.id ? " active" : ""}`} key={item.id}><button type="button" className={`waiting-check${isResolved ? " complete" : ""}`} aria-label={isResolved ? `Restore ${item.title}` : `Resolve ${item.title}`} onClick={() => isResolved ? restoreItem(item) : resolveItem(item)} disabled={!canManage}>{isResolved ? <Undo2 size={14} /> : <Check size={14} />}</button><span className="waiting-copy"><span><strong>{item.title}</strong><Badge tone={statusTone[item.status]}>{isResolved ? "resolved" : item.status.replaceAll("_", " ")}</Badge>{item.source === "blueprint" && <em>Blueprint run</em>}</span><p>{item.description}</p><footer><span className={isOverdue ? "overdue" : ""}><Clock3 size={13} />{isOverdue ? "Overdue · " : "Due "}{formatDue(item.dueAt)}</span><span>Owner · {item.ownerName}</span><span>{item.relatedEntity}</span></footer>{item.totalSteps && <span className="waiting-progress"><Progress value={Math.round(((item.completedSteps ?? 0) / item.totalSteps) * 100)} label={`${item.title} progress`} /><small>{item.completedSteps ?? 0} of {item.totalSteps} steps</small></span>}</span><span className="waiting-row__actions">{!isResolved && <button type="button" onClick={() => snoozeItem(item)} disabled={!canManage}>Snooze 7d</button>}<button type="button" onClick={() => setSelectedId(item.id)}>Details <ArrowRight size={13} /></button></span></article>;
    })}</section>{selected && <aside className="waiting-detail"><header><span><p>NEXT HANDOFF</p><h2>{selected.title}</h2></span><button type="button" aria-label="Close waiting item details" onClick={() => setSelectedId(null)}><X size={17} /></button></header><Badge tone={statusTone[selected.status]}>{selected.status.replaceAll("_", " ")}</Badge><p>{selected.description}</p><dl><div><dt>Accountable owner</dt><dd>{selected.ownerName}</dd></div><div><dt>Due checkpoint</dt><dd>{formatDue(selected.dueAt)}</dd></div><div><dt>Related record</dt><dd>{selected.relatedEntity}</dd></div><div><dt>Ownership queue</dt><dd>{queueMeta[selected.responsibility as Exclude<Responsibility, never>]?.label ?? selected.responsibility}</dd></div></dl><div className="waiting-next-step"><strong>What moves this forward?</strong><p>{selected.source === "blueprint" ? "Confirm the target and accountable owner, then complete the first Blueprint step." : "Provide the requested decision or evidence, then resolve the handoff so downstream work can continue."}</p></div><footer>{resolved.includes(selected.id) ? <button type="button" className="button button--secondary" onClick={() => restoreItem(selected)}><Undo2 size={15} /> Restore item</button> : <><button type="button" className="button button--secondary" onClick={() => snoozeItem(selected)}><CalendarClock size={15} /> Snooze 7 days</button><button type="button" className="button button--primary" onClick={() => resolveItem(selected)}><Check size={15} /> Mark resolved</button></>}</footer></aside>}</div>
    {toast && <div className="settings-toast" role="status"><CheckCircle2 size={16} />{toast}</div>}
  </>;
}
