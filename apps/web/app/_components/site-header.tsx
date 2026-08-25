import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "./brand";

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "#managed", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#industries", label: "Who it's for" },
];

export function SiteHeader({ appUrl }: { appUrl: string }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="header-brand" href="#top" aria-label="Export HQ home">
          <Wordmark />
        </a>

        <nav className="header-nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a className="header-signin" href={appUrl}>
            Sign in
          </a>
          <a className="btn btn-signal btn-sm" href="#brief">
            Export readiness check <ArrowRight size={15} strokeWidth={2.2} />
          </a>
        </div>

        <details className="header-menu">
          <summary aria-label="Open navigation menu">
            <Menu
              className="icon-open"
              size={20}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <X
              className="icon-close"
              size={20}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </summary>
          <div className="menu-panel">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href={appUrl}>Sign in</a>
            <a className="btn btn-signal btn-block" href="#brief">
              Export readiness check <ArrowRight size={15} strokeWidth={2.2} />
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
