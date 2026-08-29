"use client";

import { useActionState } from "react";
import { acceptEffectiveLegalDocument, type LegalAcceptanceActionResult } from "./actions";

const initialState: LegalAcceptanceActionResult = { ok: false, message: "" };

export function LegalAcceptanceForm({
  document
}: {
  readonly document: {
    readonly id: string;
    readonly version: string;
    readonly contentHashSha256: string;
  };
}) {
  const [state, action, pending] = useActionState(acceptEffectiveLegalDocument, initialState);
  return (
    <form action={action} className="legal-acceptance-form">
      <input type="hidden" name="legalDocumentId" value={document.id} />
      <input type="hidden" name="version" value={document.version} />
      <input type="hidden" name="contentHashSha256" value={document.contentHashSha256} />
      <label><input type="checkbox" name="confirmed" required /> I have read this exact version and am accepting for myself in this organization.</label>
      <button type="submit" disabled={pending}>{pending ? "Recording…" : "Accept this version"}</button>
      {state.message && <p className={state.ok ? "success" : "error"} role="status">{state.message}</p>}
    </form>
  );
}
