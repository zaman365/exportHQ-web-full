"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Eye, Gem, Menu, ShieldCheck, X } from "lucide-react";
import { useRef } from "react";
import { Logo } from "@exporthq/ui";
import {
  type BusinessVerificationStatus,
  type SubscriptionTier
} from "@exporthq/authorization";
import { workspaceGroups, workspaceHref, type WorkspaceDestination } from "./workspace-navigation";
import { describeWorkspaceEntitlement } from "./workspace-entitlements";

export function MobileNavigation({ active, tier, authenticated, businessVerification, isPlatformAdmin, organizationName, publicPreview }: { active: WorkspaceDestination; tier: SubscriptionTier; authenticated: boolean; businessVerification: BusinessVerificationStatus; isPlatformAdmin: boolean; organizationName: string; publicPreview: boolean }) {
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
              const presentation = describeWorkspaceEntitlement({ authenticated, businessVerification, feature, isPlatformAdmin, tier });
              return <Link
                href={presentation.routeAccess === "locked" ? `/plans?feature=${encodeURIComponent(feature)}` : workspaceHref(href, publicPreview)}
                className={`${active === id ? "active " : ""}nav-access-link nav-access-link--${presentation.displayAccess}${presentation.premium ? " nav-access-link--premium" : ""}`}
                key={label}
                onClick={close}
                title={presentation.message ?? undefined}
              ><Icon size={17} strokeWidth={1.8} /><span className="nav-access-link__label">{label}</span>{presentation.indicator && <span className={`nav-access-indicator nav-access-indicator--${presentation.indicator}`} aria-label={presentation.category ?? "Feature access"}>{presentation.indicator === "shield" ? <ShieldCheck size={11} /> : presentation.indicator === "gem" ? <Gem size={11} /> : <Eye size={11} />}</span>}</Link>;
            })}</div>;
          })}
        </nav>
        <Link href={workspaceHref("/learn", publicPreview)} className="mobile-navigation__learn" onClick={close}><BookOpenCheck size={17} /><span><strong>Need help?</strong><small>Open the ExportPanel Learning Center</small></span><ArrowRight size={15} /></Link>
      </div>
    </details>
  );
}
