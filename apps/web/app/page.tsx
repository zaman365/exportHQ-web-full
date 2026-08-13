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
  FileCheck2,
  Gem,
  Globe2,
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
import { Logo } from "@exporthq/ui";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

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

const processStages = [
  {
    step: "01",
    phase: "Discover",
    timing: "Week 1",
    title: "Understand your business",
    text: "We map your offer, capacity, proof, target customer and international ambition. You leave with a shared picture of where you are—not a generic checklist.",
    receives: ["Business profile", "Initial readiness view", "Defined export objective"],
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
  { icon: Factory, title: "Manufacturing", text: "Components, machinery, engineering, industrial goods and private-label production." },
  { icon: Wheat, title: "Food & agriculture", text: "Ingredients, processed foods, fresh produce, commodities and agricultural goods." },
  { icon: Boxes, title: "Consumer products", text: "Home, beauty, apparel, electronics, packaging and fast-moving consumer goods." },
  { icon: Code2, title: "Software & services", text: "Technology, outsourcing, professional services and digital delivery businesses." },
  { icon: Stethoscope, title: "Health & life sciences", text: "Medical products, pharmaceuticals, wellness and regulated health offerings." },
  { icon: Gem, title: "Materials & craft", text: "Leather, jute, furniture, ceramics, handicrafts, textiles and specialist materials." },
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
    answer: "No. Export HQ is built for companies selling products, services, technology and specialist expertise internationally. The workflow adapts to what you sell, how it is delivered and which requirements apply.",
  },
  {
    question: "Do we need export experience before starting?",
    answer: "No. A first-time exporter can begin with readiness and market direction. An experienced team can start with a specific market, compliance gap, buyer pipeline or live trade operation.",
  },
  {
    question: "Is this software or a consulting service?",
    answer: "It is both by design. The platform keeps decisions, evidence, buyers, actions and trade work connected. Export HQ specialists use that same workspace to research, coordinate and execute agreed work with your team.",
  },
  {
    question: "Does Export HQ replace our freight forwarder or advisers?",
    answer: "Not necessarily. Export HQ can coordinate your existing providers or help identify suitable specialists. Their work remains visible in the same plan, with clear scope, ownership and evidence.",
  },
  {
    question: "How do you handle compliance information?",
    answer: "Requirements are tied to sources, effective dates, confidence and human review. Export HQ does not present unverified AI output as legal certainty, and regulated decisions are escalated to qualified specialists.",
  },
];

function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="public-logo" href="#top" aria-label="Export HQ home"><Logo /></a>
        <nav aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#managed">Services</a>
          <a href="#process">Process</a>
          <a href="#industries">Who it&apos;s for</a>
        </nav>
        <div className="header-actions">
          <a className="sign-in" href={appUrl}>Sign in</a>
          <a className="button ink small" href="#brief">Start your export brief <ArrowRight size={14} /></a>
        </div>
      </div>
    </header>
  );
}

function CommandPreview() {
  return (
    <div className="workspace-window" aria-label="Export HQ workspace preview">
      <div className="window-bar">
        <span className="window-dots"><i /><i /><i /></span>
        <span>Export programme · Germany entry</span>
        <b><i /> Live</b>
      </div>
      <div className="workspace-body">
        <div className="workspace-sidebar">
          <span className="workspace-mark">EH</span>
          <i className="active" /><i /><i /><i /><i />
        </div>
        <div className="workspace-main">
          <div className="workspace-heading">
            <span><small>EXPORT HEALTH</small><strong>82<em>/100</em></strong></span>
            <span className="health-ring">82</span>
          </div>
          <div className="workspace-stats">
            <span><small>PRIORITY MARKET</small><strong><Globe2 size={14} /> Germany</strong></span>
            <span><small>OPEN ACTIONS</small><strong>7</strong><em>3 with Export HQ</em></span>
            <span><small>BUYER PIPELINE</small><strong>12</strong><em>4 qualified</em></span>
          </div>
          <div className="workspace-next">
            <span className="next-icon"><FileCheck2 size={17} /></span>
            <span><small>NEXT MILESTONE</small><strong>Market requirements signed off</strong><em>Export HQ · Due Friday</em></span>
            <BadgeCheck size={18} />
          </div>
          <div className="workspace-feed">
            <span className="feed-avatars"><i>AM</i><i>RA</i><i>LW</i></span>
            <span><strong>Your accountable export team</strong><small>Market · Compliance · Trade operations</small></span>
            <span className="team-online"><i /> Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main id="top">
      <Header />

      <section className="hero">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">THE MANAGED EXPORT WORKSPACE</p>
            <h1>From export ambition<br />to <span>international growth.</span></h1>
            <p className="hero-lead">Managed by export specialists, powered by one workspace that connects readiness, requirements, buyers and trade execution—for any business ready to grow abroad.</p>
            <div className="hero-actions">
              <a className="button ink" href="#brief">Start your export brief <ArrowRight size={16} /></a>
              <a className="button ghost" href="#platform">See the operating system</a>
            </div>
            <div className="hero-proof">
              <span><Check size={14} /> Products, services and expertise</span>
              <span><Check size={14} /> First market to multi-market scale</span>
              <span><Check size={14} /> Platform and human execution</span>
            </div>
          </div>
          <div className="hero-visual">
            <span className="float-tag tag-market">MARKET → PLAN</span>
            <span className="float-tag tag-action">ACTION → OWNER</span>
            <CommandPreview />
          </div>
        </div>
      </section>

      <section className="service-ribbon" aria-label="What Export HQ handles">
        <div className="ribbon-track">
          {[...serviceRibbon, ...serviceRibbon].map((item, index) => <span key={`${item}-${index}`}><i /> {item}</span>)}
        </div>
      </section>

      <section className="brief" id="brief">
        <div className="container brief-grid">
          <div className="brief-copy">
            <p className="section-label">START WITH YOUR BUSINESS</p>
            <h2>Tell us what you want to take abroad.</h2>
            <p>Share the basics and continue into your private workspace. Export HQ will use your context to shape the next questions—not drop you into a generic sales funnel.</p>
            <ul>
              <li><Check size={15} /> Start with a product, service or capability</li>
              <li><Check size={15} /> Name a market—or ask us to help choose one</li>
              <li><Check size={15} /> Get a structured readiness path</li>
            </ul>
          </div>
          <form className="export-brief" action={`${appUrl}/onboarding`} method="get">
            <label><span>What does your business provide?</span><input name="offering" placeholder="Products, services or specialist expertise" required /></label>
            <div className="form-pair">
              <label><span>Where are you today?</span><select name="stage" defaultValue=""><option value="" disabled>Select your stage</option><option>Exploring export</option><option>Preparing for a first market</option><option>Already exporting</option><option>Scaling across markets</option></select></label>
              <label><span>Where do you want to grow?</span><input name="market" placeholder="Country, region or help me choose" /></label>
            </div>
            <button className="button ink wide" type="submit">Show me the next steps <ArrowRight size={16} /></button>
            <small>No generic report. Your answers shape a company-specific starting point.</small>
          </form>
        </div>
      </section>

      <section className="platform" id="platform">
        <div className="container">
          <div className="section-heading">
            <div><p className="section-label">THE OPERATING SYSTEM</p><h2>Five connected stages.<br />One export headquarters.</h2></div>
            <p>Most export work breaks in the gaps between strategy, compliance, sales and delivery. Export HQ keeps the output of each stage connected to the next.</p>
          </div>
          <div className="operating-grid">
            {operatingStages.map(({ number, icon: Icon, title, text, outputs }) => (
              <article key={title}>
                <header><span>{number}</span><Icon size={20} /></header>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="output-list"><small>WHAT YOU CAN SEE</small>{outputs.map((output) => <span key={output}><Check size={12} /> {output}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-break">
        <div className="container editorial-grid">
          <div className="editorial-art" aria-hidden="true">
            <span className="art-map"><Globe2 size={70} /></span>
            <span className="art-node node-a">READINESS</span>
            <span className="art-node node-b">BUYERS</span>
            <span className="art-node node-c">TRADE</span>
            <i className="art-line line-a" /><i className="art-line line-b" /><i className="art-line line-c" />
          </div>
          <div>
            <p className="section-label light">WHY EXPORT HQ EXISTS</p>
            <h2>Exporting is still human work.<br /><em>The system should make it visible.</em></h2>
            <p>Markets are entered through decisions made by people—your team, buyers, specialists and delivery partners. Export HQ gives those people one operating picture, so you can see what was decided, why it matters and who moves it next.</p>
          </div>
        </div>
      </section>

      <section className="managed" id="managed">
        <div className="container managed-grid">
          <div className="managed-copy">
            <p className="section-label">PLATFORM + EXECUTION</p>
            <h2>One team from first question to delivered trade.</h2>
            <p>You do not have to stitch together a market consultant, compliance researcher, buyer list, spreadsheet and freight thread. Export HQ coordinates the work through the same platform your company sees.</p>
            <div className="managed-points">
              <span><SearchCheck size={19} /><span><strong>Research with context</strong><small>Markets, requirements and buyers tied to your actual offer.</small></span></span>
              <span><Handshake size={19} /><span><strong>Clear ownership</strong><small>Your team, Export HQ and external specialists each have visible actions.</small></span></span>
              <span><Headphones size={19} /><span><strong>Human judgment</strong><small>Experts review important decisions and regulated requirements.</small></span></span>
              <span><CircleDollarSign size={19} /><span><strong>Commercial control</strong><small>Activity stays connected to costs, opportunities and outcomes.</small></span></span>
            </div>
            <a className="text-link" href="#process">See how the work moves <ArrowRight size={15} /></a>
          </div>
          <div className="action-card">
            <header><span><BadgeCheck size={17} /> SHARED ACTION PLAN</span><b>8 active</b></header>
            <div className="action-row"><span className="owner you">YOU</span><span><strong>Confirm production capacity</strong><small>Needed for commercial positioning</small></span><em>Due today</em></div>
            <div className="action-row"><span className="owner hq">HQ</span><span><strong>Review destination requirements</strong><small>Anna · Market specialist</small></span><em>In progress</em></div>
            <div className="action-row"><span className="owner partner">3P</span><span><strong>Verify test evidence scope</strong><small>Approved external laboratory</small></span><em>Waiting</em></div>
            <footer><span><i /> Export HQ team online</span><a href={appUrl}>Open workspace <ArrowUpRight size={14} /></a></footer>
          </div>
        </div>
      </section>

      <section className="process" id="process">
        <div className="container">
          <div className="section-heading">
            <div><p className="section-label">THE PROCESS</p><h2>From “could we export?”<br />to a repeatable operation.</h2></div>
            <p>Select a stage to see what happens, how Export HQ supports it and what your company receives.</p>
          </div>
          <div className="process-accordion">
            {processStages.map((stage, index) => (
              <details key={stage.step} name="export-process" open={index === 0}>
                <summary><span>{stage.step}</span><strong>{stage.phase}</strong><em>{stage.timing}</em><ChevronDown size={18} /></summary>
                <div className="process-panel">
                  <div><small>STAGE {stage.step}</small><h3>{stage.title}</h3><p>{stage.text}</p></div>
                  <div><small>WHAT YOU RECEIVE</small>{stage.receives.map((item) => <span key={item}><Check size={13} /> {item}</span>)}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="industries" id="industries">
        <div className="container">
          <div className="section-heading">
            <div><p className="section-label">BUILT AROUND YOUR BUSINESS</p><h2>Not only textiles.<br />Not only large companies.</h2></div>
            <p>Export HQ adapts to the offer, evidence, buying process and delivery model of your business—across industries and company sizes.</p>
          </div>
          <div className="industry-grid">
            {industries.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="scenarios">
        <div className="container">
          <div className="scenario-heading"><p className="section-label">ONE SYSTEM, DIFFERENT STARTING POINTS</p><h2>Export HQ meets your operation where it is.</h2></div>
          <div className="scenario-grid">
            {scenarios.map(({ type, icon: Icon, title, text, signal }) => <article key={type}><header><span>{type}</span><Icon size={20} /></header><h3>{title}</h3><p>{text}</p><footer><i /> {signal}</footer></article>)}
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container trust-grid">
          <div><p className="section-label light">BUSINESS-GRADE TRUST</p><h2>Your international business is confidential. Your export decisions should be explainable.</h2></div>
          <div className="trust-points">
            <span><LockKeyhole size={19} /><span><strong>Private by default</strong><small>Organization-based access and private business documents.</small></span></span>
            <span><ShieldCheck size={19} /><span><strong>Evidence before certainty</strong><small>Sources, dates and human review for requirements.</small></span></span>
            <span><Database size={19} /><span><strong>Customer-owned data</strong><small>Structured for portability and future integrations.</small></span></span>
            <span><Handshake size={19} /><span><strong>Accountable access</strong><small>Staff and partner access is explicit and scoped.</small></span></span>
          </div>
        </div>
      </section>

      <section className="questions">
        <div className="container questions-grid">
          <div><p className="section-label">BEFORE YOU START</p><h2>Clear answers to the important questions.</h2><p>Export HQ is designed to make international growth easier to understand before asking you to commit.</p></div>
          <div className="faq-list">
            {questions.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container cta-inner">
          <div><p className="section-label light">YOUR NEXT MARKET STARTS HERE</p><h2>Tell us what you want to take abroad.</h2><p>We will help you understand what is possible, what it requires and what should happen next.</p></div>
          <div><a className="button lime large" href="#brief">Start your export brief <ArrowRight size={17} /></a><a href={`mailto:hello@exporthq.com`}>Talk to Export HQ <ArrowUpRight size={15} /></a></div>
        </div>
      </section>

      <footer>
        <div className="container footer-top">
          <div><a className="public-logo" href="#top"><Logo /></a><p>The managed workspace for international growth.</p></div>
          <div><strong>Explore</strong><a href="#platform">Platform</a><a href="#managed">Services</a><a href="#process">Process</a><a href="#industries">Who it&apos;s for</a></div>
          <div><strong>Start</strong><a href="#brief">Export brief</a><a href={appUrl}>Customer sign in</a><a href="mailto:hello@exporthq.com">Talk to our team</a></div>
          <div><strong>Contact</strong><a href="mailto:hello@exporthq.com">hello@exporthq.com</a><span>Europe · Asia · Worldwide</span></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Export HQ. All rights reserved.</span><span>Privacy · Security · Data ownership</span><span>Everything export. One accountable team.</span></div>
      </footer>
    </main>
  );
}
