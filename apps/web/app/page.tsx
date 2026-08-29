import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Database,
  Factory,
  Gem,
  Handshake,
  Headphones,
  LockKeyhole,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Stethoscope,
  Target,
  TrendingUp,
  UsersRound,
  Wheat,
} from "lucide-react";
import {
  Atlas,
  BangladeshExportGlobe,
  OrbitDiagram,
} from "./_components/atlas";
import { Console } from "./_components/console";
import { SiteHeader } from "./_components/site-header";
import { Wordmark } from "./_components/brand";
import { MarketSignalPreview } from "./_components/market-signal-preview";
import { ExportSystemPreview } from "./_components/export-system-preview";
import { exportPanelUrl } from "./_lib/deployment-urls";

const appUrl = exportPanelUrl().toString().replace(/\/$/, "");

const serviceRibbon = [
  "Export readiness",
  "Market selection",
  "Compliance",
  "Buyer development",
  "Quotations",
  "Orders",
  "Logistics",
  "Payments",
];

const operatingStages = [
  {
    number: "01",
    icon: Target,
    title: "Direction & readiness",
    text: "Turn export ambition into a realistic plan based on your offer, capacity, economics and target markets.",
    outputs: ["Readiness score", "Priority market", "90-day action plan"],
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Requirements & evidence",
    text: "Translate destination requirements into owned actions, documents and evidence—with sources and review dates.",
    outputs: ["Requirements map", "Evidence register", "Compliance actions"],
  },
  {
    number: "03",
    icon: UsersRound,
    title: "Buyers & market entry",
    text: "Research, qualify and progress the right distributors, importers, partners and direct buyers.",
    outputs: ["Qualified accounts", "Outreach pipeline", "Meeting briefs"],
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Trade & delivery",
    text: "Coordinate RFQs, samples, quotations, orders, quality, documentation, freight and handover.",
    outputs: ["Trade workspace", "Shipment pack", "Delivery timeline"],
  },
  {
    number: "05",
    icon: TrendingUp,
    title: "Performance & growth",
    text: "See landed economics, payment exposure, buyer momentum and next-market opportunities in one view.",
    outputs: ["Export health", "Margin visibility", "Growth priorities"],
  },
];

const capabilityCoverage = [
  {
    number: "01",
    icon: Target,
    title: "Market readiness",
    text: "Know where your offer can compete, what must change and what should happen next.",
    href: "#brief",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Compliance & evidence",
    text: "Turn destination requirements into sourced, reviewed and owned actions—not guesswork.",
    href: "#process",
  },
  {
    number: "03",
    icon: UsersRound,
    title: "Buyer development",
    text: "Research, qualify and progress the right international buyers in one export-specific pipeline.",
    href: "#process",
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Trade execution",
    text: "Coordinate RFQs, samples, quotations, orders, quality, documents and shipments.",
    href: "#process",
  },
  {
    number: "05",
    icon: CircleDollarSign,
    title: "Commercial control",
    text: "Track landed costs, invoices, payments, exposure and export performance across markets.",
    href: "#managed",
  },
  {
    number: "06",
    icon: Headphones,
    title: "Accountable experts",
    text: "Your Export HQ team executes work through the same workspace, with visible ownership.",
    href: "#managed",
  },
];

const processStages = [
  {
    step: "01",
    phase: "Discover",
    timing: "Week 1",
    title: "Understand your business",
    text: "We map your offer, capacity, proof, target customer and international ambition. You leave with a shared picture of where you are—not a generic checklist.",
    receives: [
      "Business profile",
      "Initial readiness view",
      "Defined export objective",
    ],
  },
  {
    step: "02",
    phase: "Decide",
    timing: "Weeks 1–2",
    title: "Choose the right market and route",
    text: "We compare demand, barriers, economics, channels and operational fit so the next move is based on evidence rather than instinct.",
    receives: ["Market shortlist", "Entry route", "Commercial assumptions"],
  },
  {
    step: "03",
    phase: "Prepare",
    timing: "Weeks 2–6",
    title: "Close the readiness gaps",
    text: "Your team, Export HQ and approved partners complete the required evidence, positioning, pricing, documents and operating setup.",
    receives: ["Owned action plan", "Evidence workspace", "Export-ready offer"],
  },
  {
    step: "04",
    phase: "Enter",
    timing: "Ongoing",
    title: "Build and progress opportunities",
    text: "We create the right buyer universe, prepare outreach and move qualified opportunities from first contact to commercial discussion.",
    receives: ["Buyer pipeline", "Outreach activity", "Opportunity next steps"],
  },
  {
    step: "05",
    phase: "Deliver & grow",
    timing: "Repeatable",
    title: "Execute trade and learn",
    text: "Orders, documents, quality, delivery and payment stay connected—giving your business a repeatable system for the next market.",
    receives: ["Trade record", "Performance view", "Next growth plan"],
  },
];

const industries = [
  {
    icon: Factory,
    title: "Manufacturing",
    text: "Components, machinery, engineering, industrial goods and private-label production.",
  },
  {
    icon: Wheat,
    title: "Food & agriculture",
    text: "Ingredients, processed foods, fresh produce, commodities and agricultural goods.",
  },
  {
    icon: Boxes,
    title: "Consumer products",
    text: "Home, beauty, apparel, electronics, packaging and fast-moving consumer goods.",
  },
  {
    icon: Code2,
    title: "Software & services",
    text: "Technology, outsourcing, professional services and digital delivery businesses.",
  },
  {
    icon: Stethoscope,
    title: "Health & life sciences",
    text: "Medical products, pharmaceuticals, wellness and regulated health offerings.",
  },
  {
    icon: Gem,
    title: "Materials & craft",
    text: "Leather, jute, furniture, ceramics, handicrafts, textiles and specialist materials.",
  },
];

const scenarios = [
  {
    type: "FIRST-TIME EXPORTER",
    icon: Building2,
    title: "Prove the first market",
    text: "A clear readiness baseline, one focused route to market and an owned plan that protects limited time and capital.",
    signal: "Focus before expansion",
  },
  {
    type: "GROWING EXPORT TEAM",
    icon: Database,
    title: "Replace disconnected work",
    text: "Bring buyers, documents, requirements, advisers and delivery milestones into one operating rhythm.",
    signal: "One shared source of truth",
  },
  {
    type: "MULTI-MARKET BUSINESS",
    icon: BarChart3,
    title: "Scale with control",
    text: "Standardize market entry while preserving local requirements, clear ownership and portfolio visibility.",
    signal: "Repeatability across markets",
  },
];

const questions = [
  {
    question: "Is Export HQ only for physical products?",
    answer:
      "No. Export HQ is built for companies selling products, services, technology and specialist expertise internationally. The workflow adapts to what you sell, how it is delivered and which requirements apply.",
  },
  {
    question: "Do we need export experience before starting?",
    answer:
      "No. A first-time exporter can begin with readiness and market direction. An experienced team can start with a specific market, compliance gap, buyer pipeline or live trade operation.",
  },
  {
    question: "Is this software or a consulting service?",
    answer:
      "It is both by design. The platform keeps decisions, evidence, buyers, actions and trade work connected. Export HQ specialists use that same workspace to research, coordinate and execute agreed work with your team.",
  },
  {
    question: "Does Export HQ replace our freight forwarder or advisers?",
    answer:
      "Not necessarily. Export HQ can coordinate your existing providers or help identify suitable specialists. Their work remains visible in the same plan, with clear scope, ownership and evidence.",
  },
  {
    question: "How do you handle compliance information?",
    answer:
      "Requirements are tied to sources, effective dates, confidence and human review. Export HQ does not present unverified AI output as legal certainty, and regulated decisions are escalated to qualified specialists.",
  },
];

function Eyebrow({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <p className={tone === "light" ? "eyebrow eyebrow-light" : "eyebrow"}>
      <i aria-hidden="true" />
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <span className="scroll-rail" aria-hidden="true" />

      <SiteHeader appUrl={appUrl} />

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-canvas" aria-hidden="true">
            <span className="hero-aurora aurora-signal" />
            <span className="hero-aurora aurora-tide" />
            <span className="hero-fade" />
          </div>

          <div className="container hero-grid">
            <div className="hero-copy">
              <Eyebrow tone="light">The managed export workspace</Eyebrow>
              <h1 className="hero-title">
                From export ambition to <em>international growth.</em>
              </h1>
              <p className="hero-lead">
                Managed by export specialists, powered by one workspace that
                connects readiness, requirements, buyers and trade execution—for
                any business ready to grow abroad.
              </p>
              <div className="hero-actions">
                <a className="btn btn-signal btn-lg" href={`${appUrl}/readiness?access=public`}>
                  Prepare for export <ArrowRight size={17} strokeWidth={2.2} />
                </a>
                <a className="btn btn-outline btn-lg" href={`${appUrl}/preview`}>
                  Preview ExportPanel <ArrowUpRight size={17} strokeWidth={2.2} />
                </a>
              </div>
              <ul className="hero-proof">
                <li>
                  <Check size={14} strokeWidth={2.6} /> Products, services and
                  expertise
                </li>
                <li>
                  <Check size={14} strokeWidth={2.6} /> First market to
                  multi-market scale
                </li>
                <li>
                  <Check size={14} strokeWidth={2.6} /> Platform and human
                  execution
                </li>
              </ul>
            </div>

            <div className="hero-globe">
              <BangladeshExportGlobe />
            </div>
          </div>

          <div className="ribbon" aria-label="What Export HQ handles">
            <div className="ribbon-track">
              {[...serviceRibbon, ...serviceRibbon].map((item, index) => (
                <span key={`${item}-${index}`}>
                  <i aria-hidden="true" /> {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <MarketSignalPreview appUrl={appUrl} />

        <ExportSystemPreview appUrl={appUrl} />

        <section className="section workspace-showcase" id="workspace">
          <div className="container">
            <div className="workspace-head" data-reveal>
              <div>
                <Eyebrow>Meet ExportPanel</Eyebrow>
                <h2 className="h-section">
                  Your entire export operation, in one clear view.
                </h2>
              </div>
              <div className="workspace-intro">
                <p className="section-note">
                  See readiness, requirements, buyers, actions and expert
                  support together—so your team always knows what matters and
                  what moves next.
                </p>
                <a className="text-link" href={`${appUrl}/preview`}>
                  Preview ExportPanel <ArrowUpRight size={16} strokeWidth={2.2} />
                </a>
              </div>
            </div>

            <div className="workspace-stage" data-reveal>
              <Console />
              <aside
                className="workspace-benefits"
                aria-label="ExportPanel benefits"
              >
                <article>
                  <span>01</span>
                  <strong>Know where you stand</strong>
                  <p>
                    One live view of readiness, evidence and commercial
                    progress.
                  </p>
                </article>
                <article>
                  <span>02</span>
                  <strong>See who owns what</strong>
                  <p>
                    Your team, Export HQ and approved partners share one action
                    plan.
                  </p>
                </article>
                <article>
                  <span>03</span>
                  <strong>Move the next action</strong>
                  <p>
                    Every priority has context, an owner and a visible next
                    step.
                  </p>
                </article>
              </aside>
            </div>
          </div>
        </section>

        <section className="section brief" id="brief">
          <div className="container brief-grid">
            <div className="brief-copy" data-reveal>
              <Eyebrow>Start with your business</Eyebrow>
              <h2 className="h-display">
                Tell us what you want to take abroad.
              </h2>
              <p className="lead">
                Share the basics and continue into your private workspace.
                Export HQ will use your context to shape the next questions—not
                drop you into a generic sales funnel.
              </p>
              <ul className="tick-list">
                <li>
                  <Check size={15} strokeWidth={2.6} /> Start with a product,
                  service or capability
                </li>
                <li>
                  <Check size={15} strokeWidth={2.6} /> Name a market—or ask us
                  to help choose one
                </li>
                <li>
                  <Check size={15} strokeWidth={2.6} /> Get a structured
                  readiness path
                </li>
              </ul>
            </div>

            <form
              className="brief-form"
              action={`${appUrl}/readiness`}
              method="get"
              data-reveal
            >
              <span className="form-tab">Export brief</span>
              <input type="hidden" name="access" value="public" />
              <label className="field">
                <span>What does your business provide?</span>
                <input
                  name="productName"
                  placeholder="Products, services or specialist expertise"
                  required
                />
              </label>
              <div className="field-pair">
                <label className="field">
                  <span>Where are you today?</span>
                  <select name="stage" defaultValue="">
                    <option value="" disabled>
                      Select your stage
                    </option>
                    <option>Exploring export</option>
                    <option>Preparing for a first market</option>
                    <option>Already exporting</option>
                    <option>Scaling across markets</option>
                  </select>
                </label>
                <label className="field">
                  <span>Where do you want to grow?</span>
                  <select name="market" defaultValue="DE">
                    <option value="DE">Germany / EU</option>
                    <option value="NL">Netherlands / EU</option>
                    <option value="GB">United Kingdom</option>
                    <option value="JP">Japan</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                  </select>
                </label>
              </div>
              <button className="btn btn-ink btn-lg btn-block" type="submit">
                Show me the next steps{" "}
                <ArrowRight size={17} strokeWidth={2.2} />
              </button>
              <p className="form-note">
                No generic report. Your answers shape a company-specific
                starting point.
              </p>
            </form>
          </div>
        </section>

        <section className="section platform" id="platform">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <Eyebrow>The operating system</Eyebrow>
                <h2 className="h-section">
                  Five connected stages.
                  <br />
                  One export headquarters.
                </h2>
              </div>
              <p className="section-note">
                Most export work breaks in the gaps between strategy,
                compliance, sales and delivery. Export HQ keeps the output of
                each stage connected to the next.
              </p>
            </div>

            <div className="stage-system" data-reveal>
              <div className="stage-system__spine" aria-hidden="true">
                <span>Start with evidence</span>
                <i><b /></i>
                <span>Compound what works</span>
              </div>
              <div
                className="stage-grid"
                role="list"
                aria-label="Export HQ operating system stages"
              >
                {operatingStages.map(
                  ({ number, icon: Icon, title, text, outputs }, index) => (
                    <article className="stage-card" key={title} role="listitem">
                      <header>
                        <span className="stage-card__step">
                          <span className="card-index">{number}</span>
                          <small>Stage {index + 1} of {operatingStages.length}</small>
                        </span>
                        <span className="card-icon">
                          <Icon size={19} strokeWidth={1.7} />
                        </span>
                      </header>
                      {index < operatingStages.length - 1 ? (
                        <span className="stage-card__connector" aria-hidden="true">
                          <ArrowRight size={15} strokeWidth={2.2} />
                        </span>
                      ) : null}
                      <h3>{title}</h3>
                      <p>{text}</p>
                      <div className="card-outputs">
                        <span className="data-label">Visible output</span>
                        <ul>
                          {outputs.map((output) => (
                            <li key={output}>
                              <Check size={13} strokeWidth={2.6} /> {output}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section editorial has-grain">
          <div className="container editorial-grid">
            <div className="editorial-art" data-reveal>
              <OrbitDiagram />
            </div>
            <div data-reveal>
              <Eyebrow tone="light">Why Export HQ exists</Eyebrow>
              <h2 className="h-display">
                Exporting is still human work.
                <br />
                <em>The system should make it visible.</em>
              </h2>
              <p className="lead lead-inv">
                Markets are entered through decisions made by people—your team,
                buyers, specialists and delivery partners. Export HQ gives those
                people one operating picture, so you can see what was decided,
                why it matters and who moves it next.
              </p>
            </div>
          </div>
        </section>

        <section className="section managed" id="managed">
          <div className="container managed-grid">
            <div data-reveal>
              <Eyebrow>Platform + execution</Eyebrow>
              <h2 className="h-section">
                One team from first question to delivered trade.
              </h2>
              <p className="lead">
                You do not have to stitch together a market consultant,
                compliance researcher, buyer list, spreadsheet and freight
                thread. Export HQ coordinates the work through the same platform
                your company sees.
              </p>
              <ul className="point-list">
                <li>
                  <SearchCheck size={20} strokeWidth={1.7} />
                  <span>
                    <strong>Research with context</strong>
                    <small>
                      Markets, requirements and buyers tied to your actual
                      offer.
                    </small>
                  </span>
                </li>
                <li>
                  <Handshake size={20} strokeWidth={1.7} />
                  <span>
                    <strong>Clear ownership</strong>
                    <small>
                      Your team, Export HQ and external specialists each have
                      visible actions.
                    </small>
                  </span>
                </li>
                <li>
                  <Headphones size={20} strokeWidth={1.7} />
                  <span>
                    <strong>Human judgment</strong>
                    <small>
                      Experts review important decisions and regulated
                      requirements.
                    </small>
                  </span>
                </li>
                <li>
                  <CircleDollarSign size={20} strokeWidth={1.7} />
                  <span>
                    <strong>Commercial control</strong>
                    <small>
                      Activity stays connected to costs, opportunities and
                      outcomes.
                    </small>
                  </span>
                </li>
              </ul>
              <a className="text-link" href="#process">
                See how the work moves{" "}
                <ArrowRight size={16} strokeWidth={2.2} />
              </a>
            </div>

            <div className="plan-card" data-reveal>
              <header>
                <span>
                  <BadgeCheck size={16} strokeWidth={2} /> Shared action plan
                </span>
                <b>8 active</b>
              </header>
              <ul className="plan-rows">
                <li>
                  <span className="owner owner-you">You</span>
                  <span className="plan-copy">
                    <strong>Confirm production capacity</strong>
                    <small>Needed for commercial positioning</small>
                  </span>
                  <span className="status status-due">Due today</span>
                </li>
                <li>
                  <span className="owner owner-hq">HQ</span>
                  <span className="plan-copy">
                    <strong>Review destination requirements</strong>
                    <small>Anna · Market specialist</small>
                  </span>
                  <span className="status status-active">In progress</span>
                </li>
                <li>
                  <span className="owner owner-partner">3P</span>
                  <span className="plan-copy">
                    <strong>Verify test evidence scope</strong>
                    <small>Approved external laboratory</small>
                  </span>
                  <span className="status status-wait">Waiting</span>
                </li>
              </ul>
              <footer>
                <span>
                  <i aria-hidden="true" /> Export HQ team online
                </span>
                <a href={`${appUrl}/sign-in`}>
                  Open workspace <ArrowUpRight size={15} strokeWidth={2.2} />
                </a>
              </footer>
            </div>
          </div>
        </section>

        <section
          className="section coverage"
          id="capabilities"
          aria-labelledby="coverage-title"
        >
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <Eyebrow>One export headquarters</Eyebrow>
                <h2 className="h-section" id="coverage-title">
                  From possibility to repeatable international growth.
                </h2>
              </div>
              <p className="section-note">
                Start with readiness. Add only what your business needs. Keep
                every step connected as your export operation matures.
              </p>
            </div>

            <div className="coverage-grid" data-reveal>
              {capabilityCoverage.map(
                ({ number, icon: Icon, title, text, href }) => (
                  <a
                    className="coverage-card"
                    key={title}
                    href={href}
                    aria-label={`Learn more about ${title}`}
                  >
                    <header>
                      <span className="card-index">{number}</span>
                      <span className="card-icon">
                        <Icon size={20} strokeWidth={1.7} />
                      </span>
                    </header>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <span className="card-link">
                      Learn more <ArrowUpRight size={15} strokeWidth={2.2} />
                    </span>
                  </a>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="section process" id="process">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <Eyebrow>The process</Eyebrow>
                <h2 className="h-section">
                  From “could we export?”
                  <br />
                  to a repeatable operation.
                </h2>
              </div>
              <p className="section-note">
                Select a stage to see what happens, how Export HQ supports it
                and what your company receives.
              </p>
            </div>

            <div className="process-list" data-reveal>
              {processStages.map((stage, index) => (
                <details
                  key={stage.step}
                  name="export-process"
                  open={index === 0}
                >
                  <summary>
                    <span className="process-step">{stage.step}</span>
                    <strong>{stage.phase}</strong>
                    <em>{stage.timing}</em>
                    <ChevronDown size={19} strokeWidth={2} aria-hidden="true" />
                  </summary>
                  <div className="process-panel">
                    <div>
                      <span className="data-label">Stage {stage.step}</span>
                      <h3>{stage.title}</h3>
                      <p>{stage.text}</p>
                    </div>
                    <div className="process-receives">
                      <span className="data-label">What you receive</span>
                      <ul>
                        {stage.receives.map((item) => (
                          <li key={item}>
                            <Check size={14} strokeWidth={2.6} /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section industries" id="industries">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <Eyebrow>Built around your business</Eyebrow>
                <h2 className="h-section">
                  Not only textiles.
                  <br />
                  Not only large companies.
                </h2>
              </div>
              <p className="section-note">
                Export HQ adapts to the offer, evidence, buying process and
                delivery model of your business—across industries and company
                sizes.
              </p>
            </div>

            <div className="industry-grid" data-reveal>
              {industries.map(({ icon: Icon, title, text }) => (
                <article className="industry-card" key={title}>
                  <span className="card-icon">
                    <Icon size={21} strokeWidth={1.7} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section scenarios">
          <div className="container">
            <div className="section-head section-head-stack" data-reveal>
              <div>
                <Eyebrow>One system, different starting points</Eyebrow>
                <h2 className="h-section">
                  Export HQ meets your operation where it is.
                </h2>
              </div>
            </div>

            <div className="scenario-grid" data-reveal>
              {scenarios.map(({ type, icon: Icon, title, text, signal }) => (
                <article className="scenario-card" key={type}>
                  <header>
                    <span className="scenario-type">{type}</span>
                    <span className="card-icon">
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                  </header>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <footer>
                    <i aria-hidden="true" /> {signal}
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section trust has-grain">
          <div className="container trust-grid">
            <div data-reveal>
              <Eyebrow tone="light">Business-grade trust</Eyebrow>
              <h2 className="h-section h-section-inv">
                Your international business is confidential. Your export
                decisions should be explainable.
              </h2>
            </div>
            <ul className="trust-points" data-reveal>
              <li>
                <LockKeyhole size={20} strokeWidth={1.7} />
                <span>
                  <strong>Private by default</strong>
                  <small>
                    Organization-based access and private business documents.
                  </small>
                </span>
              </li>
              <li>
                <ShieldCheck size={20} strokeWidth={1.7} />
                <span>
                  <strong>Evidence before certainty</strong>
                  <small>
                    Sources, dates and human review for requirements.
                  </small>
                </span>
              </li>
              <li>
                <Database size={20} strokeWidth={1.7} />
                <span>
                  <strong>Customer-owned data</strong>
                  <small>
                    Structured for portability and future integrations.
                  </small>
                </span>
              </li>
              <li>
                <Handshake size={20} strokeWidth={1.7} />
                <span>
                  <strong>Accountable access</strong>
                  <small>
                    Staff and partner access is explicit and scoped.
                  </small>
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="section questions">
          <div className="container questions-grid">
            <div className="questions-intro">
              <Eyebrow>Before you start</Eyebrow>
              <h2 className="h-section">
                Clear answers to the important questions.
              </h2>
              <p className="lead">
                Export HQ is designed to make international growth easier to
                understand before asking you to commit.
              </p>
            </div>
            <div className="faq-list" data-reveal>
              {questions.map(({ question, answer }) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta has-grain">
          <div className="cta-canvas" aria-hidden="true">
            <Atlas id="cta-atlas" />
          </div>
          <div className="container cta-inner">
            <div data-reveal>
              <Eyebrow tone="light">Your next market starts here</Eyebrow>
              <h2 className="h-display">
                Tell us what you want to take abroad.
              </h2>
              <p className="lead lead-inv">
                We will help you understand what is possible, what it requires
                and what should happen next.
              </p>
            </div>
            <div className="cta-actions" data-reveal>
              <a className="btn btn-signal btn-lg" href={`${appUrl}/readiness?access=public`}>
                Start readiness check{" "}
                <ArrowRight size={17} strokeWidth={2.2} />
              </a>
              <a
                className="text-link text-link-inv"
                href="mailto:hello@exporthq.com"
              >
                Talk to Export HQ <ArrowUpRight size={16} strokeWidth={2.2} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-top">
          <div className="footer-brand">
            <a href="#top" aria-label="Export HQ home">
              <Wordmark />
            </a>
            <p>The managed workspace for international growth.</p>
          </div>
          <nav aria-label="Explore">
            <strong>Explore</strong>
            <a href="#platform">Platform</a>
            <a href="#managed">Services</a>
            <a href="#process">Process</a>
            <a href="#industries">Who it&apos;s for</a>
          </nav>
          <nav aria-label="Start">
            <strong>Start</strong>
            <a href="#brief">Export brief</a>
            <a href={`${appUrl}/sign-in`}>Customer sign in</a>
            <a href={`${appUrl}/plans`}>ExportPanel plans</a>
            <a href="mailto:hello@exporthq.com">Talk to our team</a>
          </nav>
          <div className="footer-contact">
            <strong>Contact</strong>
            <a href="mailto:hello@exporthq.com">hello@exporthq.com</a>
            <span>Europe · Asia · Worldwide</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Export HQ. All rights reserved.</span>
          <nav className="footer-legal-links" aria-label="Legal and trust">
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/security">Security</a>
            <a href="/legal/service-boundaries">Service boundaries</a>
          </nav>
          <span>Everything export. One accountable team.</span>
        </div>
      </footer>
    </>
  );
}
