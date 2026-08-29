import type { Metadata } from "next";
import { legalDocuments } from "@exporthq/domain";
import { ArrowRight, FileCheck2, ShieldAlert } from "lucide-react";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Legal and trust center — Export HQ",
  description: "Export HQ legal, privacy, security and service-boundary drafts and their review status."
};

export default function LegalIndexPage() {
  return (
    <LegalShell>
      <section className="legal-hero">
        <div className="container legal-hero__inner">
          <p className="eyebrow"><i /> LEGAL &amp; TRUST CENTER</p>
          <h1>Clear boundaries before real customer data.</h1>
          <p>These documents make the intended privacy, security, acceptable-use and service contracts inspectable while independent review is still pending.</p>
          <aside><ShieldAlert size={20} /><span><strong>Engineering drafts — not effective legal terms</strong><small>Founder development authorization does not replace counsel, privacy or independent security approval. External real-data activation remains blocked.</small></span></aside>
        </div>
      </section>
      <section className="legal-index container">
        <header><span><FileCheck2 size={20} /><strong>Document register</strong></span><small>{legalDocuments.length} versioned drafts · content hashes locked in source</small></header>
        <div>{legalDocuments.map((document) => <article key={document.slug}><span>{document.status}</span><h2>{document.title}</h2><p>{document.summary}</p><small>Version {document.version}</small><a href={`/legal/${document.slug}`}>Read document <ArrowRight size={14} /></a></article>)}</div>
      </section>
    </LegalShell>
  );
}
