"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CircleGauge,
  Clock3,
  ExternalLink,
  FileCheck2,
  Globe2,
  HandCoins,
  Handshake,
  Landmark,
  Link2,
  LockKeyhole,
  PackageCheck,
  Route,
  Save,
  ShieldCheck,
  Ship,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards
} from "lucide-react";
import {
  calculateCommercialScenario,
  exportLaneProgress,
  type CommercialScenarioInput,
  type ExportOperatingSystemView
} from "@exporthq/domain";
import type { BusinessVerificationStatus } from "@exporthq/authorization";
import { HintButton } from "../_components/hint-button";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const storagePrefix = "exportpanel.export-studio.v1";

function readStoredSet(key: string): Set<string> {
  try { return new Set(JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[]); }
  catch { return new Set(); }
}

function Metric({ icon: Icon, label, value, detail, tone = "green" }: { icon: typeof Target; label: string; value: string; detail: string; tone?: "green" | "red" | "violet" | "amber" }) {
  return <article className={`studio-metric studio-metric--${tone}`}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function AccessStrip({ access, tierName, verification }: { access: ExportOperatingSystemView["access"]; tierName: string; verification: BusinessVerificationStatus }) {
  if (access === "full") return <section className="studio-access studio-access--full"><span><ShieldCheck size={19} /></span><div><strong>Complete operating layer active</strong><p>{verification === "verified" ? "Verified-business access" : `${tierName} access`} includes provider matching, Trust Passport detail and full commercial controls.</p></div><Link href="/verify-business">Trust & access <ArrowRight size={14} /></Link></section>;
  if (access === "public") return <section className="studio-access"><span><Sparkles size={19} /></span><div><strong>Explore a public Export Lane</strong><p>See how one opportunity connects to readiness, buyers, delivery, finance and payment. Create a free account to model your own lane and save its economics.</p></div><div><Link href="/sign-up">Create free account</Link><Link href="/sign-in">Sign in</Link></div></section>;
  return <section className="studio-access"><span><Sparkles size={19} /></span><div><strong>Your Basic Export Lane is active</strong><p>Model economics and organize the lane now. Verify the business or subscribe to unlock provider identities, finance routes and the complete Trust Passport.</p></div><div><Link href="/verify-business">Verify free</Link><Link href="/plans">Compare plans</Link></div></section>;
}

function LockedAction({ title, detail, publicPreview = false }: { title: string; detail: string; publicPreview?: boolean }) {
  return <div className="studio-locked"><LockKeyhole size={20} /><div><strong>{title}</strong><p>{detail}</p></div><span>{publicPreview ? <><Link href="/sign-up">Create account</Link><Link href="/sign-in">Sign in</Link></> : <><Link href="/verify-business">Verify</Link><Link href="/plans">Upgrade</Link></>}</span></div>;
}

export default function ExportStudioClient({ view, tierName, verification }: { view: ExportOperatingSystemView; tierName: string; verification: BusinessVerificationStatus }) {
  const lane = view.lane;
  const full = view.access === "full";
  const isPublic = view.access === "public";
  const progress = exportLaneProgress(lane);
  const [scenario, setScenario] = useState<CommercialScenarioInput | null>(view.scenario ?? null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [providerRequest, setProviderRequest] = useState<string | null>(null);
  const [financeSelection, setFinanceSelection] = useState<string | null>(null);
  const [clusterJoined, setClusterJoined] = useState(false);
  const [saved, setSaved] = useState(false);
  const [buyerLinkReady, setBuyerLinkReady] = useState(false);

  useEffect(() => {
    setCompleted(readStoredSet(`${storagePrefix}.milestones.${lane.id}`));
    setShortlist(readStoredSet(`${storagePrefix}.buyers.${lane.id}`));
    setClusterJoined(window.localStorage.getItem(`${storagePrefix}.cluster.${lane.id}`) === "joined");
    const savedScenario = window.localStorage.getItem(`${storagePrefix}.economics.${lane.id}`);
    if (savedScenario) {
      try { setScenario(JSON.parse(savedScenario) as CommercialScenarioInput); }
      catch { window.localStorage.removeItem(`${storagePrefix}.economics.${lane.id}`); }
    }
  }, [lane.id]);

  const economics = useMemo(() => scenario ? calculateCommercialScenario(scenario) : null, [scenario]);
  const openBlockers = lane.blockers.length;
  const confirmedMilestones = view.milestones.filter((item) => item.status === "complete" || completed.has(item.id)).length;

  function updateScenario<K extends keyof CommercialScenarioInput>(key: K, value: CommercialScenarioInput[K]) {
    setScenario((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  }

  function saveScenario() {
    if (!scenario) return;
    window.localStorage.setItem(`${storagePrefix}.economics.${lane.id}`, JSON.stringify(scenario));
    setSaved(true);
  }

  function toggleMilestone(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem(`${storagePrefix}.milestones.${lane.id}`, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleBuyer(id: string) {
    setShortlist((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem(`${storagePrefix}.buyers.${lane.id}`, JSON.stringify([...next]));
      return next;
    });
  }

  function joinCluster() {
    const next = !clusterJoined;
    setClusterJoined(next);
    window.localStorage.setItem(`${storagePrefix}.cluster.${lane.id}`, next ? "joined" : "");
  }

  return <div className="studio-page">
    <section className="studio-hero">
      <div className="studio-hero__copy"><p>TRADE / EXPORT STUDIO</p><div><h1>{lane.destinationFlag} {lane.productName} → {lane.destinationName}</h1><HintButton topic="export-lane" /></div><span>One commercial record connecting readiness, proof, buyer work, offer economics, delivery and export proceeds.</span><footer><b>{lane.health.replaceAll("-", " ")}</b><small>{lane.organizationName} · {lane.sku} · HS {lane.hsCode}</small></footer></div>
      <div className="studio-hero__progress"><CircleGauge size={25} /><span><small>LANE PROGRESS</small><strong>{progress.percent}%</strong><p>{progress.completed} of {progress.total} stages complete</p></span></div>
    </section>

    <section className="studio-lifecycle" aria-label="Export Lane lifecycle">
      {lane.stages.map((stage, index) => <article className={`is-${stage.status}`} key={stage.id}><span>{stage.status === "complete" ? <Check size={13} /> : index + 1}</span><div><small>{stage.status}</small><strong>{stage.label}</strong><p>{stage.owner}</p></div></article>)}
    </section>

    <section className="studio-metrics" aria-label="Export Lane summary">
      <Metric icon={ShieldCheck} label="READINESS" value={`${lane.readinessScore}%`} detail="Product × Germany" />
      <Metric icon={TrendingUp} label="TARGET MARGIN" value={`${lane.targetMarginPercent}%`} detail={economics ? `Current ${percent.format(economics.grossMarginPercent)}%` : "Add economics"} tone="violet" />
      <Metric icon={AlertTriangle} label="OPEN BLOCKERS" value={String(openBlockers)} detail={lane.blockers[0] ?? "No blocker"} tone="red" />
      <Metric icon={Target} label="NEXT GATE" value="Offer" detail={lane.nextGate} tone="amber" />
    </section>

    <AccessStrip access={view.access} tierName={tierName} verification={verification} />

    <nav className="studio-jump" aria-label="Export Studio sections"><a href="#economics"><Calculator size={14} /> Economics</a><a href="#deal"><BriefcaseBusiness size={14} /> Deal room</a><a href="#buyers"><UsersRound size={14} /> Buyer trust</a><a href="#network"><Handshake size={14} /> Support network</a><a href="#delivery"><Ship size={14} /> Delivery & policy</a></nav>

    <section className="studio-panel studio-economics" id="economics">
      <header><div><p>COMMERCIAL CONTROL</p><h2>Export economics <HintButton topic="landed-economics" /></h2><span>Separate seller margin from the buyer&apos;s estimated landed value and keep assumptions visible.</span></div>{scenario && <button type="button" onClick={saveScenario}><Save size={14} /> {saved ? "Draft saved" : "Save draft"}</button>}</header>
      {scenario && economics ? <div className="studio-economics__body">
        <form onSubmit={(event) => event.preventDefault()}>
          <label><span>Incoterm</span><select value={scenario.incoterm} onChange={(event) => updateScenario("incoterm", event.target.value as CommercialScenarioInput["incoterm"])}><option>FOB</option><option>CIF</option><option>DDP</option></select></label>
          <label><span>Units</span><input type="number" min="0" value={scenario.units} onChange={(event) => updateScenario("units", Number(event.target.value))} /></label>
          <label><span>Ex-factory / unit</span><input type="number" min="0" step=".01" value={scenario.unitExFactoryUsd} onChange={(event) => updateScenario("unitExFactoryUsd", Number(event.target.value))} /></label>
          <label><span>Packaging / unit</span><input type="number" min="0" step=".01" value={scenario.unitPackagingUsd} onChange={(event) => updateScenario("unitPackagingUsd", Number(event.target.value))} /></label>
          <label><span>Quote / unit</span><input type="number" min="0" step=".01" value={scenario.quoteUnitUsd} onChange={(event) => updateScenario("quoteUnitUsd", Number(event.target.value))} /></label>
          <label><span>Inland & export</span><input type="number" min="0" value={scenario.inlandUsd} onChange={(event) => updateScenario("inlandUsd", Number(event.target.value))} /></label>
          <label><span>Testing</span><input type="number" min="0" value={scenario.testingUsd} onChange={(event) => updateScenario("testingUsd", Number(event.target.value))} /></label>
          <label><span>Freight</span><input type="number" min="0" value={scenario.freightUsd} onChange={(event) => updateScenario("freightUsd", Number(event.target.value))} /></label>
          <label><span>Commission %</span><input type="number" min="0" max="100" step=".1" value={scenario.commissionPercent} onChange={(event) => updateScenario("commissionPercent", Number(event.target.value))} /></label>
          <label><span>Finance %</span><input type="number" min="0" max="100" step=".1" value={scenario.financePercent} onChange={(event) => updateScenario("financePercent", Number(event.target.value))} /></label>
          <label><span>Estimated duty %</span><input type="number" min="0" max="100" step=".1" value={scenario.estimatedDutyPercent} onChange={(event) => updateScenario("estimatedDutyPercent", Number(event.target.value))} /></label>
          <label><span>Destination tax %</span><input type="number" min="0" max="100" step=".1" value={scenario.destinationTaxPercent} onChange={(event) => updateScenario("destinationTaxPercent", Number(event.target.value))} /></label>
        </form>
        <div className="studio-economics__results">
          <div className="studio-margin"><span><CircleDollarSign size={22} /></span><div><small>ESTIMATED GROSS MARGIN</small><strong>{percent.format(economics.grossMarginPercent)}%</strong><p>{money.format(economics.grossMarginUsd)} before tax and unmodelled exceptions</p></div></div>
          <dl><div><dt>Quote value</dt><dd>{money.format(economics.sellValueUsd)}</dd></div><div><dt>Seller cost</dt><dd>{money.format(economics.sellerCostUsd)}</dd></div><div><dt>Break-even unit</dt><dd>{money.format(economics.breakEvenUnitUsd)}</dd></div><div><dt>Estimated landed value</dt><dd>{money.format(economics.estimatedLandedValueUsd)}</dd></div></dl>
          <div className="studio-warnings">{economics.warnings.map((warning) => <p key={warning}><AlertTriangle size={13} /> {warning}</p>)}</div>
        </div>
      </div> : <LockedAction title="Create an account to model this lane" detail="Public previews never receive organization economics." publicPreview={isPublic} />}
    </section>

    <div className="studio-two-column" id="deal">
      <section className="studio-panel studio-deal">
        <header><div><p>BUYER OPPORTUNITY</p><h2>Deal room <HintButton topic="deal-room" /></h2><span>Evidence-backed milestones from specification to sample release.</span></div><b>{confirmedMilestones}/{view.milestones.length} confirmed</b></header>
        <div>{view.milestones.map((item) => {
          const isComplete = item.status === "complete" || completed.has(item.id);
          const fixedEvidence = item.status === "complete";
          return <article className={isComplete ? "is-complete" : `is-${item.status}`} key={item.id}><button type="button" disabled={fixedEvidence} onClick={() => toggleMilestone(item.id)} aria-label={`${fixedEvidence ? "Verified" : isComplete ? "Reopen" : "Complete"} ${item.label}`}>{isComplete ? <Check size={14} /> : null}</button><div><small>{item.status} · due {item.dueAt}</small><strong>{item.label}</strong><p>{item.owner}{item.evidence ? ` · ${item.evidence}` : ""}</p></div><ArrowRight size={14} /></article>;
        })}</div>
      </section>

      <section className="studio-panel studio-passport">
        <header><div><p>BUYER TRUST</p><h2>Trust Passport <HintButton topic="buyer-trust-passport" /></h2><span>A permission-safe projection—not a certification.</span></div><BadgeCheck size={21} /></header>
        {view.passport ? <div className="studio-passport__body"><span className="studio-passport__seal"><ShieldCheck size={28} /></span><small>VERIFIED BUSINESS PROJECTION</small><h3>{lane.organizationName}</h3><p>{view.passport.capacityStatement}</p><div><span><strong>{view.passport.identityChecks}</strong><small>identity checks</small></span><span><strong>{view.passport.evidenceChecks}</strong><small>evidence checks</small></span></div><button className={buyerLinkReady ? "is-selected" : ""} type="button" onClick={() => setBuyerLinkReady(true)}>{buyerLinkReady ? <Check size={14} /> : <Link2 size={14} />} {buyerLinkReady ? "Buyer link prepared" : "Prepare buyer link"}</button>{buyerLinkReady && <p className="studio-status" role="status"><CheckCircle2 size={14} /> Controlled buyer projection is ready for a final permission review.</p>}<em>Refreshed {view.passport.refreshedAt}</em></div> : <LockedAction title="Unlock the controlled buyer projection" detail="Verify the business or activate a paid plan to open Trust Passport details." publicPreview={isPublic} />}
      </section>
    </div>

    <section className="studio-panel studio-buyers" id="buyers">
      <header><div><p>BUYER DEVELOPMENT</p><h2>Qualified buyer cohort <HintButton topic="buyer-trust-passport" /></h2><span>Fit supports prioritization; payment and identity still need transaction-specific verification.</span></div><b>{shortlist.size} shortlisted</b></header>
      <div className="studio-buyers__grid">{view.buyers.map((buyer) => <article key={buyer.id}><header><span><Building2 size={17} /></span><b>{buyer.fitScore} fit</b></header><small>{buyer.buyerType} · {buyer.country}</small><h3>{buyer.organizationName}</h3><p>{buyer.estimatedAnnualUnits} indicative annual units</p><div><span>{buyer.paymentConfidence} payment confidence</span><span>{buyer.evidence.length} evidence signals</span></div><button className={shortlist.has(buyer.id) ? "is-selected" : ""} type="button" onClick={() => toggleBuyer(buyer.id)}>{shortlist.has(buyer.id) ? <Check size={14} /> : <Target size={14} />} {shortlist.has(buyer.id) ? "Shortlisted" : "Add to cohort"}</button></article>)}</div>
    </section>

    <section className="studio-panel studio-network" id="network">
      <header><div><p>QUALIFIED SUPPORT NETWORK</p><h2>Resolve blockers with the right specialist <HintButton topic="provider-matching" /></h2><span>Quality ranking stays independent of commercial placement. Commissions are disclosed before sharing a request.</span></div><Handshake size={21} /></header>
      <div className="studio-network__grid">{view.providers.map((provider) => <article key={provider.id}><span><FileCheck2 size={18} /></span><small>{provider.category}</small><h3>{provider.name ?? "Qualified identity unlocks with trust"}</h3><p>{provider.credential ?? "See verified scope, fee basis and contact route after business verification or subscription."}</p><div>{provider.responseTime && <span><Clock3 size={12} /> {provider.responseTime}</span>}{provider.verifiedAt && <span><BadgeCheck size={12} /> reviewed {provider.verifiedAt}</span>}</div><em>{provider.commissionDisclosure}</em>{full ? <button type="button" onClick={() => setProviderRequest(provider.id)}>{providerRequest === provider.id ? <Check size={14} /> : <Handshake size={14} />} {providerRequest === provider.id ? "Match request prepared" : "Request a match"}</button> : <Link href={isPublic ? "/sign-up" : "/verify-business"}><LockKeyhole size={14} /> {isPublic ? "Create account" : "Unlock matching"}</Link>}</article>)}</div>
      {providerRequest && <p className="studio-status" role="status"><CheckCircle2 size={15} /> Request draft prepared. No provider has been booked or received business data.</p>}
    </section>

    <div className="studio-two-column studio-finance-row">
      <section className="studio-panel studio-finance">
        <header><div><p>CAPITAL & PAYMENT</p><h2>Finance readiness <HintButton topic="trade-finance-preparation" /></h2><span>Preparation and comparison—not a credit decision.</span></div><Landmark size={20} /></header>
        <div>{view.finance.map((path) => <article className={financeSelection === path.id ? "is-selected" : ""} key={path.id}><span><HandCoins size={18} /></span><div><small>{path.readiness}% prepared</small><strong>{path.product}</strong><p>{path.purpose}</p><i><b style={{ width:`${path.readiness}%` }} /></i><em>{path.missing.length} preparation gaps</em></div>{full ? <button type="button" onClick={() => setFinanceSelection(path.id)}>{financeSelection === path.id ? <Check size={14} /> : <ArrowRight size={14} />}</button> : <LockKeyhole size={14} />}</article>)}</div>
        {!full && <LockedAction title="Finance introductions require trust" detail="Complete business verification or activate Scale/Managed before a request can be prepared." publicPreview={isPublic} />}
      </section>

      <section className="studio-panel studio-cluster">
        <header><div><p>SME COLLABORATION</p><h2>Export cluster <HintButton topic="export-clusters" /></h2><span>Share selected preparation costs without merging legal responsibility.</span></div><UsersRound size={20} /></header>
        {view.clusters.map((cluster) => <div className="studio-cluster__body" key={cluster.id}><span><PackageCheck size={22} /></span><small>{cluster.location} · {cluster.targetMarket}</small><h3>{cluster.title}</h3><p>{cluster.sharedNeed}</p><dl><div><dt>Members</dt><dd>{cluster.participantCount}</dd></div><div><dt>Open</dt><dd>{cluster.openCapacity}</dd></div></dl><button className={clusterJoined ? "is-selected" : ""} type="button" onClick={joinCluster}>{clusterJoined ? <Check size={14} /> : <UsersRound size={14} />} {clusterJoined ? "Interest saved" : "Register interest"}</button><em>Interest is not membership; governance and cost allocation require a separate agreement.</em></div>)}
      </section>
    </div>

    <section className="studio-panel studio-delivery" id="delivery">
      <header><div><p>DELIVERY & PROCEEDS</p><h2>Shipment control path <HintButton topic="shipment-control" /></h2><span>Track the chain until export proceeds are realized—not only until cargo handover.</span></div><Ship size={21} /></header>
      <div className="studio-shipment">{view.shipment.map((item) => <article className={`is-${item.state}`} key={item.id}><span>{item.state === "complete" ? <Check size={14} /> : <Route size={14} />}</span><div><small>{item.state} · {item.plannedAt}</small><strong>{item.label}</strong><p>{item.detail}</p><em>{item.owner}</em></div></article>)}</div>
    </section>

    <section className="studio-panel studio-policy">
      <header><div><p>POLICY & PREFERENCE RADAR</p><h2>Only alerts relevant to this lane <HintButton topic="policy-radar" /></h2><span>Applicability belongs to a product, destination and review date.</span></div><Globe2 size={21} /></header>
      <div className="studio-policy__grid">{view.policies.map((signal) => <article className={`is-${signal.applicability}`} key={signal.id}><header><span>{signal.applicability === "applies" ? <AlertTriangle size={15} /> : signal.applicability === "monitor" ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}</span><b>{signal.applicability.replace("-", " ")}</b></header><h3>{signal.title}</h3><p>{signal.summary}</p><small>{signal.consequence}</small><footer><span>{signal.publisher} · reviewed {signal.reviewedAt}</span><a href={signal.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${signal.title}`}><ExternalLink size={14} /></a></footer></article>)}</div>
    </section>

    <footer className="studio-method"><span><WalletCards size={14} /> Illustrative Export Studio foundation · local preview state only</span><span><BookOpenCheck size={14} /> Official sources and qualified professionals remain controlling.</span></footer>
  </div>;
}
