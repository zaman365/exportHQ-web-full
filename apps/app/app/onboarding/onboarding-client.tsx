"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CreateOrganization } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  Globe2,
  Package,
  Pencil,
  ShieldCheck
} from "lucide-react";
import { Card, Logo } from "@exporthq/ui";
import { HintButton } from "../_components/hint-button";
import { exportPanelPath } from "../_lib/export-panel-paths";
import { completeOnboarding, type OnboardingActionState } from "./actions";

const steps = ["Company", "Product", "Market", "Review"];
const initialState: OnboardingActionState = {};

type OnboardingData = {
  legalName: string;
  tradingName: string;
  originCountry: string;
  industry: string;
  website: string;
  productName: string;
  sku: string;
  category: string;
  hsCode: string;
  composition: string;
  targetMarketCode: string;
  salesChannel: string;
  fobPrice: string;
  currency: string;
  stage: string;
};

type FieldName = keyof OnboardingData;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialData: OnboardingData = {
  legalName: "",
  tradingName: "",
  originCountry: "BD",
  industry: "",
  website: "",
  productName: "",
  sku: "",
  category: "",
  hsCode: "",
  composition: "",
  targetMarketCode: "",
  salesChannel: "",
  fobPrice: "",
  currency: "",
  stage: ""
};

const stepFields: Record<0 | 1 | 2, FieldName[]> = {
  0: ["legalName", "tradingName", "originCountry", "industry", "website"],
  1: ["productName", "sku", "category", "hsCode", "composition"],
  2: ["targetMarketCode", "salesChannel", "fobPrice", "currency", "stage"]
};

const countries = [
  ["BD", "Bangladesh"],
  ["IN", "India"],
  ["DE", "Germany"],
  ["GB", "United Kingdom"],
  ["US", "United States"]
] as const;

const industries = [
  "Ready-made garments & apparel",
  "Textiles & home textiles",
  "Leather goods & footwear",
  "Jute & natural fibres",
  "Agriculture & processed food",
  "Frozen food & seafood",
  "Light engineering & manufacturing",
  "Pharmaceuticals & healthcare",
  "ICT & digital services",
  "Handicrafts & lifestyle",
  "Other export sector"
];

const productCategories = [
  "Apparel & garments",
  "Textiles & home textiles",
  "Leather goods & footwear",
  "Jute & natural fibre products",
  "Agriculture & processed food",
  "Frozen food & seafood",
  "Light engineering products",
  "Pharmaceutical products",
  "ICT & digital services",
  "Handicrafts & lifestyle products",
  "Other"
];

const targetMarkets = [
  ["DE", "Germany / EU", "EUR"],
  ["NL", "Netherlands / EU", "EUR"],
  ["GB", "United Kingdom", "GBP"],
  ["JP", "Japan", "JPY"],
  ["SA", "Saudi Arabia", "SAR"],
  ["AE", "United Arab Emirates", "AED"]
] as const;

const salesChannels = [
  ["wholesale", "Wholesale / distributor"],
  ["retail", "Direct retail"],
  ["marketplace", "Online marketplace"],
  ["services", "Direct service delivery"]
] as const;

const stages = [
  ["exploring", "Exploring export for the first time"],
  ["preparing", "Preparing for a first market"],
  ["exporting", "Already exporting"],
  ["scaling", "Scaling across markets"]
] as const;

const hsSuggestions = [
  ["6109.10", "Cotton T-shirts"],
  ["6205.20", "Men's cotton shirts"],
  ["4202.21", "Leather handbags"],
  ["4203.10", "Leather apparel"],
  ["5303.10", "Raw or retted jute"],
  ["6305.10", "Jute sacks and bags"],
  ["0306.17", "Frozen shrimp and prawns"]
] as const;

const countryLabel = (code: string) => countries.find(([value]) => value === code)?.[1] ?? code;
const marketLabel = (code: string) => targetMarkets.find(([value]) => value === code)?.[1] ?? code;
const channelLabel = (code: string) => salesChannels.find(([value]) => value === code)?.[1] ?? code;
const stageLabel = (code: string) => stages.find(([value]) => value === code)?.[1] ?? code;

function validateField(name: FieldName, rawValue: string): string | undefined {
  const value = rawValue.trim();
  switch (name) {
    case "legalName": return value.length < 2 ? "Enter the registered legal name (at least 2 characters)." : undefined;
    case "tradingName": return value.length < 2 ? "Enter the name customers know, or use the legal name." : undefined;
    case "originCountry": return value.length !== 2 ? "Select the country where the business is registered." : undefined;
    case "industry": return !value ? "Select the sector that best describes the business." : undefined;
    case "website": {
      if (!value) return undefined;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? undefined : "Use a full website address beginning with https://.";
      } catch {
        return "Use a full website address beginning with https://.";
      }
    }
    case "productName": return value.length < 2 ? "Name the product or service you want to export first." : undefined;
    case "sku": return !value ? "Add a short internal reference so this offer stays identifiable." : undefined;
    case "category": return !value ? "Select the closest product category." : undefined;
    case "hsCode": return /^\d{4}(?:\.\d{2,6})?$/.test(value) ? undefined : "Use 4 digits or a detailed code such as 6205.20.";
    case "composition": return value.length < 2 ? "Describe the material, specification, or service deliverable." : undefined;
    case "targetMarketCode": return !value ? "Choose the first market ExportPanel should assess." : undefined;
    case "salesChannel": return !value ? "Choose how the offer will reach buyers." : undefined;
    case "fobPrice": {
      const price = Number(value);
      return !value || !Number.isFinite(price) || price <= 0 ? "Enter a price greater than 0." : undefined;
    }
    case "currency": return value.length !== 3 ? "Select the currency used for this indicative price." : undefined;
    case "stage": return !value ? "Select the business's current export stage." : undefined;
  }
}

function validateStep(step: 0 | 1 | 2, data: OnboardingData): FieldErrors {
  return stepFields[step].reduce<FieldErrors>((errors, name) => {
    const error = validateField(name, data[name]);
    if (error) errors[name] = error;
    return errors;
  }, {});
}

function firstInvalidStep(errors: FieldErrors): 0 | 1 | 2 {
  if (stepFields[0].some((field) => errors[field])) return 0;
  if (stepFields[1].some((field) => errors[field])) return 1;
  return 2;
}

function FieldHelp({ id, error, hint }: { id: string; error: string | undefined; hint: string }) {
  return <small id={id} className={error ? "form-field__error" : "form-field__hint"} role={error ? "alert" : undefined}>{error ?? hint}</small>;
}

export default function OnboardingClient({ needsOrganization, authEnabled, organizationName }: { needsOrganization: boolean; authEnabled: boolean; organizationName: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(() => ({ ...initialData, legalName: organizationName, tradingName: organizationName }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  useEffect(() => {
    if (!state.fieldErrors || Object.keys(state.fieldErrors).length === 0) return;
    setErrors(state.fieldErrors);
    setStep(state.step ?? firstInvalidStep(state.fieldErrors));
  }, [state]);

  const update = (key: FieldName, value: string) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      const error = validateField(key, value);
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  };

  const blur = (key: FieldName) => {
    const error = validateField(key, data[key]);
    setErrors((current) => {
      const next = { ...current };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  };

  const focusField = (field: FieldName) => requestAnimationFrame(() => document.getElementById(`onboarding-${field}`)?.focus());

  const continueFromStep = () => {
    if (step >= 3) return;
    const nextErrors = validateStep(step as 0 | 1 | 2, data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      focusField(Object.keys(nextErrors)[0] as FieldName);
      return;
    }
    setStep(step + 1);
  };

  const navigateToStep = (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    for (let index = 0; index < Math.min(target, 3); index += 1) {
      const nextErrors = validateStep(index as 0 | 1 | 2, data);
      if (Object.keys(nextErrors).length > 0) {
        setErrors((current) => ({ ...current, ...nextErrors }));
        setStep(index);
        focusField(Object.keys(nextErrors)[0] as FieldName);
        return;
      }
    }
    setStep(target);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const allErrors = { ...validateStep(0, data), ...validateStep(1, data), ...validateStep(2, data) };
    if (Object.keys(allErrors).length === 0) return;
    event.preventDefault();
    const invalidStep = firstInvalidStep(allErrors);
    setErrors(allErrors);
    setStep(invalidStep);
    focusField(Object.keys(allErrors).find((field) => stepFields[invalidStep].includes(field as FieldName)) as FieldName);
  };

  const fieldState = (name: FieldName) => ({
    id: `onboarding-${name}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": `onboarding-${name}-help`,
    onBlur: () => blur(name)
  });

  if (needsOrganization) {
    return <main className="onboarding-page"><header className="onboarding-topbar"><Logo /><Link href="/preview"><ArrowLeft size={15} /> Back to preview</Link></header><div className="onboarding-organization"><div><p>ORGANIZATION ACCESS</p><h1>Create the private workspace boundary.</h1><span>ExportPanel separates every company by organization. Members, roles, subscriptions, records, and evidence stay inside that boundary.</span></div>{authEnabled ? <CreateOrganization afterCreateOrganizationUrl={exportPanelPath("/onboarding")} skipInvitationScreen /> : <Card><strong>Organization setup is available after production identity is connected.</strong></Card>}</div></main>;
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-topbar"><Logo /><Link href="/"><ArrowLeft size={15} /> Back to Home</Link></header>
      <div className="onboarding-layout">
        <aside className="onboarding-intro">
          <p>BUSINESS & WORKSPACE SETUP</p>
          <h1>Build a useful starting point. <HintButton topic="setup-progress" /></h1>
          <span>{organizationName ? `${organizationName} is secure. ` : ""}Complete each required field before continuing. ExportPanel uses these answers to tailor the readiness assessment.</span>
          <div className="step-list">{steps.map((label, index) => <button type="button" key={label} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => navigateToStep(index)}><span>{index < step ? <Check size={11} /> : index + 1}</span><strong>{label}</strong></button>)}</div>
        </aside>
        <Card className="onboarding-form">
          <form action={formAction} onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="demoBusinessName" value={organizationName} />
            {Object.entries(data).map(([name, value]) => <input type="hidden" name={name} value={value} key={name} />)}
            <datalist id="hs-code-suggestions">{hsSuggestions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</datalist>

            {step === 0 && <>
              <div className="form-head"><p>STEP 1 OF 4 · COMPANY</p><h2>Company profile</h2><span>Required fields are marked with <b>*</b>. These details become the verified business context used throughout ExportPanel.</span></div>
              <div className="form-grid">
                <label className="form-field"><span>Legal company name <b>*</b></span><input {...fieldState("legalName")} required minLength={2} maxLength={180} value={data.legalName} onChange={(event) => update("legalName", event.target.value)} placeholder="Name shown on registration documents" /><FieldHelp id="onboarding-legalName-help" error={errors.legalName} hint="Use the exact name from the trade licence or incorporation document." /></label>
                <label className="form-field"><span>Trading name <b>*</b></span><input {...fieldState("tradingName")} required minLength={2} maxLength={180} value={data.tradingName} onChange={(event) => update("tradingName", event.target.value)} placeholder="Customer-facing business name" /><FieldHelp id="onboarding-tradingName-help" error={errors.tradingName} hint="If there is no separate brand, repeat the legal company name." /></label>
                <label className="form-field"><span>Registered country <b>*</b></span><select {...fieldState("originCountry")} required value={data.originCountry} onChange={(event) => update("originCountry", event.target.value)}>{countries.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><FieldHelp id="onboarding-originCountry-help" error={errors.originCountry} hint="This determines the domestic registrations and licences ExportPanel checks." /></label>
                <label className="form-field"><span>Primary industry <b>*</b></span><select {...fieldState("industry")} required value={data.industry} onChange={(event) => update("industry", event.target.value)}><option value="" disabled>Select an industry</option>{industries.map((industry) => <option value={industry} key={industry}>{industry}</option>)}</select><FieldHelp id="onboarding-industry-help" error={errors.industry} hint="Choose the closest sector; product-level detail comes next." /></label>
                <label className="form-field full"><span>Website <em>Optional</em></span><input {...fieldState("website")} type="url" inputMode="url" maxLength={240} value={data.website} onChange={(event) => update("website", event.target.value)} placeholder="https://yourcompany.com" /><FieldHelp id="onboarding-website-help" error={errors.website} hint="Leave blank if no site is live. ExportPanel can recommend digital-readiness support later." /></label>
              </div>
            </>}

            {step === 1 && <>
              <div className="form-head"><p>STEP 2 OF 4 · PRODUCT</p><h2>Add the first export offer</h2><span>Start with one priority offer. Product detail determines the applicable market questions, documents, and evidence path.</span></div>
              <div className="form-grid">
                <label className="form-field"><span>Product or service name <b>*</b></span><input {...fieldState("productName")} required minLength={2} maxLength={180} value={data.productName} onChange={(event) => update("productName", event.target.value)} placeholder="e.g. Men's cotton Oxford shirt" /><FieldHelp id="onboarding-productName-help" error={errors.productName} hint="Be specific enough to distinguish this offer from the rest of your catalogue." /></label>
                <label className="form-field"><span>Internal product reference <b>*</b></span><input {...fieldState("sku")} required maxLength={64} value={data.sku} onChange={(event) => update("sku", event.target.value)} placeholder="e.g. SHIRT-COTTON-01" /><FieldHelp id="onboarding-sku-help" error={errors.sku} hint="Use an SKU, style number, service code, or another short internal reference." /></label>
                <label className="form-field"><span>Product category <b>*</b></span><select {...fieldState("category")} required value={data.category} onChange={(event) => update("category", event.target.value)}><option value="" disabled>Select a category</option>{productCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select><FieldHelp id="onboarding-category-help" error={errors.category} hint="The category narrows likely certifications, labelling, and buyer requirements." /></label>
                <label className="form-field"><span>HS code <b>*</b></span><input {...fieldState("hsCode")} required list="hs-code-suggestions" inputMode="decimal" maxLength={16} value={data.hsCode} onChange={(event) => update("hsCode", event.target.value)} placeholder="e.g. 6205.20" /><FieldHelp id="onboarding-hsCode-help" error={errors.hsCode} hint="Choose a suggestion or enter 4 digits plus an optional detailed suffix." /></label>
                <label className="form-field full"><span>Composition or delivery description <b>*</b></span><textarea {...fieldState("composition")} required minLength={2} maxLength={500} value={data.composition} onChange={(event) => update("composition", event.target.value)} placeholder="e.g. 100% cotton, 140 gsm, buyer label applied; or describe the service deliverable and delivery method." /><FieldHelp id="onboarding-composition-help" error={errors.composition} hint={`${data.composition.length}/500 characters · Include material, specification, packaging, or delivery format.`} /></label>
              </div>
            </>}

            {step === 2 && <>
              <div className="form-head"><p>STEP 3 OF 4 · MARKET</p><h2>Define the first market objective</h2><span>ExportPanel evaluates readiness for a specific offer, destination, and route—not as a universal badge.</span></div>
              <div className="form-grid">
                <label className="form-field"><span>Target market <b>*</b></span><select {...fieldState("targetMarketCode")} required value={data.targetMarketCode} onChange={(event) => { const market = targetMarkets.find(([value]) => value === event.target.value); update("targetMarketCode", event.target.value); if (market) update("currency", market[2]); }}><option value="" disabled>Select a first market</option>{targetMarkets.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><FieldHelp id="onboarding-targetMarketCode-help" error={errors.targetMarketCode} hint="Start with the destination that has the strongest buyer signal or strategic fit." /></label>
                <label className="form-field"><span>Sales channel <b>*</b></span><select {...fieldState("salesChannel")} required value={data.salesChannel} onChange={(event) => update("salesChannel", event.target.value)}><option value="" disabled>Select a route to market</option>{salesChannels.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><FieldHelp id="onboarding-salesChannel-help" error={errors.salesChannel} hint="This changes the checks for contracts, labelling, logistics, and buyer acquisition." /></label>
                <label className="form-field"><span>Indicative export price <b>*</b></span><input {...fieldState("fobPrice")} required type="number" inputMode="decimal" min="0.01" step="0.01" value={data.fobPrice} onChange={(event) => update("fobPrice", event.target.value)} placeholder="0.00" /><FieldHelp id="onboarding-fobPrice-help" error={errors.fobPrice} hint="Use the expected unit, shipment, or contract price before tax." /></label>
                <label className="form-field"><span>Price currency <b>*</b></span><select {...fieldState("currency")} required value={data.currency} onChange={(event) => update("currency", event.target.value)}><option value="" disabled>Select a currency</option>{["USD", "EUR", "GBP", "JPY", "SAR", "AED", "BDT"].map((currency) => <option value={currency} key={currency}>{currency}</option>)}</select><FieldHelp id="onboarding-currency-help" error={errors.currency} hint="A destination-based suggestion is selected automatically; change it if the quotation differs." /></label>
                <label className="form-field full"><span>Current export stage <b>*</b></span><select {...fieldState("stage")} required value={data.stage} onChange={(event) => update("stage", event.target.value)}><option value="" disabled>Select the current stage</option>{stages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><FieldHelp id="onboarding-stage-help" error={errors.stage} hint="This sets the depth and order of the first readiness actions." /></label>
              </div>
            </>}

            {step === 3 && <div className="success-panel onboarding-review">
              <span className="success-icon"><ShieldCheck size={25} /></span>
              <p>STEP 4 OF 4 · REVIEW</p>
              <h2>Confirm your ExportPanel starting point.</h2>
              <p>All mandatory fields are complete. Review the three decisions below, then create the tailored readiness assessment.</p>
              <div className="onboarding-review__grid">
                <article><header><span><Building2 size={17} /></span><button type="button" onClick={() => setStep(0)}><Pencil size={12} /> Edit</button></header><small>COMPANY</small><h3>{data.tradingName}</h3><dl><div><dt>Legal name</dt><dd>{data.legalName}</dd></div><div><dt>Sector</dt><dd>{data.industry}</dd></div><div><dt>Registered in</dt><dd>{countryLabel(data.originCountry)}</dd></div></dl></article>
                <article><header><span><Package size={17} /></span><button type="button" onClick={() => setStep(1)}><Pencil size={12} /> Edit</button></header><small>FIRST OFFER</small><h3>{data.productName}</h3><dl><div><dt>Category</dt><dd>{data.category}</dd></div><div><dt>Reference</dt><dd>{data.sku}</dd></div><div><dt>HS code</dt><dd>{data.hsCode}</dd></div></dl></article>
                <article><header><span><Globe2 size={17} /></span><button type="button" onClick={() => setStep(2)}><Pencil size={12} /> Edit</button></header><small>MARKET OBJECTIVE</small><h3>{marketLabel(data.targetMarketCode)}</h3><dl><div><dt>Channel</dt><dd>{channelLabel(data.salesChannel)}</dd></div><div><dt>Indicative price</dt><dd>{data.currency} {data.fobPrice}</dd></div><div><dt>Stage</dt><dd>{stageLabel(data.stage)}</dd></div></dl></article>
              </div>
              <div className="onboarding-review__ready"><CircleCheck size={16} /><span><strong>Ready to create</strong>Your answers will remain editable after setup.</span></div>
              {state.error && <div className="onboarding-error" role="alert">{state.error}</div>}
              <button className="button button--primary" type="submit" disabled={pending}><Package size={15} /> {pending ? "Creating workspace…" : "Complete setup & assess readiness"}</button>
            </div>}

            {step < 3 && <div className="form-actions"><button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={14} /> Back</button><span>Complete this step to continue</span><button type="button" className="primary" onClick={continueFromStep}>Continue <ArrowRight size={14} /></button></div>}
          </form>
        </Card>
      </div>
    </main>
  );
}
