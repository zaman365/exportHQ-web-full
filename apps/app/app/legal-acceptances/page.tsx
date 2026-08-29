import type { Metadata } from "next";
import { listActorLegalAcceptances, listEffectiveLegalDocuments } from "@exporthq/db";
import { CheckCircle2, FileWarning, ShieldCheck } from "lucide-react";
import { WorkspaceShell, workspaceWebsiteUrl } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { LegalAcceptanceForm } from "./acceptance-form";

export const metadata: Metadata = {
  title: "Legal acceptances — Export HQ",
  description: "Review effective Export HQ legal versions and your append-only acceptance history."
};

export const dynamic = "force-dynamic";

export default async function LegalAcceptancesPage() {
  const session = await getWorkspaceFeatureSession("settings");
  const result = !session.isDemo
    ? await runTenantCommand(session, async (tx, context) => ({
      documents: await listEffectiveLegalDocuments(tx),
      acceptances: await listActorLegalAcceptances(tx, context)
    }))
    : { ran: false as const };
  const documents = result.ran ? result.value.documents : [];
  const acceptances = result.ran ? result.value.acceptances : [];
  const acceptedIds = new Set(acceptances.map((acceptance) => acceptance.legalDocumentId));
  return (
    <WorkspaceShell active="settings" session={session}>
      <section className="legal-acceptances-heading">
        <div><p>LEGAL &amp; TRUST</p><h1>Versioned acceptances</h1><span>Only an independently reviewed, published and effective document can be accepted. Draft policy pages never create an acceptance.</span></div>
        <ShieldCheck size={30} />
      </section>
      {!result.ran && <section className="legal-acceptances-empty"><FileWarning size={24} /><div><h2>Acceptance storage is unavailable</h2><p>No browser or identity metadata is used as a substitute. Nothing is recorded until tenant PostgreSQL is active.</p></div></section>}
      {result.ran && documents.length === 0 && <section className="legal-acceptances-empty"><FileWarning size={24} /><div><h2>No effective legal version is published</h2><p>The public legal center contains transparent engineering drafts, but independent legal/privacy review is still deferred. Those drafts are not offered for acceptance.</p><a href={`${workspaceWebsiteUrl}/legal`} target="_blank" rel="noreferrer">Open the draft legal &amp; trust center</a></div></section>}
      {documents.length > 0 && <div className="legal-acceptance-list">{documents.map((document) => {
        const accepted = acceptedIds.has(document.id);
        return <article key={document.id}><header><span><small>{document.slug.toUpperCase()}</small><h2>{document.title}</h2></span>{accepted && <b><CheckCircle2 size={14} /> Accepted</b>}</header><p>{document.summary}</p><dl><div><dt>Version</dt><dd>{document.version}</dd></div><div><dt>Effective</dt><dd>{document.effectiveAt.toISOString().slice(0, 10)}</dd></div><div><dt>Review reference</dt><dd>{document.reviewReference}</dd></div></dl><code>{document.contentHashSha256}</code><a href={`${workspaceWebsiteUrl}/legal/${document.slug}`} target="_blank" rel="noreferrer">Read this version</a>{!accepted && <LegalAcceptanceForm document={document} />}</article>;
      })}</div>}
      {acceptances.length > 0 && <section className="legal-acceptance-history"><h2>Your acceptance history</h2><ul>{acceptances.map((acceptance) => <li key={acceptance.id}><CheckCircle2 size={14} /><span><strong>{acceptance.acceptedVersion}</strong><small>{acceptance.acceptedAt.toISOString()}</small></span></li>)}</ul></section>}
    </WorkspaceShell>
  );
}
