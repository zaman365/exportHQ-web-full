"use client";

import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileQuestion,
  FileStack,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { HintButton } from "../_components/hint-button";
import {
  addRecentRecord,
  createBlueprintFromIdea,
  createDecisionFromIdea,
  decisionSeeds,
  decisionsStorageKey,
  ideaSeeds,
  ideasStorageKey,
  loadCollection,
  storeCollection,
  type IdeaCategory,
  type IdeaRecord,
  type IdeaStage
} from "../_components/collaboration-data";
import { customBlueprintsStorageKey, type BlueprintDefinition } from "../_components/workflow-data";

const stages: readonly IdeaStage[] = ["inbox", "exploring", "shortlisted", "archived"];
const stageLabel: Record<IdeaStage, string> = { inbox: "Inbox", exploring: "Exploring", shortlisted: "Shortlisted", archived: "Archived" };
const categories: readonly (IdeaCategory | "All")[] = ["All", "Market", "Product", "Buyer", "Compliance", "Operations"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function Meter({ value, label }: { value: 1 | 2 | 3; label: string }) {
  return <span className="idea-meter" aria-label={`${label}: ${value} of 3`}><small>{label}</small><i>{[1, 2, 3].map((step) => <b className={step <= value ? "active" : ""} key={step} />)}</i></span>;
}

function IdeaDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (idea: IdeaRecord) => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("Market");
  const [owner, setOwner] = useState("Nadia Rahman");
  const [related, setRelated] = useState("");
  const [notes, setNotes] = useState("");
  const [impact, setImpact] = useState<1 | 2 | 3>(2);
  const [effort, setEffort] = useState<1 | 2 | 3>(2);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({ id: `idea-${Date.now()}`, title: title.trim(), summary: summary.trim(), category, stage: "inbox", owner, createdAt: new Date().toISOString(), votes: 1, impact, effort, relatedEntity: related.trim() || "Workspace opportunity", notes: notes.trim() || "Validate the problem, expected outcome, and smallest useful next step." });
  }

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="settings-modal workflow-create-modal" role="dialog" aria-modal="true" aria-labelledby="idea-dialog-title"><header><span className="settings-modal__icon"><Lightbulb size={19} /></span><span><small>Opportunity inbox</small><h2 id="idea-dialog-title">Capture an idea</h2></span><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header><form onSubmit={submit}><div className="workflow-form-grid"><label className="settings-field workflow-field-full"><span>Idea title</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A short, outcome-oriented idea" /></label><label className="settings-field workflow-field-full"><span>What could improve?</span><textarea required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe the opportunity without prescribing every implementation detail." /></label><label className="settings-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="settings-field"><span>Owner</span><select value={owner} onChange={(event) => setOwner(event.target.value)}><option>Nadia Rahman</option><option>Anna Keller</option><option>Rahim Chowdhury</option><option>Lisa Morgan</option></select></label><label className="settings-field"><span>Expected impact</span><select value={impact} onChange={(event) => setImpact(Number(event.target.value) as 1 | 2 | 3)}><option value="1">Low</option><option value="2">Medium</option><option value="3">High</option></select></label><label className="settings-field"><span>Expected effort</span><select value={effort} onChange={(event) => setEffort(Number(event.target.value) as 1 | 2 | 3)}><option value="1">Low</option><option value="2">Medium</option><option value="3">High</option></select></label><label className="settings-field workflow-field-full"><span>Related record</span><input value={related} onChange={(event) => setRelated(event.target.value)} placeholder="Product, market, buyer, or workflow" /></label><label className="settings-field workflow-field-full"><span>Notes or first validation step</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What should someone verify next?" /></label></div><footer><span>Ideas begin in the Inbox and can be promoted when the next record type is clear.</span><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary"><Plus size={15} /> Add idea</button></footer></form></section></div>;
}

export default function IdeasClient({ canManage }: { canManage: boolean }) {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([...ideaSeeds]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IdeaCategory | "All">("All");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(ideaSeeds[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const loaded = loadCollection(ideasStorageKey, ideaSeeds);
    setIdeas(loaded);
    const requested = new URLSearchParams(window.location.search).get("record");
    if (requested && loaded.some((idea) => idea.id === requested)) setSelectedId(requested);
  }, []);

  const visibleStages = useMemo(() => stages.filter((stage) => showArchived || stage !== "archived"), [showArchived]);
  const filtered = useMemo(() => ideas.filter((idea) => `${idea.title} ${idea.summary} ${idea.owner} ${idea.relatedEntity} ${idea.notes}`.toLowerCase().includes(query.toLowerCase()) && (category === "All" || idea.category === category)), [ideas, query, category]);
  const selected = ideas.find((idea) => idea.id === selectedId);
  const totalVotes = ideas.reduce((total, idea) => total + idea.votes, 0);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function save(next: IdeaRecord[]) {
    setIdeas(next);
    storeCollection(ideasStorageKey, next);
  }

  function createIdea(idea: IdeaRecord) {
    save([idea, ...ideas]);
    addRecentRecord({ id: idea.id, type: "idea", title: idea.title, createdAt: idea.createdAt, href: `/ideas?record=${idea.id}` });
    setSelectedId(idea.id);
    setCreateOpen(false);
    notify("Idea added to the Inbox.");
  }

  function updateIdea(id: string, update: (idea: IdeaRecord) => IdeaRecord) {
    save(ideas.map((idea) => idea.id === id ? update(idea) : idea));
  }

  function moveIdea(idea: IdeaRecord, stage: IdeaStage) {
    updateIdea(idea.id, (current) => ({ ...current, stage }));
    notify(`Idea moved to ${stageLabel[stage]}.`);
  }

  function vote(idea: IdeaRecord) {
    updateIdea(idea.id, (current) => ({ ...current, votes: current.votes + 1 }));
    notify("Vote added as a prioritization signal.");
  }

  function promoteToDecision(idea: IdeaRecord) {
    const decision = createDecisionFromIdea(idea);
    const decisions = loadCollection(decisionsStorageKey, decisionSeeds);
    storeCollection(decisionsStorageKey, [decision, ...decisions]);
    updateIdea(idea.id, (current) => ({ ...current, stage: "shortlisted", promotedTo: "decision", promotedRecordId: decision.id }));
    addRecentRecord({ id: decision.id, type: "decision", title: decision.title, createdAt: decision.createdAt, href: `/decisions?record=${decision.id}` });
    notify("Decision draft created from this idea.");
  }

  function promoteToBlueprint(idea: IdeaRecord) {
    const blueprint = createBlueprintFromIdea(idea);
    const custom = loadCollection<BlueprintDefinition>(customBlueprintsStorageKey, []);
    storeCollection(customBlueprintsStorageKey, [blueprint, ...custom]);
    updateIdea(idea.id, (current) => ({ ...current, stage: "shortlisted", promotedTo: "blueprint", promotedRecordId: blueprint.id }));
    addRecentRecord({ id: blueprint.id, type: "blueprint", title: blueprint.title, createdAt: new Date().toISOString(), href: `/blueprints?record=${blueprint.id}` });
    notify("Reusable Blueprint created from this idea.");
  }

  return <>
    <section className="workspace-page-head"><div><p>TREVV / WORKFLOWS / IDEAS</p><h1>Capture possibility. Promote clarity. <HintButton topic="ideas-overview" /></h1><span>Keep raw opportunities lightweight, compare impact and effort, then turn proven ideas into a Decision or reusable Blueprint.</span></div><button type="button" className="button button--primary" onClick={() => setCreateOpen(true)} disabled={!canManage}><Plus size={16} /> Add idea</button></section>

    <section className="workflow-summary" aria-label="Idea summary"><div><Lightbulb size={18} /><span><strong>{ideas.filter((idea) => idea.stage !== "archived").length}</strong><small>active ideas</small></span></div><div><TrendingUp size={18} /><span><strong>{ideas.filter((idea) => idea.stage === "shortlisted").length}</strong><small>shortlisted</small></span></div><div><ThumbsUp size={18} /><span><strong>{totalVotes}</strong><small>team votes</small></span></div><div><CheckCircle2 size={18} /><span><strong>{ideas.filter((idea) => idea.promotedTo).length}</strong><small>promoted records</small></span></div></section>

    <div className="workflow-toolbar idea-toolbar"><label><Search size={16} /><input aria-label="Search ideas" placeholder="Search ideas, owners, notes…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filter ideas by category" value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory | "All")}>{categories.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className={`workflow-archive-toggle${showArchived ? " active" : ""}`} onClick={() => setShowArchived((current) => !current)}><Archive size={14} />{showArchived ? "Hide archived" : "Show archived"}</button></div>

    <div className={`idea-layout${selected ? " has-detail" : ""}`}><section className="idea-board" aria-label="Idea pipeline">{visibleStages.map((stage) => { const stageIdeas = filtered.filter((idea) => idea.stage === stage); return <div className="idea-column" key={stage}><header><span><CircleDot size={13} /><strong>{stageLabel[stage]}</strong></span><b>{stageIdeas.length}</b></header><div>{stageIdeas.length === 0 && <span className="idea-column__empty">No ideas in this stage.</span>}{stageIdeas.map((idea) => <article className={selectedId === idea.id ? "active" : ""} key={idea.id}><button type="button" className="idea-card__body" onClick={() => setSelectedId(idea.id)}><small>{idea.category} · {idea.relatedEntity}</small><strong>{idea.title}</strong><p>{idea.summary}</p><span><Meter value={idea.impact} label="Impact" /><Meter value={idea.effort} label="Effort" /></span></button><footer><button type="button" onClick={() => vote(idea)} disabled={!canManage} aria-label={`Vote for ${idea.title}`}><ThumbsUp size={13} />{idea.votes}</button><span>{idea.owner}</span><button type="button" onClick={() => setSelectedId(idea.id)} aria-label={`Open ${idea.title}`}><ChevronRight size={14} /></button></footer></article>)}</div></div>; })}</section>

      {selected && <aside className="idea-detail"><header><span><p>{selected.category} IDEA</p><h2>{selected.title}</h2></span><button type="button" aria-label="Close idea details" onClick={() => setSelectedId(null)}><X size={17} /></button></header><p className="idea-detail__summary">{selected.summary}</p><div className="idea-detail__facts"><span><ThumbsUp size={14} /><strong>{selected.votes}</strong><small>Votes</small></span><span><TrendingUp size={14} /><strong>{selected.impact}/3</strong><small>Impact</small></span><span><CircleDot size={14} /><strong>{selected.effort}/3</strong><small>Effort</small></span></div><section><span><h3>Validation note</h3><HintButton topic="idea-prioritization" /></span><p>{selected.notes}</p></section><dl><div><dt>Stage</dt><dd><select value={selected.stage} onChange={(event) => moveIdea(selected, event.target.value as IdeaStage)} disabled={!canManage}>{stages.map((stage) => <option value={stage} key={stage}>{stageLabel[stage]}</option>)}</select></dd></div><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Captured</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt>Related</dt><dd>{selected.relatedEntity}</dd></div></dl>{selected.promotedTo && <a className="idea-promoted" href={selected.promotedTo === "decision" ? "/decisions" : "/blueprints"}><CheckCircle2 size={15} /> Promoted to {selected.promotedTo}<ArrowRight size={13} /></a>}<section className="idea-promote"><span><h3>Promote the idea</h3><HintButton topic="idea-promote" /></span><p>Use a Decision when options need approval. Use a Blueprint when the steps are understood and should repeat.</p><button type="button" onClick={() => promoteToDecision(selected)} disabled={!canManage}><FileQuestion size={15} /><span><strong>Create Decision</strong><small>Compare options and capture rationale</small></span><ArrowRight size={14} /></button><button type="button" onClick={() => promoteToBlueprint(selected)} disabled={!canManage}><FileStack size={15} /><span><strong>Create Blueprint</strong><small>Turn the idea into reusable steps</small></span><ArrowRight size={14} /></button></section><footer><button type="button" className="button button--secondary" onClick={() => vote(selected)} disabled={!canManage}><ThumbsUp size={14} /> Vote ({selected.votes})</button><button type="button" className="button button--secondary" onClick={() => moveIdea(selected, selected.stage === "archived" ? "inbox" : "archived")} disabled={!canManage}><Archive size={14} />{selected.stage === "archived" ? "Restore" : "Archive"}</button></footer></aside>}
    </div>
    {createOpen && <IdeaDialog onClose={() => setCreateOpen(false)} onCreate={createIdea} />}
    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}
