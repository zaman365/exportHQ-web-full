"use client";

import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  BellRing,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  CornerDownLeft,
  Filter,
  Folder,
  Inbox,
  Lightbulb,
  Link2,
  ListTodo,
  PartyPopper,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  StickyNote,
  Target,
  UserPlus,
  WandSparkles,
  X,
  Zap
} from "lucide-react";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import type { Responsibility, TaskStatus } from "@exporthq/domain";
import { HintButton } from "../_components/hint-button";
import {
  addRecentRecord,
  ideaSeeds,
  ideasStorageKey,
  loadCollection,
  storeCollection,
  type IdeaCategory,
  type IdeaRecord
} from "../_components/collaboration-data";
import {
  captureHubLabels,
  capturedItemsStorageKey,
  captureTypeLabels,
  inboxRequestSeeds,
  inboxRequestsStorageKey,
  requestKindLabels,
  resolveCaptureDue,
  suggestCaptureDate,
  suggestCaptureType,
  type CapturedItem,
  type CaptureDatePreset,
  type CaptureHub,
  type CaptureType,
  type InboxPriority,
  type InboxRequest,
  type InboxRequestKind
} from "../_components/inbox-data";
import { blueprintRunsStorageKey, type BlueprintRun } from "../_components/workflow-data";

type KindFilter = InboxRequestKind | "all";
type PriorityFilter = InboxPriority | "all";
type UndoAction = { label: string; request?: InboxRequest; capture?: CapturedItem };

const kindFilters: readonly KindFilter[] = ["all", "decision_request", "mention", "approval_request", "follow_up", "assignment"];
const priorityOrder: Record<InboxPriority, number> = { urgent: 0, high: 1, normal: 2 };
const dateLabels: Record<CaptureDatePreset, string> = { none: "No date", today: "Today", tomorrow: "Tomorrow", "next-week": "Next week" };

function firstLine(value: string): string {
  const line = value.trim().split(/\n|[.!?]\s/)[0]?.trim() || value.trim();
  return line.length > 82 ? `${line.slice(0, 79)}…` : line;
}

function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: "Europe/Berlin" }).format(new Date(value));
}

function relativeDue(value: string): string {
  const due = new Date(value);
  const today = new Date();
  const sameDay = due.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }) === today.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  return sameDay ? `Today · ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(due)}` : formatDate(value, true);
}

function futureSnooze(preset: "later" | "tomorrow" | "next-week"): string {
  const date = new Date();
  if (preset === "later") date.setHours(date.getHours() + 3);
  if (preset === "tomorrow") { date.setDate(date.getDate() + 1); date.setHours(9, 0, 0, 0); }
  if (preset === "next-week") { date.setDate(date.getDate() + 7); date.setHours(9, 0, 0, 0); }
  return date.toISOString();
}

function RequestIcon({ kind }: { kind: InboxRequestKind }) {
  if (kind === "decision_request") return <CircleAlert size={16} />;
  if (kind === "mention") return <AtSign size={16} />;
  if (kind === "approval_request") return <BadgeCheck size={16} />;
  if (kind === "follow_up") return <BellRing size={16} />;
  return <UserPlus size={16} />;
}

function CaptureIcon({ type }: { type: CaptureType }) {
  if (type === "task") return <ListTodo size={15} />;
  if (type === "idea") return <Lightbulb size={15} />;
  if (type === "link") return <Link2 size={15} />;
  return <StickyNote size={15} />;
}

function suggestedMove(item: InboxRequest): string {
  if (item.kind === "decision_request") return "Open the decision, compare the trade-offs, then approve or return it with the missing evidence.";
  if (item.kind === "mention") return "Open the related handoff, confirm ownership, and leave the next person with one explicit next step.";
  if (item.kind === "approval_request") return "Check the supporting assumptions before approving; do not use Done as a substitute for review.";
  if (item.kind === "follow_up") return "Record the contact or the next checkpoint, then resolve the underlying Waiting item.";
  return "Open the assigned workflow and confirm the expected output, owner, and due checkpoint.";
}

function QuickCapture({
  canManage,
  captureRef,
  content,
  setContent,
  type,
  setType,
  hub,
  setHub,
  date,
  setDate,
  onCapture
}: {
  canManage: boolean;
  captureRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (value: string) => void;
  type: CaptureType;
  setType: (value: CaptureType) => void;
  hub: CaptureHub;
  setHub: (value: CaptureHub) => void;
  date: CaptureDatePreset;
  setDate: (value: CaptureDatePreset) => void;
  onCapture: () => void;
}) {
  const suggestedType = suggestCaptureType(content);
  const suggestedDate = suggestCaptureDate(content);

  return <section className="inbox-capture"><header><span className="inbox-capture__spark"><WandSparkles size={18} /></span><span><strong>Quick Capture <HintButton topic="inbox-quick-capture" /></strong><small>Personal capture stays separate from communication that needs a response.</small></span><kbd>C</kbd></header><label><textarea ref={captureRef} aria-label="Quick capture" value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); onCapture(); } }} placeholder="Capture a task, idea, link, or note…" /></label>{(suggestedType && suggestedType !== type) || (suggestedDate && suggestedDate !== date) ? <div className="inbox-smart-nudge"><Sparkles size={13} /><span>ExportPanel noticed</span>{suggestedType && suggestedType !== type && <button type="button" onClick={() => setType(suggestedType)}>Use {captureTypeLabels[suggestedType]}</button>}{suggestedDate && suggestedDate !== date && <button type="button" onClick={() => setDate(suggestedDate)}>Set {dateLabels[suggestedDate]}</button>}</div> : null}<footer><div><label><CaptureIcon type={type} /><select aria-label="Capture type" value={type} onChange={(event) => setType(event.target.value as CaptureType)}><option value="task">Task</option><option value="idea">Idea</option><option value="link">Link</option><option value="note">Note</option></select><ChevronDown size={13} /></label><label><Folder size={14} /><select aria-label="Capture Hub" value={hub} onChange={(event) => setHub(event.target.value as CaptureHub)}><option value="inbox">No Hub</option><option value="germany-launch">Germany launch</option><option value="compliance">Compliance</option><option value="buyer-pipeline">Buyer pipeline</option><option value="product-readiness">Product readiness</option></select><ChevronDown size={13} /></label><label><CalendarClock size={14} /><select aria-label="Capture date" value={date} onChange={(event) => setDate(event.target.value as CaptureDatePreset)}><option value="none">No date</option><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="next-week">Next week</option></select><ChevronDown size={13} /></label></div><span><small><CornerDownLeft size={12} />⌘ Enter</small><button type="button" className="button button--primary" onClick={onCapture} disabled={!canManage || !content.trim()}><Plus size={15} /> Capture</button></span></footer></section>;
}

export default function InboxClient({ canManage }: { canManage: boolean }) {
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const [captureHub, setCaptureHub] = useState<CaptureHub>("inbox");
  const [captureDate, setCaptureDate] = useState<CaptureDatePreset>("none");
  const [captures, setCaptures] = useState<CapturedItem[]>([]);
  const [requests, setRequests] = useState<InboxRequest[]>([...inboxRequestSeeds]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [showDone, setShowDone] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  useEffect(() => {
    setCaptures(loadCollection<CapturedItem>(capturedItemsStorageKey, []));
    const loadedRequests = loadCollection(
      inboxRequestsStorageKey,
      inboxRequestSeeds,
    );
    setRequests(loadedRequests);
    const requestedId = new URLSearchParams(window.location.search).get(
      "record",
    );
    if (requestedId && loadedRequests.some((item) => item.id === requestedId)) {
      setSelectedId(requestedId);
    }
  }, []);

  useEffect(() => {
    const focusCapture = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "c" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      event.preventDefault();
      captureRef.current?.focus();
    };
    document.addEventListener("keydown", focusCapture);
    return () => document.removeEventListener("keydown", focusCapture);
  }, []);

  const selected = requests.find((item) => item.id === selectedId);
  const now = Date.now();
  const openRequests = requests.filter((item) => item.status === "open");
  const snoozedCount = openRequests.filter((item) => item.snoozedUntil && new Date(item.snoozedUntil).getTime() > now).length;
  const dueToday = openRequests.filter((item) => new Date(item.dueAt).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }) === new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" })).length;
  const urgentCount = openRequests.filter((item) => item.priority === "urgent").length;

  const visibleRequests = useMemo(() => requests.filter((item) => {
    const isSnoozed = Boolean(item.snoozedUntil && new Date(item.snoozedUntil).getTime() > Date.now());
    const matchesState = showDone ? item.status === "done" : item.status === "open";
    const matchesSnooze = showDone || showSnoozed || !isSnoozed;
    const matchesKind = kind === "all" || item.kind === kind;
    const matchesPriority = priority === "all" || item.priority === priority;
    const haystack = `${item.title} ${item.summary} ${item.actor} ${item.source} ${item.relatedEntity}`.toLowerCase();
    return matchesState && matchesSnooze && matchesKind && matchesPriority && haystack.includes(query.toLowerCase());
  }).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()), [requests, showDone, showSnoozed, kind, priority, query]);

  function notify(message: string, undo?: UndoAction) {
    setToast(message);
    setUndoAction(undo ?? null);
    window.setTimeout(() => { setToast(""); setUndoAction(null); }, 4500);
  }

  function saveRequests(next: InboxRequest[]) {
    setRequests(next);
    storeCollection(inboxRequestsStorageKey, next);
  }

  function saveCaptures(next: CapturedItem[]) {
    setCaptures(next);
    storeCollection(capturedItemsStorageKey, next);
  }

  function routeTask(title: string, hub: CaptureHub, dueAt: string | undefined, id: string): string {
    const responsibility: Responsibility = "customer";
    const status: TaskStatus = "waiting_customer";
    const recordId = `run-${id}`;
    const fallbackDue = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const run: BlueprintRun = { id: recordId, blueprintId: "manual-handoff", title, description: `Captured from Inbox. Clarify and complete this next step: ${title}`, createdAt: new Date().toISOString(), dueAt: dueAt ?? fallbackDue, responsibility, ownerName: "Nadia Rahman", relatedEntity: captureHubLabels[hub], status, totalSteps: 1, completedSteps: 0 };
    storeCollection(blueprintRunsStorageKey, [run, ...loadCollection<BlueprintRun>(blueprintRunsStorageKey, [])]);
    addRecentRecord({ id: recordId, type: "task", title, createdAt: run.createdAt, href: `/waiting?record=${recordId}` });
    return recordId;
  }

  function routeIdea(title: string, fullContent: string, hub: CaptureHub, id: string): string {
    const category: IdeaCategory = hub === "compliance" ? "Compliance" : hub === "buyer-pipeline" ? "Buyer" : hub === "product-readiness" ? "Product" : "Market";
    const recordId = `idea-${id}`;
    const idea: IdeaRecord = { id: recordId, title, summary: fullContent, category, stage: "inbox", owner: "Nadia Rahman", createdAt: new Date().toISOString(), votes: 1, impact: 2, effort: 2, relatedEntity: captureHubLabels[hub], notes: "Captured from Inbox. Validate the expected impact, effort, and smallest useful next step." };
    storeCollection(ideasStorageKey, [idea, ...loadCollection(ideasStorageKey, ideaSeeds)]);
    addRecentRecord({ id: recordId, type: "idea", title, createdAt: idea.createdAt, href: `/ideas?record=${recordId}` });
    return recordId;
  }

  function captureItem() {
    const value = content.trim();
    if (!value || !canManage) return;
    const id = `capture-${Date.now()}`;
    const title = firstLine(value);
    const dueAt = resolveCaptureDue(captureDate);
    let routedRecordId: string | undefined;
    let routedTo: CapturedItem["routedTo"];
    if (captureType === "task") { routedRecordId = routeTask(title, captureHub, dueAt, id); routedTo = "waiting"; }
    if (captureType === "idea") { routedRecordId = routeIdea(title, value, captureHub, id); routedTo = "ideas"; }
    const capture: CapturedItem = { id, content: value, type: captureType, hub: captureHub, createdAt: new Date().toISOString(), ...(dueAt ? { dueAt } : {}), ...(routedTo ? { routedTo } : {}), ...(routedRecordId ? { routedRecordId } : {}) };
    saveCaptures([capture, ...captures]);
    setContent("");
    setCaptureDate("none");
    notify(routedTo ? `${captureTypeLabels[captureType]} captured and routed to ${routedTo === "waiting" ? "Waiting" : "Ideas"}.` : `${captureTypeLabels[captureType]} saved to your private capture tray.`, { label: "Undo capture", capture });
  }

  function routeExisting(capture: CapturedItem, target: "waiting" | "ideas") {
    if (capture.routedTo) return;
    const title = firstLine(capture.content);
    const recordId = target === "waiting" ? routeTask(title, capture.hub, capture.dueAt, capture.id) : routeIdea(title, capture.content, capture.hub, capture.id);
    const next = captures.map((item) => item.id === capture.id ? { ...item, routedTo: target, routedRecordId: recordId } : item);
    saveCaptures(next);
    notify(`Capture routed to ${target === "waiting" ? "Waiting" : "Ideas"}.`);
  }

  function completeRequest(item: InboxRequest) {
    const next = requests.map((request) => request.id === item.id ? { ...request, status: "done" as const, doneAt: new Date().toISOString() } : request);
    saveRequests(next);
    if (selectedId === item.id) setSelectedId(null);
    notify("Request cleared from your actionable Inbox.", { label: "Undo Done", request: item });
  }

  function snoozeRequest(item: InboxRequest, preset: "later" | "tomorrow" | "next-week") {
    const until = futureSnooze(preset);
    const next = requests.map((request) => request.id === item.id ? { ...request, snoozedUntil: until } : request);
    saveRequests(next);
    setSnoozeId(null);
    if (selectedId === item.id) setSelectedId(null);
    notify(`Snoozed until ${formatDate(until, true)}.`, { label: "Undo snooze", request: item });
  }

  function undoLastAction() {
    if (!undoAction) return;
    if (undoAction.request) {
      const restored = requests.map((item) => item.id === undoAction.request!.id ? undoAction.request! : item);
      saveRequests(restored);
    }
    if (undoAction.capture) {
      const capture = undoAction.capture;
      saveCaptures(captures.filter((item) => item.id !== capture.id));
      if (capture.routedRecordId && capture.routedTo === "waiting") storeCollection(blueprintRunsStorageKey, loadCollection<BlueprintRun>(blueprintRunsStorageKey, []).filter((item) => item.id !== capture.routedRecordId));
      if (capture.routedRecordId && capture.routedTo === "ideas") storeCollection(ideasStorageKey, loadCollection<IdeaRecord>(ideasStorageKey, ideaSeeds).filter((item) => item.id !== capture.routedRecordId));
    }
    setToast("Last action undone.");
    setUndoAction(null);
  }

  function focusNext() {
    const next = visibleRequests[0];
    if (next) setSelectedId(next.id);
  }

  return <>
    <section className="workspace-page-head inbox-head"><div><p>ExportPanel / INBOX</p><h1>One thought in. One clear move out. <HintButton topic="inbox-overview" /></h1><span>Capture without losing momentum, then triage requests that genuinely need your attention.</span></div><button type="button" className="button button--primary" onClick={() => captureRef.current?.focus()}><Plus size={16} /> Capture item</button></section>

    <section className="inbox-pulse" aria-label="Inbox pulse"><div><Inbox size={18} /><span><strong>{openRequests.length - snoozedCount}</strong><small>ready for triage</small></span></div><div><Zap size={18} /><span><strong>{urgentCount}</strong><small>urgent decision</small></span></div><div><CalendarClock size={18} /><span><strong>{dueToday}</strong><small>due today</small></span></div><div><Clock3 size={18} /><span><strong>{snoozedCount}</strong><small>safely snoozed</small></span></div><button type="button" onClick={focusNext} disabled={visibleRequests.length === 0}><Target size={15} /> Focus next</button></section>

    <QuickCapture canManage={canManage} captureRef={captureRef} content={content} setContent={setContent} type={captureType} setType={setCaptureType} hub={captureHub} setHub={setCaptureHub} date={captureDate} setDate={setCaptureDate} onCapture={captureItem} />

    <div className={`inbox-action-layout${selected ? " has-detail" : ""}`}><section className="inbox-actionable"><header><span><h2>Actionable Inbox <HintButton topic="inbox-actionable" /></h2><small>{showDone ? `${requests.filter((item) => item.status === "done").length} completed requests` : `${openRequests.length} requests need a response`}</small></span><div><button type="button" className={showDone ? "active" : ""} onClick={() => setShowDone((current) => !current)}>{showDone ? <Inbox size={14} /> : <Check size={14} />}{showDone ? "Show open" : "Done"}</button><button type="button" className={filtersOpen ? "active" : ""} onClick={() => setFiltersOpen((current) => !current)}><Filter size={14} /> Filter</button></div></header>{filtersOpen && <div className="inbox-filters"><label><Search size={14} /><input aria-label="Search actionable Inbox" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests…" /></label><select aria-label="Filter request type" value={kind} onChange={(event) => setKind(event.target.value as KindFilter)}>{kindFilters.map((item) => <option value={item} key={item}>{item === "all" ? "All request types" : requestKindLabels[item]}</option>)}</select><select aria-label="Filter request priority" value={priority} onChange={(event) => setPriority(event.target.value as PriorityFilter)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option></select><label className="inbox-filter-check"><input type="checkbox" checked={showSnoozed} onChange={(event) => setShowSnoozed(event.target.checked)} /> Show snoozed</label><button type="button" onClick={() => { setQuery(""); setKind("all"); setPriority("all"); setShowSnoozed(false); }}><RotateCcw size={13} /> Reset</button></div>}

      {visibleRequests.length === 0 && <div className="inbox-zero"><span><PartyPopper size={24} /></span><strong>{showDone ? "No completed requests match this view." : "You are clear for now."}</strong><p>{query || kind !== "all" || priority !== "all" ? "Reset the filters to see the full Inbox." : "New decisions, mentions, approvals, follow-ups, and assignments will land here."}</p>{!showDone && <Link href="/learn?topic=inbox-zero">Build an Inbox-zero rhythm <ArrowRight size={13} /></Link>}</div>}

      <div className="inbox-request-list" aria-live="polite">{visibleRequests.map((item) => { const isSnoozed = Boolean(item.snoozedUntil && new Date(item.snoozedUntil).getTime() > Date.now()); return <article className={`${selectedId === item.id ? "active " : ""}inbox-request`} key={item.id}><span className={`inbox-request__icon inbox-request__icon--${item.kind}`}><RequestIcon kind={item.kind} /></span><button type="button" className="inbox-request__copy" onClick={() => setSelectedId(item.id)}><small>{requestKindLabels[item.kind]}<i className={`priority-dot priority-dot--${item.priority}`} />{item.priority !== "normal" && item.priority}</small><strong>{item.title}</strong><span>{item.actor} · {item.source}</span><p>{item.summary}</p><footer><span className={new Date(item.dueAt).getTime() < Date.now() && item.status === "open" ? "overdue" : ""}><CalendarClock size={12} />{relativeDue(item.dueAt)}</span><span>{item.relatedEntity}</span>{isSnoozed && <em><Clock3 size={11} /> Snoozed to {formatDate(item.snoozedUntil!, true)}</em>}</footer></button><div className="inbox-request__actions">{item.status === "open" ? <><button type="button" onClick={() => completeRequest(item)} disabled={!canManage}><Check size={13} /> Done</button><span className="inbox-snooze-wrap"><button type="button" onClick={() => setSnoozeId(snoozeId === item.id ? null : item.id)} disabled={!canManage}><Clock3 size={13} /> Snooze</button>{snoozeId === item.id && <span className="inbox-snooze-menu"><strong>Bring this back</strong><button type="button" onClick={() => snoozeRequest(item, "later")}>Later today</button><button type="button" onClick={() => snoozeRequest(item, "tomorrow")}>Tomorrow morning</button><button type="button" onClick={() => snoozeRequest(item, "next-week")}>Next week</button></span>}</span></> : <button type="button" onClick={() => { const restored = { ...item, status: "open" as const }; delete restored.doneAt; saveRequests(requests.map((request) => request.id === item.id ? restored : request)); notify("Request restored to your Inbox."); }} disabled={!canManage}><RotateCcw size={13} /> Restore</button>}<button type="button" className="inbox-open" onClick={() => setSelectedId(item.id)} aria-label={`Open ${item.title}`}><ArrowRight size={15} /></button></div></article>; })}</div></section>

      {selected && <aside className="inbox-detail"><header><span><p>{requestKindLabels[selected.kind]}</p><h2>{selected.title}</h2></span><button type="button" aria-label="Close request details" onClick={() => setSelectedId(null)}><X size={17} /></button></header><div className="inbox-detail__meta"><span className={`inbox-request__icon inbox-request__icon--${selected.kind}`}><RequestIcon kind={selected.kind} /></span><span><strong>{selected.actor}</strong><small>{selected.source} · {formatDate(selected.createdAt, true)}</small></span><i className={`inbox-priority inbox-priority--${selected.priority}`}>{selected.priority}</i></div><p>{selected.summary}</p><section><span><h3>ExportPanel suggests</h3><HintButton topic="inbox-triage" /></span><div className="inbox-suggestion"><Sparkles size={15} /><p>{suggestedMove(selected)}</p></div></section><dl><div><dt>Due checkpoint</dt><dd>{relativeDue(selected.dueAt)}</dd></div><div><dt>Related record</dt><dd>{selected.relatedEntity}</dd></div><div><dt>Why it is here</dt><dd>{requestKindLabels[selected.kind]} for you</dd></div></dl><footer><button type="button" className="button button--secondary" onClick={() => completeRequest(selected)} disabled={!canManage || selected.status === "done"}><Check size={14} /> Done</button><Link className="button button--primary" href={selected.href}>Open record <ArrowRight size={14} /></Link></footer></aside>}
    </div>

    <section className="capture-tray"><header><span><h2>Captured for later <HintButton topic="inbox-capture-tray" /></h2><small>{captures.length ? `${captures.length} private ${captures.length === 1 ? "capture" : "captures"}` : "Your low-friction holding space"}</small></span><Link href="/create">Open full Create center <ArrowRight size={13} /></Link></header>{captures.length === 0 ? <div className="capture-tray__empty"><StickyNote size={20} /><span>Notes and links stay here until you choose where they belong. Tasks and ideas keep a capture receipt after routing.</span></div> : <div className="capture-tray__list">{captures.slice(0, 8).map((capture) => <article key={capture.id}><span className={`capture-type capture-type--${capture.type}`}><CaptureIcon type={capture.type} /></span><span><small>{captureTypeLabels[capture.type]} · {captureHubLabels[capture.hub]} · {formatDate(capture.createdAt, true)}</small><strong>{firstLine(capture.content)}</strong>{capture.content !== firstLine(capture.content) && <p>{capture.content}</p>}</span><div>{capture.routedTo ? <Link href={capture.routedTo === "waiting" ? `/waiting?record=${capture.routedRecordId}` : `/ideas?record=${capture.routedRecordId}`}><Check size={13} /> In {capture.routedTo === "waiting" ? "Waiting" : "Ideas"}<ArrowRight size={12} /></Link> : <><button type="button" onClick={() => routeExisting(capture, "waiting")} disabled={!canManage}><ListTodo size={13} /> Make task</button><button type="button" onClick={() => routeExisting(capture, "ideas")} disabled={!canManage}><Lightbulb size={13} /> Send to Ideas</button></>}</div></article>)}</div>}</section>

    {toast && <div className="settings-toast inbox-toast" role="status"><Sparkles size={16} /><span>{toast}</span>{undoAction && <button type="button" onClick={undoLastAction}>{undoAction.label}</button>}</div>}
  </>;
}
