import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleGauge,
  FileQuestion,
  FolderLock,
  House,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Logo } from "@exporthq/ui";

export const metadata: Metadata = {
  title: "Preview TREVV — Export HQ",
  description: "Explore a safe, limited view of the TREVV export operating workspace."
};

const lockedDestinations = [
  ["Attention Center", Radar],
  ["Inbox", Inbox],
  ["My Work", ListChecks],
  ["Decisions", FileQuestion]
] as const;

export default function TrevvPreviewPage() {
  return (
    <div className="preview-shell">
      <aside className="preview-sidebar">
        <a href="https://export-hq.com" aria-label="Export HQ homepage"><Logo /></a>
        <span className="preview-badge"><Sparkles size={13} /> Limited preview</span>
        <nav aria-label="Preview navigation">
          <a className="active" href="#dashboard"><House size={17} /> Home</a>
          {lockedDestinations.map(([label, Icon]) => <span key={label}><Icon size={17} /> {label}<LockKeyhole size={13} /></span>)}
          <a href="#learning"><BookOpenCheck size={17} /> Learning Center</a>
        </nav>
        <div className="preview-sidebar__cta">
          <LockKeyhole size={18} />
          <strong>Your real workspace is private.</strong>
          <p>Sign in to see your organization, responsibilities, and plan-enabled tools.</p>
          <Link href="/sign-in">Sign in <ArrowRight size={14} /></Link>
        </div>
      </aside>

      <main className="preview-main">
        <header className="preview-topbar">
          <span><LayoutDashboard size={17} /> Sample workspace · no customer data</span>
          <div><Link href="/sign-in">Sign in</Link><Link href="/sign-up" className="button button--primary">Create account</Link></div>
        </header>
        <div className="preview-content" id="dashboard">
          <section className="preview-welcome">
            <div><p>TREVV / HOME</p><h1>Dashboard</h1><span>See the signals, decisions, and next actions that keep export work moving.</span></div>
            <Link href="/sign-up" className="button button--primary">Build my workspace <ArrowRight size={15} /></Link>
          </section>

          <section className="preview-plan-strip">
            <span><CircleGauge size={21} /></span>
            <div><small>YOUR ACCESS PATH</small><strong>Preview → Onboarding → Launch, Scale, or Managed</strong></div>
            <Link href="/plans">Compare access <ArrowRight size={14} /></Link>
          </section>

          <section className="preview-metrics" aria-label="Sample workspace metrics">
            <article><span>EXPORT HEALTH</span><strong>82</strong><small>Sample readiness score</small></article>
            <article><span>NEEDS YOU</span><strong>4</strong><small>Owned actions in focus</small></article>
            <article><span>EVIDENCE READY</span><strong>74%</strong><small>Across one target market</small></article>
          </section>

          <div className="preview-grid">
            <section className="preview-card">
              <header><span><p>NEXT ACTIONS</p><h2>What needs attention</h2></span><ShieldCheck size={19} /></header>
              <div className="preview-action"><CheckCircle2 size={18} /><span><strong>Confirm target market objective</strong><small>Company setup · due this week</small></span><b>Needs you</b></div>
              <div className="preview-action"><CheckCircle2 size={18} /><span><strong>Review evidence checklist</strong><small>Germany readiness · 3 sources linked</small></span><b>Review</b></div>
            </section>
            <section className="preview-card preview-learning" id="learning">
              <header><span><p>LEARNING CENTER</p><h2>Understand TREVV as you work</h2></span><BookOpenCheck size={19} /></header>
              <p>Contextual hints explain scores, states, evidence, and recommended actions. The complete Learning Center organizes every tutorial, tip, and workflow guide.</p>
              <Link href="/sign-up">Unlock guided onboarding <ArrowRight size={14} /></Link>
            </section>
          </div>

          <section className="preview-locked">
            <span><FolderLock size={23} /></span>
            <div><p>SUBSCRIPTION-GATED WORKSPACE</p><h2>Projects, evidence, collaboration, and managed execution appear after onboarding.</h2><small>Every page is checked on the server against your organization, role, onboarding status, and subscription—not just hidden in the navigation.</small></div>
            <Link href="/plans">View TREVV plans <ArrowRight size={15} /></Link>
          </section>
        </div>
      </main>
    </div>
  );
}
