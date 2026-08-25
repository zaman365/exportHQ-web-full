"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileUp, Package, ShieldCheck } from "lucide-react";
import { Card, Logo } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";

const steps = ["Company", "Product", "Market", "Evidence", "Review"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  return (
    <main className="onboarding-page">
      <header className="onboarding-topbar"><Logo /><a href="/"><ArrowLeft size={15} /> Back to command center</a></header>
      <div className="onboarding-layout">
        <aside className="onboarding-intro">
          <p>EXPORT READINESS SETUP</p>
          <h1>Build your export foundation. <HintButton topic="setup-progress" /></h1>
          <span>Tell us what you manufacture and where you want to sell. We&apos;ll turn gaps into owned, trackable actions.</span>
          <div className="step-list">{steps.map((label, index) => <button type="button" key={label} className={index === step ? "active" : ""} onClick={() => setStep(index)}><span>{index < step ? <Check size={11} /> : index + 1}</span><strong>{label}</strong></button>)}</div>
        </aside>

        <Card className="onboarding-form">
          {step === 0 && <><div className="form-head"><p>STEP 1 OF 5</p><h2>Company profile</h2><span>This becomes the verified identity used across your export workspace.</span></div><div className="form-grid"><label className="form-field"><span>Legal company name</span><input defaultValue="ABC Textiles Limited" /></label><label className="form-field"><span>Trading name</span><input defaultValue="ABC Textiles" /></label><label className="form-field"><span>Origin country</span><select defaultValue="BD"><option value="BD">Bangladesh</option><option value="DE">Germany</option><option value="IN">India</option></select></label><label className="form-field"><span>Industry</span><select defaultValue="apparel"><option value="apparel">Apparel manufacturing</option><option value="food">Food production</option><option value="engineering">Engineering</option></select></label><label className="form-field full"><span>Website</span><input type="url" placeholder="https://" /><small>Optional — used by your Export HQ team during profile review.</small></label></div></>}
          {step === 1 && <><div className="form-head"><p>STEP 2 OF 5</p><h2>Add your first product</h2><span>Product detail determines market-specific requirements and readiness.</span></div><div className="form-grid"><label className="form-field"><span>Product name</span><input defaultValue="Men's Cotton Oxford Shirt" /></label><label className="form-field"><span>Internal SKU</span><input defaultValue="ABC-MOS-014" /></label><label className="form-field"><span>Category</span><input defaultValue="Men's woven shirts" /></label><label className="form-field"><span>HS code</span><input defaultValue="6205.20" /><small>Specialist verification is recommended.</small></label><label className="form-field full"><span>Materials / composition</span><textarea defaultValue="100% combed cotton, mother-of-pearl buttons, water-based finishing" /></label></div></>}
          {step === 2 && <><div className="form-head"><p>STEP 3 OF 5</p><h2>Select a target market</h2><span>Readiness is evaluated for this product-market combination, never as a universal flag.</span></div><div className="form-grid"><label className="form-field"><span>Destination</span><select defaultValue="DE"><option value="DE">Germany</option><option value="NL">Netherlands</option><option value="FR">France</option><option value="SE">Sweden</option></select></label><label className="form-field"><span>Sales channel</span><select defaultValue="wholesale"><option value="wholesale">Wholesale / private label</option><option value="retail">Direct retail</option><option value="marketplace">Online marketplace</option></select></label><label className="form-field"><span>FOB price</span><input inputMode="decimal" defaultValue="12.80" /></label><label className="form-field"><span>Currency</span><select defaultValue="USD"><option>USD</option><option>EUR</option><option>BDT</option></select></label><label className="form-field full"><span>Target buyer type</span><input defaultValue="Mid-market private-label fashion brands" /></label></div></>}
          {step === 3 && <><div className="form-head"><p>STEP 4 OF 5</p><h2>Add supporting evidence</h2><span>Files stay private and are linked to the product, requirement, or company they support.</span></div><div className="form-grid"><label className="drop-zone"><span><FileUp size={27} /><strong>Choose evidence files</strong><span>PDF, JPEG, or PNG · up to 25 MB each</span><input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" multiple /></span></label><div className="form-field full"><small>Uploads enter quarantine and require malware scanning before specialist review.</small></div></div></>}
          {step === 4 && <div className="success-panel"><span className="success-icon"><ShieldCheck size={25} /></span><h2>Your Germany readiness structure is ready.</h2><p>Export HQ identified four immediate actions. One belongs to your team, two are assigned to Export HQ, and one is waiting for laboratory confirmation.</p><a className="button button--primary" href="/"><Package size={15} /> Open your command center</a></div>}
          {step < 4 && <div className="form-actions">{step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={14} /> Back</button>}<button type="button" className="primary" onClick={() => setStep((current) => Math.min(4, current + 1))}>{step === 3 ? "Generate readiness plan" : "Continue"} <ArrowRight size={14} /></button></div>}
        </Card>
      </div>
    </main>
  );
}
