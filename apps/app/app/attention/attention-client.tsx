"use client";

import Link from "next/link";
import {
  Activity,
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Blocks,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  FolderKanban,
  History,
  Link2,
  ListPlus,
  Pause,
  Radar,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TimerReset,
  UserRound,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Progress } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import {
  attentionProjects,
  attentionScore,
  attentionSeeds,
  attentionStorageKey,
  getAttentionProject,
  rankAttentionSignals,
  type AttentionFacet,
  type AttentionProject,
  type AttentionSeverity,
  type AttentionSignal,
} from "../_components/attention-data";
import {
  loadCollection,
  storeCollection,
} from "../_components/collaboration-data";
import {
  myWorkStorageKey,
  workSeeds,
  type WorkItem,
} from "../_components/my-work-data";

type QueueMode = "active" | "history";
type FacetFilter = AttentionFacet | "all";
type UndoAction = { signal: AttentionSignal; message: string };

const facetTabs: readonly {
  id: FacetFilter;
  label: string;
  icon: typeof Radar;
}[] = [
  { id: "all", label: "Top signals", icon: Radar },
  { id: "needs_you", label: "Needs you", icon: Target },
  { id: "at_risk", label: "At risk", icon: ShieldAlert },
  { id: "blocked", label: "Blocked", icon: Blocks },
  { id: "overdue", label: "Overdue", icon: AlarmClock },
  { id: "stale", label: "Stale", icon: TimerReset },
  { id: "waiting", label: "Waiting", icon: Pause },
];

const severityLabel: Record<AttentionSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Watch",
};

const projectHealthLabel: Record<AttentionProject["health"], string> = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
};

function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function relativeDue(value: string): string {
  const due = new Date(value);
  const dueDay = due.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
  if (dueDay === today)
    return `Today · ${formatDate(value, true).split(", ").at(-1)}`;
  return formatDate(value);
}

function futureSnooze(preset: "later" | "tomorrow" | "next-week"): string {
  const date = new Date();
  if (preset === "later") date.setHours(date.getHours() + 3);
  if (preset === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }
  if (preset === "next-week") {
    date.setDate(date.getDate() + 7);
    date.setHours(9, 0, 0, 0);
  }
  return date.toISOString();
}

function isSnoozed(signal: AttentionSignal): boolean {
  return Boolean(
    signal.snoozedUntil && new Date(signal.snoozedUntil).getTime() > Date.now(),
  );
}

function facetLabel(facet: AttentionFacet): string {
  return facet.replaceAll("_", " ");
}

function SignalIcon({ severity }: { severity: AttentionSeverity }) {
  if (severity === "critical") return <CircleAlert size={18} />;
  if (severity === "high") return <ShieldAlert size={18} />;
  return <Activity size={18} />;
}

function DismissDialog({
  signal,
  onClose,
  onDismiss,
}: {
  signal: AttentionSignal;
  onClose: () => void;
  onDismiss: (reason: string) => void;
}) {
  const [reason, setReason] = useState("No longer relevant");
  return (
    <div
      className="settings-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="settings-modal attention-dismiss-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attention-dismiss-title"
      >
        <header>
          <span className="settings-modal__icon danger">
            <X size={18} />
          </span>
          <span>
            <small>Remove from the active queue</small>
            <h2 id="attention-dismiss-title">Dismiss this signal?</h2>
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dismiss dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="attention-dismiss-modal__body">
          <p>{signal.title}</p>
          <label className="settings-field">
            <span>Reason retained in signal history</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option>No longer relevant</option>
              <option>Duplicate signal</option>
              <option>Wrong project scope</option>
              <option>Risk accepted</option>
            </select>
          </label>
        </div>
        <footer>
          <span>
            Dismissal hides the signal; it does not change the source record.
          </span>
          <button
            type="button"
            className="settings-button settings-button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="settings-button settings-button--danger"
            onClick={() => onDismiss(reason)}
          >
            Dismiss signal
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function AttentionClient({ canManage }: { canManage: boolean }) {
  const [signals, setSignals] = useState<AttentionSignal[]>([
    ...attentionSeeds,
  ]);
  const [facet, setFacet] = useState<FacetFilter>("needs_you");
  const [mode, setMode] = useState<QueueMode>("active");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [undo, setUndo] = useState<UndoAction | null>(null);

  useEffect(() => {
    const loaded = loadCollection(attentionStorageKey, attentionSeeds);
    setSignals(loaded);
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("record");
    const project = params.get("project");
    if (requested && loaded.some((signal) => signal.id === requested))
      setSelectedId(requested);
    if (project && attentionProjects.some((item) => item.id === project)) {
      setProjectId(project);
      setFacet("all");
    }
  }, []);

  const activeSignals = signals.filter(
    (signal) => signal.status === "active" && !isSnoozed(signal),
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        facetTabs.map((tab) => {
          const id = tab.id;
          return [
            id,
            id === "all"
              ? activeSignals.length
              : activeSignals.filter((signal) => signal.facets.includes(id))
                  .length,
          ];
        }),
      ) as Record<FacetFilter, number>,
    [activeSignals],
  );

  const visibleSignals = useMemo(() => {
    const base = signals.filter((signal) => {
      const snoozed = isSnoozed(signal);
      const matchesMode =
        mode === "active"
          ? signal.status === "active" && !snoozed
          : signal.status !== "active" || snoozed;
      const matchesFacet = facet === "all" || signal.facets.includes(facet);
      const matchesProject =
        projectId === "all" || signal.projectId === projectId;
      const project = getAttentionProject(signal.projectId);
      const haystack =
        `${signal.title} ${signal.summary} ${signal.owner} ${signal.source} ${signal.impact} ${project?.name ?? ""}`.toLowerCase();
      return (
        matchesMode &&
        matchesFacet &&
        matchesProject &&
        haystack.includes(query.toLowerCase())
      );
    });
    return rankAttentionSignals(base);
  }, [signals, mode, facet, projectId, query]);

  const selected = signals.find((signal) => signal.id === selectedId);
  const selectedProject = selected
    ? getAttentionProject(selected.projectId)
    : undefined;
  const criticalCount = activeSignals.filter(
    (signal) => signal.severity === "critical",
  ).length;
  const blockedProjects = new Set(
    activeSignals
      .filter((signal) => signal.facets.includes("blocked"))
      .map((signal) => signal.projectId),
  ).size;
  const needsYouCount = activeSignals.filter((signal) =>
    signal.facets.includes("needs_you"),
  ).length;
  const waitingCount = activeSignals.filter((signal) =>
    signal.facets.includes("waiting"),
  ).length;
  const historyCount = signals.filter(
    (signal) => signal.status !== "active" || isSnoozed(signal),
  ).length;

  function save(next: AttentionSignal[]) {
    setSignals(next);
    storeCollection(attentionStorageKey, next);
  }

  function notify(message: string, action?: UndoAction) {
    setToast(message);
    setUndo(action ?? null);
    window.setTimeout(() => {
      setToast("");
      setUndo(null);
    }, 5000);
  }

  function updateSignal(
    signal: AttentionSignal,
    next: AttentionSignal,
    message: string,
  ) {
    save(signals.map((item) => (item.id === signal.id ? next : item)));
    setSelectedId(null);
    setSnoozeOpen(false);
    notify(message, {
      signal,
      message: "Signal restored to its previous state.",
    });
  }

  function snooze(
    signal: AttentionSignal,
    preset: "later" | "tomorrow" | "next-week",
  ) {
    const snoozedUntil = futureSnooze(preset);
    updateSignal(
      signal,
      { ...signal, snoozedUntil },
      `Signal snoozed until ${formatDate(snoozedUntil, true)}.`,
    );
  }

  function resolveSignal(signal: AttentionSignal) {
    const next = {
      ...signal,
      status: "resolved" as const,
      resolutionNote: "Source outcome verified from Attention Center.",
    };
    delete next.snoozedUntil;
    updateSignal(signal, next, "Signal marked resolved and moved to history.");
  }

  function dismissSignal(signal: AttentionSignal, reason: string) {
    const next = {
      ...signal,
      status: "dismissed" as const,
      resolutionNote: reason,
    };
    delete next.snoozedUntil;
    setDismissOpen(false);
    updateSignal(signal, next, `Signal dismissed: ${reason}.`);
  }

  function undoLast() {
    if (!undo) return;
    save(
      signals.map((signal) =>
        signal.id === undo.signal.id ? undo.signal : signal,
      ),
    );
    setToast(undo.message);
    setUndo(null);
  }

  function changeOwner(signal: AttentionSignal, owner: string) {
    save(
      signals.map((item) =>
        item.id === signal.id ? { ...item, owner } : item,
      ),
    );
    notify(`Signal routed to ${owner}.`);
  }

  function addToMyWork(signal: AttentionSignal) {
    const project = getAttentionProject(signal.projectId);
    if (!project) return;
    const id = `work-${signal.id}`;
    const existing = loadCollection<WorkItem>(
      myWorkStorageKey,
      workSeeds,
    ).filter((item) => item.source === "personal");
    if (existing.some((item) => item.id === id)) {
      notify("This signal is already in My Work.");
      return;
    }
    const blockedBy = signal.dependencies.find(
      (dependency) => dependency.state !== "ready",
    )?.label;
    const work: WorkItem = {
      id,
      title: signal.title,
      description: signal.recommendedAction.description,
      status: blockedBy ? "blocked" : "todo",
      priority:
        signal.severity === "critical"
          ? "urgent"
          : signal.severity === "high"
            ? "high"
            : "normal",
      dueAt: signal.dueAt,
      owner: signal.owner,
      workstream: project.name,
      relatedEntity: signal.source,
      createdBy: "TREVV Attention Center",
      followers: signal.watchers,
      views: ["assigned", "created"],
      estimatedMinutes: signal.severity === "critical" ? 30 : 20,
      nextStep: signal.recommendedAction.description,
      source: "personal",
      href: signal.recommendedAction.href,
      ...(blockedBy ? { blockedBy } : {}),
    };
    storeCollection(myWorkStorageKey, [work, ...existing]);
    notify(
      "Added to My Work with its project, deadline, and next move intact.",
    );
  }

  function focusTopSignal() {
    const top = rankAttentionSignals(activeSignals)[0];
    if (!top) return;
    setMode("active");
    setFacet("all");
    setProjectId("all");
    setSelectedId(top.id);
  }

  return (
    <>
      <section className="workspace-page-head attention-head">
        <div>
          <p>TREVV / ATTENTION CENTER</p>
          <h1>
            Hear the signal. Move the work.{" "}
            <HintButton topic="attention-overview" />
          </h1>
          <span>
            Consequence, time, dependencies, and project health—ranked into one
            explainable action queue.
          </span>
        </div>
        <div className="attention-head__actions">
          <button
            type="button"
            className={`button button--secondary${mode === "history" ? " active" : ""}`}
            onClick={() =>
              setMode((current) =>
                current === "active" ? "history" : "active",
              )
            }
          >
            <History size={15} />{" "}
            {mode === "history"
              ? "Back to active"
              : `History · ${historyCount}`}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={focusTopSignal}
          >
            <Zap size={15} /> Focus top signal
          </button>
        </div>
      </section>

      <section className="attention-pulse" aria-label="Attention Center pulse">
        <div className={criticalCount ? "critical" : ""}>
          <CircleAlert size={18} />
          <span>
            <strong>{criticalCount}</strong>
            <small>critical now</small>
          </span>
        </div>
        <div>
          <Target size={18} />
          <span>
            <strong>{needsYouCount}</strong>
            <small>need your move</small>
          </span>
        </div>
        <div>
          <FolderKanban size={18} />
          <span>
            <strong>{blockedProjects}</strong>
            <small>projects blocked</small>
          </span>
        </div>
        <div>
          <Clock3 size={18} />
          <span>
            <strong>{waitingCount}</strong>
            <small>waiting externally</small>
          </span>
        </div>
        <div className="attention-pulse__promise">
          <Sparkles size={17} />
          <span>
            <strong>Every signal is traceable</strong>
            <small>Project → evidence → dependency → action</small>
          </span>
        </div>
      </section>

      <section className="attention-tabs" aria-label="Attention signal views">
        {facetTabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            className={facet === id ? "active" : ""}
            key={id}
            onClick={() => setFacet(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            <b>{counts[id]}</b>
          </button>
        ))}
      </section>

      <section className="attention-explainer">
        <span>
          <Radar size={17} />
        </span>
        <div>
          <strong>
            Why this order? <HintButton topic="attention-ranking" />
          </strong>
          <p>
            TREVV raises work when consequence, elapsed time, dependency
            pressure, and project health compound—not because a badge happens to
            be red.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setSelectedId(rankAttentionSignals(activeSignals)[0]?.id ?? null)
          }
        >
          Inspect the top score <ChevronRight size={14} />
        </button>
      </section>

      <div
        className={`attention-layout${selected && selectedProject ? " has-detail" : ""}`}
      >
        <section className="attention-queue">
          <header>
            <span>
              <p>{mode === "active" ? "ACTIVE SIGNALS" : "SIGNAL HISTORY"}</p>
              <h2>
                {visibleSignals.length}{" "}
                {visibleSignals.length === 1 ? "signal" : "signals"}
              </h2>
            </span>
            <HintButton topic="attention-actions" />
          </header>
          <div className="attention-toolbar">
            <label>
              <Search size={14} />
              <input
                aria-label="Search Attention Center"
                placeholder="Search signals, projects, owners…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <Filter size={14} />
              <select
                aria-label="Filter Attention Center by project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="all">All projects</option>
                {attentionProjects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            {(query || projectId !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setProjectId("all");
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>

          {visibleSignals.length === 0 && (
            <div className="attention-empty">
              <span>
                <CircleCheck size={24} />
              </span>
              <strong>
                {mode === "active"
                  ? "No active signals match this view."
                  : "No signal history matches this view."}
              </strong>
              <p>
                {mode === "active"
                  ? "Try another project or signal lens. Resolved and snoozed items remain available in History."
                  : "Return to the active queue or clear the filters."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFacet("all");
                  setQuery("");
                  setProjectId("all");
                }}
              >
                Clear this view
              </button>
            </div>
          )}

          <div className="attention-list">
            {visibleSignals.map((signal, index) => {
              const project = getAttentionProject(signal.projectId);
              if (!project) return null;
              const score = attentionScore(signal, project);
              const snoozed = isSnoozed(signal);
              return (
                <article
                  className={`attention-card attention-card--${signal.severity}${selectedId === signal.id ? " active" : ""}`}
                  key={signal.id}
                >
                  <span
                    className={`attention-card__icon attention-card__icon--${signal.severity}`}
                  >
                    <SignalIcon severity={signal.severity} />
                  </span>
                  <div className="attention-card__body">
                    <div className="attention-card__project">
                      <Link
                        href={`/attention?project=${project.id}`}
                        onClick={() => {
                          setProjectId(project.id);
                          setFacet("all");
                        }}
                      >
                        <FolderKanban size={12} /> {project.name}
                      </Link>
                      <span
                        className={`attention-project-health attention-project-health--${project.health}`}
                      >
                        {projectHealthLabel[project.health]}
                      </span>
                      <small>
                        #{index + 1} · score {score}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="attention-card__copy"
                      onClick={() => setSelectedId(signal.id)}
                    >
                      <span>
                        <strong>{signal.title}</strong>
                        <em>{severityLabel[signal.severity]}</em>
                      </span>
                      <p>{signal.summary}</p>
                    </button>
                    <div className="attention-card__facets">
                      {signal.facets.slice(0, 4).map((item) => (
                        <span key={item}>{facetLabel(item)}</span>
                      ))}
                      {snoozed && (
                        <span className="snoozed">
                          <Clock3 size={11} /> to{" "}
                          {formatDate(signal.snoozedUntil!, true)}
                        </span>
                      )}
                      {signal.status !== "active" && (
                        <span className="history">{signal.status}</span>
                      )}
                    </div>
                    <div className="attention-card__impact">
                      <ShieldAlert size={13} />
                      <span>
                        <strong>Project consequence</strong>
                        <small>{signal.impact}</small>
                      </span>
                    </div>
                    <footer>
                      <span>
                        <CalendarClock size={12} />
                        {relativeDue(signal.dueAt)}
                      </span>
                      <span>
                        <UserRound size={12} />
                        {signal.owner}
                      </span>
                      <Link href={signal.sourceHref}>
                        <Link2 size={12} />
                        {signal.source}
                      </Link>
                    </footer>
                  </div>
                  <div className="attention-card__actions">
                    <Link
                      href={signal.recommendedAction.href}
                      className="button button--primary"
                    >
                      <WandSparkles size={14} />{" "}
                      {signal.recommendedAction.label}
                    </Link>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => addToMyWork(signal)}
                      disabled={!canManage}
                    >
                      <ListPlus size={14} /> My Work
                    </button>
                    <button
                      type="button"
                      className="attention-details-button"
                      onClick={() => setSelectedId(signal.id)}
                    >
                      Details <ArrowRight size={13} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {selected && selectedProject && (
          <aside className="attention-detail">
            <header>
              <span>
                <p>
                  {severityLabel[selected.severity]} signal · score{" "}
                  {attentionScore(selected, selectedProject)}
                </p>
                <h2>{selected.title}</h2>
              </span>
              <button
                type="button"
                aria-label="Close attention details"
                onClick={() => setSelectedId(null)}
              >
                <X size={17} />
              </button>
            </header>
            <div
              className="attention-detail__path"
              aria-label="Signal navigation path"
            >
              <span>Signal</span>
              <ChevronRight size={12} />
              <Link
                href={`/attention?project=${selectedProject.id}`}
                onClick={() => {
                  setProjectId(selectedProject.id);
                  setFacet("all");
                }}
              >
                Project
              </Link>
              <ChevronRight size={12} />
              <Link href={selected.sourceHref}>Source</Link>
              <ChevronRight size={12} />
              <strong>Action</strong>
            </div>
            <section className="attention-project-card">
              <span className="attention-project-card__icon">
                <FolderKanban size={17} />
              </span>
              <span>
                <small>PROJECT RELEVANCE</small>
                <strong>{selectedProject.name}</strong>
                <p>{selectedProject.goal}</p>
              </span>
              <Link
                href={selectedProject.href}
                aria-label={`Open ${selectedProject.name}`}
              >
                <ExternalLink size={14} />
              </Link>
              <dl>
                <div>
                  <dt>Phase</dt>
                  <dd>{selectedProject.phase}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selectedProject.owner}</dd>
                </div>
                <div>
                  <dt>Health</dt>
                  <dd>{projectHealthLabel[selectedProject.health]}</dd>
                </div>
              </dl>
              <div className="attention-project-card__progress">
                <Progress
                  value={selectedProject.progress}
                  label={`${selectedProject.name} progress`}
                />
                <small>{selectedProject.progress}%</small>
              </div>
            </section>

            <section className="attention-detail__section">
              <span>
                <h3>Why this matters now</h3>
                <HintButton topic="attention-ranking" />
              </span>
              <p>{selected.impact}</p>
              <ul>
                {selected.reasons.map((reason) => (
                  <li key={reason}>
                    <CircleDot size={11} />
                    {reason}
                  </li>
                ))}
              </ul>
            </section>

            <section className="attention-detail__section">
              <span>
                <h3>Evidence trail</h3>
                <HintButton topic="attention-evidence" />
              </span>
              <div className="attention-evidence-list">
                {selected.evidence.map((evidence) => (
                  <Link
                    href={evidence.href}
                    key={`${evidence.kind}-${evidence.label}`}
                  >
                    <span>
                      <FileCheck2 size={14} />
                    </span>
                    <span>
                      <small>{evidence.kind}</small>
                      <strong>{evidence.label}</strong>
                      <p>{evidence.detail}</p>
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="attention-detail__section">
              <h3>Dependency path</h3>
              <div className="attention-dependency-list">
                {selected.dependencies.map((dependency, index) => (
                  <Link href={dependency.href} key={dependency.label}>
                    <span
                      className={`attention-dependency-state attention-dependency-state--${dependency.state}`}
                    >
                      {dependency.state === "ready" ? (
                        <Check size={12} />
                      ) : dependency.state === "blocked" ? (
                        <Blocks size={12} />
                      ) : (
                        <Clock3 size={12} />
                      )}
                    </span>
                    <span>
                      <small>
                        Step {index + 1} · {dependency.owner}
                      </small>
                      <strong>{dependency.label}</strong>
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="attention-detail__section">
              <span>
                <h3>Route & collaborate</h3>
                <Users size={14} />
              </span>
              <label className="attention-owner-select">
                <span>Signal owner</span>
                <select
                  value={selected.owner}
                  onChange={(event) =>
                    changeOwner(selected, event.target.value)
                  }
                  disabled={!canManage}
                >
                  <option>Nadia Rahman</option>
                  <option>Anna Keller</option>
                  <option>Rahim Chowdhury</option>
                  <option>Lisa Morgan</option>
                  <option>Anna Müller</option>
                  <option>Intertek Dhaka</option>
                </select>
              </label>
              <p className="attention-watchers">
                <Eye size={13} /> Watching · {selected.watchers.join(", ")}
              </p>
            </section>

            <section className="attention-next-action">
              <span>
                <WandSparkles size={16} />
              </span>
              <div>
                <small>RECOMMENDED NEXT MOVE</small>
                <strong>{selected.recommendedAction.label}</strong>
                <p>{selected.recommendedAction.description}</p>
                <em>Expected: {selected.recommendedAction.expectedOutcome}</em>
              </div>
              <Link href={selected.recommendedAction.href}>
                Open action <ArrowRight size={13} />
              </Link>
            </section>

            <footer>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => addToMyWork(selected)}
                disabled={!canManage}
              >
                <ListPlus size={14} /> Add to My Work
              </button>
              <span className="attention-snooze-wrap">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setSnoozeOpen((current) => !current)}
                  disabled={!canManage}
                >
                  <BellRing size={14} /> Snooze
                </button>
                {snoozeOpen && (
                  <span className="attention-snooze-menu">
                    <strong>Bring this signal back</strong>
                    <button
                      type="button"
                      onClick={() => snooze(selected, "later")}
                    >
                      Later today
                    </button>
                    <button
                      type="button"
                      onClick={() => snooze(selected, "tomorrow")}
                    >
                      Tomorrow morning
                    </button>
                    <button
                      type="button"
                      onClick={() => snooze(selected, "next-week")}
                    >
                      Next week
                    </button>
                  </span>
                )}
              </span>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setDismissOpen(true)}
                disabled={!canManage}
              >
                <X size={14} /> Dismiss
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => resolveSignal(selected)}
                disabled={!canManage}
              >
                <BadgeCheck size={14} /> Mark resolved
              </button>
            </footer>
          </aside>
        )}
      </div>

      {dismissOpen && selected && (
        <DismissDialog
          signal={selected}
          onClose={() => setDismissOpen(false)}
          onDismiss={(reason) => dismissSignal(selected, reason)}
        />
      )}
      {toast && (
        <div className="settings-toast attention-toast" role="status">
          <Sparkles size={16} />
          <span>{toast}</span>
          {undo && (
            <button type="button" onClick={undoLast}>
              Undo
            </button>
          )}
        </div>
      )}
    </>
  );
}
