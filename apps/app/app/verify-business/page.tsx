import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { subscriptionCatalog } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import { requireWorkspaceFeature } from "../_lib/session";
import { VerificationForm } from "./verification-form";

export const metadata: Metadata = {
  title: "Verify your business — ExportPanel",
  description: "Request an evidence-based Export HQ business verification review."
};

export const dynamic = "force-dynamic";

export default async function VerifyBusinessPage({ searchParams }: { searchParams: Promise<{ submitted?: string; verified?: string }> }) {
  const session = await requireWorkspaceFeature("home", { allowIncompleteOnboarding: true });
  const params = await searchParams;
  const isVerified = session.businessVerification === "verified" || params.verified === "1";
  const isPending = session.businessVerification === "pending" || params.submitted === "1";

  return (
    <WorkspaceShell active="opportunities" session={session}>
      <section className="verification-page">
        <Link className="verification-back" href="/opportunities"><ArrowLeft size={15} /> Market opportunities</Link>
        <header className="verification-head"><p>BUSINESS TRUST</p><h1>{isVerified ? "Your business is verified" : isPending ? "Verification is in review" : "Verify once. Unlock useful intelligence."}</h1><span>Verification gives a Basic account full market-intelligence access without requiring a subscription. It also establishes a reusable trust signal for future high-value ExportPanel features.</span></header>
        {isVerified ? (
          <div className="verification-state verification-state--verified"><span><CheckCircle2 size={25} /></span><div><p>VERIFIED BUSINESS</p><h2>Full market intelligence is active</h2><span>Your organization can open evidence, entry routes, buyer profiles, barriers and recommended next actions.</span><Link href="/opportunities">Explore opportunities <ArrowRight size={15} /></Link></div></div>
        ) : isPending ? (
          <div className="verification-state verification-state--pending"><span><Clock3 size={25} /></span><div><p>REVIEW PENDING</p><h2>Your evidence has been submitted</h2><span>An Export HQ reviewer will check the business record. Your current {subscriptionCatalog[session.tier].name} access remains available while the review is open.</span><Link href="/opportunities">Return to opportunities <ArrowRight size={15} /></Link></div></div>
        ) : (
          <div className="verification-layout">
            <aside className="verification-benefits"><div><ShieldCheck size={20} /><strong>What verification unlocks</strong></div><ol><li><span>01</span><div><strong>Full evidence trails</strong><small>See the trade signals and review dates behind every ranking.</small></div></li><li><span>02</span><div><strong>Market-entry paths</strong><small>Open buyer profiles, routes, barriers and proof requirements.</small></div></li><li><span>03</span><div><strong>Actionable next steps</strong><small>Turn an interesting market into a practical validation plan.</small></div></li></ol><p>A paid Launch, Scale or Managed plan also unlocks full intelligence. Verification is the non-subscription route for legitimate businesses.</p></aside>
            <VerificationForm organizationName={session.organizationName ?? ""} userEmail={session.userEmail ?? ""} />
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
