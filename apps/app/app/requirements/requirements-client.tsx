"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Filter,
  Handshake,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import { HintButton } from "../_components/hint-button";
import {
  requirementRegisterSummary,
  requirementSectionOptions,
  type RequirementRegisterRecord,
  type RequirementRegisterStatus
} from "./requirements-data";

const statusLabels: Readonly<Record<RequirementRegisterStatus, string>> = {
  not_started: "Not started",
  in_progress: "In progress",
  evidence_added: "Evidence added",
  under_review: "Under review",
  compliant: "Compliant",
  action_required: "Action required",
  blocked: "Blocked"
};

const statusFilters: ReadonlyArray<{ id: "all" | RequirementRegisterStatus; label: string }> = [
  { id: "all", label: "All states" },
  ...Object.entries(statusLabels).map(([id, label]) => ({ id: id as RequirementRegisterStatus, label }))
];

function StatusBadge({ value }: { value: RequirementRegisterStatus }) {
  return <span className={`requirement-state requirement-state--${value}`}>{value === "compliant" ? <CheckCircle2 size={12} /> : value === "blocked" || value === "action_required" ? <AlertTriangle size={12} /> : <CircleGauge size={12} />}{statusLabels[value]}</span>;
}

export default function RequirementsClient({ records }: { records: readonly RequirementRegisterRecord[] }) {
  const [section, setSection] = useState("all");
  const [status, setStatus] = useState<"all" | RequirementRegisterStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(records.find((record) => record.status === "blocked")?.id ?? records[0]?.id ?? "");
  const summary = useMemo(() => requirementRegisterSummary(records), [records]);
  const visible = useMemo(() => records.filter((record) => {
    const matchesSection = section === "all" || record.section === section;
    const matchesStatus = status === "all" || record.status === status;
    const haystack = `${record.title} ${record.sectionLabel} ${record.memberSummary} ${record.owner} ${record.sources.map((source) => source.publisher).join(" ")}`.toLowerCase();
    return matchesSection && matchesStatus && haystack.includes(query.trim().toLowerCase());
  }), [query, records, section, status]);
  const selected = records.find((record) => record.id === selectedId) ?? visible[0];

  return <div className="module-page requirements-page">
    <header className="module-page__header">
      <div><small>MANAGE · CONTROL REGISTER</small><h1>Requirements <HintButton topic="requirements-register" /></h1><p>See what applies, why it applies, the evidence expected, and who owns the next review.</p></div>
      <div><Link className="button" href="/learn?topic=requirements-register"><BookOpenCheck size={15} /> Learn the register</Link><Link className="button button--primary" href="/readiness"><ShieldCheck size={15} /> Continue assessment</Link></div>
    </header>

    <section className="module-truth-notice"><Sparkles size={18} /><div><strong>Conditional Germany apparel register</strong><p>This view is generated for a Bangladesh manufacturer exporting cotton apparel wholesale to Germany. Change the lane in Export readiness to regenerate what applies.</p></div><Link href="/readiness">Review lane context <ArrowRight size={13} /></Link></section>

    <section className="module-metrics" aria-label="Requirement register summary">
      <article><span><FileSearch size={17} /></span><div><small>Applicable</small><strong>{summary.total}</strong><p>requirements in this lane</p></div></article>
      <article className="is-danger"><span><AlertTriangle size={17} /></span><div><small>Blocked</small><strong>{summary.blockers}</strong><p>cannot be overridden by score</p></div></article>
      <article className="is-warning"><span><FileCheck2 size={17} /></span><div><small>Evidence review</small><strong>{summary.inReview}</strong><p>added or under review</p></div></article>
      <article><span><CheckCircle2 size={17} /></span><div><small>Compliant</small><strong>{summary.compliant}</strong><p>with recorded evidence</p></div></article>
    </section>

    <section className="module-workspace requirements-workspace">
      <div className="module-register">
        <header className="requirements-toolbar"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirement, authority, owner or evidence" aria-label="Search requirements" /></label><label><Filter size={14} /><select aria-label="Requirement area" value={section} onChange={(event) => setSection(event.target.value)}>{requirementSectionOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><label><CircleGauge size={14} /><select aria-label="Requirement status" value={status} onChange={(event) => setStatus(event.target.value as "all" | RequirementRegisterStatus)}>{statusFilters.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label></header>
        <div className="requirements-list">
          {visible.map((record) => <button className={selected?.id === record.id ? "active" : ""} type="button" onClick={() => setSelectedId(record.id)} key={record.id}>
            <span className={`requirement-priority requirement-priority--${record.priority}`}>{record.priority}</span>
            <span className="requirements-list__main"><small>{record.sectionLabel}</small><strong>{record.title}</strong><span>{record.memberSummary}</span><em>{record.owner} · Review {record.nextReview}</em></span>
            <span className="requirements-list__meta"><StatusBadge value={record.status} /><i>{record.evidenceCount} evidence</i><ChevronRight size={15} /></span>
          </button>)}
          {!visible.length && <div className="module-empty"><Filter size={24} /><h3>No requirements match these filters</h3><p>Clear a filter to return to the complete register.</p><button type="button" onClick={() => { setQuery(""); setSection("all"); setStatus("all"); }}>Clear filters</button></div>}
        </div>
      </div>

      {selected && <aside className="module-detail requirement-detail">
        <header><div><small>{selected.sectionLabel} · {selected.priority}</small><h2>{selected.title}</h2></div><StatusBadge value={selected.status} /></header>
        <section className="requirement-detail__checkpoint"><small>CONTROL CHECKPOINT</small><p>{selected.checkpoint}</p></section>
        <dl><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Next review</dt><dd>{selected.nextReview}</dd></div><div><dt>Evidence linked</dt><dd>{selected.evidenceCount}</dd></div><div><dt>Weight</dt><dd>{selected.weight} points</dd></div></dl>
        <section><small>NEXT RESOLUTION STEPS</small><ol>{selected.fullResolution?.resolution.map((step) => <li key={step}>{step}</li>)}</ol></section>
        <section><small>EVIDENCE EXPECTED</small><ul>{selected.fullResolution?.evidence.map((item) => <li key={item}><FileCheck2 size={13} /> {item}</li>)}</ul></section>
        <section><small>SOURCE TRAIL</small><div className="requirement-sources">{selected.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span><strong>{source.label}</strong><small>{source.publisher} · reviewed {source.reviewedAt}</small></span><ExternalLink size={13} /></a>)}</div></section>
        <footer><Link href={`/learn?topic=${encodeURIComponent(selected.learnTopic)}`}><BookOpenCheck size={14} /> Learn how to resolve</Link>{selected.hasProviderSupport && <Link href={`/readiness?requirement=${encodeURIComponent(selected.id)}`}><Handshake size={14} /> Find qualified help</Link>}<Link href="/readiness">Open in readiness <ArrowRight size={13} /></Link></footer>
      </aside>}
    </section>
  </div>;
}
