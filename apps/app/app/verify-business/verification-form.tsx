"use client";

import { useActionState } from "react";
import { ArrowRight, Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { requestBusinessVerification, type VerificationActionState } from "./actions";

const initialState: VerificationActionState = {};

export function VerificationForm({ organizationName, userEmail }: { organizationName: string; userEmail: string }) {
  const [state, action, pending] = useActionState(requestBusinessVerification, initialState);
  return (
    <form action={action} className="verification-form">
      <div className="verification-form__intro">
        <span><ShieldCheck size={18} /></span>
        <div><strong>Start a controlled verification case</strong><p>Your case starts as a draft. It can become Pending only after a clean, versioned evidence file is attached from the private vault.</p></div>
      </div>
      <div className="verification-fields">
        <label><span>Legal business name</span><input name="legalName" defaultValue={organizationName} required /></label>
        <label><span>Registration number</span><input name="registrationNumber" placeholder="e.g. C-123456" required /></label>
        <label><span>Registration authority</span><input name="registrationAuthority" placeholder="e.g. RJSC Bangladesh" required /></label>
        <label><span>Country of registration</span><select name="originCountry" defaultValue="BD" required><option value="BD">Bangladesh</option><option value="IN">India</option><option value="PK">Pakistan</option><option value="GB">United Kingdom</option><option value="DE">Germany</option><option value="AE">United Arab Emirates</option><option value="ZZ">Other</option></select></label>
        <label><span>Official website</span><input name="website" type="url" placeholder="https://yourbusiness.com" required /></label>
        <label><span>Business email</span><input name="businessEmail" type="email" defaultValue={userEmail} required /></label>
        <div className="verification-field--wide"><span>Verification evidence</span><small>Arbitrary evidence links are no longer accepted. After this draft is created, the private evidence-vault step will accept a PDF, JPEG or PNG and keep it quarantined until scanning completes.</small></div>
      </div>
      <label className="verification-declaration"><input name="declaration" type="checkbox" value="accepted" required /><span><strong>I am authorized to represent this business.</strong><small>The information is accurate and may be checked against official records.</small></span></label>
      {state.error && <p className="verification-error" role="alert">{state.error}</p>}
      <button className="verification-submit" type="submit" disabled={pending}><FileCheck2 size={16} /> {pending ? "Creating…" : "Create verification draft"}<ArrowRight size={15} /></button>
      <p className="verification-privacy"><Building2 size={14} /> Verification evidence is kept private to your business and authorized reviewers.</p>
    </form>
  );
}
