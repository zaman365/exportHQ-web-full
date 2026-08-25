import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  House,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import { demoSnapshot } from "@exporthq/domain";
import { Avatar, Logo } from "@exporthq/ui";
import { DemoBanner } from "./demo-banner";
import { MobileNavigation } from "./workspace-mobile-navigation";
import { workspaceGroups, type WorkspaceDestination } from "./workspace-navigation";

export const workspaceWebsiteUrl =
  process.env.EXPORTHQ_WEB_URL ??
  process.env.NEXT_PUBLIC_WEB_URL ??
  "https://exporthq-web.zaman-ase365.workers.dev";

function NavigationLinks({ active, mobile = false }: { active: WorkspaceDestination; mobile?: boolean }) {
  return (
    <nav aria-label={mobile ? "Mobile navigation" : "Primary navigation"}>
      {workspaceGroups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(([label, Icon, href, id]) => (
            <Link href={href} className={active === id ? "active" : ""} key={label}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function WorkspaceSidebar({ active }: { active: WorkspaceDestination }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__head"><a className="sidebar__brand-home" href={workspaceWebsiteUrl} aria-label="Go to the Export HQ homepage"><Logo /></a><span aria-hidden="true"><Menu size={18} /></span></div>
      <button className="org-switcher" type="button" aria-label="Switch organization">
        <span className="org-switcher__mark">AT</span>
        <span><strong>ABC Textiles</strong><small>Managed Export</small></span>
        <ChevronDown size={16} />
      </button>
      <a className="sidebar__website" href={workspaceWebsiteUrl}>
        <House size={15} />
        <span>Export HQ homepage</span>
        <ArrowUpRight size={14} />
      </a>
      <NavigationLinks active={active} />
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

function WorkspaceTopbar({ active }: { active: WorkspaceDestination }) {
  return (
    <header className="topbar">
      <MobileNavigation active={active} />
      <a className="mobile-home" href={workspaceWebsiteUrl} aria-label="Go to the Export HQ homepage"><House size={18} /></a>
      <Link href="/learn" className="search"><Search size={17} /><span>Search TREVV help…</span><kbd>⌘ K</kbd></Link>
      <div className="topbar__actions">
        <Link href="/learn" aria-label="Help"><CircleHelp size={19} /></Link>
        <Link href="/inbox" aria-label="Inbox notifications" className="notification"><Bell size={19} /><span /></Link>
        <Link className="user-menu" href="/settings" aria-label="Open workspace settings"><Avatar initials="NR" tone={2} /><span><strong>Nadia Rahman</strong><small>Owner · Settings</small></span><ChevronDown size={15} /></Link>
      </div>
    </header>
  );
}

export function WorkspaceShell({
  active,
  children,
  contentId
}: {
  active: WorkspaceDestination;
  children: ReactNode;
  contentId?: string;
}) {
  return (
    <div className="app-shell">
      <WorkspaceSidebar active={active} />
      <main>
        <WorkspaceTopbar active={active} />
        <div className="content" id={contentId}>{children}</div>
        <footer className="legal-footer"><span>Export HQ · Private workspace</span><span><ShieldCheck size={14} /> Evidence-aware compliance · Last data review 8 Aug 2026</span></footer>
      </main>
      <DemoBanner />
    </div>
  );
}
