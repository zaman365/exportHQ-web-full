import type { Metadata } from "next";
import { findLegalDocument, legalDocumentSlugs } from "@exporthq/domain";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { LegalShell } from "../../_components/legal-shell";

export function generateStaticParams() {
  return legalDocumentSlugs.map((slug) => ({ slug }));
}

interface LegalDocumentPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = findLegalDocument(slug);
  if (!document) return {};
  return { title: `${document.title} — Export HQ`, description: document.summary };
}

export default async function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params;
  const document = findLegalDocument(slug);
  if (!document) notFound();
  return (
    <LegalShell>
      <article className="legal-document container">
        <a className="legal-document__back" href="/legal"><ArrowLeft size={14} /> Legal &amp; trust center</a>
        <header>
          <p className="eyebrow"><i /> {document.status.toUpperCase()} · VERSION {document.version}</p>
          <h1>{document.title}</h1>
          <p>{document.summary}</p>
          <aside><ShieldAlert size={18} /><span><strong>Not yet effective</strong><small>This engineering draft is published for transparency and implementation review. It has not been approved by independent counsel or a privacy/security reviewer and is not currently offered for acceptance.</small></span></aside>
        </header>
        <div className="legal-document__body">
          {document.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}
        </div>
        <footer><span>Content SHA-256</span><code>{document.contentHashSha256}</code><small>Any content change requires a new recorded version and hash.</small></footer>
      </article>
    </LegalShell>
  );
}
