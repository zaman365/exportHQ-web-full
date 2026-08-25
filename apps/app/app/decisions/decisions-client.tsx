"use client";

import {
  Archive,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  FileQuestion,
  History,
  Plus,
  Search,
  Sparkles,
  Undo2,
  Users,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { HintButton } from "../_components/hint-button";
import {
  addRecentRecord,
  decisionSeeds,
  decisionsStorageKey,
  loadCollection,
  storeCollection,
  type DecisionCategory,
  type DecisionRecord,
  type DecisionStatus
} from "../_components/collaboration-data";

const statuses: readonly (DecisionStatus | "all")[] = ["all", "draft", "in_review", "approved", "superseded"];
const categories: readonly (DecisionCategory | "All")[] = ["All", "Market", "Product", "Compliance", "Commercial", "Operations"];

const statusLabel: Record<DecisionStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  superseded: "Superseded"
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function DecisionDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (record: DecisionRecord) => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<DecisionCategory>("Market");
  const [owner, setOwner] = useState("Nadia Rahman");
  const [related, setRelated] = useState("");
  const [firstOption, setFirstOption] = useState("");
  const [secondOption, setSecondOption] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = `decision-${Date.now()}`;
    onCreate({
      id,
      title: title.trim(),
      summary: summary.trim(),
      context: context.trim(),
      category,
      status: "draft",
      owner,
      reviewers: [],
      createdAt: new Date().toISOString(),
      reviewDue: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      relatedEntity: related.trim() || "Workspace decision",
      evidence: [],
      options: [
        { id: `${id}-a`, label: firstOption.trim(), tradeoff: "Trade-off to be documented during review.", selected: false },
        { id: `${id}-b`, label: secondOption.trim(), tradeoff: "Trade-off to be documented during review.", selected: false }
      ],
      rationale: "No rationale recorded yet. Select an option and document the reasoning before approval."
    });
  }

  return <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="settings-modal workflow-create-modal" role="dialog" aria-modal="true" aria-labelledby="decision-dialog-title"><header><span className="settings-modal__icon"><FileQuestion size={19} /></span><span><small>Explainable record</small><h2 id="decision-dialog-title">Create a decision</h2></span><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header><form onSubmit={submit}><div className="workflow-form-grid"><label className="settings-field workflow-field-full"><span>Question or decision title</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Which launch market should we prioritize?" /></label><label className="settings-field workflow-field-full"><span>Short summary</span><input required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="State what this decision will settle." /></label><label className="settings-field workflow-field-full"><span>Context</span><textarea required value={context} onChange={(event) => setContext(event.target.value)} placeholder="Why is this decision needed now?" /></label><label className="settings-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as DecisionCategory)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="settings-field"><span>Accountable owner</span><select value={owner} onChange={(event) => setOwner(event.target.value)}><option>Nadia Rahman</option><option>Anna Keller</option><option>Rahim Chowdhury</option><option>Lisa Morgan</option></select></label><label className="settings-field workflow-field-full"><span>Related record</span><input value={related} onChange={(event) => setRelated(event.target.value)} placeholder="Product, market, buyer, requirement, or workflow" /></label><label className="settings-field"><span>Option A</span><input required value={firstOption} onChange={(event) => setFirstOption(event.target.value)} placeholder="First viable direction" /></label><label className="settings-field"><span>Option B</span><input required value={secondOption} onChange={(event) => setSecondOption(event.target.value)} placeholder="Alternative direction" /></label></div><footer><span>Created as a draft so evidence and trade-offs can be completed safely.</span><button type="button" className="settings-button settings-button--secondary" onClick={onClose}>Cancel</button><button type="submit" className="settings-button settings-button--primary"><Plus size={15} /> Create draft</button></footer></form></section></div>;
}

export default function DecisionsClient({ canManage }: { canManage: boolean }) {
  const [records, setRecords] = useState<DecisionRecord[]>([...decisionSeeds]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DecisionStatus | "all">("all");
  const [category, setCategory] = useState<DecisionCategory | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(decisionSeeds[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const loaded = loadCollection(decisionsStorageKey, decisionSeeds);
    setRecords(loaded);
    const requested = new URLSearchParams(window.location.search).get("record");
    if (requested && loaded.some((record) => record.id === requested)) setSelectedId(requested);
  }, []);

  const filtered = useMemo(() => records.filter((record) => {
    const matchesQuery = `${record.title} ${record.summary} ${record.owner} ${record.relatedEntity} ${record.evidence.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || record.status === status) && (category === "All" || record.category === category);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [records, query, status, category]);
  const selected = records.find((record) => record.id === selectedId);
  const counts = useMemo(() => ({
    open: records.filter((record) => record.status === "draft" || record.status === "in_review").length,
    review: records.filter((record) => record.status === "in_review").length,
    approved: records.filter((record) => record.status === "approved").length,
    evidence: records.reduce((total, record) => total + record.evidence.length, 0)
  }), [records]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function save(next: DecisionRecord[]) {
    setRecords(next);
    storeCollection(decisionsStorageKey, next);
  }

  function createRecord(record: DecisionRecord) {
    const next = [record, ...records];
    save(next);
    addRecentRecord({ id: record.id, type: "decision", title: record.title, createdAt: record.createdAt, href: `/decisions?record=${record.id}` });
    setSelectedId(record.id);
    setCreateOpen(false);
    notify("Decision draft created.");
  }

  function updateRecord(id: string, update: (record: DecisionRecord) => DecisionRecord) {
    save(records.map((record) => record.id === id ? update(record) : record));
  }

  function chooseOption(record: DecisionRecord, optionId: string) {
    updateRecord(record.id, (current) => ({ ...current, options: current.options.map((option) => ({ ...option, selected: option.id === optionId })) }));
    notify("Preferred option recorded. Add rationale and evidence before approval.");
  }

  function advance(record: DecisionRecord) {
    if (record.status === "draft") {
      updateRecord(record.id, (current) => ({ ...current, status: "in_review" }));
      notify("Decision moved to review.");
      return;
    }
    if (record.status === "in_review") {
      if (!record.options.some((option) => option.selected)) {
        notify("Select the approved option before completing the decision.");
        return;
      }
      updateRecord(record.id, (current) => ({ ...current, status: "approved", decidedAt: new Date().toISOString() }));
      notify("Decision approved and preserved in the register.");
    }
  }

  function reopen(record: DecisionRecord) {
    updateRecord(record.id, (current) => {
      const next = { ...current };
      delete next.decidedAt;
      return { ...next, status: "in_review" };
    });
    notify("Decision reopened for review; its prior context is preserved.");
  }

  function supersede(record: DecisionRecord) {
    updateRecord(record.id, (current) => ({ ...current, status: "superseded" }));
    notify("Decision marked superseded and retained for history.");
  }

  return <>
    <section className="workspace-page-head"><div><p>TREVV / WORKFLOWS / DECISIONS</p><h1>Make the reasoning reusable. <HintButton topic="decisions-overview" /></h1><span>Compare viable options, connect evidence, capture approval, and preserve what changed without losing decision history.</span></div><button type="button" className="button button--primary" onClick={() => setCreateOpen(true)} disabled={!canManage}><Plus size={16} /> New decision</button></section>

    <section className="workflow-summary" aria-label="Decision summary"><div><FileQuestion size={18} /><span><strong>{counts.open}</strong><small>open decisions</small></span></div><div><Users size={18} /><span><strong>{counts.review}</strong><small>in review</small></span></div><div><CheckCircle2 size={18} /><span><strong>{counts.approved}</strong><small>approved directions</small></span></div><div><FileCheck2 size={18} /><span><strong>{counts.evidence}</strong><small>linked evidence items</small></span></div></section>

    <div className="workflow-toolbar"><label><Search size={16} /><input aria-label="Search decisions" placeholder="Search decisions, owners, evidence…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filter decisions by category" value={category} onChange={(event) => setCategory(event.target.value as DecisionCategory | "All")}>{categories.map((item) => <option key={item}>{item}</option>)}</select><div role="group" aria-label="Decision status">{statuses.map((item) => <button type="button" className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item === "all" ? "All" : statusLabel[item]}</button>)}</div></div>

    <div className={`record-layout${selected ? " has-detail" : ""}`}><section className="record-list" aria-live="polite"><header><span><p>DECISION REGISTER</p><h2>{filtered.length} {filtered.length === 1 ? "record" : "records"}</h2></span><HintButton topic="decision-lifecycle" /></header>{filtered.length === 0 && <div className="record-empty"><Search size={24} /><strong>No decisions match this view.</strong><button type="button" onClick={() => { setQuery(""); setStatus("all"); setCategory("All"); }}>Clear filters</button></div>}{filtered.map((record) => <article className={`record-row${record.id === selectedId ? " active" : ""}`} key={record.id}><span className={`workflow-status workflow-status--${record.status}`}><CircleDot size={12} />{statusLabel[record.status]}</span><button type="button" className="record-row__copy" onClick={() => setSelectedId(record.id)}><span><small>{record.category} · {record.relatedEntity}</small><strong>{record.title}</strong><p>{record.summary}</p></span><footer><span>{record.owner}</span><span><CalendarClock size={12} /> Review {formatDate(record.reviewDue)}</span><span>{record.evidence.length} evidence</span></footer></button><button type="button" className="record-open" onClick={() => setSelectedId(record.id)} aria-label={`Open ${record.title}`}><ArrowRight size={15} /></button></article>)}</section>

      {selected && <aside className="record-detail"><header><span><p>{selected.category} DECISION</p><h2>{selected.title}</h2></span><button type="button" aria-label="Close decision details" onClick={() => setSelectedId(null)}><X size={17} /></button></header><div className="record-detail__status"><span className={`workflow-status workflow-status--${selected.status}`}><CircleDot size={12} />{statusLabel[selected.status]}</span><small>{selected.decidedAt ? `Decided ${formatDate(selected.decidedAt)}` : `Review by ${formatDate(selected.reviewDue)}`}</small></div><p className="record-detail__summary">{selected.summary}</p><section className="record-detail__section"><span><h3>Context</h3><HintButton topic="decision-record" /></span><p>{selected.context}</p></section><section className="record-detail__section"><span><h3>Options & trade-offs</h3><HintButton topic="decision-options" /></span><div className="decision-options">{selected.options.map((option) => <button type="button" className={option.selected ? "selected" : ""} key={option.id} onClick={() => chooseOption(selected, option.id)} disabled={!canManage || selected.status === "superseded"}><span>{option.selected ? <Check size={13} /> : <CircleDot size={13} />}</span><span><strong>{option.label}</strong><small>{option.tradeoff}</small></span></button>)}</div></section><section className="record-detail__section"><h3>Rationale</h3><p>{selected.rationale}</p></section><section className="record-detail__section"><h3>Evidence & review</h3><div className="evidence-chips">{selected.evidence.length ? selected.evidence.map((item) => <span key={item}><FileCheck2 size={12} />{item}</span>) : <small>No evidence linked yet.</small>}</div><dl><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Reviewers</dt><dd>{selected.reviewers.join(", ") || "Not assigned"}</dd></div><div><dt>Related</dt><dd>{selected.relatedEntity}</dd></div></dl></section><footer>{(selected.status === "draft" || selected.status === "in_review") && <button type="button" className="button button--primary" onClick={() => advance(selected)} disabled={!canManage}>{selected.status === "draft" ? <><Users size={15} /> Start review</> : <><Check size={15} /> Approve decision</>}</button>}{selected.status === "approved" && <><button type="button" className="button button--secondary" onClick={() => reopen(selected)} disabled={!canManage}><Undo2 size={14} /> Reopen</button><button type="button" className="button button--secondary" onClick={() => supersede(selected)} disabled={!canManage}><Archive size={14} /> Supersede</button></>}{selected.status === "superseded" && <span className="record-history-note"><History size={14} /> Historical record retained</span>}</footer></aside>}
    </div>
    {createOpen && <DecisionDialog onClose={() => setCreateOpen(false)} onCreate={createRecord} />}
    {toast && <div className="settings-toast" role="status"><Sparkles size={16} />{toast}</div>}
  </>;
}
