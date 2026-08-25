import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  House,
  Search,
  ShieldCheck,
} from "lucide-react";
import { demoSnapshot } from "@exporthq/domain";
import { Avatar, Logo } from "@exporthq/ui";
import { subscriptionCatalog } from "@exporthq/authorization";
import type { CustomerSession } from "@exporthq/auth";
import { WorkspaceAccountControl } from "./account-controls";
import { DemoBanner } from "./demo-banner";
import { MobileNavigation } from "./workspace-mobile-navigation";
import { workspaceGroups, type WorkspaceDestination } from "./workspace-navigation";

export const workspaceWebsiteUrl =
  process.env.EXPORTHQ_WEB_URL ??
  process.env.NEXT_PUBLIC_WEB_URL ??
  "https://export-hq.com";

function NavigationLinks({ active, features, mobile = false }: { active: WorkspaceDestination; features: CustomerSession["features"]; mobile?: boolean }) {
  return (
    <nav aria-label={mobile ? "Mobile navigation" : "Primary navigation"}>
      {workspaceGroups.map((group) => {
        const items = group.items.filter(([, , , , feature]) => features.includes(feature));
        if (!items.length) return null;
        return <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {items.map(([label, Icon, href, id]) => (
            <Link href={href} className={active === id ? "active" : ""} key={label}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </div>;
      })}
    </nav>
  );
}

function WorkspaceSidebar({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__head"><a className="sidebar__brand-home" href={workspaceWebsiteUrl} target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><Logo /></a></div>
      <NavigationLinks active={active} features={session.features} />
      <div className="sidebar__team">
        <div><span className="status-dot" /><small>YOUR EXPORT HQ TEAM</small></div>
        <div className="avatar-stack">{demoSnapshot.team.map((person, index) => <Avatar key={person.name} initials={person.initials} tone={index} />)}</div>
        <strong>3 specialists assigned</strong>
        <span>Average response · 3h 24m</span>
        <a href="/#team">Message your team <ArrowRight size={14} /></a>
      </div>
    </aside>
  );
}

function WorkspaceTopbar({ active, session }: { active: WorkspaceDestination; session: CustomerSession }) {
  const tierName = subscriptionCatalog[session.tier].name;
  return (
    <header className="topbar">
      <MobileNavigation active={active} features={session.features} />
      <a className="mobile-home" href={workspaceWebsiteUrl} target="_blank" rel="noreferrer" aria-label="Open the Export HQ homepage in a new tab"><House size={18} /></a>
      <Link href="/learn" className="search"><Search size={17} /><span>Search TREVV help…</span><kbd>⌘ K</kbd></Link>
      <div className="topbar__actions">
        <Link href="/learn" aria-label="Help"><CircleHelp size={19} /></Link>
        <Link href="/inbox" aria-label="Inbox notifications" className="notification"><Bell size={19} /><span /></Link>
        <WorkspaceAccountControl enabled={!session.isDemo} userName={session.userName ?? "TREVV member"} organizationName={session.organizationName ?? "Your business"} tierName={tierName} />
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
        <div className="content" id={contentId}>{children}</div>
        <footer className="legal-footer"><span>Export HQ · Private workspace</span><span><ShieldCheck size={14} /> Evidence-aware compliance · Last data review 8 Aug 2026</span></footer>
      </main>
      <DemoBanner />
    </div>
  );
}
