"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CirclePlus,
  FileQuestion,
  FileStack,
  History,
  Hourglass,
  Lightbulb,
  PackagePlus,
  Paperclip,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Responsibility, TaskStatus } from "@exporthq/domain";
import { HintButton } from "../_components/hint-button";
import {
  addRecentRecord,
  decisionSeeds,
  decisionsStorageKey,
  ideaSeeds,
  ideasStorageKey,
  loadCollection,
  recentCreatedStorageKey,
  responsibilityLabel,
  storeCollection,
  type CreateRecordType,
  type DecisionCategory,
  type DecisionRecord,
  type IdeaCategory,
  type IdeaRecord,
  type RecentCreatedRecord
} from "../_components/collaboration-data";
import {
  blueprintRunsStorageKey,
  customBlueprintsStorageKey,
  type BlueprintDefinition,
  type BlueprintRun
} from "../_components/workflow-data";

const creationTypes = [
  { id: "decision", label: "Decision", description: "Compare options, connect evidence, and capture an approved direction.", icon: FileQuestion, color: "green" },
  { id: "idea", label: "Idea", description: "Capture an opportunity before its next workflow is known.", icon: Lightbulb, color: "amber" },
  { id: "task", label: "Waiting task", description: "Create a handoff with a clear owner, due checkpoint, and next step.", icon: Hourglass, color: "blue" },
  { id: "blueprint", label: "Blueprint", description: "Turn understood, repeatable work into an ordered reusable playbook.", icon: FileStack, color: "purple" }
] as const;

const destination: Record<CreateRecordType, string> = { decision: "/decisions", idea: "/ideas", task: "/waiting", blueprint: "/blueprints" };

function defaultDue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(value));
}

export default function CreateClient({ canManage }: { canManage: boolean }) {
  const [type, setType] = useState<CreateRecordType>("decision");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [related, setRelated] = useState("");
  const [owner, setOwner] = useState("Nadia Rahman");
  const [decisionCategory, setDecisionCategory] = useState<DecisionCategory>("Market");
  const [ideaCategory, setIdeaCategory] = useState<IdeaCategory>("Market");
  const [responsibility, setResponsibility] = useState<Responsibility>("customer");
  const [blueprintCategory, setBlueprintCategory] = useState<BlueprintDefinition["category"]>("Market entry");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [steps, setSteps] = useState("");
  const [dueAt, setDueAt] = useState(defaultDue);
  const [recent, setRecent] = useState<RecentCreatedRecord[]>([]);
  const [counts, setCounts] = useState<Record<CreateRecordType, number>>({ decision: 0, idea: 0, task: 0, blueprint: 0 });
  const [toast, setToast] = useState("");

  const selectedType = creationTypes.find((item) => item.id === type) ?? creationTypes[0];

  function refresh() {
    setRecent(loadCollection<RecentCreatedRecord>(recentCreatedStorageKey, []));
    setCounts({
      decision: loadCollection(decisionsStorageKey, decisionSeeds).length,
      idea: loadCollection(ideasStorageKey, ideaSeeds).length,
      task: loadCollection<BlueprintRun>(blueprintRunsStorageKey, []).length,
      blueprint: loadCollection<BlueprintDefinition>(customBlueprintsStorageKey, []).length
    });
  }

  useEffect(refresh, []);

  const formReady = useMemo(() => {
    if (!title.trim() || !summary.trim()) return false;
    if (type === "decision") return Boolean(optionA.trim() && optionB.trim());
    if (type === "blueprint") return steps.split("\n").filter((step) => step.trim()).length >= 2;
    return true;
  }, [title, summary, type, optionA, optionB, steps]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  }

  function resetForm() {
    setTitle("");
    setSummary("");
    setRelated("");
    setOptionA("");
    setOptionB("");
    setSteps("");
    setDueAt(defaultDue());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !formReady) return;
    const id = `${type}-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const recordTitle = title.trim();

    if (type === "decision") {
      const record: DecisionRecord = { id, title: recordTitle, summary: summary.trim(), context: summary.trim(), category: decisionCategory, status: "draft", owner, reviewers: [], createdAt, reviewDue: new Date(dueAt).toISOString(), relatedEntity: related.trim() || "Workspace decision", evidence: [], options: [{ id: `${id}-a`, label: optionA.trim(), tradeoff: "Trade-off to be documented during review.", selected: false }, { id: `${id}-b`, label: optionB.trim(), tradeoff: "Trade-off to be documented during review.", selected: false }], rationale: "No rationale recorded yet. Complete the review before approval." };
      storeCollection(decisionsStorageKey, [record, ...loadCollection(decisionsStorageKey, decisionSeeds)]);
    }

    if (type === "idea") {
      const record: IdeaRecord = { id, title: recordTitle, summary: summary.trim(), category: ideaCategory, stage: "inbox", owner, createdAt, votes: 1, impact: 2, effort: 2, relatedEntity: related.trim() || "Workspace opportunity", notes: "Validate the problem, impact, effort, and smallest useful next step." };
      storeCollection(ideasStorageKey, [record, ...loadCollection(ideasStorageKey, ideaSeeds)]);
    }

    if (type === "task") {
      const ownerName = responsibility === "customer" ? owner : responsibility === "export_hq" ? "Anna Keller" : "External partner";
      const status: TaskStatus = responsibility === "customer" ? "waiting_customer" : responsibility === "export_hq" ? "waiting_export_hq" : "waiting_third_party";
      const record: BlueprintRun = { id, blueprintId: "manual-handoff", title: recordTitle, description: summary.trim(), createdAt, dueAt: new Date(dueAt).toISOString(), responsibility, ownerName, relatedEntity: related.trim() || "Workspace handoff", status, totalSteps: 1, completedSteps: 0 };
      storeCollection(blueprintRunsStorageKey, [record, ...loadCollection<BlueprintRun>(blueprintRunsStorageKey, [])]);
    }

    if (type === "blueprint") {
      const parsedSteps = steps.split("\n").map((step) => step.trim()).filter(Boolean);
      const record: BlueprintDefinition = { id, title: recordTitle, description: summary.trim(), category: blueprintCategory, steps: parsedSteps, estimate: "Custom", owner, uses: 0, updatedAt: "Just now", builtIn: false };
      storeCollection(customBlueprintsStorageKey, [record, ...loadCollection<BlueprintDefinition>(customBlueprintsStorageKey, [])]);
    }

    addRecentRecord({ id, type, title: recordTitle, createdAt, href: `${destination[type]}?record=${id}` });
    resetForm();
    refresh();
    notify(`${selectedType.label} created and available in ${selectedType.label === "Waiting task" ? "Waiting" : `${selectedType.label}s`}.`);
  }

  return <>
    <section className="workspace-page-head"><div><p>TREVV / WORKFLOWS / CREATE</p><h1>Create the right kind of record. <HintButton topic="create-overview" /></h1><span>Start work in one place without flattening everything into a task. Choose the record that matches the clarity, ownership, and repeatability you have now.</span></div><Link className="button button--secondary" href="/learn?topic=create-right-record">Which type should I use? <ArrowRight size={14} /></Link></section>

    <section className="create-type-grid" aria-label="Creation types">{creationTypes.map(({ id, label, description, icon: Icon, color }) => <button type="button" className={`${type === id ? "active " : ""}create-type-card create-type-card--${color}`} key={id} onClick={() => setType(id)}><span><Icon size={19} /></span><strong>{label}</strong><p>{description}</p><small>{counts[id]} in workspace <ArrowRight size={12} /></small></button>)}</section>

    <div className="create-layout"><section className="create-form-card"><header><span className={`create-form-icon create-form-icon--${selectedType.color}`}><selectedType.icon size={20} /></span><span><p>NEW {selectedType.label.toUpperCase()}</p><h2>{selectedType.label}</h2></span><HintButton topic="create-right-record" /></header><form onSubmit={submit}><div className="workflow-form-grid"><label className="settings-field workflow-field-full"><span>Title</span><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "decision" ? "The question or direction to settle" : type === "idea" ? "The opportunity worth exploring" : type === "task" ? "The observable handoff or output" : "The repeatable outcome"} /></label><label className="settings-field workflow-field-full"><span>{type === "idea" ? "Opportunity" : type === "task" ? "Required next step" : "Purpose and context"}</span><textarea required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Give the next person enough context to understand what good looks like." /></label><label className="settings-field"><span>Accountable owner</span><select value={owner} onChange={(event) => setOwner(event.target.value)} disabled={type === "task" && responsibility !== "customer"}><option>Nadia Rahman</option><option>Kamal Hossain</option><option>Anna Keller</option><option>Rahim Chowdhury</option><option>Lisa Morgan</option></select></label><label className="settings-field"><span>Related record</span><input value={related} onChange={(event) => setRelated(event.target.value)} placeholder="Product, market, buyer, requirement…" /></label>

        {type === "decision" && <><label className="settings-field"><span>Category</span><select value={decisionCategory} onChange={(event) => setDecisionCategory(event.target.value as DecisionCategory)}><option>Market</option><option>Product</option><option>Compliance</option><option>Commercial</option><option>Operations</option></select></label><label className="settings-field"><span>Review due</span><input type="date" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><label className="settings-field"><span>Option A</span><input required value={optionA} onChange={(event) => setOptionA(event.target.value)} placeholder="First viable direction" /></label><label className="settings-field"><span>Option B</span><input required value={optionB} onChange={(event) => setOptionB(event.target.value)} placeholder="Alternative direction" /></label></>}

        {type === "idea" && <><label className="settings-field"><span>Category</span><select value={ideaCategory} onChange={(event) => setIdeaCategory(event.target.value as IdeaCategory)}><option>Market</option><option>Product</option><option>Buyer</option><option>Compliance</option><option>Operations</option></select></label><label className="settings-field"><span>Starting stage</span><input value="Inbox" disabled /></label></>}

        {type === "task" && <><label className="settings-field"><span>Waiting on</span><select value={responsibility} onChange={(event) => setResponsibility(event.target.value as Responsibility)}><option value="customer">Customer</option><option value="export_hq">Export HQ</option><option value="third_party">Third party</option></select><small>{responsibilityLabel(responsibility)} becomes the ownership queue.</small></label><label className="settings-field"><span>Due checkpoint</span><input type="date" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label></>}

        {type === "blueprint" && <><label className="settings-field workflow-field-full"><span>Category</span><select value={blueprintCategory} onChange={(event) => setBlueprintCategory(event.target.value as BlueprintDefinition["category"])}><option>Market entry</option><option>Compliance</option><option>Product</option><option>Sales</option><option>Trade operations</option></select></label><label className="settings-field workflow-field-full"><span>Ordered steps — one per line</span><textarea required className="create-steps" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder={"Confirm the target outcome\nCollect the required context\nAssign the accountable owner\nReview and approve"} /><small>Add at least two observable steps. A strong step produces a record, evidence, decision, or handoff.</small></label></>}
      </div><footer><button type="button" className="settings-button settings-button--secondary" onClick={resetForm}><RotateCcw size={14} /> Clear</button><span>{!canManage ? "Your role can view but not create workflow records." : formReady ? `Ready to create in ${selectedType.label === "Waiting task" ? "Waiting" : selectedType.label}` : "Complete the required fields to create this record."}</span><button type="submit" className="settings-button settings-button--primary" disabled={!canManage || !formReady}><Check size={15} /> Create {selectedType.label}</button></footer></form></section>

      <aside className="create-side"><section><header><History size={16} /><span><strong>Recently created</strong><small>Across all workflow types</small></span></header>{recent.length === 0 ? <div className="create-recent-empty"><CirclePlus size={20} /><span>New records created here will appear in this list.</span></div> : <div className="create-recent-list">{recent.slice(0, 6).map((record) => <Link href={record.href} key={record.id}><span className={`create-record-type create-record-type--${record.type}`}>{record.type.charAt(0).toUpperCase()}</span><span><strong>{record.title}</strong><small>{record.type} · {formatDate(record.createdAt)}</small></span><ArrowRight size={13} /></Link>)}</div>}</section><section className="create-support"><strong>Need a different starting point?</strong><Link href="/onboarding"><PackagePlus size={15} /><span><strong>Add product or company context</strong><small>Use guided setup for structured source data.</small></span><ArrowRight size={13} /></Link><Link href="/#documents"><Paperclip size={15} /><span><strong>Upload supporting evidence</strong><small>Add a file before linking it to a decision.</small></span><ArrowRight size={13} /></Link><Link href="/learn?topic=create-right-record"><Sparkles size={15} /><span><strong>Open the creation guide</strong><small>See examples and common record mistakes.</small></span><ArrowRight size={13} /></Link></section></aside>
    </div>
    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}
