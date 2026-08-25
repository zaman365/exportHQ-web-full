"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  CircleGauge,
  Database,
  ExternalLink,
  Filter,
  Globe2,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound
} from "lucide-react";
import {
  MARKET_INTELLIGENCE_METHOD_VERSION,
  MARKET_INTELLIGENCE_UPDATED_AT,
  type MarketIntelligenceAccess,
  type MarketOpportunityView
} from "@exporthq/domain";
import type { BusinessVerificationStatus } from "@exporthq/authorization";
import { HintButton } from "../_components/hint-button";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="opportunity-score"><span><small>{label}</small><strong>{value}</strong></span><i><b style={{ width: `${value}%` }} /></i></div>;
}

function AccessBanner({ access, verification, tierName }: { access: MarketIntelligenceAccess; verification: BusinessVerificationStatus; tierName: string }) {
  if (access === "full") {
    return <div className="opportunity-access opportunity-access--full"><span><ShieldCheck size={18} /></span><div><strong>Full intelligence active</strong><p>{verification === "verified" ? "Your verified-business access" : `${tierName} access`} includes evidence, buyer routes, barriers and recommended actions.</p></div><Link href="/verify-business">Trust & access <ArrowRight size={14} /></Link></div>;
  }
  return <div className="opportunity-access"><span><Sparkles size={18} /></span><div><strong>Your Basic account reveals the ranked shortlist</strong><p>Verify the business or choose any paid plan to open evidence, entry routes, buyer profiles and the next-action playbook.</p></div><div><Link href="/verify-business">Verify business</Link><Link href="/plans">See plans</Link></div></div>;
}

export default function OpportunitiesClient({
  access,
  opportunities,
  tierName,
  verification
}: {
  access: MarketIntelligenceAccess;
  opportunities: readonly MarketOpportunityView[];
  tierName: string;
  verification: BusinessVerificationStatus;
}) {
  const countries = useMemo(() => Array.from(new Map(opportunities.map((item) => [item.target.code, item.target])).values()), [opportunities]);
  const regions = useMemo(() => Array.from(new Set(opportunities.map((item) => item.target.region))), [opportunities]);
  const categories = useMemo(() => Array.from(new Set(opportunities.map((item) => item.product.category))).sort(), [opportunities]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id ?? "");
  const [shortlist, setShortlist] = useState<ReadonlySet<string>>(new Set());

  const filtered = useMemo(() => opportunities.filter((item) => {
    const haystack = `${item.target.name} ${item.target.region} ${item.product.name} ${item.product.category} ${item.product.hsCodes.join(" ")}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (region === "all" || item.target.region === region)
      && (country === "all" || item.target.code === country)
      && (category === "all" || item.product.category === category);
  }), [category, country, opportunities, query, region]);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  function resetFilters() {
    setQuery("");
    setRegion("all");
    setCountry("all");
    setCategory("all");
  }

  function toggleShortlist(id: string) {
    setShortlist((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="opportunities-page">
      <section className="opportunities-hero">
        <div><p>GROW / MARKET INTELLIGENCE</p><div className="opportunities-title-row"><h1>Country × product opportunities</h1><HintButton topic="market-opportunity-index" /></div><span>Find the export lanes where destination demand and Bangladesh supply strength overlap—then see the evidence, barriers and next move.</span></div>
        <div className="opportunities-hero__meta"><span><Database size={15} /> {opportunities.length} product lanes</span><span><Globe2 size={15} /> {countries.length} target markets</span><span><RefreshCw size={14} /> Reviewed {MARKET_INTELLIGENCE_UPDATED_AT}</span></div>
      </section>

      <AccessBanner access={access} verification={verification} tierName={tierName} />

      <section className="opportunity-overview" aria-label="Market intelligence summary">
        <article><span><Target size={18} /></span><div><small>PRIORITY SIGNALS</small><strong>{opportunities.filter((item) => item.scoreBand === "Priority").length}</strong><p>Highest combined demand and origin fit</p></div></article>
        <article><span><Globe2 size={18} /></span><div><small>REGIONS COVERED</small><strong>{regions.length}</strong><p>East Asia, Gulf and European routes</p></div></article>
        <article><span><BarChart3 size={18} /></span><div><small>PRODUCT FAMILIES</small><strong>{categories.length}</strong><p>Apparel, home textiles, leather and jute</p></div></article>
        <article><span><BookmarkCheck size={18} /></span><div><small>YOUR SHORTLIST</small><strong>{shortlist.size}</strong><p>Saved in this preview session</p></div></article>
      </section>

      <section className="opportunity-filters" aria-label="Opportunity filters">
        <label className="opportunity-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country, product or HS code…" /></label>
        <label><span className="sr-only">Country</span><Globe2 size={15} /><select value={country} onChange={(event) => setCountry(event.target.value)}><option value="all">All countries</option>{countries.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
        <label><span className="sr-only">Region</span><Filter size={15} /><select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">All regions</option>{regions.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Product category</span><Target size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All products</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <button type="button" onClick={resetFilters}><RefreshCw size={14} /> Reset</button>
      </section>

      <div className="opportunity-workspace">
        <section className="opportunity-results">
          <header><div><p>MATCHES</p><h2>{filtered.length} opportunity lanes</h2></div><div className="opportunity-sort-help"><span>Sorted by ExportPanel fit</span><HintButton topic="market-fit-score" /></div></header>
          <div className="opportunity-list">
            {filtered.map((item) => {
              const isSelected = selected?.id === item.id;
              const saved = shortlist.has(item.id);
              return <article className={isSelected ? "is-selected" : ""} key={item.id}>
                <button className="opportunity-card__main" type="button" onClick={() => setSelectedId(item.id)} aria-pressed={isSelected}>
                  <span className="opportunity-country-flag" aria-hidden="true">{item.target.flag}</span>
                  <span className="opportunity-card__copy"><small>{item.target.name} · {item.target.region}</small><strong>{item.product.name}</strong><span>HS {item.product.hsCodes.join(", ")} · {item.product.category}</span><p>{item.access === "public" ? item.publicSummary : item.memberInsight}</p></span>
                  <span className={`opportunity-band opportunity-band--${item.scoreBand.toLowerCase()}`}><TrendingUp size={13} /> {item.scoreBand}</span>
                  {item.opportunityScore !== undefined && <span className="opportunity-card__score"><strong>{item.opportunityScore}</strong><small>/100</small></span>}
                  <ChevronRight size={17} />
                </button>
                <button className={saved ? "opportunity-save is-saved" : "opportunity-save"} type="button" onClick={() => toggleShortlist(item.id)} aria-label={saved ? `Remove ${item.product.name} in ${item.target.name} from shortlist` : `Save ${item.product.name} in ${item.target.name} to shortlist`}>{saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button>
              </article>;
            })}
            {!filtered.length && <div className="opportunity-empty"><Search size={22} /><strong>No opportunity lanes match</strong><p>Clear a filter or try a broader product term.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>}
          </div>
        </section>

        <aside className="opportunity-detail" aria-live="polite">
          {selected ? <>
            <header><div><span>{selected.target.flag}</span><p>{selected.target.name.toUpperCase()} · {selected.product.category.toUpperCase()}</p><h2>{selected.product.name}</h2><small>HS {selected.product.hsCodes.join(", ")} · {selected.trend} demand · {selected.confidence} confidence</small></div><button type="button" onClick={() => toggleShortlist(selected.id)}>{shortlist.has(selected.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button></header>
            {selected.opportunityScore !== undefined && <div className="opportunity-detail__scores"><div className="opportunity-score-total"><CircleGauge size={24} /><span><small>ExportPanel FIT</small><strong>{selected.opportunityScore}</strong></span></div><ScoreBar label="Destination demand" value={selected.demandScore ?? 0} /><ScoreBar label="Bangladesh fit" value={selected.originFitScore ?? 0} /></div>}
            <div className="opportunity-detail__summary"><div className="opportunity-detail__label"><p>WHY THIS MAY FIT</p><HintButton topic="market-evidence" /></div><span>{selected.memberInsight ?? selected.publicSummary}</span></div>
            {selected.fullAnalysis ? <div className="opportunity-full">
              <section><h3><Sparkles size={15} /> Why ExportPanel ranks it</h3><ul>{selected.fullAnalysis.whyItRanks.map((item) => <li key={item}><Check size={13} /> {item}</li>)}</ul></section>
              <div className="opportunity-detail__columns">
                <section><h3><UsersRound size={15} /> Likely buyers</h3><ul>{selected.fullAnalysis.buyerProfiles.map((item) => <li key={item}>{item}</li>)}</ul></section>
                <section><h3><ArrowRight size={15} /> Entry routes</h3><ul>{selected.fullAnalysis.entryRoutes.map((item) => <li key={item}>{item}</li>)}</ul></section>
              </div>
              <section className="opportunity-risks"><h3><ShieldCheck size={15} /> Prove before outreach</h3><div><span><strong>Barriers</strong>{selected.fullAnalysis.barriers.map((item) => <small key={item}>{item}</small>)}</span><span><strong>Evidence to prepare</strong>{selected.fullAnalysis.proofToPrepare.map((item) => <small key={item}>{item}</small>)}</span></div></section>
              <section className="opportunity-next"><h3>Recommended validation sprint</h3><ol>{selected.fullAnalysis.nextActions.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol><Link href="/create">Create opportunity plan <ArrowRight size={14} /></Link></section>
              <section className="opportunity-sources"><h3><Database size={15} /> Evidence trail</h3>{selected.fullAnalysis.evidence.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer"><span><strong>{item.label}</strong><small>{item.publisher} · {item.period}</small><em>{item.metric}</em></span><ExternalLink size={14} /></a>)}</section>
            </div> : <div className="opportunity-locked"><span><LockKeyhole size={21} /></span><p>FULL ANALYSIS</p><h3>See the evidence and route behind this score</h3><ul><li><Check size={13} /> Buyer profiles and entry routes</li><li><Check size={13} /> Barriers and evidence requirements</li><li><Check size={13} /> Source links and recommended actions</li></ul><div><Link href="/verify-business">Verify business <ArrowRight size={14} /></Link><Link href="/plans">Upgrade plan</Link></div></div>}
            <footer><span>{MARKET_INTELLIGENCE_METHOD_VERSION}</span><span>Decision support, not a guarantee of sales.</span></footer>
          </> : <div className="opportunity-empty"><Target size={22} /><strong>Select an opportunity</strong><p>Choose a country-product lane to see its signal.</p></div>}
        </aside>
      </div>
    </div>
  );
}
