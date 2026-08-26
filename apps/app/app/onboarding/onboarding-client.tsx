"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CreateOrganization } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Building2, Compass, PackagePlus, ShieldCheck } from "lucide-react";
import { Card, Logo } from "@exporthq/ui";
import { exportPanelPath } from "../_lib/export-panel-paths";
import { completeOnboarding, type OnboardingActionState } from "./actions";

const initialState: OnboardingActionState = {};

export default function OnboardingClient({ needsOrganization, authEnabled, organizationName }: { needsOrganization: boolean; authEnabled: boolean; organizationName: string }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  if (needsOrganization) {
    return <main className="onboarding-page"><header className="onboarding-topbar"><a href="https://export-hq.com" target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><Logo /></a><Link href="/preview"><ArrowLeft size={15} /> Back to preview</Link></header><div className="onboarding-organization"><div><p>ORGANIZATION ACCESS</p><h1>Create your private business workspace.</h1><span>This is the only account-level setup. Products, markets, documents, and verification are added from inside ExportPanel when you are ready.</span></div>{authEnabled ? <CreateOrganization afterCreateOrganizationUrl={exportPanelPath("/onboarding")} skipInvitationScreen /> : <Card><strong>Organization setup is available after production identity is connected.</strong></Card>}</div></main>;
  }

  return (
    <main className="onboarding-page onboarding-entry">
      <header className="onboarding-topbar"><a href="https://export-hq.com" target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><Logo /></a><a href="https://export-hq.com" target="_blank" rel="noreferrer"><ArrowLeft size={15} /> Export HQ home</a></header>
      <section className="onboarding-entry__layout">
        <div className="onboarding-entry__story">
          <p>YOUR WORKSPACE IS READY</p>
          <h1>Enter first.<br />Build as you go.</h1>
          <span>No product questionnaire. No HS code. No market decisions. ExportPanel will introduce each task in context after you enter.</span>
        </div>
        <Card className="onboarding-entry__card">
          <span className="onboarding-entry__icon"><ShieldCheck size={26} /></span>
          <small>SECURE BUSINESS WORKSPACE</small>
          <h2>{organizationName || "Your ExportPanel"} is ready.</h2>
          <p>Start with the dashboard and choose what is useful today. Every business-detail task remains optional until a feature actually needs it.</p>
          <div className="onboarding-entry__next">
            <article><span><Building2 size={17} /></span><div><strong>Company profile</strong><small>Complete legal details or verification later.</small></div></article>
            <article><span><PackagePlus size={17} /></span><div><strong>First export offer</strong><small>Add it from the dashboard when you are ready.</small></div></article>
            <article><span><Compass size={17} /></span><div><strong>Markets and readiness</strong><small>Explore first; save decisions only when useful.</small></div></article>
          </div>
          {state.error && <div className="onboarding-error" role="alert">{state.error}</div>}
          <form action={formAction}>
            <input type="hidden" name="demoBusinessName" value={organizationName} />
            <button className="button button--primary onboarding-entry__button" type="submit" disabled={pending}>{pending ? "Opening ExportPanel…" : "Enter ExportPanel"}<ArrowRight size={16} /></button>
          </form>
          <span className="onboarding-entry__note">Nothing else is required to finish account setup.</span>
        </Card>
      </section>
    </main>
  );
}
