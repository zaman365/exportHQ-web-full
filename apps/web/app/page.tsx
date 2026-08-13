import {
  ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Boxes, Building2,
  Check, CircleDollarSign, Code2, Database, Factory, FileCheck2, Gem,
  Globe2, Handshake, Headphones, Layers3, LockKeyhole, Menu, PackageCheck,
  ShieldCheck, Stethoscope, Target, UsersRound, Wheat
} from "lucide-react";
import { Logo } from "@exporthq/ui";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

const capabilities = [
  { number: "01", icon: Target, title: "Market readiness", text: "Know where your offer can compete, what must change, and what happens next." },
  { number: "02", icon: ShieldCheck, title: "Compliance & evidence", text: "Turn destination requirements into sourced, reviewed, owned actions—not guesswork." },
  { number: "03", icon: UsersRound, title: "Buyer development", text: "Research, qualify and progress the right international buyers in one export-specific CRM." },
  { number: "04", icon: PackageCheck, title: "Trade execution", text: "Coordinate RFQs, samples, quotations, orders, quality, documents and shipments." },
  { number: "05", icon: CircleDollarSign, title: "Commercial control", text: "Track landed costs, invoices, payments, exposure and export performance across markets." },
  { number: "06", icon: Headphones, title: "Accountable experts", text: "Your Export HQ team executes work through the same workspace, with visible ownership." }
];

const industries = [
  { icon: Factory, title: "Manufacturing", text: "Industrial, engineering, components, machinery and private-label production." },
  { icon: Wheat, title: "Food & agriculture", text: "Processed foods, ingredients, fresh produce, commodities and agricultural goods." },
  { icon: Boxes, title: "Consumer products", text: "Home, beauty, apparel, electronics, packaging and fast-moving consumer goods." },
  { icon: Code2, title: "Software & services", text: "Technology, outsourcing, professional services and digital delivery businesses." },
  { icon: Stethoscope, title: "Health & life sciences", text: "Pharmaceuticals, medical products, wellness and regulated health offerings." },
  { icon: Gem, title: "Materials & craft", text: "Leather, jute, furniture, ceramics, handicrafts, textiles and specialist materials." }
];

const stages = [
  { step: "01", title: "Tell us what you do", text: "Share your company, offering, capabilities and international ambition." },
  { step: "02", title: "See what is possible", text: "Export HQ assesses markets, readiness, requirements, economics and gaps." },
  { step: "03", title: "Get export-ready", text: "Your team and ours complete the evidence, positioning and operational work." },
  { step: "04", title: "Enter and grow", text: "Build buyers, progress trade, deliver orders and expand into the next market." }
];

function Header() {
  return <header className="site-header"><div className="container header-inner">
    <a className="public-logo" href="#top" aria-label="Export HQ home"><Logo /></a>
    <nav aria-label="Main navigation"><a href="#platform">Platform</a><a href="#industries">Who it&apos;s for</a><a href="#how">How it works</a><a href="#managed">Managed services</a></nav>
    <div className="header-actions"><a className="sign-in" href={appUrl}>Sign in</a><a className="button primary small" href="#start">Assess export readiness <ArrowRight size={14} /></a></div>
    <button className="menu-button" aria-label="Open menu"><Menu size={20} /></button>
  </div></header>;
}

function CommandPreview() {
  return <div className="command-preview" aria-label="Export HQ command center preview">
    <div className="preview-top"><span className="preview-mark">EH</span><span><strong>International growth plan</strong><small>Live operating workspace</small></span><span className="live"><i /> ON TRACK</span></div>
    <div className="preview-score"><span><small>EXPORT HEALTH</small><strong>82<em>/100</em></strong><b>+4 this month</b></span><div className="score-orbit"><span>82</span></div></div>
    <div className="preview-focus"><span><Globe2 size={17} /><span><small>PRIORITY MARKET</small><strong>Germany</strong></span></span><BadgeCheck size={18} /></div>
    <div className="preview-grid"><div><small>READINESS</small><strong>74%</strong><span className="bar"><i style={{ width: "74%" }} /></span></div><div><small>OPEN ACTIONS</small><strong>7</strong><span>3 owned by Export HQ</span></div></div>
    <div className="preview-task"><span className="task-icon"><FileCheck2 size={17} /></span><span><small>EXPORT HQ IS WORKING ON</small><strong>Market-entry requirements review</strong><em>Next update Friday</em></span><ArrowUpRight size={17} /></div>
    <div className="preview-team"><span className="avatars"><i>AM</i><i>RA</i><i>LW</i></span><span><strong>Your accountable team</strong><small>Market · Operations · Compliance</small></span></div>
  </div>;
}

export default function HomePage() {
  return <main id="top">
    <div className="announcement"><span>Built for companies exporting products, services and expertise worldwide.</span><a href="#industries">See who it&apos;s for <ArrowRight size={13} /></a></div>
    <Header />

    <section className="hero"><div className="hero-grid container">
      <div className="hero-copy"><p className="eyebrow"><span /> MANAGED EXPORT OPERATING SYSTEM</p><h1>Take your business<br /><em>beyond borders.</em></h1><p className="hero-lead">Export HQ brings market readiness, compliance, buyers, trade execution and expert support into one accountable workspace—for businesses small to large, in every industry.</p><div className="hero-actions"><a className="button primary" href="#start">Assess your export readiness <ArrowRight size={16} /></a><a className="button text" href="#platform">Explore how it works <ArrowRight size={15} /></a></div><div className="hero-trust"><span><Check size={14} /> Your data stays yours</span><span><Check size={14} /> Evidence-aware compliance</span><span><Check size={14} /> Human experts included</span></div></div>
      <div className="hero-visual"><span className="visual-note note-one">COMPANY → MARKET</span><span className="visual-note note-two">ACTION → OUTCOME</span><CommandPreview /></div>
    </div></section>

    <section className="export-prompt" id="start"><div className="container prompt-inner"><div><p className="section-label">START WITH YOUR BUSINESS</p><h2>What do you want to export—and where do you want to grow?</h2></div><form className="prompt-form"><label><span>We provide</span><input aria-label="What your business provides" placeholder="Products, services or expertise" /></label><label><span>We want to reach</span><input aria-label="Target export market" placeholder="A country, region or new market" /></label><a className="button primary" href={`${appUrl}/onboarding`}>Show my next steps <ArrowRight size={16} /></a></form></div></section>

    <section className="belief"><div className="container belief-grid"><p className="section-label">THE EXPORT PROBLEM</p><h2>International growth is fragmented.<br />Your operating system shouldn&apos;t be.</h2><div className="belief-copy"><p>Companies lose momentum across spreadsheets, email chains, disconnected advisors, freight providers, regulatory research and buyer lists.</p><p><strong>Export HQ gives every market, requirement, buyer, document, deadline and decision one place to live—and one team accountable for moving it forward.</strong></p></div></div></section>

    <section className="platform" id="platform"><div className="container"><div className="section-heading"><div><p className="section-label">ONE EXPORT HEADQUARTERS</p><h2>From possibility to repeatable international growth.</h2></div><p>Start with readiness. Add only what your business needs. Keep every step connected as your export operation matures.</p></div><div className="capability-grid">{capabilities.map(({ number, icon: Icon, title, text }) => <article key={title}><header><span>{number}</span><Icon size={21} /></header><h3>{title}</h3><p>{text}</p><a href="#start" aria-label={`Learn about ${title}`}>Learn more <ArrowUpRight size={14} /></a></article>)}</div></div></section>

    <section className="system-map"><div className="container"><p className="section-label">THE EXPORT HQ SYSTEM</p><div className="journey-line"><div><span>PREPARE</span><strong>Company · Offer · Market</strong></div><ArrowRight /><div><span>QUALIFY</span><strong>Readiness · Compliance · Economics</strong></div><ArrowRight /><div><span>GROW</span><strong>Buyers · RFQs · Quotations</strong></div><ArrowRight /><div><span>DELIVER</span><strong>Orders · Quality · Logistics · Payment</strong></div></div></div></section>

    <section className="managed" id="managed"><div className="container managed-grid"><div className="managed-copy"><p className="section-label light">PLATFORM + EXECUTION</p><h2>Software tells you what is happening.<br /><em>Export HQ helps get it done.</em></h2><p>Our market, compliance and operations specialists work inside the same workspace as your team. Every action has an owner, status, deadline and next step.</p><ul><li><BadgeCheck size={17} /> Market-entry and readiness support</li><li><BadgeCheck size={17} /> Buyer research and commercial development</li><li><BadgeCheck size={17} /> Compliance, certification and document coordination</li><li><BadgeCheck size={17} /> Quality, freight and shipment coordination</li></ul><a className="button lime" href="#start">Meet your export team <ArrowRight size={16} /></a></div><div className="ownership-card"><header><span><Layers3 size={18} /> SHARED ACTION PLAN</span><b>8 active</b></header><div className="owner-row"><span className="owner-dot customer">YOU</span><span><strong>Confirm product capacity</strong><small>Needed for commercial positioning</small></span><em>Due today</em></div><div className="owner-row"><span className="owner-dot exporthq">HQ</span><span><strong>Review market requirements</strong><small>Anna · Market Specialist</small></span><em>In progress</em></div><div className="owner-row"><span className="owner-dot partner">3P</span><span><strong>Verify evidence scope</strong><small>Accredited external laboratory</small></span><em>Waiting</em></div><footer><span className="status-pulse"><i /> Export HQ team online</span><a href={appUrl}>Open workspace <ArrowRight size={14} /></a></footer></div></div></section>

    <section className="industries" id="industries"><div className="container"><div className="section-heading"><div><p className="section-label">BUILT AROUND YOUR BUSINESS</p><h2>Any industry. Any company size.<br />One way to move forward.</h2></div><p>A small producer entering its first market and a global manufacturer expanding its footprint need different workflows—not different principles.</p></div><div className="industry-grid">{industries.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}</div><div className="size-band"><span><Building2 size={18} /><strong>First-time exporters</strong></span><i /><span><Database size={18} /><strong>Growing export teams</strong></span><i /><span><BarChart3 size={18} /><strong>Multi-market enterprises</strong></span></div></div></section>

    <section className="how" id="how"><div className="container"><div className="section-heading centered"><div><p className="section-label">HOW EXPORT HQ WORKS</p><h2>A clear path from ambition to execution.</h2></div></div><div className="steps">{stages.map((stage) => <article key={stage.step}><span>{stage.step}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div></div></section>

    <section className="trust"><div className="container trust-grid"><div><p className="section-label">BUILT FOR BUSINESS TRUST</p><h2>Your international business is confidential. The platform is designed accordingly.</h2></div><div className="trust-points"><span><LockKeyhole size={19} /><span><strong>Private by default</strong><small>Organization-based access and private business documents.</small></span></span><span><ShieldCheck size={19} /><span><strong>Evidence before certainty</strong><small>Sources, dates and human review for compliance information.</small></span></span><span><Database size={19} /><span><strong>Customer-owned data</strong><small>Structured for portability, exports and future API access.</small></span></span><span><Handshake size={19} /><span><strong>Accountable access</strong><small>Staff access is explicit, scoped and auditable.</small></span></span></div></div></section>

    <section className="final-cta"><div className="container cta-inner"><div><p className="section-label light">YOUR NEXT MARKET STARTS HERE</p><h2>Build an export operation<br />that can grow with you.</h2><p>Tell us what your business provides. Export HQ will help determine where it can go and what needs to happen next.</p></div><div><a className="button lime large" href={`${appUrl}/onboarding`}>Assess export readiness <ArrowRight size={17} /></a><a href="#managed">Talk to Export HQ <ArrowUpRight size={15} /></a></div></div></section>

    <footer><div className="container footer-top"><div><a className="public-logo" href="#top"><Logo /></a><p>Everything export.<br />One platform. One accountable team.</p></div><div><strong>Explore</strong><a href="#platform">Platform</a><a href="#industries">Industries</a><a href="#how">How it works</a></div><div><strong>Company</strong><a href="#managed">Managed services</a><a href="#start">Get started</a><a href={appUrl}>Customer sign in</a></div><div><strong>Contact</strong><a href="mailto:hello@exporthq.com">hello@exporthq.com</a><span>Europe · Asia · Worldwide</span></div></div><div className="container footer-bottom"><span>© 2026 Export HQ. All rights reserved.</span><span>Privacy · Security · Data ownership</span><span>The operating system for international growth.</span></div></footer>
  </main>;
}
