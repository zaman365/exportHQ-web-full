"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CreateOrganization } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, Package, ShieldCheck } from "lucide-react";
import { Card, Logo } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import { exportPanelPath } from "../_lib/export-panel-paths";
import { completeOnboarding, type OnboardingActionState } from "./actions";

const steps = ["Company", "Product", "Market", "Review"];
const initialState: OnboardingActionState = {};
const initialData = {
  legalName: "", tradingName: "", originCountry: "BD", industry: "", website: "",
  productName: "", sku: "", category: "", hsCode: "", composition: "",
  targetMarketCode: "DE", salesChannel: "wholesale", fobPrice: "", currency: "EUR", stage: "preparing"
};

export default function OnboardingClient({ needsOrganization, authEnabled, organizationName }: { needsOrganization: boolean; authEnabled: boolean; organizationName: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({ ...initialData, legalName: organizationName, tradingName: organizationName }));
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const update = (key: keyof typeof data, value: string) => setData((current) => ({ ...current, [key]: value }));

  if (needsOrganization) {
    return <main className="onboarding-page"><header className="onboarding-topbar"><Logo /><Link href="/preview"><ArrowLeft size={15} /> Back to preview</Link></header><div className="onboarding-organization"><div><p>ORGANIZATION ACCESS</p><h1>Create the private workspace boundary.</h1><span>ExportPanel separates every company by organization. Members, roles, subscriptions, records, and evidence stay inside that boundary.</span></div>{authEnabled ? <CreateOrganization afterCreateOrganizationUrl={exportPanelPath("/onboarding")} skipInvitationScreen /> : <Card><strong>Organization setup is available after production identity is connected.</strong></Card>}</div></main>;
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-topbar"><Logo /><Link href="/"><ArrowLeft size={15} /> Back to Home</Link></header>
      <div className="onboarding-layout">
        <aside className="onboarding-intro"><p>BUSINESS & WORKSPACE SETUP</p><h1>Build a useful starting point. <HintButton topic="setup-progress" /></h1><span>{organizationName ? `${organizationName} is secure. ` : ""}Complete this brief first; the full readiness assessment follows in its own guided system.</span><div className="step-list">{steps.map((label, index) => <button type="button" key={label} className={index === step ? "active" : ""} onClick={() => setStep(index)}><span>{index < step ? <Check size={11} /> : index + 1}</span><strong>{label}</strong></button>)}</div></aside>
        <Card className="onboarding-form">
          <form action={formAction}>
            <input type="hidden" name="demoBusinessName" value={organizationName} />
            {Object.entries(data).map(([name, value]) => <input type="hidden" name={name} value={value} key={name} />)}
            {step === 0 && <><div className="form-head"><p>STEP 1 OF 4</p><h2>Company profile</h2><span>This becomes the verified business context used throughout ExportPanel.</span></div><div className="form-grid"><label className="form-field"><span>Legal company name</span><input required value={data.legalName} onChange={(event) => update("legalName", event.target.value)} /></label><label className="form-field"><span>Trading name</span><input required value={data.tradingName} onChange={(event) => update("tradingName", event.target.value)} /></label><label className="form-field"><span>Origin country</span><select value={data.originCountry} onChange={(event) => update("originCountry", event.target.value)}><option value="DE">Germany</option><option value="BD">Bangladesh</option><option value="IN">India</option><option value="GB">United Kingdom</option><option value="US">United States</option></select></label><label className="form-field"><span>Industry</span><input required value={data.industry} onChange={(event) => update("industry", event.target.value)} placeholder="e.g. Industrial manufacturing" /></label><label className="form-field full"><span>Website</span><input type="url" value={data.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" /></label></div></>}
            {step === 1 && <><div className="form-head"><p>STEP 2 OF 4</p><h2>Add the first offer</h2><span>Product detail determines the applicable market questions and evidence path.</span></div><div className="form-grid"><label className="form-field"><span>Product or service name</span><input required value={data.productName} onChange={(event) => update("productName", event.target.value)} /></label><label className="form-field"><span>Internal reference</span><input required value={data.sku} onChange={(event) => update("sku", event.target.value)} /></label><label className="form-field"><span>Category</span><input required value={data.category} onChange={(event) => update("category", event.target.value)} /></label><label className="form-field"><span>HS code</span><input required value={data.hsCode} onChange={(event) => update("hsCode", event.target.value)} placeholder="6205.20" /></label><label className="form-field full"><span>Composition or delivery description</span><textarea required value={data.composition} onChange={(event) => update("composition", event.target.value)} /></label></div></>}
            {step === 2 && <><div className="form-head"><p>STEP 3 OF 4</p><h2>Define the first market objective</h2><span>ExportPanel evaluates readiness for a specific offer, market, and route—not as a universal badge.</span></div><div className="form-grid"><label className="form-field"><span>Target market</span><select value={data.targetMarketCode} onChange={(event) => update("targetMarketCode", event.target.value)}><option value="DE">Germany / EU</option><option value="NL">Netherlands / EU</option><option value="GB">United Kingdom</option><option value="JP">Japan</option><option value="SA">Saudi Arabia</option><option value="AE">United Arab Emirates</option></select></label><label className="form-field"><span>Sales channel</span><select value={data.salesChannel} onChange={(event) => update("salesChannel", event.target.value)}><option value="wholesale">Wholesale / distributor</option><option value="retail">Direct retail</option><option value="marketplace">Online marketplace</option><option value="services">Direct service delivery</option></select></label><label className="form-field"><span>Indicative price</span><input required inputMode="decimal" value={data.fobPrice} onChange={(event) => update("fobPrice", event.target.value)} /></label><label className="form-field"><span>Currency</span><select value={data.currency} onChange={(event) => update("currency", event.target.value)}><option>EUR</option><option>USD</option><option>GBP</option></select></label><label className="form-field full"><span>Current stage</span><select value={data.stage} onChange={(event) => update("stage", event.target.value)}><option value="exploring">Exploring export</option><option value="preparing">Preparing a first market</option><option value="exporting">Already exporting</option><option value="scaling">Scaling across markets</option></select></label></div></>}
            {step === 3 && <div className="success-panel"><span className="success-icon"><ShieldCheck size={25} /></span><p>STEP 4 OF 4</p><h2>Turn this brief into your ExportPanel starting point.</h2><p>Your organization will be marked onboarded and ExportPanel will open the conditional readiness assessment. Basic access reveals the assessment; verification or a paid plan unlocks full resolutions and expert matching.</p>{state.error && <div className="onboarding-error" role="alert">{state.error}</div>}<button className="button button--primary" type="submit" disabled={pending}><Package size={15} /> {pending ? "Creating workspace…" : "Complete setup & assess readiness"}</button></div>}
            {step < 3 && <div className="form-actions">{step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={14} /> Back</button>}<button type="button" className="primary" onClick={() => setStep((current) => Math.min(3, current + 1))}>Continue <ArrowRight size={14} /></button></div>}
          </form>
        </Card>
      </div>
    </main>
  );
}
