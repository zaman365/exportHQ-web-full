"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Globe2,
  Handshake,
  ListFilter,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  UserRoundCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import { HintButton } from "../_components/hint-button";
import {
  buyerPipelineSummary,
  buyerStageCatalog,
  type BuyerPipelineRecord,
  type BuyerStage
} from "./buyers-data";

const stageLabels = Object.fromEntries(buyerStageCatalog.map((stage) => [stage.id, stage.label])) as Record<BuyerStage, string>;

function initials(company: string) {
  return company.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function FitBadge({ value }: { value: number }) {
  const tone = value >= 88 ? "strong" : value >= 82 ? "good" : "watch";
  return <span className={`buyer-fit buyer-fit--${tone}`}><Target size={12} /> {value}% fit</span>;
}

export default function BuyersClient({ canManage, initialBuyers }: { canManage: boolean; initialBuyers: readonly BuyerPipelineRecord[] }) {
  const [records, setRecords] = useState(() => [...initialBuyers]);
  const [stage, setStage] = useState<"all" | BuyerStage>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialBuyers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const summary = useMemo(() => buyerPipelineSummary(records), [records]);
  const visible = useMemo(() => records.filter((buyer) => {
    const matchesStage = stage === "all" || buyer.stage === stage;
    const haystack = `${buyer.company} ${buyer.country} ${buyer.segment} ${buyer.product} ${buyer.owner} ${buyer.lane}`.toLowerCase();
    return matchesStage && haystack.includes(query.trim().toLowerCase());
  }), [query, records, stage]);
  const selected = records.find((buyer) => buyer.id === selectedId) ?? visible[0];

  function moveBuyer(nextStage: BuyerStage) {
    if (!selected || !canManage) return;
    setRecords((current) => current.map((buyer) => buyer.id === selected.id ? { ...buyer, stage: nextStage } : buyer));
    setMessage(`${selected.company} moved to ${stageLabels[nextStage]}. This preview change stays in this browser session.`);
  }

  return <div className="module-page buyer-page">
    <header className="module-page__header">
      <div><small>GROW · BUYER DEVELOPMENT</small><h1>Buyers <HintButton topic="buyer-pipeline-overview" /></h1><p>Turn market fit into a controlled pipeline with qualification, next actions, risk checks, and lane context.</p></div>
      <div><Link className="button" href="/opportunities"><Globe2 size={15} /> Find opportunities</Link><Link className="button button--primary" href="/team?view=messages"><Handshake size={15} /> Coordinate outreach</Link></div>
    </header>

    <section className="module-truth-notice"><Sparkles size={18} /><div><strong>Illustrative buyer workspace</strong><p>These fictional records demonstrate the operating workflow. No live buyer directory, enrichment feed, or outreach integration is represented as connected.</p></div><Link href="/learn?topic=buyer-pipeline-overview">How buyer work is controlled <ArrowRight size={13} /></Link></section>

    <section className="module-metrics" aria-label="Buyer pipeline summary">
      <article><span><Building2 size={17} /></span><div><small>Pipeline</small><strong>{summary.total}</strong><p>buyer organizations</p></div></article>
      <article><span><UserRoundCheck size={17} /></span><div><small>Qualified</small><strong>{summary.qualified}</strong><p>past identification</p></div></article>
      <article><span><CircleDollarSign size={17} /></span><div><small>Commercial</small><strong>{summary.commercial}</strong><p>negotiation or order ready</p></div></article>
      <article className={summary.needsRiskReview ? "is-warning" : ""}><span><ShieldAlert size={17} /></span><div><small>Risk review</small><strong>{summary.needsRiskReview}</strong><p>needs a controlled check</p></div></article>
    </section>

    <section className="pipeline-rail" aria-label="Buyer stages">
      <button className={stage === "all" ? "active" : ""} type="button" onClick={() => setStage("all")}><span>All buyers</span><b>{records.length}</b></button>
      {buyerStageCatalog.map((item) => <button className={stage === item.id ? "active" : ""} type="button" onClick={() => setStage(item.id)} key={item.id}><span>{item.label}</span><b>{records.filter((buyer) => buyer.stage === item.id).length}</b></button>)}
    </section>

    <section className="module-workspace">
      <div className="module-register">
        <header><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, market, product or owner" aria-label="Search buyers" /></label><span><ListFilter size={14} /> {visible.length} shown</span></header>
        <div className="buyer-list">
          {visible.map((buyer) => <button className={selected?.id === buyer.id ? "active" : ""} type="button" onClick={() => { setSelectedId(buyer.id); setMessage(""); }} key={buyer.id}>
            <span className="buyer-avatar">{initials(buyer.company)}</span>
            <span className="buyer-list__main"><small>{buyer.country} · {buyer.segment}</small><strong>{buyer.company}</strong><span>{buyer.product} · {buyer.lane}</span><em><CalendarClock size={12} /> {buyer.nextAction} · {buyer.dueLabel}</em></span>
            <span className="buyer-list__meta"><FitBadge value={buyer.fitScore} /><i>{stageLabels[buyer.stage]}</i><ArrowRight size={15} /></span>
          </button>)}
          {!visible.length && <div className="module-empty"><Filter size={24} /><h3>No buyers match these filters</h3><p>Clear the search or choose another pipeline stage.</p><button type="button" onClick={() => { setQuery(""); setStage("all"); }}>Clear filters</button></div>}
        </div>
      </div>

      {selected && <aside className="module-detail buyer-detail">
        <header><div className="buyer-avatar buyer-avatar--large">{initials(selected.company)}</div><div><small>{selected.country} · {selected.city}</small><h2>{selected.company}</h2><p>{selected.segment}</p></div><FitBadge value={selected.fitScore} /></header>
        <div className="buyer-detail__stage"><label>Pipeline stage<select aria-label="Buyer pipeline stage" value={selected.stage} disabled={!canManage} onChange={(event) => moveBuyer(event.target.value as BuyerStage)}>{buyerStageCatalog.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><span>{selected.confidence} confidence</span></div>
        {message && <p className="module-message" role="status"><CheckCircle2 size={14} /> {message}</p>}
        <section><small>NEXT CONTROLLED ACTION</small><h3>{selected.nextAction}</h3><p><CalendarClock size={14} /> {selected.dueLabel} · {selected.owner}</p></section>
        <dl><div><dt>Export lane</dt><dd>{selected.lane}</dd></div><div><dt>Offer</dt><dd>{selected.product}</dd></div><div><dt>Likely contact</dt><dd>{selected.contactRole}</dd></div><div><dt>Indicative annual value</dt><dd>{selected.estimatedAnnualValue}</dd></div><div><dt>Last signal</dt><dd>{selected.lastSignal}</dd></div><div><dt>Source</dt><dd>{selected.source}</dd></div></dl>
        <section><small>TRUST SIGNALS</small><ul>{selected.trustSignals.map((signal) => <li key={signal}><CheckCircle2 size={13} /> {signal}</li>)}</ul></section>
        <section><small>OPEN RISK</small>{selected.risks.map((risk) => <p className={`buyer-risk buyer-risk--${risk.level}`} key={risk.label}><ShieldAlert size={14} /> {risk.label}</p>)}<p>{selected.notes}</p></section>
        <footer><Link href="/inbox?tab=actionable">Create follow-up <ArrowRight size={13} /></Link><Link href="/studio">Open Export Studio</Link></footer>
      </aside>}
    </section>
  </div>;
}
