"use client";

import { useActionState } from "react";
import { Printer } from "lucide-react";
import { acceptCurrentPilotAgreement, type PilotAcceptanceActionResult } from "./actions";

const initialState: PilotAcceptanceActionResult = { ok: false, message: "" };

export function PilotAgreementAcceptanceForm({
  version,
  contentHashSha256,
  confirmLabel,
  submitLabel
}: {
  readonly version: string;
  readonly contentHashSha256: string;
  readonly confirmLabel: string;
  readonly submitLabel: string;
}) {
  const [state, action, pending] = useActionState(acceptCurrentPilotAgreement, initialState);
  return <form action={action} className="alpha-acceptance-form">
    <input type="hidden" name="version" value={version} />
    <input type="hidden" name="contentHashSha256" value={contentHashSha256} />
    <label><input type="checkbox" name="confirmed" required /> {confirmLabel}</label>
    <button type="submit" disabled={pending}>{pending ? "Recording…" : submitLabel}</button>
    {state.message && <p className={state.ok ? "success" : "error"} role="status">{state.message}</p>}
  </form>;
}

export function PrintAlphaActionPack({ label }: { readonly label: string }) {
  return <button className="button button--secondary alpha-print" type="button" onClick={() => window.print()}><Printer size={15} /> {label}</button>;
}
