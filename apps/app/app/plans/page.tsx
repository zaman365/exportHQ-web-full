import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, Crown, Rocket, Sparkles } from "lucide-react";
import { subscriptionCatalog, type SubscriptionTier } from "@exporthq/authorization";
import { Logo } from "@exporthq/ui";

export const metadata: Metadata = {
  title: "ExportPanel plans — Export HQ",
  description: "Compare Launch, Scale, and Managed access to the ExportPanel workspace."
};

const planCopy: ReadonlyArray<{
  tier: Exclude<SubscriptionTier, "preview" | "explore">;
  icon: typeof Rocket;
  bestFor: string;
  highlights: readonly string[];
}> = [
  {
    tier: "launch",
    icon: Rocket,
    bestFor: "Preparing or proving a first priority market",
    highlights: ["Readiness, evidence, and requirements", "Export Studio economics and deal basics", "Decisions, Inbox, My Work, and Waiting"]
  },
  {
    tier: "scale",
    icon: Sparkles,
    bestFor: "Teams coordinating several projects or markets",
    highlights: ["Everything in Launch", "Buyer cohorts, finance readiness, and shipment control", "Team, market, audit, and multi-lane export controls"]
  },
  {
    tier: "managed",
    icon: Crown,
    bestFor: "Businesses that want software and accountable execution",
    highlights: ["Everything in Scale", "Managed Export HQ work", "Specialist coordination in the same evidence trail"]
  }
];

export default function PlansPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <main className="plans-page">
      <header className="plans-topbar"><a href="https://export-hq.com"><Logo /></a><div><Link href="/preview"><ArrowLeft size={14} /> Preview ExportPanel</Link><Link href="/sign-in">Sign in</Link></div></header>
      <section className="plans-hero">
        <p>ExportPanel ACCESS</p>
        <h1>Start with the work in front of you.<br />Expand when the operation does.</h1>
        <span>Every tier is enforced on the server by organization and role. Upgrading adds capability without moving your evidence, decisions, or action history.</span>
      </section>
      <section className="plans-grid">
        {planCopy.map(({ tier, icon: Icon, bestFor, highlights }) => {
          const plan = subscriptionCatalog[tier];
          return <article className={`plan-access-card${tier === "scale" ? " featured" : ""}`} key={tier}><header><span><Icon size={20} /></span>{tier === "scale" && <b>Most flexible</b>}</header><p>{plan.name.toUpperCase()}</p><h2>{plan.summary}</h2><small>Best for · {bestFor}</small><ul>{highlights.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul><Link href="/sign-up">Start with {plan.name} <ArrowRight size={14} /></Link></article>;
        })}
      </section>
      {configured && <section className="clerk-pricing"><header><p>SUBSCRIBE SECURELY</p><h2>Choose or manage your organization plan</h2></header><PricingTable for="organization" /></section>}
      <section className="plans-footnote"><strong>Not ready to choose?</strong><span>Create a Basic account, complete onboarding, and decide with your real export brief in view.</span><Link href="/sign-up">Create Basic account <ArrowRight size={14} /></Link></section>
    </main>
  );
}
