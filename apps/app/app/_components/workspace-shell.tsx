import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  Eye,
  Gem,
  House,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { demoSnapshot } from "@exporthq/domain";
import { Avatar, Logo } from "@exporthq/ui";
import {
  subscriptionCatalog,
  type WorkspaceFeature
} from "@exporthq/authorization";
import type { CustomerSession } from "@exporthq/auth";
import { workspaceProjectionKind } from "../_lib/activation";
import { WorkspaceAccountControl } from "./account-controls";
import { ProjectionNotice } from "./demo-banner";
import { MobileNavigation } from "./workspace-mobile-navigation";
import { describeWorkspaceEntitlement, type WorkspaceAccessIndicator } from "./workspace-entitlements";
import {
  workspaceFeatureForDestination,
  workspaceFeatureLabel,
  workspaceGroups,
  workspaceHref,
  type WorkspaceDestination
} from "./workspace-navigation";

/* A signed-in person must always be able to tell whether the numbers on screen
   are their own. The notice is derived from the activated capability, so it
   clears itself once tenant records back the workspace. */
function WorkspaceProjectionNotice({ session }: { session: CustomerSession }) {
  const projection = workspaceProjectionKind(session);
  if (projection === "customer-records") return null;
  return <ProjectionNotice variant={projection} />;
}

export const workspaceWebsiteUrl =
  process.env.EXPORTHQ_WEB_URL ??
  process.env.NEXT_PUBLIC_WEB_URL ??
  "https://export-hq.com";

function accessHref(feature: WorkspaceFeature, access: "full" | "preview" | "locked", href: string, publicPreview: boolean): string {
  if (access !== "locked") return workspaceHref(href, publicPreview);
  return `/plans?feature=${encodeURIComponent(feature)}`;
}

function AccessIcon({ indicator, size = 11 }: { indicator: WorkspaceAccessIndicator; size?: number }) {
  if (indicator === "shield") return <ShieldCheck size={size} />;
  if (indicator === "gem") return <Gem size={size} />;
  return <Eye size={size} />;
}

function NavigationLinks({ active, session, mobile = false }: { active: WorkspaceDestination; session: CustomerSession; mobile?: boolean }) {
  const authenticated = Boolean(session.userId);
  const publicPreview = !authenticated;
  return (
    <nav aria-label={mobile ? "Mobile navigation" : "Primary navigation"}>
      {workspaceGroups.map((group) => {
        return <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(([label, Icon, href, id, feature]) => {
            const presentation = describeWorkspaceEntitlement({
              authenticated,
              businessVerification: session.businessVerification,
              feature,
              isPlatformAdmin: session.isPlatformAdmin,
              tier: session.tier
            });
            const message = presentation.message ?? undefined;
            const tooltipId = `nav-access-${feature}${mobile ? "-mobile" : ""}`;
            return <Link
              href={accessHref(feature, presentation.routeAccess, href, publicPreview)}
              className={`${active === id ? "active " : ""}nav-access-link nav-access-link--${presentation.displayAccess}${presentation.premium ? " nav-access-link--premium" : ""}`}
              key={label}
              title={message}
              aria-describedby={message ? tooltipId : undefined}
            >
              <Icon size={17} strokeWidth={1.8} /><span className="nav-access-link__label">{label}</span>
              {presentation.indicator && <span className={`nav-access-indicator nav-access-indicator--${presentation.indicator}`} aria-label={presentation.category ?? "Feature access"}><AccessIcon indicator={presentation.indicator} /></span>}
              {message && <span className="nav-access-tooltip" id={tooltipId} role="tooltip"><strong>{presentation.category}</strong>{message}</span>}
            </Link>;
          })}
        </div>;
      })}
    </nav>
  );
}

function WorkspaceSidebar({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const publicPreview = !session.userId;
  return (
    <aside className="sidebar">
      <div className="sidebar__head"><a className="sidebar__brand-home" href={workspaceWebsiteUrl} target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><Logo /></a></div>
      <NavigationLinks active={active} session={session} />
      {publicPreview ? <div className="sidebar__team sidebar__team--guest">
        <div><Sparkles size={12} /><small>PUBLIC SAMPLE</small></div>
        <strong>Turn this into your export workspace.</strong>
        <span>Create a free account to save assessments, shortlists and your business context.</span>
        <Link href="/sign-up">Create free account <ArrowRight size={14} /></Link>
        <Link className="sidebar__guest-signin" href="/sign-in">Already a member? Sign in</Link>
      </div> : session.features.includes("managed-services") ? <div className="sidebar__team">
        <div><span className="status-dot" /><small>YOUR EXPORT HQ TEAM</small></div>
        <div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div>
        <strong>3 specialists assigned</strong>
        <span>Average response · 3h 24m</span>
        <Link href="/team?view=messages">Message your team <ArrowRight size={14} /></Link>
      </div> : session.features.includes("team") ? <div className="sidebar__team">
        <div><span className="status-dot" /><small>COMPANY COLLABORATION</small></div>
        <div className="avatar-stack"><Avatar initials="NR" /><Avatar initials="KH" tone={1} /><Avatar initials="SA" tone={2} /></div>
        <strong>Teams, roles & messages</strong>
        <span>Coordinate each department securely</span>
        <Link href="/team?view=messages">Open team workspace <ArrowRight size={14} /></Link>
      </div> : <div className="sidebar__team sidebar__team--preview">
        <div><Eye size={12} /><small>TEAM WORKSPACE PREVIEW</small></div>
        <div className="avatar-stack"><Avatar initials="NR" /><Avatar initials="KH" tone={1} /><Avatar initials="SA" tone={2} /></div>
        <strong>See roles, teams & channels</strong>
        <span>Scale unlocks private collaboration</span>
        <Link href="/team?view=messages">Preview Team <ArrowRight size={14} /></Link>
      </div>}
    </aside>
  );
}

function WorkspaceEntitlementNotice({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const feature = workspaceFeatureForDestination(active);
  if (!feature) return null;
  const authenticated = Boolean(session.userId);
  const presentation = describeWorkspaceEntitlement({
    authenticated,
    businessVerification: session.businessVerification,
    feature,
    isPlatformAdmin: session.isPlatformAdmin,
    tier: session.tier
  });
  if (!presentation.indicator) return null;
  const label = workspaceFeatureLabel(feature);
  return <section className={`workspace-access-notice workspace-access-notice--${presentation.displayAccess} workspace-access-notice--${presentation.indicator}`} aria-label={`${label} entitlement status`}>
    <span className="workspace-access-notice__icon"><AccessIcon indicator={presentation.indicator} size={17} /></span>
    <div><small>{presentation.category?.toUpperCase()}</small><strong>{presentation.fullDepth ? `Your workspace includes ${label}` : presentation.displayAccess === "locked" ? `Bring ${label} into your workspace` : `See what full ${label} can do`}</strong><p>{presentation.message}</p></div>
    {!presentation.fullDepth && <div className="workspace-access-notice__actions">
      {!authenticated && <Link href="/sign-up">Create free account <ArrowRight size={13} /></Link>}
      {presentation.premium && authenticated && (feature === "readiness" || feature === "markets" || feature === "opportunities" || feature === "export-studio") && <Link href="/verify-business">Verify business <ShieldCheck size={13} /></Link>}
      <Link href={`/plans?feature=${encodeURIComponent(feature)}`}>{authenticated ? `Add with ${presentation.requiredTierName}` : "See access options"} <ArrowRight size={13} /></Link>
    </div>}
  </section>;
}

function WorkspaceTopbar({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const publicPreview = !session.userId;
  const tierName = session.isPlatformAdmin ? "Platform admin" : subscriptionCatalog[session.tier].name;
  return (
    <header className="topbar">
      <MobileNavigation active={active} tier={session.tier} authenticated={Boolean(session.userId)} businessVerification={session.businessVerification} isPlatformAdmin={session.isPlatformAdmin} organizationName={session.organizationName ?? "Public sample"} publicPreview={publicPreview} />
      <a className="mobile-home" href={workspaceWebsiteUrl} target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><House size={18} /></a>
      <Link href={workspaceHref("/learn", publicPreview)} className="search"><Search size={17} /><span>Search ExportPanel help…</span><kbd>⌘ K</kbd></Link>
      <div className="topbar__actions">
        <Link href={workspaceHref("/learn", publicPreview)} aria-label="Help"><CircleHelp size={19} /></Link>
        {publicPreview ? <div className="topbar__guest"><span><LockKeyhole size={13} /> Public sample</span><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div> : <><Link href="/inbox" aria-label="Inbox notifications" className="notification"><Bell size={19} /><span /></Link><WorkspaceAccountControl enabled={!session.isDemo} userName={session.userName ?? "ExportPanel member"} organizationName={session.organizationName ?? "Your business"} tierName={tierName} /></>}
      </div>
    </header>
  );
}

export function WorkspaceShell({
  active,
  children,
  contentId,
  session
}: {
  active: WorkspaceDestination;
  children: ReactNode;
  contentId?: string;
  session: CustomerSession;
}) {
  return (
    <div className="app-shell">
      <WorkspaceSidebar active={active} session={session} />
      <main>
        <WorkspaceTopbar active={active} session={session} />
        <div className="content" id={contentId}><WorkspaceEntitlementNotice active={active} session={session} />{children}</div>
        <footer className="legal-footer"><span>Export HQ · {session.userId ? "Private workspace" : "Public sample · no customer data"}</span><span><ShieldCheck size={14} /> Evidence-aware compliance · Last data review 8 Aug 2026</span></footer>
      </main>
      <WorkspaceProjectionNotice session={session} />
    </div>
  );
}
