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
  minimumTierForFeature,
  resolveWorkspaceFeatureAccess,
  subscriptionCatalog,
  type WorkspaceFeature,
  type WorkspaceFeatureAccess
} from "@exporthq/authorization";
import type { CustomerSession } from "@exporthq/auth";
import { WorkspaceAccountControl } from "./account-controls";
import { DemoBanner } from "./demo-banner";
import { MobileNavigation } from "./workspace-mobile-navigation";
import {
  workspaceFeatureForDestination,
  workspaceFeatureLabel,
  workspaceGroups,
  workspaceHref,
  type WorkspaceDestination
} from "./workspace-navigation";

export const workspaceWebsiteUrl =
  process.env.EXPORTHQ_WEB_URL ??
  process.env.NEXT_PUBLIC_WEB_URL ??
  "https://export-hq.com";

function accessMessage(feature: WorkspaceFeature, access: WorkspaceFeatureAccess, authenticated: boolean): string {
  const tierName = subscriptionCatalog[minimumTierForFeature(feature)].name;
  if (access === "preview") {
    return authenticated
      ? `Preview sample data and explore the workflow. Upgrade to ${tierName} to save records and use actions.`
      : `Open a safe sample of this workflow. Create a free account to keep progress; ${tierName} unlocks actions.`;
  }
  return authenticated
    ? `Available with ${tierName}. Open plans to compare access and unlock this capability.`
    : `Premium capability on ${tierName}. Create an account or open plans to unlock it.`;
}

function accessHref(feature: WorkspaceFeature, access: WorkspaceFeatureAccess, href: string, publicPreview: boolean): string {
  if (access !== "locked") return workspaceHref(href, publicPreview);
  return `/plans?feature=${encodeURIComponent(feature)}`;
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
            const access = resolveWorkspaceFeatureAccess({ authenticated, feature, tier: session.tier });
            const message = access === "full" ? undefined : accessMessage(feature, access, authenticated);
            const tooltipId = `nav-access-${feature}${mobile ? "-mobile" : ""}`;
            return <Link
              href={accessHref(feature, access, href, publicPreview)}
              className={`${active === id ? "active " : ""}nav-access-link nav-access-link--${access}`}
              key={label}
              title={message}
              aria-describedby={message ? tooltipId : undefined}
            >
              <Icon size={17} strokeWidth={1.8} /><span className="nav-access-link__label">{label}</span>
              {access !== "full" && <span className="nav-access-indicator" aria-label={access === "preview" ? "Preview available" : "Premium feature"}>{access === "preview" ? <Eye size={11} /> : <Gem size={11} />}</span>}
              {message && <span className="nav-access-tooltip" id={tooltipId} role="tooltip"><strong>{access === "preview" ? "Preview available" : "Premium feature"}</strong>{message}</span>}
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
      </div> : <div className="sidebar__team">
        <div><span className="status-dot" /><small>YOUR EXPORT HQ TEAM</small></div>
        <div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div>
        <strong>3 specialists assigned</strong>
        <span>Average response · 3h 24m</span>
        <Link href="/#team">Message your team <ArrowRight size={14} /></Link>
      </div>}
    </aside>
  );
}

function WorkspaceAccessNotice({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const feature = workspaceFeatureForDestination(active);
  if (!feature) return null;
  const authenticated = Boolean(session.userId);
  const access = resolveWorkspaceFeatureAccess({ authenticated, feature, tier: session.tier });
  if (access !== "preview") return null;
  const label = workspaceFeatureLabel(feature);
  const tierName = subscriptionCatalog[minimumTierForFeature(feature)].name;
  return <section className="workspace-access-notice" aria-label={`${label} preview access`}>
    <span className="workspace-access-notice__icon"><Eye size={17} /></span>
    <div><small>INTERACTIVE PREVIEW</small><strong>Explore {label} before you unlock it</strong><p>{accessMessage(feature, access, authenticated)}</p></div>
    <div className="workspace-access-notice__actions">
      {!authenticated && <Link href="/sign-up">Create free account <ArrowRight size={13} /></Link>}
      <Link href={`/plans?feature=${encodeURIComponent(feature)}`}>{authenticated ? `Unlock with ${tierName}` : "Compare access"} <ArrowRight size={13} /></Link>
    </div>
  </section>;
}

function WorkspaceTopbar({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const publicPreview = !session.userId;
  const tierName = session.isPlatformAdmin ? "Platform admin" : subscriptionCatalog[session.tier].name;
  return (
    <header className="topbar">
      <MobileNavigation active={active} tier={session.tier} authenticated={Boolean(session.userId)} organizationName={session.organizationName ?? "Public sample"} publicPreview={publicPreview} />
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
        <div className="content" id={contentId}><WorkspaceAccessNotice active={active} session={session} />{children}</div>
        <footer className="legal-footer"><span>Export HQ · {session.userId ? "Private workspace" : "Public sample · no customer data"}</span><span><ShieldCheck size={14} /> Evidence-aware compliance · Last data review 8 Aug 2026</span></footer>
      </main>
      {session.isDemo && <DemoBanner />}
    </div>
  );
}
