"use client";

import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Clock3,
  Eye,
  Filter,
  Flame,
  Focus,
  Inbox,
  ListChecks,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TaskStatus } from "@exporthq/domain";
import { Progress } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import {
  decisionsStorageKey,
  decisionSeeds,
  loadCollection,
  storeCollection,
  type DecisionRecord,
} from "../_components/collaboration-data";
import {
  groupWorkItems,
  myWorkFocusStorageKey,
  myWorkStorageKey,
  recommendFocus,
  workSeeds,
  workStatusLabels,
  type WorkGroupId,
  type WorkItem,
  type WorkStatus,
  type WorkView,
} from "../_components/my-work-data";
import {
  blueprintRunsStorageKey,
  type BlueprintRun,
} from "../_components/workflow-data";

type SavedView = "all" | "risk" | "quick" | "review";
type FocusSession = { itemId: string; endsAt: number };

const viewLabels: Record<WorkView, string> = {
  assigned: "Assigned to me",
  following: "Following",
  created: "Created by me",
};
const savedViews: ReadonlyArray<{
  id: SavedView;
  label: string;
  icon: typeof Flame;
  description: string;
}> = [
  {
    id: "all",
    label: "Everything",
    icon: ListChecks,
    description: "All open work in this view",
  },
  {
    id: "risk",
    label: "High risk",
    icon: Flame,
    description: "Urgent, high, or blocked",
  },
  {
    id: "quick",
    label: "Quick wins",
    icon: Zap,
    description: "Twenty minutes or less",
  },
  {
    id: "review",
    label: "Needs review",
    icon: BadgeCheck,
    description: "Approval and review work",
  },
];

function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function dueLabel(value: string): string {
  const due = new Date(value);
  const today = new Date();
  const dueDay = due.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  const todayDay = today.toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
  if (dueDay === todayDay)
    return `Today · ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(due)}`;
  return formatDate(value);
}

function countdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function mapRunStatus(status: TaskStatus): WorkStatus {
  if (status === "completed") return "done";
  if (
    status === "blocked" ||
    status === "waiting_export_hq" ||
    status === "waiting_third_party"
  )
    return "blocked";
  if (status === "in_progress") return "working";
  return "todo";
}

function mapWorkStatus(status: WorkStatus): TaskStatus {
  if (status === "done") return "completed";
  if (status === "blocked") return "blocked";
  if (status === "working" || status === "review") return "in_progress";
  return "waiting_customer";
}

function workFromRun(run: BlueprintRun): WorkItem | null {
  if (run.responsibility !== "customer" && run.ownerName !== "Nadia Rahman")
    return null;
  const status = mapRunStatus(run.status);
  return {
    id: `work-run-${run.id}`,
    title: run.title,
    description: run.description,
    status,
    priority: status === "blocked" ? "high" : "normal",
    dueAt: run.dueAt,
    owner: run.ownerName,
    workstream:
      run.blueprintId === "manual-handoff" ? "Inbox capture" : "Blueprint run",
    relatedEntity: run.relatedEntity,
    createdBy:
      run.blueprintId === "manual-handoff" ? "Nadia Rahman" : "TREVV Blueprint",
    followers: [],
    views:
      run.ownerName === "Nadia Rahman" ? ["assigned", "created"] : ["assigned"],
    estimatedMinutes: 30,
    nextStep: run.description,
    source: run.blueprintId === "manual-handoff" ? "waiting" : "blueprint",
    href: `/waiting?record=${run.id}`,
    sourceRecordId: run.id,
    ...(status === "blocked"
      ? {
          blockedBy:
            run.responsibility === "third_party"
              ? "External response"
              : "Another owner or prerequisite",
        }
      : {}),
    ...(status === "done" ? { completedAt: run.createdAt } : {}),
  };
}

function workFromDecision(decision: DecisionRecord): WorkItem | null {
  if (decision.status === "approved" || decision.status === "superseded")
    return null;
  const owns = decision.owner === "Nadia Rahman";
  const reviews = decision.reviewers.includes("Nadia Rahman");
  if (!owns && !reviews) return null;
  return {
    id: `work-decision-${decision.id}`,
    title: decision.title,
    description: decision.summary,
    status: decision.status === "in_review" ? "review" : "todo",
    priority: decision.status === "in_review" ? "high" : "normal",
    dueAt: decision.reviewDue,
    owner: decision.owner,
    workstream: `${decision.category} decision`,
    relatedEntity: decision.relatedEntity,
    createdBy: decision.owner,
    followers: decision.reviewers,
    views: owns ? ["assigned", "created"] : ["assigned", "following"],
    estimatedMinutes: 25,
    nextStep:
      decision.status === "in_review"
        ? "Compare the options, verify the linked evidence, and record your review in the Decision."
        : "Complete the options and evidence so this Decision can enter review.",
    source: "decision",
    href: `/decisions?record=${decision.id}`,
    sourceRecordId: decision.id,
  };
}

function mergeSourceWork(
  base: WorkItem[],
  runs: BlueprintRun[],
  decisions: DecisionRecord[],
): WorkItem[] {
  const merged = new Map(base.map((item) => [item.id, item]));
  for (const item of [
    ...runs.map(workFromRun),
    ...decisions.map(workFromDecision),
  ]) {
    if (item && !merged.has(item.id)) merged.set(item.id, item);
  }
  return [...merged.values()];
}

export default function MyWorkClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<WorkItem[]>([...workSeeds]);
  const [view, setView] = useState<WorkView>("assigned");
  const [savedView, setSavedView] = useState<SavedView>("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<WorkStatus | "all">("all");
  const [workstream, setWorkstream] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<WorkGroupId[]>([
    "later",
    "completed",
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [toast, setToast] = useState("");
  const [undoItem, setUndoItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    const base = loadCollection(myWorkStorageKey, workSeeds).filter(
      (item) => item.source === "personal",
    );
    const runs = loadCollection<BlueprintRun>(blueprintRunsStorageKey, []);
    const decisions = loadCollection(decisionsStorageKey, decisionSeeds);
    const merged = mergeSourceWork(base, runs, decisions);
    setItems(merged);
    setFocusIds(loadCollection<string>(myWorkFocusStorageKey, []));
    const requested = new URLSearchParams(window.location.search).get("record");
    if (requested && merged.some((item) => item.id === requested))
      setSelectedId(requested);
  }, []);

  useEffect(() => {
    if (!focusSession) return;
    const update = () => {
      const next = Math.max(
        0,
        Math.ceil((focusSession.endsAt - Date.now()) / 1000),
      );
      setRemainingSeconds(next);
      if (next === 0) {
        setFocusSession(null);
        setToast(
          "Focus sprint complete. Record what moved before starting another.",
        );
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [focusSession]);

  const workstreams = useMemo(
    () => [...new Set(items.map((item) => item.workstream))].sort(),
    [items],
  );
  const counts = useMemo(
    () => ({
      assigned: items.filter(
        (item) => item.views.includes("assigned") && item.status !== "done",
      ).length,
      following: items.filter(
        (item) => item.views.includes("following") && item.status !== "done",
      ).length,
      created: items.filter(
        (item) => item.views.includes("created") && item.status !== "done",
      ).length,
    }),
    [items],
  );

  const viewItems = useMemo(
    () =>
      items
        .filter((item) => {
          const matchesView = item.views.includes(view);
          const matchesState = showDone || item.status !== "done";
          const matchesStatus = status === "all" || item.status === status;
          const matchesWorkstream =
            workstream === "all" || item.workstream === workstream;
          const matchesSearch =
            `${item.title} ${item.description} ${item.workstream} ${item.relatedEntity} ${item.createdBy}`
              .toLowerCase()
              .includes(query.toLowerCase());
          const matchesSaved =
            savedView === "all" ||
            (savedView === "risk" &&
              (item.priority !== "normal" || item.status === "blocked")) ||
            (savedView === "quick" &&
              item.estimatedMinutes <= 20 &&
              item.status !== "blocked") ||
            (savedView === "review" && item.status === "review");
          return (
            matchesView &&
            matchesState &&
            matchesStatus &&
            matchesWorkstream &&
            matchesSearch &&
            matchesSaved
          );
        })
        .sort(
          (a, b) =>
            Number(focusIds.includes(b.id)) - Number(focusIds.includes(a.id)),
        ),
    [items, view, showDone, status, workstream, query, savedView, focusIds],
  );

  const groups = useMemo(
    () =>
      groupWorkItems(viewItems).filter(
        (group) =>
          (showDone || group.id !== "completed") && group.items.length > 0,
      ),
    [viewItems, showDone],
  );
  const selected = items.find((item) => item.id === selectedId);
  const activeFocus = focusSession
    ? items.find((item) => item.id === focusSession.itemId)
    : undefined;
  const assignedOpen = items.filter(
    (item) => item.views.includes("assigned") && item.status !== "done",
  );
  const overdueCount =
    groupWorkItems(assignedOpen).find((group) => group.id === "overdue")?.items
      .length ?? 0;
  const todayCount =
    groupWorkItems(assignedOpen).find((group) => group.id === "today")?.items
      .length ?? 0;
  const reviewCount = assignedOpen.filter(
    (item) => item.status === "review",
  ).length;
  const focusItems = focusIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is WorkItem =>
      Boolean(item && item.status !== "done"),
    );
  const focusMinutes = focusItems.reduce(
    (total, item) => total + item.estimatedMinutes,
    0,
  );

  function notify(message: string, undo?: WorkItem) {
    setToast(message);
    setUndoItem(undo ?? null);
    window.setTimeout(() => {
      setToast("");
      setUndoItem(null);
    }, 4500);
  }

  function save(next: WorkItem[]) {
    setItems(next);
    storeCollection(
      myWorkStorageKey,
      next.filter((item) => item.source === "personal"),
    );
  }

  function syncWaiting(item: WorkItem, nextStatus: WorkStatus) {
    if (
      (item.source !== "waiting" && item.source !== "blueprint") ||
      !item.sourceRecordId
    )
      return;
    const runs = loadCollection<BlueprintRun>(blueprintRunsStorageKey, []);
    storeCollection(
      blueprintRunsStorageKey,
      runs.map((run) =>
        run.id === item.sourceRecordId
          ? {
              ...run,
              status: mapWorkStatus(nextStatus),
              completedSteps:
                nextStatus === "done" ? run.totalSteps : run.completedSteps,
            }
          : run,
      ),
    );
  }

  function updateStatus(item: WorkItem, nextStatus: WorkStatus) {
    if (item.source === "decision") return;
    const nextItem = { ...item, status: nextStatus };
    if (nextStatus === "done") nextItem.completedAt = new Date().toISOString();
    else delete nextItem.completedAt;
    save(items.map((record) => (record.id === item.id ? nextItem : record)));
    syncWaiting(item, nextStatus);
    if (nextStatus === "done") {
      setFocusIds((current) => {
        const next = current.filter((id) => id !== item.id);
        storeCollection(myWorkFocusStorageKey, next);
        return next;
      });
      if (focusSession?.itemId === item.id) setFocusSession(null);
      if (selectedId === item.id) setSelectedId(null);
      notify("Work completed and removed from your active plan.", item);
    } else notify(`Status changed to ${workStatusLabels[nextStatus]}.`);
  }

  function undoCompletion() {
    if (!undoItem) return;
    save(items.map((item) => (item.id === undoItem.id ? undoItem : item)));
    syncWaiting(undoItem, undoItem.status);
    setToast("Completion undone.");
    setUndoItem(null);
  }

  function planDay() {
    const plan = recommendFocus(
      items.filter((item) => item.views.includes("assigned")),
    );
    const ids = plan.map((item) => item.id);
    setFocusIds(ids);
    storeCollection(myWorkFocusStorageKey, ids);
    setView("assigned");
    setSavedView("all");
    notify(
      `Day planned: ${plan.length} focused outcomes across ${plan.reduce((total, item) => total + item.estimatedMinutes, 0)} minutes.`,
    );
  }

  function toggleFocusItem(item: WorkItem) {
    const next = focusIds.includes(item.id)
      ? focusIds.filter((id) => id !== item.id)
      : [...focusIds, item.id].slice(-4);
    setFocusIds(next);
    storeCollection(myWorkFocusStorageKey, next);
    notify(
      next.includes(item.id)
        ? "Added to today's focus plan."
        : "Removed from today's focus plan.",
    );
  }

  function startFocus(item: WorkItem) {
    if (item.status === "todo") updateStatus(item, "working");
    setFocusSession({ itemId: item.id, endsAt: Date.now() + 25 * 60 * 1000 });
    setRemainingSeconds(25 * 60);
    notify("25-minute focus sprint started. Notifications can wait.");
  }

  function toggleGroup(id: WorkGroupId) {
    setCollapsed((current) =>
      current.includes(id)
        ? current.filter((group) => group !== id)
        : [...current, id],
    );
  }

  return (
    <>
      <section className="workspace-page-head my-work-head">
        <div>
          <p>TREVV / MY WORK</p>
          <h1>
            Make progress before the day gets noisy.{" "}
            <HintButton topic="my-work-overview" />
          </h1>
          <span>
            Your owned and followed work, ordered by time, risk, and the next
            move that actually changes something.
          </span>
        </div>
        <div className="my-work-head__actions">
          <Link href="/inbox" className="button button--secondary">
            <Inbox size={15} /> Capture first
          </Link>
          <button
            type="button"
            className="button button--primary"
            onClick={planDay}
            disabled={!canManage}
          >
            <WandSparkles size={15} /> Plan my day
          </button>
        </div>
      </section>

      {activeFocus && (
        <section className="focus-session" role="status">
          <span className="focus-session__pulse">
            <Focus size={17} />
          </span>
          <span>
            <small>FOCUS SPRINT</small>
            <strong>{activeFocus.title}</strong>
          </span>
          <b>{countdown(remainingSeconds)}</b>
          <button type="button" onClick={() => setFocusSession(null)}>
            <Pause size={14} /> End sprint
          </button>
          <button
            type="button"
            onClick={() => updateStatus(activeFocus, "done")}
            disabled={!canManage}
          >
            <Check size={14} /> Finish task
          </button>
        </section>
      )}

      <section className="my-work-pulse" aria-label="My Work pulse">
        <div>
          <ListChecks size={18} />
          <span>
            <strong>{assignedOpen.length}</strong>
            <small>needs your attention</small>
          </span>
        </div>
        <div className={overdueCount ? "risk" : ""}>
          <AlarmClock size={18} />
          <span>
            <strong>{overdueCount}</strong>
            <small>overdue</small>
          </span>
        </div>
        <div>
          <CalendarClock size={18} />
          <span>
            <strong>{todayCount}</strong>
            <small>due today</small>
          </span>
        </div>
        <div>
          <BadgeCheck size={18} />
          <span>
            <strong>{reviewCount}</strong>
            <small>awaiting review</small>
          </span>
        </div>
        <div className="my-work-capacity">
          <span>
            <strong>{focusMinutes || 0}m</strong>
            <small>planned focus</small>
          </span>
          <Progress
            value={Math.min(100, Math.round((focusMinutes / 180) * 100))}
            label="Planned focus capacity"
          />
        </div>
      </section>

      <div className={`my-work-layout${selected ? " has-detail" : ""}`}>
        <aside className="my-work-rail">
          <section>
            <header>
              <UserRound size={15} />
              <strong>Your views</strong>
            </header>
            {(["assigned", "following", "created"] as const).map((id) => (
              <button
                type="button"
                className={view === id ? "active" : ""}
                key={id}
                onClick={() => setView(id)}
              >
                <span>
                  {id === "assigned" ? (
                    <Target size={15} />
                  ) : id === "following" ? (
                    <Eye size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  {viewLabels[id]}
                </span>
                <b>{counts[id]}</b>
              </button>
            ))}
          </section>
          <section>
            <header>
              <Sparkles size={15} />
              <strong>
                Smart views <HintButton topic="my-work-views" />
              </strong>
            </header>
            {savedViews.map(({ id, label, icon: Icon, description }) => (
              <button
                type="button"
                className={savedView === id ? "active" : ""}
                key={id}
                onClick={() => setSavedView(id)}
              >
                <Icon size={15} />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </section>
          <Link href="/create">
            <Plus size={14} />
            <span>
              <strong>Create new work</strong>
              <small>Task, Decision, Idea, or Blueprint</small>
            </span>
            <ArrowRight size={13} />
          </Link>
        </aside>

        <section className="my-work-main">
          <div className="my-work-toolbar">
            <label>
              <Search size={15} />
              <input
                aria-label="Search My Work"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search work, records, people…"
              />
            </label>
            <button
              type="button"
              className={filtersOpen ? "active" : ""}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <Filter size={14} /> Filters
            </button>
            <button
              type="button"
              className={showDone ? "active" : ""}
              onClick={() => setShowDone((current) => !current)}
            >
              <CheckCircle2 size={14} />
              {showDone ? "Hide done" : "Show done"}
            </button>
          </div>
          {filtersOpen && (
            <div className="my-work-filters">
              <select
                aria-label="Filter My Work status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as WorkStatus | "all")
                }
              >
                <option value="all">All statuses</option>
                <option value="todo">Ready</option>
                <option value="working">Working</option>
                <option value="review">Review</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
              <select
                aria-label="Filter My Work workstream"
                value={workstream}
                onChange={(event) => setWorkstream(event.target.value)}
              >
                <option value="all">All workstreams</option>
                {workstreams.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setStatus("all");
                  setWorkstream("all");
                  setQuery("");
                }}
              >
                <RotateCcw size={13} /> Reset filters
              </button>
            </div>
          )}

          {focusItems.length > 0 && (
            <section className="day-plan">
              <span>
                <Target size={16} />
              </span>
              <span>
                <strong>Today’s focus plan</strong>
                <small>
                  {focusItems.length} outcomes · {focusMinutes} minutes ·
                  ordered above the noise
                </small>
              </span>
              <div>
                {focusItems.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <b>{index + 1}</b>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFocusIds([]);
                  storeCollection(myWorkFocusStorageKey, []);
                }}
                aria-label="Clear focus plan"
              >
                <X size={15} />
              </button>
            </section>
          )}

          {groups.length === 0 && (
            <div className="my-work-empty">
              <span>
                <Sparkles size={24} />
              </span>
              <strong>Nothing matches this view.</strong>
              <p>
                Clear filters or switch views. If the work is genuinely done,
                enjoy the space before capturing the next meaningful outcome.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setWorkstream("all");
                  setSavedView("all");
                  setShowDone(false);
                }}
              >
                Reset My Work
              </button>
            </div>
          )}

          <div className="my-work-groups">
            {groups.map((group) => (
              <section
                className={`my-work-group my-work-group--${group.id}`}
                key={group.id}
              >
                <header>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!collapsed.includes(group.id)}
                  >
                    {collapsed.includes(group.id) ? (
                      <ChevronRight size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                    <span>
                      <strong>{group.label}</strong>
                      <small>
                        {group.id === "overdue"
                          ? "Recover the commitment or reset it honestly."
                          : group.id === "today"
                            ? "Protect time for outcomes that expire today."
                            : group.id === "upcoming"
                              ? "Shape the next seven days before they become urgent."
                              : group.id === "completed"
                                ? "Progress worth seeing."
                                : "Keep visible without crowding today."}
                      </small>
                    </span>
                    <b>{group.items.length}</b>
                  </button>
                </header>
                {!collapsed.includes(group.id) && (
                  <div>
                    {group.items.map((item) => {
                      const isFocus = focusIds.includes(item.id);
                      const isOverdue = group.id === "overdue";
                      return (
                        <article
                          className={`${selectedId === item.id ? "active " : ""}${isFocus ? "focus " : ""}my-work-row`}
                          key={item.id}
                        >
                          <button
                            type="button"
                            className={`my-work-check${item.status === "done" ? " done" : ""}`}
                            aria-label={
                              item.source === "decision"
                                ? `Open ${item.title}`
                                : item.status === "done"
                                  ? `Restore ${item.title}`
                                  : `Complete ${item.title}`
                            }
                            onClick={() =>
                              item.source === "decision"
                                ? setSelectedId(item.id)
                                : updateStatus(
                                    item,
                                    item.status === "done" ? "todo" : "done",
                                  )
                            }
                            disabled={!canManage}
                          >
                            {item.status === "done" ? (
                              <RotateCcw size={13} />
                            ) : (
                              <Check size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="my-work-row__copy"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <span>
                              <small>
                                {item.workstream} · {item.relatedEntity}
                              </small>
                              {isFocus && (
                                <em>
                                  <Star size={10} fill="currentColor" /> Focus
                                  plan
                                </em>
                              )}
                            </span>
                            <strong>{item.title}</strong>
                            <p>{item.description}</p>
                            {item.status === "blocked" && item.blockedBy && (
                              <span className="my-work-blocker">
                                <CircleAlert size={12} />
                                Blocked by {item.blockedBy}
                              </span>
                            )}
                            <footer>
                              <span className={isOverdue ? "overdue" : ""}>
                                <CalendarClock size={12} />
                                {isOverdue ? "Overdue · " : ""}
                                {dueLabel(item.dueAt)}
                              </span>
                              <span>
                                <Clock3 size={12} />
                                {item.estimatedMinutes} min
                              </span>
                              <span>{item.createdBy}</span>
                            </footer>
                          </button>
                          <span
                            className={`work-status work-status--${item.status}`}
                          >
                            <CircleDot size={11} />
                            {workStatusLabels[item.status]}
                          </span>
                          <button
                            type="button"
                            className={`my-work-star${isFocus ? " active" : ""}`}
                            onClick={() => toggleFocusItem(item)}
                            aria-label={`${isFocus ? "Remove" : "Add"} ${item.title} ${isFocus ? "from" : "to"} focus plan`}
                            disabled={item.status === "done"}
                          >
                            <Star
                              size={14}
                              fill={isFocus ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            className="my-work-open"
                            onClick={() => setSelectedId(item.id)}
                            aria-label={`Open ${item.title}`}
                          >
                            <ArrowRight size={15} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>

        {selected && (
          <aside className="my-work-detail">
            <header>
              <span>
                <p>{selected.workstream}</p>
                <h2>{selected.title}</h2>
              </span>
              <button
                type="button"
                aria-label="Close work details"
                onClick={() => setSelectedId(null)}
              >
                <X size={17} />
              </button>
            </header>
            <div className="my-work-detail__state">
              <span className={`work-status work-status--${selected.status}`}>
                <CircleDot size={11} />
                {workStatusLabels[selected.status]}
              </span>
              <span
                className={`work-priority work-priority--${selected.priority}`}
              >
                {selected.priority}
              </span>
            </div>
            <p>{selected.description}</p>
            <section>
              <span>
                <h3>Next meaningful move</h3>
                <HintButton topic="my-work-risk" />
              </span>
              <div className="my-work-next">
                <Sparkles size={15} />
                <p>{selected.nextStep}</p>
              </div>
              {selected.blockedBy && (
                <div className="my-work-detail__blocker">
                  <CircleAlert size={14} />
                  <span>
                    <strong>Current blocker</strong>
                    <small>{selected.blockedBy}</small>
                  </span>
                </div>
              )}
            </section>
            <section>
              <span>
                <h3>Plan & ownership</h3>
                <HintButton topic="my-work-focus" />
              </span>
              <dl>
                <div>
                  <dt>Due</dt>
                  <dd>{dueLabel(selected.dueAt)}</dd>
                </div>
                <div>
                  <dt>Estimate</dt>
                  <dd>{selected.estimatedMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selected.owner}</dd>
                </div>
                <div>
                  <dt>Created by</dt>
                  <dd>{selected.createdBy}</dd>
                </div>
                <div>
                  <dt>Following</dt>
                  <dd>{selected.followers.join(", ") || "No followers"}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{selected.source}</dd>
                </div>
              </dl>
            </section>
            {selected.source !== "decision" && (
              <section>
                <h3>Update status</h3>
                <div className="work-status-picker">
                  {(
                    ["todo", "working", "review", "blocked", "done"] as const
                  ).map((next) => (
                    <button
                      type="button"
                      className={selected.status === next ? "active" : ""}
                      key={next}
                      onClick={() => updateStatus(selected, next)}
                      disabled={!canManage}
                    >
                      <span className={`work-status work-status--${next}`}>
                        {workStatusLabels[next]}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <footer>
              <button
                type="button"
                className={`button button--secondary${focusIds.includes(selected.id) ? " active" : ""}`}
                onClick={() => toggleFocusItem(selected)}
                disabled={selected.status === "done"}
              >
                <Star size={14} />
                {focusIds.includes(selected.id)
                  ? "In focus plan"
                  : "Add to plan"}
              </button>
              {selected.source !== "decision" && selected.status !== "done" && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => startFocus(selected)}
                  disabled={!canManage}
                >
                  <Play size={14} /> Focus 25m
                </button>
              )}
              <Link href={selected.href} className="button button--primary">
                Open source <ArrowRight size={14} />
              </Link>
            </footer>
          </aside>
        )}
      </div>

      {toast && (
        <div className="settings-toast my-work-toast" role="status">
          <Sparkles size={16} />
          <span>{toast}</span>
          {undoItem && (
            <button type="button" onClick={undoCompletion}>
              Undo
            </button>
          )}
        </div>
      )}
    </>
  );
}
