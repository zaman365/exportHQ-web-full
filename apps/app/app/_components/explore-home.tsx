import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, Compass, PackagePlus, Sparkles } from "lucide-react";
import type { CustomerSession } from "@exporthq/auth";

export function ExploreHome({ session }: { session: CustomerSession }) {
  const isPublic = !session.userId;
  const publicQuery = isPublic ? "?access=public" : "";
  return (
    <div className="explore-home">
      <section className="workspace-page-head explore-home__head">
        <span><p>HOME / STARTING POINT</p><h1>{isPublic ? "See how ExportPanel moves an exporter forward." : `Welcome to ExportPanel, ${session.userName?.split(" ")[0] ?? "there"}.`}</h1><small>{isPublic ? "Explore real, redacted samples first. Create a free account to save your work; verify the business or subscribe when you need the complete solution layer." : "Your workspace is ready. Explore freely, then add business or product details only when a feature needs them."}</small></span>
        <Link className="button button--primary" href={`/readiness${publicQuery}`}><Compass size={15} /> Check export readiness</Link>
      </section>
      {!isPublic && <section className="explore-first-offer">
        <span className="explore-first-offer__icon"><PackagePlus size={23} /></span>
        <div className="explore-first-offer__copy"><p>OPTIONAL NEXT STEP</p><h2>Add your first export offer</h2><span>Turn a product or service into a reusable ExportPanel profile when it suits you. Start with a name and broad category; classification, pricing, specifications, and market can all wait.</span><div><small>Plain-language start</small><small>Save and continue later</small><small>Guidance when unsure</small></div></div>
        <div className="explore-first-offer__action"><em>About 2 minutes</em><Link href="/settings?section=organization#primary-offer">Add an export offer <ArrowRight size={14} /></Link><small>You can ignore this for now.</small></div>
      </section>}
      <section className="explore-path">
        <article className={isPublic ? "" : "complete"}><span>{isPublic ? <Sparkles size={19} /> : <CheckCircle2 size={19} />}</span><div><small>STEP 1</small><strong>{isPublic ? "Explore the public sample" : "Secure account"}</strong><p>{isPublic ? "See selected readiness, market and operating-system signals without an account." : "Your identity and organization context are active."}</p></div></article>
        <article className={isPublic ? "" : "complete"}><span><CheckCircle2 size={19} /></span><div><small>STEP 2</small><strong>{isPublic ? "Create a free account" : "Workspace ready"}</strong><p>{isPublic ? "Save a complete assessment and ranked market shortlist for one business." : "Account setup is finished—no product questionnaire required."}</p></div></article>
        <article><span><Compass size={19} /></span><div><small>STEP 3</small><strong>{isPublic ? "Run the readiness path" : "Choose your first useful action"}</strong><p>{isPublic ? "See the applicable Bangladesh, product, market and delivery checkpoints." : "Explore markets, add an offer, learn, or begin readiness in any order."}</p></div></article>
      </section>
      <section className="explore-grid">
        <article><span><BookOpenCheck size={20} /></span><p>AVAILABLE NOW</p><h2>Learn how ExportPanel works</h2><small>Use the Learning Center to understand scores, evidence, workflows, and roles before subscribing.</small><Link href={`/learn${publicQuery}`}>Open Learning Center <ArrowRight size={14} /></Link></article>
        <article><span><Compass size={20} /></span><p>AVAILABLE NOW</p><h2>{isPublic ? "Sample your readiness route" : "Build your readiness score"}</h2><small>{isPublic ? "Check one representative requirement in every readiness area. Create an account to open the complete conditional checklist and save it to a business." : "Complete the conditional checkpoints, identify blockers and save the assessment. The exact solution and provider layer remains trust-gated."}</small><Link href={`/readiness${publicQuery}`}>Start assessment <ArrowRight size={14} /></Link></article>
        <article className="locked"><span><Sparkles size={20} /></span><p>SCALE + MANAGED</p><h2>Coordinate the whole operation</h2><small>Add Attention Center, Blueprints, team controls, audit, export, and specialist execution.</small><Link href="/plans">Compare expanded access <ArrowRight size={14} /></Link></article>
      </section>
    </div>
  );
}
