"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Menu, X } from "lucide-react";
import { useRef } from "react";
import { Logo } from "@exporthq/ui";
import type { WorkspaceFeature } from "@exporthq/authorization";
import { workspaceGroups, workspaceHref, type WorkspaceDestination } from "./workspace-navigation";

export function MobileNavigation({ active, features, organizationName, publicPreview }: { active: WorkspaceDestination; features: readonly WorkspaceFeature[]; organizationName: string; publicPreview: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => detailsRef.current?.removeAttribute("open");

  return (
    <details className="mobile-navigation" ref={detailsRef}>
      <summary aria-label="Open navigation"><Menu size={19} /></summary>
      <div className="mobile-navigation__panel">
        <header><Logo /><span>{organizationName}</span><button type="button" aria-label="Close navigation" onClick={close}><X size={17} /></button></header>
        <nav aria-label="Mobile navigation">
          {workspaceGroups.map((group) => {
            const items = group.items.filter(([, , , , feature]) => features.includes(feature));
            if (!items.length) return null;
            return <div className="nav-group" key={group.label}><p>{group.label}</p>{items.map(([label, Icon, href, id]) => <Link href={workspaceHref(href, publicPreview)} className={active === id ? "active" : ""} key={label} onClick={close}><Icon size={17} strokeWidth={1.8} />{label}</Link>)}</div>;
          })}
        </nav>
        <Link href={workspaceHref("/learn", publicPreview)} className="mobile-navigation__learn" onClick={close}><BookOpenCheck size={17} /><span><strong>Need help?</strong><small>Open the ExportPanel Learning Center</small></span><ArrowRight size={15} /></Link>
      </div>
    </details>
  );
}
