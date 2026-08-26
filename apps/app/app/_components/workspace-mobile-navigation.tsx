"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Eye, Gem, Menu, X } from "lucide-react";
import { useRef } from "react";
import { Logo } from "@exporthq/ui";
import {
  minimumTierForFeature,
  resolveWorkspaceFeatureAccess,
  subscriptionCatalog,
  type SubscriptionTier
} from "@exporthq/authorization";
import { workspaceGroups, workspaceHref, type WorkspaceDestination } from "./workspace-navigation";

export function MobileNavigation({ active, tier, authenticated, organizationName, publicPreview }: { active: WorkspaceDestination; tier: SubscriptionTier; authenticated: boolean; organizationName: string; publicPreview: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => detailsRef.current?.removeAttribute("open");

  return (
    <details className="mobile-navigation" ref={detailsRef}>
      <summary aria-label="Open navigation"><Menu size={19} /></summary>
      <div className="mobile-navigation__panel">
        <header><Logo /><span>{organizationName}</span><button type="button" aria-label="Close navigation" onClick={close}><X size={17} /></button></header>
        <nav aria-label="Mobile navigation">
          {workspaceGroups.map((group) => {
            return <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map(([label, Icon, href, id, feature]) => {
              const access = resolveWorkspaceFeatureAccess({ authenticated, feature, tier });
              const requiredTier = subscriptionCatalog[minimumTierForFeature(feature)].name;
              const message = access === "preview" ? `Interactive preview. ${requiredTier} unlocks actions and saved records.` : `Premium feature available with ${requiredTier}.`;
              return <Link
                href={access === "locked" ? `/plans?feature=${encodeURIComponent(feature)}` : workspaceHref(href, publicPreview)}
                className={`${active === id ? "active " : ""}nav-access-link nav-access-link--${access}`}
                key={label}
                onClick={close}
                title={access === "full" ? undefined : message}
              ><Icon size={17} strokeWidth={1.8} /><span className="nav-access-link__label">{label}</span>{access !== "full" && <span className="nav-access-indicator" aria-label={access === "preview" ? "Preview available" : "Premium feature"}>{access === "preview" ? <Eye size={11} /> : <Gem size={11} />}</span>}</Link>;
            })}</div>;
          })}
        </nav>
        <Link href={workspaceHref("/learn", publicPreview)} className="mobile-navigation__learn" onClick={close}><BookOpenCheck size={17} /><span><strong>Need help?</strong><small>Open the ExportPanel Learning Center</small></span><ArrowRight size={15} /></Link>
      </div>
    </details>
  );
}
