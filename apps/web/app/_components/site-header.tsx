"use client";

import type { MouseEvent } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "./brand";

const NAV = [
  { href: "#market-signals", label: "Market signals" },
  { href: "#platform", label: "Platform" },
  { href: "#managed", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#industries", label: "Who it's for" },
];

export function SiteHeader({ appUrl }: { appUrl: string }) {
  const closeMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    const menu = event.currentTarget.closest("details");
    if (menu instanceof HTMLDetailsElement) menu.open = false;
  };
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
          <a className="header-signin" href={`${appUrl}/sign-in`}>
            Sign in
          </a>
          <a className="btn btn-signal btn-sm" href={`${appUrl}/readiness`}>
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
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <a href={`${appUrl}/sign-in`} onClick={closeMenu}>Sign in</a>
            <a className="btn btn-signal btn-block" href={`${appUrl}/readiness`} onClick={closeMenu}>
              Export readiness check <ArrowRight size={15} strokeWidth={2.2} />
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
