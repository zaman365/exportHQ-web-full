import type { ReactNode } from "react";
import { legalDocuments } from "@exporthq/domain";
import { Wordmark } from "./brand";
import { exportPanelUrl } from "../_lib/deployment-urls";

export function LegalShell({ children }: { readonly children: ReactNode }) {
  const appUrl = exportPanelUrl().toString().replace(/\/$/, "");
  return (
    <>
      <header className="site-header legal-header">
        <div className="container header-inner">
          <a className="header-brand" href="/" aria-label="Export HQ home"><Wordmark /></a>
          <nav className="legal-header__nav" aria-label="Legal and trust navigation">
            <a href="/legal">Legal &amp; trust</a>
            <a href="/legal/security">Security</a>
            <a href="/legal/service-boundaries">Service boundaries</a>
          </nav>
          <a className="btn btn-signal btn-sm legal-header__action" href={`${appUrl}/sign-in`}>Sign in</a>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer legal-site-footer">
        <div className="container footer-top">
          <div className="footer-brand"><a href="/" aria-label="Export HQ home"><Wordmark /></a><p>The managed workspace for international growth.</p></div>
          <nav aria-label="Legal policies"><strong>Legal</strong>{legalDocuments.slice(0, 5).map((document) => <a href={`/legal/${document.slug}`} key={document.slug}>{document.title}</a>)}</nav>
          <nav aria-label="Trust policies"><strong>Trust</strong>{legalDocuments.slice(5).map((document) => <a href={`/legal/${document.slug}`} key={document.slug}>{document.title}</a>)}</nav>
          <div className="footer-contact"><strong>Contact</strong><a href="mailto:hello@exporthq.com">hello@exporthq.com</a><a href="mailto:privacy@exporthq.com">privacy@exporthq.com</a><a href="mailto:security@exporthq.com">security@exporthq.com</a></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Export HQ. All rights reserved.</span><span>Draft legal and trust center · independent review pending</span></div>
      </footer>
    </>
  );
}
