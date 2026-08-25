import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, Compass, LockKeyhole, Rocket, Sparkles } from "lucide-react";
import type { CustomerSession } from "@exporthq/auth";

export function ExploreHome({ session }: { session: CustomerSession }) {
  return (
    <div className="explore-home">
      <section className="workspace-page-head explore-home__head">
        <span><p>HOME / STARTING POINT</p><h1>Welcome to TREVV, {session.userName?.split(" ")[0] ?? "there"}.</h1><small>Your organization is set up. Choose a plan to turn your export brief into an active operating workspace.</small></span>
        <Link className="button button--primary" href="/plans"><Rocket size={15} /> Choose TREVV access</Link>
      </section>
      <section className="explore-path">
        <article className="complete"><span><CheckCircle2 size={19} /></span><div><small>STEP 1</small><strong>Secure account</strong><p>Your identity and organization context are active.</p></div></article>
        <article className="complete"><span><CheckCircle2 size={19} /></span><div><small>STEP 2</small><strong>Export onboarding</strong><p>Your starting objective is ready for a workspace.</p></div></article>
        <article><span><Compass size={19} /></span><div><small>STEP 3</small><strong>Select how you will operate</strong><p>Launch alone, coordinate at Scale, or add Managed execution.</p></div></article>
      </section>
      <section className="explore-grid">
        <article><span><BookOpenCheck size={20} /></span><p>AVAILABLE NOW</p><h2>Learn how TREVV works</h2><small>Use the complete Learning Center to understand scores, evidence, workflows, and roles before subscribing.</small><Link href="/learn">Open Learning Center <ArrowRight size={14} /></Link></article>
        <article className="locked"><span><LockKeyhole size={20} /></span><p>LAUNCH</p><h2>Readiness and execution</h2><small>Unlock Inbox, My Work, Waiting, Decisions, requirements, documents, and product-market readiness.</small><Link href="/plans">Compare Launch <ArrowRight size={14} /></Link></article>
        <article className="locked"><span><Sparkles size={20} /></span><p>SCALE + MANAGED</p><h2>Coordinate the whole operation</h2><small>Add Attention Center, Blueprints, team controls, audit, export, and specialist execution.</small><Link href="/plans">Compare expanded access <ArrowRight size={14} /></Link></article>
      </section>
    </div>
  );
}
